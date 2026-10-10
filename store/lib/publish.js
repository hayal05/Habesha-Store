import { ACTIONS } from './format';
import { safeUrl } from './links';

const MAX_MB = 10240;

// Shown on the form page after a plain (no-JavaScript) post fails; ui.js shows the same problems inline instead.
export const FORM_ERRORS = {
  check: 'Your changes were not saved. Check the details, especially the images, and try again.',
  failed: 'We could not save your app. Try again.',
};

// Reads the publish/edit form into clean values and checks every rule (the browser checks in ui.js use the same messages).
// `existing` is the developer's saved app when editing, else null. Returns { values, errors }; errors is keyed by field name.
export function parseApp(form, existing, categoryIds) {
  const text = (k) => String(form.get(k) ?? '').trim();
  const one = (k) => text(k).replace(/\s+/g, ' ');
  const v = {
    name: one('name'), platform: text('platform'), summary: one('summary'),
    description: text('description').replace(/\r\n?/g, '\n'), distribution: text('distribution'),
    download_url: text('download_url'), version: one('version') || null, min_os: one('min_os') || null,
    category_id: text('category_id') ? Number(text('category_id')) : null,
  };
  const e = {};
  const tooLong = (k, max) => { if (v[k] && v[k].length > max) e[k] = `Use ${max} characters or fewer.`; };

  if (!v.name) e.name = 'Enter your app name.'; else tooLong('name', 60);
  if (!['android', 'ios'].includes(v.platform)) e.platform = 'Choose Android or iOS.';
  if (!v.summary) e.summary = 'Enter a short summary.'; else tooLong('summary', 120);
  tooLong('description', 4000); tooLong('version', 20); tooLong('min_os', 30);
  if (v.category_id !== null && !categoryIds.includes(v.category_id)) e.category_id = 'Choose a category from the list.';

  if (!Object.hasOwn(ACTIONS, v.distribution)) e.distribution = 'Choose how people get your app.';
  else if (v.distribution === 'apk' && v.platform === 'ios') e.distribution = 'iOS apps cannot be a direct APK download. Choose App Store, TestFlight or a link.';
  else if (['app_store', 'testflight'].includes(v.distribution) && v.platform === 'android') e.distribution = 'App Store and TestFlight links are for iOS apps.';

  if (!v.download_url) e.download_url = 'Enter the download link.';
  else if (!safeUrl(v.download_url)) e.download_url = 'Enter a link that starts with http:// or https://.';
  else tooLong('download_url', 500);

  // Typed in MB with two decimals, stored as bytes. An unchanged value keeps the saved byte count (bytes to MB to bytes rounds).
  const mb = text('file_size_mb');
  v.file_size = null;
  if (mb) {
    const n = Number(mb);
    if (!Number.isFinite(n) || n < 0 || n > MAX_MB) e.file_size_mb = `Enter a size in MB between 0 and ${MAX_MB}.`;
    else if (n > 0) v.file_size = existing?.file_size && n.toFixed(2) === (existing.file_size / 1048576).toFixed(2) ? existing.file_size : Math.round(n * 1048576);
  }
  return { values: v, errors: e };
}
