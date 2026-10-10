import AppCard from './AppCard';

export default function AppSection({ id, title, apps, href }) {
  if (!apps.length) return null;
  return (
    <section className="home-section" aria-labelledby={id}>
      <div className="section-head">
        <h2 id={id}>{title}</h2>
        {href && <a href={href}>View all</a>}
      </div>
      <div className="app-grid">{apps.map((a) => <AppCard key={a.id} app={a} />)}</div>
    </section>
  );
}
