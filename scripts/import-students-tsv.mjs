// Adds students (with their profile details) to one pathshala from a tab-separated sheet.
//
//   node --env-file=.env.local scripts/import-students-tsv.mjs <file.tsv> <pathshala-slug> [--apply] [--skip=2,3] [--blank-dob=18]
//
// Columns, in order: email, first name, last name, date of birth (dd/mm/yyyy), gender, mobile, address,
// status (School Student / Homemaker / College Student / Job / Service / Business), school or study details,
// other activities, dharmic abhyas, skills.
//
// Without --apply nothing is saved: it prints what would happen. --skip drops sheet lines (1-based) such as
// duplicates; --blank-dob leaves the date of birth empty on those lines so the student is asked for it on login.
// Everyone gets the starting password in IMPORT_PASSWORD (set it in the shell; it is never printed).
// Students who share a mobile number share one login. Safe to run again: students already added are skipped.
import fs from 'node:fs';
import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';

const args = process.argv.slice(2);
const [file, slug] = args.filter((a) => !a.startsWith('--'));
const flag = (name) => args.find((a) => a.startsWith(`--${name}=`))?.split('=')[1];
const apply = args.includes('--apply');
const list = (v) => new Set((v || '').split(',').filter(Boolean).map(Number));
const skip = list(flag('skip'));
const blankDob = list(flag('blank-dob'));
const password = process.env.IMPORT_PASSWORD;

if (!file || !slug || !process.env.MONGODB_URI) {
  console.error('Usage: node --env-file=.env.local scripts/import-students-tsv.mjs <file.tsv> <pathshala-slug> [--apply] [--skip=2,3] [--blank-dob=18]');
  process.exit(1);
}
if (apply && (!password || password.length < 6)) {
  console.error('Set IMPORT_PASSWORD (at least 6 characters) before using --apply.');
  process.exit(1);
}

const STATUS = {
  'school student': 'school', 'college student': 'college', homemaker: 'homemaker',
  'job / service / business': 'working', business: 'business', retired: 'retired',
};
const tidy = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();
// Only the first letter of each word is a capital: "HETAL SHAH" -> "Hetal Shah"
const nameCase = (s) => tidy(s).replace(/\(\s+/g, '(').toLowerCase().replace(/(^|[\s(])(\p{L})/gu, (_, a, b) => a + b.toUpperCase());
const mobileOf = (s) => {
  let m = String(s ?? '').replace(/\D/g, '');
  if (m.length === 11 && m.startsWith('0')) m = m.slice(1);
  if (m.length === 12 && m.startsWith('91')) m = m.slice(2);
  return /^\d{10}$/.test(m) ? m : null;
};
const today = new Date().toISOString().slice(0, 10);

const rows = fs.readFileSync(file, 'utf8').split(/\r?\n/).map((l, i) => ({ line: i + 1, text: l })).filter((r) => r.text.trim());
const students = [];
const issues = [];
for (const { line, text } of rows) {
  if (skip.has(line)) continue;
  const c = text.split('\t').map(tidy);
  const [email, first, last, dobRaw, genderRaw, mobileRaw, address, statusRaw, study, other, dharmic, skills] = c;
  const mobile = mobileOf(mobileRaw);
  if (!mobile) { issues.push(`line ${line}: ${first} ${last}: mobile "${mobileRaw}" is not valid, skipped`); continue; }
  if (!first) { issues.push(`line ${line}: no first name, skipped`); continue; }

  let dateOfBirth = '';
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(dobRaw || '');
  if (blankDob.has(line)) issues.push(`line ${line}: ${first} ${last}: date of birth left blank on purpose`);
  else if (!m) issues.push(`line ${line}: ${first} ${last}: date "${dobRaw}" not understood, left blank`);
  else {
    dateOfBirth = `${m[3]}-${m[2]}-${m[1]}`;
    if (dateOfBirth > today || Number(m[3]) < 1920 || Number.isNaN(Date.parse(dateOfBirth))) {
      issues.push(`line ${line}: ${first} ${last}: date ${dobRaw} looks wrong, left blank`);
      dateOfBirth = '';
    }
  }

  const firstName = nameCase(first);
  const lastName = nameCase(last);
  const status = STATUS[statusRaw.toLowerCase()] || (statusRaw ? 'other' : '');
  if (statusRaw && !STATUS[statusRaw.toLowerCase()]) issues.push(`line ${line}: status "${statusRaw}" saved as "other"`);
  students.push({
    line, mobile, name: `${firstName} ${lastName}`.trim(),
    profile: {
      firstName, lastName, email: email.toLowerCase(), dateOfBirth,
      gender: genderRaw.toLowerCase() === 'male' ? 'male' : genderRaw.toLowerCase() === 'female' ? 'female' : '',
      whatsappNumber: mobile, address, currentStatus: status,
      studyDetails: study || '', otherActivities: other || '', dharmicAbhyas: dharmic || '', skills: skills || '',
    },
  });
}

const client = await MongoClient.connect(process.env.MONGODB_URI);
try {
  const db = client.db(process.env.DB_NAME || 'pathshala');
  const pathshala = await db.collection('pathshalas').findOne({ slug });
  if (!pathshala) throw new Error(`No pathshala with slug "${slug}"`);
  const pathshalaId = String(pathshala._id);
  const users = db.collection('users');
  const accounts = db.collection('accounts');

  const existingUsers = await users.find({ pathshalaId }, { projection: { username: 1, name: 1, mobile: 1 } }).toArray();
  const taken = new Set(existingUsers.map((u) => u.username.toLowerCase()));
  const already = new Set(existingUsers.map((u) => `${u.mobile}|${String(u.name).toLowerCase()}`));
  const accountByMobile = Object.fromEntries((await accounts.find({ mobile: { $in: [...new Set(students.map((s) => s.mobile))] } }).toArray()).map((a) => [a.mobile, a]));

  const usernameFor = (name) => {
    const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 16) || 'student';
    let candidate = base;
    for (let i = 0; taken.has(candidate); i++) candidate = `${base}${100 + ((i * 37 + 11) % 900)}`;
    taken.add(candidate);
    return candidate;
  };

  const plan = [];
  const newMobiles = new Set();
  for (const s of students) {
    if (already.has(`${s.mobile}|${s.name.toLowerCase()}`)) { plan.push({ ...s, action: 'already added' }); continue; }
    const acc = accountByMobile[s.mobile];
    if (acc && acc.pathshalaId !== pathshalaId) { issues.push(`line ${s.line}: ${s.name}: mobile ${s.mobile} belongs to another pathshala, skipped`); continue; }
    const login = acc || newMobiles.has(s.mobile) ? 'shared login' : 'new login';
    newMobiles.add(s.mobile);
    plan.push({ ...s, action: 'add', login, username: usernameFor(s.name) });
  }

  const toAdd = plan.filter((p) => p.action === 'add');
  console.log(`Pathshala: ${pathshala.name}  (${students.length} rows read, ${students.length - plan.length} unusable)`);
  console.log(`To add: ${toAdd.length} students, ${toAdd.filter((p) => p.login === 'new login').length} new logins, ${plan.length - toAdd.length} already there\n`);
  for (const p of plan) {
    const missing = ['dateOfBirth', 'gender', 'address', 'currentStatus'].filter((f) => !p.profile[f]);
    console.log(`${String(p.line).padStart(3)}  ${p.action === 'add' ? '+' : '='}  ${p.name.padEnd(30)} ${p.mobile}  ${(p.profile.dateOfBirth || '—').padEnd(10)} ${p.profile.currentStatus.padEnd(9)} ${p.login || ''}${missing.length ? `   asks for: ${missing.join(', ')}` : ''}`);
  }
  if (issues.length) console.log(`\nNotes:\n${issues.map((x) => `  - ${x}`).join('\n')}`);

  if (!apply) {
    console.log('\nDry run only: nothing was saved. Add --apply to save.');
  } else {
    const now = new Date().toISOString();
    for (const mobile of new Set(toAdd.filter((p) => p.login === 'new login').map((p) => p.mobile))) {
      await accounts.insertOne({ mobile, pathshalaId, password_hash: await bcrypt.hash(password, 10), created_at: now });
    }
    for (const p of toAdd) {
      await users.insertOne({
        pathshalaId, username: p.username, name: p.name, mobile: p.mobile, role: 'student',
        profile: p.profile, profile_updated_at: now, created_at: now,
      });
    }
    console.log(`\nSaved ${toAdd.length} students.`);
  }
} finally {
  await client.close();
}
