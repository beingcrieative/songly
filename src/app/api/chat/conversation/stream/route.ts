import { NextRequest } from 'next/server';
import { CONVERSATION_AGENT_SYSTEM_PROMPT } from '@/lib/prompts/conversationAgent';
import {
  extractContextFromConversation,
  mergeContext,
  parseExtractedContext,
} from '@/lib/utils/contextExtraction';
import { calculateReadinessScore } from '@/lib/utils/readinessScore';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'openai/gpt-oss-20b:free';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
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
            model: OPENROUTER_MODEL,
            messages: conversationHistory,
            temperature: 0.8,
            stream: true,
          }),
        });

        if (!res.ok || !res.body) {
          const err = await safeReadError(res);
          controller.enqueue(encoder.encode(`event: error\n` + `data: ${escapeSse(err)}\n\n`));
          controller.close();
          return;
        }

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
  // Extract concept lyrics block
  const conceptLyrics = parseConceptLyrics(aiMessage);
  // Visible message without the concept block
  const visibleMessage = aiMessage.replace(/###CONCEPT_LYRICS v\d+###[\s\S]*?###END###/g, '').trim();

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
    conceptLyrics,
  };
}

function parseConceptLyrics(message: string): any | null {
  try {
    const match = message.match(/###CONCEPT_LYRICS v(\d+)###\s*([\s\S]*?)\s*###END###/);
    if (!match) return null;
    const jsonContent = match[2].trim();
    const parsed = JSON.parse(jsonContent);
    return {
      version: parsed.version || parseInt(match[1]),
      title: parsed.title || 'Liefdesliedje',
      lyrics: parsed.lyrics || '',
      style: parsed.style || 'romantic ballad',
      notes: parsed.notes || '',
    };
  } catch {
    return null;
  }
}
