"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { id } from "@instantdb/react";
import { db } from "@/lib/db";
import { ConversationalStudioLayout } from "@/components/ConversationalStudioLayout";
import { LyricsPanel } from "@/components/LyricsPanel";
import { LyricsCompare } from "@/components/LyricsCompare";
import { MusicGenerationProgress } from "@/components/MusicGenerationProgress";
import { VariantSelector } from "@/components/VariantSelector";
import { WelcomeAnimation } from "@/components/WelcomeAnimation";
import { TemplateSelector } from "@/components/TemplateSelector";
import { ConversationPhase, ExtractedContext, ConceptLyrics, UserPreferences } from "@/types/conversation";
import { stringifyExtractedContext } from "@/lib/utils/contextExtraction";
import {
  MusicTemplate,
  getTemplateById,
  MUSIC_TEMPLATES,
  SURPRISE_ME_TEMPLATE,
} from "@/templates/music-templates";
import { buildSunoLyricsPrompt } from "@/lib/utils/sunoLyricsPrompt";
import { getLyricsCallbackUrl } from "@/lib/utils/getDeploymentUrl";
import NavTabs from "@/components/mobile/NavTabs";
import AudioMiniPlayer from "@/components/AudioMiniPlayer";
import ChatHeader from "@/components/mobile/ChatHeader";
import ChatBubble from "@/components/ChatBubble";
import ComposerBar from "@/components/mobile/ComposerBar";
import { useKeyboardOpen } from "@/hooks/useKeyboardOpen";
import { isNearBottom, scrollToElement } from "@/lib/utils/scrollHelpers";
import {
  AdvancedSettings,
  DEFAULT_ADVANCED_SETTINGS,
} from "@/components/AdvancedControlsPanel";
import {
  ParameterSheet,
  type ParameterValues,
  type ParameterSheetExtras,
  type ParameterSheetTemplate,
} from "@/components/ParameterSheet";
import {
  trackLyricsOptionsShown,
  trackLyricsOptionSelected,
  trackLyricsRegenerated,
  trackLyricsRefined,
} from "@/lib/analytics/events";
import LoginScreen from "@/components/auth/LoginScreen";
import { useSessionReady } from "@/components/auth/SessionBridge";
import { createSnippet, serializeConceptForStorage } from "@/lib/library/utils";
import { useI18n } from "@/providers/I18nProvider";
import { showToast } from "@/lib/toast";
import { stringifyGenerationProgress } from "@/types/generation";
import { getBaseUrl } from "@/lib/utils/getBaseUrl";
import { useRouter } from "next/navigation";
import { getUserTier, getConcurrentLimit } from "@/lib/utils/userTier";
import { checkConcurrentLimit } from "@/lib/utils/concurrentGenerations";
import { TOAST_MESSAGES } from "@/lib/config";

// DEV_MODE: When true, bypasses authentication (set NEXT_PUBLIC_DEV_MODE=false for production)
const DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === 'true';

// TWO_AGENT_SYSTEM: When true, uses the two-agent conversation system
const ENABLE_TWO_AGENT_SYSTEM = process.env.NEXT_PUBLIC_ENABLE_TWO_AGENT_SYSTEM !== 'false';
const MIN_CONVERSATION_ROUNDS = parseInt(process.env.NEXT_PUBLIC_MIN_CONVERSATION_ROUNDS || '6');
const MAX_CONVERSATION_ROUNDS = parseInt(process.env.NEXT_PUBLIC_MAX_CONVERSATION_ROUNDS || '10');

// Task 5.3: LYRICS_COMPARE Feature Flag
const ENABLE_LYRICS_COMPARE = process.env.NEXT_PUBLIC_ENABLE_LYRICS_COMPARE === 'true';

const PARAMETER_TEMPLATES: ParameterSheetTemplate[] = [
  ...MUSIC_TEMPLATES,
  SURPRISE_ME_TEMPLATE,
].map(({ id, name, imageUrl, icon }) => ({
  id,
  name,
  imageUrl,
  icon,
}));

const DEFAULT_SONG_SETTINGS: UserPreferences = {
  language: "Nederlands",
  vocalGender: "neutral",
  vocalAge: undefined,
  mood: ["romantisch"],
  makeInstrumental: false,
};

type MobileConversationPayload = {
  conversationPhase?: ConversationPhase;
  roundNumber?: number;
  readinessScore?: number;
  extractedContext?: ExtractedContext | null;
  songSettings?: UserPreferences | null;
  selectedTemplateId?: string | null;
  templateConfig?: MusicTemplate['sunoConfig'] | null;
  lyricsTaskId?: string | null;
  conceptTitle?: string | null;
  conceptLyrics?: ConceptLyrics | null;
  conceptHistory?: ConceptLyrics[] | null;
  updatedAt?: number;
};

type MobileConversationResponse = {
  conversation: {
    id: string;
    createdAt: number;
    updatedAt?: number;
    status?: string | null;
    conversationPhase?: ConversationPhase | null;
    roundNumber?: number | null;
    readinessScore?: number | null;
    extractedContext?: ExtractedContext | null;
    songSettings?: UserPreferences | null;
    selectedTemplateId?: string | null;
    templateConfig?: MusicTemplate['sunoConfig'] | null;
    lyricsTaskId?: string | null;
    conceptTitle?: string | null;
    conceptLyrics?: ConceptLyrics | null;
    conceptHistory?: ConceptLyrics[] | null;
  };
};

type MobileMessagePayload = {
  conversationId: string;
  role: "user" | "assistant";
  content: string;
  composerContext?: string | null;
};

type MobileSongCreatePayload = {
  songId: string;
  conversationId: string;
  title: string;
  lyrics: string;
  musicStyle: string;
  generationParams: UserPreferences;
  templateId?: string | null;
  taskId?: string | null;
  lyricsSnippet?: string | null;
  status?: string;
  selectedVariantId?: string | null;
  updatedAt?: number;
  isPublic?: boolean;
};

type MobileVariantPayload = {
  songId: string;
  trackId: string;
  title?: string;
  streamAudioUrl?: string | null;
  audioUrl?: string | null;
  sourceAudioUrl?: string | null;
  sourceStreamAudioUrl?: string | null;
  imageUrl?: string | null;
  durationSeconds?: number | null;
  modelName?: string | null;
  prompt?: string | null;
  tags?: string | null;
  order?: number | null;
  streamAvailableAt?: number | null;
  downloadAvailableAt?: number | null;
};

type MobileSongUpdatePayload = {
  status?: string;
  errorMessage?: string | null;
  sunoTaskId?: string | null;
  variants?: MobileVariantPayload[];
  lyrics?: string;
  lyricsSnippet?: string | null;
  selectedVariantId?: string | null;
  updatedAt?: number;
  lastPlayedAt?: number | null;
};

async function mobileRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: "include",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed (${res.status})`);
  }
  return (await res.json()) as T;
}

async function mobileGetActiveConversation() {
  const res = await fetch("/api/mobile/conversations", {
    credentials: "include",
  });
  if (res.status === 404) {
    return null;
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed (${res.status})`);
  }
  return (await res.json()) as MobileConversationResponse;
}

async function mobileCreateConversation(payload: MobileConversationPayload = {}) {
  return mobileRequest<MobileConversationResponse>("/api/mobile/conversations", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

async function mobileUpdateConversation(id: string, payload: MobileConversationPayload) {
  return mobileRequest<MobileConversationResponse>(`/api/mobile/conversations/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

async function mobileCreateMessage(payload: MobileMessagePayload) {
  return mobileRequest<{ ok: true }>(`/api/mobile/messages`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

async function mobileCreateSong(payload: MobileSongCreatePayload) {
  return mobileRequest<{ ok: true }>(`/api/mobile/songs`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

async function mobileUpdateSong(songId: string, payload: MobileSongUpdatePayload) {
  return mobileRequest<{ ok: true }>(`/api/mobile/songs/${songId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

/**
 * Task 2.1: Fetch messages for a conversation with pagination
 * Mobile version: calls /api/mobile/messages
 */
async function mobileFetchMessages(conversationId: string, limit = 50, offset = 0) {
  const params = new URLSearchParams({
    conversationId,
    limit: String(limit),
    offset: String(offset),
  });
  return mobileRequest<{
    messages: any[];
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  }>(`/api/mobile/messages?${params.toString()}`, {
    method: "GET",
  });
}

/**
 * Task 2.1: Fetch messages for a conversation
 * Desktop version: uses InstantDB query
 */
async function desktopFetchMessages(conversationId: string) {
  const { messages } = await db.queryOnce({
    messages: {
      $: {
        where: {
          "conversation.id": conversationId,
        },
      } as any,
    },
  });

  if (!messages) {
    return { messages: [], total: 0, hasMore: false };
  }

  // Sort by createdAt ascending (oldest first)
  const sortedMessages = messages.sort((a: any, b: any) => {
    const aTime = a.createdAt || 0;
    const bTime = b.createdAt || 0;
    return aTime - bTime;
  });

  return {
    messages: sortedMessages,
    total: sortedMessages.length,
    hasMore: false,
  };
}

function useConversationData(conversationId: string | null, isMobile: boolean) {
  if (isMobile) {
    return { data: null as any };
  }

  return db.useQuery({
    conversations: conversationId
      ? {
          $: { where: { id: conversationId } } as any,
        }
      : {},
  });
}

function useSongData(currentSong: { songId?: string | null } | null, isMobile: boolean) {
  if (isMobile) {
    return { data: null as any };
  }

  return db.useQuery({
    songs: currentSong?.songId
      ? {
          $: {
            where: {
              id: currentSong.songId,
            },
          } as any,
          variants: {},
        }
      : {},
  });
}

export default function StudioClient({ isMobile }: { isMobile: boolean }) {
  const router = useRouter();
  const { strings } = useI18n();
  const [messages, setMessages] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [latestComposerContext, setLatestComposerContext] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Task 2.2: Message history loading state
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [allMessagesLoaded, setAllMessagesLoaded] = useState(false);
  const [totalMessageCount, setTotalMessageCount] = useState(0);
  const [messageOffset, setMessageOffset] = useState(0);

  // Task 3.2: Non-blocking AI response loading indicator
  const [isWaitingForAI, setIsWaitingForAI] = useState(false);

  // Two-agent system state
  const [conversationPhase, setConversationPhase] = useState<ConversationPhase>('gathering');
  const [roundNumber, setRoundNumber] = useState(0);
  const [extractedContext, setExtractedContext] = useState<ExtractedContext>({
    memories: [],
    emotions: [],
    partnerTraits: [],
  });
  const [readinessScore, setReadinessScore] = useState(0);
  const [latestLyrics, setLatestLyrics] = useState<any | null>(null);
  const [conceptLyrics, setConceptLyrics] = useState<ConceptLyrics | null>(null);
  const conceptHistoryRef = useRef<ConceptLyrics[]>([]);
  // Song settings (user-controlled)
  const [songSettings, setSongSettings] = useState<UserPreferences>(DEFAULT_SONG_SETTINGS);

  // Music generation state
  const [isGeneratingMusic, setIsGeneratingMusic] = useState(false);
  const [generationStage, setGenerationStage] = useState<1 | 2 | 3 | null>(null);
  const [currentSong, setCurrentSong] = useState<any | null>(null);
  const [showVariantSelector, setShowVariantSelector] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  // Mobile-only: local store for generated variants (since mobile avoids live DB queries)
  const [mobileVariants, setMobileVariants] = useState<any[]>([]);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isRefiningLyrics, setIsRefiningLyrics] = useState(false);
  const [refinementCount, setRefinementCount] = useState(0);
  const [surpriseModeSelections, setSurpriseModeSelections] = useState(0);
  const [lyricsOptions, setLyricsOptions] = useState<string[]>([]);
  const [selectedLyricIndex, setSelectedLyricIndex] = useState<number | null>(null);
  const [refineUsed, setRefineUsed] = useState(false);
  const [manualEdited, setManualEdited] = useState(false);
  const [lyricsTaskId, setLyricsTaskId] = useState<string | null>(null);
  const [pendingLyricVariants, setPendingLyricVariants] = useState<string[]>([]);
  const [isSavingLyricSelection, setIsSavingLyricSelection] = useState(false);
  const [pendingLyricSource, setPendingLyricSource] = useState<'suno' | 'suno-refine'>('suno');
  const [isParameterSheetOpen, setIsParameterSheetOpen] = useState(false);
  const [isMobileLyricsOpen, setIsMobileLyricsOpen] = useState(false);
  // Task 6.1: Error state
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [hasHydratedConversation, setHasHydratedConversation] = useState(!isMobile);
  const [isHydratingConversation, setIsHydratingConversation] = useState(isMobile);
  const [hydrationError, setHydrationError] = useState<string | null>(null);

  // Task 4.1, 4.2: Template selection state
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [templateConfig, setTemplateConfig] = useState<MusicTemplate['sunoConfig'] | null>(null);
  const [advancedSettings, setAdvancedSettings] =
    useState<AdvancedSettings>(DEFAULT_ADVANCED_SETTINGS);
  const resetAdvancedSettingsToTemplate = () => {
    if (!templateConfig) return;
    setAdvancedSettings((prev) => ({
      ...prev,
      model: templateConfig.model,
      styleWeight:
        typeof templateConfig.styleWeight === "number"
          ? templateConfig.styleWeight
          : DEFAULT_ADVANCED_SETTINGS.styleWeight,
      weirdnessConstraint:
        typeof templateConfig.weirdnessConstraint === "number"
          ? templateConfig.weirdnessConstraint
          : DEFAULT_ADVANCED_SETTINGS.weirdnessConstraint,
      audioWeight:
        typeof templateConfig.audioWeight === "number"
          ? templateConfig.audioWeight
          : DEFAULT_ADVANCED_SETTINGS.audioWeight,
      negativeTags: templateConfig.negativeTags ?? DEFAULT_ADVANCED_SETTINGS.negativeTags,
    }));
  };

  const [musicParameters, setMusicParameters] = useState<ParameterValues>({
    language: "Nederlands",
    vocalGender: DEFAULT_ADVANCED_SETTINGS.vocalGender,
    vocalAge: undefined,
  });
  const [parameterSheetDefaults, setParameterSheetDefaults] = useState<ParameterValues | null>(null);
  const [isParameterSheetSubmitting, setIsParameterSheetSubmitting] = useState(false);
  const [customSongTitle, setCustomSongTitle] = useState<string>("");
  const [makeInstrumental, setMakeInstrumental] = useState<boolean>(false);

  useEffect(() => {
    if (!isMobile) return;
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyHeight = document.body.style.height;
    const previousHtmlHeight = document.documentElement.style.height;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    document.body.style.height = "100%";
    document.documentElement.style.height = "100%";
    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.height = previousBodyHeight;
      document.documentElement.style.height = previousHtmlHeight;
    };
  }, [isMobile]);

  const computeParameterDefaults = useCallback((): ParameterValues => {
    const baseLanguage = songSettings.language || "Nederlands";
    const advancedGender = advancedSettings.enabled ? advancedSettings.vocalGender : undefined;
    const baseGender =
      songSettings.vocalGender ||
      advancedGender ||
      DEFAULT_ADVANCED_SETTINGS.vocalGender;
    return {
      language: baseLanguage,
      vocalGender: baseGender,
      vocalAge: songSettings.vocalAge,
    };
  }, [
    songSettings.language,
    songSettings.vocalGender,
    songSettings.vocalAge,
    advancedSettings.enabled,
    advancedSettings.vocalGender,
  ]);

  useEffect(() => {
    const defaults = computeParameterDefaults();
    setMusicParameters((prev) => ({
      language: prev.language || defaults.language,
      vocalGender: prev.vocalGender || defaults.vocalGender,
      vocalAge: prev.vocalAge ?? defaults.vocalAge,
    }));
  }, [computeParameterDefaults]);

  useEffect(() => {
    if (songSettings.makeInstrumental !== undefined) {
      setMakeInstrumental(Boolean(songSettings.makeInstrumental));
    }
  }, [songSettings.makeInstrumental]);

  useEffect(() => {
    if (latestLyrics?.title && !customSongTitle) {
      setCustomSongTitle(latestLyrics.title);
    }
  }, [latestLyrics?.title, customSongTitle]);

  const user = db.useAuth();
  const sessionReady = useSessionReady();
  const [sessionTimeout, setSessionTimeout] = useState(false);
  const isKeyboardOpen = useKeyboardOpen();

  // Task 3.6, 3.7: InstantDB subscription for song status updates
  // IMPORTANT: Always call ALL hooks unconditionally at the top, before any early returns
  const { data: songData } = useSongData(currentSong, isMobile);
  const { data: convData } = useConversationData(conversationId, isMobile);

  // PRD-0016: Query user's songs for concurrent generation checking
  const { data: userSongsData } = db.useQuery(
    user?.user?.id ? {
      songs: {
        $: {
          where: {
            'user.id': user.user.id,
          },
        },
      },
    } : {}
  );

  // Timeout fallback: if session isn't ready after 5 seconds, proceed anyway
  useEffect(() => {
    if (!DEV_MODE && isMobile && user.user && !sessionReady) {
      const timer = setTimeout(() => {
        console.warn('[StudioClient] Session ready timeout, proceeding anyway');
        setSessionTimeout(true);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isMobile, user.user, sessionReady]);

  // NOTE: Early returns have been removed from here to fix React hooks ordering.
  // Auth and loading checks are now handled later (after all hooks) at lines ~1850-1870

  type ConversationUpdateInput = {
    readinessScore?: number;
    roundNumber?: number;
    extractedContext?: ExtractedContext | null;
    concept?: ConceptLyrics | null;
    songSettings?: UserPreferences;
    selectedTemplateId?: string | null;
    templateConfig?: MusicTemplate['sunoConfig'] | null;
    lyricsTaskId?: string | null;
    conversationPhase?: ConversationPhase;
    status?: string;
  };

  const updateConversationRecord = useCallback(
    async (input: ConversationUpdateInput) => {
      if (!conversationId || DEV_MODE) return;

      const now = Date.now();

      let conceptPayload:
        | {
            conceptTitle: string | null;
            conceptLyrics: string | null;
            conceptHistory: string | null;
            conceptHistoryArray: ConceptLyrics[];
          }
        | null = null;

      if (Object.prototype.hasOwnProperty.call(input, "concept")) {
        const serialized = serializeConceptForStorage(
          input.concept ?? null,
          conceptHistoryRef.current
        );
        const parsedHistory = serialized.conceptHistory
          ? (JSON.parse(serialized.conceptHistory) as ConceptLyrics[])
          : input.concept
          ? [input.concept]
          : [];
        conceptHistoryRef.current = parsedHistory;
        conceptPayload = {
          conceptTitle: serialized.conceptTitle,
          conceptLyrics: serialized.conceptLyrics,
          conceptHistory: serialized.conceptHistory,
          conceptHistoryArray: parsedHistory,
        };
      }

      const baseUpdate: Record<string, unknown> = { updatedAt: now };

      if (input.roundNumber !== undefined) baseUpdate.roundNumber = input.roundNumber;
      if (input.readinessScore !== undefined) baseUpdate.readinessScore = input.readinessScore;
      if (input.lyricsTaskId !== undefined) baseUpdate.lyricsTaskId = input.lyricsTaskId;
      if (input.conversationPhase !== undefined)
        baseUpdate.conversationPhase = input.conversationPhase;
      if (input.status !== undefined) baseUpdate.status = input.status;

      if (conceptPayload) {
        baseUpdate.conceptTitle = conceptPayload.conceptTitle;
        baseUpdate.conceptLyrics = conceptPayload.conceptLyrics;
        baseUpdate.conceptHistory = conceptPayload.conceptHistory;
      }

      if (!isMobile) {
        const updateData: Record<string, unknown> = {
          ...baseUpdate,
        };
        if (input.extractedContext !== undefined) {
          updateData.extractedContext = input.extractedContext
            ? stringifyExtractedContext(input.extractedContext)
            : null;
        }
        if (input.songSettings) {
          updateData.songSettings = JSON.stringify(input.songSettings);
        }
        if (input.selectedTemplateId !== undefined) {
          updateData.selectedTemplateId = input.selectedTemplateId;
        }
        if (input.templateConfig !== undefined) {
          updateData.templateConfig = input.templateConfig
            ? JSON.stringify(input.templateConfig)
            : null;
        }

        try {
          await db.transact([
            db.tx.conversations[conversationId].update(updateData),
          ]);
        } catch (error) {
          console.warn("Failed to update conversation record", error);
        }
        return;
      }

      const mobilePayload: MobileConversationPayload = {
        updatedAt: now,
      };

      if (input.roundNumber !== undefined) mobilePayload.roundNumber = input.roundNumber;
      if (input.readinessScore !== undefined) {
        mobilePayload.readinessScore = input.readinessScore;
      }
      if (input.extractedContext !== undefined) {
        mobilePayload.extractedContext = input.extractedContext ?? null;
      }
      if (input.songSettings) {
        mobilePayload.songSettings = input.songSettings;
      }
      if (input.selectedTemplateId !== undefined) {
        mobilePayload.selectedTemplateId = input.selectedTemplateId;
      }
      if (input.templateConfig !== undefined) {
        mobilePayload.templateConfig = input.templateConfig ?? null;
      }
      if (input.lyricsTaskId !== undefined) mobilePayload.lyricsTaskId = input.lyricsTaskId;
      if (input.conversationPhase !== undefined) {
        mobilePayload.conversationPhase = input.conversationPhase;
      }
      if (conceptPayload) {
        mobilePayload.conceptTitle = conceptPayload.conceptTitle ?? null;
        mobilePayload.conceptLyrics = input.concept ?? null;
        mobilePayload.conceptHistory = conceptPayload.conceptHistoryArray;
      }

      try {
        await mobileUpdateConversation(conversationId, mobilePayload);
      } catch (error) {
        console.warn("Failed to update conversation record (mobile)", error);
      }
    },
    [DEV_MODE, conversationId, isMobile, db, mobileUpdateConversation]
  );

  const syncLyricsTaskId = useCallback(
    async (value: string | null) => {
      await updateConversationRecord({ lyricsTaskId: value });
    },
    [updateConversationRecord]
  );

  const updateSongRecord = useCallback(
    async (
      songId: string,
      input: {
        status?: string;
        lyrics?: string;
        lyricsSnippet?: string | null;
        selectedVariantId?: string | null;
        lastPlayedAt?: number | null;
        errorMessage?: string | null;
      }
    ) => {
      if (DEV_MODE) return;
      const now = Date.now();

      if (isMobile) {
        const payload: MobileSongUpdatePayload = {
          updatedAt: now,
        };
        if (input.status !== undefined) payload.status = input.status;
        if (input.errorMessage !== undefined) {
          payload.errorMessage = input.errorMessage;
        }
        if (input.lyrics !== undefined) payload.lyrics = input.lyrics;
        if (input.lyricsSnippet !== undefined) payload.lyricsSnippet = input.lyricsSnippet;
        if (input.selectedVariantId !== undefined) {
          payload.selectedVariantId = input.selectedVariantId;
        }
        if (input.lastPlayedAt !== undefined) payload.lastPlayedAt = input.lastPlayedAt;
        await mobileUpdateSong(songId, payload);
      } else {
        const updateData: Record<string, unknown> = { updatedAt: now };
        if (input.status !== undefined) updateData.status = input.status;
        if (input.errorMessage !== undefined) updateData.errorMessage = input.errorMessage;
        if (input.lyrics !== undefined) updateData.lyrics = input.lyrics;
        if (input.lyricsSnippet !== undefined) updateData.lyricsSnippet = input.lyricsSnippet;
        if (input.selectedVariantId !== undefined) {
          updateData.selectedVariantId = input.selectedVariantId;
        }
        if (input.lastPlayedAt !== undefined) {
          updateData.lastPlayedAt = input.lastPlayedAt;
        }
        await db.transact([db.tx.songs[songId].update(updateData)]);
      }
    },
    [DEV_MODE, db, isMobile, mobileUpdateSong]
  );

  // Create or hydrate conversation on mount
  useEffect(() => {
    const isLoading = DEV_MODE ? false : user.isLoading;
    const currentUser = DEV_MODE
      ? (user.user || { id: 'dev-user-123', email: 'dev@example.com' })
      : user.user;

    if (isLoading || !currentUser) return;

    if (isMobile) {
      if (hasHydratedConversation) return;

      // For mobile, wait for session to be ready before hydrating
      if (!DEV_MODE && !sessionReady) return;

      setIsHydratingConversation(true);
      (async () => {
        try {
          const existing = await mobileGetActiveConversation();

          // If existing conversation is complete/refining, create a new one instead
          const shouldCreateNew = !existing?.conversation ||
            existing.conversation.conversationPhase === 'complete' ||
            existing.conversation.conversationPhase === 'refining' ||
            existing.conversation.conversationPhase === 'generating';

          if (existing?.conversation && !shouldCreateNew) {
            const conversation = existing.conversation;
            console.log('[Mobile Hydration] Reusing existing conversation', {
              id: conversation.id,
              phase: conversation.conversationPhase,
              round: conversation.roundNumber
            });
            setConversationId(conversation.id);
            setConversationPhase(conversation.conversationPhase ?? 'gathering');
            setRoundNumber(conversation.roundNumber ?? 0);
            setReadinessScore(conversation.readinessScore ?? 0);
            if (conversation.extractedContext) {
              setExtractedContext(conversation.extractedContext);
            }
            if (conversation.songSettings) {
              setSongSettings((prev) => ({
                ...prev,
                ...conversation.songSettings,
              }));
            }
            if (conversation.selectedTemplateId) {
              setSelectedTemplateId(conversation.selectedTemplateId);
            }
            if (conversation.templateConfig) {
              setTemplateConfig(conversation.templateConfig);
            }
            if (conversation.lyricsTaskId) {
              setLyricsTaskId(conversation.lyricsTaskId);
            }
            if (conversation.conceptLyrics) {
              setConceptLyrics(conversation.conceptLyrics);
              const history = conversation.conceptHistory && conversation.conceptHistory.length
                ? conversation.conceptHistory
                : [conversation.conceptLyrics];
              conceptHistoryRef.current = history;
            }
          } else {
            console.log('[Mobile Hydration] Creating new conversation');
            const reason = !existing?.conversation ? 'no existing' :
              `existing is ${existing.conversation.conversationPhase}`;
            console.log('[Mobile Hydration] Reason:', reason);
            const created = await mobileCreateConversation({
              songSettings: DEFAULT_SONG_SETTINGS,
            });
            setConversationId(created.conversation.id);
            setConversationPhase(created.conversation.conversationPhase ?? 'gathering');
            setRoundNumber(created.conversation.roundNumber ?? 0);
            setReadinessScore(created.conversation.readinessScore ?? 0);
          }
          setHydrationError(null);
        } catch (error: any) {
          console.error("Failed to hydrate mobile conversation", error);
          setHydrationError(error.message || "Kon gesprek niet laden");
        } finally {
          setHasHydratedConversation(true);
          setIsHydratingConversation(false);
        }
      })();
      return;
    }

    const convId = id();
    setConversationId(convId);

    if (!DEV_MODE) {
      const now = Date.now();
      db.transact([
        db.tx.conversations[convId]
          .update({
            createdAt: now,
            updatedAt: now,
            currentStep: 0,
            status: "active",
            conversationPhase: "gathering",
            roundNumber: 0,
            readinessScore: 0,
            songSettings: JSON.stringify(songSettings),
          })
          .link({ user: currentUser.id }),
      ]);
    }
  }, [user.isLoading, user.user, isMobile, hasHydratedConversation, sessionReady]);

  // Task 2.2: Load all messages when conversation is hydrated
  useEffect(() => {
    if (!conversationId) return;

    // For mobile, wait until conversation is hydrated
    if (isMobile && !hasHydratedConversation) return;

    // Skip if already loading or if we've already loaded messages for this conversation
    if (isLoadingMessages || messages.length > 0) return;

    const loadMessages = async () => {
      setIsLoadingMessages(true);
      const startTime = Date.now();

      try {
        let result;
        if (isMobile) {
          console.log('[Task 2.2] Fetching messages for mobile, conversationId:', conversationId);
          result = await mobileFetchMessages(conversationId, 50, 0);
        } else {
          console.log('[Task 2.2] Fetching messages for desktop, conversationId:', conversationId);
          result = await desktopFetchMessages(conversationId);
        }

        const duration = Date.now() - startTime;
        console.log(`[Task 2.2] Loaded ${result.messages.length} messages in ${duration}ms`);

        // Set messages in state
        setMessages(result.messages || []);
        setTotalMessageCount(result.total || 0);
        setAllMessagesLoaded(!result.hasMore);
        setMessageOffset(result.messages?.length || 0);
      } catch (error: any) {
        console.error('[Task 2.2] Failed to load messages:', error);
        // Don't block the UI - just log the error
        // User can still send new messages
      } finally {
        setIsLoadingMessages(false);
      }
    };

    loadMessages();
  }, [conversationId, hasHydratedConversation, isMobile]);

  // Chat container + bottom sentinel for scroll management
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Measure composer to reserve space so last messages aren't hidden
  const composerRef = useRef<HTMLDivElement>(null);
  const [composerHeight, setComposerHeight] = useState(0);
  useEffect(() => {
    if (!composerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (rect) setComposerHeight(Math.ceil(rect.height));
    });
    ro.observe(composerRef.current);
    return () => ro.disconnect();
  }, []);

  // Task 4.3: Auto-scroll to the bottom when messages grow
  // Task 4.4: Sticky scroll - only auto-scroll if user is already near the bottom
  const prevMessagesLengthRef = useRef(messages.length);
  useEffect(() => {
    if (messages.length !== prevMessagesLengthRef.current) {
      prevMessagesLengthRef.current = messages.length;

      requestAnimationFrame(() => {
        if (!chatContainerRef.current || !bottomRef.current) return;

        // Task 4.4: Use isNearBottom helper with 200px threshold
        const nearBottom = isNearBottom(chatContainerRef.current, 200);

        // Only auto-scroll if user is already near bottom or it's a new conversation
        if (nearBottom || messages.length <= 2) {
          // Task 4.3: Use scrollToElement helper for smooth scrolling
          scrollToElement(bottomRef.current, 'smooth', 'end');
        }
      });
    }
  }, [messages.length]);

  // Task 4.5: Re-scroll on keyboard or composer height changes (mobile viewport shifts)
  // But only if user was already at the bottom
  useEffect(() => {
    requestAnimationFrame(() => {
      if (!chatContainerRef.current || !bottomRef.current) return;

      // Tighter threshold (100px) for keyboard changes
      const nearBottom = isNearBottom(chatContainerRef.current, 100);

      if (nearBottom) {
        scrollToElement(bottomRef.current, 'smooth', 'end');
      }
    });
  }, [isKeyboardOpen, composerHeight]);

  useEffect(() => {
    if (refinementCount > 0) {
      console.log('[analytics] total_refinements', refinementCount);
    }
  }, [refinementCount]);

  useEffect(() => {
    if (surpriseModeSelections > 0) {
      console.log('[analytics] surprise_mode_selected', { count: surpriseModeSelections });
    }
  }, [surpriseModeSelections]);

  // Task 7.9: Cleanup polling interval on component unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!currentSong?.songId || !songData?.songs) return;

    const song = songData.songs.find((s: any) => s.id === currentSong.songId);

    if (song && (song.status === 'ready' || song.status === 'complete')) {
      console.log('Song status changed to ready/complete via InstantDB subscription');

      // Task 3.10: Stop polling when callback arrives
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }

      // Task 3.12: Show variant selector
      setIsGeneratingMusic(false);
      setGenerationStage(null);
      setShowVariantSelector(true);
    }
  }, [songData, currentSong?.songId]);

  // Hydrate local state from DB when available (desktop only)
  useEffect(() => {
    if (isMobile) return;
    try {
      const conv = convData?.conversations?.[0];
      if (conv?.songSettings) {
        const parsed = JSON.parse(conv.songSettings);
        // Only update if different to avoid loops
        const current = JSON.stringify(songSettings);
        const incoming = JSON.stringify(parsed);
        if (incoming !== current) {
          setSongSettings(parsed);
        }
      }
    } catch (e) {
      console.warn('Failed to parse songSettings from DB:', e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [convData?.conversations, isMobile]);

  // Persist settings to DB when they change
  useEffect(() => {
    if (DEV_MODE || !conversationId) return;
    if (isMobile && (!hasHydratedConversation || isHydratingConversation)) return;

    (async () => {
      try {
        await updateConversationRecord({ songSettings });
      } catch (e) {
        console.warn('Failed to persist songSettings:', e);
      }
    })();
  }, [songSettings, hasHydratedConversation, isHydratingConversation, updateConversationRecord]);

  // Task 4.5: Persist template selection to InstantDB
  useEffect(() => {
    if (DEV_MODE || !conversationId || !selectedTemplateId) return;
    if (isMobile && (!hasHydratedConversation || isHydratingConversation)) return;
    (async () => {
      try {
        await updateConversationRecord({
          selectedTemplateId,
          templateConfig: templateConfig || null,
        });
        console.log('✅ Template selection persisted');
      } catch (e) {
        console.warn('Failed to persist template selection:', e);
      }
    })();
  }, [
    selectedTemplateId,
    templateConfig,
    hasHydratedConversation,
    isHydratingConversation,
    updateConversationRecord,
  ]);

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue((prev) => {
      const separator = prev.trim() ? " " : "";
      return `${prev}${separator}${suggestion}`;
    });
  };

  /**
   * Check if user intent triggers early lyrics generation
   */
  const detectUserTrigger = (message: string): boolean => {
    const lowerMessage = message.toLowerCase();
    const triggerPhrases = [
      'maak het liedje',
      'genereer nu',
      'ik ben klaar',
      'maak nu',
      'genereer het liedje',
      'schrijf het liedje',
    ];
    return triggerPhrases.some((phrase) => lowerMessage.includes(phrase));
  };

  /**
   * Check if conversation should transition to lyrics generation
   */
  const shouldTransitionToGeneration = (
    currentRound: number,
    score: number,
    userMessage: string
  ): boolean => {
    // User explicitly triggers
    if (detectUserTrigger(userMessage)) {
      return true;
    }

    // Auto-trigger: min rounds met AND sufficient score
    if (currentRound >= MIN_CONVERSATION_ROUNDS && score >= 0.7) {
      return true;
    }

    // Max-rounds trigger: force transition
    if (currentRound >= MAX_CONVERSATION_ROUNDS) {
      return true;
    }

    return false;
  };

  /**
   * Task 2.4: Load more historical messages (batch loading)
   */
  const handleLoadMoreMessages = async () => {
    if (!conversationId || isLoadingMessages || allMessagesLoaded) return;

    setIsLoadingMessages(true);

    // Task 2.5: Track scroll position before loading
    const container = chatContainerRef.current;
    if (!container) {
      setIsLoadingMessages(false);
      return;
    }

    const scrollHeightBefore = container.scrollHeight;
    const scrollTopBefore = container.scrollTop;

    try {
      const limit = 30; // Load 30 messages per batch
      const offset = messageOffset;

      let result;
      if (isMobile) {
        console.log(`[Task 2.4] Loading more messages (mobile), offset: ${offset}, limit: ${limit}`);
        result = await mobileFetchMessages(conversationId, limit, offset);
      } else {
        // Desktop loads all at once, so this shouldn't be called
        // But handle it just in case
        console.log('[Task 2.4] Desktop should have loaded all messages already');
        setAllMessagesLoaded(true);
        setIsLoadingMessages(false);
        return;
      }

      if (result.messages && result.messages.length > 0) {
        // Prepend older messages to the beginning of the array
        setMessages((prev) => [...result.messages, ...prev]);
        setMessageOffset(offset + result.messages.length);
        setAllMessagesLoaded(!result.hasMore);

        console.log(`[Task 2.4] Loaded ${result.messages.length} more messages`);

        // Task 2.5: Restore scroll position after new messages are rendered
        // Use requestAnimationFrame to wait for DOM update
        requestAnimationFrame(() => {
          if (!container) return;

          const scrollHeightAfter = container.scrollHeight;
          const heightAdded = scrollHeightAfter - scrollHeightBefore;

          // Scroll down by the amount of height added to maintain relative position
          container.scrollTop = scrollTopBefore + heightAdded;

          console.log(`[Task 2.5] Preserved scroll position: added ${heightAdded}px`);
        });
      } else {
        // No more messages
        setAllMessagesLoaded(true);
      }
    } catch (error: any) {
      console.error('[Task 2.4] Failed to load more messages:', error);
      // Don't block UI - just log error
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleSendMessage = async () => {
    const currentUser = DEV_MODE
      ? (user.user || { id: 'dev-user-123', email: 'dev@example.com' })
      : user.user;

    if (!inputValue.trim() || !conversationId || !currentUser) return;

    const userMessage = {
      role: "user" as const,
      content: inputValue,
    };

    // Task 3.1: Add user message immediately (already done)
    setMessages((prev) => [...prev, userMessage]);
    const userInput = inputValue; // Save before clearing
    setInputValue("");

    // Task 3.2: Set loading state but don't block input
    setIsLoading(true);
    setIsWaitingForAI(true);

    // Increment round number
    const newRoundNumber = roundNumber + 1;
    setRoundNumber(newRoundNumber);

    // Persist user message (skip writes in dev mode)
    if (!DEV_MODE) {
      try {
        if (isMobile) {
          await mobileCreateMessage({
            conversationId,
            role: "user",
            content: userInput,
          });
        } else {
          const userMsgId = id();
          await db.transact([
            db.tx.messages[userMsgId]
              .update({
                role: "user",
                content: userInput,
                createdAt: Date.now(),
              })
              .link({ conversation: conversationId || undefined }),
          ]);
        }
      } catch (error) {
        console.warn("Failed to persist user message", error);
      }
    }

    try {
      // Feature flag: Use two-agent system or fallback to old system
      console.log('[Chat Debug]', {
        ENABLE_TWO_AGENT_SYSTEM,
        conversationPhase,
        willUseNewSystem: ENABLE_TWO_AGENT_SYSTEM && conversationPhase === 'gathering'
      });

      if (ENABLE_TWO_AGENT_SYSTEM && conversationPhase === 'gathering') {
        await handleConversationPhase(userMessage, newRoundNumber, userInput);
      } else {
        await handleLegacyChat(userMessage);
      }
    } catch (error: any) {
      console.error("Chat error:", error);
      // Task 3.4: Show error message with option to retry
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Sorry, er ging iets mis: ${error.message}`,
        },
      ]);
    } finally {
      setIsLoading(false);
      setIsWaitingForAI(false);
    }
  };

  /**
   * Handle conversation phase (gathering context)
   */
  const handleConversationPhase = async (
    userMessage: any,
    currentRound: number,
    userInput: string
  ) => {
    // Prefer streaming endpoint for better UX; fallback to non-streaming
    const tryStreaming = async (): Promise<boolean> => {
      try {
        const placeholderIdx = messages.length + 1; // after we append user message
        setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

        const res = await fetch('/api/chat/conversation/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [...messages, userMessage],
            conversationRound: currentRound - 1,
            existingContext: stringifyExtractedContext(extractedContext),
          }),
        });

        if (!res.ok || !res.body) throw new Error('stream not available');

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let finalMeta: any = null;

        const appendDelta = (delta: string) => {
          setMessages((prev) => {
            const next = prev.slice();
            // Ensure last is assistant placeholder
            const idx = next.length - 1;
            if (idx >= 0 && next[idx]?.role === 'assistant') {
              next[idx] = { ...next[idx], content: (next[idx].content || '') + delta };
            }
            return next;
          });
        };

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const chunks = buffer.split('\n\n');
          buffer = chunks.pop() || '';
          for (const chunk of chunks) {
            const lines = chunk.split('\n');
            const eventLine = lines.find(l => l.startsWith('event: '));
            const dataLine = lines.find(l => l.startsWith('data: '));
            if (!dataLine) continue;
            const event = eventLine ? eventLine.slice(7).trim() : '';
            const dataStr = dataLine.slice(6).trim();
            if (event === 'delta') {
              try { const j = JSON.parse(dataStr); if (j.text) appendDelta(j.text); } catch {}
            } else if (event === 'meta') {
              try { finalMeta = JSON.parse(dataStr); } catch {}
            } else if (event === 'error') {
              throw new Error(dataStr);
            }
          }
        }

        // Apply meta (context/readiness) if provided
        if (finalMeta) {
          const {
            message,
            extractedContext: ctx,
            readinessScore,
            conceptLyrics: conceptFromMeta,
          } = finalMeta;
          setExtractedContext(ctx);
          setReadinessScore(readinessScore);
          // PRD-0016: Concept lyrics not needed - using Suno for generation
          // if (conceptFromMeta) setConceptLyrics(conceptFromMeta);

          if (!DEV_MODE && conversationId) {
            try {
              if (isMobile) {
                await mobileCreateMessage({ conversationId, role: 'assistant', content: message });
              } else {
                const aiMsgId = id();
                await db.transact([
                  db.tx.messages[aiMsgId]
                    .update({ role: 'assistant', content: message, createdAt: Date.now() })
                    .link({ conversation: conversationId || undefined }),
                ]);
              }
              await updateConversationRecord({
                roundNumber: currentRound,
                readinessScore,
                extractedContext: ctx,
                // PRD-0016: Concept lyrics not needed - using Suno for generation
                // concept: conceptFromMeta ?? null,
              });
            } catch (e) {
              console.warn('Failed to persist assistant message (stream)', e);
              // Continue even if persistence fails - streaming succeeded
            }
          }

          // Wrap transition check in try-catch to prevent unhandled errors
          try {
            if (shouldTransitionToGeneration(currentRound, readinessScore, userInput)) {
              await transitionToLyricsGeneration();
            }
          } catch (e) {
            console.warn('Failed to transition to lyrics generation', e);
            // Continue - streaming still succeeded
          }
        }

        return true;
      } catch (e) {
        console.error('[conversation] Streaming failed:', e);
        // Remove placeholder on failure
        setMessages((prev) => prev.filter((_, i) => i < prev.length - 1));
        return false;
      }
    };

    const streamed = await tryStreaming();
    console.log('[conversation] tryStreaming() returned:', streamed);
    if (streamed) {
      console.log('[conversation] Streaming succeeded, skipping fallback');
      return;
    }

    // Fallback: non-streaming API
    console.log('[conversation] Stream failed, using fallback non-streaming API');
    let response: Response;
    let data: any;

    try {
      response = await fetch("/api/chat/conversation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          conversationRound: currentRound - 1,
          existingContext: stringifyExtractedContext(extractedContext),
        }),
      });

      data = await response.json();
    } catch (fetchError: any) {
      console.error('[conversation] Fallback API fetch failed:', fetchError);
      const errorMessage = {
        role: "assistant" as const,
        content: "Sorry, er ging iets mis. Probeer het opnieuw.",
      };
      setMessages((prev) => [...prev, errorMessage]);
      return;
    }

    if (response.status === 429 && data.rateLimited) {
      const retryMessage = {
        role: "assistant" as const,
        content: data.error || 'Even geduld, we hebben te veel aanvragen ontvangen. Probeer het over een paar seconden opnieuw.',
        isRateLimited: true,
      };
      setMessages((prev) => [...prev, retryMessage]);
      return;
    }

    if (data.error) {
      throw new Error(data.error);
    }

    const aiMessage = {
      role: "assistant" as const,
      content: data.message,
      extractedContext: data.extractedContext,
      readinessScore: data.readinessScore,
    };

    setMessages((prev) => [...prev, aiMessage]);

    setExtractedContext(data.extractedContext);
    setReadinessScore(data.readinessScore);
    // PRD-0016: Concept lyrics not needed - using Suno for generation
    // if (data.conceptLyrics) setConceptLyrics(data.conceptLyrics);

    if (!DEV_MODE && conversationId) {
      try {
        if (isMobile) {
          await mobileCreateMessage({ conversationId, role: "assistant", content: data.message });
        } else {
          const aiMsgId = id();
          await db.transact([
            db.tx.messages[aiMsgId]
              .update({ role: "assistant", content: data.message, createdAt: Date.now() })
              .link({ conversation: conversationId || undefined }),
          ]);
        }
        await updateConversationRecord({
          roundNumber: currentRound,
          readinessScore: data.readinessScore,
          extractedContext: data.extractedContext,
          // PRD-0016: Concept lyrics not needed - using Suno for generation
          // concept: data.conceptLyrics ?? null,
        });
      } catch (error) {
        console.warn("Failed to persist assistant message", error);
      }
    }

    if (shouldTransitionToGeneration(currentRound, data.readinessScore, userInput)) {
      await transitionToLyricsGeneration();
    }
  };

  /**
   * Transition to lyrics generation phase
   * PRD-0016: No transition message, immediate redirect
   */
  const transitionToLyricsGeneration = async () => {
    setConversationPhase('generating');

    // Update conversation phase in DB
    if (!DEV_MODE && conversationId) {
      try {
        await updateConversationRecord({ conversationPhase: 'generating' });
      } catch (error) {
        console.warn('Failed to update conversation phase', error);
      }
    }

    // Generate lyrics immediately (no transition message)
    await generateLyrics();
  };

  /**
   * PRD-0016: Async generation flow
   * Creates song entity immediately and redirects to Library without waiting
   */
  const generateLyrics = async () => {
    try {
      // PRD-0016 Task 3.1: Check concurrent generation limit
      const userTier = getUserTier(user?.user);
      const concurrentLimit = getConcurrentLimit(user?.user);
      const userSongs = userSongsData?.songs || [];
      const limitCheck = checkConcurrentLimit(userSongs, concurrentLimit);

      if (limitCheck.limitReached) {
        console.log('[PRD-0016] Concurrent generation limit reached:', {
          tier: userTier,
          limit: concurrentLimit,
          current: limitCheck.currentCount,
        });

        // Show appropriate toast based on user tier
        const toastMessage = userTier === 'free'
          ? TOAST_MESSAGES.CONCURRENT_LIMIT_FREE
          : TOAST_MESSAGES.CONCURRENT_LIMIT_PREMIUM;

        showToast({
          title: toastMessage.title,
          description: toastMessage.description,
          variant: 'error',
        });

        return; // Don't start new generation
      }

      // Get selected template or use default
      const template = selectedTemplateId
        ? getTemplateById(selectedTemplateId)
        : getTemplateById('romantic-ballad');

      if (!template) {
        throw new Error('No template selected');
      }

      // Build Suno-optimized prompt with template context
      const prompt = buildSunoLyricsPrompt(
        extractedContext,
        template,
        songSettings.language || 'Nederlands'
      );

      console.log('[PRD-0016] Generating lyrics with async flow...');
      console.log('Template:', template.name);
      console.log('Prompt length:', prompt.length);
      console.log('User tier:', userTier, '| Concurrent:', limitCheck.currentCount, '/', concurrentLimit);

      // Create song entity IMMEDIATELY with status 'generating_lyrics'
      const newSongId = id();
      const userId = user?.user?.id;

      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Create song with generating_lyrics status
      await db.transact([
        db.tx.songs[newSongId]
          .update({
            title: 'Jouw Liedje', // Temporary title, will be updated by Suno callback
            status: 'generating_lyrics',
            generationProgress: stringifyGenerationProgress({
              lyricsTaskId: null, // Will be set by callback
              lyricsStartedAt: Date.now(),
              lyricsCompletedAt: null,
              lyricsError: null,
              lyricsRetryCount: 0,
              musicTaskId: null,
              musicStartedAt: null,
              musicCompletedAt: null,
              musicError: null,
              musicRetryCount: 0,
              rawCallback: null,
            }),
            prompt,
            templateId: selectedTemplateId,
            createdAt: Date.now(),
          })
          .link({
            conversation: conversationId || undefined,
            user: userId,
          }),
      ]);

      console.log('[PRD-0016] Song entity created:', newSongId);

      // Call Suno API (fire and forget - don't await)
      const callbackUrl = `${getBaseUrl()}/api/suno/lyrics/callback?songId=${newSongId}`;

      fetch('/api/suno/lyrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          callBackUrl: callbackUrl,
        }),
      }).catch(error => {
        console.error('[PRD-0016] Suno lyrics request error:', error);
        // Error will be handled by callback timeout logic
      });

      console.log('[PRD-0016] Suno API called, callback URL:', callbackUrl);

      // Show success toast
      showToast({
        title: 'Je liedje wordt gegenereerd! ✨',
        description: 'Je ontvangt een notificatie wanneer de lyrics klaar zijn.',
        variant: 'success',
      });

      // Redirect to Library IMMEDIATELY
      console.log('[PRD-0016] Redirecting to /library?songId=' + newSongId);
      router.push(`/library?songId=${newSongId}`);

    } catch (error: any) {
      console.error('[PRD-0016] Lyrics generation error:', error);
      showToast({
        title: 'Er ging iets mis',
        description: error.message || 'Probeer het opnieuw.',
        variant: 'error',
      });
      throw error;
    }
  };


  /**
   * Legacy chat handler (fallback when two-agent system is disabled)
   */
  const handleLegacyChat = async (userMessage: any) => {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [...messages, userMessage],
        conversationRound: messages.filter((m) => m.role === "user").length,
      }),
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    const aiMessage = {
      role: "assistant" as const,
      content: data.content,
      composerContext: data.composerContext,
      lyrics: data.lyrics,
    };

    setMessages((prev) => [...prev, aiMessage]);
    if (data.composerContext) {
      setLatestComposerContext(data.composerContext);
    }
    if (data.lyrics) {
      setLatestLyrics(data.lyrics);  // Update latestLyrics state for lyrics panel
    }

    // Save AI message (skip in dev mode)
    if (!DEV_MODE && conversationId) {
      try {
        if (isMobile) {
          await mobileCreateMessage({
            conversationId,
            role: "assistant",
            content: data.content,
            composerContext: data.composerContext || "",
          });
        } else {
          const aiMsgId = id();
          await db.transact([
            db.tx.messages[aiMsgId]
              .update({
                role: "assistant",
                content: data.content,
                createdAt: Date.now(),
                composerContext: data.composerContext || "",
              })
              .link({ conversation: conversationId || undefined }),
          ]);
        }
      } catch (error) {
        console.warn("Failed to persist assistant message (legacy chat)", error);
      }
    }

    // Generate lyric version if we have lyrics
    if (data.lyrics) {
      await generateLyricVersion(data.lyrics, { source: 'conversation-agent' });
    }
  };

  type LyricVersionOptions = {
    source?: string;
    variantIndex?: number | null;
    taskId?: string | null;
    isManual?: boolean;
    isRefinement?: boolean;
    isSelection?: boolean;
  };

  const generateLyricVersion = async (lyricsData: any, options: LyricVersionOptions = {}) => {
    if (!conversationId) return;

    try {
      const lyricObject =
        typeof lyricsData === 'string'
          ? { lyrics: lyricsData }
          : lyricsData && typeof lyricsData === 'object'
          ? lyricsData
          : { lyrics: String(lyricsData || '') };

      const lyricText = lyricObject.lyrics || (typeof lyricObject === 'string' ? lyricObject : '');
      if (!lyricText) {
        console.warn('generateLyricVersion called without lyrics content');
        return;
      }

      const source = options.source || 'conversation';
      const providedLyricsPayload: Record<string, any> = {
        title: lyricObject.title || 'Jouw Liefdesliedje',
        lyrics: lyricText,
        style: lyricObject.style || templateConfig?.style || '',
        notes: lyricObject.notes,
        source,
      };

      if (typeof options.variantIndex === 'number') {
        providedLyricsPayload.variantIndex = options.variantIndex;
      }
      if (options.taskId) {
        providedLyricsPayload.taskId = options.taskId;
      }
      if (options.isManual) {
        providedLyricsPayload.isManual = true;
      }
      if (options.isRefinement) {
        providedLyricsPayload.isRefinement = true;
      }
      if (options.isSelection) {
        providedLyricsPayload.isSelection = true;
      }
      if (options.isManual || options.isRefinement || options.isSelection) {
        providedLyricsPayload.selectedAt = Date.now();
      }

      const response = await fetch("/api/lyric-versions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
          previousLyrics: lyricText,
          previousVersion: 0,
          songId: currentSong?.songId,
          providedLyrics: providedLyricsPayload,
        }),
      });

      const result = await response.json();
      if (result.error) {
        console.error("Lyric version error:", result.error);
      } else {
        console.log("✅ Lyric version created:", result.version);
      }
    } catch (error) {
      console.error("Failed to create lyric version:", error);
    }
  };

  /**
   * Handle lyrics refinement based on user feedback
   */
  const handleRefineLyrics = async (feedback: string) => {
    if (refineUsed) {
      console.warn('Refine already used, skipping');
      return;
    }
    if (!feedback.trim()) return;

    setIsLoading(true);
    setIsRefiningLyrics(true);
    setConversationPhase('generating');

    try {
      // Use latestLyrics state instead of scanning chat messages
      if (!latestLyrics) {
        throw new Error('No lyrics to refine');
      }

      const template = selectedTemplateId
        ? getTemplateById(selectedTemplateId)
        : getTemplateById('romantic-ballad');

      if (!template) {
        throw new Error('Geen template gevonden voor refinement');
      }

      const previousLyricsPayload =
        typeof latestLyrics === 'string' || !latestLyrics
          ? latestLyrics
          : latestLyrics.lyrics
          ? latestLyrics
          : latestLyrics;

      // Callback URL is automatically handled by helper function
      // No need to check - will auto-detect on Vercel or use localhost in dev

      const sunoRefinePayload: any = {
        previousLyrics: previousLyricsPayload,
        feedback: feedback,
        templateId: template.id,
        context: extractedContext,
      };
      // Use helper to get callback URL with auto-detection
      const refineCallback = getLyricsCallbackUrl(conversationId ?? undefined);
      if (refineCallback) {
        sunoRefinePayload.callBackUrl = refineCallback;
      }

      const response = await fetch("/api/suno/lyrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sunoRefinePayload),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Suno refinement start mislukt');
      }

      const taskId = data.taskId;
      if (!taskId) {
        throw new Error('Suno gaf geen taak ID terug voor refinement');
      }

      // Post a short notice only; keep full refined lyrics in the right panel
      const refineNotice = {
        role: "assistant" as const,
        content:
          "Ik heb de lyrics aangepast op basis van je feedback. Bekijk de bijgewerkte versie rechts. 💕",
      };

      setMessages((prev) => [...prev, refineNotice]);
      setRefineUsed(true);

      // Task 5.2: Track lyrics refined
      trackLyricsRefined({
        conversationId: conversationId || undefined,
        refinementType: 'auto',
        hasUsedRefineBefore: refineUsed,
      });

      // PRD-0016: No polling - webhook will update lyrics when ready
      console.log('[PRD-0016] Lyrics refinement started, webhook will update:', taskId);
    } catch (error: any) {
      console.error("Lyrics refinement error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Sorry, er ging iets mis bij het verfijnen van de lyrics: ${error.message}\n\nProbeer het opnieuw met andere feedback.`,
        },
      ]);
      setRefineUsed(false);
      setPendingLyricVariants([]);
      setLyricsTaskId(null);
      void syncLyricsTaskId(null);
    } finally {
      setIsLoading(false);
      setIsRefiningLyrics(false);
      setConversationPhase((prev) => (prev === 'generating' ? 'complete' : prev));
    }
  };

  /**
   * Handle music generation
   */
  const startMusicGeneration = async (
    parameterOverrides?: ParameterValues,
    options?: {
      titleOverride?: string;
      makeInstrumental?: boolean;
      styleWeight?: number;
      weirdnessConstraint?: number;
      audioWeight?: number;
      templateId?: string | null;
    }
  ) => {
    if (!latestLyrics || !conversationId) {
      console.error("Cannot generate music: missing lyrics or conversationId");
      return;
    }

    const defaults = computeParameterDefaults();
    const activeParameters: ParameterValues = {
      language:
        parameterOverrides?.language || musicParameters.language || defaults.language,
      vocalGender:
        parameterOverrides?.vocalGender ||
        musicParameters.vocalGender ||
        defaults.vocalGender,
      vocalAge:
        parameterOverrides?.vocalAge ??
        (musicParameters.vocalAge ?? defaults.vocalAge),
    };

    const generationPreferences: UserPreferences = {
      ...songSettings,
      language: activeParameters.language,
      vocalGender: activeParameters.vocalGender,
      vocalAge: activeParameters.vocalAge,
      makeInstrumental: options?.makeInstrumental ?? makeInstrumental,
    };

    setMusicParameters(activeParameters);
    setSongSettings(generationPreferences);

    if (
      advancedSettings.enabled &&
      advancedSettings.vocalGender !== activeParameters.vocalGender
    ) {
      setAdvancedSettings((prev) => ({
        ...prev,
        vocalGender: activeParameters.vocalGender,
      }));
    }

    setGenerationError(null);

    // Task 3.1: Generate new songId
    const songId = id();

    // Task 3.2: Extract title, lyrics, style from latestLyrics
    const title = options?.titleOverride?.trim() || latestLyrics.title || "Liefdesliedje";
    const lyrics = latestLyrics.lyrics || "";
    const musicStyle = latestLyrics.style || "romantic ballad";
    const lyricsSnippet = createSnippet(lyrics, 180);
    const now = Date.now();
    const wantsInstrumental = Boolean(options?.makeInstrumental ?? makeInstrumental);
    const resolvedTemplateId = options?.templateId ?? selectedTemplateId;
    const template = resolvedTemplateId
      ? getTemplateById(resolvedTemplateId)
      : getTemplateById("romantic-ballad");

    console.log("Starting music generation:", {
      songId,
      title,
      musicStyle,
      parameters: activeParameters,
    });

    // Task 3.3: Create song entity in InstantDB
    const currentUser = DEV_MODE ? { id: "dev-user-123" } : user.user;

    if (!currentUser && !isMobile) {
      console.error("No user available");
      return;
    }

    if (!DEV_MODE) {
      try {
        if (isMobile) {
          await mobileCreateSong({
            songId,
            conversationId,
            title,
            lyrics,
            musicStyle,
            generationParams: generationPreferences,
            templateId: selectedTemplateId || null,
            lyricsSnippet,
            status: "generating",
            selectedVariantId: null,
            updatedAt: now,
            isPublic: false,
          });
        } else {
          await db.transact([
            db.tx.songs[songId]
              .update({
                title,
                lyrics,
                musicStyle,
                generationParams: JSON.stringify(generationPreferences),
                status: "generating",
                createdAt: now,
                updatedAt: now,
                lyricsSnippet,
                selectedVariantId: null,
                isPublic: false,
              })
              .link({ conversation: conversationId, user: currentUser!.id }),
          ]);
        }
      } catch (error) {
        console.error("Failed to create song entity:", error);
        return;
      }
    }

    // Task 3.5: Update state to show progress animation
    setIsGeneratingMusic(true);
    setGenerationStage(1);
    setCurrentSong({
      songId,
      title,
      lyrics,
      musicStyle,
      parameters: activeParameters,
      makeInstrumental: wantsInstrumental,
    });

    try {
      // Task 5.0: Get template config for music generation
      if (!template) {
        throw new Error("Geen templateconfiguratie gevonden voor muziek generatie");
      }

      if (template.id === "surprise-me") {
        console.log("[analytics] surprise_mode_music_generation", {
          conversationId,
          songId,
        });
      }

      const baseTemplateConfig = template ? { ...template.sunoConfig } : undefined;

      const styleWeightValue = options?.styleWeight ??
        (advancedSettings.enabled
          ? advancedSettings.styleWeight
          : baseTemplateConfig?.styleWeight ?? DEFAULT_ADVANCED_SETTINGS.styleWeight);

      const weirdnessValue = options?.weirdnessConstraint ??
        (advancedSettings.enabled
          ? advancedSettings.weirdnessConstraint
          : baseTemplateConfig?.weirdnessConstraint ?? DEFAULT_ADVANCED_SETTINGS.weirdnessConstraint);

      const audioWeightValue = options?.audioWeight ??
        (advancedSettings.enabled
          ? advancedSettings.audioWeight
          : baseTemplateConfig?.audioWeight ?? DEFAULT_ADVANCED_SETTINGS.audioWeight);

      let mergedTemplateConfig = baseTemplateConfig;
      if (baseTemplateConfig) {
        mergedTemplateConfig = {
          ...baseTemplateConfig,
          styleWeight: styleWeightValue,
          weirdnessConstraint: weirdnessValue,
          audioWeight: audioWeightValue,
        };

        if (advancedSettings.enabled) {
          mergedTemplateConfig.model = advancedSettings.model;
          const trimmedNegatives = advancedSettings.negativeTags?.trim?.();
          if (trimmedNegatives) {
            mergedTemplateConfig.negativeTags = trimmedNegatives;
          } else {
            delete mergedTemplateConfig.negativeTags;
          }
        }
      }

      const resolvedModel =
        mergedTemplateConfig?.model ||
        baseTemplateConfig?.model ||
        template?.sunoConfig.model ||
        DEFAULT_ADVANCED_SETTINGS.model;

      // Task 3.4: Call POST /api/suno with template config
      const response = await fetch("/api/suno", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          songId,
          title,
          lyrics,
          musicStyle,
          model: resolvedModel,
          makeInstrumental: wantsInstrumental,
          templateConfig: mergedTemplateConfig,
          vocalPreferences: activeParameters,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || "Failed to start music generation");
      }

      console.log("Music generation started:", data);

      // Store taskId in currentSong
      setCurrentSong((prev: any) =>
        prev ? { ...prev, taskId: data.taskId } : null
      );

      // Task 3.8: Stage transitions (20s, 40s)
      setTimeout(() => setGenerationStage(2), 20000);
      setTimeout(() => setGenerationStage(3), 40000);

      // Start polling immediately so we reflect callback results as soon as they appear
      startPolling(songId, data.taskId);
    } catch (error: any) {
      console.error("Music generation error:", error);
      setIsGeneratingMusic(false);
      setGenerationStage(null);

      // Task 6.2, 6.4, 6.7: Set error state with user-friendly Dutch message
      setGenerationError("Er ging iets mis met het genereren van je muziek");

      // Update song status to failed (if not in dev mode)
      if (!DEV_MODE) {
        try {
          await updateSongRecord(songId, {
            status: "failed",
            errorMessage: error.message,
          });
        } catch (persistError) {
          console.warn("Failed to persist failed song status", persistError);
        }
      }
    }
  };

  const handleOpenParameterSheet = () => {
    if (!canGenerateMusic || isGeneratingMusic) {
      return;
    }
    const defaults = computeParameterDefaults();
    const currentValues: ParameterValues = {
      language: musicParameters.language || defaults.language,
      vocalGender: musicParameters.vocalGender || defaults.vocalGender,
      vocalAge:
        musicParameters.vocalAge !== undefined
          ? musicParameters.vocalAge
          : defaults.vocalAge,
    };
    setParameterSheetDefaults(currentValues);
    setIsParameterSheetOpen(true);
  };

  const handleCloseParameterSheet = () => {
    if (isParameterSheetSubmitting) return;
    setIsParameterSheetOpen(false);
    setParameterSheetDefaults(null);
  };

  const handleConfirmParameterSheet = async (values: ParameterValues, extras: ParameterSheetExtras) => {
    setIsParameterSheetSubmitting(true);
    try {
      const trimmedTitle = extras.title.trim();

      if (extras.selectedTemplateId && extras.selectedTemplateId !== selectedTemplateId) {
        handleTemplateSelect(extras.selectedTemplateId);
      }

      setCustomSongTitle(trimmedTitle || latestLyrics?.title || "");
      setMakeInstrumental(extras.instrumental);

      setAdvancedSettings((prev) => ({
        ...prev,
        enabled: true,
        styleWeight: extras.styleWeight,
        weirdnessConstraint: extras.weirdnessConstraint,
        audioWeight: extras.audioWeight,
      }));

      await startMusicGeneration(values, {
        titleOverride: trimmedTitle,
        makeInstrumental: extras.instrumental,
        styleWeight: extras.styleWeight,
        weirdnessConstraint: extras.weirdnessConstraint,
        audioWeight: extras.audioWeight,
        templateId: extras.selectedTemplateId,
      });
      setIsParameterSheetOpen(false);
      setParameterSheetDefaults(values);
    } finally {
      setIsParameterSheetSubmitting(false);
    }
  };

  /**
   * Poll Suno API for status updates
   * Task 3.9, 3.10, 3.11: Polling with timeout
   * Task 7.2-7.8: Enhanced polling with progressive loading support
   */
  const startPolling = (songId: string, taskId: string) => {
    let pollCount = 0;
    const maxPolls = 24; // 24 * 5s = 120s timeout

    // Clear any existing polling interval
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    pollingIntervalRef.current = setInterval(async () => {
      pollCount++;

      // Task 7.8: 120-second timeout
      if (pollCount > maxPolls) {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        setIsGeneratingMusic(false);
        setGenerationStage(null);
        console.error('Music generation timed out');

        setGenerationError('Generatie duurt langer dan verwacht');
        return;
      }

      try {
        // Task 7.4: Poll Suno API every 5 seconds
        const response = await fetch(`/api/suno?taskId=${taskId}`);
        const data = await response.json();

        // Task 7.5, 7.6: Parse polling response and update InstantDB with URLs
        if (data.tracks && data.tracks.length > 0) {
          const hasStreamUrl = data.tracks.some((t: any) => t.streamAudioUrl);
          const hasDownloadUrl = data.tracks.some((t: any) => t.audioUrl);

          // Update InstantDB with progressive URLs if found
          if (hasStreamUrl || hasDownloadUrl) {
            const now = Date.now();

            if (isMobile) {
              const variants: MobileVariantPayload[] = data.tracks.map((track: any, index: number) => ({
                songId,
                trackId: track.trackId,
                title: track.title || `Versie ${index + 1}`,
                streamAudioUrl: track.streamAudioUrl || null,
                audioUrl: track.audioUrl || null,
                sourceAudioUrl: track.sourceAudioUrl || track.source_audio_url || null,
                sourceStreamAudioUrl: track.sourceStreamAudioUrl || track.source_stream_audio_url || null,
                imageUrl: track.imageUrl || track.coverUrl || track.cover_url || null,
                durationSeconds: track.durationSeconds || track.duration || null,
                order: index,
                streamAvailableAt: track.streamAudioUrl && !track.audioUrl ? now : null,
                downloadAvailableAt: track.audioUrl ? now : null,
              }));
              await mobileUpdateSong(songId, { variants, updatedAt: now });

              // Also update local mobile variant state so UI can render immediately
              const localVariants = data.tracks.map((track: any, index: number) => ({
                id: track.trackId || track.id || `${songId}:${index}`,
                trackId: track.trackId || track.id || `${songId}:${index}`,
                title: track.title || `Versie ${index + 1}`,
                streamAudioUrl: track.streamAudioUrl || track.sourceStreamAudioUrl || track.source_stream_audio_url || null,
                audioUrl: track.audioUrl || null,
                imageUrl: track.imageUrl || track.coverUrl || track.cover_url || null,
                durationSeconds: track.durationSeconds || track.duration || null,
                order: index,
              }));
              setMobileVariants(localVariants);
            } else {
              const updates = data.tracks.map((track: any, index: number) => {
                const trackId = track.trackId;
                const updateData: any = {
                  songId: songId,
                  trackId: trackId,
                  title: track.title || `Versie ${index + 1}`,
                  streamAudioUrl: track.streamAudioUrl || null,
                  audioUrl: track.audioUrl || null,
                  imageUrl: track.imageUrl || null,
                  durationSeconds: track.durationSeconds || null,
                  order: index,
                };

                // Set timestamps based on what URLs are available
                if (track.streamAudioUrl && !track.audioUrl) {
                  updateData.streamAvailableAt = now;
                } else if (track.audioUrl) {
                  updateData.downloadAvailableAt = now;
                }

                return db.tx.sunoVariants[trackId]
                  .update(updateData)
                  .link({ song: songId });
              });

              await db.transact([
                ...updates,
                db.tx.songs[songId].update({ updatedAt: now }),
              ]);
            }
            console.log('Updated variants from polling with progressive URLs');
          }
        }

        // Task 7.7: Stop polling when status is complete or SUCCESS
        if (data.status === 'ready' || data.status === 'complete') {
          // Task 7.9: Clear polling interval
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }

          setIsGeneratingMusic(false);
          setGenerationStage(null);
          setShowVariantSelector(true);
          if (currentSong?.songId) {
            await updateSongRecord(currentSong.songId, { status: 'ready' });
          }

          console.log('Music generation complete via polling:', data);
        } else if (data.status === 'failed') {
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          setIsGeneratingMusic(false);
          setGenerationStage(null);
          if (currentSong?.songId) {
            await updateSongRecord(currentSong.songId, { status: 'failed' });
          }

          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              content: 'Er ging iets mis bij het genereren van de muziek. Probeer het opnieuw.',
            },
          ]);
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 5000); // Task 7.4: Poll every 5 seconds
  };

  // Auth checks (after all hooks to comply with Rules of Hooks)
  if (!DEV_MODE && user.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#fffbf7] via-[#fef4ef] to-[#ffeae3]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#7f5af0]"></div>
          <p className="mt-4 text-[rgba(31,27,45,0.6)]">Laden...</p>
        </div>
      </div>
    );
  }

  if (!DEV_MODE && !user.user) {
    return <LoginScreen />;
  }

  // For mobile users, wait for session exchange to complete (with timeout)
  if (!DEV_MODE && isMobile && !sessionReady && !sessionTimeout) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#fffbf7] via-[#fef4ef] to-[#ffeae3]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#7f5af0]"></div>
          <p className="mt-4 text-[rgba(31,27,45,0.6)]">Sessie voorbereiden...</p>
          <p className="mt-2 text-xs text-[rgba(31,27,45,0.4)]">Dit duurt maximaal 5 seconden</p>
        </div>
      </div>
    );
  }

  // Mobile hydration checks
  if (isMobile) {
    if (isHydratingConversation) {
      return (
        <div className="flex h-screen items-center justify-center">
          <div className="text-center">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-pink-200 border-t-pink-600 mx-auto"></div>
            <p className="text-gray-600">Mobiele ervaring laden...</p>
          </div>
        </div>
      );
    }
    if (hydrationError) {
      return (
        <div className="flex h-screen items-center justify-center">
          <div className="text-center space-y-3 px-6">
            <h1 className="text-xl font-semibold text-gray-800">Kon gesprek niet laden</h1>
            <p className="text-gray-600">{hydrationError}</p>
            <button
              className="rounded-md bg-pink-600 px-4 py-2 text-white shadow"
              onClick={() => {
                setHydrationError(null);
                setHasHydratedConversation(false);
                setIsHydratingConversation(true);
              }}
            >
              Probeer opnieuw
            </button>
          </div>
        </div>
      );
    }
  }

  // Get current song and variants (mobile uses local state; desktop subscribes to DB)
  const currentSongData = songData?.songs?.find((s: any) => s.id === currentSong?.songId);
  const variants = isMobile ? mobileVariants : (currentSongData?.variants || []);

  // Get selected song data for music player
  const selectedSongData = selectedVariantId
    ? variants.find((v: any) => v.id === selectedVariantId) || null
    : null;

  const selectedSongForPlayer = selectedSongData ? {
    id: selectedSongData.id || '',
    title: currentSongData?.title || currentSong?.title || 'Liefdesliedje',
    imageUrl: selectedSongData.imageUrl || currentSongData?.imageUrl || '',
    streamAudioUrl: selectedSongData.streamAudioUrl || (currentSongData?.streamAudioUrl) || selectedSongData.audioUrl || '',
    audioUrl: selectedSongData.audioUrl || (currentSongData?.audioUrl) || '',
  } : null;

  const mobileAudioSrc =
    selectedSongForPlayer?.streamAudioUrl ||
    selectedSongForPlayer?.audioUrl ||
    null;

  // Chat Pane Component
  // Task 5.3: Compact spacing when compare UI is active
  const showCompactChat = ENABLE_LYRICS_COMPARE && lyricsOptions.length >= 2;
  const chatPane = (
    <div
      className={`flex flex-1 flex-col bg-[radial-gradient(circle_at_0%_0%,rgba(32,178,170,0.08),transparent_55%),var(--color-bg-light)] md:bg-transparent ${
        showCompactChat ? 'backdrop-blur-sm' : ''
      }`}
      style={{
        // Task 1.2: Use small viewport height on mobile to account for keyboard
        height: isMobile ? '100svh' : undefined,
      }}
    >
      {/* Header */}
      {isMobile ? (
        <ChatHeader
          title="Studio"
          onNew={() => {
            setIsMobileLyricsOpen(true);
          }}
        />
      ) : (
        <div className="px-4 py-3 md:px-6 md:py-4 border-b border-[rgba(15,23,42,0.08)] bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/75">
          <h1 className="text-xl font-extrabold" style={{ color: 'var(--color-secondary)' }}>
            💕 Liefdesliedje Studio
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
            Maak je persoonlijke liefdesliedje
          </p>
          {ENABLE_TWO_AGENT_SYSTEM && conversationPhase === 'gathering' && (
            <p className="mt-1 text-xs font-semibold" style={{ color: 'var(--color-primary)' }}>
              Ronde {roundNumber}/{MIN_CONVERSATION_ROUNDS} • Gereedheid: {Math.round(readinessScore * 100)}%
            </p>
          )}
        </div>
      )}

      {/* Messages Area */}
      <div
        ref={chatContainerRef}
        className={`flex-1 overflow-y-auto ${
          showCompactChat ? 'bg-white px-3 py-2' : 'bg-white/70 p-4'
        }`}
        style={{
          WebkitOverflowScrolling: 'touch' as any,
          // Task 1.2: Dynamic padding increases when keyboard is open
          paddingBottom: isMobile
            ? composerHeight + 24 + (isKeyboardOpen ? 16 : 0)
            : undefined,
        }}
      >
        <div className={`mx-auto ${showCompactChat ? 'max-w-2xl space-y-3' : 'max-w-3xl space-y-4'}`}>
          {messages.length === 0 && (
            <WelcomeAnimation
              title={strings.studio.welcomeTitle}
              description={strings.studio.welcomeDescription}
            />
          )}

          {/* Task 2.3: Load More History Button */}
          {!allMessagesLoaded && messages.length > 0 && (
            <div className="flex justify-center py-2">
              <button
                onClick={handleLoadMoreMessages}
                disabled={isLoadingMessages}
                className="flex items-center gap-2 rounded-full border border-gray-300 bg-white/90 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-white hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoadingMessages ? (
                  <>
                    <svg
                      className="h-4 w-4 animate-spin text-gray-500"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Laden...
                  </>
                ) : (
                  <>
                    <svg
                      className="h-4 w-4 text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 11l3-3m0 0l3 3m-3-3v8m0-13a9 9 0 110 18 9 9 0 010-18z"
                      />
                    </svg>
                    📜 Meer berichten laden
                  </>
                )}
              </button>
            </div>
          )}

          {messages.map((message, idx) => (
            isMobile ? (
              <ChatBubble
                key={idx}
                role={message.role}
                avatar={{ name: message.role === 'user' ? 'Jij' : 'AI' }}
                label={message.role === 'user' ? strings.studio.userLabel : strings.studio.assistantLabel}
              >
                {message.content}
              </ChatBubble>
            ) : (
              <div
                key={idx}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 md:px-4 md:py-3 shadow-sm ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] text-white'
                      : 'bg-white/95 text-gray-800 border border-[rgba(15,23,42,0.08)]'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>
                </div>
              </div>
            )
          ))}

          {isLoading && (
            isMobile ? (
              <ChatBubble role="assistant" isTyping avatar={{ name: 'AI' }}>
                {conversationPhase === 'generating' ? 'Lyrics worden gegenereerd…' : 'Schrijven…'}
              </ChatBubble>
            ) : (
              <div className="flex justify-start">
                <div className="rounded-2xl border border-[rgba(15,23,42,0.08)] bg-white/95 px-3 py-2 shadow-sm md:px-4 md:py-3" aria-live="polite">
                  {conversationPhase === 'generating' ? (
                    <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                      Lyrics worden gegenereerd...
                    </p>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 animate-bounce rounded-full" style={{ backgroundColor: 'var(--color-primary)' }}></div>
                      <div className="h-2 w-2 animate-bounce rounded-full animation-delay-200" style={{ backgroundColor: 'var(--color-secondary)' }}></div>
                      <div className="h-2 w-2 animate-bounce rounded-full animation-delay-400" style={{ backgroundColor: 'var(--color-primary)' }}></div>
                    </div>
                  )}
                </div>
              </div>
            )
          )}
          {/* Lyrics generation progress indicator */}
          {lyricsTaskId && (
            isMobile ? (
              <ChatBubble role="assistant" isTyping avatar={{ name: 'AI' }}>
                Lyrics worden gegenereerd…
              </ChatBubble>
            ) : (
              <div className="flex justify-start">
                <div className="rounded-2xl border border-[rgba(15,23,42,0.08)] bg-white/95 px-3 py-2 shadow-sm md:px-4 md:py-3" aria-live="polite">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 animate-bounce rounded-full" style={{ backgroundColor: 'var(--color-primary)' }}></div>
                    <div className="h-2 w-2 animate-bounce rounded-full animation-delay-200" style={{ backgroundColor: 'var(--color-secondary)' }}></div>
                    <div className="h-2 w-2 animate-bounce rounded-full animation-delay-400" style={{ backgroundColor: 'var(--color-primary)' }}></div>
                    <span className="text-sm text-gray-600">Lyrics worden gegenereerd…</span>
                  </div>
                </div>
              </div>
            )
          )}
          {/* Bottom sentinel for auto-scroll */}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Composer Controls + Input Area */}
      <div
        ref={composerRef}
        className={`bg-white ${
          showCompactChat ? 'px-3 py-2' : 'p-4'
        } ${
          isMobile
            ? `sticky ${isKeyboardOpen ? 'bottom-0 z-[70]' : 'bottom-[64px] z-30'} px-4 py-3 pb-safe`
            : ''
        } ${
          // Task 1.3: Enhanced visual indicator when keyboard is open
          isMobile && isKeyboardOpen
            ? 'border-t-2 border-t-green-400/50 shadow-[0_-12px_24px_-8px_rgba(17,24,39,0.45)]'
            : 'border-t border-gray-200 shadow-[0_-8px_20px_-12px_rgba(17,24,39,0.35)]'
        }`}
      >
        <div className={`mx-auto ${showCompactChat ? 'max-w-2xl space-y-2' : 'max-w-3xl space-y-3'}`}>
          {/* Mini-player inside footer area (native feel) */}
          {isMobile && mobileAudioSrc && !isKeyboardOpen ? (
            <AudioMiniPlayer
              src={mobileAudioSrc}
              title={selectedSongForPlayer?.title}
              imageUrl={selectedSongForPlayer?.imageUrl}
              fixed={false}
            />
          ) : null}

          {/* Input Area */}
          {isMobile ? (
            <ComposerBar
              value={inputValue}
              onChange={setInputValue}
              onSubmit={handleSendMessage}
              disabled={false} // Task 3.3: Keep input enabled during AI response
              placeholder={
                conversationPhase === 'complete'
                  ? 'Klaar! Wil je het liedje verfijnen?'
                  : isWaitingForAI
                    ? 'AI aan het typen...'
                    : 'Typ je bericht...'
              }
            />
          ) : (
            <div className={`flex gap-2 ${showCompactChat ? 'items-center' : ''}`}>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                placeholder={
                  conversationPhase === 'complete'
                    ? "Klaar! Wil je het liedje verfijnen?"
                    : isWaitingForAI
                      ? "AI aan het typen..."
                      : "Typ je bericht..."
                }
                disabled={false} // Task 3.3: Keep input enabled during AI response
                className={`flex-1 rounded-xl border-2 px-3 py-2 md:px-4 md:py-3 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] disabled:bg-gray-100`}
                style={{ borderColor: 'rgba(74, 222, 128, 0.35)' }}
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading || !inputValue.trim()}
                className="rounded-full px-4 py-2 md:px-6 md:py-3 font-semibold text-white shadow-lg transition-all hover:shadow-xl disabled:bg-gray-300 disabled:cursor-not-allowed"
                style={{ backgroundImage: 'var(--gradient-primary)' }}
              >
                Verstuur
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const handleLyricVariantSelection = async (index: number) => {
    if (isSavingLyricSelection) return;
    const variantsSource = pendingLyricVariants.length > 0 ? pendingLyricVariants : lyricsOptions;
    const selectedText = variantsSource[index];

    // Task 5.2: Track lyrics option selected
    trackLyricsOptionSelected({
      taskId: lyricsTaskId || 'unknown',
      variantIndex: index,
      conversationId: conversationId || undefined,
    });

    if (!selectedText) {
      console.warn('No lyric variant found for index', index);
      return;
    }

    setIsSavingLyricSelection(true);
    try {
      await generateLyricVersion(
        {
          lyrics: selectedText,
          title: 'Gekozen Lyrics',
          style: templateConfig?.style || '',
        },
        {
          source: pendingLyricSource,
          variantIndex: index,
          taskId: lyricsTaskId,
          isSelection: true,
        }
      );

      setLatestLyrics({
        title: 'Gekozen Lyrics',
        lyrics: selectedText,
        style: templateConfig?.style || '',
      });
      if (currentSong?.songId) {
        await updateSongRecord(currentSong.songId, {
          lyrics: selectedText,
          lyricsSnippet: createSnippet(selectedText, 180),
        });
      }
      setLyricsOptions([]);
      setPendingLyricVariants([]);
      setSelectedLyricIndex(null);
      setLyricsTaskId(null);
      void syncLyricsTaskId(null);
      setRefineUsed(false);
      setManualEdited(false);
      setConversationPhase('complete');
      setGenerationError(null);
      setPendingLyricSource('suno');
    } catch (error) {
      console.error('Failed to persist selected lyrics:', error);
      setGenerationError('Opslaan van de gekozen lyrics is mislukt. Probeer het opnieuw.');
    } finally {
      setIsSavingLyricSelection(false);
    }
  };

  const handleManualEditSave = (text: string) => {
    if (!text.trim()) return;
    setLatestLyrics((prev: any) =>
      prev
        ? { ...prev, lyrics: text }
        : { title: 'Gekozen Lyrics', lyrics: text, style: templateConfig?.style || '' }
    );
    if (currentSong?.songId) {
      void updateSongRecord(currentSong.songId, {
        lyrics: text,
        lyricsSnippet: createSnippet(text, 180),
      });
    }
    setLyricsOptions([]);
    setSelectedLyricIndex(null);
  setManualEdited(true);
  setPendingLyricVariants([]);
  setLyricsTaskId(null);
  void syncLyricsTaskId(null);
  setPendingLyricSource('suno');

    // Task 5.2: Track manual edit as refinement
    trackLyricsRefined({
      conversationId: conversationId || undefined,
      refinementType: 'manual_edit',
      hasUsedRefineBefore: refineUsed || manualEdited,
    });
    void generateLyricVersion(
      {
        lyrics: text,
        title: 'Gekozen Lyrics',
        style: templateConfig?.style || '',
      },
      {
        source: 'manual-edit',
        isManual: true,
      }
    );
  };

  const canGenerateMusic = Boolean(latestLyrics?.lyrics) && !isRefiningLyrics;
  const canRefine = !refineUsed && Boolean(latestLyrics?.lyrics) && !isRefiningLyrics;
  const fallbackParameters = computeParameterDefaults();
  const parameterSheetResolvedDefaults: ParameterValues =
    parameterSheetDefaults || {
      language: musicParameters.language || fallbackParameters.language,
      vocalGender: musicParameters.vocalGender || fallbackParameters.vocalGender,
      vocalAge:
        musicParameters.vocalAge !== undefined
          ? musicParameters.vocalAge
          : fallbackParameters.vocalAge,
    };

  const currentTemplate = selectedTemplateId
    ? getTemplateById(selectedTemplateId)
    : getTemplateById("romantic-ballad");
  const effectiveTemplateConfig = templateConfig ?? currentTemplate?.sunoConfig ?? null;

  const styleWeightDefault = advancedSettings.enabled
    ? advancedSettings.styleWeight
    : effectiveTemplateConfig?.styleWeight ?? DEFAULT_ADVANCED_SETTINGS.styleWeight;
  const weirdnessDefault = advancedSettings.enabled
    ? advancedSettings.weirdnessConstraint
    : effectiveTemplateConfig?.weirdnessConstraint ?? DEFAULT_ADVANCED_SETTINGS.weirdnessConstraint;
  const audioWeightDefault = advancedSettings.enabled
    ? advancedSettings.audioWeight
    : effectiveTemplateConfig?.audioWeight ?? DEFAULT_ADVANCED_SETTINGS.audioWeight;

  const parameterSheetExtras: ParameterSheetExtras = {
    title: customSongTitle || latestLyrics?.title || "Liefdesliedje",
    selectedTemplateId,
    instrumental: makeInstrumental,
    styleWeight: styleWeightDefault,
    weirdnessConstraint: weirdnessDefault,
    audioWeight: audioWeightDefault,
  };

  // Lyrics Pane Component
  // Task 5.3: Guard with ENABLE_LYRICS_COMPARE feature flag
  const lyricsPane = conversationId ? (
    ENABLE_LYRICS_COMPARE && lyricsOptions.length >= 2 ? (
      <div className="h-full overflow-auto">
        <LyricsCompare
          options={lyricsOptions.slice(0, 2)}
          selectedIndex={selectedLyricIndex}
          onSelect={(i) => setSelectedLyricIndex(i)}
          onUseSelected={() => {
            if (selectedLyricIndex === null) return;
            void handleLyricVariantSelection(selectedLyricIndex);
          }}
          isRefining={isRefiningLyrics}
          isSaving={isSavingLyricSelection}
        />
      </div>
    ) : (
      <LyricsPanel
        conversationId={conversationId}
        className="h-full"
        conversationPhase={conversationPhase}
        extractedContext={extractedContext}
        roundNumber={roundNumber}
        readinessScore={readinessScore}
        conceptLyrics={conceptLyrics}
        latestLyrics={latestLyrics}
        onRefineLyrics={canRefine ? handleRefineLyrics : undefined}
        isRefining={isRefiningLyrics}
        canRefine={canRefine}
        onGenerateMusic={handleOpenParameterSheet}
        isGeneratingMusic={isGeneratingMusic}
        canGenerateMusic={canGenerateMusic}
        onManualEditSave={handleManualEditSave}
        selectedSong={selectedSongForPlayer}
        generationError={generationError}
        onRetryGeneration={() => {
          setGenerationError(null);
          startMusicGeneration(musicParameters, {
            titleOverride: parameterSheetExtras.title,
            makeInstrumental,
            styleWeight: styleWeightDefault,
            weirdnessConstraint: weirdnessDefault,
            audioWeight: audioWeightDefault,
            templateId: selectedTemplateId,
          });
        }}
        onAdjustLyrics={() => {
          setGenerationError(null);
          setConversationPhase('refining');
        }}
        preferences={songSettings}
        onChangePreferences={setSongSettings}
        enableLiveQueries={!isMobile}
      />
    )
  ) : (
    <div className="flex h-full items-center justify-center p-8">
      <p className="text-gray-500">Conversatie wordt geladen...</p>
    </div>
  );

  // Task 4.4: Template selection handler
  const handleTemplateSelect = (templateId: string) => {
    const isSurprise = templateId === 'surprise-me';
    const wasSurprise = selectedTemplateId === 'surprise-me';

    if (isSurprise && !wasSurprise) {
      setSurpriseModeSelections((prev) => prev + 1);
    }

    setSelectedTemplateId(templateId);
    const template = getTemplateById(templateId);
    if (template) {
      setTemplateConfig({ ...template.sunoConfig });
      setAdvancedSettings((prev) => ({
        ...prev,
        model: template.sunoConfig.model || prev.model,
        styleWeight:
          typeof template.sunoConfig.styleWeight === "number"
            ? template.sunoConfig.styleWeight
            : DEFAULT_ADVANCED_SETTINGS.styleWeight,
        weirdnessConstraint:
          typeof template.sunoConfig.weirdnessConstraint === "number"
            ? template.sunoConfig.weirdnessConstraint
            : DEFAULT_ADVANCED_SETTINGS.weirdnessConstraint,
        audioWeight:
          typeof template.sunoConfig.audioWeight === "number"
            ? template.sunoConfig.audioWeight
            : DEFAULT_ADVANCED_SETTINGS.audioWeight,
        negativeTags: template.sunoConfig.negativeTags ?? DEFAULT_ADVANCED_SETTINGS.negativeTags,
      }));
      console.log('Template selected:', template.name, template.sunoConfig);
    }
  };

  // Task 4.3: Template pane with TemplateSelector
  // Task 5.3: Hide template pane when compare UI is active
  const templatePane = (ENABLE_LYRICS_COMPARE && lyricsOptions.length >= 2) ? null : (
    <TemplateSelector
      selectedTemplateId={selectedTemplateId}
      onTemplateSelect={handleTemplateSelect}
      advancedSettings={advancedSettings}
      onAdvancedSettingsChange={(next) => setAdvancedSettings(next)}
      onResetAdvancedSettings={resetAdvancedSettingsToTemplate}
      disableAdvancedControls={isGeneratingMusic}
    />
  );

  return (
    <>
      <div
        className={
          isMobile
            ? "relative h-[100svh] overflow-hidden bg-gradient-to-b from-white to-pink-50"
            : ""
        }
      >
        <ConversationalStudioLayout
          templatePane={templatePane}
          chatPane={chatPane}
          lyricsPane={lyricsPane}
          className={isMobile ? "bg-transparent" : ""}
          isMobileLyricsOpen={isMobileLyricsOpen}
          onMobileLyricsOpenChange={setIsMobileLyricsOpen}
        />
      </div>

      {/* Music generation progress overlay */}
      {isGeneratingMusic && generationStage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-8 shadow-2xl">
            <MusicGenerationProgress
              stage={generationStage}
              estimatedTimeRemaining={
                generationStage === 1 ? 60 : generationStage === 2 ? 40 : 20
              }
            />
          </div>
        </div>
      )}

      {/* Variant selector modal */}
      {showVariantSelector && variants.length > 0 && (
        <VariantSelector
          variants={variants.map((v: any) => ({
            id: v.id,
            trackId: v.trackId || v.id,
            title: v.title || currentSongData?.title || 'Versie',
            streamAudioUrl: v.streamAudioUrl || v.audioUrl || '',
            audioUrl: v.audioUrl || '',
            imageUrl: v.imageUrl || currentSongData?.imageUrl || '',
            durationSeconds: v.durationSeconds || 180,
          }))}
          onSelect={(variantId) => {
            setSelectedVariantId(variantId);
            setShowVariantSelector(false);
          }}
          onClose={() => setShowVariantSelector(false)}
        />
      )}

      <ParameterSheet
        isOpen={isParameterSheetOpen}
        defaults={parameterSheetResolvedDefaults}
        extras={parameterSheetExtras}
        templates={PARAMETER_TEMPLATES}
        onClose={handleCloseParameterSheet}
        onConfirm={handleConfirmParameterSheet}
        isSubmitting={isParameterSheetSubmitting}
      />

      {isMobile && !isKeyboardOpen ? <NavTabs /> : null}
    </>
  );
}
