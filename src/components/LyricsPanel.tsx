"use client";

import { useState } from "react";
import { useLyricVersionsWithNotification } from "@/hooks/useLyricVersions";
import { InstaQLEntity } from "@instantdb/react";
import { type AppSchema } from "@/instant.schema";
import { ConversationPhase, ExtractedContext } from "@/types/conversation";

type LyricVersion = InstaQLEntity<AppSchema, "lyric_versions">;

interface GeneratedLyrics {
  title: string;
  lyrics: string;
  style: string;
  reasoning?: string;
}

interface LyricsPanelProps {
  conversationId?: string;
  songId?: string;
  className?: string;
  // Two-agent system props
  conversationPhase?: ConversationPhase;
  roundNumber?: number;
  readinessScore?: number;
  extractedContext?: ExtractedContext;
  latestLyrics?: GeneratedLyrics | null;
}

export function LyricsPanel({
  conversationId,
  songId,
  className = "",
  conversationPhase = "gathering",
  roundNumber = 0,
  readinessScore = 0,
  extractedContext,
  latestLyrics,
}: LyricsPanelProps) {
  const [expandedVersionId, setExpandedVersionId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showExtractedContext, setShowExtractedContext] = useState(true);

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

  // Gathering phase - show progress and extracted context
  if (conversationPhase === "gathering") {
    const MIN_ROUNDS = parseInt(process.env.NEXT_PUBLIC_MIN_CONVERSATION_ROUNDS || "6");

    return (
      <div className={`flex h-full flex-col ${className}`}>
        {/* Header */}
        <div className="border-b border-gray-200 bg-white px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 animate-pulse rounded-full bg-gradient-to-br from-pink-200 to-purple-200"></div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Inspiratie verzamelen...</h2>
              <p className="text-sm text-gray-500">
                Ronde {roundNumber}/{MIN_ROUNDS} • Gereedheid: {Math.round(readinessScore * 100)}%
              </p>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="bg-white px-6 py-3">
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-500"
              style={{ width: `${Math.min(100, (readinessScore * 100))}%` }}
            ></div>
          </div>
        </div>

        {/* Extracted context display */}
        <div className="flex-1 overflow-y-auto bg-gradient-to-b from-white to-pink-50 p-6">
          <div className="mx-auto max-w-2xl space-y-6">
            {/* Toggle button */}
            <button
              onClick={() => setShowExtractedContext(!showExtractedContext)}
              className="flex w-full items-center justify-between rounded-lg bg-white px-4 py-3 shadow-sm hover:shadow-md transition-shadow"
            >
              <span className="text-sm font-semibold text-gray-700">
                📝 Wat ik tot nu toe heb geleerd
              </span>
              <svg
                className={`h-5 w-5 text-gray-400 transition-transform ${
                  showExtractedContext ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showExtractedContext && extractedContext && (
              <div className="space-y-4">
                {/* Memories */}
                {extractedContext.memories.length > 0 && (
                  <div className="rounded-lg border border-pink-200 bg-white p-4">
                    <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-pink-700">
                      <span>💕</span> Herinneringen ({extractedContext.memories.length})
                    </h3>
                    <ul className="space-y-1">
                      {extractedContext.memories.map((memory, idx) => (
                        <li key={idx} className="text-sm text-gray-700">
                          • {memory}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Emotions */}
                {extractedContext.emotions.length > 0 && (
                  <div className="rounded-lg border border-purple-200 bg-white p-4">
                    <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-purple-700">
                      <span>💫</span> Emoties ({extractedContext.emotions.length})
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {extractedContext.emotions.map((emotion, idx) => (
                        <span
                          key={idx}
                          className="rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700"
                        >
                          {emotion}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Partner traits */}
                {extractedContext.partnerTraits.length > 0 && (
                  <div className="rounded-lg border border-blue-200 bg-white p-4">
                    <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-blue-700">
                      <span>✨</span> Eigenschappen ({extractedContext.partnerTraits.length})
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {extractedContext.partnerTraits.map((trait, idx) => (
                        <span
                          key={idx}
                          className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700"
                        >
                          {trait}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Music style */}
                {extractedContext.musicStyle && (
                  <div className="rounded-lg border border-green-200 bg-white p-4">
                    <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-green-700">
                      <span>🎵</span> Muziekstijl
                    </h3>
                    <p className="text-sm text-gray-700">{extractedContext.musicStyle}</p>
                  </div>
                )}

                {/* Special moments */}
                {extractedContext.specialMoments && extractedContext.specialMoments.length > 0 && (
                  <div className="rounded-lg border border-yellow-200 bg-white p-4">
                    <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-yellow-700">
                      <span>⭐</span> Bijzondere momenten ({extractedContext.specialMoments.length})
                    </h3>
                    <ul className="space-y-1">
                      {extractedContext.specialMoments.map((moment, idx) => (
                        <li key={idx} className="text-sm text-gray-700">
                          • {moment}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Empty state */}
            {(!extractedContext ||
              (extractedContext.memories.length === 0 &&
                extractedContext.emotions.length === 0 &&
                extractedContext.partnerTraits.length === 0)) && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">💭</div>
                <p className="text-gray-500 text-sm">
                  Vertel me over je geliefde en ik zal de details verzamelen...
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Generating phase - show loading
  if (conversationPhase === "generating") {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-pink-200 border-t-pink-600"></div>
          <h3 className="text-lg font-semibold text-gray-700">Lyrics worden gegenereerd...</h3>
          <p className="text-sm text-gray-500">
            De AI verwerkt je verhaal tot een persoonlijk liefdesliedje
          </p>
        </div>
      </div>
    );
  }

  // Refining or complete phase - show generated lyrics or lyric versions
  const displayLyrics = latestLyrics || (latestVersion ? parseLyricContent(latestVersion) : null);

  if (!displayLyrics && isLoading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-pink-200 border-t-pink-600"></div>
          <p className="text-sm text-gray-500">Lyrics laden...</p>
        </div>
      </div>
    );
  }

  if (!displayLyrics) {
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

  const olderVersions = versions.slice(1);

  return (
    <div className={`flex h-full flex-col ${className}`}>
      {/* Header with new version indicator */}
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              {displayLyrics?.title || "Liefdesliedje"}
            </h2>
            {latestVersion && <p className="text-sm text-gray-500">{latestVersion.label}</p>}
          </div>
          {hasNewVersion && (
            <div className="animate-pulse rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
              ✨ Nieuw bijgewerkt
            </div>
          )}
        </div>

        {/* Style tag */}
        {displayLyrics?.style && (
          <div className="mt-3">
            <span className="inline-block rounded-full bg-pink-100 px-3 py-1 text-xs font-medium text-pink-700">
              {displayLyrics.style}
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

          {/* Lyrics text with section formatting */}
          <div className="whitespace-pre-wrap font-serif text-lg leading-relaxed text-gray-800">
            {displayLyrics?.lyrics?.split('\n').map((line, idx) => {
              // Highlight section markers like [Couplet 1], [Refrein], [Bridge]
              if (line.match(/^\[.*\]$/)) {
                return (
                  <div key={idx} className="my-4 font-sans text-sm font-bold uppercase tracking-wide text-pink-600">
                    {line}
                  </div>
                );
              }
              return <div key={idx}>{line || <br />}</div>;
            })}
          </div>

          {/* Reasoning (if any) */}
          {displayLyrics?.reasoning && (
            <div className="mt-6 rounded-lg border-l-4 border-blue-400 bg-blue-50 p-4">
              <p className="text-sm font-medium text-blue-900">Toelichting:</p>
              <p className="mt-1 text-sm text-blue-700">{displayLyrics.reasoning}</p>
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
                          {versionData?.reasoning && (
                            <div className="mt-3 text-xs italic text-gray-600">
                              {versionData.reasoning}
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
