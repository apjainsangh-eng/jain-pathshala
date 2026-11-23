import { ObjectId } from 'mongodb';
import { getCollection, getGlobalCollection } from './db';
import { currentPathshalaId, isAdminOf } from './tenant';
import { getFamily } from './helpers';
import { pushEnabled, sendPush } from './fcm';

// Phone notifications for the Android app.
// Each phone that allows notifications registers its Firebase token (POST /api/push/register) and it is
// kept in the global `push_tokens` collection: { _id: token, pathshalaId, role, username, adminId,
// canApprove, lang, updatedAt }. Logging out removes it (POST /api/push/unregister).
//  - admins (full access) get "new request" when a student submits attendance or gatha
//  - students and their family get "approved / not approved" when an admin decides
//  - admins can send an announcement to every student of the pathshala (POST /api/admin/push/announce)
// Nothing here may break or slow down the request that triggered it: every call gives up quietly.

const LANGS = ['gu', 'hi', 'en'];
const LOCALE = { gu: 'gu-IN', hi: 'hi-IN', en: 'en-IN' };

const TEXT = {
  newRequest: { gu: 'નવી વિનંતી', hi: 'नया अनुरोध', en: 'New request' },
  attendance: { gu: 'હાજરી', hi: 'हाज़िरी', en: 'Attendance' },
  newGatha: { gu: 'નવી ગાથા', hi: 'नई गाथा', en: 'New gatha' },
  revision: { gu: 'પુનરાવર્તન', hi: 'पुनरावर्तन', en: 'Revision' },
  activity: { gu: 'પ્રવૃત્તિ', hi: 'गतिविधि', en: 'Activity' },
  gathaCount: { gu: 'ગાથા', hi: 'गाथा', en: 'gatha' },
  waiting: { gu: 'મંજૂરી બાકી', hi: 'मंज़ूरी बाकी', en: 'waiting for approval' },
  approved: { gu: '✅ મંજૂર થયું', hi: '✅ मंज़ूर हुआ', en: '✅ Approved' },
  rejected: { gu: '❌ મંજૂર ન થયું', hi: '❌ मंज़ूर नहीं हुआ', en: '❌ Not approved' },
  manyApproved: { gu: '{n} વિનંતી મંજૂર થઈ', hi: '{n} अनुरोध मंज़ूर हुए', en: '{n} requests approved' },
  manyRejected: { gu: '{n} વિનંતી મંજૂર ન થઈ', hi: '{n} अनुरोध मंज़ूर नहीं हुए', en: '{n} requests not approved' },
};
const tx = (key, lang, vars = {}) => (TEXT[key][lang] || TEXT[key].en).replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
const langOf = (d) => (LANGS.includes(d.lang) ? d.lang : 'gu');

function day(date, lang) {
  const d = new Date(`${date}T00:00:00`);
  if (Number.isNaN(d.getTime())) return String(date || '');
  try {
    return d.toLocaleDateString(LOCALE[lang], { day: 'numeric', month: 'short' });
  } catch {
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  }
}

// "Attendance · 23 Nov" / "New gatha · Navkar (3)" / "Activity · …"
function what(kind, doc, lang) {
  if (kind === 'attendance') return `${tx('attendance', lang)} · ${day(doc.date, lang)}`;
  if (doc.type === 'new' || doc.type === 'revision') {
    const label = tx(doc.type === 'new' ? 'newGatha' : 'revision', lang);
    return `${label} · ${doc.sutra_name || ''}${doc.total_gatha ? ` (${doc.total_gatha} ${tx('gathaCount', lang)})` : ''} · ${day(doc.date, lang)}`;
  }
  return `${doc.activityTypeName || tx('activity', lang)} · ${day(doc.date, lang)}`;
}

const tokensCollection = () => getGlobalCollection('push_tokens');

async function deliver(messages) {
  if (messages.length === 0) return;
  const dead = await sendPush(messages);
  if (dead.length) await (await tokensCollection()).deleteMany({ _id: { $in: dead } });
}

// Never let notifications hold a request up for more than a few seconds or throw into it
async function safely(label, fn) {
  if (!pushEnabled()) return;
  try {
    await Promise.race([fn(), new Promise((resolve) => setTimeout(resolve, 8000))]);
  } catch (error) {
    console.warn(`Push (${label}) failed:`, error.message);
  }
}

// ---- Routes ----

// POST /push/register { token, lang }: this phone wants notifications for the logged-in user
export const registerPush = async (req, res) => {
  const token = String(req.body?.token || '').trim();
  if (!token || token.length > 4096) return res.status(400).json({ error: 'Token required' });
  // A super admin "open as admin" session must not take over the pathshala admin's notifications
  if (req.user.impersonatedBy) return res.json({ ok: true, skipped: true });

  const pathshalaId = currentPathshalaId();
  const doc = {
    pathshalaId,
    role: req.user.role,
    username: req.user.username,
    lang: LANGS.includes(req.body?.lang) ? req.body.lang : 'gu',
    updatedAt: new Date(),
  };
  if (req.user.role === 'admin') {
    doc.adminId = String(req.user.id);
    doc.canApprove = (await isAdminOf(req.user.id, pathshalaId, getGlobalCollection)) === 'full';
  }
  const tokens = await tokensCollection();
  if (!tokens) return res.status(500).json({ error: 'Database not available' });
  // One phone = one login: logging in as someone else on the same phone replaces the old entry
  await tokens.replaceOne({ _id: token }, doc, { upsert: true });
  res.json({ ok: true, enabled: pushEnabled() });
};

// POST /push/unregister { token }: logging out on this phone
export const unregisterPush = async (req, res) => {
  const token = String(req.body?.token || '').trim();
  if (token) {
    const tokens = await tokensCollection();
    await tokens?.deleteOne({ _id: token, pathshalaId: currentPathshalaId() });
  }
  res.json({ ok: true });
};

// POST /admin/push/announce { title, message }: notification to every student phone of this pathshala
export const announce = async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  const title = String(req.body?.title || '').trim().slice(0, 80);
  const message = String(req.body?.message || '').trim().slice(0, 500);
  if (!title || !message) return res.status(400).json({ error: 'Title and message are required' });
  if (!pushEnabled()) return res.status(503).json({ error: 'Phone notifications are not set up on the server yet' });

  const tokens = await tokensCollection();
  const devices = await tokens.find({ pathshalaId: currentPathshalaId(), role: 'student' }).toArray();
  await deliver(devices.map((d) => ({ token: d._id, title, body: message, channel: 'announcements', url: '/' })));

  const auditLog = await getCollection('audit_log');
  await auditLog?.insertOne({ action: 'push_announcement', title, message, phones: devices.length, performedBy: req.user.username, created_at: new Date().toISOString() });
  res.json({ ok: true, phones: devices.length });
};

// ---- Events ----

// A student (or family member) submitted attendance or gatha: tell the pathshala's admins
export function pushNewRequest(kind, insertedId) {
  return safely('new request', async () => {
    const pathshalaId = currentPathshalaId();
    const tokens = await tokensCollection();
    const devices = await tokens.find({ pathshalaId, role: 'admin', canApprove: true }).toArray();
    if (devices.length === 0) return;

    const pending = await getCollection(kind === 'attendance' ? 'pending_attendance' : 'pending_gatha');
    const doc = await pending.findOne({ _id: new ObjectId(String(insertedId)) });
    if (!doc) return;
    const p = await (await getGlobalCollection('pathshalas')).findOne({ _id: new ObjectId(pathshalaId) }, { projection: { name: 1 } });
    const waiting = (await Promise.all([
      getCollection('pending_attendance').then((c) => c.countDocuments({ status: 'pending' })),
      getCollection('pending_gatha').then((c) => c.countDocuments({ status: 'pending' })),
    ])).reduce((a, b) => a + b, 0);

    await deliver(devices.map((d) => {
      const lang = langOf(d);
      return {
        token: d._id,
        title: `🕒 ${tx('newRequest', lang)} · ${doc.student_name || doc.username}`,
        body: `${what(kind, doc, lang)}${waiting > 1 ? `\n${waiting} ${tx('waiting', lang)}` : ''}${p?.name ? `\n${p.name}` : ''}`,
        channel: 'requests',
        url: '/admin/approve',
      };
    }));
  });
}

/**
 * Admin decided on requests: tell each student's phones (theirs and their family's).
 * decisions: [{ kind: 'attendance'|'gatha', doc (the pending document), status: 'approved'|'rejected' }]
 */
export function pushDecisions(decisions) {
  return safely('decision', async () => {
    const list = decisions.filter((x) => x?.doc?.username);
    if (list.length === 0) return;
    const pathshalaId = currentPathshalaId();

    // Who may see each student: everyone in their family (same mobile number or family group)
    const students = [...new Set(list.map((x) => x.doc.username))];
    const familyOf = {};
    for (const u of students) familyOf[u] = new Set((await getFamily(u)).members.map((m) => m.username));
    const everyone = [...new Set(students.flatMap((u) => [...familyOf[u]]))];

    const tokens = await tokensCollection();
    const devices = await tokens.find({ pathshalaId, role: 'student', username: { $in: everyone } }).toArray();

    const messages = [];
    for (const d of devices) {
      const mine = list.filter((x) => familyOf[x.doc.username].has(d.username));
      if (mine.length === 0) continue;
      const lang = langOf(d);
      const anyRejected = mine.some((x) => x.status === 'rejected');
      if (mine.length === 1) {
        const [x] = mine;
        const name = x.doc.student_name || x.doc.username;
        messages.push({
          token: d._id,
          title: tx(x.status === 'approved' ? 'approved' : 'rejected', lang),
          body: `${x.doc.username === d.username ? '' : `${name}: `}${what(x.kind, x.doc, lang)}`,
          channel: 'results',
          url: x.status === 'approved' ? '/history' : '/pending',
        });
      } else {
        const ok = mine.filter((x) => x.status === 'approved');
        const no = mine.filter((x) => x.status === 'rejected');
        const parts = [];
        if (ok.length) parts.push(tx('manyApproved', lang, { n: ok.length }));
        if (no.length) parts.push(tx('manyRejected', lang, { n: no.length }));
        const names = [...new Set(mine.map((x) => (x.doc.student_name || x.doc.username).split(' ')[0]))].join(', ');
        messages.push({
          token: d._id,
          title: tx(no.length && !ok.length ? 'rejected' : 'approved', lang),
          body: `${parts.join(' · ')}\n${names}`,
          channel: 'results',
          url: anyRejected ? '/pending' : '/history',
        });
      }
    }
    await deliver(messages);
  });
}
