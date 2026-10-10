import DashboardShell from '@/components/DashboardShell';
import Notice from '@/components/Notice';
import { requireDeveloper } from '@/lib/auth';
import { listDeveloperApps } from '@/lib/queries';
import { formatDate } from '@/lib/format';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'My apps · Habesha Store', robots: { index: false } };

const NOTICES = {
  unpublished: ['success', 'App unpublished. It no longer appears in the store, and its link shows an unavailable page.'],
  published: ['success', 'App published. It is back in the store.'],
  created: ['success', 'App published. It is now in the store.'],
  saved: ['success', 'Changes saved.'],
  toolarge: ['danger', 'The files were too large, so nothing was saved. Use a 2 MB icon and screenshots of 5 MB or less.'],
  failed: ['danger', 'We could not save your app. Try again.'],
  missing: ['danger', 'We could not find that app in your account.'],
};

function RowMenu({ app }) {
  const live = app.status === 'published';
  return (
    <details className="menu">
      <summary className="btn btn--ghost btn--icon btn--sm" aria-label={`Actions for ${app.name}`}>
        <svg viewBox="0 0 20 20" width="18" height="18" fill="currentColor" aria-hidden="true"><circle cx="10" cy="4" r="1.6" /><circle cx="10" cy="10" r="1.6" /><circle cx="10" cy="16" r="1.6" /></svg>
      </summary>
      <div className="menu__list">
        <a className="menu__item" href={`/dashboard/apps/${app.id}/edit`}>Edit</a>
        <a className="menu__item" href={`/dashboard/apps/${app.id}/edit#release`}>Update version</a>
        <form method="post" action={`/api/apps/${app.id}/status`}>
          <input type="hidden" name="status" value={live ? 'unpublished' : 'published'} />
          <button className="menu__item" type="submit">{live ? 'Unpublish' : 'Publish again'}</button>
        </form>
      </div>
    </details>
  );
}

export default async function MyApps({ searchParams }) {
  const developer = await requireDeveloper('/dashboard/apps');
  const sp = await searchParams;
  const { apps, total, page, pages } = await listDeveloperApps(developer.id, sp.page);
  const key = sp.notice;
  const notice = Object.hasOwn(NOTICES, key) ? NOTICES[key] : null;

  return (
    <DashboardShell developer={developer} active="apps" title="My apps" text="Edit a listing, release a new version, or take it off the store." publish={total > 0}>
      {notice && <Notice tone={notice[0]} text={notice[1]} />}
      {total === 0 ? (
        <div className="state state--boxed">
          <h2 className="state__title">No apps yet</h2>
          <p className="state__text">Apps you publish are listed here, with their version, status and when you last changed them.</p>
          <div className="state__actions"><a className="btn btn--primary" href="/dashboard/apps/new">Publish app</a></div>
        </div>
      ) : (
        <table className="app-table">
          <caption className="visually-hidden">Your apps</caption>
          <thead>
            <tr>
              <th scope="col">App</th><th scope="col">Platform</th><th scope="col">Version</th>
              <th scope="col">Status</th><th scope="col">Updated</th><th scope="col"><span className="visually-hidden">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {apps.map((a) => (
              <tr key={a.id}>
                <th scope="row" className="app-table__app">
                  <div className={`app-icon app-icon--sm${a.icon_url ? '' : ' app-icon--fallback'}`} data-initial={a.name.trim().charAt(0).toUpperCase()}>
                    {a.icon_url && <img className="app-icon__img" src={a.icon_url} alt="" width="40" height="40" loading="lazy" data-name={a.name} />}
                  </div>
                  <a className="app-table__name" href={`/dashboard/apps/${a.id}/edit`}>{a.name}</a>
                </th>
                <td><span className={`badge badge--${a.platform}`}>{a.platform === 'ios' ? 'iOS' : 'Android'}</span></td>
                <td data-label="Version">{a.version || <span className="app-table__none">Not set</span>}</td>
                <td><span className={`badge badge--${a.status === 'published' ? 'success' : 'neutral'}`}>{a.status === 'published' ? 'Published' : 'Unpublished'}</span></td>
                <td data-label="Updated">{formatDate(a.updated_at)}</td>
                <td className="app-table__menu"><RowMenu app={a} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {pages > 1 && (
        <nav className="pager" aria-label="Pages">
          {page > 1 ? <a className="btn btn--secondary" href={`/dashboard/apps?page=${page - 1}`} rel="prev">Previous</a> : <span />}
          <span>Page {page} of {pages} ({total} apps)</span>
          {page < pages ? <a className="btn btn--secondary" href={`/dashboard/apps?page=${page + 1}`} rel="next">Next</a> : <span />}
        </nav>
      )}
    </DashboardShell>
  );
}
