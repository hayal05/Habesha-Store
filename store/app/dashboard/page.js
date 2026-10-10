import DashboardShell from '@/components/DashboardShell';
import { requireDeveloper } from '@/lib/auth';
import { getOverview } from '@/lib/queries';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Dashboard · Habesha Store', robots: { index: false } };

const n = (v) => v.toLocaleString('en-US');

export default async function Dashboard() {
  const developer = await requireDeveloper('/dashboard');
  const o = await getOverview(developer.id);
  const stats = [
    ['Published apps', o.published, o.apps > o.published ? `${n(o.apps - o.published)} unpublished` : 'Visible in the store'],
    ['Download clicks', o.clicks, 'All time'],
    ['Last 30 days', o.recent, 'Download clicks'],
  ];
  return (
    <DashboardShell developer={developer} active="overview" title="Overview" text="Your listings and how often people tap Download." publish={o.apps > 0}>
      {o.apps === 0 ? (
        <div className="state state--boxed">
          <h2 className="state__title">Publish your first app</h2>
          <p className="state__text">Add an Android APK link, or point to your App Store or TestFlight page. It appears in the store as soon as you publish.</p>
          <div className="state__actions"><a className="btn btn--primary" href="/dashboard/apps/new">Publish app</a></div>
        </div>
      ) : (
        <>
          <dl className="kpis">
            {stats.map(([label, value, note]) => (
              <div className="kpi" key={label}>
                <dt className="kpi__label">{label}</dt>
                <dd className="kpi__value">{n(value)}</dd>
                <dd className="kpi__note">{note}</dd>
              </div>
            ))}
          </dl>
          <p className="kpis__foot">A click is a tap on Download that sent the visitor to your link. It does not mean the download finished, because your file is hosted by you.</p>
        </>
      )}
    </DashboardShell>
  );
}
