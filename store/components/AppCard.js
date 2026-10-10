export default function AppCard({ app }) {
  const isIos = app.platform === 'ios';
  return (
    <article className="app-card">
      <div className="app-card__top">
        <div className={`app-icon${app.icon_url ? '' : ' app-icon--fallback'}`} data-initial={app.name.trim().charAt(0).toUpperCase()}>
          {app.icon_url && <img className="app-icon__img" src={app.icon_url} alt="" width="64" height="64" loading="lazy" data-name={app.name} />}
        </div>
        <div className="app-card__title">
          <h3 className="app-card__name"><a className="app-card__link" href={`/apps/${app.id}`}>{app.name}</a></h3>
          <p className="app-card__dev">{app.developer}</p>
        </div>
      </div>
      <p className="app-card__desc">{app.summary}</p>
      <div className="app-card__foot">
        <span className={`badge badge--${app.platform}`}>{isIos ? 'iOS' : 'Android'}</span>
        <span className="app-card__action" aria-hidden="true">{isIos ? 'Get' : 'View'}</span>
      </div>
    </article>
  );
}
