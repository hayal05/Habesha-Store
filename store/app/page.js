import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import AppSection from '@/components/AppSection';
import { getHomeData } from '@/lib/queries';

export const dynamic = 'force-dynamic'; // always read live database data

export default async function Home() {
  const { categories, popular, recent, featured } = await getHomeData();
  const empty = !recent.length;

  return (
    <>
      <Header tabs />
      <main id="main" className="container home has-tabbar">
        <section className="intro" aria-labelledby="intro-title">
          <h1 id="intro-title">Apps for Android and iOS</h1>
          <p>Find an app, check who made it, and download it from the developer’s own link.</p>
        </section>

        {categories.length > 0 && (
          <nav className="chips" aria-label="Categories">
            {categories.map((c) => (
              <a key={c.slug} className="chip" href={`/search?category=${encodeURIComponent(c.slug)}`}>
                {c.name} <span>{c.count}</span>
              </a>
            ))}
          </nav>
        )}

        {empty ? (
          <div className="state state--boxed">
            <h2 className="state__title">No apps published yet</h2>
            <p className="state__text">Published apps will appear here. Developers can add the first one in a minute.</p>
            <div className="state__actions"><a className="btn btn--primary" href="/dashboard/apps/new">Publish app</a></div>
          </div>
        ) : (
          <>
            <AppSection id="featured" title="Featured" apps={featured} />
            <AppSection id="popular" title="Popular" apps={popular} href="/search?sort=popular" />
            <AppSection id="recent" title="Recently updated" apps={recent} href="/search?sort=recent" />
          </>
        )}
      </main>
      <BottomNav active="home" />
    </>
  );
}
