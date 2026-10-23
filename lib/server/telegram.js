import { ObjectId } from 'mongodb';
import { getCollection, getGlobalCollection } from './db';
import { currentPathshalaId } from './tenant';

// Telegram notifications for approval requests.
// One bot for the whole app (TELEGRAM_BOT_TOKEN); each pathshala links its own chats
// (stored on the pathshala as `telegramChats`) from the admin dashboard.

const API_BASE = () => process.env.TELEGRAM_API_BASE || 'https://api.telegram.org';
export const telegramEnabled = () => !!process.env.TELEGRAM_BOT_TOKEN;
export const botUsername = () => (process.env.TELEGRAM_BOT_USERNAME || '').replace(/^@/, '');

export const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Call a Bot API method. Never throws; gives up after a few seconds so a slow Telegram
// can't hold up a student's submission.
export async function tg(method, payload) {
  if (!telegramEnabled()) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);
  try {
    const res = await fetch(`${API_BASE()}/bot${process.env.TELEGRAM_BOT_TOKEN}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    return await res.json().catch(() => null);
  } catch (error) {
    console.warn(`Telegram ${method} failed:`, error.message);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

const KIND = { attendance: 'a', gatha: 'g' };
const COLLECTION = { a: 'pending_attendance', g: 'pending_gatha' };

function formatDay(date) {
  const d = new Date(`${date}T00:00:00`);
  return Number.isNaN(d.getTime()) ? date : d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}

// Text for a pending request (also used when editing the message after a decision)
export function requestText(kindCode, doc, pathshalaName) {
  const who = esc(doc.student_name || doc.username);
  const by = doc.marked_by || doc.added_by;
  const lines = [`🕒 <b>New approval request</b> · ${esc(pathshalaName)}`, '', `👤 <b>${who}</b>`];
  if (kindCode === 'a') {
    lines.push(`📅 Attendance · ${esc(formatDay(doc.date))}`);
  } else {
    const isOther = doc.type !== 'new' && doc.type !== 'revision';
    const label = doc.type === 'new' ? 'New gatha' : doc.type === 'revision' ? 'Revision' : (doc.activityTypeName || 'Activity');
    lines.push(`📖 ${esc(label)} · ${esc(formatDay(doc.date))}`);
    if (!isOther) {
      lines.push(`${esc(doc.sutra_name)}${doc.which_gatha ? ` · gatha ${esc(doc.which_gatha)}` : ''} · ${esc(doc.total_gatha)} total`);
    } else if (doc.customActivityDescription) {
      lines.push(`“${esc(doc.customActivityDescription)}”`);
    }
  }
  if (by && by !== doc.username) lines.push(`<i>submitted by family member ${esc(by)}</i>`);
  return lines.join('\n');
}

function keyboard(pathshalaId, kindCode, id) {
  const rows = [[
    { text: '✅ Approve', callback_data: `${kindCode}:${pathshalaId}:${id}:y` },
    { text: '❌ Reject', callback_data: `${kindCode}:${pathshalaId}:${id}:n` },
  ]];
  if (process.env.APP_URL) rows.push([{ text: 'Open dashboard', url: process.env.APP_URL }]);
  return { inline_keyboard: rows };
}

// Called right after a student's submission is saved (inside the pathshala's request)
export async function notifyNewPending(kind, insertedId) {
  try {
    if (!telegramEnabled() || !insertedId) return;
    const pathshalaId = currentPathshalaId();
    const pathshalas = await getGlobalCollection('pathshalas');
    const p = await pathshalas.findOne({ _id: new ObjectId(pathshalaId) }, { projection: { name: 1, telegramChats: 1 } });
    const chats = p?.telegramChats || [];
    if (chats.length === 0) return;

    const kindCode = KIND[kind];
    const doc = await (await getCollection(COLLECTION[kindCode])).findOne({ _id: insertedId });
    if (!doc) return;

    const text = requestText(kindCode, doc, p.name);
    await Promise.all(chats.map((c) => tg('sendMessage', {
      chat_id: c.chatId,
      text,
      parse_mode: 'HTML',
      reply_markup: keyboard(pathshalaId, kindCode, String(insertedId)),
    })));
  } catch (error) {
    console.warn('Telegram notify failed:', error.message);
  }
}

export const parseCallback = (data) => {
  const m = /^([ag]):([a-f0-9]{24}):([a-f0-9]{24}):([yn])$/.exec(String(data || ''));
  return m ? { kindCode: m[1], pathshalaId: m[2], id: m[3], approve: m[4] === 'y' } : null;
};
export { COLLECTION };
