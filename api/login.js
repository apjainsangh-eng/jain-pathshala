import { MongoClient } from "mongodb";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const uri = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET;
const DB_NAME = process.env.DB_NAME || 'jainpathshala';

// Vercel cold start: keep client global across requests (node serverless best practice)
let client = null;

async function getDb() {
  if (!client) {
    client = new MongoClient(uri, { /* Use your SSL/TLS options if needed */ });
    await client.connect();
  }
  return client.db(DB_NAME);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "username & password required" });
  }

  const db = await getDb();
  const user = await db.collection('users').findOne({ username });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ id: user._id.toString(), username: user.username }, JWT_SECRET, { expiresIn: '8h' });

  res.json({ user: { id: user._id.toString(), name: user.username }, token });
}
