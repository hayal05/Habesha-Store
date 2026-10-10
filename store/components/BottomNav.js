import { getDeveloper } from '@/lib/auth';

const ICONS = {
  home: <path d="M3.5 10.5L12 3.5l8.5 7V20a.5.5 0 01-.5.5h-4.5v-6h-7v6H4a.5.5 0 01-.5-.5z" />,
  search: <><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5" /></>,
  publish: <><circle cx="12" cy="12" r="8.5" /><path d="M12 8v8M8 12h8" /></>,
  account: <><circle cx="12" cy="8.5" r="3.8" /><path d="M4.5 20.5c.8-3.8 3.8-5.8 7.5-5.8s6.7 2 7.5 5.8" /></>,
};

// App-style bottom tabs. Phones only (hidden from 900px up, where the header carries the same links).
export default async function BottomNav({ active }) {
  const developer = await getDeveloper();
  const tabs = [
    { id: 'home', href: '/', label: 'Home' },
    { id: 'search', href: '/search', label: 'Search' },
    { id: 'publish', href: '/dashboard/apps/new', label: 'Publish' },
    { id: 'account', href: developer ? '/dashboard' : '/signin', label: developer ? 'Account' : 'Sign in' },
  ];
  return (
    <nav className="tabbar" aria-label="Main">
      {tabs.map((t) => (
        <a key={t.id} href={t.href} aria-current={active === t.id ? 'page' : undefined}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{ICONS[t.id]}</svg>
          <span>{t.label}</span>
        </a>
      ))}
    </nav>
  );
}
