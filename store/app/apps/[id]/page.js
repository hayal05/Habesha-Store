import { notFound } from 'next/navigation';
import Header from '@/components/Header';
import DownloadAction from '@/components/DownloadAction';
import AppUnavailable from '@/components/AppUnavailable';
import { getApp, isUnpublished } from '@/lib/queries';
import { actionFor, formatDate, formatSize } from '@/lib/format';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const pid = (await params).id;
  const app = await getApp(pid);
  if (!app && await isUnpublished(pid)) return { title: 'App unavailable · Habesha Store', robots: { index: false } };
  return { title: app ? `${app.name} · Habesha Store` : 'App not found · Habesha Store', description: app?.summary || undefined };
}

export default async function AppPage({ params }) {
  const { id } = await params;
  const app = await getApp(id);
  if (!app) {
    if (await isUnpublished(id)) return <AppUnavailable title="This app is no longer available" text="The developer has unpublished it. You can find other apps in the store." />;
    notFound();
  }

  const action = actionFor(app.distribution);
  const isIos = app.platform === 'ios';
  const stats = [
    ['Version', app.version],
    ['Size', formatSize(app.file_size)],
    ['Requires', app.min_os],
    ['Updated', formatDate(app.updated_at)],
  ].filter(([, v]) => v);
  const paragraphs = app.description.split(/\n{2,}/).map((t) => t.trim()).filter(Boolean);

  return (
    <>
      <Header />
      <main id="main" className="container home detail">
        <nav className="crumbs" aria-label="Breadcrumb">
          <a href="/">Home</a>
          {app.category && <> <span aria-hidden="true">/</span> <a href={`/search?category=${encodeURIComponent(app.category_slug)}`}>{app.category}</a></>}
        </nav>

        <header className="detail__head">
          <div className={`app-icon app-icon--lg${app.icon_url ? '' : ' app-icon--fallback'}`} data-initial={app.name.trim().charAt(0).toUpperCase()}>
            {app.icon_url && <img className="app-icon__img" src={app.icon_url} alt="" width="96" height="96" data-name={app.name} />}
          </div>
          <div className="detail__title">
            <h1 title={app.name}>{app.name}</h1>
            <p className="detail__dev">{app.developer}</p>
            <p className="detail__badges">
              <span className={`badge badge--${app.platform}`}>{isIos ? 'iOS' : 'Android'}</span>
              <span className="badge badge--neutral">{action.kind}</span>
            </p>
          </div>
          <div className="detail__cta">
            <DownloadAction app={app} action={action} />
          </div>
        </header>

        {stats.length > 0 && (
          <dl className="stats">
            {stats.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
          </dl>
        )}

        {app.screenshots.length > 0 && (
          <section className="detail__section" aria-labelledby="shots">
            <h2 id="shots">Screenshots</h2>
            <ul className="shots" tabIndex={0} aria-label={`${app.name} screenshots, scroll sideways`}>
              {app.screenshots.map((s, i) => (
                <li key={s.id}><img src={s.url} alt={`${app.name} screenshot ${i + 1} of ${app.screenshots.length}`} loading="lazy" /></li>
              ))}
            </ul>
          </section>
        )}

        <section className="detail__section" aria-labelledby="about">
          <h2 id="about">About this app</h2>
          {app.summary && <p className="detail__summary">{app.summary}</p>}
          {paragraphs.map((t, i) => <p key={i} className="prose">{t}</p>)}
          {!app.summary && !paragraphs.length && <p className="detail__hint">The developer has not added a description.</p>}
        </section>

        <p className="detail__report"><a href={`/apps/${app.id}/report`}>Report this listing</a></p>

        {/* Mobile only. Sits at the end of the page flow with position: sticky, so it never covers content. */}
        <div className="action-bar"><DownloadAction app={app} action={action} /></div>
      </main>
    </>
  );
}
