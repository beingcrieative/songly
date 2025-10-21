import crypto from 'crypto';

const COOKIE_NAME = 'APP_SESSION';
const DEFAULT_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

function getSecret() {
  return process.env.SESSION_SECRET || process.env.NEXTAUTH_SECRET || 'dev-secret-change-me';
}

function b64url(input: Buffer | string) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function sign(payload: object) {
  const secret = getSecret();
  const header = { alg: 'HS256', typ: 'JWT' };
  const p1 = b64url(Buffer.from(JSON.stringify(header)));
  const p2 = b64url(Buffer.from(JSON.stringify(payload)));
  const data = `${p1}.${p2}`;
  const sig = crypto.createHmac('sha256', secret).update(data).digest();
  return `${data}.${b64url(sig)}`;
}

function verify(token: string): any | null {
  const secret = getSecret();
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [p1, p2, s] = parts;
  const data = `${p1}.${p2}`;
  const expected = b64url(crypto.createHmac('sha256', secret).update(data).digest());
  if (expected !== s) return null;
  try {
    const payload = JSON.parse(Buffer.from(p2, 'base64').toString('utf8'));
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export function createSessionCookie(user: { id: string; email?: string | null }, ttlMs: number = DEFAULT_TTL_MS) {
  const payload = {
    sub: user.id,
    email: user.email || null,
    iat: Date.now(),
    exp: Date.now() + ttlMs,
  };
  const token = sign(payload);
  const cookie = `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${Math.floor(
    ttlMs / 1000,
  )}`;
  return { cookie, token };
}

export function parseSessionFromRequest(req: Request) {
  const cookieHeader = req.headers.get('cookie') || '';
  const cookies = Object.fromEntries(
    cookieHeader.split(';').map((c) => {
      const i = c.indexOf('=');
      if (i === -1) return [c.trim(), ''];
      return [c.slice(0, i).trim(), c.slice(i + 1)];
    }),
  );
  const token = cookies[COOKIE_NAME];
  if (!token) return null;
  const payload = verify(token);
  if (!payload || !payload.sub) return null;
  return { userId: String(payload.sub), email: payload.email as string | null };
}

export function clearSessionCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export const session = { createSessionCookie, parseSessionFromRequest, clearSessionCookie };

