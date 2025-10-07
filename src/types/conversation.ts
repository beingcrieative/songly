/**
 * Types for the two-agent conversation system
 */

/**
 * Extracted context from conversation with the conversation agent.
 * This structure is stored as JSON string in the conversation entity's extractedContext field.
 */
export interface ExtractedContext {
  /** Specific memories shared during conversation */
  memories: string[];

  /** Emotional themes identified (e.g., warmth, longing, joy, gratitude) */
  emotions: string[];

  /** Characteristics and traits of the partner */
  partnerTraits: string[];

  /** Duration of relationship if mentioned */
  relationshipLength?: string;

  /** Preferred music style or mood (e.g., acoustic ballad, upbeat pop) */
  musicStyle?: string;

  /** Special moments like birthdays, anniversaries, milestones */
  specialMoments?: string[];
}

/**
 * Conversation phase tracking
 */
export type ConversationPhase = 'gathering' | 'generating' | 'refining' | 'complete';

/**
 * Conversation agent API response
 */
export interface ConversationAgentResponse {
  type: 'conversation';
  message: string;
  roundNumber: number;
  readinessScore: number; // 0-1 scale
  extractedContext: ExtractedContext;
}

/**
 * Lyrics generation agent API response
 */
export interface LyricsGenerationResponse {
  type: 'lyrics_generated';
  title: string;
  lyrics: string;
  style: string;
  reasoning: string;
}

/**
 * User preferences for lyrics generation
 */
export interface UserPreferences {
  tempo?: 'slow' | 'medium' | 'upbeat';
  instrumentation?: 'acoustic' | 'electronic' | 'orchestral';
}
