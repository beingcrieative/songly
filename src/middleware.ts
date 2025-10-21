import { NextRequest, NextResponse } from 'next/server';

const ENFORCE_SESSION = (process.env.APP_ENFORCE_SESSION || 'false').toLowerCase() === 'true';
const PROTECTED_PREFIXES = ['/api/suno', '/api/push', '/api/lyric-versions'];
const EXEMPT_PATHS = ['/api/suno/lyrics/callback'];

function isProtectedPath(path: string) {
  return PROTECTED_PREFIXES.some((p) => path.startsWith(p));
}

function isMobileUA(ua: string) {
  return /(iphone|ipad|ipod|android|mobile)/i.test(ua);
}

export function middleware(req: NextRequest) {
  const url = new URL(req.url);
  const headers = new Headers(req.headers);
  const isDev = process.env.NODE_ENV !== 'production';

  headers.set('X-Frame-Options', 'DENY');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Permissions-Policy', 'camera=(), microphone=()');

  // Development: allow cross-origin to help when opening on LAN over different ports/hosts
  if (isDev) {
    headers.set('Access-Control-Allow-Origin', req.headers.get('origin') || '*');
    headers.set('Vary', 'Origin');
  }

  // Set mobile hint cookie for client gating
  const ua = req.headers.get('user-agent') || '';
  const isMobile = isMobileUA(ua) ? '1' : '0';

  const res = NextResponse.next({ request: { headers } });
  res.cookies.set('x-is-mobile', isMobile, { path: '/', sameSite: 'lax' });

  // Always allow external callbacks without session (e.g., Suno callbacks)
  if (EXEMPT_PATHS.some((p) => url.pathname.startsWith(p))) {
    return NextResponse.next({ request: { headers } });
  }

  if (isProtectedPath(url.pathname) && ENFORCE_SESSION) {
    // Middleware runs on Edge; avoid Node crypto. Check presence of session cookie only.
    const hasSession = Boolean(req.cookies.get('APP_SESSION')?.value);
    if (!hasSession) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers });
  }

  return res;
}

export const config = {
  // Include _next assets to attach permissive CORS headers in development
  matcher: [
    '/((?!_next/static|_next/image|favicon\.ico|icons/|manifest|sw\.js).*)',
    '/_next/:path*',
  ],
};
