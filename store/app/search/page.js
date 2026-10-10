import BottomNav from '@/components/BottomNav';
import Header from '@/components/Header';
import AppCard from '@/components/AppCard';
import { searchApps } from '@/lib/queries';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Search apps · Habesha Store' };

const one = (v) => (Array.isArray(v) ? v[0] : v) || '';

export default async function SearchPage({ searchParams }) {
  const sp = await searchParams;
  const f = { q: one(sp.q), platform: one(sp.platform), category: one(sp.category), sort: one(sp.sort), page: one(sp.page) };
  const { apps, total, page, pages, categories } = await searchApps(f);
  const filtered = Boolean(f.q.trim() || f.platform || f.category);

  // Build a link that keeps the current filters and overrides some
  const href = (over) => {
    const p = new URLSearchParams();
    const next = { ...f, ...over };
    for (const k of ['q', 'platform', 'category', 'sort', 'page']) if (next[k] && !(k === 'page' && next[k] === 1)) p.set(k, next[k]);
    const s = p.toString();
    return s ? `/search?${s}` : '/search';
  };
  const sortLabel = { '': 'Recently updated', popular: 'Popular', name: 'Name A–Z' };
  const catName = categories.find((c) => c.slug === f.category)?.name;

  return (
    <>
      <Header q={f.q} platform={f.platform} tabs />
      <main id="main" className="container home has-tabbar">
        <div className="results-head">
          <h1 aria-live="polite">
            {f.q.trim() ? <>Results for “{f.q.trim()}”</> : catName ? catName : 'All apps'}
          </h1>
          <p className="results-count">{total} {total === 1 ? 'app' : 'apps'}{f.platform ? ` · ${f.platform === 'ios' ? 'iOS' : 'Android'}` : ''}</p>
        </div>

        <div className="results-bar">
          {categories.length > 0 && (
            <nav className="chips" aria-label="Categories">
              <a className="chip" href={href({ category: '', page: 1 })} aria-current={!f.category ? 'true' : undefined}>All</a>
              {categories.map((c) => (
                <a key={c.slug} className="chip" href={href({ category: c.slug, page: 1 })} aria-current={f.category === c.slug ? 'true' : undefined}>{c.name}</a>
              ))}
            </nav>
          )}
          <nav className="sort" aria-label="Sort by">
            {Object.entries(sortLabel).map(([v, label]) => (
              <a key={v} href={href({ sort: v, page: 1 })} aria-current={f.sort === v ? 'true' : undefined}>{label}</a>
            ))}
          </nav>
        </div>

        {apps.length ? (
          <>
            <h2 className="visually-hidden">Apps</h2>
            <div className="app-grid">{apps.map((a) => <AppCard key={a.id} app={a} />)}</div>
            {pages > 1 && (
              <nav className="pager" aria-label="Pages">
                {page > 1 ? <a className="btn btn--secondary" href={href({ page: page - 1 })} rel="prev">Previous</a> : <span />}
                <span>Page {page} of {pages}</span>
                {page < pages ? <a className="btn btn--secondary" href={href({ page: page + 1 })} rel="next">Next</a> : <span />}
              </nav>
            )}
          </>
        ) : (
          <div className="state state--boxed">
            <div className="state__icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5" /></svg></div>
            <h2 className="state__title">{f.q.trim() ? `No results for “${f.q.trim()}”` : 'No apps found'}</h2>
            <p className="state__text">{filtered ? 'Check the spelling, try a shorter search, or clear the platform and category filters.' : 'Published apps will appear here.'}</p>
            {filtered && <div className="state__actions"><a className="btn btn--secondary" href="/search">Clear search</a></div>}
          </div>
        )}
      </main>
      <BottomNav active="search" />
    </>
  );
}
