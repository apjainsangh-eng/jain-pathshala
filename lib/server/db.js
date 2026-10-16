import { MongoClient } from 'mongodb';
import { currentPathshalaId } from './tenant';

// Cache the client across hot reloads (dev) and warm serverless invocations (prod)
const globalCache = globalThis.__pathshalaMongo || (globalThis.__pathshalaMongo = { client: null, db: null, connecting: null });

export async function connectToDatabase() {
  if (globalCache.db) return globalCache.db;

  const uri = process.env.MONGODB_URI;
  const dbName = process.env.DB_NAME || 'pathshala';

  if (!uri) {
    console.error('MONGODB_URI is not set');
    return null;
  }

  try {
    if (!globalCache.connecting) {
      globalCache.client = new MongoClient(uri);
      globalCache.connecting = globalCache.client.connect();
    }
    await globalCache.connecting;
    globalCache.db = globalCache.client.db(dbName);
    return globalCache.db;
  } catch (error) {
    console.error('MongoDB error:', error);
    globalCache.connecting = null;
    return null;
  }
}

// Collections whose documents belong to one pathshala. Every document carries `pathshalaId`.
export const TENANT_COLLECTIONS = [
  'users', 'attendance', 'gatha', 'pending_attendance', 'pending_gatha', 'family_groups',
  'audit_log', 'activity_types', 'admin_notes', 'profiles', 'passwords', 'achievements',
];

// Wraps a collection so every read, write and aggregate is limited to one pathshala.
// Only the methods listed here exist on the wrapper; anything else fails loudly instead of leaking across pathshalas.
function scopeCollection(col, pathshalaId) {
  const scoped = (filter = {}) => ({ ...filter, pathshalaId });
  const stamp = (doc) => ({ ...doc, pathshalaId });

  return {
    collectionName: col.collectionName,
    find: (filter, options) => col.find(scoped(filter), options),
    findOne: (filter, options) => col.findOne(scoped(filter), options),
    countDocuments: (filter, options) => col.countDocuments(scoped(filter), options),
    distinct: (key, filter, options) => col.distinct(key, scoped(filter), options),
    aggregate: (pipeline = [], options) => col.aggregate([{ $match: { pathshalaId } }, ...pipeline], options),
    insertOne: (doc, options) => col.insertOne(stamp(doc), options),
    insertMany: (docs, options) => col.insertMany(docs.map(stamp), options),
    updateOne: (filter, update, options) => col.updateOne(scoped(filter), update, options),
    updateMany: (filter, update, options) => col.updateMany(scoped(filter), update, options),
    replaceOne: (filter, doc, options) => col.replaceOne(scoped(filter), stamp(doc), options),
    findOneAndUpdate: (filter, update, options) => col.findOneAndUpdate(scoped(filter), update, options),
    findOneAndDelete: (filter, options) => col.findOneAndDelete(scoped(filter), options),
    deleteOne: (filter, options) => col.deleteOne(scoped(filter), options),
    deleteMany: (filter, options) => col.deleteMany(scoped(filter), options),
  };
}

// Pathshala data. Must be called while handling a request for a specific pathshala.
export async function getCollection(name) {
  const db = await connectToDatabase();
  if (!db) return null;

  if (!TENANT_COLLECTIONS.includes(name)) {
    throw new Error(`getCollection('${name}') is not a pathshala collection; use getGlobalCollection`);
  }
  const pathshalaId = currentPathshalaId();
  if (!pathshalaId) {
    throw new Error(`getCollection('${name}') called outside a pathshala context`);
  }
  return scopeCollection(db.collection(name), pathshalaId);
}

// Platform-wide data (pathshalas, admins) and unscoped access for the super admin and scripts.
export async function getGlobalCollection(name) {
  const db = await connectToDatabase();
  return db ? db.collection(name) : null;
}
