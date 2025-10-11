/**
 * Suno Lyrics Prompt Builder
 *
 * Builds optimized prompts for Suno's lyrics generation API.
 * Part of Task 3.0: Implement Suno Lyrics Generation API
 */

import { ExtractedContext } from "@/types/conversation";
import { MusicTemplate } from "@/templates/music-templates";

/**
 * Build a Suno-optimized lyrics generation prompt
 *
 * Task 3.1, 3.2, 3.3: Format prompt with memories, emotions, partner traits, and music style
 *
 * @param context - Extracted conversation context
 * @param template - Selected music template
 * @param language - Target language (default: Nederlands)
 * @returns Formatted prompt for Suno lyrics API
 */
export function buildSunoLyricsPrompt(
  context: ExtractedContext,
  template: MusicTemplate,
  language: string = 'Nederlands'
): string {
  const { memories, emotions, partnerTraits } = context;

  // Handle "Verras Me" template differently (more open-ended)
  if (template.id === 'surprise-me') {
    return buildSurpriseModePrompt(context, language);
  }

  // Build structured prompt for regular templates
  const sections: string[] = [];

  // Header
  sections.push(`Schrijf lyrics voor een ${template.name.toLowerCase()} liefdesliedje in het ${language}.`);
  sections.push('');

  // Context section
  sections.push('**Context:**');

  if (context.partnerName) {
    sections.push(`- Voor: ${context.partnerName}`);
  }

  if (memories.length > 0) {
    // Limit to top 5 most relevant memories
    const topMemories = memories.slice(0, 5);
    sections.push(`- Herinneringen: ${topMemories.join(', ')}`);
  }

  if (emotions.length > 0) {
    sections.push(`- Emoties: ${emotions.join(', ')}`);
  }

  if (partnerTraits.length > 0) {
    // Limit to top 5 traits
    const topTraits = partnerTraits.slice(0, 5);
    sections.push(`- Eigenschappen: ${topTraits.join(', ')}`);
  }

  sections.push('');

  // Musical style section
  sections.push('**Muzikale Stijl:**');
  sections.push(template.sunoConfig.style);
  sections.push('');

  sections.push('**Genres/Tags:**');
  sections.push(template.sunoConfig.tags);
  sections.push('');

  // Instructions
  sections.push('**Instructies:**');
  sections.push(`- Schrijf complete lyrics met duidelijke verse/chorus/bridge structuur`);
  sections.push(`- Gebruik de herinneringen en emoties op een natuurlijke, authentieke manier`);
  sections.push(`- Houd de taal ${language === 'Nederlands' ? 'Nederlands' : language}`);
  sections.push(`- Maak de tekst muzikaal (rijm, ritme, herhaling)`);
  sections.push(`- Vermijd clichés, wees origineel en persoonlijk`);
  sections.push(`- Lengte: ongeveer 200-300 woorden`);
  sections.push('');

  sections.push('Genereer de lyrics nu:');

  return sections.join('\n');
}

/**
 * Build prompt for "Verras Me" mode (open-ended, creative)
 */
function buildSurpriseModePrompt(
  context: ExtractedContext,
  language: string
): string {
  const { memories, emotions, partnerTraits } = context;

  const sections: string[] = [];

  sections.push(`Schrijf een verrassend en uniek liefdesliedje in het ${language}.`);
  sections.push('');

  sections.push('**Inspiratie:**');

  if (memories.length > 0) {
    sections.push(`Herinneringen: ${memories.slice(0, 3).join(', ')}`);
  }

  if (emotions.length > 0) {
    sections.push(`Emoties: ${emotions.slice(0, 3).join(', ')}`);
  }

  sections.push('');

  sections.push('**Creatieve vrijheid:**');
  sections.push('- Kies je eigen muziekstijl en genre');
  sections.push('- Experimenteer met structuur en ritme');
  sections.push('- Wees origineel en verrassend');
  sections.push('- Maak het persoonlijk en emotioneel');
  sections.push('');

  sections.push('Laat je creativiteit de vrije loop en schrijf een mooi liefdesliedje:');

  return sections.join('\n');
}

/**
 * Build refinement prompt for existing lyrics
 *
 * Used when user provides feedback to improve lyrics
 *
 * @param previousLyrics - The lyrics to refine
 * @param feedback - User's feedback/instructions
 * @param context - Original conversation context
 * @param template - Selected template
 * @returns Refinement prompt for Suno
 */
export function buildLyricsRefinementPrompt(
  previousLyrics: string,
  feedback: string,
  context: ExtractedContext,
  template: MusicTemplate
): string {
  const sections: string[] = [];

  sections.push(`Verbeter de volgende lyrics op basis van de feedback van de gebruiker.`);
  sections.push('');

  sections.push('**Huidige Lyrics:**');
  sections.push('```');
  sections.push(previousLyrics);
  sections.push('```');
  sections.push('');

  sections.push('**Feedback van gebruiker:**');
  sections.push(feedback);
  sections.push('');

  sections.push('**Muzikale stijl (behouden):**');
  sections.push(template.sunoConfig.style);
  sections.push('');

  sections.push('**Instructies:**');
  sections.push('- Verwerk de feedback van de gebruiker');
  sections.push('- Behoud de goede elementen van de originele lyrics');
  sections.push('- Blijf binnen dezelfde muzikale stijl');
  sections.push('- Zorg dat de lyrics nog steeds persoonlijk en emotioneel zijn');
  sections.push('');

  sections.push('Genereer de verbeterde lyrics:');

  return sections.join('\n');
}

/**
 * Validate prompt length against Suno limits
 *
 * Suno API limits:
 * - V3_5/V4: ≤ 3000 characters
 * - V4_5/V4_5PLUS/V5: ≤ 5000 characters
 *
 * @param prompt - Generated prompt
 * @param model - Suno model version
 * @returns true if within limits, false otherwise
 */
export function validatePromptLength(
  prompt: string,
  model: 'V3_5' | 'V4' | 'V4_5' | 'V4_5PLUS' | 'V5'
): boolean {
  const maxLength = ['V4_5', 'V4_5PLUS', 'V5'].includes(model) ? 5000 : 3000;
  return prompt.length <= maxLength;
}

/**
 * Truncate prompt to fit within Suno limits
 *
 * @param prompt - Prompt to truncate
 * @param model - Suno model version
 * @returns Truncated prompt
 */
export function truncatePrompt(
  prompt: string,
  model: 'V3_5' | 'V4' | 'V4_5' | 'V4_5PLUS' | 'V5'
): string {
  const maxLength = ['V4_5', 'V4_5PLUS', 'V5'].includes(model) ? 5000 : 3000;

  if (prompt.length <= maxLength) {
    return prompt;
  }

  // Truncate and add ellipsis
  return prompt.substring(0, maxLength - 20) + '\n\n[Prompt truncated]';
}
