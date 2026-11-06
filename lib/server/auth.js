import crypto from 'crypto';

// Tokens are `base64url(payload).base64url(HMAC-SHA256(payload))`.
// The old backend issued unsigned base64 JSON, so anyone could forge `role: "admin"`.
// Old tokens fail verification here, which logs those users out once.

const DAY_MS = 24 * 60 * 60 * 1000;
// Students and admins stay signed in for 90 days, and the app renews the token when it is opened
// (POST /session/renew), so someone who uses it at least once in 90 days never has to log in again.
// The super admin, and a super admin who opened a pathshala's admin panel, keep 7 days and no renewal.
const LONG_TTL_MS = 90 * DAY_MS;
const SHORT_TTL_MS = 7 * DAY_MS;
export const RENEW_AFTER_MS = DAY_MS;   // renew at most once a day

export function isLongLived(payload) {
  return payload.role !== 'superadmin' && !payload.impersonatedBy;
}

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET must be set to a random string of at least 32 characters');
  }
  return secret;
}

function sign(data) {
  return crypto.createHmac('sha256', getSecret()).update(data).digest('base64url');
}

export function createToken(payload) {
  const { exp: _oldExp, iat: _oldIat, ...rest } = payload;
  const now = Date.now();
  const ttl = isLongLived(rest) ? LONG_TTL_MS : SHORT_TTL_MS;
  const body = Buffer.from(JSON.stringify({ ...rest, iat: now, exp: now + ttl })).toString('base64url');
  return `${body}.${sign(body)}`;
}

export function verifyToken(token) {
  try {
    const [body, signature] = String(token).split('.');
    if (!body || !signature) return null;

    const expected = Buffer.from(sign(body));
    const given = Buffer.from(signature);
    if (expected.length !== given.length || !crypto.timingSafeEqual(expected, given)) return null;

    const data = JSON.parse(Buffer.from(body, 'base64url').toString());
    return data.exp > Date.now() ? data : null;
  } catch (e) {
    return null;
  }
}

// Returns the user, or an { status, error } object to send back
export function authenticate(req) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return { status: 401, error: 'Token required' };

  const user = verifyToken(token);
  if (!user) return { status: 401, error: 'Invalid token' };

  return { user };
}
