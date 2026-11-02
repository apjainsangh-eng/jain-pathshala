import crypto from 'crypto';
import { ObjectId } from 'mongodb';
import { getCollection, getGlobalCollection } from '../db';
import { currentPathshalaId } from '../tenant';
import { getFamily } from '../helpers';
import { syncAllStudentsToNiyam } from '../niyamSync';

// Niyam Yatra for every pathshala, on this same website at /niyam (next.config.mjs proxies it to the
// Niyam deployment, NIYAM_ORIGIN). Students and admins tap "નિયમ યાત્રા" and are signed in there with a
// short-lived signed token (same NIYAM_SSO_SECRET in both apps), so nobody types a second password.
// Each pathshala has its own Niyam data; the token says which pathshala.

const TOKEN_TTL_MS = 60 * 1000;

function signToken(payload) {
  const secret = process.env.NIYAM_SSO_SECRET;
  if (!secret || secret.length < 32) throw new Error('NIYAM_SSO_SECRET must be set (32+ characters)');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${body}.${crypto.createHmac('sha256', secret).update(body).digest('base64url')}`;
}

/** Niyam is on for this pathshala unless the super admin switched it off (and the app is configured). */
export async function niyamEnabledForCurrentPathshala() {
  if (!process.env.NIYAM_ORIGIN || !process.env.NIYAM_SSO_SECRET) return false;
  const pathshalas = await getGlobalCollection('pathshalas');
  const p = await pathshalas.findOne({ _id: new ObjectId(currentPathshalaId()) }, { projection: { niyamEnabled: 1 } });
  return !!p && p.niyamEnabled !== false;
}

const tokenBase = () => {
  const now = Date.now();
  return { v: 1, pathshalaId: currentPathshalaId(), iat: now, exp: now + TOKEN_TTL_MS, jti: crypto.randomBytes(16).toString('hex') };
};
const linkFor = (token) => `/niyam/api/auth/pathshala?t=${encodeURIComponent(token)}`;

// POST /niyam/handoff  { selected? }  ->  { url }  (students/families and admins)
export const niyamHandoff = async (req, res) => {
  try {
    if (!(await niyamEnabledForCurrentPathshala())) return res.status(404).json({ error: 'Niyam Yatra is not available for this pathshala' });

    if (req.user.role === 'admin') {
      const token = signToken({ ...tokenBase(), role: 'admin', name: req.user.name || req.user.username || 'Admin', adminId: String(req.user.id || '') });
      return res.json({ url: linkFor(token) });
    }
    if (req.user.role !== 'student') return res.status(403).json({ error: 'Not allowed' });

    const family = await getFamily(req.user.username);
    const usernames = family.members.map((m) => m.username);
    const users = await getCollection('users');
    const docs = await users.find({ username: { $in: usernames } }, { projection: { username: 1, name: 1, 'profile.dateOfBirth': 1 } }).toArray();
    const members = docs.map((d) => ({ username: d.username, name: d.name || d.username, dob: d.profile?.dateOfBirth || '' }));

    const wanted = String(req.body?.selected || req.user.username);
    const selected = usernames.includes(wanted) ? wanted : req.user.username;
    const token = signToken({ ...tokenBase(), role: 'family', mobile: req.user.mobile || '', selected, members });
    res.json({ url: linkFor(token) });
  } catch (error) {
    console.error('Niyam handoff error:', error);
    res.status(500).json({ error: 'Could not open Niyam Yatra' });
  }
};

// GET /admin/niyam/status -> { enabled } (shows the admin's Niyam card)
export const niyamStatus = async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  res.json({ enabled: await niyamEnabledForCurrentPathshala() });
};

// POST /admin/niyam/sync -> send every student of this pathshala to Niyam (creates missing, never renames)
export const niyamSyncAll = async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  if (!(await niyamEnabledForCurrentPathshala())) return res.status(404).json({ error: 'Niyam Yatra is not available for this pathshala' });
  const result = await syncAllStudentsToNiyam();
  if (!result.ok) return res.status(502).json({ error: 'Niyam Yatra could not be reached. Please try again.' });
  res.json(result);
};
