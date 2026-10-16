// One-time migration from the single-pathshala app. Safe to run more than once.
//
//   node --env-file=.env.local scripts/migrate-to-multi-pathshala.mjs <slug> "<pathshala name>" "<sangh name>"
//
// 1. Creates the pathshala (or reuses it if the slug exists)
// 2. Assigns every existing record without a pathshalaId to it
// 3. Moves the 3 hardcoded admins into the `admins` collection (same usernames and passwords, now hashed)
// 4. Adds the hardcoded legacy students who never logged in (same default passwords, now hashed)
// 5. Hashes any remaining plain-text student passwords
// 6. Creates indexes (including the mobile-number login indexes)
//
// Back up the database first (Atlas: take a snapshot, or `mongodump`).
import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';
import { ADMIN_USERS, LEGACY_STUDENTS } from './legacy-pathshala-data.mjs';

const TENANT_COLLECTIONS = [
  'users', 'attendance', 'gatha', 'pending_attendance', 'pending_gatha', 'family_groups',
  'audit_log', 'activity_types', 'admin_notes', 'profiles', 'passwords', 'achievements',
];

const [slug, name, sanghName = ''] = process.argv.slice(2);
if (!slug || !name || !/^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/.test(slug)) {
  console.error('Usage: node --env-file=.env.local scripts/migrate-to-multi-pathshala.mjs <slug> "<pathshala name>" "<sangh name>"');
  console.error('slug: 3-40 lowercase letters, numbers and hyphens, e.g. vasupujya');
  process.exit(1);
}
if (!process.env.MONGODB_URI) {
  console.error('MONGODB_URI is not set.');
  process.exit(1);
}

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const client = await MongoClient.connect(process.env.MONGODB_URI);

try {
  const db = client.db(process.env.DB_NAME || 'pathshala');
  const now = new Date().toISOString();

  // 1. Pathshala
  const pathshalas = db.collection('pathshalas');
  await pathshalas.createIndex({ slug: 1 }, { unique: true });
  let p = await pathshalas.findOne({ slug });
  if (!p) {
    const r = await pathshalas.insertOne({ name, sanghName, slug, isActive: true, created_at: now, created_by: 'migration' });
    p = { _id: r.insertedId };
    console.log(`Created pathshala "${name}" (/${slug})`);
  } else {
    console.log(`Using existing pathshala /${slug}`);
  }
  const pathshalaId = p._id.toString();

  // 2. Existing records
  for (const name of TENANT_COLLECTIONS) {
    const r = await db.collection(name).updateMany({ pathshalaId: { $exists: false } }, { $set: { pathshalaId } });
    if (r.modifiedCount) console.log(`  ${name}: ${r.modifiedCount} records assigned`);
  }

  // 3. Admins. An admin can manage several pathshalas (`pathshalaIds`);
  //    records from an earlier version of this script used a single `pathshalaId`.
  const admins = db.collection('admins');
  const converted = await admins.updateMany(
    { role: 'admin', pathshalaId: { $exists: true } },
    [{ $set: { pathshalaIds: ['$pathshalaId'] } }, { $unset: 'pathshalaId' }]
  );
  if (converted.modifiedCount) console.log(`  ${converted.modifiedCount} admin record(s) converted to multi-pathshala`);

  for (const [key, a] of Object.entries(ADMIN_USERS)) {
    const exists = await admins.findOne({ role: 'admin', pathshalaIds: pathshalaId, username: { $regex: new RegExp('^' + escape(key) + '$', 'i') } });
    if (exists) continue;
    await admins.insertOne({
      role: 'admin', pathshalaIds: [pathshalaId], username: key, name: a.name,
      password_hash: await bcrypt.hash(a.password, 10), isActive: true, created_at: now, created_by: 'migration',
    });
    console.log(`  admin "${key}" added`);
  }

  // 4. Legacy students who were only in the hardcoded list
  const users = db.collection('users');
  for (const s of LEGACY_STUDENTS) {
    const exists = await users.findOne({ pathshalaId, username: { $regex: new RegExp('^' + escape(s.username) + '$', 'i') } });
    if (exists) continue;
    await users.insertOne({
      pathshalaId, username: s.username, name: s.name, role: 'student',
      password_hash: await bcrypt.hash(s.password, 10), migrated: true, created_at: now,
    });
    console.log(`  student "${s.username}" added`);
  }

  // 5. Plain-text passwords -> hashes (only where the student hasn't set their own password)
  const passwords = db.collection('passwords');
  const plain = await users.find({ pathshalaId, password: { $exists: true } }).toArray();
  for (const u of plain) {
    const own = await passwords.findOne({ pathshalaId, username: u.username, password_hash: { $exists: true } });
    const update = { $unset: { password: '' } };
    if (!own) update.$set = { password_hash: await bcrypt.hash(String(u.password), 10) };
    await users.updateOne({ _id: u._id }, update);
  }
  if (plain.length) console.log(`  ${plain.length} plain-text passwords hashed`);

  // 6. Indexes
  await admins.createIndex({ role: 1, pathshalaIds: 1 });
  await users.createIndex({ pathshalaId: 1, username: 1 });
  await users.createIndex({ pathshalaId: 1, role: 1 });
  for (const name of ['attendance', 'gatha']) {
    await db.collection(name).createIndex({ pathshalaId: 1, username: 1, date: 1 });
    await db.collection(name).createIndex({ pathshalaId: 1, date: 1 });
  }
  for (const name of ['pending_attendance', 'pending_gatha']) {
    await db.collection(name).createIndex({ pathshalaId: 1, status: 1 });
    await db.collection(name).createIndex({ pathshalaId: 1, username: 1, date: 1 });
  }
  for (const name of ['family_groups', 'activity_types', 'audit_log', 'admin_notes', 'profiles', 'passwords', 'achievements']) {
    await db.collection(name).createIndex({ pathshalaId: 1 });
  }
  // Mobile-number logins: one account per number across all pathshalas; one admin per number
  await db.collection('accounts').createIndex({ mobile: 1 }, { unique: true });
  await admins.createIndex({ mobile: 1 }, { unique: true, partialFilterExpression: { role: 'admin', mobile: { $type: 'string' } } });
  await users.createIndex({ pathshalaId: 1, mobile: 1 });

  const noMobileAdmins = await admins.countDocuments({ role: 'admin', pathshalaIds: pathshalaId, mobile: { $exists: false } });
  const noMobileStudents = await users.countDocuments({ pathshalaId, role: 'student', mobile: { $exists: false } });
  console.log(`\nDone. Pathshala "${slug}" is ready.`);
  if (noMobileAdmins) {
    console.log(`  ${noMobileAdmins} admin(s) have no mobile number yet: add one at /superadmin → Admins (pencil icon).`);
  }
  if (noMobileStudents) {
    console.log(`  ${noMobileStudents} student(s) have no mobile number yet: an admin adds them in Users → edit.`);
    console.log('  Each keeps their current password, so they log in with mobile number + old password.');
  }
} finally {
  await client.close();
}
