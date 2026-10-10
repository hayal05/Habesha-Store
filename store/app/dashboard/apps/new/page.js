import DashboardShell from '@/components/DashboardShell';
import AppForm from '@/components/AppForm';
import Notice from '@/components/Notice';
import { FORM_ERRORS } from '@/lib/publish';
import { requireDeveloper } from '@/lib/auth';
import { listCategories } from '@/lib/queries';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Publish app · Habesha Store', robots: { index: false } };

export default async function NewApp({ searchParams }) {
  const developer = await requireDeveloper('/dashboard/apps/new');
  const code = (await searchParams).error;
  return (
    <DashboardShell developer={developer} active="new" title="Publish an app" text="Tell people what your app does and where to download it." publish={false}>
      {Object.hasOwn(FORM_ERRORS, code) && <Notice tone="danger" text={FORM_ERRORS[code]} />}
      <AppForm categories={await listCategories()} />
    </DashboardShell>
  );
}
