import { NextRequest, NextResponse } from "next/server";
import { id as createId } from "@instantdb/admin";
import type {
  ConceptLyrics,
  ConversationPhase,
  ExtractedContext,
  UserPreferences,
} from "@/types/conversation";
import { getAdminDb } from "@/lib/adminDb";
import { parseSessionFromRequest } from "@/lib/session";

type RawConversation = {
  id: string;
  createdAt?: number;
  updatedAt?: number;
  status?: string | null;
  conversationPhase?: string | null;
  roundNumber?: number | null;
  readinessScore?: number | null;
  extractedContext?: string | ExtractedContext | null;
  songSettings?: string | UserPreferences | null;
  selectedTemplateId?: string | null;
  templateConfig?: string | Record<string, unknown> | null;
  lyricsTaskId?: string | null;
  conceptTitle?: string | null;
  conceptLyrics?: string | ConceptLyrics | null;
  conceptHistory?: string | ConceptLyrics[] | null;
};

type ConversationResponse = {
  conversation: {
    id: string;
    createdAt: number;
    updatedAt: number;
    status: string | null;
    conversationPhase: ConversationPhase | null;
    roundNumber: number | null;
    readinessScore: number | null;
    extractedContext: ExtractedContext | null;
    songSettings: UserPreferences | null;
    selectedTemplateId: string | null;
    templateConfig: Record<string, unknown> | null;
    lyricsTaskId: string | null;
    conceptTitle: string | null;
    conceptLyrics: ConceptLyrics | null;
    conceptHistory: ConceptLyrics[] | null;
  };
};

function safeParseJson<T>(value: unknown): T | null {
  if (!value) return null;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch (error) {
      console.warn("Failed to parse JSON field", error);
      return null;
    }
  }
  if (typeof value === "object") {
    return value as T;
  }
  return null;
}

function serializeConversation(raw: RawConversation): ConversationResponse {
  const phase =
    typeof raw.conversationPhase === "string"
      ? (raw.conversationPhase as ConversationPhase)
      : null;

  return {
    conversation: {
      id: String(raw.id),
      createdAt: typeof raw.createdAt === "number" ? raw.createdAt : Date.now(),
      updatedAt: typeof raw.updatedAt === "number" ? raw.updatedAt : Date.now(),
      status: typeof raw.status === "string" ? raw.status : null,
      conversationPhase: phase,
      roundNumber: typeof raw.roundNumber === "number" ? raw.roundNumber : null,
      readinessScore: typeof raw.readinessScore === "number" ? raw.readinessScore : null,
      extractedContext: safeParseJson<ExtractedContext>(raw.extractedContext),
      songSettings: safeParseJson<UserPreferences>(raw.songSettings),
      selectedTemplateId:
        typeof raw.selectedTemplateId === "string" ? raw.selectedTemplateId : null,
      templateConfig: safeParseJson<Record<string, unknown>>(raw.templateConfig),
      lyricsTaskId: typeof raw.lyricsTaskId === "string" ? raw.lyricsTaskId : null,
      conceptTitle: typeof raw.conceptTitle === "string" ? raw.conceptTitle : null,
      conceptLyrics: safeParseJson<ConceptLyrics>(raw.conceptLyrics),
      conceptHistory: safeParseJson<ConceptLyrics[]>(raw.conceptHistory),
    },
  };
}

export async function GET(request: NextRequest) {
  const session = parseSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = getAdminDb();
  if (!admin) {
    return NextResponse.json({ error: "Admin not configured" }, { status: 500 });
  }

  try {
    const { conversations } = await admin.query({
      conversations: {
        $: {
          where: {
            "user.id": session.userId,
          },
          order: { createdAt: "desc" },
          limit: 1,
        },
      },
    });

    const conversation = conversations?.[0];
    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    return NextResponse.json(serializeConversation(conversation));
  } catch (error: any) {
    console.error("Failed to load conversation", error);
    return NextResponse.json(
      { error: error?.message || "Failed to load conversation" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = parseSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = getAdminDb();
  if (!admin) {
    return NextResponse.json({ error: "Admin not configured" }, { status: 500 });
  }

  let body: Partial<RawConversation> = {};
  try {
    body = (await request.json()) ?? {};
  } catch {
    body = {};
  }

  const now = Date.now();
  const conversationId = createId();

  const updateData: Record<string, unknown> = {
    createdAt: now,
    updatedAt: now,
    status: typeof body.status === "string" ? body.status : "active",
    conversationPhase:
      typeof body.conversationPhase === "string" ? body.conversationPhase : "gathering",
    roundNumber:
      typeof body.roundNumber === "number" && Number.isFinite(body.roundNumber)
        ? body.roundNumber
        : 0,
    readinessScore:
      typeof body.readinessScore === "number" && Number.isFinite(body.readinessScore)
        ? body.readinessScore
        : 0,
  };

  if (body.extractedContext) {
    updateData.extractedContext = JSON.stringify(body.extractedContext);
  }
  if (body.songSettings) {
    updateData.songSettings = JSON.stringify(body.songSettings);
  }
  if (typeof body.selectedTemplateId === "string") {
    updateData.selectedTemplateId = body.selectedTemplateId;
  }
  if (body.templateConfig) {
    updateData.templateConfig = JSON.stringify(body.templateConfig);
  }
  if (typeof body.lyricsTaskId === "string") {
    updateData.lyricsTaskId = body.lyricsTaskId;
  }
  if (typeof body.conceptTitle === "string") {
    updateData.conceptTitle = body.conceptTitle;
  }
  if (body.conceptLyrics) {
    updateData.conceptLyrics = JSON.stringify(body.conceptLyrics);
  }
  if (body.conceptHistory) {
    updateData.conceptHistory = JSON.stringify(body.conceptHistory);
  }

  try {
    await admin.transact([
      admin.tx.conversations[conversationId]
        .update(updateData)
        .link({ user: session.userId }),
    ]);

    return NextResponse.json(
      serializeConversation({
        id: conversationId,
        ...updateData,
      } as RawConversation)
    );
  } catch (error: any) {
    console.error("Failed to create conversation", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create conversation" },
      { status: 500 }
    );
  }
}

export type { RawConversation };
export { serializeConversation };
