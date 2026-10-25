import { describe, it, expect, vi, afterEach } from 'vitest';
import { createClaudeClient } from '../src/claude.js';
import type { LlmClient } from '../src/llm.js';

const req = {
  system: { instructions: 'Consignes', session: '<sujet>\nX\n</sujet>' },
  messages: [{ role: 'user' as const, content: 'Bonjour' }],
};

/** Réponse d'erreur de l'API Anthropic, telle que le SDK la reçoit. */
const stubApiError = (status: number, type: string, message: string) => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ type: 'error', error: { type, message } }), {
        status,
        headers: { 'content-type': 'application/json' },
      })
    )
  );
};

const makeFallback = () => {
  const fallback: LlmClient = {
    chat: vi.fn().mockResolvedValue('Réponse DeepSeek\n---\nPhase: 0'),
    analysis: vi.fn().mockResolvedValue('{}'),
  };
  return fallback;
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('createClaudeClient : repli DeepSeek', () => {
  it('bascule sur le repli après un 429', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    stubApiError(429, 'rate_limit_error', 'Number of concurrent connections has exceeded your rate limit.');
    const fallback = makeFallback();

    const text = await createClaudeClient('cle-factice', fallback).chat(req);

    expect(text).toBe('Réponse DeepSeek\n---\nPhase: 0');
    expect(fallback.chat).toHaveBeenCalledWith(req);
  });

  it('bascule sur le repli quand le solde de crédits Anthropic est épuisé', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    stubApiError(
      400,
      'invalid_request_error',
      'Your credit balance is too low to access the Anthropic API. Please go to Plans & Billing to upgrade or purchase credits.'
    );
    const fallback = makeFallback();

    await createClaudeClient('cle-factice', fallback).analysis('Bilan');

    expect(fallback.analysis).toHaveBeenCalledWith('Bilan');
  });

  it('propage les autres erreurs 400', async () => {
    stubApiError(400, 'invalid_request_error', 'messages: field required');
    const fallback = makeFallback();

    await expect(createClaudeClient('cle-factice', fallback).chat(req)).rejects.toThrow(/field required/);
    expect(fallback.chat).not.toHaveBeenCalled();
  });
});
