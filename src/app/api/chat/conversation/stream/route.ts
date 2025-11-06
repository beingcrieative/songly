import { NextRequest } from 'next/server';
import { CONVERSATION_AGENT_SYSTEM_PROMPT } from '@/lib/prompts/conversationAgent';
import {
  extractContextFromConversation,
  mergeContext,
  parseExtractedContext,
} from '@/lib/utils/contextExtraction';
import { calculateReadinessScore } from '@/lib/utils/readinessScore';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
// Remove API key from logs for security
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'openai/gpt-oss-20b:free';

function getCandidateModels(): string[] {
  const preferred = process.env.OPENROUTER_MODEL?.trim();
  const candidates = [
    preferred && preferred.length ? preferred : undefined,
    'google/gemini-2.5-flash-lite',
    'deepseek/deepseek-chat-v3.1:free',
    'openai/gpt-oss-20b:free',
  ].filter(Boolean) as string[];
  // De-duplicate while preserving order
  return Array.from(new Set(candidates));
}

function isCreditError(status: number, errorMessage: string | undefined): boolean {
  if (status === 402) return true;
  const msg = (errorMessage || '').toLowerCase();
  return msg.includes('insufficient') && msg.includes('credit');
}

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  // Validate API key early
  if (!OPENROUTER_API_KEY || OPENROUTER_API_KEY.trim() === '') {
    return new Response('event: error\n' + 'data: OPENROUTER_API_KEY is not set. Please configure it in your .env file and restart the dev server.\n\n', {
      status: 500,
      headers: sseHeaders(),
    });
  }

  const { messages, conversationRound = 0, existingContext = null } = await request.json();

  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response('event: error\n' + 'data: Messages array is required\n\n', {
      status: 400,
      headers: sseHeaders(),
    });
  }

  const encoder = new TextEncoder();
  const singleLine = (s: string) => (s || '').replace(/[\r\n]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
  const lastUserMsg = Array.isArray(messages)
    ? [...messages].reverse().find((m: any) => m?.role === 'user')?.content || ''
    : '';
  let fullText = '';

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        // Build conversation
        const conversationHistory = [
          { role: 'system', content: CONVERSATION_AGENT_SYSTEM_PROMPT },
          ...messages.map((m: any) => ({ role: m.role, content: m.content })),
        ];

        // Try multiple models (similar to non-streaming route)
        const models = getCandidateModels();
        let lastError: any = null;
        let streamSuccess = false;

        for (const model of models) {
          try {
            // Call OpenRouter with streaming enabled (OpenAI-compatible SSE)
            const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://liefdesliedje.app',
                'X-Title': 'Liefdesliedje Maker - Conversation (stream)',
              },
              body: JSON.stringify({
                model,
                messages: conversationHistory,
                temperature: 0.8,
                stream: true,
              }),
            });

            if (!res.ok || !res.body) {
              const err = await safeReadError(res);
              
              // Handle authentication errors
              if (res.status === 401) {
                const improvedError = err.includes('User not found') || err.includes('Invalid API key')
                  ? 'OpenRouter API key is invalid or expired. Please check your OPENROUTER_API_KEY in .env file and restart the dev server.'
                  : `OpenRouter authentication failed: ${err}`;
                lastError = new Error(improvedError);
                // Don't try other models if auth fails
                break;
              }
              
              // Handle credit errors - try next free model
              if (isCreditError(res.status, err)) {
                lastError = new Error(err);
                console.log(`[Stream] Credit error with ${model}, trying next free model...`);
                continue; // Try next model
              }
              
              lastError = new Error(err);
              continue; // Try next model
            }

            // Success! Process the stream
            streamSuccess = true;

            const reader = res.body.getReader();
            let buffer = '';

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              buffer += new TextDecoder().decode(value, { stream: true });

              const parts = buffer.split('\n\n');
              buffer = parts.pop() || '';
              for (const part of parts) {
                const line = part.split('\n').find((l) => l.startsWith('data: '));
                if (!line) continue;
                const data = line.slice(6).trim();
                if (data === '[DONE]') {
                  // Finish: emit meta
                  const meta = await buildFinalMeta(messages, fullText, conversationRound, existingContext);
                  // Server logs: show last user + assistant visible reply
                  if (lastUserMsg) {
                    console.log(`user: ${singleLine(lastUserMsg)}`);
                  }
                  console.log(`aiagent: ${singleLine(meta.message)}`);
                  console.log('[DEBUG] Emitting meta event:', {
                    messageLength: meta.message?.length || 0,
                    readinessScore: meta.readinessScore,
                    extractedContextKeys: meta.extractedContext ? Object.keys(meta.extractedContext) : [],
                  });
                  controller.enqueue(encoder.encode(`event: meta\n` + `data: ${escapeSse(JSON.stringify(meta))}\n\n`));
                  continue;
                }
                try {
                  const json = JSON.parse(data);
                  const choice = json?.choices?.[0] || {};
                  const delta: string = choice?.delta?.content || '';
                  if (delta) {
                    fullText += delta;
                    controller.enqueue(encoder.encode(`event: delta\n` + `data: ${escapeSse(JSON.stringify({ text: delta }))}\n\n`));
                  }
                } catch (_) {
                  // Ignore malformed chunk
                }
              }
            }

            controller.close();
            return; // Success - exit the loop
          } catch (err: any) {
            // Network or parsing error - try next model
            lastError = err;
            console.log(`[Stream] Error with ${model}, trying next model...`);
            continue;
          }
        }

        // If we get here, all models failed
        if (!streamSuccess && lastError) {
          const errorMsg = lastError.message || 'OpenRouter request failed';
          // Improve credit error message
          if (errorMsg.includes('Insufficient credits') || errorMsg.includes('credits')) {
            const creditError = 'Je OpenRouter account heeft onvoldoende credits. Alle modellen geprobeerd, geen gratis modellen beschikbaar. Voeg credits toe via https://openrouter.ai/settings/credits';
            controller.enqueue(encoder.encode(`event: error\n` + `data: ${escapeSse(creditError)}\n\n`));
          } else {
            controller.enqueue(encoder.encode(`event: error\n` + `data: ${escapeSse(errorMsg)}\n\n`));
          }
        }
        controller.close();
      } catch (err: any) {
        controller.enqueue(encoder.encode(`event: error\n` + `data: ${escapeSse(err?.message || 'stream error')}\n\n`));
        controller.close();
      }
    },
  });

  return new Response(stream, { headers: sseHeaders() });
}

function sseHeaders() {
  return {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  } as Record<string, string>;
}

async function safeReadError(res: Response): Promise<string> {
  try {
    const j = await res.json();
    return j?.error?.message || JSON.stringify(j);
  } catch {
    try { return await res.text(); } catch { return `HTTP ${res.status}`; }
  }
}

function escapeSse(s: string): string {
  // Best-effort to keep one-line JSON for SSE data
  return s.replace(/\n/g, ' ').replace(/\r/g, ' ').trim();
}

async function buildFinalMeta(
  messages: any[],
  aiMessage: string,
  conversationRound: number,
  existingContext: string | null,
) {
  // No concept lyrics extraction - just use the message as-is
  const visibleMessage = aiMessage.trim();

  // Compute context & readiness
  let extractedContext = (existingContext ? parseExtractedContext(existingContext) : null) ?? { memories: [], emotions: [], partnerTraits: [] };
  try {
    const fullConv = [...messages, { role: 'assistant', content: aiMessage }];
    const newCtx = await extractContextFromConversation(fullConv, process.env.OPENROUTER_API_KEY || '');
    extractedContext = mergeContext(extractedContext, newCtx);
  } catch (e) {
    // keep existing context when extraction fails
  }

  const score = calculateReadinessScore(extractedContext, [...messages, { role: 'assistant', content: aiMessage }]);

  return {
    message: visibleMessage,
    roundNumber: conversationRound + 1,
    readinessScore: score.totalScore,
    extractedContext,
    conceptLyrics: null, // No concept lyrics
  };
}

// Removed parseConceptLyrics function - no longer needed
