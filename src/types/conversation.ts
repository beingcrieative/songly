/**
 * Types for the two-agent conversation system
 */

/**
 * Vocal preferences for song generation
 * Used across ExtractedContext (AI-detected) and UserPreferences (user-selected)
 */
export interface VocalPreferences {
  /**
   * Preferred song language
   * Examples: "Nederlands", "English", "Français", "Español"
   */
  language?: string;

  /**
   * Preferred voice gender
   * - 'male': Male voice
   * - 'female': Female voice
   * - 'neutral': No preference, let AI decide
   */
  vocalGender?: 'male' | 'female' | 'neutral';

  /**
   * Preferred voice age/tone category
   * - 'young': Young & bright voice (20-30 years)
   * - 'mature': Mature & warm voice (30-40 years)
   * - 'deep': Deep & soulful voice (40+ years)
   */
  vocalAge?: 'young' | 'mature' | 'deep';

  /**
   * Freeform description of desired vocal characteristics
   * Examples: "soulful", "powerful", "warm", "raspy", "smooth", "energetic"
   */
  vocalDescription?: string;
}

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

  /**
   * Preferred song language detected from conversation or explicitly specified
   * Examples: "Nederlands", "English", "Français", "Español"
   */
  language?: string;

  /**
   * Preferred voice gender for the song
   * - 'male': Male voice
   * - 'female': Female voice
   * - 'neutral': No preference, let AI decide
   */
  vocalGender?: 'male' | 'female' | 'neutral';

  /**
   * Preferred voice age/tone category
   * - 'young': Young & bright voice (20-30 years)
   * - 'mature': Mature & warm voice (30-40 years)
   * - 'deep': Deep & soulful voice (40+ years)
   */
  vocalAge?: 'young' | 'mature' | 'deep';

  /**
   * Freeform description of desired vocal characteristics
   * Examples: "soulful", "powerful", "warm", "raspy", "smooth", "energetic"
   */
  vocalDescription?: string;
}

/**
 * Conversation phase tracking
 */
export type ConversationPhase = 'gathering' | 'generating' | 'refining' | 'complete';

/**
 * Concept lyrics generated during conversation
 */
export interface ConceptLyrics {
  version: number;
  title: string;
  lyrics: string;
  style: string;
  notes?: string;
}

/**
 * Conversation agent API response
 */
export interface ConversationAgentResponse {
  type: 'conversation';
  message: string;
  roundNumber: number;
  readinessScore: number; // 0-1 scale
  extractedContext: ExtractedContext;
  conceptLyrics?: ConceptLyrics | null;  // Progressive concept lyrics updated each round
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
  /** Optional mood tags influencing lyrics and style */
  mood?: string[];
  /** Generate instrumental-only track */
  makeInstrumental?: boolean;

  /**
   * Explicitly selected song language
   * Examples: "Nederlands", "English", "Français", "Español"
   */
  language?: string;

  /**
   * Explicitly selected voice gender
   * - 'male': Male voice
   * - 'female': Female voice
   * - 'neutral': No preference, let AI decide
   */
  vocalGender?: 'male' | 'female' | 'neutral';

  /**
   * Explicitly selected voice age/tone category
   * - 'young': Young & bright voice (20-30 years)
   * - 'mature': Mature & warm voice (30-40 years)
   * - 'deep': Deep & soulful voice (40+ years)
   */
  vocalAge?: 'young' | 'mature' | 'deep';

  /**
   * Explicitly provided vocal characteristics description
   * Examples: "soulful", "powerful", "warm", "raspy", "smooth", "energetic"
   */
  vocalDescription?: string;
}
