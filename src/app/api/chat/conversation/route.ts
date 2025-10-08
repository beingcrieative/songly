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
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'google/gemini-2.5-flash-lite';

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

    // Build conversation history for OpenRouter
    const conversationHistory = [
      { role: 'system', content: CONVERSATION_AGENT_SYSTEM_PROMPT },
      ...messages.map((m: any) => ({
        role: m.role,
        content: m.content,
      })),
    ];

    // Call OpenRouter with conversation agent
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://liefdesliedje.app',
        'X-Title': 'Liefdesliedje Maker - Conversation',
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: conversationHistory,
        temperature: 0.8, // Slightly higher for more natural conversation
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      // Handle rate limiting gracefully
      if (response.status === 429) {
        return NextResponse.json(
          {
            error: 'Even geduld, we hebben te veel aanvragen ontvangen. Probeer het over een paar seconden opnieuw.',
            rateLimited: true
          },
          { status: 429 }
        );
      }

      throw new Error(errorData.error?.message || 'OpenRouter API error');
    }

    const data = await response.json();
    const aiMessage = data.choices?.[0]?.message?.content || '';

    if (!aiMessage) {
      throw new Error('No response from conversation agent');
    }

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

    // Build response
    const responseData: ConversationAgentResponse = {
      type: 'conversation',
      message: aiMessage,
      roundNumber: conversationRound + 1,
      readinessScore: scoreBreakdown.totalScore,
      extractedContext: extractedContext,
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
