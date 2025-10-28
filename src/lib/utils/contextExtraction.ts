import { ExtractedContext } from '@/types/conversation';
import { openrouterChatCompletion } from '@/lib/utils/openrouterClient';

const EXTRACTION_MODEL =
  process.env.OPENROUTER_EXTRACTION_MODEL ||
  process.env.OPENROUTER_MODEL ||
  'openai/gpt-oss-20b:free';

/**
 * Context extraction utility for analyzing conversation history
 * and extracting structured information for song generation.
 */

/**
 * Extracts structured context from conversation history using AI.
 * Calls OpenRouter to analyze the conversation and identify key themes.
 *
 * @param messages - Array of conversation messages
 * @param openRouterApiKey - OpenRouter API key
 * @returns Promise<ExtractedContext> - Structured context object
 */
export async function extractContextFromConversation(
  messages: Array<{ role: string; content: string }>,
  openRouterApiKey: string
): Promise<ExtractedContext> {
  const EXTRACTION_PROMPT = `Analyseer het volgende gesprek over een relatie en extraheer gestructureerde informatie.

Identificeer en categoriseer:
1. **Memories**: Specifieke herinneringen en momenten (bijv. "we ontmoetten in de trein", "ze bleef bij me tijdens mijn ziekenhuisopname")
2. **Emotions**: Emotionele thema's (bijv. "dankbaarheid", "vreugde", "troost", "verlangen", "nostalgie")
3. **Partner Traits**: Eigenschappen van de partner (bijv. "geduld", "positiviteit", "zorgzaamheid", "humor")
4. **Music Style**: Gewenste muziekstijl of sfeer (bijv. "rustig akoestisch", "upbeat", "romantisch", "melancholisch")
5. **Special Moments**: Bijzondere momenten zoals verjaardagen, jubilea, mijlpalen
6. **Language**: Voorkeurstaal voor het liedje - detecteer uit de conversatietaal of expliciete vermelding (Nederlands, English, Français, Español, etc.)
7. **Vocal Gender**: Voorkeur voor stem geslacht indien vermeld ("male" voor mannenstem, "female" voor vrouwenstem, "neutral" als geen voorkeur)
8. **Vocal Age/Tone**: Leeftijdscategorie of toonkarakteristieken van de stem ("young" voor jong & helder 20-30 jaar, "mature" voor warm & volwassen 30-40 jaar, "deep" voor diep & soulvol 40+ jaar)

Retourneer een JSON object in dit exacte format:
{
  "memories": ["string array van specifieke herinneringen"],
  "emotions": ["string array van emotionele thema's"],
  "partnerTraits": ["string array van eigenschappen"],
  "musicStyle": "string met muziekstijl of null",
  "specialMoments": ["string array van bijzondere momenten of null"],
  "relationshipLength": "string met duur relatie of null",
  "language": "string met voorkeurstaal (bijv. 'English', 'Nederlands') of null",
  "vocalGender": "string met 'male', 'female', of 'neutral', of null",
  "vocalAge": "string met 'young', 'mature', of 'deep', of null",
  "vocalDescription": "string met beschrijving zoals 'warm and soulful', 'powerful', 'raspy', of null"
}

BELANGRIJK:
- Retourneer ALLEEN het JSON object, geen andere tekst
- Gebruik null voor ontbrekende waarden, NIET undefined
- Detecteer language automatisch uit de taal waarin de gebruiker schrijft
- Voor vocalGender: detecteer uit hints zoals "voor mijn vriendin" (female) of "voor mijn vriend" (male)
- Voor vocalDescription: combineer alle genoemde stemkenmerken (bijv. "donker", "krachtig", "zacht")`;

  const conversationText = messages
    .map((m) => `${m.role}: ${m.content}`)
    .join('\n');

  try {
    const data = await openrouterChatCompletion({
      messages: [
        { role: 'system', content: EXTRACTION_PROMPT },
        { role: 'user', content: `Conversatie:\n${conversationText}` },
      ] as any,
      temperature: 0.3,
      title: 'Liefdesliedje Maker - Context Extraction',
      maxTokens: 220,
    });
    const content = data.choices?.[0]?.message?.content || '';
    console.log('[contextExtraction] OpenRouter response received, content length:', content.length);

    // Check if response is empty or just whitespace
    if (!content || content.trim().length === 0) {
      console.warn('[contextExtraction] OpenRouter returned empty response, falling back to rule-based extraction');
      return extractContextRulesBased(messages);
    }

    // Try to parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        // Attempt robust JSON parsing with common LLM cleanup steps
        const raw = jsonMatch[0];
        const extracted = tryParseLooseJson(raw);

        // Validate and ensure all required fields exist
        const extractedContext = {
          memories: Array.isArray(extracted.memories) ? extracted.memories : [],
          emotions: Array.isArray(extracted.emotions) ? extracted.emotions : [],
          partnerTraits: Array.isArray(extracted.partnerTraits) ? extracted.partnerTraits : [],
          relationshipLength: extracted.relationshipLength || undefined,
          musicStyle: extracted.musicStyle || undefined,
          specialMoments: Array.isArray(extracted.specialMoments) ? extracted.specialMoments : undefined,
          language: extracted.language || undefined,
          vocalGender: extracted.vocalGender || undefined,
          vocalAge: extracted.vocalAge || undefined,
          vocalDescription: extracted.vocalDescription || undefined,
        };

        // If language was not detected by AI, infer it from conversation
        if (!extractedContext.language) {
          extractedContext.language = inferLanguageFromMessages(messages);
        }

        // Check if context has meaningful data
        if (extractedContext.memories.length > 0 || extractedContext.emotions.length > 0 || extractedContext.partnerTraits.length > 0) {
          console.log('[contextExtraction] Successfully extracted context from OpenRouter');
          return extractedContext;
        } else {
          console.warn('[contextExtraction] OpenRouter extraction returned empty arrays, falling back to rule-based extraction');
          return extractContextRulesBased(messages);
        }
      } catch (parseError) {
        console.error('[contextExtraction] JSON parsing failed:', parseError);
        console.warn('[contextExtraction] Falling back to rule-based extraction due to parse error');
        return extractContextRulesBased(messages);
      }
    }

    // No valid JSON found - fall back to rule-based extraction
    console.warn('[contextExtraction] No valid JSON found in OpenRouter response, falling back to rule-based extraction');
    console.warn('[contextExtraction] Response preview:', content.slice(0, 200));
    return extractContextRulesBased(messages);
  } catch (error: any) {
    console.error('[contextExtraction] OpenRouter API error:', {
      message: error?.message,
      name: error?.name,
      code: error?.code,
    });
    console.warn('[contextExtraction] Falling back to rule-based extraction due to API error');
    // Fallback to rule-based extraction when API fails
    return extractContextRulesBased(messages);
  }
}

/**
 * Merges new context with existing context, avoiding duplicates.
 *
 * @param existing - Existing extracted context (may be null or incomplete)
 * @param newContext - Newly extracted context
 * @returns Merged ExtractedContext
 */
export function mergeContext(
  existing: Partial<ExtractedContext> | null,
  newContext: ExtractedContext
): ExtractedContext {
  if (!existing) {
    return newContext;
  }

  return {
    memories: mergeArrays(existing.memories || [], newContext.memories),
    emotions: mergeArrays(existing.emotions || [], newContext.emotions),
    partnerTraits: mergeArrays(existing.partnerTraits || [], newContext.partnerTraits),
    relationshipLength: newContext.relationshipLength || existing.relationshipLength,
    musicStyle: newContext.musicStyle || existing.musicStyle,
    specialMoments: mergeArrays(existing.specialMoments || [], newContext.specialMoments || []),
    language: newContext.language || existing.language,
    vocalGender: newContext.vocalGender || existing.vocalGender,
    vocalAge: newContext.vocalAge || existing.vocalAge,
    vocalDescription: newContext.vocalDescription || existing.vocalDescription,
  };
}

/**
 * Parses extracted context from JSON string stored in database.
 *
 * @param jsonString - JSON string from database
 * @returns ExtractedContext or null if parsing fails
 */
export function parseExtractedContext(jsonString: string | null | undefined): ExtractedContext | null {
  if (!jsonString) {
    return null;
  }

  try {
    const parsed = JSON.parse(jsonString);

    // Validate structure
    if (typeof parsed === 'object' && parsed !== null) {
      return {
        memories: Array.isArray(parsed.memories) ? parsed.memories : [],
        emotions: Array.isArray(parsed.emotions) ? parsed.emotions : [],
        partnerTraits: Array.isArray(parsed.partnerTraits) ? parsed.partnerTraits : [],
        relationshipLength: parsed.relationshipLength,
        musicStyle: parsed.musicStyle,
        specialMoments: Array.isArray(parsed.specialMoments) ? parsed.specialMoments : undefined,
        language: parsed.language,
        vocalGender: parsed.vocalGender,
        vocalAge: parsed.vocalAge,
        vocalDescription: parsed.vocalDescription,
      };
    }

    return null;
  } catch (error) {
    console.error('Failed to parse extracted context:', error);
    return null;
  }
}

/**
 * Stringifies extracted context for storage in database.
 *
 * @param context - ExtractedContext object
 * @returns JSON string
 */
export function stringifyExtractedContext(context: ExtractedContext): string {
  return JSON.stringify(context);
}

// Helper functions

function tryParseLooseJson(raw: string): any {
  // Step 1: strip code fences if present
  let s = raw
    .replace(/^```[a-zA-Z]*\n?/g, '')
    .replace(/```\s*$/g, '');

  // Replace fancy quotes with normal quotes
  s = s.replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"').replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'");

  // Replace undefined with null
  s = s.replace(/:\s*undefined/g, ': null');

  // Remove comments
  s = s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/.*$/gm, '$1');

  // Quote unquoted keys: {key: value} -> {"key": value}
  s = s.replace(/([,{\s])([A-Za-z_][A-Za-z0-9_\-]*)\s*:/g, '$1"$2":');

  // Convert single-quoted strings to double-quoted (only those that look like JSON values)
  // e.g. 'text' -> "text" (avoid touching contractions inside already quoted strings)
  s = s.replace(/:\s*'([^']*)'/g, ': "$1"');
  s = s.replace(/\[\s*'([^']*)'\s*\]/g, '["$1"]');

  // Remove trailing commas in objects/arrays
  s = s.replace(/,\s*([}\]])/g, '$1');

  try {
    return JSON.parse(s);
  } catch (e) {
    // Last resort: try to find the biggest valid JSON substring
    try {
      const start = s.indexOf('{');
      const end = s.lastIndexOf('}');
      if (start >= 0 && end > start) {
        return JSON.parse(s.slice(start, end + 1));
      }
    } catch {}
    // Give a helpful error for upstream logs
    console.error('Loose JSON parse failed. Input (truncated):', s.slice(0, 400));
    console.error('Loose JSON parse failed. Full input:', s);
    throw e;
  }
}

function createEmptyContext(): ExtractedContext {
  return {
    memories: [],
    emotions: [],
    partnerTraits: [],
  };
}

/**
 * Rule-based context extraction that doesn't rely on LLM.
 * Uses pattern matching to extract memories, emotions, and traits from conversation.
 * This is a fallback when OpenRouter API fails or returns empty responses.
 */
function extractContextRulesBased(messages: Array<{ role: string; content: string }>): ExtractedContext {
  const conversationText = messages
    .filter((m) => m.role === 'user')
    .map((m) => m.content)
    .join(' ');

  console.log('[contextExtraction] Using rule-based extraction fallback');

  // Extract memories using common memory indicators
  const memoryIndicators = /(?:we|ik en|mijn partner|hij|zij|je|je partner)\s+(?:ontmoetten|waren|gingen|deden|hadden|stonden|zaten|lagen|zeiden|gegeven|zag|voelde|bleef)/gi;
  const memories: string[] = [];

  // Look for specific memorable phrases
  const sentenceFragments = conversationText.split(/[.!?]+/).filter(s => s.trim().length > 10);
  for (const fragment of sentenceFragments) {
    if (memoryIndicators.test(fragment)) {
      const cleaned = fragment.trim();
      if (cleaned.length > 5 && cleaned.length < 200) {
        memories.push(cleaned);
      }
    }
  }

  // Extract emotions using common emotional keywords
  const emotionKeywords = {
    love: ['liefde', 'love', 'amore'],
    joy: ['vreugde', 'joy', 'blij', 'happy', 'gelukkig'],
    warmth: ['warm', 'gezellig', 'cozy', 'warmth'],
    gratitude: ['dankbaar', 'grateful', 'dankbaarheid'],
    longing: ['verlangen', 'longing', 'missen', 'miss'],
    comfort: ['troost', 'comfort', 'steun', 'support'],
    nostalgia: ['nostalgie', 'nostalgic', 'herinnereing'],
    tenderness: ['tederheid', 'tender', 'gentle', 'zacht'],
  };

  const emotions: string[] = [];
  for (const [emotionName, keywords] of Object.entries(emotionKeywords)) {
    const pattern = new RegExp(keywords.join('|'), 'gi');
    if (pattern.test(conversationText)) {
      emotions.push(emotionName);
    }
  }

  // Extract partner traits using common descriptive patterns
  const traitKeywords = {
    patience: ['geduld', 'geduldig', 'patient', 'patience'],
    kindness: ['aardig', 'lief', 'kind', 'kindness', 'zorgzaam'],
    humor: ['grappig', 'humor', 'funny', 'humor', 'lachen'],
    strength: ['sterk', 'strong', 'kracht', 'strength'],
    intelligence: ['slim', 'intelligent', 'clever', 'intelligent'],
    beauty: ['mooi', 'beautiful', 'beauty', 'mooi', 'pretty'],
    loyalty: ['trouw', 'loyal', 'loyaliteit', 'loyalty'],
    creativity: ['creatief', 'creative', 'creativiteit', 'creativity'],
    generosity: ['genereus', 'generous', 'mild', 'giving'],
    optimism: ['optimist', 'optimistic', 'positief', 'positive'],
  };

  const traits: string[] = [];
  for (const [traitName, keywords] of Object.entries(traitKeywords)) {
    const pattern = new RegExp(keywords.join('|'), 'gi');
    if (pattern.test(conversationText)) {
      traits.push(traitName);
    }
  }

  // Try to detect music style preferences
  let musicStyle: string | undefined;
  const styleKeywords = {
    'romantic': ['romantisch', 'romantic', 'liefdevol', 'sweet'],
    'upbeat': ['upbeat', 'energiek', 'vrolijk', 'happy'],
    'acoustic': ['akoestisch', 'acoustic', 'gitaar', 'guitar'],
    'calm': ['rustig', 'calm', 'peaceful', 'vreedzaam'],
    'melancholic': ['melancholisch', 'melancholic', 'droevig', 'sad'],
    'energetic': ['energiek', 'energetic', 'krachtig', 'powerful'],
  };

  for (const [style, keywords] of Object.entries(styleKeywords)) {
    const pattern = new RegExp(keywords.join('|'), 'gi');
    if (pattern.test(conversationText)) {
      musicStyle = style;
      break;
    }
  }

  const language = inferLanguageFromMessages(messages);

  const context: ExtractedContext = {
    memories: Array.from(new Set(memories)).slice(0, 5), // Limit to 5 unique memories
    emotions: Array.from(new Set(emotions)), // Remove duplicates
    partnerTraits: Array.from(new Set(traits)), // Remove duplicates
    musicStyle,
    language,
  };

  console.log('[contextExtraction] Rule-based extraction result:', {
    memoriesCount: context.memories.length,
    emotionsCount: context.emotions.length,
    traitsCount: context.partnerTraits.length,
    musicStyle: context.musicStyle,
  });

  return context;
}

/**
 * Infers the language from conversation messages.
 * Detects common words in Dutch, English, French, and Spanish.
 */
function inferLanguageFromMessages(messages: Array<{ role: string; content: string }>): string | undefined {
  const userMessages = messages
    .filter((m) => m.role === 'user')
    .map((m) => m.content.toLowerCase())
    .join(' ');

  // Dutch indicators (most common words)
  const dutchPatterns = /\b(het|de|een|is|van|voor|met|op|dat|in|ik|je|mijn|zijn|hebben|maar|ook)\b/gi;
  const dutchMatches = userMessages.match(dutchPatterns)?.length || 0;

  // English indicators
  const englishPatterns = /\b(the|is|a|an|of|for|with|on|that|in|i|you|my|his|her|have|but|also)\b/gi;
  const englishMatches = userMessages.match(englishPatterns)?.length || 0;

  // French indicators
  const frenchPatterns = /\b(le|la|les|un|une|est|de|pour|avec|sur|que|dans|je|tu|mon|son|avoir|mais|aussi)\b/gi;
  const frenchMatches = userMessages.match(frenchPatterns)?.length || 0;

  // Spanish indicators
  const spanishPatterns = /\b(el|la|los|las|un|una|es|de|para|con|en|que|yo|tu|mi|su|tener|pero|también)\b/gi;
  const spanishMatches = userMessages.match(spanishPatterns)?.length || 0;

  // Find the language with the most matches
  const scores = {
    'Nederlands': dutchMatches,
    'English': englishMatches,
    'Français': frenchMatches,
    'Español': spanishMatches,
  };

  const maxScore = Math.max(...Object.values(scores));

  // Only return a language if we have enough confidence (at least 3 matches)
  if (maxScore >= 3) {
    return Object.keys(scores).find(lang => scores[lang as keyof typeof scores] === maxScore);
  }

  return undefined;
}

function mergeArrays(arr1: string[], arr2: string[]): string[] {
  const combined = [...arr1, ...arr2];
  // Remove duplicates (case-insensitive)
  const unique = Array.from(
    new Set(combined.map((s) => s.toLowerCase()))
  ).map((lower) => {
    // Find original casing from combined array
    return combined.find((s) => s.toLowerCase() === lower) || lower;
  });
  return unique;
}
