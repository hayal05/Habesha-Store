import { notFound } from 'next/navigation';
import Header from '@/components/Header';
import { getApp, REPORT_REASONS } from '@/lib/queries';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Report a listing · Habesha Store' };

export default async function ReportPage({ params, searchParams }) {
  const { id } = await params;
  const sent = (await searchParams).sent === '1';
  const app = await getApp(id);
  if (!app) notFound();
  return (
    <>
      <Header />
      <main id="main" className="container container--narrow home">
        <nav className="crumbs"><a href={`/apps/${app.id}`}>← Back to {app.name}</a></nav>
        <h1 className="results-head">Report this listing</h1>
        {sent ? (
          <div className="alert alert--success" role="status"><div className="alert__body"><p className="alert__title">Report sent</p><p className="alert__text">Thank you. We will review the listing.</p></div></div>
        ) : (
          <form className="form" method="post" action="/api/report">
            <input type="hidden" name="app" value={app.id} />
            <div className="field">
              <label className="field__label" htmlFor="reason">What is wrong?</label>
              <select className="input" id="reason" name="reason" required defaultValue="">
                <option value="" disabled>Choose a reason</option>
                {Object.entries(REPORT_REASONS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div className="field">
              <label className="field__label" htmlFor="details">Details <span className="field__hint">(optional)</span></label>
              <textarea className="input" id="details" name="details" rows="4" maxLength="1000" />
            </div>
            <button className="btn btn--primary" type="submit">Send report</button>
          </form>
        )}
      </main>
    </>
  );
}
