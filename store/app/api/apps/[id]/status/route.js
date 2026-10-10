import { redirectTo } from '@/lib/redirect';
import { getDeveloper, sameOrigin, expiredPath } from '@/lib/auth';
import { setAppStatus } from '@/lib/queries';

export const dynamic = 'force-dynamic';

// POST /api/apps/:id/status  (field "status": published | unpublished). Only the owner can change an app.
export async function POST(request, { params }) {
  if (!sameOrigin(request)) return new Response('Forbidden', { status: 403 });
  const go = (path) => redirectTo(path);
  const developer = await getDeveloper();
  if (!developer) return go(expiredPath(request, '/dashboard/apps'));
  const status = String((await request.formData()).get('status') ?? '');
  const { id } = await params;
  return go(`/dashboard/apps?notice=${(await setAppStatus(developer.id, id, status)) ? status : 'missing'}`);
}
