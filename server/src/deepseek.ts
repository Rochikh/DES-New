import { DEEPSEEK_URL } from './config.js';

/**
 * Client minimal de l'endpoint chat/completions de l'API DeepSeek
 * (surface compatible OpenAI). L'interface est injectable pour les tests
 * d'intégration.
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

export interface CompletionClient {
  create: (params: CompletionParams) => Promise<CompletionResponse>;
}

export const createDeepSeekClient = (apiKey: string): CompletionClient => ({
  async create(params) {
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

    return response.json() as Promise<CompletionResponse>;
  },
});
