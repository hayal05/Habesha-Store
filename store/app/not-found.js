import Header from '@/components/Header';

export default function NotFound() {
  return (
    <>
      <Header />
      <main id="main" className="container home">
        <div className="state state--boxed">
          <h1 className="state__title">We couldn’t find that page</h1>
          <p className="state__text">The app may have been unpublished, or the link may be wrong.</p>
          <div className="state__actions"><a className="btn btn--primary" href="/">Back to store</a></div>
        </div>
      </main>
    </>
  );
}
