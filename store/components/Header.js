import Logo from './Logo';
import { getDeveloper } from '@/lib/auth';

export default async function Header({ q = '', platform = '', tabs = false }) {
  const developer = await getDeveloper();
  const opt = (value, label) => (
    <label className="platform-filter__opt">
      <input type="radio" name="platform" value={value} defaultChecked={platform === value} />
      <span>{label}</span>
    </label>
  );
  return (
    <>
      <div className="brand-stripe" />
      <header className={`site-header${tabs ? ' site-header--tabs' : ''}`}>
        <div className="container site-header__inner">
          <Logo className="site-header__brand" />
          <button className="btn btn--secondary btn--icon menu-btn" type="button" data-menu-toggle
                  aria-expanded="false" aria-controls="site-nav" aria-label="Open menu">
            <svg className="icon-open" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M3 5.5h14M3 10h14M3 14.5h14" /></svg>
            <svg className="icon-close" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M5 5l10 10M15 5L5 15" /></svg>
          </button>
          <form className="site-search" role="search" action="/search" data-autosubmit>
            <div className="search">
              <svg className="search__icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><circle cx="9" cy="9" r="5.5" /><path d="M13.5 13.5L17 17" /></svg>
              <label className="visually-hidden" htmlFor="q">Search apps</label>
              <input className="search__input" id="q" type="search" name="q" placeholder="Search apps" autoComplete="off" defaultValue={q} />
            </div>
            <fieldset className="platform-filter">
              <legend className="visually-hidden">Platform</legend>
              {opt('', 'All')}{opt('android', 'Android')}{opt('ios', 'iOS')}
            </fieldset>
          </form>
          <nav className="site-nav" id="site-nav" aria-label="Primary">
            {developer
              ? <a className="btn btn--ghost" href="/dashboard">Dashboard</a>
              : <a className="btn btn--ghost" href="/signin">Sign in</a>}
            <a className="btn btn--primary" href="/dashboard/apps/new">Publish app</a>
          </nav>
        </div>
      </header>
    </>
  );
}
