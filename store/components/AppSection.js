import AppTile from './AppTile';

export default function AppSection({ id, title, apps, href }) {
  if (!apps.length) return null;
  return (
    <section className="home-section" aria-labelledby={id}>
      <div className="section-head">
        <h2 id={id}>{title}</h2>
        {href && <a href={href}>See all</a>}
      </div>
      <ul className="tile-grid">{apps.map((a) => <AppTile key={a.id} app={a} />)}</ul>
    </section>
  );
}
