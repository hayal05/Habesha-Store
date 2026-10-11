// Play-style top bar for phones: back and search. From 900px the normal site header is used instead.
export default function DetailBar() {
  const svg = (d) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>;
  return (
    <>
      <div className="brand-stripe mobile-only" />
      <div className="appbar mobile-only">
        <a className="appbar__btn" href="/" data-back aria-label="Back">{svg(<path d="M19 12H5M11 6l-6 6 6 6" />)}</a>
        <a className="appbar__btn" href="/search" aria-label="Search apps">{svg(<><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5" /></>)}</a>
      </div>
    </>
  );
}
