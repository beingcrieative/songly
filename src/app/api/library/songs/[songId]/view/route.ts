import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/adminDb';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { songId: string } }
) {
  try {
    const { songId } = params;

    const admin = getAdminDb();
    if (!admin) {
      return NextResponse.json(
        { error: 'Admin not configured' },
        { status: 500 }
      );
    }

    await admin.transact([
      admin.tx.songs[songId].update({
        lastViewedAt: Date.now(),
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('View tracking error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal error' },
      { status: 500 }
    );
  }
}
