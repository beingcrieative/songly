import type {
  ConceptLyrics,
  ConversationPhase,
  ExtractedContext,
  UserPreferences,
} from "@/types/conversation";

export type RawConversation = {
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

export type ConversationResponse = {
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

export function serializeConversation(raw: RawConversation): ConversationResponse {
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
