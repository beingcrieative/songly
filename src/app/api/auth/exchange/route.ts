import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/adminDb';
import { createSessionCookie } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const userId = typeof body.userId === 'string' ? body.userId : null;
    const email = typeof body.email === 'string' ? body.email : null;

    if (!userId && !email) {
      return NextResponse.json({ error: 'Missing userId or email' }, { status: 400 });
    }

    const admin = getAdminDb();
    if (!admin) {
      return NextResponse.json({ error: 'Admin not configured' }, { status: 500 });
    }

    const { $users } = userId
      ? await admin.query({ $users: { $: { where: { id: userId } } } })
      : await admin.query({ $users: { $: { where: { email: email as string } } } });
    const user = $users?.[0];
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    const cookie = createSessionCookie({ id: user.id, email: user.email || null }).cookie;
    const res = NextResponse.json({ ok: true, user: { id: user.id, email: user.email || null } });
    res.headers.append('Set-Cookie', cookie);
    return res;
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'exchange failed' }, { status: 500 });
  }
}

