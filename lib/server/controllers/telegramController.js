import crypto from 'crypto';
import { ObjectId } from 'mongodb';
import { getCollection, getGlobalCollection } from '../db';
import { currentPathshalaId, runWithPathshala } from '../tenant';
import {
  tg, esc, telegramEnabled, botUsername, requestText, parseCallback, COLLECTION,
  pendingCounts, approveAllRow, dashboardRow,
} from '../telegram';
import {
  getSettings, sendSummary, sendWeekly, dayStats, absentList, absentText, istDate,
  upcomingBirthdays, birthdayText,
} from '../telegramJobs';
import { parseMarkInput, matchStudents } from '../telegramAttendance';
import * as admin from './adminController';
import { bulkAttendance } from './bulkController';

const LINK_TTL_MS = 15 * 60 * 1000;
const MARK_TTL_MS = 30 * 60 * 1000;

// ---------- Admin dashboard ----------

const loadPathshala = async () => {
  const pathshalas = await getGlobalCollection('pathshalas');
  return pathshalas.findOne({ _id: new ObjectId(currentPathshalaId()) });
};

// GET /admin/telegram
export const getTelegramSettings = async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  const p = await loadPathshala();
  res.json({
    enabled: telegramEnabled() && !!botUsername(),
    botUsername: botUsername() || null,
    chats: (p?.telegramChats || []).map((c) => ({ chatId: String(c.chatId), title: c.title, type: c.type, linkedAt: c.linkedAt })),
    settings: getSettings(p),
  });
};

// PUT /admin/telegram/settings
export const updateTelegramSettings = async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  const b = req.body || {};
  const next = {};
  for (const key of ['summaryEnabled', 'weeklyEnabled', 'absentEnabled']) {
    if (typeof b[key] === 'boolean') next[key] = b[key];
  }
  if (b.absentDays !== undefined) {
    const d = Number(b.absentDays);
    if (!Number.isInteger(d) || d < 2 || d > 60) return res.status(400).json({ error: 'Choose between 2 and 60 days' });
    next.absentDays = d;
  }
  const pathshalas = await getGlobalCollection('pathshalas');
  const set = Object.fromEntries(Object.entries(next).map(([k, v]) => [`telegramSettings.${k}`, v]));
  if (Object.keys(set).length) await pathshalas.updateOne({ _id: new ObjectId(currentPathshalaId()) }, { $set: set });
  res.json({ settings: getSettings(await loadPathshala()) });
};

// POST /admin/telegram/test-summary -> sends today's summary (or, with { kind: 'weekly' }, last week's report) right now
export const sendTestSummary = async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  const p = await loadPathshala();
  if (!p?.telegramChats?.length) return res.status(400).json({ error: 'Connect a Telegram chat first' });
  if (req.body?.kind === 'weekly') await sendWeekly(p, { force: true });
  else await sendSummary(p, { date: istDate(0), force: true });
  res.json({ message: 'Sent' });
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
    url: `https://telegram.me/${botUsername()}?start=${code}`,
    groupUrl: `https://telegram.me/${botUsername()}?startgroup=${code}`,
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

// Run an existing admin controller (approve, bulk attendance…) outside an HTTP request
async function runAdminAction(handler, { id, body = {}, actor }) {
  let status = 200;
  let data = null;
  const res = {
    status(code) { status = code; return res; },
    json(d) { data = d; return res; },
  };
  await handler({ user: { role: 'admin', username: actor }, params: { id }, body, query: {}, headers: {} }, res);
  return { status, body: data };
}

const actorOf = (from) => `telegram:${from?.username || from?.first_name || from?.id}`;
const whoOf = (from) => from?.first_name || from?.username || 'admin';

// The pathshala this chat is connected to (null if none)
async function pathshalaForChat(chatId) {
  const pathshalas = await getGlobalCollection('pathshalas');
  return pathshalas.findOne({ 'telegramChats.chatId': chatId, isActive: { $ne: false } });
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
    text: `✅ Connected to <b>${esc(p?.name || 'your pathshala')}</b>.\nNew attendance and gatha requests will appear here with Approve / Reject buttons.\n\nType /help to see what else I can do. Send /stop to turn this off.`,
  });
}

async function handleStop(msg) {
  const pathshalas = await getGlobalCollection('pathshalas');
  await pathshalas.updateMany({ 'telegramChats.chatId': msg.chat.id }, { $pull: { telegramChats: { chatId: msg.chat.id } } });
  await tg('sendMessage', { chat_id: msg.chat.id, text: 'Stopped. This chat will no longer receive approval requests.' });
}

const HELP = [
  '<b>What I can do</b>',
  '',
  '• New requests arrive here with ✅ Approve / ❌ Reject buttons',
  '• /pending — requests waiting, with “Approve all”',
  '• /today — today’s numbers',
  '• /week — last week’s report (Sunday to Saturday)',
  '• /birthday — birthdays in the next 30 days (or e.g. /birthday 7)',
  '• /absent — students not seen for a while (add a number, e.g. /absent 14)',
  '• /present Aditi, Ariha, Ashvi — mark students present for today',
  '   (start with <i>yesterday</i> or a date like <i>20/10</i> to mark another day)',
  '• /stop — turn notifications off in this chat',
].join('\n');

async function replyText(chatId, text, markup) {
  await tg('sendMessage', { chat_id: chatId, text, parse_mode: 'HTML', ...(markup ? { reply_markup: markup } : {}) });
}

async function handlePending(chatId, p) {
  const [pa, pg] = await Promise.all([getCollection('pending_attendance'), getCollection('pending_gatha')]);
  const [att, gatha, counts] = await Promise.all([
    pa.find({ status: 'pending' }).sort({ created_at: 1 }).limit(10).toArray(),
    pg.find({ status: 'pending' }).sort({ created_at: 1 }).limit(10).toArray(),
    pendingCounts(),
  ]);
  if (counts.total === 0) return replyText(chatId, '🎉 Nothing is waiting for approval.');

  const lines = [
    ...att.map((d) => `• ${esc(d.student_name || d.username)} — attendance (${esc(d.date)})`),
    ...gatha.map((d) => `• ${esc(d.student_name || d.username)} — ${esc(d.activityTypeName || d.type)} (${esc(d.date)})`),
  ].slice(0, 15);
  const more = counts.total > lines.length ? `\n…and ${counts.total - lines.length} more` : '';
  return replyText(
    chatId,
    `🕒 <b>${esc(p.name)}</b> — ${counts.total} waiting\n${lines.join('\n')}${more}`,
    { inline_keyboard: [...approveAllRow(String(p._id), counts.total), ...dashboardRow()] }
  );
}

async function handlePresent(msg, p, rest) {
  const chatId = msg.chat.id;
  if (!rest.trim()) {
    return replyText(chatId, 'Send the names after the command, e.g.\n<code>/present Aditi, Ariha, Ashvi</code>\n\nTo mark another day: <code>/present yesterday Aditi, Ariha</code> or <code>/present 20/10 Aditi</code>');
  }
  const parsed = parseMarkInput(rest);
  if (parsed.error === 'bad_date') return replyText(chatId, 'I could not read that date. Use like 20/10 or 20/10/2026.');
  if (parsed.error === 'future_date') return replyText(chatId, 'That date is in the future.');
  if (parsed.names.length === 0) return replyText(chatId, 'I did not find any names. Example: /present Aditi, Ariha');

  const users = await getCollection('users');
  const students = await users.find({ role: 'student' }, { projection: { username: 1, name: 1, profile: 1, isActive: 1 } }).toArray();
  const result = matchStudents(parsed.names, students);

  const day = new Date(`${parsed.date}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' });
  const lines = [`📝 <b>Attendance for ${esc(day)}</b> · ${esc(p.name)}`, ''];
  if (result.matched.length) lines.push(`✅ Will be marked present (${result.matched.length}):`, result.matched.map((m) => esc(m.name)).join(', '));
  if (result.ambiguous.length) {
    lines.push('', ...result.ambiguous.map((a) => `⚠️ “${esc(a.query)}” matches several: ${a.options.map(esc).join(', ')} — send the full name`));
  }
  if (result.notFound.length) lines.push('', `❓ Not found: ${result.notFound.map(esc).join(', ')}`);
  if (result.inactive.length) lines.push('', `💤 Inactive, skipped: ${result.inactive.map(esc).join(', ')}`);

  if (result.matched.length === 0) {
    lines.push('', 'Nobody to record. Fix the names above and send the command again.');
    return replyText(chatId, lines.join('\n'));
  }

  const marks = await getGlobalCollection('telegram_pending_marks');
  const saved = await marks.insertOne({
    pathshalaId: String(p._id),
    chatId,
    date: parsed.date,
    usernames: result.matched.map((m) => m.username),
    expiresAt: new Date(Date.now() + MARK_TTL_MS),
  });
  const id = String(saved.insertedId);
  return replyText(chatId, lines.join('\n'), {
    inline_keyboard: [[
      { text: `✅ Record ${result.matched.length} present`, callback_data: `m:${p._id}:${id}:y` },
      { text: '❌ Cancel', callback_data: `m:${p._id}:${id}:n` },
    ]],
  });
}

// /week replies only in the chat that asked
async function sendWeeklyTo(chatId, p) {
  return sendWeekly({ ...p, telegramChats: [{ chatId }] }, { force: true });
}

async function handleCommand(msg, cmd, rest) {
  const chatId = msg.chat.id;
  if (cmd === '/help') return replyText(chatId, HELP);

  const p = await pathshalaForChat(chatId);
  if (!p) {
    return replyText(chatId, 'This chat is not connected to a pathshala yet. Open the admin dashboard → Telegram notifications → Connect.');
  }

  await runWithPathshala(String(p._id), async () => {
    if (cmd === '/pending') return handlePending(chatId, p);
    if (cmd === '/today') {
      const stats = await dayStats(istDate(0));
      return replyText(chatId, [
        `📊 <b>${esc(p.name)}</b> · today`, '',
        `✅ Present: <b>${stats.present}</b> of ${stats.total}`,
        `❌ Absent: <b>${stats.absent}</b>`,
        `📖 New gathas: <b>${stats.newGathas}</b>`,
        `🕒 Pending approvals: <b>${stats.pending.total}</b>`,
      ].join('\n'));
    }
    if (cmd === '/week') return sendWeeklyTo(chatId, p);
    if (cmd === '/birthday' || cmd === '/birthdays') {
      const n = Number.parseInt(rest, 10);
      const days = Number.isInteger(n) && n >= 1 && n <= 365 ? n : 30;
      return replyText(chatId, birthdayText(await upcomingBirthdays(days), days));
    }
    if (cmd === '/absent') {
      const n = Number.parseInt(rest, 10);
      const days = Number.isInteger(n) && n >= 2 && n <= 60 ? n : getSettings(p).absentDays;
      return replyText(chatId, absentText(await absentList(days), days));
    }
    if (cmd === '/present') return handlePresent(msg, p, rest);
  });
}

async function handleCallback(cb) {
  const answer = (text) => tg('answerCallbackQuery', { callback_query_id: cb.id, text, show_alert: false });
  const parsed = parseCallback(cb.data);
  const chatId = cb.message?.chat?.id;
  if (!parsed || chatId === undefined) return answer('Unknown action');

  // Only chats linked to this pathshala may act on its requests
  const pathshalas = await getGlobalCollection('pathshalas');
  const p = await pathshalas.findOne({ _id: new ObjectId(parsed.pathshalaId), 'telegramChats.chatId': chatId });
  if (!p || p.isActive === false) return answer('This chat is not connected to that pathshala');

  const actor = actorOf(cb.from);
  const who = whoOf(cb.from);
  const messageRef = { chat_id: chatId, message_id: cb.message.message_id };

  return runWithPathshala(parsed.pathshalaId, async () => {
    // ---- Approve all waiting requests ----
    if (parsed.kind === 'all') {
      const result = await runAdminAction(admin.approveAll, { actor });
      if (result.status !== 200) return answer('Could not update. Please use the dashboard.');
      const { attendance = 0, gatha = 0 } = result.body?.approved || {};
      await tg('editMessageReplyMarkup', { ...messageRef, reply_markup: { inline_keyboard: [] } });
      await replyText(chatId, `✅ <b>${attendance + gatha}</b> request${attendance + gatha === 1 ? '' : 's'} approved by ${esc(who)} (${attendance} attendance, ${gatha} gatha).`);
      return answer(attendance + gatha ? `Approved ${attendance + gatha} ✅` : 'Nothing was waiting');
    }

    // ---- Confirm / cancel attendance typed in the chat ----
    if (parsed.kind === 'mark') {
      const marks = await getGlobalCollection('telegram_pending_marks');
      const found = await marks.findOneAndDelete({
        _id: new ObjectId(parsed.id), pathshalaId: parsed.pathshalaId, chatId, expiresAt: { $gt: new Date() },
      });
      const doc = found?.value !== undefined ? found.value : found;
      if (!doc) {
        await tg('editMessageReplyMarkup', { ...messageRef, reply_markup: { inline_keyboard: [] } });
        return answer('This list has expired. Send /present again.');
      }
      if (!parsed.confirm) {
        await tg('editMessageReplyMarkup', { ...messageRef, reply_markup: { inline_keyboard: [] } });
        await replyText(chatId, '❌ Cancelled. Nothing was recorded.');
        return answer('Cancelled');
      }
      const result = await runAdminAction(bulkAttendance, {
        actor,
        body: { date: doc.date, entries: doc.usernames.map((username) => ({ username, status: 'present', remark: 'via Telegram' })) },
      });
      await tg('editMessageReplyMarkup', { ...messageRef, reply_markup: { inline_keyboard: [] } });
      if (result.status !== 200) {
        await replyText(chatId, 'Could not record attendance. Please use the dashboard.');
        return answer('Failed');
      }
      const { added = 0, skipped = 0 } = result.body || {};
      await replyText(chatId, `✅ Attendance recorded by ${esc(who)}: <b>${added}</b> marked present${skipped ? `, ${skipped} already present` : ''}.`);
      return answer(`Recorded ${added} ✅`);
    }

    // ---- Approve / reject one request ----
    const col = await getCollection(COLLECTION[parsed.kindCode]);
    const doc = await col.findOne({ _id: new ObjectId(parsed.id) });
    if (!doc) return answer('This request no longer exists');

    if (doc.status !== 'pending') {
      await tg('editMessageText', {
        ...messageRef, parse_mode: 'HTML',
        text: `${requestText(parsed.kindCode, doc, p.name)}\n\n${doc.status === 'approved' ? '✅ Already approved' : '❌ Already rejected'}${doc.reviewed_by ? ` by ${esc(doc.reviewed_by)}` : ''}`,
      });
      return answer(`Already ${doc.status}`);
    }

    const handler = parsed.kindCode === 'a'
      ? (parsed.approve ? admin.approveAttendance : admin.rejectAttendance)
      : (parsed.approve ? admin.approveGatha : admin.rejectGatha);
    const result = await runAdminAction(handler, { id: parsed.id, actor });
    if (result.status !== 200) return answer('Could not update. Please use the dashboard.');

    await tg('editMessageText', {
      ...messageRef, parse_mode: 'HTML',
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
  if (!msg || !text || !text.startsWith('/')) return;
  const command = text.split(/\s+/)[0];
  const rest = text.slice(command.length).trim();
  const cmd = command.split('@')[0].toLowerCase();

  if (cmd === '/start') return handleStart(msg, rest.split(/\s+/)[0]);
  if (cmd === '/stop') return handleStop(msg);
  if (['/help', '/pending', '/today', '/week', '/birthday', '/birthdays', '/absent', '/present'].includes(cmd)) return handleCommand(msg, cmd, rest);
}

