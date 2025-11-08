import { useMemo } from "react";

interface RecentItem {
  id: string;
  type: "song" | "conversation";
  title: string;
  status: string;
  imageUrl?: string;
  updatedAt?: number;
  [key: string]: any;
}

export function useRecentActivity(
  songs: any[] = [],
  conversations: any[] = []
): { recentItems: RecentItem[]; isLoading: boolean } {
  const recentItems = useMemo(() => {
    const items: RecentItem[] = [];

    // Add songs
    songs.forEach((song) => {
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

    // Add conversations
    conversations.forEach((conv) => {
      items.push({
        id: conv.id,
        type: "conversation",
        title: conv.conceptTitle || "Untitled Conversation",
        status: conv.conversationPhase,
        imageUrl: conv.imageUrl,
        updatedAt: conv.updatedAt,
        ...conv,
      });
    });

    // Sort by updatedAt (most recent first)
    items.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

    // Return top 5
    return items.slice(0, 5);
  }, [songs, conversations]);

  return {
    recentItems,
    isLoading: false,
  };
}