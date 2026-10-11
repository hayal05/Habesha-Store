// "More by this developer" / "Similar apps": a sideways row on phones, a list in the side column on desktop.
export default function AppRail({ id, title, apps }) {
  if (!apps.length) return null;
  return (
    <section className="detail__section rail-section" aria-labelledby={id}>
      <h2 id={id}>{title}</h2>
      <ul className="rail">
        {apps.map((a) => (
          <li key={a.id}>
            <a className="rail-item" href={`/apps/${a.id}`}>
              <span className={`app-icon${a.icon_url ? '' : ' app-icon--fallback'}`} data-initial={a.name.trim().charAt(0).toUpperCase()}>
                {a.icon_url && <img className="app-icon__img" src={a.icon_url} alt="" width="72" height="72" loading="lazy" data-name={a.name} />}
              </span>
              <span className="rail-item__text">
                <span className="rail-item__name">{a.name}</span>
                <span className="rail-item__meta">{a.platform === 'ios' ? 'iOS' : 'Android'}</span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
