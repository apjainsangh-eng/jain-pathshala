import bcrypt from 'bcryptjs';
import { getCollection, getGlobalCollection } from '../db';
import { runWithPathshala, isPathshalaActive, toPublicPathshala } from '../tenant';
import { createToken } from '../auth';
import { normalizeMobile, memberPasswordMatches } from '../accounts';
import { getFamily } from '../helpers';
import { ObjectId } from 'mongodb';
import { listAdminPathshalas, adminSession } from './adminAccountController';

// One login for everyone: mobile number + password. The number decides the pathshala.
// An admin's number is checked first; if the password doesn't match the admin's,
// the same number is tried as a family account (an admin can also be a parent).
export const login = async (req, res) => {
  const { mobile: rawMobile, password } = req.body || {};
  const mobile = normalizeMobile(rawMobile);

  if (!mobile || !password) {
    return res.status(400).json({ error: 'Enter a valid 10-digit mobile number and password' });
  }

  const [admins, accounts, pathshalas] = await Promise.all([
    getGlobalCollection('admins'), getGlobalCollection('accounts'), getGlobalCollection('pathshalas'),
  ]);
  if (!admins || !accounts || !pathshalas) return res.status(500).json({ error: 'Database not available' });

  const loadPathshala = async (pathshalaId) => {
    if (!(await isPathshalaActive(pathshalaId, getGlobalCollection))) return null;
    const p = await pathshalas.findOne({ _id: new ObjectId(pathshalaId) });
    return p ? toPublicPathshala(p) : null;
  };

  // Admin (may manage several pathshalas; opens the one they used last, if they still have it)
  const admin = await admins.findOne({ role: 'admin', mobile });
  if (admin && admin.isActive !== false && admin.password_hash && await bcrypt.compare(password, admin.password_hash)) {
    const list = await listAdminPathshalas(admin);
    if (list.length === 0) return res.status(403).json({ error: 'This pathshala is not active' });

    const pathshala = list.find((p) => p.id === String(req.body.lastPathshalaId || '')) || list[0];
    return res.json({ ...adminSession(admin, pathshala), adminPathshalas: list });
  }

  // Family / student
  const account = await accounts.findOne({ mobile });
  if (!account) {
    return res.status(401).json({ error: 'Invalid mobile number or password' });
  }
  const pathshala = await loadPathshala(account.pathshalaId);
  if (!pathshala) return res.status(403).json({ error: 'This pathshala is not active' });

  return runWithPathshala(account.pathshalaId, async () => {
    const users = await getCollection('users');
    const students = await users.find({ mobile }).sort({ created_at: 1 }).toArray();
    if (students.length === 0) {
      return res.status(401).json({ error: 'Invalid mobile number or password' });
    }

    // Everyone this number can open. Inactive students can log in and view their history,
    // but can't add attendance or gatha (blocked in the API route).
    const family = { groupName: null, members: [] };
    for (const s of students) {
      const f = await getFamily(s.username);
      family.groupName = family.groupName || f.groupName;
      f.members.forEach((m) => { if (!family.members.some((x) => x.username === m.username)) family.members.push(m); });
    }

    // Accepted passwords: the number's login password, or ANY family member's own password.
    // A member's own password opens the app as that member.
    let passwordOwner = null;
    if (await bcrypt.compare(password, account.password_hash || '')) {
      passwordOwner = 'account';
    } else {
      const passwords = await getCollection('passwords');
      const docs = await users.find({ username: { $in: family.members.map((m) => m.username) } }).toArray();
      for (const doc of docs) {
        if (await memberPasswordMatches(doc, password, passwords)) { passwordOwner = doc.username; break; }
      }
    }
    if (!passwordOwner) {
      return res.status(401).json({ error: 'Invalid mobile number or password' });
    }

    const own = new Set(students.map((s) => s.username));
    // Open on the member whose password was used; otherwise an active member of this number
    const first = family.members.find((m) => m.username === passwordOwner)
      || family.members.find((m) => own.has(m.username) && m.isActive)
      || family.members.find((m) => own.has(m.username)) || family.members[0];
    const user = { id: first.username, username: first.username, name: first.name || first.username, role: 'student', isActive: first.isActive };

    res.json({
      user,
      token: createToken({ ...user, mobile, pathshalaId: account.pathshalaId }),
      pathshala,
      familyGroup: {
        groupName: family.groupName,
        members: family.members.length > 1
          ? family.members.map((m) => ({ ...m, isCurrent: m.username === first.username }))
          : [],
      },
    });
  });
};
