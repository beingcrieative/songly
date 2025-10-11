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
    } = await request.json();

    if (!conversationId) {
      return NextResponse.json(
        { error: 'conversationId is required' },
        { status: 400 }
      );
    }

    // Build conversation context
    const conversationText = messages
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
    let lyricData;
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

    const lyricsContent = JSON.stringify(lyricData);
    const contentHash = calculateHash(lyricsContent);
    const newVersion = previousVersion + 1;
    const label = generateLabel(newVersion);

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
        .update({
          content: lyricsContent,
          label,
          createdAt: Date.now(),
          hash: contentHash,
          version: newVersion,
        })
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
