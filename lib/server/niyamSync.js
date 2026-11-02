import crypto from 'crypto';
import { getCollection } from './db';
import { currentPathshalaId } from './tenant';

// Keeps Niyam Yatra's members in step with this pathshala's students: every student added here gets a
// Niyam member (their login is their Pathshala login); renames, mobile changes, deactivation and deletion
// follow. Server-to-server POST to Niyam's /niyam/api/pathshala/sync, signed with NIYAM_SSO_SECRET.
// Best effort: a Niyam outage never fails or slows the Pathshala action for more than a few seconds.
// The admin's "Sync students to Niyam" button (and signing in through the tab) repair anything missed.

const TIMEOUT_MS = 4000;          // one student changed: never hold up the admin's action for long
const FULL_SYNC_TIMEOUT_MS = 50000; // the "Sync students" button: a whole pathshala in one request

// Returns { ok, ...counts } or { ok: false, reason: 'unauthorized' | 'timeout' | 'unreachable' | 'error', status? }
async function post(payload, timeoutMs = TIMEOUT_MS) {
  const origin = process.env.NIYAM_ORIGIN;
  const secret = (process.env.NIYAM_SSO_SECRET || '').trim();
  if (!origin || !secret) return { ok: false, reason: 'unreachable', skipped: true };
  const body = JSON.stringify(payload);
  const ts = String(Date.now());
  const signature = crypto.createHmac('sha256', secret).update(`${ts}.${body}`).digest('hex');
  try {
    const res = await fetch(`${origin.trim().replace(/\/+$/, '')}/niyam/api/pathshala/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-niyam-ts': ts, 'x-niyam-signature': signature },
      body,
      signal: AbortSignal.timeout(timeoutMs),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.warn('Niyam sync failed:', res.status, data.error || '');
      return { ok: false, status: res.status, reason: res.status === 401 ? 'unauthorized' : 'error', error: data.error };
    }
    return { ok: true, ...data };
  } catch (error) {
    const timedOut = error.name === 'TimeoutError' || error.name === 'AbortError';
    console.warn('Niyam sync not reachable:', error.message);
    return { ok: false, reason: timedOut ? 'timeout' : 'unreachable' };
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
  return post({ pathshalaId: currentPathshalaId(), members: docs.map((u) => toMember(u)), backfill: true }, FULL_SYNC_TIMEOUT_MS);
}
