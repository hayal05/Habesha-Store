import { query, rows, row, transaction } from './db';

// Ids are INTEGER columns: anything that is not a whole number from 1 to 2^31-1 cannot match, so it never reaches SQL.
const toId = (id) => { const n = Number(id); return Number.isInteger(n) && n >= 1 && n <= 2147483647 ? n : null; };

// Shared card shape. Only published apps are ever shown publicly.
const CARD = `
  SELECT a.id, a.name, a.summary, a.platform, a.icon_url, d.name AS developer
  FROM apps a JOIN developers d ON d.id = a.developer_id`;

export async function getHomeData() {
  const [categories, popular, recent, featured] = await Promise.all([
    rows(`
      SELECT c.slug, c.name, COUNT(a.id) AS count
      FROM categories c JOIN apps a ON a.category_id = c.id AND a.status = 'published'
      GROUP BY c.id ORDER BY c.name`),

    // Popular = most recorded download clicks in the last 30 days (apps with none are not "popular")
    rows(`${CARD}
      JOIN download_clicks k ON k.app_id = a.id AND k.created_at >= now() - interval '30 days'
      WHERE a.status = 'published'
      GROUP BY a.id, d.name ORDER BY COUNT(k.id) DESC, a.name LIMIT 6`),

    rows(`${CARD}
      WHERE a.status = 'published' ORDER BY a.updated_at DESC, a.id DESC LIMIT 6`),

    rows(`${CARD}
      WHERE a.status = 'published' AND a.featured = 1 ORDER BY a.updated_at DESC LIMIT 3`),
  ]);
  return { categories, popular, recent, featured };
}

const PAGE_SIZE = 12;

// Search published apps. Every filter is optional; values are bound as parameters (never concatenated).
export async function searchApps({ q = '', platform = '', category = '', sort = '', page = 1 }) {
  const where = ["a.status = 'published'"];
  const args = [];
  const arg = (v) => `$${args.push(v)}`;
  const term = q.trim().slice(0, 100);
  if (term) {
    // Escape LIKE wildcards so "100%" or "_" search literally (backslash is the default escape character)
    const p = arg(`%${term.replace(/[\\%_]/g, '\\$&')}%`);
    where.push(`(a.name ILIKE ${p} OR a.summary ILIKE ${p} OR d.name ILIKE ${p})`);
  }
  if (platform === 'android' || platform === 'ios') where.push(`a.platform = ${arg(platform)}`);
  if (category) where.push(`c.slug = ${arg(category)}`);

  const from = `FROM apps a JOIN developers d ON d.id = a.developer_id LEFT JOIN categories c ON c.id = a.category_id WHERE ${where.join(' AND ')}`;
  const order = sort === 'popular'
    ? "(SELECT COUNT(*) FROM download_clicks k WHERE k.app_id = a.id AND k.created_at >= now() - interval '30 days') DESC, a.name, a.id"
    : sort === 'name' ? 'LOWER(a.name), a.id' : 'a.updated_at DESC, a.id DESC';

  const total = (await row(`SELECT COUNT(*) AS n ${from}`, args)).n;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const current = Math.min(Math.max(1, Number(page) || 1), pages);
  const [apps, categories] = await Promise.all([
    rows(`SELECT a.id, a.name, a.summary, a.platform, a.icon_url, d.name AS developer ${from} ORDER BY ${order} LIMIT ${PAGE_SIZE} OFFSET ${(current - 1) * PAGE_SIZE}`, args),
    rows(`
      SELECT c.slug, c.name FROM categories c
      WHERE EXISTS (SELECT 1 FROM apps a WHERE a.category_id = c.id AND a.status = 'published') ORDER BY c.name`),
  ]);
  return { apps, total, page: current, pages, categories };
}

const screenshotsOf = (appId) => rows('SELECT id, url FROM screenshots WHERE app_id = $1 ORDER BY position, id', [appId]);

// One published app with everything the details page needs (null if missing or unpublished).
export async function getApp(id) {
  const n = toId(id);
  if (!n) return null;
  const app = await row(`
    SELECT a.*, d.name AS developer, c.name AS category, c.slug AS category_slug
    FROM apps a JOIN developers d ON d.id = a.developer_id LEFT JOIN categories c ON c.id = a.category_id
    WHERE a.id = $1 AND a.status = 'published'`, [n]);
  if (!app) return null;
  app.screenshots = await screenshotsOf(n);
  return app;
}

export const REPORT_REASONS = {
  malware: 'Malware or harmful file',
  impersonation: 'Impersonates another app or developer',
  illegal: 'Illegal or abusive content',
  broken: 'Download does not work',
  other: 'Something else',
};
// The raw status of an app, so the details page can tell "unpublished" from "never existed".
export async function isUnpublished(id) {
  const n = toId(id);
  return n !== null && (await row("SELECT 1 AS x FROM apps WHERE id = $1 AND status = 'unpublished'", [n])) !== null;
}

export async function recordClick(id) {
  await query('INSERT INTO download_clicks (app_id) VALUES ($1)', [toId(id)]);
}

export async function addReport(id, reason, details) {
  if (!Object.hasOwn(REPORT_REASONS, reason) || !(await getApp(id))) return false;
  await query('INSERT INTO reports (app_id, reason, details) VALUES ($1, $2, $3)', [toId(id), reason, String(details || '').slice(0, 1000)]);
  return true;
}

// Numbers for the dashboard overview, all from the signed-in developer's own apps. Clicks are taps on Download
// that were sent on to the file or store (see recordClick), not completed downloads.
export async function getOverview(developerId) {
  const [apps, clicks] = await Promise.all([
    row(`SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status = 'published') AS published
         FROM apps WHERE developer_id = $1`, [developerId]),
    row(`SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE k.created_at >= now() - interval '30 days') AS recent
         FROM download_clicks k JOIN apps a ON a.id = k.app_id WHERE a.developer_id = $1`, [developerId]),
  ]);
  return { apps: apps.total, published: apps.published, clicks: clicks.total, recent: clicks.recent };
}

// One page of the developer's apps (any status, newest change first) plus the total, so long lists can be paged.
export const APPS_PER_PAGE = 20;
export async function listDeveloperApps(developerId, page = 1) {
  const total = (await row('SELECT COUNT(*) AS n FROM apps WHERE developer_id = $1', [developerId])).n;
  const pages = Math.max(1, Math.ceil(total / APPS_PER_PAGE));
  const current = Math.min(Math.max(1, Math.floor(Number(page)) || 1), pages);
  const apps = await rows(
    'SELECT id, name, platform, version, status, icon_url, updated_at FROM apps WHERE developer_id = $1 ORDER BY updated_at DESC, id DESC LIMIT $2 OFFSET $3',
    [developerId, APPS_PER_PAGE, (current - 1) * APPS_PER_PAGE]);
  return { apps, total, page: current, pages };
}

// Publish or unpublish one of the developer's own apps. False if it is not theirs, missing, or the status is invalid.
export async function setAppStatus(developerId, id, status) {
  if (status !== 'published' && status !== 'unpublished') return false;
  const n = toId(id);
  if (!n) return false;
  return (await query('UPDATE apps SET status = $1 WHERE id = $2 AND developer_id = $3', [status, n, developerId])).rowCount > 0;
}

// One of the developer's own apps (any status) with its screenshots. Null if missing or not theirs.
export async function getOwnApp(developerId, id) {
  const n = toId(id);
  if (!n) return null;
  const app = await row('SELECT * FROM apps WHERE id = $1 AND developer_id = $2', [n, developerId]);
  if (!app) return null;
  app.screenshots = await screenshotsOf(n);
  return app;
}

// Categories for the publish/edit form's select. Empty until categories exist, and then the select is left out.
export const listCategories = () => rows('SELECT id, name FROM categories ORDER BY name');

// ---- Screenshots in a save. Order for the route: toIds(removed) -> checkScreenshotCount -> saveImages -> (inside the transaction
// with the app row) applyScreenshots -> after commit, removeImage for each url it returned.
export const MAX_SCREENSHOTS = 8;

// Form values to unique positive integer ids; anything else is dropped.
export const toIds = (values) => [...new Set(values.map(String).filter((v) => /^[1-9]\d{0,9}$/.test(v)).map(Number))];

// '' if the app can take `newCount` more screenshots after the removals (pass appId null for a new app), else the message to show.
// Only the app's own screenshots count and only they can be removed, so another app's ids change nothing.
export async function checkScreenshotCount(appId, removedIds, newCount) {
  const current = appId ? await rows('SELECT id FROM screenshots WHERE app_id = $1', [appId]) : [];
  const kept = current.filter((r) => !removedIds.includes(r.id)).length;
  return kept + newCount > MAX_SCREENSHOTS ? `You can add up to ${MAX_SCREENSHOTS} screenshots.` : '';
}

// Deletes the listed screenshots of this app and appends the new urls after the kept ones, so the order is kept.
// `client` is the transaction's connection. Returns the urls of the deleted ones: delete those images only after the commit.
export async function applyScreenshots(client, appId, removedIds, urls) {
  const { rows: shots } = await client.query('SELECT id, url, position FROM screenshots WHERE app_id = $1', [appId]);
  const gone = shots.filter((r) => removedIds.includes(r.id));
  for (const r of gone) await client.query('DELETE FROM screenshots WHERE id = $1 AND app_id = $2', [r.id, appId]);
  let pos = Math.max(-1, ...shots.filter((r) => !gone.includes(r)).map((r) => r.position));
  for (const url of urls) await client.query('INSERT INTO screenshots (app_id, url, position) VALUES ($1, $2, $3)', [appId, url, ++pos]);
  return gone.map((r) => r.url);
}

// Creates an app (existing = null) or updates one of the developer's own apps, with its screenshot changes, in one transaction.
// `v` comes from parseApp plus icon_url. updated_at only moves when something really changed. Returns { id, gone }:
// `gone` are the urls of removed screenshots, to delete after the commit.
const COLS = ['category_id', 'name', 'summary', 'description', 'platform', 'distribution', 'download_url', 'icon_url', 'version', 'min_os', 'file_size'];
export function saveApp(developerId, existing, v, shotUrls, removedIds) {
  const vals = COLS.map((c) => v[c] ?? null);
  return transaction(async (client) => {
    let id = existing?.id;
    if (!id) {
      const r = await client.query(
        `INSERT INTO apps (developer_id, ${COLS.join(', ')}) VALUES ($1, ${COLS.map((_, i) => `$${i + 2}`).join(', ')}) RETURNING id`,
        [developerId, ...vals]);
      id = r.rows[0].id;
    }
    const gone = await applyScreenshots(client, id, removedIds, shotUrls);
    if (existing) {
      const changed = COLS.some((c) => (existing[c] ?? '') !== (v[c] ?? '')) || shotUrls.length > 0 || gone.length > 0;
      const r = await client.query(
        `UPDATE apps SET ${COLS.map((c, i) => `${c} = $${i + 3}`).join(', ')}${changed ? ', updated_at = now()' : ''} WHERE id = $1 AND developer_id = $2`,
        [id, developerId, ...vals]);
      if (!r.rowCount) throw new Error('App not found');
    }
    return { id, gone };
  });
}
