import crypto from 'node:crypto';
import { promisify } from 'node:util';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { query, row } from './db';

const scrypt = promisify(crypto.scrypt);
const COOKIE = 'hs_session';
const SESSION_DAYS = 7;
const WINDOW = 15 * 60 * 1000;
const SCRYPT = { N: 2 ** 15, r: 8, p: 3, maxmem: 96 * 1024 * 1024 };   // OWASP-recommended cost, about 32 MB per hash
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;                          // keep in sync with the check in ui.js

export const AUTH_ERRORS = {
  invalid: 'Email or password is incorrect.',
  exists: 'An account with this email already exists.',
  busy: 'Too many attempts. Wait a few minutes and try again.',
  check: 'Check the highlighted fields and try again.',
  expired: 'Your session expired. Sign in again to continue.',
};

// Only same-site paths: no "//host", no backslashes, no control characters (URL parsing strips tabs and newlines).
export const safeNext = (n) => (typeof n === 'string' && /^\/(?![/\\])[^\x00-\x1f]*$/.test(n) ? n : '/dashboard');

export async function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const key = await scrypt(password.normalize('NFKC'), salt, 64, SCRYPT);
  return `${salt.toString('hex')}:${key.toString('hex')}`;
}
export async function verifyPassword(password, stored) {
  const [salt, key] = stored.split(':');
  const actual = await scrypt(password.normalize('NFKC'), Buffer.from(salt, 'hex'), 64, SCRYPT);
  return crypto.timingSafeEqual(actual, Buffer.from(key, 'hex'));
}
// Unknown emails are checked against this so a failed sign-in takes the same time either way.
let dummy;
export const fakeHash = () => (dummy ||= hashPassword('not-a-real-password'));

// Same rules (and messages) as the browser checks in ui.js. Sign-in only needs a password, not a strong one.
export function validate(mode, { name, email, password }) {
  const errors = {};
  if (mode === 'signup') {
    if (!name) errors.name = 'Enter your name.';
    else if (name.length < 2) errors.name = 'Use at least 2 characters.';
    else if (name.length > 60) errors.name = 'Use 60 characters or fewer.';
  }
  if (!email) errors.email = 'Enter your email.';
  else if (email.length > 254 || !EMAIL.test(email)) errors.email = 'Enter a valid email address.';
  if (!password) errors.password = 'Enter your password.';
  else if (mode === 'signup' && password.length < 8) errors.password = 'Use at least 8 characters.';
  else if (password.length > 128) errors.password = 'Use 128 characters or fewer.';
  return errors;
}

// In-memory attempt counter: slows guessing on one server. It resets on restart and is not shared between instances.
const hits = (globalThis.__authHits ||= new Map());
export function tooMany(key, max) {
  const now = Date.now();
  const recent = (hits.get(key) || []).filter((t) => now - t < WINDOW);
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) for (const [k, v] of hits) if (now - v.at(-1) > WINDOW) hits.delete(k);
  return recent.length > max;
}

export const forgive = (key) => hits.delete(key);   // a successful sign-in clears that account's failed-attempt count

const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');

export async function startSession(response, developerId) {
  const token = crypto.randomBytes(32).toString('base64url');
  await query('DELETE FROM sessions WHERE expires_at < $1', [Date.now()]);
  await query('INSERT INTO sessions (token_hash, developer_id, expires_at) VALUES ($1, $2, $3)', [sha(token), developerId, Date.now() + SESSION_DAYS * 864e5]);
  response.cookies.set(COOKIE, token, {
    httpOnly: true, sameSite: 'lax', path: '/', maxAge: SESSION_DAYS * 86400,
    secure: process.env.NODE_ENV === 'production',
  });
}

export async function endSession(request, response) {
  const token = request.cookies.get(COOKIE)?.value;
  if (token) await query('DELETE FROM sessions WHERE token_hash = $1', [sha(token)]);
  response.cookies.delete(COOKIE);
}

// The signed-in developer, or null (no cookie, unknown token, or expired). Used by pages and, later, the dashboard.
export async function getDeveloper() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  return row(`SELECT d.id, d.name, d.email FROM sessions s JOIN developers d ON d.id = s.developer_id
              WHERE s.token_hash = $1 AND s.expires_at > $2`, [sha(token), Date.now()]);
}

// POSTs must come from this site (blocks cross-site form posts). A missing Origin header is allowed (same-site navigation, curl).
export function sameOrigin(request) {
  const origin = request.headers.get('origin')?.replace(/^https?:\/\//, '');
  return origin === undefined || origin === request.headers.get('host');
}

// Sign-in address that brings the person back to `next`. `expired` adds the warning: it is only true when a session cookie was
// sent but no longer matches a session, so a first visit to a dashboard page gets no "session expired" message.
export const signInPath = (next, expired) => `/signin?${expired ? 'expired=1&' : ''}next=${encodeURIComponent(next)}`;

// Guard for dashboard pages: the signed-in developer, or a redirect to sign-in that brings them back to `path`.
export async function requireDeveloper(path) {
  const dev = await getDeveloper();
  if (!dev) redirect(signInPath(path, (await cookies()).has(COOKIE)));
  return dev;
}

// Same for POST routes: sign-in address that returns to the dashboard page the form was on (from Referer, same host only), else `fallback`.
export function expiredPath(request, fallback) {
  let back = fallback;
  try {
    const from = new URL(request.headers.get('referer'));
    if (from.host === request.headers.get('host') && /^\/dashboard(\/|$)/.test(from.pathname)) back = safeNext(from.pathname);
  } catch {}
  return signInPath(back, request.cookies.has(COOKIE));
}
