import { NextResponse } from 'next/server';
import { getDeveloper, sameOrigin, expiredPath } from '@/lib/auth';
import { getOwnApp, listCategories, toIds, checkScreenshotCount, saveApp } from '@/lib/queries';
import { parseApp } from '@/lib/publish';
import { picked, saveImage, saveImages, removeImage } from '@/lib/uploads';

export const dynamic = 'force-dynamic';

const MAX_BODY = 43 * 1048576;   // icon 2 MB + 8 screenshots at 5 MB, plus the text fields
const NOTICES = ['created', 'saved'];

// POST /api/apps/save: publishes a new app, or updates one when the form has a hidden "id". Owner-only.
// With "Accept: application/json" (ui.js) it answers with JSON; a plain form post gets a redirect, so the form works without JavaScript.
export async function POST(request) {
  if (!sameOrigin(request)) return new Response('Forbidden', { status: 403 });
  const wantsJson = request.headers.get('accept')?.includes('application/json');
  const go = (path) => NextResponse.redirect(new URL(path, request.url), 303);
  const fail = (status, message, errors = {}, redirect) => wantsJson ? NextResponse.json({ message, errors, ...([401, 404].includes(status) && { redirect }) }, { status }) : go(redirect);   // JSON only sends the browser away for sign-in or a missing app

  const developer = await getDeveloper();
  if (!developer) return fail(401, 'Your session expired. Sign in again to continue.', {}, expiredPath(request, '/dashboard/apps'));

  const size = Number(request.headers.get('content-length'));
  if (!size || size > MAX_BODY) return fail(413, 'The files are too large. Use a 2 MB icon and screenshots of 5 MB or less.', {}, '/dashboard/apps?notice=toolarge');
  let form;
  try { form = await request.formData(); } catch { return fail(400, 'We could not read that form. Try again.', {}, '/dashboard/apps?notice=failed'); }

  // Editing: the app must be the developer's own. Missing and someone else's give the same answer, so ids cannot be probed.
  const rawId = String(form.get('id') ?? '');
  const existing = rawId ? await getOwnApp(developer.id, rawId) : null;
  if (rawId && !existing) return fail(404, 'We could not find that app in your account.', {}, '/dashboard/apps?notice=missing');
  const back = existing ? `/dashboard/apps/${existing.id}/edit` : '/dashboard/apps/new';

  const { values, errors } = parseApp(form, existing, (await listCategories()).map((c) => c.id));
  const icon = form.get('icon');
  const shots = form.getAll('screenshots').filter(picked);
  const removed = toIds(form.getAll('removed_screenshot_ids'));
  if (!picked(icon) && !existing?.icon_url) errors.icon = 'Choose an app icon.';
  const tooMany = await checkScreenshotCount(existing?.id ?? null, removed, shots.length);
  if (tooMany) errors.screenshots = tooMany;
  const checkFail = () => fail(422, 'Check the highlighted fields and try again.', errors, `${back}?error=check`);
  if (Object.keys(errors).length) return checkFail();

  // Store the files (all or none), then write the rows; if anything fails, remove what was just stored.
  const newIcon = picked(icon) ? await saveImage(icon, { maxMb: 2, minPx: 512, square: true }) : {};
  if (newIcon.error) errors.icon = newIcon.error;
  const newShots = errors.icon ? {} : await saveImages(shots, { maxMb: 5 });
  if (newShots.error) errors.screenshots = newShots.error;
  const stored = [newIcon.url, ...(newShots.urls || [])].filter(Boolean);
  if (Object.keys(errors).length) { await Promise.all(stored.map(removeImage)); return checkFail(); }

  let result;
  try {
    result = await saveApp(developer.id, existing, { ...values, icon_url: newIcon.url ?? existing?.icon_url ?? null }, newShots.urls || [], removed);
  } catch (e) {
    console.error('save app failed', e);
    await Promise.all(stored.map(removeImage));
    return fail(500, 'We could not save your app. Try again.', {}, `${back}?error=failed`);
  }
  // Committed: the replaced icon and removed screenshots are no longer referenced.
  await Promise.all([...result.gone, newIcon.url && existing?.icon_url].map(removeImage));

  const notice = NOTICES[existing ? 1 : 0];
  const redirect = `/dashboard/apps?notice=${notice}`;
  return wantsJson ? NextResponse.json({ redirect, message: existing ? 'Changes saved. Redirecting…' : 'App published. Redirecting…' }) : go(redirect);
}
