"use client";

/**
 * Example integration component showing how to use:
 * - ConversationalStudioLayout for responsive split-view
 * - ComposerControls for context-aware suggestions
 * - LyricsPanel for version-aware lyrics display
 *
 * This is a reference implementation - integrate into your main page.tsx
 */

import { useState } from "react";
import { ConversationalStudioLayout } from "./ConversationalStudioLayout";
import { ComposerControls } from "./ComposerControls";
import { LyricsPanel } from "./LyricsPanel";

interface Message {
  role: "user" | "assistant";
  content: string;
  composerContext?: string;
}

export function StudioExample() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [conversationId] = useState("example-conversation-id");

  // Get latest composer context from messages
  const latestComposerContext = messages
    .slice()
    .reverse()
    .find((m) => m.composerContext)?.composerContext;

  const handleSuggestionClick = (suggestion: string) => {
    // Inject suggestion into input field
    setInputValue((prev) => {
      const separator = prev.trim() ? " " : "";
      return `${prev}${separator}${suggestion}`;
    });
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    // Add user message
    const newMessage: Message = {
      role: "user",
      content: inputValue,
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputValue("");

    // Simulate AI response with composer context
    setTimeout(() => {
      const aiResponse: Message = {
        role: "assistant",
        content: "Dat klinkt mooi! Vertel me meer...",
        composerContext: JSON.stringify({
          mood: ["romantic", "hopeful"],
          tone: ["nostalgic", "passionate"],
          sections: ["add verse", "extend chorus"],
          suggested_action: "Voeg meer emotionele details toe",
        }),
      };
      setMessages((prev) => [...prev, aiResponse]);
    }, 1000);
  };

  // Chat Pane Component
  const chatPane = (
    <div className="flex h-full flex-col">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mx-auto max-w-3xl space-y-4">
          {messages.map((message, idx) => (
            <div
              key={idx}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.role === "user"
                    ? "bg-pink-500 text-white"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Composer Controls */}
      <div className="border-t border-gray-200 bg-gray-50 p-4">
        <div className="mx-auto max-w-3xl">
          <ComposerControls
            composerContext={latestComposerContext}
            onSuggestionClick={handleSuggestionClick}
            className="mb-3"
          />

          {/* Input Area */}
          <div className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="Typ je bericht..."
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-200"
            />
            <button
              onClick={handleSendMessage}
              className="rounded-lg bg-pink-500 px-6 py-2 font-semibold text-white transition-colors hover:bg-pink-600"
            >
              Verstuur
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Lyrics Pane Component
  const lyricsPane = (
    <LyricsPanel conversationId={conversationId} className="h-full" />
  );

  return (
    <ConversationalStudioLayout
      chatPane={chatPane}
      lyricsPane={lyricsPane}
    />
  );
}
