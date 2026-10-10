import { NextResponse } from 'next/server';

// Redirect to a path on this site. The Location header is relative on purpose: behind a proxy (Render, Vercel, nginx)
// `request.url` holds the server's internal address (e.g. localhost:10000), so building an absolute URL from it sends
// visitors to the wrong place. Browsers resolve a relative Location against the address they actually used.
export const redirectTo = (path, status = 303) => new NextResponse(null, { status, headers: { Location: path } });
