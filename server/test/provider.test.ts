import { describe, it, expect, vi, afterEach } from 'vitest';
import { withFallback } from '../src/provider.js';
import type { LlmClient } from '../src/llm.js';

const req = {
  system: { instructions: 'Consignes', session: '<sujet>\nX\n</sujet>' },
  messages: [{ role: 'user' as const, content: 'Bonjour' }],
};

const makeClients = (primaryChat: () => Promise<string>) => {
  const primary: LlmClient = { chat: vi.fn(primaryChat), analysis: vi.fn(primaryChat) };
  const fallback: LlmClient = {
    chat: vi.fn().mockResolvedValue('Réponse Claude\n---\nPhase: 0'),
    analysis: vi.fn().mockResolvedValue('{}'),
  };
  return { primary, fallback };
};

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('withFallback : repli DeepSeek vers Claude', () => {
  it('renvoie la réponse DeepSeek sans appeler Claude', async () => {
    const { primary, fallback } = makeClients(() => Promise.resolve('Réponse DeepSeek\n---\nPhase: 0'));

    expect(await withFallback(primary, fallback, 1000).chat(req)).toBe('Réponse DeepSeek\n---\nPhase: 0');
    expect(fallback.chat).not.toHaveBeenCalled();
  });

  it.each(['DeepSeek 429: rate limit', 'DeepSeek 503: service unavailable', 'DeepSeek 500: internal error'])(
    'bascule sur Claude après « %s »',
    async (message) => {
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      const { primary, fallback } = makeClients(() => Promise.reject(new Error(message)));

      expect(await withFallback(primary, fallback, 1000).chat(req)).toBe('Réponse Claude\n---\nPhase: 0');
      expect(fallback.chat).toHaveBeenCalledWith(req);
    }
  );

  it('bascule sur Claude quand le tour dépasse le délai', async () => {
    vi.useFakeTimers();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { primary, fallback } = makeClients(() => new Promise<string>(() => {}));

    const pending = withFallback(primary, fallback, 1000).analysis('Bilan');
    await vi.advanceTimersByTimeAsync(1000);

    expect(await pending).toBe('{}');
    expect(fallback.analysis).toHaveBeenCalledWith('Bilan');
  });

  it('propage les autres erreurs DeepSeek', async () => {
    const { primary, fallback } = makeClients(() => Promise.reject(new Error('DeepSeek 400: invalid request')));

    await expect(withFallback(primary, fallback, 1000).chat(req)).rejects.toThrow(/DeepSeek 400/);
    expect(fallback.chat).not.toHaveBeenCalled();
  });
});
