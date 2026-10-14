import Anthropic from '@anthropic-ai/sdk';
import { jsonSchemaOutputFormat } from '@anthropic-ai/sdk/helpers/json-schema';
import {
  CLAUDE_MODEL,
  CLAUDE_EFFORT_CHAT,
  CLAUDE_EFFORT_ANALYSIS,
  CLAUDE_MAX_TOKENS,
  CLAUDE_TIMEOUT_MS,
} from './config.js';
import type { LlmClient } from './llm.js';
import { buildAnalysisSchema } from './prompts/analysis.js';

/**
 * Client Claude (Messages API, @anthropic-ai/sdk). Raisonnement adaptatif,
 * effort medium pour le dialogue, high pour le bilan, bilan en sortie
 * structurée par schéma JSON.
 *
 * Un 429 (limite de connexions simultanées du workspace) bascule l'appel en
 * cours sur le client de repli (DeepSeek), sans nouvel appel Claude.
 */
export const createClaudeClient = (apiKey: string, fallback: LlmClient): LlmClient => {
  // maxRetries à 0 : sinon le SDK relancerait de lui-même après une expiration.
  const client = new Anthropic({ apiKey, timeout: CLAUDE_TIMEOUT_MS, maxRetries: 0 });

  const call = async (
    label: string,
    params: Anthropic.MessageCreateParamsNonStreaming,
    onRateLimit: () => Promise<string>
  ): Promise<string> => {
    const started = Date.now();
    let response: Anthropic.Message;
    try {
      response = await client.messages.create(params);
    } catch (err) {
      if (err instanceof Anthropic.RateLimitError) {
        console.warn(`Repli sur DeepSeek pour ${label} : Claude 429, limite de connexions simultanées atteinte`);
        return onRateLimit();
      }
      throw err;
    }

    const u = response.usage;
    console.info(
      `${label} Claude ${CLAUDE_MODEL} effort=${params.output_config?.effort} : ` +
        `${Math.round((Date.now() - started) / 1000)} s, stop=${response.stop_reason}, ` +
        `entrée=${u.input_tokens}, sortie=${u.output_tokens}, ` +
        `cache créé=${u.cache_creation_input_tokens ?? 0}, cache lu=${u.cache_read_input_tokens ?? 0}`
    );

    if (response.stop_reason === 'refusal') {
      throw new Error(`Claude a refusé la requête (${response.stop_details?.category ?? 'sans catégorie'})`);
    }
    return response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('');
  };

  return {
    chat(req) {
      return call(
        'Dialogue',
        {
          model: CLAUDE_MODEL,
          max_tokens: CLAUDE_MAX_TOKENS,
          // Deux points de cache : les instructions (partagées par toutes les
          // sessions d'un même mode), puis le corpus et le sujet (stables sur
          // la session). L'historique varie et reste après.
          system: [
            { type: 'text', text: req.system.instructions, cache_control: { type: 'ephemeral' } },
            { type: 'text', text: req.system.session, cache_control: { type: 'ephemeral' } },
          ],
          messages: req.messages,
          thinking: { type: 'adaptive' },
          output_config: { effort: CLAUDE_EFFORT_CHAT },
        },
        () => fallback.chat(req)
      );
    },
    analysis(prompt) {
      return call(
        'Bilan',
        {
          model: CLAUDE_MODEL,
          max_tokens: CLAUDE_MAX_TOKENS,
          messages: [{ role: 'user', content: prompt }],
          thinking: { type: 'adaptive' },
          output_config: {
            effort: CLAUDE_EFFORT_ANALYSIS,
            format: jsonSchemaOutputFormat(buildAnalysisSchema()),
          },
        },
        () => fallback.analysis(prompt)
      );
    },
  };
};
