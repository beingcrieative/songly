import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/adminDb';
import { id } from '@instantdb/admin';
import crypto from 'crypto';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'google/gemini-2.5-flash-lite';

const LYRIC_VERSION_PROMPT = `Je bent een professionele liedjesschrijver. Genereer of verfijn song lyrics op basis van de conversatie.

BELANGRIJK: Retourneer ALLEEN een JSON object, geen andere tekst. Format:

{
  "title": "Songtitel",
  "lyrics": "Volledige lyrics met secties zoals [Couplet 1], [Refrein], etc.",
  "style": "Muziekstijl beschrijving",
  "notes": "Korte opmerking over wat er veranderd is (optioneel)"
}`;

function calculateHash(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex').substring(0, 16);
}

function generateLabel(version: number): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `Versie ${version} – ${hours}:${minutes}`;
}

export async function POST(request: NextRequest) {
  try {
    const {
      conversationId,
      songId,
      messages,
      previousLyrics,
      previousVersion = 0,
      providedLyrics,
    } = await request.json();

    const providedVariantIndex =
      typeof providedLyrics?.variantIndex === 'number' ? providedLyrics.variantIndex : undefined;
    const providedTaskId =
      typeof providedLyrics?.taskId === 'string' ? providedLyrics.taskId : undefined;
    const providedSource =
      typeof providedLyrics?.source === 'string' ? providedLyrics.source : undefined;
    const providedIsManual = providedLyrics?.isManual === true;
    const providedIsRefinement = providedLyrics?.isRefinement === true;
    const providedIsSelection = providedLyrics?.isSelection === true;
    const providedSelectedAt =
      typeof providedLyrics?.selectedAt === 'number' ? providedLyrics.selectedAt : undefined;

    if (!conversationId) {
      return NextResponse.json(
        { error: 'conversationId is required' },
        { status: 400 }
      );
    }

    let lyricData;
    if (providedLyrics && typeof providedLyrics === 'object' && providedLyrics.lyrics) {
      lyricData = {
        title: providedLyrics.title || 'Jouw Liefdesliedje',
        lyrics: providedLyrics.lyrics,
        style: providedLyrics.style || '',
        notes: providedLyrics.notes || '',
        source: providedLyrics.source || 'external',
      };
    } else {
      // Build conversation context
      const conversationText = (messages || [])
        .map((m: any) => `${m.role}: ${m.content}`)
        .join('\n\n');

      let prompt = '';
      if (previousLyrics) {
        prompt = `Conversatie tot nu toe:\n${conversationText}\n\nHuidige lyrics:\n${previousLyrics}\n\nVerfijn de lyrics op basis van de laatste conversatie-updates.`;
      } else {
        prompt = `Conversatie:\n${conversationText}\n\nGenereer de eerste versie van song lyrics op basis van deze conversatie.`;
      }

      // Call LLM to generate lyrics
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://liefdesliedje.app',
          'X-Title': 'Liefdesliedje Maker',
        },
        body: JSON.stringify({
          model: OPENROUTER_MODEL,
          messages: [
            { role: 'system', content: LYRIC_VERSION_PROMPT },
            { role: 'user', content: prompt },
          ],
          route: 'fallback', // Allow fallback to paid models if free model unavailable
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'OpenRouter API error');
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';

      // Parse JSON from response
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          lyricData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in response');
        }
      } catch (e) {
        console.error('Failed to parse lyric JSON:', e);
        return NextResponse.json(
          { error: 'Failed to parse lyrics response' },
          { status: 500 }
        );
      }
    }

    const now = Date.now();
    const selectedAt =
      providedSelectedAt !== undefined
        ? providedSelectedAt
        : providedIsManual || providedIsRefinement || providedIsSelection
        ? now
        : undefined;

    const metadata: Record<string, any> = {};
    if (providedVariantIndex !== undefined) {
      metadata.variantIndex = providedVariantIndex;
    }
    if (providedTaskId) {
      metadata.taskId = providedTaskId;
    }
    if (providedIsManual) {
      metadata.isManual = true;
    }
    if (providedIsRefinement) {
      metadata.isRefinement = true;
    }
    if (providedIsSelection) {
      metadata.isSelection = true;
    }
    if (providedSource) {
      metadata.source = providedSource;
    }
    if (selectedAt !== undefined) {
      metadata.selectedAt = selectedAt;
    }
    if (Object.keys(metadata).length > 0) {
      lyricData.metadata = { ...(lyricData.metadata || {}), ...metadata };
    }

    const lyricsContent = JSON.stringify(lyricData);
    const contentHash = calculateHash(lyricsContent);
    const newVersion = previousVersion + 1;
    const label = generateLabel(newVersion);

    const updateData: Record<string, any> = {
      content: lyricsContent,
      label,
      createdAt: now,
      hash: contentHash,
      version: newVersion,
    };

    if (providedVariantIndex !== undefined) {
      updateData.variantIndex = providedVariantIndex;
    }
    if (providedSource) {
      updateData.variantSource = providedSource;
    }
    if (providedIsManual) {
      updateData.isManual = true;
    }
    if (providedIsRefinement) {
      updateData.isRefined = true;
    }
    if (providedIsSelection) {
      updateData.isSelection = true;
    }
    if (selectedAt !== undefined) {
      updateData.selectedAt = selectedAt;
    }
    if (providedTaskId) {
      updateData.selectedFromTaskId = providedTaskId;
    }

    // Store in InstantDB using Admin SDK
    const admin = getAdminDb();
    if (!admin) {
      return NextResponse.json(
        { error: 'Admin DB not configured' },
        { status: 500 }
      );
    }

    const versionId = id();
    const transactions = [
      admin.tx.lyric_versions[versionId]
        .update(updateData)
        .link({ conversation: conversationId }),
    ];

    // Link to song if provided
    if (songId) {
      transactions.push(
        admin.tx.lyric_versions[versionId].link({ song: songId })
      );
    }

    await admin.transact(transactions);

    return NextResponse.json({
      success: true,
      version: {
        id: versionId,
        content: lyricsContent,
        label,
        hash: contentHash,
        version: newVersion,
        data: lyricData,
      },
    });
  } catch (error: any) {
    console.error('Lyric version generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate lyric version' },
      { status: 500 }
    );
  }
}
