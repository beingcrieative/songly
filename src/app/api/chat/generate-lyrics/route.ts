import { NextRequest, NextResponse } from 'next/server';
import { LYRICS_AGENT_SYSTEM_PROMPT } from '@/lib/prompts/lyricsAgent';
import { ExtractedContext, LyricsGenerationResponse, UserPreferences } from '@/types/conversation';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const OPENROUTER_MODEL = 'deepseek/deepseek-chat-v3.1:free';

export async function POST(request: NextRequest) {
  try {
    const {
      conversationTranscript,
      extractedContext,
      userPreferences = {},
    }: {
      conversationTranscript: string;
      extractedContext: ExtractedContext;
      userPreferences?: UserPreferences;
    } = await request.json();

    // Validate input
    if (!conversationTranscript || !extractedContext) {
      return NextResponse.json(
        { error: 'Conversation transcript and extracted context are required' },
        { status: 400 }
      );
    }

    // Build comprehensive generation prompt
    const generationPrompt = buildLyricsGenerationPrompt(
      conversationTranscript,
      extractedContext,
      userPreferences
    );

    // Call OpenRouter with lyrics agent
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://liefdesliedje.app',
        'X-Title': 'Liefdesliedje Maker - Lyrics Generation',
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [
          { role: 'system', content: LYRICS_AGENT_SYSTEM_PROMPT },
          { role: 'user', content: generationPrompt },
        ],
        temperature: 0.9, // Higher creativity for lyrics
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || 'OpenRouter API error');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    if (!content) {
      throw new Error('No response from lyrics generation agent');
    }

    // Parse lyrics from response
    const lyrics = parseLyricsResponse(content);

    // Validate lyrics format
    const validation = validateLyricsFormat(lyrics.lyrics);
    if (!validation.isValid) {
      console.warn('Lyrics validation failed:', validation.errors);
      // Try simpler fallback prompt if validation fails
      const fallbackLyrics = await generateWithFallbackPrompt(
        conversationTranscript,
        extractedContext
      );
      if (fallbackLyrics) {
        return NextResponse.json(fallbackLyrics);
      }
    }

    // Build response
    const responseData: LyricsGenerationResponse = {
      type: 'lyrics_generated',
      title: lyrics.title,
      lyrics: lyrics.lyrics,
      style: lyrics.style,
      reasoning: lyrics.reasoning || '',
    };

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error('Lyrics generation API error:', error);

    // User-friendly Dutch error message
    const errorMessage =
      'Er ging iets mis bij het genereren van de lyrics. Laten we nog een detail toevoegen en opnieuw proberen.';

    return NextResponse.json(
      { error: errorMessage, details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Builds comprehensive prompt for lyrics generation
 */
function buildLyricsGenerationPrompt(
  transcript: string,
  context: ExtractedContext,
  preferences: UserPreferences
): string {
  const memories = context.memories.length > 0
    ? `\n**Belangrijke herinneringen**:\n${context.memories.map((m) => `- ${m}`).join('\n')}`
    : '';

  const emotions = context.emotions.length > 0
    ? `\n**Emotionele thema's**:\n${context.emotions.map((e) => `- ${e}`).join('\n')}`
    : '';

  const traits = context.partnerTraits.length > 0
    ? `\n**Eigenschappen van de partner**:\n${context.partnerTraits.map((t) => `- ${t}`).join('\n')}`
    : '';

  const musicStyle = context.musicStyle
    ? `\n**Gewenste muziekstijl**: ${context.musicStyle}`
    : preferences.tempo || preferences.instrumentation
    ? `\n**Gewenste muziekstijl**: ${preferences.tempo || 'medium tempo'} met ${preferences.instrumentation || 'akoestische'} instrumenten`
    : '';

  const specialMoments = context.specialMoments && context.specialMoments.length > 0
    ? `\n**Bijzondere momenten**:\n${context.specialMoments.map((m) => `- ${m}`).join('\n')}`
    : '';

  const relationshipLength = context.relationshipLength
    ? `\n**Relatieduur**: ${context.relationshipLength}`
    : '';

  return `Schrijf een persoonlijk liefdesliedje gebaseerd op het volgende gesprek en de geëxtraheerde context.

## Conversatie Transcript
${transcript}

## Geëxtraheerde Context
${memories}${emotions}${traits}${musicStyle}${specialMoments}${relationshipLength}

## Instructies
1. Gebruik de specifieke details en herinneringen uit de conversatie
2. Weerspiegelook de unieke eigenschappen van de partner
3. Volg de exacte Suno-structuur: [Couplet 1], [Refrein], [Couplet 2], [Refrein], [Bridge], [Refrein]
4. Schrijf in natuurlijk, modern Nederlands
5. Vermijd clichés, gebruik concrete beelden
6. Zorg voor goede flow en muzikaliteit

Retourneer ALLEEN een JSON object met deze exacte structuur:
{
  "title": "Korte titel (2-5 woorden)",
  "lyrics": "Volledige lyrics met [Couplet], [Refrein], [Bridge] labels",
  "style": "Suno style description (instrumentatie, vocals, mood)",
  "reasoning": "Korte uitleg van je keuzes"
}`;
}

/**
 * Parses lyrics response from AI
 */
function parseLyricsResponse(content: string): {
  title: string;
  lyrics: string;
  style: string;
  reasoning?: string;
} {
  try {
    // Try to extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);

      return {
        title: parsed.title || 'Liefdesliedje',
        lyrics: parsed.lyrics || '',
        style: parsed.style || 'romantic acoustic ballad',
        reasoning: parsed.reasoning,
      };
    }

    // Fallback: treat entire content as lyrics if no JSON found
    return {
      title: 'Liefdesliedje',
      lyrics: content,
      style: 'romantic acoustic ballad',
    };
  } catch (error) {
    console.error('Failed to parse lyrics response:', error);
    return {
      title: 'Liefdesliedje',
      lyrics: content,
      style: 'romantic acoustic ballad',
    };
  }
}

/**
 * Validates lyrics format for Suno compatibility
 */
function validateLyricsFormat(lyrics: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check for required sections
  if (!lyrics.includes('[Couplet 1]') && !lyrics.includes('[Verse 1]')) {
    errors.push('Missing [Couplet 1]');
  }

  if (!lyrics.includes('[Refrein]') && !lyrics.includes('[Chorus]')) {
    errors.push('Missing [Refrein]');
  }

  if (!lyrics.includes('[Bridge]')) {
    errors.push('Missing [Bridge]');
  }

  // Check minimum length
  if (lyrics.length < 100) {
    errors.push('Lyrics too short');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Fallback generation with simpler prompt if main generation fails validation
 */
async function generateWithFallbackPrompt(
  transcript: string,
  context: ExtractedContext
): Promise<LyricsGenerationResponse | null> {
  try {
    const fallbackPrompt = `Schrijf een eenvoudig liefdesliedje in het Nederlands.

Gebruik deze informatie:
${transcript}

Structuur:
[Couplet 1]
4 regels

[Refrein]
4 regels

[Couplet 2]
4 regels

[Refrein]
4 regels

[Bridge]
4 regels

[Refrein]
4 regels

Retourneer als JSON: {"title": "...", "lyrics": "...", "style": "..."}`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://liefdesliedje.app',
        'X-Title': 'Liefdesliedje Maker - Fallback',
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [
          { role: 'system', content: 'Je bent een songwriter.' },
          { role: 'user', content: fallbackPrompt },
        ],
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    const parsed = parseLyricsResponse(content);

    return {
      type: 'lyrics_generated',
      title: parsed.title,
      lyrics: parsed.lyrics,
      style: parsed.style,
      reasoning: 'Gegenereerd met vereenvoudigde prompt (fallback)',
    };
  } catch (error) {
    console.error('Fallback generation failed:', error);
    return null;
  }
}
