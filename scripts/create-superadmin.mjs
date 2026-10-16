// Creates the super admin, or resets their password if they already exist.
//
//   node --env-file=.env.local scripts/create-superadmin.mjs <username> [name]
//
// The password is read from SUPERADMIN_PASSWORD so it doesn't end up in shell history:
//   PowerShell:  $env:SUPERADMIN_PASSWORD = '...'; node --env-file=.env.local scripts/create-superadmin.mjs moksh "Moksh"
import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';

const [username, name] = process.argv.slice(2);
const password = process.env.SUPERADMIN_PASSWORD;

if (!username || !password) {
  console.error('Usage: SUPERADMIN_PASSWORD=... node --env-file=.env.local scripts/create-superadmin.mjs <username> [name]');
  process.exit(1);
}
if (password.length < 8) {
  console.error('Use a password of at least 8 characters.');
  process.exit(1);
}
if (!process.env.MONGODB_URI) {
  console.error('MONGODB_URI is not set.');
  process.exit(1);
}

const client = await MongoClient.connect(process.env.MONGODB_URI);
try {
  const admins = client.db(process.env.DB_NAME || 'pathshala').collection('admins');
  const now = new Date().toISOString();
  const result = await admins.updateOne(
    { role: 'superadmin', username },
    {
      $set: { name: name || username, password_hash: await bcrypt.hash(password, 10), isActive: true, updated_at: now },
      $setOnInsert: { role: 'superadmin', username, created_at: now },
    },
    { upsert: true }
  );
  console.log(result.upsertedCount ? `Super admin "${username}" created.` : `Super admin "${username}" updated.`);
} finally {
  await client.close();
}
