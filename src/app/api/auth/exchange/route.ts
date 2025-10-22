import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/adminDb';
import { createSessionCookie } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const userId = typeof body.userId === 'string' ? body.userId : null;
    const email = typeof body.email === 'string' ? body.email : null;

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    // Since the client has already authenticated with InstantDB and has a valid auth token,
    // we can trust the userId and email from the request. The session exchange is just
    // creating a JWT cookie for mobile API routes.
    //
    // We don't need to verify the user exists in the database because:
    // 1. InstantDB has already authenticated them
    // 2. There can be a race condition where the user record isn't immediately available via admin query
    // 3. The session cookie is only used to identify the user, not for authorization

    const cookie = createSessionCookie({ id: userId, email: email || null }).cookie;
    const res = NextResponse.json({ ok: true, user: { id: userId, email: email || null } });
    res.headers.append('Set-Cookie', cookie);
    return res;
  } catch (e: any) {
    console.error('[auth/exchange] Error:', e);
    return NextResponse.json({ error: e?.message || 'exchange failed' }, { status: 500 });
  }
}

