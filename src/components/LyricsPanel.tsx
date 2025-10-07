"use client";

import { useState } from "react";
import { useLyricVersionsWithNotification } from "@/hooks/useLyricVersions";
import { InstaQLEntity } from "@instantdb/react";
import { type AppSchema } from "@/instant.schema";

type LyricVersion = InstaQLEntity<AppSchema, "lyric_versions">;

interface LyricsPanelProps {
  conversationId?: string;
  songId?: string;
  className?: string;
}

export function LyricsPanel({ conversationId, songId, className = "" }: LyricsPanelProps) {
  const [expandedVersionId, setExpandedVersionId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const { versions, latestVersion, isLoading, hasNewVersion } = useLyricVersionsWithNotification({
    conversationId,
    songId,
    enabled: !!(conversationId || songId),
  });

  // Parse lyric content from JSON string
  const parseLyricContent = (version: LyricVersion) => {
    try {
      if (version.content) {
        const parsed = JSON.parse(version.content);
        return parsed;
      }
    } catch (e) {
      console.warn("Failed to parse lyric content:", e);
    }
    return null;
  };

  const toggleVersion = (versionId: string) => {
    setExpandedVersionId(expandedVersionId === versionId ? null : versionId);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-pink-200 border-t-pink-600"></div>
          <p className="text-sm text-gray-500">Lyrics laden...</p>
        </div>
      </div>
    );
  }

  // No lyrics yet state
  if (!latestVersion) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-center">
          <div className="mb-4 text-6xl">🎵</div>
          <h3 className="mb-2 text-lg font-semibold text-gray-700">Nog geen lyrics</h3>
          <p className="text-sm text-gray-500">
            Start een gesprek om je persoonlijke liefdesliedje te creëren
          </p>
        </div>
      </div>
    );
  }

  const latestLyricData = parseLyricContent(latestVersion);
  const olderVersions = versions.slice(1);

  return (
    <div className={`flex h-full flex-col ${className}`}>
      {/* Header with new version indicator */}
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              {latestLyricData?.title || "Liefdesliedje"}
            </h2>
            <p className="text-sm text-gray-500">{latestVersion.label}</p>
          </div>
          {hasNewVersion && (
            <div className="animate-pulse rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
              ✨ Nieuw bijgewerkt
            </div>
          )}
        </div>

        {/* Style tag */}
        {latestLyricData?.style && (
          <div className="mt-3">
            <span className="inline-block rounded-full bg-pink-100 px-3 py-1 text-xs font-medium text-pink-700">
              {latestLyricData.style}
            </span>
          </div>
        )}
      </div>

      {/* Latest lyrics content */}
      <div className="flex-1 overflow-y-auto bg-gradient-to-b from-white to-pink-50 p-6">
        <div className="mx-auto max-w-2xl">
          {/* Latest version indicator */}
          <div className="mb-4 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-pink-500"></div>
            <span className="text-xs font-semibold uppercase tracking-wide text-pink-600">
              Huidige versie
            </span>
          </div>

          {/* Lyrics text */}
          <div className="whitespace-pre-wrap font-serif text-lg leading-relaxed text-gray-800">
            {latestLyricData?.lyrics || latestVersion.content}
          </div>

          {/* Notes (if any) */}
          {latestLyricData?.notes && (
            <div className="mt-6 rounded-lg border-l-4 border-blue-400 bg-blue-50 p-4">
              <p className="text-sm font-medium text-blue-900">Opmerking:</p>
              <p className="mt-1 text-sm text-blue-700">{latestLyricData.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Version history footer */}
      {olderVersions.length > 0 && (
        <div className="border-t border-gray-200 bg-white">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="w-full px-6 py-3 text-left text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <div className="flex items-center justify-between">
              <span>
                📜 Versiegeschiedenis ({olderVersions.length} {olderVersions.length === 1 ? "eerdere versie" : "eerdere versies"})
              </span>
              <svg
                className={`h-5 w-5 transition-transform ${showHistory ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>

          {/* Expandable history list */}
          {showHistory && (
            <div className="max-h-64 overflow-y-auto border-t border-gray-100 bg-gray-50 px-6 py-4">
              <div className="space-y-2">
                {olderVersions.map((version) => {
                  const versionData = parseLyricContent(version);
                  const isExpanded = expandedVersionId === version.id;

                  return (
                    <div
                      key={version.id}
                      className="rounded-lg border border-gray-200 bg-white"
                    >
                      <button
                        onClick={() => toggleVersion(version.id)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-700">
                              {versionData?.title || "Versie zonder titel"}
                            </p>
                            <p className="text-xs text-gray-500">{version.label}</p>
                          </div>
                          <svg
                            className={`h-4 w-4 text-gray-400 transition-transform ${
                              isExpanded ? "rotate-180" : ""
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </div>
                      </button>

                      {/* Expanded version content */}
                      {isExpanded && (
                        <div className="border-t border-gray-100 bg-gray-50 px-4 py-3">
                          <div className="max-h-48 overflow-y-auto whitespace-pre-wrap font-serif text-sm leading-relaxed text-gray-700">
                            {versionData?.lyrics || version.content}
                          </div>
                          {versionData?.notes && (
                            <div className="mt-3 text-xs italic text-gray-600">
                              {versionData.notes}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
