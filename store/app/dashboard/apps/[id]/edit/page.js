import { redirect } from 'next/navigation';
import DashboardShell from '@/components/DashboardShell';
import AppForm from '@/components/AppForm';
import Notice from '@/components/Notice';
import { FORM_ERRORS } from '@/lib/publish';
import { requireDeveloper } from '@/lib/auth';
import { getOwnApp, listCategories } from '@/lib/queries';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Edit app · Habesha Store', robots: { index: false } };

export default async function EditApp({ params, searchParams }) {
  const { id } = await params;
  const code = (await searchParams).error;
  const developer = await requireDeveloper(`/dashboard/apps/${encodeURIComponent(id)}/edit`);
  // Missing and someone else's look the same, so ids cannot be probed
  const app = await getOwnApp(developer.id, id);
  if (!app) redirect('/dashboard/apps?notice=missing');
  return (
    <DashboardShell developer={developer} active="apps" title="Edit app" text={`Editing ${app.name}`} publish={false}>
      {Object.hasOwn(FORM_ERRORS, code) && <Notice tone="danger" text={FORM_ERRORS[code]} />}
      <AppForm app={app} categories={await listCategories()} />
    </DashboardShell>
  );
}
