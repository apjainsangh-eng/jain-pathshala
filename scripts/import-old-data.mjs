// Copies the live app's history (attendance, gatha, pending entries, audit log, activity types)
// from the old database into a pathshala in the new database.
//
//   node --env-file=.env.local scripts/import-old-data.mjs <old-db-name> <pathshala-slug> [--dry-run] [--add-missing-users]
//   e.g. node --env-file=.env.local scripts/import-old-data.mjs jainpathshala vasupujya --dry-run
//
// Only reads the old database. Safe to run again: records are matched by their original _id, so a
// second run just brings over whatever the old app saved in the meantime. Run it one last time right
// before switching to the new app, then stop (afterwards the new app is the source of truth).
//
// Not copied: users, passwords and family groups (the new database already has them, with mobile
// numbers), and admins (moved by migrate-to-multi-pathshala.mjs).
// --add-missing-users also copies students that exist only in the old database;
// --add-missing-users-inactive does the same but marks them inactive.
import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';

const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith('--')));
const [oldDbName, slug] = args.filter((a) => !a.startsWith('--'));
const dryRun = flags.has('--dry-run');

if (!oldDbName || !slug) {
  console.error('Usage: node --env-file=.env.local scripts/import-old-data.mjs <old-db-name> <pathshala-slug> [--dry-run] [--add-missing-users]');
  process.exit(1);
}

const newDbName = process.env.DB_NAME || 'pathshala';
if (oldDbName === newDbName) {
  console.error(`The old database and the new one (DB_NAME) are both "${newDbName}". Nothing to import.`);
  process.exit(1);
}

const HISTORY = ['attendance', 'gatha', 'pending_attendance', 'pending_gatha', 'audit_log', 'admin_notes', 'achievements', 'profiles'];
const SEEDED_TYPES = ['Swadhyay', 'Bhaktamar', 'Pathan', 'Competition Practice'];

const client = await MongoClient.connect(process.env.MONGODB_URI);
try {
  const oldDb = client.db(oldDbName);
  const newDb = client.db(newDbName);

  const p = await newDb.collection('pathshalas').findOne({ slug });
  if (!p) throw new Error(`No pathshala "${slug}" in database "${newDbName}". Run migrate-to-multi-pathshala.mjs first.`);
  const pathshalaId = p._id.toString();
  console.log(`${dryRun ? '[dry run] ' : ''}Importing ${oldDbName} → ${newDbName} / ${slug}\n`);

  // Upsert every old record by its _id, tagged with the pathshala; existing copies are refreshed
  // (e.g. a pending entry that has since been approved in the old app).
  const copy = async (name, docs) => {
    const col = newDb.collection(name);
    const existing = new Set((await col.find({ _id: { $in: docs.map((d) => d._id) } }, { projection: { _id: 1 } }).toArray()).map((d) => String(d._id)));
    const added = docs.filter((d) => !existing.has(String(d._id))).length;
    if (!dryRun && docs.length) {
      for (let i = 0; i < docs.length; i += 500) {
        await col.bulkWrite(docs.slice(i, i + 500).map(({ _id, ...rest }) => ({
          updateOne: { filter: { _id }, update: { $set: { ...rest, pathshalaId } }, upsert: true },
        })));
      }
    }
    console.log(`  ${name}: ${docs.length} in old database → ${added} new, ${docs.length - added} already copied`);
  };

  for (const name of HISTORY) {
    await copy(name, await oldDb.collection(name).find({}).toArray());
  }

  // Activity types: bring over the real ones; drop the 4 defaults the new app created on its own
  // if nothing uses them yet.
  const oldTypes = await oldDb.collection('activity_types').find({}).toArray();
  if (oldTypes.length) {
    const types = newDb.collection('activity_types');
    const seeded = await types.find({ pathshalaId, isDefault: true, name: { $in: SEEDED_TYPES }, _id: { $nin: oldTypes.map((t) => t._id) } }).toArray();
    const used = await newDb.collection('gatha').countDocuments({ pathshalaId, activityTypeId: { $in: seeded.map((t) => t._id.toString()) } });
    if (seeded.length && !used) {
      if (!dryRun) await types.deleteMany({ _id: { $in: seeded.map((t) => t._id) } });
      console.log(`  activity_types: removed ${seeded.length} auto-created defaults (${seeded.map((t) => t.name).join(', ')})`);
    }
    await copy('activity_types', oldTypes);
  }

  // Students
  const newUsers = new Set((await newDb.collection('users').find({ pathshalaId }, { projection: { username: 1 } }).toArray()).map((u) => u.username));
  const missing = (await oldDb.collection('users').find({}).toArray()).filter((u) => !newUsers.has(u.username));
  if (missing.length) {
    if (flags.has('--add-missing-users') || flags.has('--add-missing-users-inactive')) {
      const inactive = flags.has('--add-missing-users-inactive');
      const prepared = await Promise.all(missing.map(async ({ password, ...u }) => ({
        ...u,
        role: 'student',
        // Kept hashed, so they keep their password if later given a mobile number
        ...(password && !u.password_hash ? { password_hash: await bcrypt.hash(String(password), 10) } : {}),
        ...(inactive ? { isActive: false, deactivated_at: new Date().toISOString() } : {}),
      })));
      await copy('users', prepared);
      console.log(`    (${missing.map((u) => u.username).join(', ')}${inactive ? ', marked inactive' : ''})`);
    } else {
      console.log(`\n  Students only in the old database (not copied): ${missing.map((u) => u.username).join(', ')}`);
      console.log('  Their history is copied; add --add-missing-users (or --add-missing-users-inactive) to copy the students too.');
    }
  }

  const recordNames = new Set([
    ...(await oldDb.collection('attendance').distinct('username')),
    ...(await oldDb.collection('gatha').distinct('username')),
  ]);
  const addedMissing = flags.has('--add-missing-users') || flags.has('--add-missing-users-inactive');
  const allUsers = new Set([...newUsers, ...(addedMissing ? missing.map((u) => u.username) : [])]);
  const orphans = [...recordNames].filter((n) => !allUsers.has(n));
  if (orphans.length) {
    console.log(`  History of students who no longer exist (kept, but not shown anywhere): ${orphans.join(', ')}`);
  }

  console.log(dryRun ? '\nDry run only: nothing was written. Run again without --dry-run to import.' : '\nDone.');
} finally {
  await client.close();
}
