import { DEEPSEEK_URL, MODEL_CHAT, MODEL_ANALYSIS } from './config.js';
import type { ChatRequest, LlmClient } from './llm.js';

/**
 * Client minimal de l'endpoint chat/completions de l'API DeepSeek
 * (surface compatible OpenAI). Fournisseur principal si AI_PROVIDER=deepseek,
 * repli de Claude sinon (429, crédits épuisés).
 *
 * Le champ `temperature` n'est jamais envoyé : on laisse la valeur par
 * défaut de l'API. Le raisonnement du modèle est facturé comme tokens de
 * sortie : prévoir un plafond généreux (max_tokens ET max_completion_tokens,
 * le nom exact du champ variant selon les surfaces compatibles OpenAI).
 *
 * DeepSeek omet parfois le bloc technique de fin de message (---, Plan,
 * Régime, Phase) et repasse parfois au français face à un message en arabe.
 * Un seul nouvel appel par tour, avec un rappel qui cumule les motifs. Après
 * un second échec, le dernier bloc valide de l'historique est recopié pour
 * que le client conserve Plan, Régime et Phase du tour précédent ; la langue
 * reste celle de la seconde réponse.
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

/** Bloc technique en fin de message : ---, [Plan:], [Régime:], Phase: N. */
const TECH_BLOCK = /\n---[ \t]*\n(Plan: .+\n)?(Régime: (acquisition|consolidation|épreuve)\n)?Phase: \d[ \t]*$/;

const FORMAT_REMINDER = `Rappel de format : termine obligatoirement ton message par le bloc technique, sur des lignes séparées et dans cet ordre : ---, puis la ligne Plan: et la ligne Régime: dès qu'ils sont fixés, puis Phase: [Numéro].`;

const LANGUAGE_REMINDER = `Rappel de langue : l'apprenant·e écrit en arabe. Rédige chaque phrase de ton message en arabe ; seuls les mots-clés du bloc technique restent en caractères latins.`;

/** Part des lettres arabes parmi les lettres arabes et latines du texte (0 sans lettre). */
const arabicShare = (text: string): number => {
  const arabic = (text.match(/[\u0600-\u06FF]/g) ?? []).length;
  const latin = (text.match(/[A-Za-zÀ-ÿ]/g) ?? []).length;
  return arabic + latin ? arabic / (arabic + latin) : 0;
};

/** Langue perdue : message de l'apprenant·e majoritairement arabe, réponse (hors bloc) à moins de 50 % d'arabe. */
const languageLost = (messages: ChatRequest['messages'], reply: string): boolean => {
  const learner = [...messages].reverse().find((m) => m.role === 'user');
  if (!learner || arabicShare(learner.content) <= 0.5) return false;
  return arabicShare(reply.trimEnd().replace(TECH_BLOCK, '')) < 0.5;
};

/** Dernier bloc technique valide des messages d'Argos, retour à la ligne initial compris. */
const lastTechBlock = (messages: ChatRequest['messages']): string | null => {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role !== 'assistant') continue;
    const match = messages[i].content.trimEnd().match(TECH_BLOCK);
    if (match) return match[0];
  }
  return null;
};

export const createDeepSeekClient = (apiKey: string): LlmClient => ({
  async chat({ system, messages }) {
    const ask = (reminder: string) =>
      create(apiKey, {
        model: MODEL_CHAT,
        max_tokens: 5120,
        max_completion_tokens: 5120,
        messages: [{ role: 'system', content: `${system.instructions}\n\n${system.session}${reminder}` }, ...messages],
      });

    const first = await ask('');
    const reminders = [
      ...(TECH_BLOCK.test(first.trimEnd()) ? [] : [FORMAT_REMINDER]),
      ...(languageLost(messages, first) ? [LANGUAGE_REMINDER] : []),
    ];
    if (!reminders.length) return first;
    console.warn(`DeepSeek : nouvel appel (${reminders.map((r) => r.split(' :')[0]).join(', ')})`);
    const second = await ask(`\n\n${reminders.join('\n')}`);
    if (TECH_BLOCK.test(second.trimEnd())) return second;
    console.warn('DeepSeek : bloc technique absent après rappel, bloc du tour précédent conservé');
    const previous = lastTechBlock(messages);
    return previous ? `${second.trimEnd()}${previous}` : second;
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
