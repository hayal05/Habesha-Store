import Header from './Header';

// Shared full-page state for listings that are not available.
export default function AppUnavailable({ title, text, children }) {
  return (
    <>
      <Header />
      <main id="main" className="container home">
        <div className="state state--boxed">
          <div className="state__icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5v5M12 16v.01" /></svg></div>
          <h1 className="state__title">{title}</h1>
          <p className="state__text">{text}</p>
          <div className="state__actions">{children || <a className="btn btn--primary" href="/">Back to store</a>}</div>
        </div>
      </main>
    </>
  );
}
