import { NextRequest, NextResponse } from "next/server";
import { parseSessionFromRequest } from "@/lib/session";

export async function GET(req: NextRequest) {
  const session = parseSessionFromRequest(req);
  if (!session?.userId) {
    return NextResponse.json({ userId: null, authenticated: false });
  }
  return NextResponse.json({ userId: session.userId, authenticated: true });
}

