import { NextRequest, NextResponse } from 'next/server';
import { LYRICS_AGENT_SYSTEM_PROMPT } from '@/lib/prompts/lyricsAgent';
import { ExtractedContext, LyricsGenerationResponse } from '@/types/conversation';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const OPENROUTER_MODEL = 'deepseek/deepseek-chat-v3.1:free';

interface RefineRequest {
  previousLyrics: {
    title: string;
    lyrics: string;
    style: string;
    reasoning?: string;
  };
  feedback: string;
  conversationTranscript?: string;
  extractedContext?: ExtractedContext;
}

export async function POST(request: NextRequest) {
  try {
    const {
      previousLyrics,
      feedback,
      conversationTranscript,
      extractedContext,
    }: RefineRequest = await request.json();

    // Validate input
    if (!previousLyrics || !feedback) {
      return NextResponse.json(
        { error: 'Previous lyrics and feedback are required' },
        { status: 400 }
      );
    }

    if (!feedback.trim()) {
      return NextResponse.json(
        { error: 'Feedback cannot be empty' },
        { status: 400 }
      );
    }

    // Build refinement prompt
    const refinementPrompt = buildRefinementPrompt(
      previousLyrics,
      feedback,
      conversationTranscript,
      extractedContext
    );

    // Call OpenRouter with lyrics agent
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://liefdesliedje.app',
        'X-Title': 'Liefdesliedje Maker - Lyrics Refinement',
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [
          { role: 'system', content: LYRICS_AGENT_SYSTEM_PROMPT },
          { role: 'user', content: refinementPrompt },
        ],
        temperature: 0.9,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || 'OpenRouter API error');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    if (!content) {
      throw new Error('No response from lyrics refinement agent');
    }

    // Parse refined lyrics
    const refinedLyrics = parseLyricsResponse(content);

    // Validate lyrics format
    const validation = validateLyricsFormat(refinedLyrics.lyrics);
    if (!validation.isValid) {
      console.warn('Refined lyrics validation failed:', validation.errors);
      // Return anyway but log the warning
    }

    // Build response
    const responseData: LyricsGenerationResponse = {
      type: 'lyrics_generated',
      title: refinedLyrics.title,
      lyrics: refinedLyrics.lyrics,
      style: refinedLyrics.style,
      reasoning: refinedLyrics.reasoning || `Verfijnd op basis van: "${feedback}"`,
    };

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error('Lyrics refinement API error:', error);

    const errorMessage =
      'Er ging iets mis bij het verfijnen van de lyrics. Probeer het opnieuw met andere feedback.';

    return NextResponse.json(
      { error: errorMessage, details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Builds refinement prompt with previous lyrics and user feedback
 */
function buildRefinementPrompt(
  previousLyrics: { title: string; lyrics: string; style: string; reasoning?: string },
  feedback: string,
  conversationTranscript?: string,
  extractedContext?: ExtractedContext
): string {
  let contextSection = '';

  if (extractedContext) {
    const memories = extractedContext.memories.length > 0
      ? `\n**Herinneringen**: ${extractedContext.memories.join(', ')}`
      : '';
    const emotions = extractedContext.emotions.length > 0
      ? `\n**Emoties**: ${extractedContext.emotions.join(', ')}`
      : '';
    const traits = extractedContext.partnerTraits.length > 0
      ? `\n**Eigenschappen**: ${extractedContext.partnerTraits.join(', ')}`
      : '';

    if (memories || emotions || traits) {
      contextSection = `\n\n## Context uit conversatie${memories}${emotions}${traits}`;
    }
  }

  return `Je hebt eerder deze lyrics geschreven:

## Huidige Versie
**Titel**: ${previousLyrics.title}
**Stijl**: ${previousLyrics.style}

**Lyrics**:
${previousLyrics.lyrics}

${previousLyrics.reasoning ? `**Eerdere toelichting**: ${previousLyrics.reasoning}` : ''}${contextSection}

## Feedback van de gebruiker
"${feedback}"

## Instructies
Verfijn de lyrics op basis van de feedback van de gebruiker. Je moet:
1. De feedback goed begrijpen en verwerken
2. De originele intentie en emotie behouden
3. Specifieke details uit de context blijven gebruiken
4. De Suno-structuur behouden: [Couplet 1], [Refrein], [Couplet 2], [Refrein], [Bridge], [Refrein]
5. Natuurlijk Nederlands blijven gebruiken

Let op:
- Als de gebruiker vraagt om andere woorden te gebruiken, vervang dan de specifieke woorden
- Als de gebruiker vraagt om een andere sfeer, pas dan de toon aan maar behoud de feiten
- Als de gebruiker vraagt om meer/minder details, voeg toe of haal weg waar nodig
- Als de gebruiker vraagt om een specifiek onderdeel te veranderen, focus daar dan op

Retourneer ALLEEN een JSON object met deze exacte structuur:
{
  "title": "Nieuwe of aangepaste titel",
  "lyrics": "Verfijnde lyrics met [Couplet], [Refrein], [Bridge] labels",
  "style": "Suno style description (evt. aangepast)",
  "reasoning": "Korte uitleg van welke aanpassingen je hebt gemaakt en waarom"
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
      title: 'Liefdesliedje (verfijnd)',
      lyrics: content,
      style: 'romantic acoustic ballad',
    };
  } catch (error) {
    console.error('Failed to parse refined lyrics response:', error);
    return {
      title: 'Liefdesliedje (verfijnd)',
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
