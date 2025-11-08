import { useMemo } from "react";

interface LibraryStats {
  totalSongs: number;
  totalConversations: number;
  generating: number;
  isLoading: boolean;
}

export function useLibraryStats(
  songs: any[] = [],
  conversations: any[] = [],
  isLoading: boolean = false
): LibraryStats {
  const stats = useMemo(() => {
    const totalSongs = songs.length;
    const totalConversations = conversations.length;
    const generating = songs.filter(
      (s) => s.status === "generating_lyrics" || s.status === "generating_music"
    ).length;

    return {
      totalSongs,
      totalConversations,
      generating,
      isLoading,
    };
  }, [songs, conversations, isLoading]);

  return stats;
}