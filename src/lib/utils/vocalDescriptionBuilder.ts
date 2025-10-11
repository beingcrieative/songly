import { VocalPreferences } from '@/types/conversation';

/**
 * Builds a natural language vocal description for Suno API prompts.
 * Constructs a description like: "Sung in English by a mature female voice with a warm, soulful tone"
 *
 * @param preferences - Vocal preferences from conversation or user input
 * @returns Natural language description string
 */
export function buildVocalDescription(preferences: VocalPreferences): string {
  const parts: string[] = [];

  // Language part
  if (preferences.language) {
    parts.push(`Sung in ${preferences.language}`);
  }

  // Voice characteristics part
  const voiceParts: string[] = [];

  if (preferences.vocalAge) {
    const ageDescriptions = {
      young: 'young',
      mature: 'mature',
      deep: 'deep and soulful',
    };
    voiceParts.push(ageDescriptions[preferences.vocalAge]);
  }

  if (preferences.vocalGender && preferences.vocalGender !== 'neutral') {
    voiceParts.push(preferences.vocalGender);
  }

  if (voiceParts.length > 0) {
    const voiceDesc = voiceParts.join(' ');
    parts.push(`by a ${voiceDesc} voice`);
  }

  // Additional vocal description
  if (preferences.vocalDescription) {
    parts.push(`with a ${preferences.vocalDescription} tone`);
  }

  // Join all parts into a complete sentence
  if (parts.length === 0) {
    return ''; // No preferences specified
  }

  return parts.join(' ');
}

/**
 * Builds an array of tags for Suno API based on vocal preferences.
 * Used to enhance the 'tags' parameter in Suno generation requests.
 *
 * @param preferences - Vocal preferences from conversation or user input
 * @returns Array of tag strings
 */
export function buildVocalTags(preferences: VocalPreferences): string[] {
  const tags: string[] = [];

  // Language tag
  if (preferences.language) {
    tags.push(preferences.language);
  }

  // Gender tag
  if (preferences.vocalGender && preferences.vocalGender !== 'neutral') {
    tags.push(`${preferences.vocalGender} vocals`);
  }

  // Age/tone tags
  if (preferences.vocalAge) {
    const ageTags = {
      young: 'young voice',
      mature: 'mature voice',
      deep: 'deep voice',
    };
    tags.push(ageTags[preferences.vocalAge]);
  }

  // Descriptive tags (split by common separators)
  if (preferences.vocalDescription) {
    const descriptors = preferences.vocalDescription
      .split(/[,;]/)
      .map((s) => s.trim())
      .filter(Boolean);
    tags.push(...descriptors);
  }

  return tags;
}

/**
 * Merges conversation-level and song-level vocal preferences.
 * Song-level preferences take precedence over conversation-level defaults.
 *
 * @param conversationPrefs - Default preferences from conversation context
 * @param songPrefs - Song-specific preference overrides
 * @returns Merged vocal preferences
 */
export function mergeVocalPreferences(
  conversationPrefs?: VocalPreferences,
  songPrefs?: VocalPreferences
): VocalPreferences {
  if (!conversationPrefs && !songPrefs) {
    return {};
  }

  if (!conversationPrefs) {
    return songPrefs || {};
  }

  if (!songPrefs) {
    return conversationPrefs;
  }

  return {
    language: songPrefs.language ?? conversationPrefs.language,
    vocalGender: songPrefs.vocalGender ?? conversationPrefs.vocalGender,
    vocalAge: songPrefs.vocalAge ?? conversationPrefs.vocalAge,
    vocalDescription: songPrefs.vocalDescription ?? conversationPrefs.vocalDescription,
  };
}
