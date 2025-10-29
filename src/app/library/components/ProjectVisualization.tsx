"use client";

import { useMemo } from "react";
import { MessageCircle, Music, ArrowRight } from "lucide-react";

interface ConversationNode {
  id: string;
  title?: string | null;
  messageCount: number;
}

interface SongNode {
  id: string;
  title?: string | null;
  status?: string | null;
}

interface ProjectVisualizationProps {
  conversations: ConversationNode[];
  songs: SongNode[];
  links?: Array<{ conversationId: string; songId: string }>;
  compact?: boolean;
}

/**
 * ProjectVisualization Component
 * Visualizes the relationship between conversations and songs in a project
 * Shows the flow from conversation to song creation
 */
export function ProjectVisualization({
  conversations,
  songs,
  links = [],
  compact = false,
}: ProjectVisualizationProps) {
  const stats = useMemo(() => {
    return {
      conversationCount: conversations.length,
      songCount: songs.length,
      linkedCount: links.length,
      totalMessages: conversations.reduce((sum, c) => sum + c.messageCount, 0),
    };
  }, [conversations, songs, links]);

  if (compact) {
    return (
      <div className="flex items-center gap-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-blue-600" />
          <div className="text-sm">
            <div className="font-semibold text-slate-900">{stats.conversationCount}</div>
            <div className="text-xs text-slate-600">Conversations</div>
          </div>
        </div>

        <ArrowRight className="h-4 w-4 text-slate-400" />

        <div className="flex items-center gap-2">
          <Music className="h-5 w-5 text-emerald-600" />
          <div className="text-sm">
            <div className="font-semibold text-slate-900">{stats.songCount}</div>
            <div className="text-xs text-slate-600">Songs</div>
          </div>
        </div>

        {stats.linkedCount > 0 && (
          <>
            <div className="border-l border-slate-300" />
            <div className="text-xs text-slate-600">
              <span className="font-semibold text-slate-900">{stats.linkedCount}</span> linked
            </div>
          </>
        )}
      </div>
    );
  }

  // Full visualization
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6">
      <h3 className="text-lg font-bold text-slate-900">Project Overview</h3>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg bg-blue-50 px-4 py-3">
          <div className="flex items-center gap-2 mb-1">
            <MessageCircle className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-semibold text-slate-900">
              {stats.conversationCount}
            </span>
          </div>
          <div className="text-xs text-slate-600">Conversations</div>
          <div className="text-xs text-slate-500 mt-1">
            {stats.totalMessages} messages
          </div>
        </div>

        <div className="flex items-center justify-center">
          <div className="text-2xl">→</div>
        </div>

        <div className="rounded-lg bg-emerald-50 px-4 py-3">
          <div className="flex items-center gap-2 mb-1">
            <Music className="h-5 w-5 text-emerald-600" />
            <span className="text-sm font-semibold text-slate-900">
              {stats.songCount}
            </span>
          </div>
          <div className="text-xs text-slate-600">Songs</div>
          <div className="text-xs text-slate-500 mt-1">
            {stats.linkedCount} linked conversations
          </div>
        </div>
      </div>

      {/* Link visualization */}
      {stats.linkedCount > 0 && (
        <div className="border-t border-slate-200 pt-4">
          <h4 className="text-sm font-semibold text-slate-900 mb-3">Connections</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {links.map((link) => {
              const conv = conversations.find((c) => c.id === link.conversationId);
              const song = songs.find((s) => s.id === link.songId);

              if (!conv || !song) return null;

              return (
                <div
                  key={`${link.conversationId}-${link.songId}`}
                  className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm"
                >
                  <MessageCircle className="h-4 w-4 text-blue-500 flex-shrink-0" />
                  <span className="truncate text-slate-700">
                    {conv.title || "Untitled conversation"}
                  </span>
                  <ArrowRight className="h-3 w-3 text-slate-400 flex-shrink-0" />
                  <Music className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                  <span className="truncate text-slate-700">
                    {song.title || "Untitled song"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {conversations.length === 0 && songs.length === 0 && (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">📊</div>
          <p className="text-sm text-slate-600">
            No conversations or songs yet in this project
          </p>
        </div>
      )}
    </div>
  );
}

export default ProjectVisualization;
