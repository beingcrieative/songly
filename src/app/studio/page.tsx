"use client";

import { useState, useEffect, useRef } from "react";
import { id } from "@instantdb/react";
import { db } from "@/lib/db";
import { ConversationalStudioLayout } from "@/components/ConversationalStudioLayout";
import { ComposerControls } from "@/components/ComposerControls";
import { LyricsPanel } from "@/components/LyricsPanel";
import { ConversationPhase, ExtractedContext } from "@/types/conversation";
import { stringifyExtractedContext } from "@/lib/utils/contextExtraction";

// DEV_MODE: When true, bypasses authentication (set NEXT_PUBLIC_DEV_MODE=false for production)
const DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === 'true';

// TWO_AGENT_SYSTEM: When true, uses the two-agent conversation system
const ENABLE_TWO_AGENT_SYSTEM = process.env.NEXT_PUBLIC_ENABLE_TWO_AGENT_SYSTEM !== 'false';
const MIN_CONVERSATION_ROUNDS = parseInt(process.env.NEXT_PUBLIC_MIN_CONVERSATION_ROUNDS || '6');
const MAX_CONVERSATION_ROUNDS = parseInt(process.env.NEXT_PUBLIC_MAX_CONVERSATION_ROUNDS || '10');

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

  // Music generation state
  const [isGeneratingMusic, setIsGeneratingMusic] = useState(false);
  const [generationStage, setGenerationStage] = useState<1 | 2 | 3 | null>(null);
  const [currentSong, setCurrentSong] = useState<any | null>(null);
  const [showVariantSelector, setShowVariantSelector] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);

  const user = db.useAuth();

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
          })
          .link({ user: currentUser.id }),
      ]);
    }
  }, [user.isLoading, user.user]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
          .link({ conversation: conversationId }),
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

    // Update extracted context and readiness score
    setExtractedContext(data.extractedContext);
    setReadinessScore(data.readinessScore);

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
          .link({ conversation: conversationId }),
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
   * Generate lyrics using lyrics generation agent
   */
  const generateLyrics = async () => {
    try {
      // Build conversation transcript
      const transcript = messages
        .map((m) => `${m.role}: ${m.content}`)
        .join('\n');

      const response = await fetch("/api/chat/generate-lyrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationTranscript: transcript,
          extractedContext: extractedContext,
          userPreferences: {},
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Create lyrics message
      const lyricsMessage = {
        role: "assistant" as const,
        content: `🎵 **${data.title}**\n\n${data.lyrics}\n\n*${data.style}*`,
        lyrics: data,
      };

      setMessages((prev) => [...prev, lyricsMessage]);
      setConversationPhase('complete');

      // Update conversation phase
      if (!DEV_MODE && conversationId) {
        await db.transact([
          db.tx.conversations[conversationId].update({
            conversationPhase: 'complete',
          }),
        ]);
      }

      // Generate lyric version
      await generateLyricVersion(data);
    } catch (error: any) {
      console.error("Lyrics generation error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Sorry, er ging iets mis bij het genereren van de lyrics: ${error.message}\n\nLaten we nog wat meer context verzamelen.`,
        },
      ]);
      setConversationPhase('gathering');
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
          .link({ conversation: conversationId }),
      ]);
    }

    // Generate lyric version if we have lyrics
    if (data.lyrics) {
      await generateLyricVersion(data.lyrics);
    }
  };

  const generateLyricVersion = async (lyricsData: any) => {
    if (!conversationId) return;

    try {
      const response = await fetch("/api/lyric-versions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
          previousLyrics: lyricsData.lyrics,
          previousVersion: 0,
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
    if (!feedback.trim()) return;

    setIsLoading(true);
    setConversationPhase('generating');

    try {
      // Get latest lyrics from messages
      const latestLyricsMessage = messages.slice().reverse().find((m) => m.lyrics);
      if (!latestLyricsMessage) {
        throw new Error('No lyrics to refine');
      }

      // Build conversation transcript
      const transcript = messages
        .map((m) => `${m.role}: ${m.content}`)
        .join('\n');

      // Call refinement API
      const response = await fetch("/api/chat/refine-lyrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          previousLyrics: latestLyricsMessage.lyrics,
          feedback: feedback,
          conversationTranscript: transcript,
          extractedContext: extractedContext,
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Add refined lyrics message
      const refinedMessage = {
        role: "assistant" as const,
        content: `🎵 **${data.title}** (verfijnd)\n\n${data.lyrics}\n\n*${data.style}*${data.reasoning ? `\n\n_${data.reasoning}_` : ''}`,
        lyrics: data,
      };

      setMessages((prev) => [...prev, refinedMessage]);
      setConversationPhase('refining');

      // Update conversation phase in DB
      if (!DEV_MODE && conversationId) {
        await db.transact([
          db.tx.conversations[conversationId].update({
            conversationPhase: 'refining',
          }),
        ]);
      }

      // Create new lyric version
      await generateLyricVersion(data);
    } catch (error: any) {
      console.error("Lyrics refinement error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Sorry, er ging iets mis bij het verfijnen van de lyrics: ${error.message}\n\nProbeer het opnieuw met andere feedback.`,
        },
      ]);
    } finally {
      setIsLoading(false);
      setConversationPhase('complete');
    }
  };

  /**
   * Handle music generation
   * Placeholder function - full implementation will come in Task 3.0
   */
  const handleGenerateMusic = async () => {
    console.log('handleGenerateMusic called - implementation pending');
    // TODO: Task 3.0 - Implement full music generation logic
    // This function will:
    // 1. Generate songId using id()
    // 2. Extract title, lyrics, style from latestLyrics
    // 3. Create song entity in InstantDB
    // 4. Call POST /api/suno
    // 5. Set isGeneratingMusic, generationStage, currentSong
    // 6. Set up InstantDB subscription and polling
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
  const chatPane = (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <h1 className="text-xl font-bold text-gray-800">💕 Liefdesliedje Studio</h1>
        <p className="text-sm text-gray-500">Maak je persoonlijke liefdesliedje</p>
        {ENABLE_TWO_AGENT_SYSTEM && conversationPhase === 'gathering' && (
          <p className="text-xs text-pink-600 mt-1">
            Ronde {roundNumber}/{MIN_CONVERSATION_ROUNDS} • Gereedheid: {Math.round(readinessScore * 100)}%
          </p>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto bg-gray-50 p-4">
        <div className="mx-auto max-w-3xl space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-12">
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
                className={`max-w-[80%] rounded-lg px-4 py-3 ${
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
              <div className="rounded-lg bg-white px-4 py-3 shadow-sm">
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

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Composer Controls + Input Area */}
      <div className="border-t border-gray-200 bg-white p-4">
        <div className="mx-auto max-w-3xl space-y-3">
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
          <div className="flex gap-2">
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
              className="flex-1 rounded-lg border border-gray-300 px-4 py-3 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-200 disabled:bg-gray-100"
            />
            <button
              onClick={handleSendMessage}
              disabled={isLoading || !inputValue.trim()}
              className="rounded-lg bg-pink-500 px-6 py-3 font-semibold text-white transition-colors hover:bg-pink-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Verstuur
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Find latest generated lyrics from messages
  const latestLyrics = messages.length > 0
    ? messages.slice().reverse().find((m) => m.lyrics)?.lyrics
    : null;

  // Lyrics Pane Component
  const lyricsPane = conversationId ? (
    <LyricsPanel
      conversationId={conversationId}
      className="h-full"
      conversationPhase={conversationPhase}
      extractedContext={extractedContext}
      roundNumber={roundNumber}
      readinessScore={readinessScore}
      latestLyrics={latestLyrics}
      onRefineLyrics={handleRefineLyrics}
      isRefining={isLoading && conversationPhase === 'generating'}
      onGenerateMusic={handleGenerateMusic}
      isGeneratingMusic={isGeneratingMusic}
    />
  ) : (
    <div className="flex h-full items-center justify-center p-8">
      <p className="text-gray-500">Conversatie wordt geladen...</p>
    </div>
  );

  return <ConversationalStudioLayout chatPane={chatPane} lyricsPane={lyricsPane} />;
}
