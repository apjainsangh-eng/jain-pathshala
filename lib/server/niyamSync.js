import crypto from 'crypto';
import { getCollection } from './db';
import { currentPathshalaId } from './tenant';

// Keeps Niyam Yatra's members in step with this pathshala's students: every student added here gets a
// Niyam member (their login is their Pathshala login); renames, mobile changes, deactivation and deletion
// follow. Server-to-server POST to Niyam's /niyam/api/pathshala/sync, signed with NIYAM_SSO_SECRET.
// Best effort: a Niyam outage never fails or slows the Pathshala action for more than a few seconds.
// The admin's "Sync students to Niyam" button (and signing in through the tab) repair anything missed.

const TIMEOUT_MS = 4000;

async function post(payload) {
  const origin = process.env.NIYAM_ORIGIN;
  const secret = process.env.NIYAM_SSO_SECRET;
  if (!origin || !secret) return { ok: false, skipped: true };
  const body = JSON.stringify(payload);
  const ts = String(Date.now());
  const signature = crypto.createHmac('sha256', secret).update(`${ts}.${body}`).digest('hex');
  try {
    const res = await fetch(`${origin.replace(/\/+$/, '')}/niyam/api/pathshala/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-niyam-ts': ts, 'x-niyam-signature': signature },
      body,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) console.warn('Niyam sync failed:', res.status, data.error || '');
    return { ok: res.ok, ...data };
  } catch (error) {
    console.warn('Niyam sync not reachable:', error.message);
    return { ok: false };
  }
}

const toMember = (u, active = u.isActive !== false) => ({
  username: u.username,
  name: u.name || u.username,
  dob: u.profile?.dateOfBirth || '',
  mobile: u.mobile || '',
  active,
});

/** After a student is added or changed (call inside the pathshala's request). */
export async function syncStudentsToNiyam(usernames) {
  const list = [...new Set((usernames || []).filter(Boolean))];
  if (!list.length) return { ok: true };
  const users = await getCollection('users');
  const docs = await users.find({ username: { $in: list }, role: 'student' }).toArray();
  if (!docs.length) return { ok: true };
  return post({ pathshalaId: currentPathshalaId(), members: docs.map((u) => toMember(u)) });
}

/** After a student is deleted: Niyam keeps their history but marks them inactive. */
export async function removeStudentFromNiyam(user) {
  if (!user?.username) return { ok: true };
  return post({ pathshalaId: currentPathshalaId(), members: [toMember(user, false)] });
}

/** Every student of this pathshala (the admin's sync button). Never renames existing Niyam members. */
export async function syncAllStudentsToNiyam() {
  const users = await getCollection('users');
  const docs = await users.find({ role: 'student' }).toArray();
  return post({ pathshalaId: currentPathshalaId(), members: docs.map((u) => toMember(u)), backfill: true });
}
