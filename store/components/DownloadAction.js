// Primary action for an app. Used in the page header (desktop) and the sticky bar (mobile).
export default function DownloadAction({ app, action }) {
  return (
    <>
      {app.download_url ? (
        <a className="btn btn--primary" href={`/apps/${app.id}/download`} rel="nofollow">{action.label}</a>
      ) : (
        <button className="btn btn--primary" type="button" disabled>Download unavailable</button>
      )}
      <p className="detail__hint">{app.download_url ? action.hint : 'The developer has not added a download link yet.'}</p>
    </>
  );
}
