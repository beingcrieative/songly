import type { ConceptLyrics } from "@/types/conversation";

/**
 * Create a short snippet from a larger lyrics or text body.
 */
export function createSnippet(text: string | null | undefined, maxLength = 200): string {
  if (!text) return "";
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1)}…`;
}

/**
 * Normalize concept lyrics for storage in Instant.
 */
export function serializeConceptForStorage(
  nextConcept: ConceptLyrics | null,
  history: ConceptLyrics[]
) {
  if (!nextConcept) {
    return {
      conceptTitle: null,
      conceptLyrics: null,
      conceptHistory: history.length ? JSON.stringify(history) : null,
    };
  }

  const dedupedHistory = dedupeConceptHistory([...history, nextConcept]);

  return {
    conceptTitle: nextConcept.title?.trim() || `Concept v${nextConcept.version}`,
    conceptLyrics: JSON.stringify(nextConcept),
    conceptHistory: JSON.stringify(dedupedHistory),
  };
}

/**
 * Ensure concept history only keeps the last entry per version.
 */
function dedupeConceptHistory(entries: ConceptLyrics[]): ConceptLyrics[] {
  const map = new Map<number, ConceptLyrics>();
  entries.forEach((entry) => {
    map.set(entry.version, entry);
  });
  return Array.from(map.values()).sort((a, b) => a.version - b.version);
}
