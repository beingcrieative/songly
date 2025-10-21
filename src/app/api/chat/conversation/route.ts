import { NextRequest, NextResponse } from 'next/server';
import { CONVERSATION_AGENT_SYSTEM_PROMPT } from '@/lib/prompts/conversationAgent';
import {
  extractContextFromConversation,
  mergeContext,
  parseExtractedContext,
  stringifyExtractedContext,
} from '@/lib/utils/contextExtraction';
import { calculateReadinessScore } from '@/lib/utils/readinessScore';
import { ConversationAgentResponse, ExtractedContext } from '@/types/conversation';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'openai/gpt-oss-20b:free';
import { openrouterChatCompletion } from '@/lib/utils/openrouterClient';

export async function POST(request: NextRequest) {
  try {
    const {
      messages,
      conversationRound = 0,
      existingContext = null,
    } = await request.json();

    // Validate input
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    // Helper for clear, single-line server logs
    const singleLine = (s: string) => (s || '').replace(/[\r\n]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
    const lastUserMsg = Array.isArray(messages)
      ? [...messages].reverse().find((m: any) => m?.role === 'user')?.content || ''
      : '';

    // Build conversation history for OpenRouter
    const conversationHistory = [
      { role: 'system', content: CONVERSATION_AGENT_SYSTEM_PROMPT },
      ...messages.map((m: any) => ({
        role: m.role,
        content: m.content,
      })),
    ];

    // Call OpenRouter with conversation agent
    let data: any;
    try {
      data = await openrouterChatCompletion({
        messages: conversationHistory,
        temperature: 0.8,
        title: 'Liefdesliedje Maker - Conversation',
        // Allow enough room for short chat + optional hidden concept block
        maxTokens: 1024,
      });
    } catch (e: any) {
      const message = e?.message || '';
      if ((message && message.toLowerCase().includes('too many')) || message.toLowerCase().includes('rate')) {
        return NextResponse.json(
          {
            error: 'Even geduld, we hebben te veel aanvragen ontvangen. Probeer het over een paar seconden opnieuw.',
            rateLimited: true
          },
          { status: 429 }
        );
      }
      throw e;
    }

    // Defensive extraction of assistant text across model variants
    const extractAssistantText = (resp: any): string => {
      try {
        const choice = resp?.choices?.[0];
        // OpenAI-compatible path
        const content = choice?.message?.content;
        if (typeof content === 'string' && content.trim()) return content;
        // Some providers may return array blocks
        if (Array.isArray(content)) {
          const joined = content.map((c: any) => c?.text || c).join('');
          if (joined && typeof joined === 'string' && joined.trim()) return joined;
        }
        // Fallbacks sometimes expose content directly on choice
        const direct = choice?.content;
        if (typeof direct === 'string' && direct.trim()) return direct;
        // Some providers put text at choice.text
        const altText = choice?.text;
        if (typeof altText === 'string' && altText.trim()) return altText;
      } catch (_) {
        // ignore – will fall through to fallback message
      }
      return '';
    };

    let aiMessage = extractAssistantText(data);

    if (!aiMessage) {
      // Don’t hard-fail the flow; provide a graceful reply and continue
      console.warn('Conversation agent returned empty content; using fallback. Meta:', {
        model: (data && (data.model || data.provider)) || 'unknown',
        finish_reason: data?.choices?.[0]?.finish_reason,
      });
      aiMessage = 'Sorry, ik kon je net niet goed verstaan. Kun je het nog eens beschrijven? Bijvoorbeeld: een mooie herinnering of een moment dat jullie band bijzonder maakt.';
    }

    // Parse concept lyrics from response (hidden from chat, shown in lyrics panel)
    const conceptLyrics = parseConceptLyrics(aiMessage);

    // Remove concept lyrics block from visible message
    const visibleMessage = aiMessage.replace(/###CONCEPT_LYRICS v\d+###[\s\S]*?###END###/g, '').trim();

    // Extract context from the full conversation (including new AI message)
    const fullConversation = [
      ...messages,
      { role: 'assistant', content: aiMessage },
    ];

    let extractedContext: ExtractedContext = { memories: [], emotions: [], partnerTraits: [] };
    try {
      const newContext = await extractContextFromConversation(
        fullConversation,
        OPENROUTER_API_KEY
      );

      // Merge with existing context
      const parsedExisting = existingContext
        ? parseExtractedContext(existingContext)
        : null;
      extractedContext = mergeContext(parsedExisting, newContext);
    } catch (error) {
      console.error('Context extraction failed:', error);
      // Use existing context if extraction fails
      extractedContext = (existingContext ? parseExtractedContext(existingContext) : null) ?? { memories: [], emotions: [], partnerTraits: [] };
    }

    // Calculate readiness score
    const scoreBreakdown = calculateReadinessScore(
      extractedContext,
      fullConversation
    );

    // Server logs: show last user + assistant visible reply
    if (lastUserMsg) {
      console.log(`user: ${singleLine(lastUserMsg)}`);
    }
    console.log(`aiagent: ${singleLine(visibleMessage)}`);

    // Build response
    const responseData: ConversationAgentResponse = {
      type: 'conversation',
      message: visibleMessage,  // Use message without concept lyrics block
      roundNumber: conversationRound + 1,
      readinessScore: scoreBreakdown.totalScore,
      extractedContext: extractedContext,
      conceptLyrics: conceptLyrics,  // Add concept lyrics to response
    };

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error('Conversation API error:', error);

    // User-friendly Dutch error messages
    const errorMessage =
      error.message === 'OpenRouter API error'
        ? 'Sorry, ik kon je niet goed verstaan. Kun je het opnieuw proberen?'
        : 'Er is iets misgegaan. Probeer het alsjeblieft opnieuw.';

    return NextResponse.json(
      { error: errorMessage, details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Parse concept lyrics from AI message
 * Format: ###CONCEPT_LYRICS v{N}###\n{JSON}\n###END###
 */
function parseConceptLyrics(message: string): any | null {
  try {
    const match = message.match(/###CONCEPT_LYRICS v(\d+)###\s*([\s\S]*?)\s*###END###/);
    if (!match) {
      return null;
    }

    const jsonContent = match[2].trim();
    const parsed = JSON.parse(jsonContent);

    return {
      version: parsed.version || parseInt(match[1]),
      title: parsed.title || 'Liefdesliedje',
      lyrics: parsed.lyrics || '',
      style: parsed.style || 'romantic ballad',
      notes: parsed.notes || '',
    };
  } catch (error) {
    console.error('Failed to parse concept lyrics:', error);
    return null;
  }
}
