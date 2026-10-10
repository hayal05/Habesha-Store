import { NextResponse } from 'next/server';
import { redirectTo } from '@/lib/redirect';
import { row } from '@/lib/db';
import { AUTH_ERRORS, validate, hashPassword, verifyPassword, fakeHash, tooMany, forgive, startSession, endSession, safeNext, sameOrigin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// POST /api/auth/signin | signup | signout. With "Accept: application/json" (ui.js) it answers with JSON;
// a plain form post gets a redirect, so the forms also work without JavaScript.
export async function POST(request, { params }) {
  const { action } = await params;
  if (!['signin', 'signup', 'signout'].includes(action)) return new Response('Not found', { status: 404 });
  if (!sameOrigin(request)) return new Response('Forbidden', { status: 403 });

  const go = (path) => redirectTo(path);
  if (action === 'signout') { const res = go('/'); await endSession(request, res); return res; }

  const wantsJson = request.headers.get('accept')?.includes('application/json');
  const form = await request.formData();
  const field = (k) => String(form.get(k) ?? '');
  const next = safeNext(field('next'));
  const keep = next === '/dashboard' ? '' : `&next=${encodeURIComponent(next)}`;
  const fail = (status, code, errors = {}) => wantsJson
    ? NextResponse.json({ message: AUTH_ERRORS[code], errors }, { status })
    : go(`/${action}?error=${code}${keep}`);

  const email = field('email').trim().toLowerCase();
  const input = { name: field('name').trim().replace(/\s+/g, ' '), email, password: field('password') };
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'local';   // only trustworthy behind your own proxy
  if (tooMany(`${action}:${ip}`, 30) || (action === 'signin' && tooMany(`signin:${ip}:${email}`, 8))) return fail(429, 'busy');

  const errors = validate(action, input);
  if (Object.keys(errors).length) return fail(422, 'check', errors);

  let id;
  if (action === 'signin') {
    const dev = await row('SELECT id, password_hash FROM developers WHERE email = $1', [email]);
    const ok = await verifyPassword(input.password, dev ? dev.password_hash : await fakeHash());
    if (!dev || !ok) return fail(401, 'invalid');   // same answer for "no such email" and "wrong password"
    forgive(`signin:${ip}:${email}`);
    id = dev.id;
  } else {
    try {
      const hash = await hashPassword(input.password);
      id = (await row('INSERT INTO developers (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id', [input.name, email, hash])).id;
    } catch (e) {
      if (e.code === '23505') return fail(409, 'exists', { email: AUTH_ERRORS.exists });   // unique violation: the email is taken
      throw e;
    }
  }

  const res = wantsJson
    ? NextResponse.json({ redirect: next, message: action === 'signin' ? 'Signed in. Redirecting…' : 'Account created. Redirecting…' })
    : go(next);
  await startSession(res, id);
  return res;
}
