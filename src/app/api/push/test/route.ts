import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/adminDb';
import { sendWebPush } from '@/lib/push';

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'disabled' }, { status: 403 });
  }
  try {
    const admin = getAdminDb();
    if (!admin) return NextResponse.json({ error: 'Admin not configured' }, { status: 500 });
    const { $users } = await admin.query({ $users: { $: { limit: 1 } } });
    const user = $users?.[0];
    if (!user) return NextResponse.json({ error: 'no user' }, { status: 404 });
    const { push_subscriptions } = await admin.query({
      push_subscriptions: { $: { where: { 'user.id': user.id } } },
    });
    const sub = push_subscriptions?.[0];
    if (!sub) return NextResponse.json({ error: 'no subscription' }, { status: 404 });
    const res = await sendWebPush(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      { title: 'Test Push', body: 'This is a test', url: '/' },
    );
    return NextResponse.json(res);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'failed' }, { status: 500 });
  }
}

