// Compact app tile for grids: icon, name, platform. No description. The whole tile is one link.
export default function AppTile({ app }) {
  const isIos = app.platform === 'ios';
  return (
    <li>
      <a className="app-tile" href={`/apps/${app.id}`}>
        <span className={`app-icon${app.icon_url ? '' : ' app-icon--fallback'}`} data-initial={app.name.trim().charAt(0).toUpperCase()}>
          {app.icon_url && <img className="app-icon__img" src={app.icon_url} alt="" width="84" height="84" loading="lazy" data-name={app.name} />}
        </span>
        <span className="app-tile__name">{app.name}</span>
        <span className="app-tile__meta">{isIos ? 'iOS' : 'Android'}</span>
      </a>
    </li>
  );
}
