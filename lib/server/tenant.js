import { AsyncLocalStorage } from 'async_hooks';
import { ObjectId } from 'mongodb';

// Holds the pathshala the current request belongs to, so the database layer can scope every query to it.
const storage = globalThis.__pathshalaTenant || (globalThis.__pathshalaTenant = new AsyncLocalStorage());

export function runWithPathshala(pathshalaId, fn) {
  return storage.run({ pathshalaId: String(pathshalaId) }, fn);
}

export function currentPathshalaId() {
  return storage.getStore()?.pathshalaId || null;
}

export const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/;
export const RESERVED_SLUGS = new Set(['api', 'superadmin', 'admin', 'login', '_next', 'static', 'public', 'favicon.ico', 'manifest.json', 'robots.txt']);

export function toPublicPathshala(p) {
  return {
    id: p._id.toString(),
    slug: p.slug,
    name: p.name,
    sanghName: p.sanghName || '',
    isActive: p.isActive !== false,
  };
}

// Short cache so every request doesn't hit the database to check the pathshala is still active
const activeCache = new Map();
const ACTIVE_TTL_MS = 60 * 1000;

export async function isPathshalaActive(pathshalaId, getGlobalCollection) {
  const cached = activeCache.get(pathshalaId);
  if (cached && cached.expires > Date.now()) return cached.active;

  let active = false;
  try {
    const col = await getGlobalCollection('pathshalas');
    const p = col && ObjectId.isValid(pathshalaId) ? await col.findOne({ _id: new ObjectId(pathshalaId) }) : null;
    active = !!p && p.isActive !== false;
  } catch (e) {
    active = false;
  }
  activeCache.set(pathshalaId, { active, expires: Date.now() + ACTIVE_TTL_MS });
  return active;
}

export function forgetPathshalaStatus(pathshalaId) {
  activeCache.delete(String(pathshalaId));
}

// An admin can manage several pathshalas (`pathshalaIds` on their admins record).
// Checked on every admin request so removing an admin from a pathshala takes effect within a minute.
const adminCache = new Map();

export async function isAdminOf(adminId, pathshalaId, getGlobalCollection) {
  const key = `${adminId}:${pathshalaId}`;
  const cached = adminCache.get(key);
  if (cached && cached.expires > Date.now()) return cached.allowed;

  let allowed = false;
  try {
    const admins = await getGlobalCollection('admins');
    allowed = ObjectId.isValid(adminId) && !!(await admins.findOne({
      _id: new ObjectId(adminId), role: 'admin', pathshalaIds: String(pathshalaId), isActive: { $ne: false },
    }));
  } catch (e) {
    allowed = false;
  }
  adminCache.set(key, { allowed, expires: Date.now() + ACTIVE_TTL_MS });
  return allowed;
}

// Students marked inactive lose access within a minute, even if already logged in
const studentCache = new Map();

export async function isStudentActive(username, pathshalaId, getGlobalCollection) {
  const key = `${pathshalaId}:${username}`;
  const cached = studentCache.get(key);
  if (cached && cached.expires > Date.now()) return cached.active;

  let active = false;
  try {
    const users = await getGlobalCollection('users');
    const u = await users.findOne({ pathshalaId: String(pathshalaId), username });
    active = !!u && u.isActive !== false;
  } catch (e) {
    active = false;
  }
  studentCache.set(key, { active, expires: Date.now() + ACTIVE_TTL_MS });
  return active;
}

export function forgetStudentStatus(username, pathshalaId) {
  studentCache.delete(`${pathshalaId}:${username}`);
}

export function forgetAdminAccess(adminId) {
  for (const key of adminCache.keys()) {
    if (key.startsWith(`${adminId}:`)) adminCache.delete(key);
  }
}
