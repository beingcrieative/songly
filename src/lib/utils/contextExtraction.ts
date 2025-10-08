import { ExtractedContext } from '@/types/conversation';

const EXTRACTION_MODEL =
  process.env.OPENROUTER_EXTRACTION_MODEL ||
  process.env.OPENROUTER_MODEL ||
  'google/gemini-2.5-flash-lite';

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

Retourneer een JSON object in dit exacte format:
{
  "memories": ["string array van specifieke herinneringen"],
  "emotions": ["string array van emotionele thema's"],
  "partnerTraits": ["string array van eigenschappen"],
  "musicStyle": "string met muziekstijl of undefined",
  "specialMoments": ["string array van bijzondere momenten of undefined"],
  "relationshipLength": "string met duur relatie of undefined"
}

BELANGRIJK: Retourneer ALLEEN het JSON object, geen andere tekst.`;

  const conversationText = messages
    .map((m) => `${m.role}: ${m.content}`)
    .join('\n');

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://liefdesliedje.app',
        'X-Title': 'Liefdesliedje Maker - Context Extraction',
      },
      body: JSON.stringify({
        model: EXTRACTION_MODEL,
        messages: [
          { role: 'system', content: EXTRACTION_PROMPT },
          { role: 'user', content: `Conversatie:\n${conversationText}` },
        ],
        temperature: 0.3, // Lower temperature for more consistent extraction
      }),
    });

    if (!response.ok) {
      // On rate limit, return empty context instead of throwing
      if (response.status === 429) {
        console.warn('Context extraction rate limited, using empty context');
        return createEmptyContext();
      }
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '{}';

    // Try to parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const extracted = JSON.parse(jsonMatch[0]);

      // Validate and ensure all required fields exist
      return {
        memories: Array.isArray(extracted.memories) ? extracted.memories : [],
        emotions: Array.isArray(extracted.emotions) ? extracted.emotions : [],
        partnerTraits: Array.isArray(extracted.partnerTraits) ? extracted.partnerTraits : [],
        relationshipLength: extracted.relationshipLength,
        musicStyle: extracted.musicStyle,
        specialMoments: Array.isArray(extracted.specialMoments) ? extracted.specialMoments : undefined,
      };
    }

    // Fallback: return empty context if parsing fails
    return createEmptyContext();
  } catch (error) {
    console.error('Context extraction error:', error);
    // Return empty context on error rather than throwing
    return createEmptyContext();
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

function createEmptyContext(): ExtractedContext {
  return {
    memories: [],
    emotions: [],
    partnerTraits: [],
  };
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
