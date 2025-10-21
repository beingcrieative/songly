"use client";

import { useState, ReactNode } from "react";

interface ConversationalStudioLayoutProps {
  templatePane?: ReactNode; // Task 4.3: Add template pane (left)
  chatPane: ReactNode;
  lyricsPane: ReactNode;
  className?: string;
  isMobileLyricsOpen?: boolean;
  onMobileLyricsOpenChange?: (open: boolean) => void;
}

export function ConversationalStudioLayout({
  templatePane,
  chatPane,
  lyricsPane,
  className = "",
  isMobileLyricsOpen,
  onMobileLyricsOpenChange,
}: ConversationalStudioLayoutProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = typeof isMobileLyricsOpen === 'boolean';
  const isLyricsPanelOpen = isControlled ? !!isMobileLyricsOpen : internalOpen;
  const setIsLyricsPanelOpen = (open: boolean) => {
    if (!isControlled) {
      setInternalOpen(open);
    }
    onMobileLyricsOpenChange?.(open);
  };
  const hasTemplatePane = Boolean(templatePane);
  const desktopGridCols = hasTemplatePane
    ? "md:grid-cols-[300px_1fr_400px]"
    : "md:grid-cols-[1fr_400px]";
  const chatPaneBorders = hasTemplatePane
    ? "border-r border-gray-200"
    : "border-r border-gray-200";

  return (
    <div
      className={`flex h-[100svh] flex-col overflow-hidden md:min-h-screen ${className}`}
    >
      {/* Task 4.3: Desktop: 3-column layout (Template | Chat | Lyrics) */}
      <div className={`hidden h-full md:grid ${desktopGridCols} md:gap-0`}>
        {/* Left Pane: Template Selector */}
        {hasTemplatePane && (
          <div className="flex flex-col border-r border-gray-200 bg-white">
            <div className="flex h-full flex-col overflow-hidden">
              {templatePane}
            </div>
          </div>
        )}

        {/* Middle Pane: Chat + Composer */}
        <div className={`flex flex-col bg-white ${chatPaneBorders}`}>
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
      <div className="relative flex flex-1 flex-col overflow-hidden md:hidden">
        {/* Chat Pane (always visible on mobile) */}
        <div className="flex flex-1 flex-col overflow-hidden bg-white">
          {chatPane}
        </div>

        {/* Floating opener removed for cleaner native feel on mobile */}

        {isLyricsPanelOpen && (
          <>
            <div
              className="absolute inset-x-0 top-0 bottom-[64px] z-40 bg-black/30 backdrop-blur-[1px]"
              onClick={() => setIsLyricsPanelOpen(false)}
            />
            <div className="absolute inset-x-0 bottom-[64px] z-50 max-h-[80vh] overflow-hidden rounded-t-3xl bg-gradient-to-b from-white via-white to-pink-50 shadow-xl">
              <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
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
                  <span>Lyrics & instellingen</span>
                </div>
                <button
                  onClick={() => setIsLyricsPanelOpen(false)}
                  className="rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-600 hover:border-pink-300 hover:text-pink-600"
                >
                  Sluit
                </button>
              </div>
              <div className="max-h-[calc(80vh-56px)] overflow-y-auto px-4 pb-6 pt-4">
                {lyricsPane}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
