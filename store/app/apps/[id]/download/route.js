import { redirectTo } from '@/lib/redirect';
import { getApp, recordClick } from '@/lib/queries';
import { checkLink, normalizeDownloadUrl, safeUrl } from '@/lib/links';

export const dynamic = 'force-dynamic';

// Checks the link, records one click only if the visitor is really sent on, then continues to the right state.
export async function GET(request, { params }) {
  const { id } = await params;
  const go = (path, status = 303) => redirectTo(path, status);
  const app = await getApp(id);
  if (!app) return go(`/apps/${id}`);                                   // unpublished or missing: the details page explains
  if (!app.download_url || !safeUrl(app.download_url)) return go(`/apps/${app.id}/get?s=gone`);

  const dest = normalizeDownloadUrl(app.download_url);
  const status = await checkLink(dest);
  if (status === 'gone' || status === 'restricted') return go(`/apps/${app.id}/get?s=${status}`);

  await recordClick(app.id);
  // App Store and TestFlight links open their own app, so no waiting page is needed.
  if (app.distribution === 'app_store' || app.distribution === 'testflight') return Response.redirect(dest, 302);
  return go(`/apps/${app.id}/get?s=started`);
}
