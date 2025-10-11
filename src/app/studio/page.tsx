"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { id } from "@instantdb/react";
import { db } from "@/lib/db";
import { ConversationalStudioLayout } from "@/components/ConversationalStudioLayout";
import { ComposerControls } from "@/components/ComposerControls";
import { LyricsPanel } from "@/components/LyricsPanel";
import { LyricsCompare } from "@/components/LyricsCompare";
import { MusicGenerationProgress } from "@/components/MusicGenerationProgress";
import { VariantSelector } from "@/components/VariantSelector";
import { TemplateSelector } from "@/components/TemplateSelector";
import { ConversationPhase, ExtractedContext, ConceptLyrics, UserPreferences } from "@/types/conversation";
import { stringifyExtractedContext } from "@/lib/utils/contextExtraction";
import { MusicTemplate, getTemplateById } from "@/templates/music-templates";
import { buildSunoLyricsPrompt } from "@/lib/utils/sunoLyricsPrompt";
import {
  AdvancedSettings,
  DEFAULT_ADVANCED_SETTINGS,
} from "@/components/AdvancedControlsPanel";
import { ParameterSheet, type ParameterValues } from "@/components/ParameterSheet";
import {
  trackLyricsOptionsShown,
  trackLyricsOptionSelected,
  trackLyricsRegenerated,
  trackLyricsRefined,
} from "@/lib/analytics/events";

// DEV_MODE: When true, bypasses authentication (set NEXT_PUBLIC_DEV_MODE=false for production)
const DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === 'true';

// TWO_AGENT_SYSTEM: When true, uses the two-agent conversation system
const ENABLE_TWO_AGENT_SYSTEM = process.env.NEXT_PUBLIC_ENABLE_TWO_AGENT_SYSTEM !== 'false';
const MIN_CONVERSATION_ROUNDS = parseInt(process.env.NEXT_PUBLIC_MIN_CONVERSATION_ROUNDS || '6');
const MAX_CONVERSATION_ROUNDS = parseInt(process.env.NEXT_PUBLIC_MAX_CONVERSATION_ROUNDS || '10');

// Task 5.3: LYRICS_COMPARE Feature Flag
const ENABLE_LYRICS_COMPARE = process.env.NEXT_PUBLIC_ENABLE_LYRICS_COMPARE === 'true';

export default function StudioPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [latestComposerContext, setLatestComposerContext] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
  // Song settings (user-controlled)
  const [songSettings, setSongSettings] = useState<UserPreferences>({
    language: "Nederlands",
    vocalGender: "neutral",
    vocalAge: undefined,
    mood: ["romantisch"],
  });

  // Music generation state
  const [isGeneratingMusic, setIsGeneratingMusic] = useState(false);
  const [generationStage, setGenerationStage] = useState<1 | 2 | 3 | null>(null);
  const [currentSong, setCurrentSong] = useState<any | null>(null);
  const [showVariantSelector, setShowVariantSelector] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
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
  // Task 6.1: Error state
  const [generationError, setGenerationError] = useState<string | null>(null);

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

  const user = db.useAuth();

  // Task 3.6, 3.7: InstantDB subscription for song status updates
  // Always call the hook unconditionally
  const { data: songData } = db.useQuery({
    songs: currentSong?.songId
      ? {
          $: {
            where: {
              id: currentSong.songId,
            },
          },
          variants: {},
        }
      : {},
  });

  // Subscribe to conversation to hydrate settings on reload
  const { data: convData } = db.useQuery({
    conversations: conversationId
      ? {
          $: { where: { id: conversationId } },
        }
      : {},
  });

  // Create conversation on mount
  useEffect(() => {
    // DEV_MODE: Skip loading check and use mock user
    const isLoading = DEV_MODE ? false : user.isLoading;
    const currentUser = DEV_MODE
      ? (user.user || { id: 'dev-user-123', email: 'dev@example.com' })
      : user.user;

    if (isLoading || !currentUser) return;

    const convId = id();
    setConversationId(convId);

    // Create conversation in InstantDB (skip DB write in dev mode to avoid auth issues)
    if (!DEV_MODE) {
      db.transact([
        db.tx.conversations[convId]
          .update({
            createdAt: Date.now(),
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
  }, [user.isLoading, user.user]);

  // Chat container ref for scroll management
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

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

  // Hydrate local state from DB when available
  useEffect(() => {
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
  }, [convData?.conversations]);

  // Persist settings to DB when they change
  useEffect(() => {
    if (DEV_MODE || !conversationId) return;
    (async () => {
      try {
        await db.transact([
          db.tx.conversations[conversationId].update({
            songSettings: JSON.stringify(songSettings),
          }),
        ]);
      } catch (e) {
        console.warn('Failed to persist songSettings:', e);
      }
    })();
  }, [songSettings, conversationId]);

  // Task 4.5: Persist template selection to InstantDB
  useEffect(() => {
    if (DEV_MODE || !conversationId || !selectedTemplateId) return;
    (async () => {
      try {
        await db.transact([
          db.tx.conversations[conversationId].update({
            selectedTemplateId,
            templateConfig: templateConfig ? JSON.stringify(templateConfig) : null,
          }),
        ]);
        console.log('✅ Template selection persisted to DB');
      } catch (e) {
        console.warn('Failed to persist template selection:', e);
      }
    })();
  }, [selectedTemplateId, templateConfig, conversationId]);

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

  const handleSendMessage = async () => {
    const currentUser = DEV_MODE
      ? (user.user || { id: 'dev-user-123', email: 'dev@example.com' })
      : user.user;

    if (!inputValue.trim() || !conversationId || !currentUser) return;

    const userMessage = {
      role: "user" as const,
      content: inputValue,
    };

    setMessages((prev) => [...prev, userMessage]);
    const userInput = inputValue; // Save before clearing
    setInputValue("");
    setIsLoading(true);

    // Increment round number
    const newRoundNumber = roundNumber + 1;
    setRoundNumber(newRoundNumber);

    // Save user message to InstantDB (skip in dev mode)
    if (!DEV_MODE) {
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

    try {
      // Feature flag: Use two-agent system or fallback to old system
      if (ENABLE_TWO_AGENT_SYSTEM && conversationPhase === 'gathering') {
        await handleConversationPhase(userMessage, newRoundNumber, userInput);
      } else {
        await handleLegacyChat(userMessage);
      }
    } catch (error: any) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Sorry, er ging iets mis: ${error.message}`,
        },
      ]);
    } finally {
      setIsLoading(false);
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
    // Call conversation agent
    const response = await fetch("/api/chat/conversation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [...messages, userMessage],
        conversationRound: currentRound - 1,
        existingContext: stringifyExtractedContext(extractedContext),
      }),
    });

    const data = await response.json();

    // Handle rate limiting with retry suggestion
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

    // Update extracted context, readiness score, and concept lyrics
    setExtractedContext(data.extractedContext);
    setReadinessScore(data.readinessScore);
    if (data.conceptLyrics) {
      setConceptLyrics(data.conceptLyrics);
    }

    // Save AI message to InstantDB (skip in dev mode)
    if (!DEV_MODE) {
      const aiMsgId = id();
      await db.transact([
        db.tx.messages[aiMsgId]
          .update({
            role: "assistant",
            content: data.message,
            createdAt: Date.now(),
          })
          .link({ conversation: conversationId || undefined }),
        db.tx.conversations[conversationId!].update({
          roundNumber: currentRound,
          readinessScore: data.readinessScore,
          extractedContext: stringifyExtractedContext(data.extractedContext),
        }),
      ]);
    }

    // Check if should transition to lyrics generation
    if (shouldTransitionToGeneration(currentRound, data.readinessScore, userInput)) {
      await transitionToLyricsGeneration();
    }
  };

  /**
   * Transition to lyrics generation phase
   */
  const transitionToLyricsGeneration = async () => {
    setConversationPhase('generating');

    // Update conversation phase in DB
    if (!DEV_MODE && conversationId) {
      await db.transact([
        db.tx.conversations[conversationId].update({
          conversationPhase: 'generating',
        }),
      ]);
    }

    // Show transition message
    const transitionMessage = {
      role: "assistant" as const,
      content: `Dank je wel voor het delen van deze mooie herinneringen! 💕\n\nIk heb nu genoeg inspiratie om een persoonlijk liefdesliedje te schrijven.\n\nGeef me een momentje...`,
    };
    setMessages((prev) => [...prev, transitionMessage]);

    // Generate lyrics
    await generateLyrics();
  };

  /**
   * Task 4.6, 4.7: Generate lyrics using Suno API instead of DeepSeek
   */
  const generateLyrics = async () => {
    try {
      // Task 4.6: Get selected template or use default
      const template = selectedTemplateId
        ? getTemplateById(selectedTemplateId)
        : getTemplateById('romantic-ballad'); // Fallback to romantic ballad

      if (!template) {
        throw new Error('No template selected');
      }

      // Task 4.6: Build Suno-optimized prompt with template context
      const prompt = buildSunoLyricsPrompt(
        extractedContext,
        template,
        songSettings.language || 'Nederlands'
      );

      console.log('Generating lyrics with Suno...');
      console.log('Template:', template.name);
      console.log('Prompt length:', prompt.length);

      // Task 4.7: Call Suno lyrics API
      const callbackBase = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_SUNO_CALLBACK_ORIGIN || '';
      if (!callbackBase) {
        throw new Error('NEXT_PUBLIC_BASE_URL (public callback origin) is not configured');
      }

      const response = await fetch("/api/suno/lyrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          callBackUrl: `${callbackBase}/api/suno/lyrics/callback` +
            (conversationId ? `?conversationId=${conversationId}` : ''),
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Task 4.8: For now, poll for results (callback is async)
      // In production, the callback will update the conversation directly
      const taskId = data.taskId;

      if (!taskId) {
        throw new Error('No task ID returned from Suno');
      }

      // Start polling for lyrics
      try {
        await pollForLyrics(taskId);
      } catch (e) {
        console.error('Lyrics polling failed:', e);
        setGenerationError((e as Error).message || 'Lyrics generation timed out');
        setLyricsOptions([]);
        setSelectedLyricIndex(null);
        setPendingLyricVariants([]);
        setLyricsTaskId(null);
        setLatestLyrics(null);
        setConversationPhase('gathering');

        // Task 5.2: Track regeneration due to timeout/error
        trackLyricsRegenerated({
          conversationId: conversationId || undefined,
          reason: 'timeout',
        });
        throw e;
      }
    } catch (error: any) {
      console.error("Lyrics generation error:", error);
      setGenerationError(error.message || 'Er ging iets mis bij het genereren van de lyrics.');
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Sorry, er ging iets mis bij het genereren van de lyrics: ${error.message}\n\nLaten we nog wat meer context verzamelen.`,
        },
      ]);
      setConversationPhase('gathering');
      throw error;
    }
  };

  /**
   * Poll Suno API for lyrics generation status
   */
  const pollForLyrics = async (taskId: string, options?: { refinement?: boolean }) => {
    let attempts = 0;
    const maxAttempts = 24; // 24 * 5s = 120s timeout
    setLyricsTaskId(taskId);

    const poll = async (): Promise<void> => {
      attempts++;

      if (attempts > maxAttempts) {
        setLyricsTaskId(null);
        setPendingLyricVariants([]);
        throw new Error('Lyrics generation timed out');
      }

      const response = await fetch(`/api/suno/lyrics?taskId=${taskId}`);
      const data = await response.json();

      if (data.status === 'complete' && (data.lyrics || data.variants)) {
        // Success! Show lyrics
        const isRefinement = !!options?.refinement;
        const messageText = isRefinement
          ? "Ik heb de lyrics verbeterd op basis van je feedback. De bijgewerkte versie staat rechts. ✨"
          : "Ik heb een eerste versie van je liedje geschreven. Je ziet de volledige lyrics rechts in het paneel. ✨";

        const noticeMessage = {
          role: "assistant" as const,
          content: messageText,
        };

        setMessages((prev) => [...prev, noticeMessage]);

        const variantArray = Array.isArray((data as any).variants)
          ? (data as any).variants.filter((entry: any) => typeof entry === 'string' && entry.trim().length > 0)
          : [];
        const hasVariants = variantArray.length >= 2;

        if (hasVariants) {
          setPendingLyricVariants(variantArray);
          setLyricsOptions(variantArray.slice(0, 2));
          setSelectedLyricIndex(null);
          setLatestLyrics(null);
          setRefineUsed(false);
          setManualEdited(false);
          setPendingLyricSource(isRefinement ? 'suno-refine' : 'suno');

          // Task 5.2: Track lyrics options shown
          trackLyricsOptionsShown({
            taskId,
            variantCount: variantArray.length,
            conversationId: conversationId || undefined,
          });
        } else if (data.lyrics) {
          const finalLyrics = String(data.lyrics);
          setPendingLyricVariants([]);
          setLyricsOptions([]);
          setSelectedLyricIndex(null);
          setLatestLyrics({
            lyrics: finalLyrics,
            title: 'Jouw Liefdesliedje',
            style: templateConfig?.style || '',
          });
          setRefineUsed(false);
          setManualEdited(false);
          setLyricsTaskId(null);
          setPendingLyricSource('suno');
          await generateLyricVersion(
            {
              lyrics: finalLyrics,
              title: 'Jouw Liefdesliedje',
              style: templateConfig?.style || '',
            },
            {
              source: isRefinement ? 'suno-refine' : 'suno',
              variantIndex: 0,
              taskId,
              isRefinement: isRefinement,
            }
          );
        }
        if (isRefinement) {
          setRefinementCount((prev) => {
            const next = prev + 1;
            console.log('[analytics] refinement_count', next);
            return next;
          });
        }
        setConversationPhase(isRefinement ? 'refining' : 'complete');

        // Update conversation phase
        if (!DEV_MODE && conversationId) {
          await db.transact([
            db.tx.conversations[conversationId].update({
              conversationPhase: isRefinement ? 'refining' : 'complete',
            }),
          ]);
        }

        return; // Exit polling
      } else if (data.status === 'failed') {
        setLyricsTaskId(null);
        setPendingLyricVariants([]);
        throw new Error('Lyrics generation failed');
      }

      // Still generating, wait and poll again
      await new Promise(resolve => setTimeout(resolve, 5000));
      return poll();
    };

    await poll();
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

    // Save AI message to InstantDB (skip in dev mode)
    if (!DEV_MODE) {
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

      const callbackBase = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_SUNO_CALLBACK_ORIGIN || '';
      if (!callbackBase) {
        throw new Error('NEXT_PUBLIC_BASE_URL (public callback origin) is not configured');
      }

      const response = await fetch("/api/suno/lyrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          previousLyrics: previousLyricsPayload,
          feedback: feedback,
          templateId: template.id,
          context: extractedContext,
          callBackUrl: `${callbackBase}/api/suno/lyrics/callback` +
            (conversationId ? `?conversationId=${conversationId}` : ''),
        }),
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

      await pollForLyrics(taskId, { refinement: true });
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
    } finally {
      setIsLoading(false);
      setIsRefiningLyrics(false);
      setConversationPhase((prev) => (prev === 'generating' ? 'complete' : prev));
    }
  };

  /**
   * Handle music generation
   */
  const startMusicGeneration = async (parameterOverrides?: ParameterValues) => {
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
    const title = latestLyrics.title || "Liefdesliedje";
    const lyrics = latestLyrics.lyrics || "";
    const musicStyle = latestLyrics.style || "romantic ballad";

    console.log("Starting music generation:", {
      songId,
      title,
      musicStyle,
      parameters: activeParameters,
    });

    // Task 3.3: Create song entity in InstantDB
    const currentUser = DEV_MODE ? { id: "dev-user-123" } : user.user;

    if (!currentUser) {
      console.error("No user available");
      return;
    }

    if (!DEV_MODE) {
      try {
        await db.transact([
          db.tx.songs[songId]
            .update({
              title,
              lyrics,
              musicStyle,
              generationParams: JSON.stringify(generationPreferences),
              status: "generating",
              createdAt: Date.now(),
            })
            .link({ conversation: conversationId, user: currentUser.id }),
        ]);
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
    });

    try {
      // Task 5.0: Get template config for music generation
      const template = selectedTemplateId
        ? getTemplateById(selectedTemplateId)
        : getTemplateById("romantic-ballad");

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
      let mergedTemplateConfig = baseTemplateConfig;

      if (baseTemplateConfig && advancedSettings.enabled) {
        mergedTemplateConfig = {
          ...baseTemplateConfig,
          model: advancedSettings.model,
          styleWeight: advancedSettings.styleWeight,
          weirdnessConstraint: advancedSettings.weirdnessConstraint,
          audioWeight: advancedSettings.audioWeight,
        };

        const trimmedNegatives = advancedSettings.negativeTags.trim();
        if (trimmedNegatives) {
          mergedTemplateConfig.negativeTags = trimmedNegatives;
        } else {
          delete mergedTemplateConfig.negativeTags;
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

      // Task 3.9: Start polling after 10 seconds as fallback
      setTimeout(() => {
        if (isGeneratingMusic) {
          startPolling(songId, data.taskId);
        }
      }, 10000);
    } catch (error: any) {
      console.error("Music generation error:", error);
      setIsGeneratingMusic(false);
      setGenerationStage(null);

      // Task 6.2, 6.4, 6.7: Set error state with user-friendly Dutch message
      setGenerationError("Er ging iets mis met het genereren van je muziek");

      // Update song status to failed (if not in dev mode)
      if (!DEV_MODE) {
        await db.transact([
          db.tx.songs[songId].update({
            status: "failed",
            errorMessage: error.message,
          }),
        ]);
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

  const handleConfirmParameterSheet = async (values: ParameterValues) => {
    setIsParameterSheetSubmitting(true);
    try {
      await startMusicGeneration(values);
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

            await db.transact(updates);
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

          console.log('Music generation complete via polling:', data);
        } else if (data.status === 'failed') {
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          setIsGeneratingMusic(false);
          setGenerationStage(null);

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

  if (!DEV_MODE && user.isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-pink-200 border-t-pink-600 mx-auto"></div>
          <p className="text-gray-600">Laden...</p>
        </div>
      </div>
    );
  }

  if (!DEV_MODE && !user.user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Log in om te beginnen</h1>
          <p className="text-gray-600">Je moet ingelogd zijn om de studio te gebruiken.</p>
        </div>
      </div>
    );
  }

  // Chat Pane Component
  // Task 5.3: Compact spacing when compare UI is active
  const showCompactChat = ENABLE_LYRICS_COMPARE && lyricsOptions.length >= 2;
  const chatPane = (
    <div className={`flex h-full flex-col ${showCompactChat ? 'bg-white' : ''}`}>
      {/* Header */}
      <div className={`bg-white px-4 py-3 ${showCompactChat ? 'border-b border-gray-200' : 'border-b border-gray-200 md:px-6 md:py-4'}`}>
        <h1 className="text-xl font-bold text-gray-800">💕 Liefdesliedje Studio</h1>
        <p className="text-sm text-gray-500">Maak je persoonlijke liefdesliedje</p>
        {ENABLE_TWO_AGENT_SYSTEM && conversationPhase === 'gathering' && (
          <p className="text-xs text-pink-600 mt-1">
            Ronde {roundNumber}/{MIN_CONVERSATION_ROUNDS} • Gereedheid: {Math.round(readinessScore * 100)}%
          </p>
        )}
      </div>

      {/* Messages Area */}
      <div
        ref={chatContainerRef}
        className={`flex-1 overflow-y-auto ${showCompactChat ? 'bg-white px-3 py-2' : 'bg-gray-50 p-4'}`}
      >
        <div className={`mx-auto ${showCompactChat ? 'max-w-2xl space-y-3' : 'max-w-3xl space-y-4'}`}>
          {messages.length === 0 && (
            <div className="text-center py-10">
              <div className="text-6xl mb-4">🎵</div>
              <h2 className="text-xl font-semibold text-gray-700 mb-2">
                Welkom bij je liefdesliedje studio!
              </h2>
              <p className="text-gray-600">
                Begin een gesprek en ik help je een persoonlijk liefdesliedje te maken.
              </p>
            </div>
          )}

          {messages.map((message, idx) => (
            <div
              key={idx}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
              className={`max-w-[80%] rounded-lg px-3 py-2 md:px-4 md:py-3 ${
                message.role === "user"
                  ? "bg-pink-500 text-white"
                  : "bg-white text-gray-800 shadow-sm"
              }`}
            >
              <div className="whitespace-pre-wrap">{message.content}</div>
            </div>
          </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="rounded-lg bg-white px-3 py-2 shadow-sm md:px-4 md:py-3">
                {conversationPhase === 'generating' ? (
                  <p className="text-sm text-gray-600">Lyrics worden gegenereerd...</p>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 animate-bounce rounded-full bg-pink-500"></div>
                    <div className="h-2 w-2 animate-bounce rounded-full bg-pink-500 animation-delay-200"></div>
                    <div className="h-2 w-2 animate-bounce rounded-full bg-pink-500 animation-delay-400"></div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Composer Controls + Input Area */}
      <div className={`border-t border-gray-200 bg-white ${showCompactChat ? 'px-3 py-2' : 'p-4'}`}>
        <div className={`mx-auto ${showCompactChat ? 'max-w-2xl space-y-2' : 'max-w-3xl space-y-3'}`}>
          {/* Composer Controls */}
          <ComposerControls
            composerContext={latestComposerContext}
            onSuggestionClick={handleSuggestionClick}
            roundNumber={roundNumber}
            readinessScore={readinessScore}
            onGenerateNow={
              ENABLE_TWO_AGENT_SYSTEM && conversationPhase === 'gathering'
                ? transitionToLyricsGeneration
                : undefined
            }
          />

          {/* Input Area */}
          <div className={`flex gap-2 ${showCompactChat ? 'items-center' : ''}`}>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
              placeholder={
                conversationPhase === 'complete'
                  ? "Klaar! Wil je het liedje verfijnen?"
                  : "Typ je bericht..."
              }
              disabled={isLoading}
              className={`flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-200 disabled:bg-gray-100 md:px-4 md:py-3`}
            />
            <button
              onClick={handleSendMessage}
              disabled={isLoading || !inputValue.trim()}
              className="rounded-lg bg-pink-500 px-4 py-2 font-semibold text-white transition-colors hover:bg-pink-600 disabled:bg-gray-300 disabled:cursor-not-allowed md:px-6 md:py-3"
            >
              Verstuur
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Get current song and variants from query
  const currentSongData = songData?.songs?.find((s: any) => s.id === currentSong?.songId);
  const variants = currentSongData?.variants || [];

  // Get selected song data for music player
  const selectedSongData = selectedVariantId && currentSongData
    ? variants.find((v: any) => v.id === selectedVariantId) || currentSongData
    : null;

  const selectedSongForPlayer = selectedSongData ? {
    id: selectedSongData.id || '',
    title: currentSongData?.title || currentSong?.title || 'Liefdesliedje',
    imageUrl: selectedSongData.imageUrl || currentSongData?.imageUrl || '',
    streamAudioUrl: selectedSongData.streamAudioUrl || currentSongData?.streamAudioUrl || selectedSongData.audioUrl || '',
    audioUrl: selectedSongData.audioUrl || currentSongData?.audioUrl || '',
  } : null;

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
      setLyricsOptions([]);
      setPendingLyricVariants([]);
      setSelectedLyricIndex(null);
      setLyricsTaskId(null);
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
    setLatestLyrics((prev) =>
      prev
        ? { ...prev, lyrics: text }
        : { title: 'Gekozen Lyrics', lyrics: text, style: templateConfig?.style || '' }
    );
    setLyricsOptions([]);
    setSelectedLyricIndex(null);
    setManualEdited(true);
    setPendingLyricVariants([]);
    setLyricsTaskId(null);
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
          startMusicGeneration(musicParameters);
        }}
        onAdjustLyrics={() => {
          setGenerationError(null);
          setConversationPhase('refining');
        }}
        preferences={songSettings}
        onChangePreferences={setSongSettings}
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
      <ConversationalStudioLayout
        templatePane={templatePane}
        chatPane={chatPane}
        lyricsPane={lyricsPane}
      />

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
        onClose={handleCloseParameterSheet}
        onConfirm={handleConfirmParameterSheet}
        isSubmitting={isParameterSheetSubmitting}
      />
    </>
  );
}
