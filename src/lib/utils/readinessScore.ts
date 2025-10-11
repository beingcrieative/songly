import { ExtractedContext } from '@/types/conversation';

/**
 * Readiness Score Calculation
 *
 * Calculates a score from 0-1 indicating how ready the conversation is
 * for lyrics generation based on the quality and quantity of extracted context.
 */

export interface ReadinessScoreBreakdown {
  memoriesScore: number;
  emotionsScore: number;
  traitsScore: number;
  musicStyleScore: number;
  specificityScore: number;
  totalScore: number;
}

/**
 * Calculates readiness score based on extracted context and conversation depth.
 *
 * @param context - Extracted context from conversation
 * @param messages - Full conversation history
 * @returns ReadinessScoreBreakdown with individual component scores and total
 */
export function calculateReadinessScore(
  context: ExtractedContext,
  messages: Array<{ role: string; content: string }>
): ReadinessScoreBreakdown {
  // 1. Memories Score (0-0.30)
  // Based on number of distinct memories shared
  const memoriesScore = calculateMemoriesScore(context.memories);

  // 2. Emotions Score (0-0.25)
  // Based on variety and depth of emotional themes
  const emotionsScore = calculateEmotionsScore(context.emotions);

  // 3. Traits Score (0-0.20)
  // Based on number of partner characteristics identified
  const traitsScore = calculateTraitsScore(context.partnerTraits);

  // 4. Music Style Score (0-0.15)
  // Based on clarity of music style preference
  const musicStyleScore = calculateMusicStyleScore(context.musicStyle);

  // 5. Specificity Score (0-0.10)
  // Based on detail level in user messages
  const specificityScore = calculateSpecificityScore(messages);

  // Total score (0-1.0)
  const totalScore = Math.min(
    1.0,
    memoriesScore + emotionsScore + traitsScore + musicStyleScore + specificityScore
  );

  return {
    memoriesScore,
    emotionsScore,
    traitsScore,
    musicStyleScore,
    specificityScore,
    totalScore,
  };
}

/**
 * Memories Score: 0-0.30
 * - 0 memories: 0.00
 * - 1 memory: 0.10
 * - 2 memories: 0.20
 * - 3+ memories: 0.30 (max)
 */
function calculateMemoriesScore(memories: string[]): number {
  const count = memories.length;
  if (count === 0) return 0.0;
  if (count === 1) return 0.10;
  if (count === 2) return 0.20;
  return 0.30; // 3 or more
}

/**
 * Emotions Score: 0-0.25
 * - 0 emotions: 0.00
 * - 1 emotion: 0.10
 * - 2 emotions: 0.18
 * - 3+ emotions: 0.25 (max)
 */
function calculateEmotionsScore(emotions: string[]): number {
  const count = emotions.length;
  if (count === 0) return 0.0;
  if (count === 1) return 0.10;
  if (count === 2) return 0.18;
  return 0.25; // 3 or more
}

/**
 * Traits Score: 0-0.20
 * - 0 traits: 0.00
 * - 1 trait: 0.08
 * - 2 traits: 0.15
 * - 3+ traits: 0.20 (max)
 */
function calculateTraitsScore(traits: string[]): number {
  const count = traits.length;
  if (count === 0) return 0.0;
  if (count === 1) return 0.08;
  if (count === 2) return 0.15;
  return 0.20; // 3 or more
}

/**
 * Music Style Score: 0-0.15
 * - No style: 0.00
 * - Style mentioned: 0.15
 */
function calculateMusicStyleScore(musicStyle: string | undefined): number {
  if (!musicStyle || musicStyle.trim().length === 0) {
    return 0.0;
  }
  return 0.15;
}

/**
 * Specificity Score: 0-0.10
 * Based on average length and detail of user messages.
 * Longer, more detailed messages indicate richer content.
 */
function calculateSpecificityScore(messages: Array<{ role: string; content: string }>): number {
  const userMessages = messages.filter((m) => m.role === 'user');

  if (userMessages.length === 0) {
    return 0.0;
  }

  // Calculate average word count of user messages
  const totalWords = userMessages.reduce((sum, m) => {
    const wordCount = m.content.trim().split(/\s+/).length;
    return sum + wordCount;
  }, 0);

  const avgWordCount = totalWords / userMessages.length;

  // Scoring:
  // < 5 words avg: 0.00 (very brief)
  // 5-10 words avg: 0.03
  // 10-20 words avg: 0.07
  // 20+ words avg: 0.10 (detailed)
  if (avgWordCount < 5) return 0.0;
  if (avgWordCount < 10) return 0.03;
  if (avgWordCount < 20) return 0.07;
  return 0.10;
}

/**
 * Helper function to determine if conversation is ready for lyrics generation.
 *
 * @param score - Total readiness score (0-1)
 * @param roundNumber - Current conversation round
 * @param minRounds - Minimum required rounds (from env)
 * @returns boolean - true if ready to generate lyrics
 */
export function isReadyForLyrics(
  score: number,
  roundNumber: number,
  minRounds: number = 6
): boolean {
  // Must meet minimum rounds AND have perfect score (100%)
  return roundNumber >= minRounds && score >= 1.0;
}

/**
 * Get human-readable feedback about what's missing for readiness.
 *
 * @param breakdown - Readiness score breakdown
 * @returns string - Feedback message
 */
export function getReadinessFeedback(breakdown: ReadinessScoreBreakdown): string {
  const suggestions: string[] = [];

  if (breakdown.memoriesScore < 0.20) {
    suggestions.push('Deel meer specifieke herinneringen en momenten');
  }

  if (breakdown.emotionsScore < 0.18) {
    suggestions.push('Beschrijf de emoties en gevoelens dieper');
  }

  if (breakdown.traitsScore < 0.15) {
    suggestions.push('Vertel meer over de eigenschappen van je partner');
  }

  if (breakdown.musicStyleScore === 0) {
    suggestions.push('Geef aan welke muziekstijl je voor ogen hebt');
  }

  if (breakdown.specificityScore < 0.07) {
    suggestions.push('Geef meer details in je antwoorden');
  }

  if (suggestions.length === 0) {
    return 'De conversatie bevat genoeg informatie voor een mooi liefdesliedje!';
  }

  return `Nog wat informatie nodig: ${suggestions.join(', ')}`;
}
