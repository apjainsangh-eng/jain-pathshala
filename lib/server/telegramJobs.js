import { getCollection, getGlobalCollection } from './db';
import { runWithPathshala } from './tenant';
import { ACTIVE_STUDENTS, todayIST } from './helpers';
import { esc, sendToChats, pendingCounts, approveAllRow, dashboardRow } from './telegram';

// The midnight messages. Vercel Cron (vercel.json) calls /api/cron/telegram once a night, some time
// between 12:30 and 1:30 AM IST; each pathshala gets the day that just ended, and after Saturday also
// the Sunday-to-Saturday weekly report. Per-day/per-week markers stop a repeat call sending twice.

export const DEFAULT_SETTINGS = {
  summaryEnabled: true,
  weeklyEnabled: true,
  absentEnabled: true,
  absentDays: 7,
};

export const getSettings = (p) => {
  const { summaryEnabled, weeklyEnabled, absentEnabled, absentDays } = { ...DEFAULT_SETTINGS, ...(p?.telegramSettings || {}) };
  return { summaryEnabled, weeklyEnabled, absentEnabled, absentDays };
};

// IST calendar date (YYYY-MM-DD), `offsetDays` days from today
export const istDate = (offsetDays = 0) =>
  new Date(Date.now() + offsetDays * 86400000).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

// Plain calendar maths on YYYY-MM-DD strings
export const addDays = (date, n) => new Date(Date.parse(`${date}T00:00:00Z`) + n * 86400000).toISOString().slice(0, 10);
const weekday = (date) => new Date(`${date}T00:00:00Z`).getUTCDay(); // 0 = Sunday, 6 = Saturday

// Saturday that ends the last complete Sunday-to-Saturday week
export const lastWeekEnd = () => {
  const today = istDate(0);
  const d = weekday(today);
  return addDays(today, -(d === 6 ? 7 : d + 1));
};

const dayLabel = (date) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString('en-IN', { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'short' });
const shortDay = (date) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString('en-IN', { timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'short' });

const daysBetween = (from, to) => Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400000);

// ---- Numbers for one day (run inside a pathshala context) ----
export async function dayStats(date) {
  const [attendance, gatha, users] = await Promise.all([getCollection('attendance'), getCollection('gatha'), getCollection('users')]);
  const [students, presentNames, gathaAgg, pending] = await Promise.all([
    users.find(ACTIVE_STUDENTS, { projection: { username: 1 } }).toArray(),
    attendance.distinct('username', { date }),
    gatha.aggregate([
      { $match: { date, type: 'new' } },
      { $group: { _id: null, total: { $sum: { $convert: { input: '$total_gatha', to: 'int', onError: 0, onNull: 0 } } } } },
    ]).toArray(),
    pendingCounts(),
  ]);
  const active = new Set(students.map((s) => s.username));
  const present = presentNames.filter((u) => active.has(u)).length;
  return { total: active.size, present, absent: Math.max(0, active.size - present), newGathas: gathaAgg[0]?.total || 0, pending };
}

// ---- Students not seen for `days`+ days, with a number to call ----
export async function absentList(days) {
  const [users, attendance, groups] = await Promise.all([getCollection('users'), getCollection('attendance'), getCollection('family_groups')]);
  const [students, last, groupDocs] = await Promise.all([
    users.find(ACTIVE_STUDENTS).toArray(),
    attendance.aggregate([{ $group: { _id: '$username', last: { $max: '$date' } } }]).toArray(),
    groups.find({}).toArray(),
  ]);
  const lastBy = Object.fromEntries(last.map((r) => [r._id, r.last]));
  const byUsername = Object.fromEntries(students.map((s) => [s.username, s]));
  const groupOf = {};
  groupDocs.forEach((g) => (g.members || []).forEach((m) => { groupOf[m] = g; }));
  const contact = (s) => {
    if (s.mobile) return s.mobile;
    const mate = (groupOf[s.username]?.members || []).map((m) => byUsername[m]).find((m) => m?.mobile);
    return mate?.mobile || s.profile?.whatsappNumber || '';
  };

  const today = todayIST();
  return students
    .filter((s) => lastBy[s.username])
    .map((s) => ({ name: s.name || s.username, days: daysBetween(lastBy[s.username], today), last: lastBy[s.username], mobile: contact(s) }))
    .filter((x) => x.days >= days)
    .sort((a, b) => b.days - a.days);
}

export function absentText(list, days, limit = 20) {
  if (list.length === 0) return `🎉 Everyone has attended in the last ${days} days.`;
  const lines = list.slice(0, limit).map((x) => `• ${esc(x.name)} — ${x.days} days${x.mobile ? ` · <code>${esc(x.mobile)}</code>` : ''}`);
  const more = list.length > limit ? `\n…and ${list.length - limit} more` : '';
  return `📞 <b>Not seen for ${days}+ days</b> (${list.length})\n${lines.join('\n')}${more}`;
}

export function summaryText(p, date, stats, absent, settings) {
  const lines = [
    `📊 <b>${esc(p.name)}</b> · ${esc(dayLabel(date))}`,
    '',
    `✅ Present: <b>${stats.present}</b> of ${stats.total}`,
    `❌ Absent: <b>${stats.absent}</b>`,
    `📖 New gathas: <b>${stats.newGathas}</b>`,
    `🕒 Pending approvals: <b>${stats.pending.total}</b>`,
  ];
  if (settings.absentEnabled && absent?.length) lines.push('', absentText(absent, settings.absentDays, 10));
  return lines.join('\n');
}

function markupFor(pathshalaId, pendingTotal) {
  const rows = [...(pendingTotal > 0 ? approveAllRow(pathshalaId, pendingTotal) : []), ...dashboardRow()];
  return rows.length ? { inline_keyboard: rows } : undefined;
}

// Build and send one day's summary (yesterday by default; the "send a test" button passes today)
export async function sendSummary(p, { date, force = false } = {}) {
  const settings = getSettings(p);
  const day = date || istDate(-1);
  const stats = await dayStats(day);
  // No attendance and nothing waiting = no pathshala that day (e.g. Sunday); stay quiet
  if (!force && stats.present === 0 && stats.pending.total === 0) return false;
  const absent = settings.absentEnabled ? await absentList(settings.absentDays) : [];
  await sendToChats(p, summaryText(p, day, stats, absent, settings), markupFor(String(p._id), stats.pending.total));
  return true;
}

// ---- Birthdays in the next `days` days (from the date of birth on each student's profile) ----
export async function upcomingBirthdays(days) {
  const users = await getCollection('users');
  const students = await users.find(ACTIVE_STUDENTS, { projection: { username: 1, name: 1, 'profile.dateOfBirth': 1 } }).toArray();
  const today = istDate(0);
  const thisYear = Number(today.slice(0, 4));
  const isLeap = (y) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;

  const list = [];
  let missing = 0;
  for (const s of students) {
    const dob = s.profile?.dateOfBirth;
    if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(dob || '')) { missing += 1; continue; }
    const [by, bm, bd] = dob.split('-').map(Number);
    // Next birthday on or after today (29 Feb is celebrated on 28 Feb in other years)
    const on = (y) => `${y}-${String(bm).padStart(2, '0')}-${String(bm === 2 && bd === 29 && !isLeap(y) ? 28 : bd).padStart(2, '0')}`;
    const year = on(thisYear) >= today ? thisYear : thisYear + 1;
    const date = on(year);
    const away = daysBetween(today, date);
    if (away <= days) list.push({ name: s.name || s.username, date, away, turns: year - by });
  }
  list.sort((a, b) => a.away - b.away || a.name.localeCompare(b.name));
  return { list, missing };
}

export function birthdayText({ list, missing }, days) {
  const when = (x) => (x.away === 0 ? 'today' : x.away === 1 ? 'tomorrow' : `in ${x.away} days`);
  const lines = [`🎂 <b>Birthdays</b> · next ${days} days`, ''];
  if (list.length === 0) lines.push(`No birthdays in the next ${days} days.`);
  list.filter((x) => x.away === 0).forEach((x) => lines.push(`🎉 <b>Today: ${esc(x.name)}</b> (turns ${x.turns})`));
  list.filter((x) => x.away > 0).forEach((x) => lines.push(`• ${esc(shortDay(x.date))} — ${esc(x.name)} (turns ${x.turns}) · ${when(x)}`));
  if (missing > 0) lines.push('', `ℹ️ ${missing} student${missing > 1 ? 's have' : ' has'} not added a date of birth yet.`);
  return lines.join('\n');
}

// ---- Weekly report: Sunday `start` to Saturday `end` ----
export async function weekStats(start, end) {
  const [attendance, gatha, users] = await Promise.all([getCollection('attendance'), getCollection('gatha'), getCollection('users')]);
  const [students, att, prevAtt, gathas, pending] = await Promise.all([
    users.find(ACTIVE_STUDENTS, { projection: { username: 1, name: 1 } }).toArray(),
    attendance.find({ date: { $gte: start, $lte: end } }, { projection: { username: 1, date: 1 } }).toArray(),
    attendance.find({ date: { $gte: addDays(start, -7), $lte: addDays(start, -1) } }, { projection: { username: 1, date: 1 } }).toArray(),
    gatha.find({ date: { $gte: start, $lte: end }, type: { $in: ['new', 'revision'] } }, { projection: { username: 1, type: 1, total_gatha: 1 } }).toArray(),
    pendingCounts(),
  ]);
  const nameOf = Object.fromEntries(students.map((s) => [s.username, s.name || s.username]));

  // Active students present on each date (one mark per student per day)
  const presentByDay = (rows) => {
    const byDay = {};
    rows.forEach((r) => { if (nameOf[r.username]) (byDay[r.date] ||= new Set()).add(r.username); });
    return byDay;
  };
  const byDay = presentByDay(att);
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i)).map((date) => ({ date, present: byDay[date]?.size || 0 }));
  const pathshalaDays = days.filter((d) => d.present > 0).length;
  const marks = days.reduce((n, d) => n + d.present, 0);
  const prevMarks = Object.values(presentByDay(prevAtt)).reduce((n, set) => n + set.size, 0);

  const daysPresent = {};
  Object.values(byDay).forEach((set) => set.forEach((u) => { daysPresent[u] = (daysPresent[u] || 0) + 1; }));
  const everyDay = pathshalaDays ? students.filter((s) => daysPresent[s.username] === pathshalaDays).map((s) => nameOf[s.username]) : [];
  const missedWeek = pathshalaDays ? students.filter((s) => !daysPresent[s.username]).map((s) => nameOf[s.username]) : [];

  let newGathas = 0;
  let revised = 0;
  const newBy = {};
  gathas.forEach((g) => {
    const n = Number.parseInt(g.total_gatha, 10) || 0;
    if (g.type === 'new') {
      newGathas += n;
      newBy[g.username] = (newBy[g.username] || 0) + n;
    } else revised += n;
  });
  const topGatha = Object.entries(newBy).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]).slice(0, 3)
    .map(([u, n]) => ({ name: nameOf[u] || u, n }));

  return { start, end, total: students.length, days, pathshalaDays, marks, prevMarks, everyDay, missedWeek, newGathas, revised, topGatha, pending };
}

const nameList = (names, limit = 20) =>
  names.slice(0, limit).map(esc).join(', ') + (names.length > limit ? ` …and ${names.length - limit} more` : '');

export function weeklyText(p, w) {
  const avg = w.pathshalaDays ? Math.round(w.marks / w.pathshalaDays) : 0;
  const pct = w.total ? Math.round((avg / w.total) * 100) : 0;
  const diff = w.marks - w.prevMarks;
  const lines = [
    `📅 <b>Weekly report</b> · ${esc(p.name)}`,
    `${esc(shortDay(w.start))} – ${esc(shortDay(w.end))}`,
    '',
    `🏫 Pathshala days: <b>${w.pathshalaDays}</b>`,
    `✅ Attendance: <b>${w.marks}</b>${w.pathshalaDays ? ` · about ${avg} of ${w.total} a day (${pct}%)` : ''}`,
  ];
  if (w.prevMarks > 0) lines.push(diff > 0 ? `   ▲ ${diff} more than last week` : diff < 0 ? `   ▼ ${-diff} fewer than last week` : '   Same as last week');
  lines.push(`📖 New gathas: <b>${w.newGathas}</b> · 🔁 Revised: <b>${w.revised}</b>`, `🕒 Pending approvals: <b>${w.pending.total}</b>`);

  lines.push('', '<b>Day by day</b>', ...w.days.map((d) => `${esc(shortDay(d.date))} — ${d.present ? `${d.present} present` : 'no pathshala'}`));
  if (w.everyDay.length) lines.push('', `🌟 <b>Came every day</b> (${w.everyDay.length}): ${nameList(w.everyDay)}`);
  if (w.topGatha.length) lines.push('', `🏆 <b>Most new gathas:</b> ${w.topGatha.map((x) => `${esc(x.name)} ${x.n}`).join(' · ')}`);
  if (w.missedWeek.length) lines.push('', `😟 <b>Did not come this week</b> (${w.missedWeek.length}): ${nameList(w.missedWeek)}`);
  return lines.join('\n');
}

// The week ending on Saturday `end` (default: the last complete week)
export async function sendWeekly(p, { end, force = false } = {}) {
  const weekEnd = end || lastWeekEnd();
  const w = await weekStats(addDays(weekEnd, -6), weekEnd);
  if (!force && w.pathshalaDays === 0 && w.pending.total === 0) return false;
  await sendToChats(p, weeklyText(p, w), markupFor(String(p._id), w.pending.total));
  return true;
}

// For every pathshala with this message switched on: claim `key` under `field` (so two overlapping
// calls can't both send it), then send.
async function forEachPathshala(setting, field, key, send) {
  const pathshalas = await getGlobalCollection('pathshalas');
  const list = await pathshalas.find({ isActive: { $ne: false }, 'telegramChats.0': { $exists: true } }).toArray();
  let sent = 0;
  for (const p of list) {
    if (!getSettings(p)[setting]) continue;
    try {
      const claimed = (await pathshalas.updateOne(
        { _id: p._id, [`telegramState.${field}`]: { $ne: key } },
        { $set: { [`telegramState.${field}`]: key } }
      )).modifiedCount === 1;
      if (claimed && await runWithPathshala(String(p._id), () => send(p))) sent += 1;
    } catch (error) {
      console.warn(`Telegram ${field} failed for ${p.name}:`, error.message);
    }
  }
  return { checked: list.length, sent };
}

// Vercel Cron, every night after midnight: the day that just ended
export async function runDailySummaries() {
  const day = istDate(-1);
  return { day, ...(await forEachPathshala('summaryEnabled', 'lastSummary', day, (p) => sendSummary(p, { date: day }))) };
}

// Vercel Cron, Sunday around noon: the Sunday-to-Saturday week that just ended
export async function runWeeklyReports() {
  const end = lastWeekEnd();
  return { weekEnding: end, ...(await forEachPathshala('weeklyEnabled', 'lastWeekly', end, (p) => sendWeekly(p, { end }))) };
}
