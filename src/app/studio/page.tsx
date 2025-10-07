"use client";

import { useState, useEffect, useRef } from "react";
import { id } from "@instantdb/react";
import { db } from "@/lib/db";
import { ConversationalStudioLayout } from "@/components/ConversationalStudioLayout";
import { ComposerControls } from "@/components/ComposerControls";
import { LyricsPanel } from "@/components/LyricsPanel";

// DEV_MODE: When true, bypasses authentication (set NEXT_PUBLIC_DEV_MODE=false for production)
const DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === 'true';

export default function StudioPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [latestComposerContext, setLatestComposerContext] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
    setInputValue("");
    setIsLoading(true);

    // Save user message to InstantDB (skip in dev mode)
    if (!DEV_MODE) {
      const userMsgId = id();
      await db.transact([
        db.tx.messages[userMsgId]
          .update({
            role: "user",
            content: inputValue,
            createdAt: Date.now(),
          })
          .link({ conversation: conversationId }),
      ]);
    }

    try {
      // Call chat API
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
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 animate-bounce rounded-full bg-pink-500"></div>
                  <div className="h-2 w-2 animate-bounce rounded-full bg-pink-500 animation-delay-200"></div>
                  <div className="h-2 w-2 animate-bounce rounded-full bg-pink-500 animation-delay-400"></div>
                </div>
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
          />

          {/* Input Area */}
          <div className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
              placeholder="Typ je bericht..."
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

  // Lyrics Pane Component
  const lyricsPane = conversationId ? (
    <LyricsPanel conversationId={conversationId} className="h-full" />
  ) : (
    <div className="flex h-full items-center justify-center p-8">
      <p className="text-gray-500">Conversatie wordt geladen...</p>
    </div>
  );

  return <ConversationalStudioLayout chatPane={chatPane} lyricsPane={lyricsPane} />;
}
