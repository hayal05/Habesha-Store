import { notFound } from 'next/navigation';
import Header from '@/components/Header';
import DetailBar from '@/components/DetailBar';
import DownloadAction from '@/components/DownloadAction';
import AppUnavailable from '@/components/AppUnavailable';
import AppRail from '@/components/AppRail';
import AppQr from '@/components/AppQr';
import { getApp, getMoreByDeveloper, getSimilarApps, isUnpublished } from '@/lib/queries';
import { actionFor, formatDate, formatDownloads, formatSize } from '@/lib/format';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const pid = (await params).id;
  const app = await getApp(pid);
  if (!app && await isUnpublished(pid)) return { title: 'App unavailable · Habesha Store', robots: { index: false } };
  return { title: app ? `${app.name} · Habesha Store` : 'App not found · Habesha Store', description: app?.summary || undefined };
}

const SHARE_ICON = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="6" cy="12" r="2.5" /><circle cx="17.5" cy="6" r="2.5" /><circle cx="17.5" cy="18" r="2.5" /><path d="M8.2 10.8l7-3.6M8.2 13.2l7 3.6" /></svg>;
const FLAG_ICON = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 21V4M5 4h11l-1.5 4L16 12H5" /></svg>;

export default async function AppPage({ params }) {
  const { id } = await params;
  const app = await getApp(id);
  if (!app) {
    if (await isUnpublished(id)) return <AppUnavailable title="This app is no longer available" text="The developer has unpublished it. You can find other apps in the store." />;
    notFound();
  }

  const [more, similar] = await Promise.all([getMoreByDeveloper(app), getSimilarApps(app)]);
  const action = actionFor(app.distribution);
  const isIos = app.platform === 'ios';
  const updated = formatDate(app.updated_at);
  // Play-style strip: big value on top, small caption below. Only what we really know.
  const stats = [
    [formatSize(app.file_size), 'Size'],
    [app.version, 'Version'],
    [formatDownloads(app.downloads), 'Downloads'],   // sits in the middle of the strip, between Size and Updated
    [app.min_os, 'Requires'],
    [updated, 'Updated'],
  ].filter(([v]) => v);
  const paragraphs = app.description.split(/\n{2,}/).map((t) => t.trim()).filter(Boolean);
  const info = [
    ['Version', app.version], ['Downloads', formatDownloads(app.downloads)], ['Updated on', updated], ['Requires', app.min_os], ['Size', formatSize(app.file_size)],
    ['Platform', isIos ? 'iOS' : 'Android'], ['Get it from', action.kind], ['Offered by', app.developer],
  ].filter(([, v]) => v);

  return (
    <>
      <Header desktopOnly />
      <DetailBar />
      <main id="main" className="container home detail">
        <div className="detail-layout">
          <div className="detail-main">
            <header className="hero">
              <div className={`app-icon hero__icon${app.icon_url ? '' : ' app-icon--fallback'}`} data-initial={app.name.trim().charAt(0).toUpperCase()}>
                {app.icon_url && <img className="app-icon__img" src={app.icon_url} alt="" width="128" height="128" data-name={app.name} />}
              </div>
              <div className="hero__text">
                <h1 title={app.name}>{app.name}</h1>
                <p className="hero__dev">{app.developer}</p>
                <p className="hero__meta">
                  {app.category && <><a href={`/search?category=${encodeURIComponent(app.category_slug)}`}>{app.category}</a> · </>}
                  {isIos ? 'iOS' : 'Android'}
                </p>
              </div>
            </header>

            {stats.length > 0 && (
              <dl className="statbar" aria-label="App facts">
                {stats.map(([v, k]) => <div key={k}><dd>{v}</dd><dt>{k}</dt></div>)}
              </dl>
            )}

            <div className="hero__cta" data-cta-anchor>
              <div className="hero__buttons">
                <DownloadAction app={app} action={action} />
              </div>
              <div className="hero__more">
                <button className="textbtn" type="button" data-share data-title={app.name}>{SHARE_ICON}<span>Share</span></button>
                <AppQr app={app} />
              </div>
            </div>

            {app.screenshots.length > 0 && (
              <section className="detail__section" aria-labelledby="shots">
                <h2 id="shots" className="visually-hidden">Screenshots</h2>
                <ul className="shots" tabIndex={0} aria-label={`${app.name} screenshots, scroll sideways`}>
                  {app.screenshots.map((s, i) => (
                    <li key={s.id}><a href={s.url} target="_blank" rel="noopener"><img src={s.url} alt={`${app.name} screenshot ${i + 1} of ${app.screenshots.length}`} loading="lazy" /></a></li>
                  ))}
                </ul>
              </section>
            )}

            <section className="detail__section" aria-labelledby="about">
              <h2 id="about">About this app</h2>
              <div className="about" data-clamp>
                {app.summary && <p className="detail__summary">{app.summary}</p>}
                {paragraphs.map((t, i) => <p key={i} className="prose">{t}</p>)}
                {!app.summary && !paragraphs.length && <p className="detail__hint">The developer has not added a description.</p>}
              </div>
              <button className="textbtn textbtn--link" type="button" data-clamp-toggle aria-expanded="false" hidden>Read more</button>
              {app.category && <p className="tags"><a className="tag" href={`/search?category=${encodeURIComponent(app.category_slug)}`}>{app.category}</a></p>}
            </section>

            <section className="detail__section" aria-labelledby="info">
              <h2 id="info">App info</h2>
              <dl className="info">
                {info.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
              </dl>
            </section>

          </div>

          <aside className="detail-side" aria-label="Related apps">
            <AppRail id="more" title={`More by ${app.developer}`} apps={more} />
            <AppRail id="similar" title="Similar apps" apps={similar} />
          </aside>
        </div>

        <p className="detail__report"><a href={`/apps/${app.id}/report`}>{FLAG_ICON}<span>Report this app</span></a></p>

        {/* Phones: appears once the main button has scrolled away. Sits at the end of the page flow, so it never covers content. */}
        <div className="action-bar"><DownloadAction app={app} action={action} /></div>
      </main>
    </>
  );
}
