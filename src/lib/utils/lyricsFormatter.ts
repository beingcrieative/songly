/**
 * Utilities for parsing and formatting lyrics from JSON or plain text
 */

export interface ParsedLyrics {
  title: string;
  lyrics: string;
  style: string;
}

/**
 * Safely parses lyrics from JSON string format.
 * Handles both plain JSON and JSON wrapped in markdown code blocks.
 *
 * @param jsonString - JSON string containing lyrics data
 * @returns Parsed lyrics object or null on failure
 */
export function parseLyricsJSON(jsonString: string): ParsedLyrics | null {
  if (!jsonString || typeof jsonString !== 'string') {
    return null;
  }

  try {
    // First, try to extract JSON from markdown code blocks
    // Pattern: ```json\n{...}\n``` or ```{...}```
    const codeBlockMatch = jsonString.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    let jsonToParse = codeBlockMatch ? codeBlockMatch[1] : jsonString;

    // Also handle case where JSON is just wrapped in backticks without newlines
    if (jsonToParse.startsWith('`') && jsonToParse.endsWith('`')) {
      jsonToParse = jsonToParse.slice(1, -1);
    }

    // Try to parse the JSON
    const parsed = JSON.parse(jsonToParse.trim());

    // Validate that we have the expected structure
    if (typeof parsed === 'object' && parsed !== null) {
      return {
        title: parsed.title || parsed.Title || 'Untitled',
        lyrics: parsed.lyrics || parsed.Lyrics || parsed.text || '',
        style: parsed.style || parsed.Style || parsed.musicStyle || parsed.genre || '',
      };
    }

    return null;
  } catch (error) {
    // If JSON parsing fails, return null
    console.debug('Failed to parse lyrics JSON:', error);
    return null;
  }
}

/**
 * Formats lyrics text for display with proper line breaks and styled section labels.
 * Preserves line breaks and makes section labels (e.g., [Verse 1], [Chorus]) bold.
 *
 * @param lyrics - Raw lyrics text
 * @returns Formatted lyrics with HTML-safe structure
 */
export function formatLyricsText(lyrics: string): string {
  if (!lyrics) {
    return '';
  }

  // Split by lines and process each one
  const lines = lyrics.split('\n');
  const formattedLines = lines.map((line) => {
    // Check if line is a section label like [Verse 1], [Chorus], [Bridge], etc.
    const sectionLabelMatch = line.match(/^\[(.*?)\]$/);

    if (sectionLabelMatch) {
      // Return the line with a marker for bold formatting
      return `__BOLD_START__${line}__BOLD_END__`;
    }

    return line;
  });

  return formattedLines.join('\n');
}

/**
 * Checks if a string contains JSON-formatted lyrics.
 * Useful for determining whether to parse or display as plain text.
 *
 * @param text - Text to check
 * @returns True if text appears to be JSON
 */
export function isLyricsJSON(text: string): boolean {
  if (!text || typeof text !== 'string') {
    return false;
  }

  const trimmed = text.trim();

  // Check if it starts with { or contains JSON-like structure
  if (trimmed.startsWith('{')) {
    return true;
  }

  // Check if it's wrapped in code blocks
  if (trimmed.match(/```(?:json)?\s*\{[\s\S]*?\}\s*```/)) {
    return true;
  }

  // Check if it contains JSON properties like "title", "lyrics", "style"
  if (
    trimmed.includes('"title"') ||
    trimmed.includes('"lyrics"') ||
    trimmed.includes('"style"')
  ) {
    return true;
  }

  return false;
}

/**
 * Attempts to extract plain text lyrics from various formats.
 * Falls back gracefully if parsing fails.
 *
 * @param lyricsData - Lyrics in any format (JSON string, plain text, or object)
 * @returns Plain text lyrics
 */
export function extractLyricsText(lyricsData: string | ParsedLyrics | null): string {
  if (!lyricsData) {
    return '';
  }

  // If already an object, return lyrics field
  if (typeof lyricsData === 'object' && 'lyrics' in lyricsData) {
    return lyricsData.lyrics || '';
  }

  // If string, try to parse as JSON first
  if (typeof lyricsData === 'string') {
    if (isLyricsJSON(lyricsData)) {
      const parsed = parseLyricsJSON(lyricsData);
      if (parsed) {
        return parsed.lyrics;
      }
    }

    // Return as plain text
    return lyricsData;
  }

  return '';
}
