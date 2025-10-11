type LyricsTaskStatus = 'generating' | 'complete' | 'failed';

interface LyricsTaskEntry {
  status: LyricsTaskStatus;
  lyrics?: string[];
  error?: string;
  updatedAt: number;
}

const LYRICS_TASK_CACHE = new Map<string, LyricsTaskEntry>();

export function setLyricsTaskGenerating(taskId: string) {
  if (!taskId) return;
  LYRICS_TASK_CACHE.set(taskId, {
    status: 'generating',
    updatedAt: Date.now(),
  });
}

export function setLyricsTaskComplete(taskId: string, lyrics: string[]) {
  if (!taskId) return;
  LYRICS_TASK_CACHE.set(taskId, {
    status: 'complete',
    lyrics,
    updatedAt: Date.now(),
  });
}

export function setLyricsTaskFailed(taskId: string, error: string) {
  if (!taskId) return;
  LYRICS_TASK_CACHE.set(taskId, {
    status: 'failed',
    error,
    updatedAt: Date.now(),
  });
}

export function getLyricsTask(taskId: string): LyricsTaskEntry | undefined {
  if (!taskId) return undefined;
  return LYRICS_TASK_CACHE.get(taskId);
}

// Optional: simple cleanup to avoid unbounded growth (called opportunistically)
export function pruneLyricsCache(maxAgeMs: number = 1000 * 60 * 30) {
  const threshold = Date.now() - maxAgeMs;
  for (const [taskId, entry] of LYRICS_TASK_CACHE.entries()) {
    if (entry.updatedAt < threshold) {
      LYRICS_TASK_CACHE.delete(taskId);
    }
  }
}

export function resetLyricsCache() {
  LYRICS_TASK_CACHE.clear();
}
