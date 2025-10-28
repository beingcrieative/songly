import { NextRequest, NextResponse } from 'next/server';
import { openrouterChatCompletion } from '@/lib/utils/openrouterClient';
import { CONVERSATION_AGENT_SYSTEM_PROMPT } from '@/lib/prompts/conversationAgent';

// Configureerbaar: maximum aantal conversatie rondes voordat lyrics gegenereerd worden
const MAX_CONVERSATION_ROUNDS = parseInt(process.env.MAX_CONVERSATION_ROUNDS || '8');

const COMPOSER_CONTEXT_PROMPT = `Je bent een expert UI designer voor een muziek compositie tool. Analyseer de conversatie en suggereer relevante composer controls.

Op basis van de conversatie, genereer een JSON object met composer suggestions:

{
  "mood": ["romantic", "upbeat", "melancholic", "hopeful"],
  "sections": ["add verse", "add bridge", "extend chorus"],
  "tone": ["playful", "serious", "nostalgic", "passionate"],
  "suggested_action": "Beschrijving van wat de gebruiker waarschijnlijk wil doen"
}

Kies suggesties die passen bij de gesprekscontext. Retourneer ALLEEN het JSON object, geen andere tekst.`;

async function generateComposerContext(messages: any[]): Promise<string | null> {
  try {
    const conversationSummary = messages
      .slice(-3) // Last 3 messages for context
      .map((m: any) => `${m.role}: ${m.content}`)
      .join('\n');

    const data = await openrouterChatCompletion({
      messages: [
        { role: 'system', content: COMPOSER_CONTEXT_PROMPT },
        { role: 'user', content: `Conversatie:\n${conversationSummary}` },
      ],
      temperature: 0.4,
      title: 'Liefdesliedje Maker - Composer Context',
    });
    const content = data.choices?.[0]?.message?.content || '';

    // Try to parse JSON from response
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return JSON.stringify(parsed);
      }
    } catch (e) {
      console.warn('Could not parse composer context JSON:', e);
    }

    return content;
  } catch (error) {
    console.error('Error generating composer context:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const {
      messages,
      conversationRound = 0,
    } = await request.json();

    // Server log helpers for clarity
    const singleLine = (s: string) => (s || '').replace(/[\r\n]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
    const lastUserMsg = Array.isArray(messages)
      ? [...messages].reverse().find((m: any) => m?.role === 'user')?.content || ''
      : '';

    // Als dit de eerste call is, start het gesprek
    if (conversationRound === 0) {
      const greeting = `Hoi! Wat leuk dat je een liefdesliedje wilt maken! 💕

Ik ga je helpen om iets heel persoonlijks en speciaals te creëren voor je geliefde.

Vertel me eens: wat is een mooie herinnering die je hebt met je partner? Het mag iets kleins zijn, of iets groots - alles wat belangrijk voor jullie is!`;
      if (lastUserMsg) {
        console.log(`user: ${singleLine(lastUserMsg)}`);
      }
      console.log(`aiagent: ${singleLine(greeting)}`);
      return NextResponse.json({
        type: 'message',
        content: greeting,
        round: 1,
      });
    }

    // Bouw de conversatie geschiedenis op voor OpenRouter
    const conversationHistory = [
      { role: 'system', content: CONVERSATION_AGENT_SYSTEM_PROMPT },
      ...messages.map((m: any) => ({
        role: m.role,
        content: m.content,
      })),
    ];

    // Voeg extra instructie toe als we bijna klaar zijn
    if (conversationRound >= MAX_CONVERSATION_ROUNDS - 2) {
      conversationHistory.push({
        role: 'system',
        content: `Je hebt nu ${conversationRound} rondes gesproken. Als je genoeg informatie hebt verzameld, kun je aangeven dat we klaar zijn voor lyrics generatie. Zo niet, stel nog 1-2 vragen.`,
      });
    }

    // Normale conversatie
    const data = await openrouterChatCompletion({
      messages: conversationHistory,
      title: 'Liefdesliedje Maker - Conversation',
      temperature: 0.8,
    });
    const aiMessage = data.choices?.[0]?.message?.content || '';

    // Generate composer context after getting AI reply
    const composerContext = await generateComposerContext([
      ...messages,
      { role: 'assistant', content: aiMessage }
    ]);

    // Server logs: last user + assistant visible reply
    if (lastUserMsg) {
      console.log(`user: ${singleLine(lastUserMsg)}`);
    }
    console.log(`aiagent: ${singleLine(aiMessage)}`);

    // Check of we klaar zijn voor Suno lyrics generation
    // Dit gebeurt via /api/suno/lyrics, NIET via LLM
    const isReadyForSunoLyrics =
      conversationRound >= MAX_CONVERSATION_ROUNDS - 1;

    if (isReadyForSunoLyrics) {
      console.log('Chat conversation ready for Suno lyrics generation via /api/suno/lyrics');
      return NextResponse.json({
        type: 'ready_for_lyrics',
        content: aiMessage,
        round: conversationRound + 1,
        composerContext,
        message: 'Ready to generate lyrics via Suno API - client should call /api/suno/lyrics'
      });
    }

    return NextResponse.json({
      type: 'message',
      content: aiMessage,
      round: conversationRound + 1,
      composerContext,
    });
  } catch (error: any) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: error.message || 'Er is iets misgegaan' },
      { status: 500 }
    );
  }
}

// NOTE: Chat conversation is for context gathering ONLY - no lyrics generation here.
// Lyrics generation is exclusively handled via /api/suno/lyrics API.
// When conversation reaches MAX_CONVERSATION_ROUNDS, client receives 'ready_for_lyrics' signal
// and should call /api/suno/lyrics with the conversation context.
