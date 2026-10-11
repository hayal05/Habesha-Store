import { headers } from 'next/headers';

// The public address of this site, for links that must work outside the page (QR codes).
// Set SITE_URL (e.g. https://habesha-store.onrender.com) to pin it; otherwise it is read from the request,
// preferring the forwarded host a proxy such as Render passes along.
export async function siteOrigin() {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/+$/, '');
  const h = await headers();
  const host = h.get('x-forwarded-host') || h.get('host') || 'localhost:3000';
  const proto = h.get('x-forwarded-proto') || (host.startsWith('localhost') ? 'http' : 'https');
  return `${proto.split(',')[0].trim()}://${host.split(',')[0].trim()}`;
}
