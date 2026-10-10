// What the primary action is called, by how the app is distributed.
export const ACTIONS = {
  apk:        { label: 'Download APK',       kind: 'Direct APK download', hint: 'Downloads a file from the developer. Only install apps you trust.' },
  app_store:  { label: 'Get on App Store',   kind: 'App Store',           hint: 'Opens the App Store.' },
  testflight: { label: 'Join TestFlight',    kind: 'TestFlight beta',     hint: 'Opens TestFlight. This is a beta version.' },
  external:   { label: 'Open download page', kind: 'External link',       hint: 'Opens the developer’s own page in a new site.' },
};
export const actionFor = (d) => ACTIONS[d] || ACTIONS.external;

export function formatSize(bytes) {
  if (!bytes || bytes < 1) return '';
  const mb = bytes / 1048576;
  return mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : mb >= 10 ? `${Math.round(mb)} MB` : `${mb.toFixed(1)} MB`;
}
export function formatDate(ts) {   // a Date from Postgres (timestamptz) or an ISO-like string
  const d = ts instanceof Date ? ts : new Date(String(ts));
  return isNaN(d) ? '' : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}
