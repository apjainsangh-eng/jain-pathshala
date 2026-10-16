import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import { getGlobalCollection } from '../db';
import { createToken } from '../auth';
import { exactCI } from '../helpers';
import { normalizeMobile } from '../accounts';
import { SLUG_PATTERN, RESERVED_SLUGS, toPublicPathshala, forgetPathshalaStatus, forgetAdminAccess } from '../tenant';

// Everything here works across pathshalas, so it uses unscoped (global) collections.

const toAdmin = (a) => ({
  id: a._id.toString(),
  username: a.username,
  name: a.name || a.username,
  mobile: a.mobile || null,
  pathshalaCount: (a.pathshalaIds || []).length,
  isActive: a.isActive !== false,
  created_at: a.created_at || null,
});

function parseId(id) {
  return ObjectId.isValid(id) ? new ObjectId(id) : null;
}

async function audit(req, action, details) {
  const log = await getGlobalCollection('superadmin_audit_log');
  if (log) await log.insertOne({ action, details, by: req.user.username, created_at: new Date().toISOString() });
}

// ---------- Login ----------

export const login = async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'Credentials required' });

  const admins = await getGlobalCollection('admins');
  if (!admins) return res.status(500).json({ error: 'Database not available' });

  const sa = await admins.findOne({ role: 'superadmin', username: { $regex: exactCI(username.trim()) } });
  const valid = sa && sa.isActive !== false && await bcrypt.compare(password, sa.password_hash || '');
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  const user = { id: sa._id.toString(), username: sa.username, name: sa.name || sa.username, role: 'superadmin' };
  res.json({ user, token: createToken(user) });
};

// ---------- Pathshalas ----------

export const listPathshalas = async (req, res) => {
  const [pathshalas, admins, users] = await Promise.all([
    getGlobalCollection('pathshalas'), getGlobalCollection('admins'), getGlobalCollection('users'),
  ]);
  if (!pathshalas) return res.status(500).json({ error: 'Database not available' });

  const [list, adminCounts, studentCounts] = await Promise.all([
    pathshalas.find({}).sort({ created_at: 1 }).toArray(),
    admins.aggregate([{ $match: { role: 'admin' } }, { $unwind: '$pathshalaIds' }, { $group: { _id: '$pathshalaIds', n: { $sum: 1 } } }]).toArray(),
    users.aggregate([{ $match: { role: 'student' } }, { $group: { _id: '$pathshalaId', n: { $sum: 1 } } }]).toArray(),
  ]);
  const toMap = (rows) => Object.fromEntries(rows.map((r) => [r._id, r.n]));
  const adminMap = toMap(adminCounts);
  const studentMap = toMap(studentCounts);

  res.json(list.map((p) => ({
    ...toPublicPathshala(p),
    created_at: p.created_at || null,
    adminCount: adminMap[p._id.toString()] || 0,
    studentCount: studentMap[p._id.toString()] || 0,
  })));
};

export const createPathshala = async (req, res) => {
  const { name, sanghName, slug } = req.body || {};
  const cleanSlug = String(slug || '').trim().toLowerCase();

  if (!name || !name.trim()) return res.status(400).json({ error: 'Pathshala name is required' });
  if (!SLUG_PATTERN.test(cleanSlug) || RESERVED_SLUGS.has(cleanSlug)) {
    return res.status(400).json({ error: 'Link code must be 3-40 characters: lowercase letters, numbers and hyphens' });
  }

  const pathshalas = await getGlobalCollection('pathshalas');
  if (await pathshalas.findOne({ slug: cleanSlug })) {
    return res.status(409).json({ error: 'That link code is already used' });
  }

  const doc = {
    name: name.trim(),
    sanghName: (sanghName || '').trim(),
    slug: cleanSlug,
    isActive: true,
    created_at: new Date().toISOString(),
    created_by: req.user.username,
  };
  const result = await pathshalas.insertOne(doc);
  await audit(req, 'create_pathshala', { slug: cleanSlug, name: doc.name });

  res.json({ message: 'Pathshala created', pathshala: toPublicPathshala({ ...doc, _id: result.insertedId }) });
};

export const updatePathshala = async (req, res) => {
  const _id = parseId(req.params.id);
  if (!_id) return res.status(400).json({ error: 'Invalid id' });

  const { name, sanghName, isActive } = req.body || {};
  const update = { updated_at: new Date().toISOString() };
  if (typeof name === 'string' && name.trim()) update.name = name.trim();
  if (typeof sanghName === 'string') update.sanghName = sanghName.trim();
  if (typeof isActive === 'boolean') update.isActive = isActive;

  const pathshalas = await getGlobalCollection('pathshalas');
  const result = await pathshalas.updateOne({ _id }, { $set: update });
  if (result.matchedCount === 0) return res.status(404).json({ error: 'Pathshala not found' });

  forgetPathshalaStatus(req.params.id);
  await audit(req, 'update_pathshala', { id: req.params.id, ...update });
  res.json({ message: 'Pathshala updated' });
};

// ---------- Pathshala admins ----------
// One admins record per person (one mobile number, one password). `pathshalaIds` lists every
// pathshala they manage; they switch between them inside the admin dashboard.

export const listAdmins = async (req, res) => {
  const admins = await getGlobalCollection('admins');
  const list = await admins.find({ role: 'admin', pathshalaIds: req.params.id }).sort({ created_at: 1 }).toArray();
  res.json(list.map(toAdmin));
};

// Adds an admin to a pathshala. If the mobile number already belongs to an admin, that person
// gets access to this pathshala too (their name and password stay as they are).
export const createAdmin = async (req, res) => {
  const pathshalaId = req.params.id;
  const { name, password } = req.body || {};
  const mobile = normalizeMobile(req.body?.mobile);

  if (!mobile) return res.status(400).json({ error: 'Enter a valid 10-digit mobile number' });

  const _id = parseId(pathshalaId);
  const pathshalas = await getGlobalCollection('pathshalas');
  if (!_id || !(await pathshalas.findOne({ _id }))) return res.status(404).json({ error: 'Pathshala not found' });

  const admins = await getGlobalCollection('admins');
  const existing = await admins.findOne({ role: 'admin', mobile });

  if (existing) {
    if ((existing.pathshalaIds || []).includes(pathshalaId)) {
      return res.status(409).json({ error: `${existing.name} is already an admin of this pathshala` });
    }
    await admins.updateOne({ _id: existing._id }, { $addToSet: { pathshalaIds: pathshalaId }, $set: { updated_at: new Date().toISOString() } });
    forgetAdminAccess(existing._id.toString());
    await audit(req, 'add_admin_to_pathshala', { pathshalaId, adminId: existing._id.toString() });
    return res.json({ message: `${existing.name} can now manage this pathshala too (same login and password)` });
  }

  if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required' });
  if (!password || String(password).length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

  await admins.insertOne({
    role: 'admin',
    pathshalaIds: [pathshalaId],
    mobile,
    // Internal name shown in audit logs
    username: name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '') || `admin${mobile.slice(-4)}`,
    name: name.trim(),
    password_hash: await bcrypt.hash(String(password), 10),
    isActive: true,
    created_at: new Date().toISOString(),
    created_by: req.user.username,
  });
  await audit(req, 'create_admin', { pathshalaId, mobile });
  res.json({ message: 'Admin created' });
};

// Name, mobile, password and enabled/disabled apply to the person, i.e. all their pathshalas
export const updateAdmin = async (req, res) => {
  const _id = parseId(req.params.adminId);
  if (!_id) return res.status(400).json({ error: 'Invalid id' });

  const { name, password, isActive } = req.body || {};
  const update = { updated_at: new Date().toISOString() };
  if (typeof name === 'string' && name.trim()) update.name = name.trim();
  if (typeof isActive === 'boolean') update.isActive = isActive;
  if (password) {
    if (String(password).length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
    update.password_hash = await bcrypt.hash(String(password), 10);
  }

  const admins = await getGlobalCollection('admins');
  if (req.body?.mobile !== undefined) {
    const mobile = normalizeMobile(req.body.mobile);
    if (!mobile) return res.status(400).json({ error: 'Enter a valid 10-digit mobile number' });
    if (await admins.findOne({ role: 'admin', mobile, _id: { $ne: _id } })) {
      return res.status(409).json({ error: 'This mobile number is already another admin\'s login' });
    }
    update.mobile = mobile;
  }

  const result = await admins.updateOne({ _id, role: 'admin' }, { $set: update });
  if (result.matchedCount === 0) return res.status(404).json({ error: 'Admin not found' });

  forgetAdminAccess(req.params.adminId);
  await audit(req, 'update_admin', { id: req.params.adminId, name: update.name, isActive: update.isActive, passwordReset: !!password });
  res.json({ message: 'Admin updated' });
};

// Removes the admin from one pathshala; deletes the admin once they have no pathshalas left
export const removeAdmin = async (req, res) => {
  const _id = parseId(req.params.adminId);
  if (!_id) return res.status(400).json({ error: 'Invalid id' });

  const admins = await getGlobalCollection('admins');
  const result = await admins.updateOne({ _id, role: 'admin', pathshalaIds: req.params.id }, { $pull: { pathshalaIds: req.params.id } });
  if (result.matchedCount === 0) return res.status(404).json({ error: 'Admin not found in this pathshala' });

  const deleted = await admins.deleteOne({ _id, role: 'admin', pathshalaIds: { $size: 0 } });
  forgetAdminAccess(req.params.adminId);
  await audit(req, 'remove_admin', { id: req.params.adminId, pathshalaId: req.params.id, deleted: deleted.deletedCount > 0 });
  res.json({ message: deleted.deletedCount ? 'Admin removed and deleted (no other pathshalas)' : 'Admin removed from this pathshala' });
};

// Lets the super admin open a pathshala's admin panel without knowing an admin password
export const openAsAdmin = async (req, res) => {
  const _id = parseId(req.params.id);
  const pathshalas = await getGlobalCollection('pathshalas');
  const p = _id ? await pathshalas.findOne({ _id }) : null;
  if (!p) return res.status(404).json({ error: 'Pathshala not found' });

  const user = { id: req.user.id, username: req.user.username, name: `${req.user.name} (Super Admin)`, role: 'admin' };
  await audit(req, 'open_as_admin', { pathshalaId: req.params.id });
  res.json({
    user,
    token: createToken({ ...user, pathshalaId: p._id.toString(), impersonatedBy: req.user.username }),
    pathshala: toPublicPathshala(p),
  });
};
