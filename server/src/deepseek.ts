import { DEEPSEEK_URL, MODEL_CHAT, MODEL_ANALYSIS } from './config.js';
import type { LlmClient } from './llm.js';

/**
 * Client minimal de l'endpoint chat/completions de l'API DeepSeek
 * (surface compatible OpenAI). Fournisseur principal si AI_PROVIDER=deepseek,
 * repli de Claude sur 429 sinon.
 *
 * Le champ `temperature` n'est jamais envoyé : on laisse la valeur par
 * défaut de l'API. Le raisonnement du modèle est facturé comme tokens de
 * sortie : prévoir un plafond généreux (max_tokens ET max_completion_tokens,
 * le nom exact du champ variant selon les surfaces compatibles OpenAI).
 */

export interface CompletionMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface CompletionParams {
  model: string;
  messages: CompletionMessage[];
  temperature?: number;
  max_tokens?: number;
  max_completion_tokens?: number;
  response_format?: { type: 'json_object' };
}

export interface CompletionResponse {
  choices: Array<{ message: { content: string } }>;
}

const create = async (apiKey: string, params: CompletionParams): Promise<string> => {
  const response = await fetch(DEEPSEEK_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`DeepSeek ${response.status}: ${detail.slice(0, 500)}`);
  }

  const data = (await response.json()) as CompletionResponse;
  return data.choices?.[0]?.message?.content ?? '';
};

export const createDeepSeekClient = (apiKey: string): LlmClient => ({
  chat({ system, messages }) {
    return create(apiKey, {
      model: MODEL_CHAT,
      max_tokens: 5120,
      max_completion_tokens: 5120,
      messages: [{ role: 'system', content: `${system.instructions}\n\n${system.session}` }, ...messages],
    });
  },
  analysis(prompt) {
    return create(apiKey, {
      model: MODEL_ANALYSIS,
      max_tokens: 6144,
      max_completion_tokens: 6144,
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: prompt }],
    });
  },
});
