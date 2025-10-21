import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/adminDb';
import { parseSessionFromRequest } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    const sess = parseSessionFromRequest(request);
    if (!sess) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const endpoint = String(body?.endpoint || '');
    const p256dh = String(body?.keys?.p256dh || '');
    const auth = String(body?.keys?.auth || '');
    const ua = String(body?.ua || '');
    const platform = String(body?.platform || '');
    const allowMarketing = Boolean(body?.allowMarketing || false);

    if (!endpoint || !p256dh || !auth) {
      return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 });
    }

    const admin = getAdminDb();
    if (!admin) return NextResponse.json({ error: 'Admin not configured' }, { status: 500 });

    const id = endpoint; // deterministic id based on endpoint
    await admin.transact(
      admin.tx.push_subscriptions[id]
        .update({ endpoint, p256dh, auth, ua, platform, allowMarketing, createdAt: Date.now() })
        .link({ user: sess.userId })
    );
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'subscribe failed' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const sess = parseSessionFromRequest(request);
    if (!sess) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint');
    if (!endpoint) return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 });
    const admin = getAdminDb();
    if (!admin) return NextResponse.json({ error: 'Admin not configured' }, { status: 500 });
    await admin.transact(admin.tx.push_subscriptions[endpoint].delete());
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'unsubscribe failed' }, { status: 500 });
  }
}

