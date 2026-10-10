import { addReport } from '@/lib/queries';

export async function POST(request) {
  const form = await request.formData();
  const id = String(form.get('app') || '');
  const ok = await addReport(id, String(form.get('reason') || ''), form.get('details'));
  const to = ok ? `/apps/${id}/report?sent=1` : `/apps/${id}/report`;
  return Response.redirect(new URL(to, request.url), 303);
}
