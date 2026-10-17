import bcrypt from 'bcryptjs';
import { getGlobalCollection } from './db';

// A login account is one mobile number + password. It belongs to exactly one pathshala and
// opens every student who has that mobile number (siblings sharing a parent's phone).
// Admins are separate: they log in with the mobile number on their `admins` record.

export class AccountError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

// Accepts "98765 43210", "+91 9876543210", "09876543210" → "9876543210"
export function normalizeMobile(input) {
  if (input === undefined || input === null) return null;
  let digits = String(input).replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  return /^[6-9]\d{9}$/.test(digits) ? digits : null;
}

export const MIN_PASSWORD_LENGTH = 4;

export async function findAccount(mobile) {
  const accounts = await getGlobalCollection('accounts');
  return accounts.findOne({ mobile });
}

// Makes sure `mobile` has an account in this pathshala.
// - New number: needs `password`, or `fallbackHash` (the student's existing password, so they keep it).
// - Number already in this pathshala: the student joins that family; a given password replaces the family's.
// - Number used by another pathshala: rejected.
export async function ensureAccount({ mobile, pathshalaId, password, fallbackHash }) {
  const accounts = await getGlobalCollection('accounts');
  const existing = await accounts.findOne({ mobile });
  const now = new Date().toISOString();

  if (password && String(password).length < MIN_PASSWORD_LENGTH) {
    throw new AccountError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
  }

  if (existing) {
    if (existing.pathshalaId !== pathshalaId) {
      throw new AccountError('This mobile number is already registered with another pathshala', 409);
    }
    if (password) {
      await accounts.updateOne({ _id: existing._id }, { $set: { password_hash: await bcrypt.hash(String(password), 10), updated_at: now } });
    }
    return { created: false };
  }

  const password_hash = password ? await bcrypt.hash(String(password), 10) : fallbackHash;
  if (!password_hash) {
    throw new AccountError('Set a password for this new mobile number');
  }
  try {
    await accounts.insertOne({ mobile, pathshalaId, password_hash, created_at: now });
  } catch (e) {
    if (e.code === 11000) throw new AccountError('This mobile number was just registered; try again', 409);
    throw e;
  }
  return { created: true };
}

// Removes the account once no student in the pathshala uses the number any more
export async function removeAccountIfUnused(mobile, pathshalaId, usersCollection) {
  if (!mobile) return;
  const stillUsed = await usersCollection.countDocuments({ mobile });
  if (stillUsed === 0) {
    const accounts = await getGlobalCollection('accounts');
    await accounts.deleteOne({ mobile, pathshalaId });
  }
}

// Does `password` match this student's own password? (Their personal password from before
// mobile login, or one they set themselves.) Lets any family member log in on the family's number.
export async function memberPasswordMatches(user, password, passwordsCollection) {
  const saved = passwordsCollection ? await passwordsCollection.findOne({ username: user.username }) : null;
  if (saved?.password_hash && await bcrypt.compare(password, saved.password_hash)) return true;
  if (user.password_hash && await bcrypt.compare(password, user.password_hash)) return true;
  return !!user.password && String(user.password) === password;
}

// A student's existing password hash, used when they are first given a mobile number
export async function existingStudentHash(user, passwordsCollection) {
  const saved = passwordsCollection ? await passwordsCollection.findOne({ username: user.username }) : null;
  if (saved?.password_hash) return saved.password_hash;
  if (user.password_hash) return user.password_hash;
  if (user.password) return bcrypt.hash(String(user.password), 10);
  return null;
}
