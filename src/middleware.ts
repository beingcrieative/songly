import { NextRequest, NextResponse } from 'next/server';

const ENFORCE_SESSION = (process.env.APP_ENFORCE_SESSION || 'false').toLowerCase() === 'true';
const PROTECTED_PREFIXES = ['/api/suno', '/api/push', '/api/lyric-versions'];
const EXEMPT_PATHS = ['/api/suno/lyrics/callback', '/api/suno/callback'];

// Validate environment on first request (cached)
let envValidated = false;
function validateEnvironmentOnce() {
  if (envValidated) return;
  envValidated = true;

  // Only validate in production
  if (process.env.NODE_ENV !== 'production') return;

  const missing: string[] = [];

  // Check critical env vars
  if (!process.env.NEXT_PUBLIC_INSTANT_APP_ID) missing.push('NEXT_PUBLIC_INSTANT_APP_ID');
  if (!process.env.INSTANT_APP_ADMIN_TOKEN) missing.push('INSTANT_APP_ADMIN_TOKEN');
  if (!process.env.SUNO_API_KEY) missing.push('SUNO_API_KEY');

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing.join(', '));
    console.error('Configure these in Vercel Dashboard → Settings → Environment Variables');
  } else {
    console.log('✅ Required environment variables validated');
  }

  // Warn about callback URLs if not set
  if (!process.env.SUNO_CALLBACK_URL && !process.env.VERCEL_URL) {
    console.warn('⚠️  SUNO_CALLBACK_URL not set and cannot auto-detect. Suno callbacks may fail.');
  }
}

function isProtectedPath(path: string) {
  return PROTECTED_PREFIXES.some((p) => path.startsWith(p));
}

function isMobileUA(ua: string) {
  return /(iphone|ipad|ipod|android|mobile)/i.test(ua);
}

export function middleware(req: NextRequest) {
  // Validate environment variables once on first request
  validateEnvironmentOnce();

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

  // Always allow external callbacks without session (e.g., Suno callbacks)
  // Check this BEFORE creating the response to avoid setting unnecessary cookies
  const isExemptPath = EXEMPT_PATHS.some((p) => url.pathname.startsWith(p));

  if (isExemptPath) {
    console.log('[Middleware] ✅ Exempt path detected:', url.pathname);
    console.log('[Middleware] Origin:', req.headers.get('origin'));
    console.log('[Middleware] User-Agent:', req.headers.get('user-agent'));
    return NextResponse.next({ request: { headers } });
  }

  const res = NextResponse.next({ request: { headers } });
  res.cookies.set('x-is-mobile', isMobile, { path: '/', sameSite: 'lax' });

  // Only enforce session if explicitly enabled
  if (isProtectedPath(url.pathname) && ENFORCE_SESSION) {
    console.log('[Middleware] 🔒 Protected path check:', url.pathname);
    console.log('[Middleware] ENFORCE_SESSION:', ENFORCE_SESSION);
    // Middleware runs on Edge; avoid Node crypto. Check presence of session cookie only.
    const hasSession = Boolean(req.cookies.get('APP_SESSION')?.value);
    if (!hasSession) {
      console.log('[Middleware] ❌ 401 Unauthorized - No session cookie');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers });
    }
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
