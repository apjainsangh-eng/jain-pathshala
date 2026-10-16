import crypto from 'crypto';

// Tokens are `base64url(payload).base64url(HMAC-SHA256(payload))`.
// The old backend issued unsigned base64 JSON, so anyone could forge `role: "admin"`.
// Old tokens fail verification here, which logs those users out once.

const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

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
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + TOKEN_TTL_MS })).toString('base64url');
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
