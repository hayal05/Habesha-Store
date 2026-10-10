import { notFound } from 'next/navigation';
import Header from '@/components/Header';
import AppUnavailable from '@/components/AppUnavailable';
import { getApp } from '@/lib/queries';
import { normalizeDownloadUrl, safeUrl } from '@/lib/links';
import { actionFor } from '@/lib/format';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Download · Habesha Store', robots: { index: false } };

export default async function GetPage({ params, searchParams }) {
  const { id } = await params;
  const s = (await searchParams).s;
  const app = await getApp(id);
  if (!app) notFound();
  const back = <a className="btn btn--secondary" href={`/apps/${app.id}`}>Back to {app.name}</a>;

  if (s === 'gone') return <AppUnavailable title="This file is unavailable" text="The download link no longer works. The developer may have moved or removed the file. You can report the listing if it stays broken.">{back}<a className="btn btn--ghost" href={`/apps/${app.id}/report`}>Report this listing</a></AppUnavailable>;
  if (s === 'restricted') return <AppUnavailable title="The developer has not shared this file" text="The link asks for a sign-in, so it is not public. Nothing was downloaded.">{back}<a className="btn btn--ghost" href={`/apps/${app.id}/report`}>Report this listing</a></AppUnavailable>;

  if (!app.download_url || !safeUrl(app.download_url)) notFound();
  const dest = normalizeDownloadUrl(app.download_url);
  const host = new URL(dest).hostname;
  const external = app.distribution === 'external';
  const action = actionFor(app.distribution);

  return (
    <>
      <Header />
      <main id="main" className="container container--narrow home">
        <div className="state state--boxed" role="status">
          <h1 className="state__title">{external ? 'You are leaving Habesha Store' : `Your download of ${app.name} is starting`}</h1>
          <p className="state__text">
            {external
              ? <>This link opens <strong>{host}</strong>, a site run by the developer. Habesha Store does not control it.</>
              : <>Your browser will show the progress. Only install apps from developers you trust.</>}
          </p>
          <div className="state__actions">
            {/* With JavaScript the file starts by itself; without it this button does the same job. */}
            <a className="btn btn--primary" href={dest} rel="noopener nofollow" {...(external ? {} : { 'data-autostart': '' })}>{external ? 'Continue' : action.label}</a>
            {back}
          </div>
          {!external && <p className="detail__hint">Did nothing happen? Use the button above to start the download again.</p>}
        </div>
      </main>
    </>
  );
}
