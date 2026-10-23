import crypto from 'crypto';
import { ObjectId } from 'mongodb';
import { getCollection, getGlobalCollection } from '../db';
import { currentPathshalaId, runWithPathshala } from '../tenant';
import { tg, esc, telegramEnabled, botUsername, requestText, parseCallback, COLLECTION } from '../telegram';
import * as admin from './adminController';

const LINK_TTL_MS = 15 * 60 * 1000;

// ---------- Admin dashboard ----------

// GET /admin/telegram
export const getTelegramSettings = async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  const pathshalas = await getGlobalCollection('pathshalas');
  const p = await pathshalas.findOne({ _id: new ObjectId(currentPathshalaId()) }, { projection: { telegramChats: 1 } });
  res.json({
    enabled: telegramEnabled() && !!botUsername(),
    botUsername: botUsername() || null,
    chats: (p?.telegramChats || []).map((c) => ({ chatId: String(c.chatId), title: c.title, type: c.type, linkedAt: c.linkedAt })),
  });
};

// POST /admin/telegram/link -> one-time links that connect a chat (personal or group) to this pathshala
export const createTelegramLink = async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  if (!telegramEnabled() || !botUsername()) return res.status(400).json({ error: 'Telegram is not set up yet' });

  const code = crypto.randomBytes(12).toString('hex');
  const links = await getGlobalCollection('telegram_links');
  await links.insertOne({
    code,
    pathshalaId: currentPathshalaId(),
    createdBy: req.user.username,
    expiresAt: new Date(Date.now() + LINK_TTL_MS),
  });
  res.json({
    url: `https://t.me/${botUsername()}?start=${code}`,
    groupUrl: `https://t.me/${botUsername()}?startgroup=${code}`,
    expiresInMinutes: LINK_TTL_MS / 60000,
  });
};

// DELETE /admin/telegram/chats/:chatId
export const removeTelegramChat = async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  const pathshalas = await getGlobalCollection('pathshalas');
  const chatId = String(req.params.chatId);
  await pathshalas.updateOne(
    { _id: new ObjectId(currentPathshalaId()) },
    { $pull: { telegramChats: { chatId: { $in: [chatId, Number(chatId)] } } } }
  );
  await tg('sendMessage', { chat_id: chatId, text: 'This chat will no longer receive pathshala approval requests.' });
  res.json({ message: 'Disconnected' });
};

// ---------- Webhook (called by Telegram) ----------

// Run an admin controller (approve/reject) outside an HTTP request
async function runAdminAction(handler, id, actor) {
  let status = 200;
  let body = null;
  const res = {
    status(code) { status = code; return res; },
    json(data) { body = data; return res; },
  };
  await handler({ user: { role: 'admin', username: actor }, params: { id }, body: {}, query: {}, headers: {} }, res);
  return { status, body };
}

async function handleStart(msg, code) {
  const chatId = msg.chat.id;
  if (!code) {
    await tg('sendMessage', {
      chat_id: chatId,
      text: 'To get approval requests here, open the pathshala admin dashboard → Telegram notifications → Connect.',
    });
    return;
  }

  const links = await getGlobalCollection('telegram_links');
  const link = await links.findOneAndDelete({ code, expiresAt: { $gt: new Date() } });
  const record = link?.value !== undefined ? link.value : link; // driver v5/v6 shapes
  if (!record) {
    await tg('sendMessage', { chat_id: chatId, text: 'This link has expired. Please press Connect again in the admin dashboard.' });
    return;
  }

  const pathshalas = await getGlobalCollection('pathshalas');
  const _id = new ObjectId(record.pathshalaId);
  const title = msg.chat.title || [msg.chat.first_name, msg.chat.last_name].filter(Boolean).join(' ') || msg.chat.username || 'Chat';
  await pathshalas.updateOne({ _id }, { $pull: { telegramChats: { chatId } } });
  await pathshalas.updateOne({ _id }, {
    $push: { telegramChats: { chatId, title, type: msg.chat.type, linkedAt: new Date().toISOString(), linkedBy: record.createdBy } },
  });
  const p = await pathshalas.findOne({ _id }, { projection: { name: 1 } });
  await tg('sendMessage', {
    chat_id: chatId,
    parse_mode: 'HTML',
    text: `✅ Connected to <b>${esc(p?.name || 'your pathshala')}</b>.\nNew attendance and gatha requests will appear here with Approve / Reject buttons.\n\nSend /stop to turn this off.`,
  });
}

async function handleStop(msg) {
  const pathshalas = await getGlobalCollection('pathshalas');
  await pathshalas.updateMany({ 'telegramChats.chatId': msg.chat.id }, { $pull: { telegramChats: { chatId: msg.chat.id } } });
  await tg('sendMessage', { chat_id: msg.chat.id, text: 'Stopped. This chat will no longer receive approval requests.' });
}

async function handleCallback(cb) {
  const answer = (text) => tg('answerCallbackQuery', { callback_query_id: cb.id, text, show_alert: false });
  const parsed = parseCallback(cb.data);
  const chatId = cb.message?.chat?.id;
  if (!parsed || chatId === undefined) return answer('Unknown action');

  // Only chats linked to this pathshala may approve its requests
  const pathshalas = await getGlobalCollection('pathshalas');
  const p = await pathshalas.findOne({ _id: new ObjectId(parsed.pathshalaId), 'telegramChats.chatId': chatId });
  if (!p || p.isActive === false) return answer('This chat is not connected to that pathshala');

  const actor = `telegram:${cb.from?.username || cb.from?.first_name || cb.from?.id}`;
  const who = cb.from?.first_name || cb.from?.username || 'admin';

  await runWithPathshala(parsed.pathshalaId, async () => {
    const col = await getCollection(COLLECTION[parsed.kindCode]);
    const doc = await col.findOne({ _id: new ObjectId(parsed.id) });
    if (!doc) return answer('This request no longer exists');

    if (doc.status !== 'pending') {
      // Already decided (maybe from the dashboard): just update the message
      await tg('editMessageText', {
        chat_id: chatId, message_id: cb.message.message_id, parse_mode: 'HTML',
        text: `${requestText(parsed.kindCode, doc, p.name)}\n\n${doc.status === 'approved' ? '✅ Already approved' : '❌ Already rejected'}${doc.reviewed_by ? ` by ${esc(doc.reviewed_by)}` : ''}`,
      });
      return answer(`Already ${doc.status}`);
    }

    const handler = parsed.kindCode === 'a'
      ? (parsed.approve ? admin.approveAttendance : admin.rejectAttendance)
      : (parsed.approve ? admin.approveGatha : admin.rejectGatha);
    const result = await runAdminAction(handler, parsed.id, actor);
    if (result.status !== 200) return answer('Could not update. Please use the dashboard.');

    await tg('editMessageText', {
      chat_id: chatId, message_id: cb.message.message_id, parse_mode: 'HTML',
      text: `${requestText(parsed.kindCode, doc, p.name)}\n\n${parsed.approve ? '✅ Approved' : '❌ Rejected'} by ${esc(who)}`,
    });
    return answer(parsed.approve ? 'Approved ✅' : 'Rejected');
  });
}

// POST /api/telegram/webhook (Telegram -> us). Verified with the secret token set in setWebhook.
export async function handleTelegramUpdate(update) {
  if (update.callback_query) return handleCallback(update.callback_query);

  const msg = update.message;
  const text = msg?.text?.trim();
  if (!msg || !text) return;
  const [command, arg] = text.split(/\s+/);
  const cmd = command.split('@')[0].toLowerCase();
  if (cmd === '/start') return handleStart(msg, arg);
  if (cmd === '/stop') return handleStop(msg);
}
