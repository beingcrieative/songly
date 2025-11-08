import { useMemo } from "react";

interface ActionItem {
  id: string;
  type: "song" | "conversation";
  title: string;
  status: string;
  imageUrl?: string;
  updatedAt?: number;
  [key: string]: any;
}

export function useActionItems(
  songs: any[] = [],
  conversations: any[] = []
): { actionItems: ActionItem[]; hasActions: boolean; isLoading: boolean } {
  const actionItems = useMemo(() => {
    const items: ActionItem[] = [];

    // Add songs that need action (lyrics_ready or failed)
    const actionSongs = songs.filter(
      (s) => s.status === "lyrics_ready" || s.status === "failed"
    );

    actionSongs.forEach((song) => {
      items.push({
        id: song.id,
        type: "song",
        title: song.title || "Untitled Song",
        status: song.status,
        imageUrl: song.imageUrl,
        updatedAt: song.updatedAt,
        ...song,
      });
    });

    // Sort by priority: lyrics_ready first, then failed
    // Then by updatedAt (most recent first)
    items.sort((a, b) => {
      const statusPriority = {
        lyrics_ready: 0,
        failed: 1,
      };
      const aPriority = statusPriority[a.status as keyof typeof statusPriority] ?? 2;
      const bPriority = statusPriority[b.status as keyof typeof statusPriority] ?? 2;

      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }

      // Tie-break by updatedAt (most recent first)
      return (b.updatedAt || 0) - (a.updatedAt || 0);
    });

    return items;
  }, [songs, conversations]);

  return {
    actionItems,
    hasActions: actionItems.length > 0,
    isLoading: false,
  };
}