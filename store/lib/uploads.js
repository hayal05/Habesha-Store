import crypto from 'node:crypto';

// Uploaded images are stored on Cloudinary and the database keeps their https URLs (apps.icon_url, screenshots.url).
// Configure with CLOUDINARY_URL (cloudinary://KEY:SECRET@CLOUD_NAME, from the Cloudinary dashboard) or with
// CLOUDINARY_CLOUD_NAME + CLOUDINARY_API_KEY + CLOUDINARY_API_SECRET. Only PNG, JPEG and WebP are accepted, never SVG (it can carry scripts).
const FOLDER = 'habesha-store';
const MIME = { png: 'image/png', jpg: 'image/jpeg', webp: 'image/webp' };
const MAX_PX = 8000;

function config() {
  let cloud = process.env.CLOUDINARY_CLOUD_NAME, key = process.env.CLOUDINARY_API_KEY, secret = process.env.CLOUDINARY_API_SECRET;
  if (!(cloud && key && secret) && process.env.CLOUDINARY_URL) {
    try { const u = new URL(process.env.CLOUDINARY_URL); cloud = u.hostname; key = decodeURIComponent(u.username); secret = decodeURIComponent(u.password); } catch {}
  }
  return cloud && key && secret ? { cloud, key, secret } : null;
}

// Cloudinary signs a request as sha1("k=v&k=v" with the keys sorted + API secret).
const sign = (params, secret) => crypto.createHash('sha1')
  .update(Object.keys(params).sort().map((k) => `${k}=${params[k]}`).join('&') + secret).digest('hex');

async function cloudinary(c, action, params, file) {
  const timestamp = Math.floor(Date.now() / 1000);
  const body = new FormData();
  for (const [k, v] of Object.entries({ ...params, timestamp })) body.set(k, String(v));
  body.set('api_key', c.key);
  body.set('signature', sign({ ...params, timestamp }, c.secret));
  if (file) body.set('file', file.blob, file.name);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${c.cloud}/image/${action}`, { method: 'POST', body, signal: AbortSignal.timeout(30000) });
  return { ok: res.ok, data: await res.json().catch(() => null) };
}

// Real type and size from the file's own bytes (not its name or the browser's content type). Null if it is not a readable image.
export function imageInfo(b) {
  if (b.length > 30 && b.toString('latin1', 1, 4) === 'PNG' && b.toString('latin1', 12, 16) === 'IHDR') {
    return { ext: 'png', width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
  }
  if (b.length > 12 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) {
    for (let i = 2; i + 9 < b.length;) {
      if (b[i] !== 0xff) return null;
      const m = b[i + 1];
      if (m === 0xff) { i++; continue; }
      if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return { ext: 'jpg', height: b.readUInt16BE(i + 5), width: b.readUInt16BE(i + 7) };
      i += 2 + b.readUInt16BE(i + 2);
    }
    return null;
  }
  if (b.length > 30 && b.toString('latin1', 0, 4) === 'RIFF' && b.toString('latin1', 8, 12) === 'WEBP') {
    const kind = b.toString('latin1', 12, 16);
    if (kind === 'VP8 ') return { ext: 'webp', width: b.readUInt16LE(26) & 0x3fff, height: b.readUInt16LE(28) & 0x3fff };
    if (kind === 'VP8L') { const v = b.readUInt32LE(21); return { ext: 'webp', width: (v & 0x3fff) + 1, height: ((v >>> 14) & 0x3fff) + 1 }; }
    if (kind === 'VP8X') return { ext: 'webp', width: b.readUIntLE(24, 3) + 1, height: b.readUIntLE(27, 3) + 1 };
  }
  return null;
}

// An empty file input still posts an empty file; that means "nothing chosen".
export const picked = (f) => f != null && typeof f === 'object' && typeof f.arrayBuffer === 'function' && f.size > 0;

// Re-checks one uploaded file with the same rules and messages as the upload area in ui.js, then uploads it to Cloudinary
// under a random name. Returns { url } or { error }.
export async function saveImage(file, { maxMb, minPx = 0, square = false }) {
  const label = `\u201c${String(file.name).slice(0, 60)}\u201d`;
  if (file.size > maxMb * 1048576) return { error: `${label} is larger than ${maxMb} MB.` };
  const buf = Buffer.from(await file.arrayBuffer());
  const info = imageInfo(buf);
  if (!info) return { error: `${label} is not supported. Use PNG, JPG or WebP.` };
  const { ext, width, height } = info;
  if (!width || !height) return { error: `${label} could not be read as an image.` };
  if (Math.max(width, height) > MAX_PX) return { error: `${label} must be no larger than ${MAX_PX}\u00d7${MAX_PX} pixels.` };
  if (minPx && (width < minPx || height < minPx)) return { error: `${label} must be at least ${minPx}\u00d7${minPx} pixels.` };
  if (square && Math.abs(width - height) / Math.max(width, height) > 0.02) return { error: `${label} must be square.` };

  const c = config();
  if (!c) { console.error('Cloudinary is not configured (set CLOUDINARY_URL).'); return { error: 'Image uploads are unavailable right now. Try again later.' }; }
  try {
    const { ok, data } = await cloudinary(c, 'upload', { public_id: `${FOLDER}/${crypto.randomBytes(16).toString('hex')}` },
      { blob: new Blob([buf], { type: MIME[ext] }), name: `image.${ext}` });
    if (ok && typeof data?.secure_url === 'string') return { url: data.secure_url };
    console.error('Cloudinary upload refused:', data?.error?.message);
  } catch (e) { console.error('Cloudinary upload failed:', e.message); }
  return { error: `${label} could not be uploaded. Try again.` };
}

// Stores several images, all or none: if one is refused, the ones already stored are deleted. Returns { urls } or { error }.
export async function saveImages(files, opts) {
  const urls = [];
  for (const file of files) {
    const r = await saveImage(file, opts);
    if (r.error) { await Promise.all(urls.map(removeImage)); return { error: r.error }; }
    urls.push(r.url);
  }
  return { urls };
}

// Delete a stored image by its Cloudinary url. Anything else (null, another host or folder) is ignored; failures are logged, not thrown.
export async function removeImage(url) {
  const c = config();
  if (!c || !url) return;
  const cloud = c.cloud.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const m = new RegExp(`^https://res\\.cloudinary\\.com/${cloud}/image/upload/(?:v\\d+/)?(${FOLDER}/[a-f0-9]{32})\\.(?:png|jpg|webp)$`).exec(url);
  if (!m) return;
  try { await cloudinary(c, 'destroy', { public_id: m[1], invalidate: 'true' }); }
  catch (e) { console.error('Cloudinary delete failed:', e.message); }
}
