import { ObjectId } from 'mongodb';
import { getGlobalCollection } from '../db';
import { createToken } from '../auth';
import { toPublicPathshala } from '../tenant';

// An admin (one person, one mobile number) can manage several pathshalas.
// Their token is for one pathshala at a time; switching issues a token for another one.

// Active pathshalas this admin manages, in the order they were added
export async function listAdminPathshalas(admin) {
  const ids = (admin.pathshalaIds || []).filter((id) => ObjectId.isValid(id));
  if (ids.length === 0) return [];

  const pathshalas = await getGlobalCollection('pathshalas');
  const docs = await pathshalas.find({ _id: { $in: ids.map((id) => new ObjectId(id)) }, isActive: { $ne: false } }).toArray();
  const byId = Object.fromEntries(docs.map((p) => [p._id.toString(), toPublicPathshala(p)]));
  return ids.map((id) => byId[id]).filter(Boolean);
}

export function adminSession(admin, pathshala) {
  const user = { id: admin._id.toString(), username: admin.username, name: admin.name || admin.username, role: 'admin' };
  return {
    user,
    token: createToken({ ...user, mobile: admin.mobile, pathshalaId: pathshala.id }),
    pathshala,
  };
}

async function loadAdmin(req) {
  if (req.user.role !== 'admin' || req.user.impersonatedBy || !ObjectId.isValid(req.user.id)) return null;
  const admins = await getGlobalCollection('admins');
  return admins.findOne({ _id: new ObjectId(req.user.id), role: 'admin', isActive: { $ne: false } });
}

export const getMyPathshalas = async (req, res) => {
  const admin = await loadAdmin(req);
  if (!admin) return res.json({ pathshalas: [] });
  res.json({ pathshalas: await listAdminPathshalas(admin), currentId: req.user.pathshalaId });
};

export const switchPathshala = async (req, res) => {
  const admin = await loadAdmin(req);
  if (!admin) return res.status(403).json({ error: 'Admin only' });

  const target = (await listAdminPathshalas(admin)).find((p) => p.id === String(req.body?.pathshalaId || ''));
  if (!target) return res.status(403).json({ error: 'You are not an admin of that pathshala' });

  res.json(adminSession(admin, target));
};
