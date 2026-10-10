import dns from 'node:dns/promises';
import net from 'node:net';

export function safeUrl(u) {
  try { return ['http:', 'https:'].includes(new URL(u).protocol); } catch { return false; }
}

// Google Drive "share" links open a preview page; turn them into direct-download links.
export function normalizeDownloadUrl(u) {
  try {
    const url = new URL(u);
    if (url.hostname === 'drive.google.com') {
      const id = url.pathname.match(/\/file\/d\/([\w-]+)/)?.[1] || url.searchParams.get('id');
      if (id) return `https://drive.google.com/uc?export=download&id=${id}`;
    }
  } catch {}
  return u;
}

function privateIp(ip) {
  if (net.isIPv6(ip)) {
    const l = ip.toLowerCase();
    return l === '::1' || l === '::' || l.startsWith('fc') || l.startsWith('fd') || l.startsWith('fe8') || l.startsWith('fe9') || l.startsWith('fea') || l.startsWith('feb')
      || (l.startsWith('::ffff:') && privateIp(l.slice(7)));
  }
  const [a, b] = ip.split('.').map(Number);
  return a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127);
}

// Developers supply these links, and we fetch them from the server, so never reach internal addresses.
async function allowedHost(host) {
  if (process.env.ALLOW_PRIVATE_LINKS === '1') return true;
  try {
    const addrs = await dns.lookup(host, { all: true });
    return addrs.length > 0 && !addrs.some((a) => privateIp(a.address));
  } catch { return false; }
}

/* Lightweight availability check before we send someone to a link.
   Returns 'ok' | 'gone' (missing or unreachable) | 'restricted' (needs a sign-in) | 'unknown' (could not tell; let them try).
   It can only see what the host tells us: it cannot prove a download will finish. */
export async function checkLink(start) {
  let url = start;
  for (let hop = 0; hop < 4; hop++) {
    const u = new URL(url);
    if (u.hostname === 'accounts.google.com') return 'restricted';
    if (!(await allowedHost(u.hostname))) return 'gone';
    let res;
    try {
      const opts = { redirect: 'manual', signal: AbortSignal.timeout(4000), headers: { 'user-agent': 'HabeshaStore-LinkCheck' } };
      res = await fetch(url, { ...opts, method: 'HEAD' });
      if (res.status === 405 || res.status === 403) res = await fetch(url, { ...opts, method: 'GET', headers: { ...opts.headers, range: 'bytes=0-0' } });
    } catch (e) {
      return e.name === 'TimeoutError' || e.name === 'AbortError' ? 'unknown' : 'gone';
    }
    if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
      try { url = new URL(res.headers.get('location'), url).href; } catch { return 'unknown'; }
      if (!safeUrl(url)) return 'gone';
      continue;
    }
    if (res.status === 404 || res.status === 410) return 'gone';
    return 'ok';
  }
  return 'unknown';
}
