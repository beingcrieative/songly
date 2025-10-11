"use client";

import { useState, ReactNode } from "react";

interface ConversationalStudioLayoutProps {
  templatePane?: ReactNode; // Task 4.3: Add template pane (left)
  chatPane: ReactNode;
  lyricsPane: ReactNode;
  className?: string;
}

export function ConversationalStudioLayout({
  templatePane,
  chatPane,
  lyricsPane,
  className = "",
}: ConversationalStudioLayoutProps) {
  const [isLyricsPanelOpen, setIsLyricsPanelOpen] = useState(false);

  return (
    <div className={`flex h-screen flex-col ${className}`}>
      {/* Task 4.3: Desktop: 3-column layout (Template | Chat | Lyrics) */}
      <div className="hidden h-full md:grid md:grid-cols-[300px_1fr_400px] md:gap-0">
        {/* Left Pane: Template Selector */}
        {templatePane && (
          <div className="flex flex-col border-r border-gray-200 bg-white">
            <div className="flex h-full flex-col overflow-hidden">
              {templatePane}
            </div>
          </div>
        )}

        {/* Middle Pane: Chat + Composer */}
        <div className="flex flex-col border-r border-gray-200 bg-white">
          <div className="flex h-full flex-col overflow-hidden">
            {chatPane}
          </div>
        </div>

        {/* Right Pane: Lyrics */}
        <div className="flex flex-col bg-gradient-to-b from-gray-50 to-pink-50">
          <div className="flex h-full flex-col overflow-hidden">
            {lyricsPane}
          </div>
        </div>
      </div>

      {/* Mobile Layout: Stacked with collapsible lyrics */}
      <div className="flex h-full flex-col md:hidden">
        {/* Chat Pane (always visible on mobile) */}
        <div className="flex flex-1 flex-col overflow-hidden bg-white">
          {chatPane}
        </div>

        {/* Collapsible Lyrics Panel */}
        <div
          className={`flex flex-col border-t border-gray-200 bg-gradient-to-b from-gray-50 to-pink-50 transition-all duration-300 ease-in-out ${
            isLyricsPanelOpen ? "h-96" : "h-14"
          }`}
        >
          {/* Toggle Button */}
          <button
            onClick={() => setIsLyricsPanelOpen(!isLyricsPanelOpen)}
            className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            <div className="flex items-center gap-2">
              <svg
                className="h-5 w-5 text-pink-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                />
              </svg>
              <span>Lyrics</span>
            </div>
            <svg
              className={`h-5 w-5 text-gray-400 transition-transform ${
                isLyricsPanelOpen ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 15l7-7 7 7"
              />
            </svg>
          </button>

          {/* Lyrics Content (scrollable when open) */}
          <div className="flex-1 overflow-y-auto">
            {isLyricsPanelOpen && lyricsPane}
          </div>
        </div>
      </div>
    </div>
  );
}
