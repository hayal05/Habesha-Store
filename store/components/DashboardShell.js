import Logo from './Logo';

const icon = { viewBox: '0 0 20 20', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };
const NAV = [
  ['overview', '/dashboard', 'Overview', 'M3 3h6v6H3zM11 3h6v4h-6zM11 9h6v8h-6zM3 11h6v6H3z'],
  ['apps', '/dashboard/apps', 'My apps', 'M6 2.5h8a1 1 0 011 1v13a1 1 0 01-1 1H6a1 1 0 01-1-1v-13a1 1 0 011-1zM8.5 15h3'],
  ['new', '/dashboard/apps/new', 'Add new app', 'M10 4v12M4 10h12'],
];

// Frame for every dashboard page: sidebar on desktop, drawer on mobile (toggled by the same [data-menu-toggle] code as the
// site header), page title with supporting text and the Publish app action. Pages call requireDeveloper() first and pass the developer in.
export default function DashboardShell({ developer, active, title, text, publish = true, children }) {
  return (
    <div className="dash">
      <header className="dash__bar">
        <Logo />
        <button className="btn btn--secondary btn--icon menu-btn" type="button" data-menu-toggle
                aria-expanded="false" aria-controls="dash-nav" aria-label="Open menu">
          <svg className="icon-open" {...icon}><path d="M3 5.5h14M3 10h14M3 14.5h14" /></svg>
          <svg className="icon-close" {...icon}><path d="M5 5l10 10M15 5L5 15" /></svg>
        </button>
      </header>

      <nav className="dash-nav" id="dash-nav" aria-label="Dashboard">
        <Logo className="dash-nav__brand" />
        <ul className="dash-nav__list" role="list">
          {NAV.map(([key, href, label, d]) => (
            <li key={key}>
              <a className="dash-nav__link" href={href} aria-current={key === active ? 'page' : undefined}>
                <svg {...icon}><path d={d} /></svg>{label}
              </a>
            </li>
          ))}
        </ul>
        <div className="dash-nav__user">
          <p className="dash-nav__name truncate">{developer.name}</p>
          <p className="dash-nav__email truncate">{developer.email}</p>
          <a className="btn btn--ghost btn--sm btn--block" href="/">View store</a>
          <form method="post" action="/api/auth/signout">
            <button className="btn btn--secondary btn--sm btn--block" type="submit">Sign out</button>
          </form>
        </div>
      </nav>
      <div className="dash__scrim" />

      <main id="main" className="dash__main">
        <div className="dash__head">
          <div className="dash__title">
            <h1>{title}</h1>
            {text && <p>{text}</p>}
          </div>
          {publish && (
            <a className="btn btn--primary" href="/dashboard/apps/new">
              <svg width="18" height="18" {...icon}><path d="M10 4v12M4 10h12" /></svg>Publish app
            </a>
          )}
        </div>
        {children}
      </main>
    </div>
  );
}
