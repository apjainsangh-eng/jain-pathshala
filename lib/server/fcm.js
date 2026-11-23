import crypto from 'crypto';

// Sends Android notifications through Firebase Cloud Messaging (HTTP v1).
// FIREBASE_SERVICE_ACCOUNT holds the service-account key from Firebase (the JSON file's text, or the same
// text in base64). Without it nothing is sent and the rest of the site works as before.

const cache = globalThis.__pathshalaFcm || (globalThis.__pathshalaFcm = { account: undefined, token: null, expires: 0 });

function serviceAccount() {
  if (cache.account !== undefined) return cache.account;
  const raw = (process.env.FIREBASE_SERVICE_ACCOUNT || '').trim();
  let account = null;
  if (raw) {
    try {
      account = JSON.parse(raw.startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8'));
      if (!account.client_email || !account.private_key || !account.project_id) account = null;
    } catch {
      account = null;
    }
    if (!account) console.warn('FIREBASE_SERVICE_ACCOUNT is set but is not a valid service-account key');
  }
  cache.account = account;
  return account;
}

export const pushEnabled = () => !!serviceAccount();

// Overridable only so tests can point at a fake server (like TELEGRAM_API_BASE)
const TOKEN_URL = () => process.env.GOOGLE_TOKEN_URL || 'https://oauth2.googleapis.com/token';
const FCM_BASE = () => process.env.FCM_API_BASE || 'https://fcm.googleapis.com';

const b64url = (v) => Buffer.from(typeof v === 'string' ? v : JSON.stringify(v)).toString('base64url');

async function fetchWithTimeout(url, options, ms = 5000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// Short-lived Google access token from the service account (cached for most of its hour)
async function accessToken() {
  if (cache.token && cache.expires > Date.now() + 60_000) return cache.token;
  const sa = serviceAccount();
  const now = Math.floor(Date.now() / 1000);
  const unsigned = `${b64url({ alg: 'RS256', typ: 'JWT' })}.${b64url({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',   // always Google's address, even when testing
    iat: now,
    exp: now + 3600,
  })}`;
  const signature = crypto.createSign('RSA-SHA256').update(unsigned).sign(sa.private_key, 'base64url');
  const res = await fetchWithTimeout(TOKEN_URL(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${unsigned}.${signature}` }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token) throw new Error(`Google token request failed (${res.status})`);
  cache.token = data.access_token;
  cache.expires = Date.now() + (data.expires_in || 3600) * 1000;
  return cache.token;
}

/**
 * Send one notification to each { token, title, body, channel, url }.
 * Returns the tokens Firebase says no longer exist (app removed, or logged out on a reinstall).
 */
export async function sendPush(messages) {
  if (!pushEnabled() || messages.length === 0) return [];
  const sa = serviceAccount();
  const auth = await accessToken();
  const dead = [];

  const sendOne = async (m) => {
    try {
      const res = await fetchWithTimeout(`${FCM_BASE()}/v1/projects/${sa.project_id}/messages:send`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${auth}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: {
            token: m.token,
            notification: { title: m.title, body: m.body },
            data: { url: m.url || '/' },
            // Icon and colour come from the app (expo-notifications sets them as the defaults)
            android: { priority: 'high', notification: { channel_id: m.channel || 'default' } },
          },
        }),
      });
      if (res.ok) return;
      const err = await res.json().catch(() => ({}));
      const code = err?.error?.details?.find((d) => d.errorCode)?.errorCode || err?.error?.status;
      if (res.status === 404 || code === 'UNREGISTERED' || code === 'INVALID_ARGUMENT') dead.push(m.token);
      else console.warn('Push failed:', res.status, code || '');
    } catch (error) {
      console.warn('Push failed:', error.message);
    }
  };

  // A few at a time, so an announcement to a big pathshala doesn't open hundreds of connections at once
  for (let i = 0; i < messages.length; i += 20) await Promise.all(messages.slice(i, i + 20).map(sendOne));
  return dead;
}
