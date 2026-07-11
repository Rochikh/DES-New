import { OPENROUTER_URL } from './config.js';

/**
 * Client minimal de l'endpoint chat/completions d'OpenRouter (API compatible
 * OpenAI). L'interface est injectable pour les tests d'intégration.
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
  response_format?: { type: 'json_object' };
}

export interface CompletionResponse {
  choices: Array<{ message: { content: string } }>;
}

export interface CompletionClient {
  create: (params: CompletionParams) => Promise<CompletionResponse>;
}

export const createOpenRouterClient = (apiKey: string): CompletionClient => ({
  async create(params) {
    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://ia-des.rochane.fr',
        'X-Title': 'Argos Socratique',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new Error(`OpenRouter ${response.status}: ${detail.slice(0, 500)}`);
    }

    return response.json() as Promise<CompletionResponse>;
  },
});
