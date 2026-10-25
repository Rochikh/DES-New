import type { LlmClient } from './llm.js';

/**
 * Repli quand AI_PROVIDER=deepseek : une erreur DeepSeek 402 (solde
 * insuffisant), 429 ou 5xx, ou un tour qui dépasse le délai (nouvel appel
 * des garde-fous compris), bascule l'appel sur le client de repli (Claude).
 * Les autres erreurs sont propagées.
 */
const isUnavailable = (err: unknown): boolean =>
  err instanceof Error && (err.name === 'TimeoutError' || /^DeepSeek (402|429|5\d\d):/.test(err.message));

const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> => {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      const err = new Error(`DeepSeek : délai de ${Math.round(ms / 1000)} s dépassé`);
      err.name = 'TimeoutError';
      reject(err);
    }, ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
};

export const withFallback = (primary: LlmClient, fallback: LlmClient, timeoutMs: number): LlmClient => {
  const call = async (label: string, run: (c: LlmClient) => Promise<string>): Promise<string> => {
    try {
      return await withTimeout(run(primary), timeoutMs);
    } catch (err) {
      if (!isUnavailable(err)) throw err;
      console.warn(`Repli sur Claude pour ${label} : ${(err as Error).message.slice(0, 120)}`);
      return run(fallback);
    }
  };
  return {
    chat: (req) => call('Dialogue', (c) => c.chat(req)),
    analysis: (prompt) => call('Bilan', (c) => c.analysis(prompt)),
  };
};
