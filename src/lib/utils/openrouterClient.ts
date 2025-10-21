export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const LLM_DEBUG = (process.env.LLM_DEBUG || '').toLowerCase() === 'true' || process.env.LLM_DEBUG === '1';
const LLM_DEBUG_MAX = Number.parseInt(process.env.LLM_DEBUG_MAX || '600');

function truncate(str: any, max = LLM_DEBUG_MAX): string {
  const s = typeof str === 'string' ? str : JSON.stringify(str);
  if (!s) return '';
  return s.length > max ? s.slice(0, max) + ` …(+${s.length - max} more)` : s;
}

function safeMessages(messages: ChatMessage[]) {
  return messages.map((m, i) => ({
    idx: i,
    role: m.role,
    content: truncate(m.content),
    length: (m.content || '').length,
  }));
}

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

export async function openrouterChatCompletion(params: {
  messages: ChatMessage[];
  temperature?: number;
  title?: string;
  maxTokens?: number;
}): Promise<any> {
  const { messages, temperature, title = 'Liefdesliedje Maker', maxTokens } = params;
  const models = getCandidateModels();
  let lastError: any = null;

  for (const model of models) {
    try {
      if (LLM_DEBUG) {
        console.debug('[LLM][request]', {
          model,
          title,
          temperature,
          messages: safeMessages(messages),
          count: messages.length,
        });
      }
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://liefdesliedje.app',
          'X-Title': title,
        },
        body: JSON.stringify({
          model,
          messages,
          ...(typeof temperature === 'number' ? { temperature } : {}),
          ...(typeof maxTokens === 'number' ? { max_tokens: Math.max(1, Math.min(4000, Math.floor(maxTokens))) } : {}),
          route: 'fallback',
        }),
      });

      if (!res.ok) {
        let errorData: any = {};
        try { errorData = await res.json(); } catch {}
        if (LLM_DEBUG) {
          console.debug('[LLM][response-error]', {
            model,
            status: res.status,
            error: truncate(errorData?.error?.message || res.statusText || 'Unknown error', 400),
          });
        }
        if (isCreditError(res.status, errorData?.error?.message)) {
          lastError = new Error(errorData?.error?.message || 'Insufficient credits');
          continue; // try next free model
        }
        throw new Error(errorData?.error?.message || `OpenRouter error (${res.status})`);
      }

      const json = await res.json();
      if (LLM_DEBUG) {
        const choice = json?.choices?.[0] || {};
        const content = choice?.message?.content ?? choice?.content ?? '';
        console.debug('[LLM][response-ok]', {
          model,
          finish_reason: choice?.finish_reason,
          usage: json?.usage || undefined,
          content: truncate(typeof content === 'string' ? content : JSON.stringify(content)),
        });
      }
      return json;
    } catch (err) {
      if (LLM_DEBUG) {
        console.debug('[LLM][client-error]', {
          model,
          error: truncate((err as any)?.message || String(err), 400),
        });
      }
      lastError = err;
    }
  }

  throw lastError || new Error('OpenRouter request failed');
}
