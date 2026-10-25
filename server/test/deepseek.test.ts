import { describe, it, expect, vi, afterEach } from 'vitest';
import { createDeepSeekClient } from '../src/deepseek.js';

const completion = (content: string) =>
  new Response(JSON.stringify({ choices: [{ message: { content } }] }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });

const PREVIOUS = 'Que sais-tu de N ?\n---\nPlan: définir un groupe ; étapes : 1. neutre (critère) ; en cours : 1\nRégime: acquisition\nPhase: 1';

const req = {
  system: { instructions: 'Consignes', session: '<sujet>\nX\n</sujet>' },
  messages: [
    { role: 'user' as const, content: 'Bonjour' },
    { role: 'assistant' as const, content: PREVIOUS },
    { role: 'user' as const, content: 'Je ne sais pas.' },
  ],
};

/** Réponses successives de l'API, une par appel. */
const stubCompletions = (...contents: string[]) => {
  const fetchMock = vi.fn();
  contents.forEach((c) => fetchMock.mockResolvedValueOnce(completion(c)));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
};

const systemOf = (fetchMock: ReturnType<typeof vi.fn>, call: number): string =>
  JSON.parse(fetchMock.mock.calls[call][1].body).messages[0].content;

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('createDeepSeekClient : bloc technique', () => {
  it('renvoie la réponse sans nouvel appel quand le bloc est valide', async () => {
    const fetchMock = stubCompletions('Explication.\n---\nRégime: acquisition\nPhase: 2');

    const text = await createDeepSeekClient('cle-factice').chat(req);

    expect(text).toBe('Explication.\n---\nRégime: acquisition\nPhase: 2');
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('relance une fois avec un rappel du format quand le bloc manque', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const fetchMock = stubCompletions('Explication sans bloc.', 'Explication.\n---\nRégime: acquisition\nPhase: 1');

    const text = await createDeepSeekClient('cle-factice').chat(req);

    expect(text).toBe('Explication.\n---\nRégime: acquisition\nPhase: 1');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(systemOf(fetchMock, 0)).not.toContain('Rappel de format');
    expect(systemOf(fetchMock, 1)).toContain('Rappel de format');
  });

  it('conserve le bloc du tour précédent après deux échecs', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const fetchMock = stubCompletions('Première réponse sans bloc.', 'Seconde réponse sans bloc.');

    const text = await createDeepSeekClient('cle-factice').chat(req);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(text).toBe(
      'Seconde réponse sans bloc.\n---\nPlan: définir un groupe ; étapes : 1. neutre (critère) ; en cours : 1\nRégime: acquisition\nPhase: 1'
    );
  });
});

describe('createDeepSeekClient : langue arabe', () => {
  const BLOCK = '\n---\nRégime: acquisition\nPhase: 1';
  const arabicReq = {
    ...req,
    messages: [...req.messages.slice(0, 2), { role: 'user' as const, content: 'أظن أن ثاني أكسيد الكربون يحبس الحرارة؟' }],
  };
  const ARABIC = 'الغازات تمتص الأشعة تحت الحمراء. ما الذي يحدث للحرارة بعد ذلك؟';

  it("relance avec un rappel de langue quand la réponse à un message arabe est en français", async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const fetchMock = stubCompletions(`Les gaz absorbent les infrarouges. Que devient la chaleur ?${BLOCK}`, `${ARABIC}${BLOCK}`);

    const text = await createDeepSeekClient('cle-factice').chat(arabicReq);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(systemOf(fetchMock, 1)).toContain('Rappel de langue');
    expect(systemOf(fetchMock, 1)).not.toContain('Rappel de format');
    expect(text).toBe(`${ARABIC}${BLOCK}`);
  });

  it('relance quand la réponse mixte compte moins de 50 % de lettres arabes', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const mixed = `Je vois : nous allons partir du mécanisme de base de l'effet de serre, puis voir ce qui le renforce. ما رأيك؟${BLOCK}`;
    const fetchMock = stubCompletions(mixed, `${ARABIC}${BLOCK}`);

    await createDeepSeekClient('cle-factice').chat(arabicReq);

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('ne relance pas une réponse en arabe', async () => {
    const fetchMock = stubCompletions(`${ARABIC}${BLOCK}`);

    await createDeepSeekClient('cle-factice').chat(arabicReq);

    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('cumule les motifs dans un seul nouvel appel et renvoie la seconde réponse telle quelle', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const fetchMock = stubCompletions('Réponse en français sans bloc.', `Toujours en français.${BLOCK}`);

    const text = await createDeepSeekClient('cle-factice').chat(arabicReq);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(systemOf(fetchMock, 1)).toContain('Rappel de format');
    expect(systemOf(fetchMock, 1)).toContain('Rappel de langue');
    expect(text).toBe(`Toujours en français.${BLOCK}`);
  });
});

describe('createDeepSeekClient : questions multiples', () => {
  const BLOCK = '\n---\nRégime: épreuve\nPhase: 3';

  it('relance avec un rappel de style quand la réponse pose deux questions', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const fetchMock = stubCompletions(
      `Comment départager ces deux mécanismes ? Quel indice te ferait retenir l'un ?${BLOCK}`,
      `Quel indice te ferait retenir l'un des deux mécanismes ?${BLOCK}`
    );

    const text = await createDeepSeekClient('cle-factice').chat(req);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(systemOf(fetchMock, 1)).toContain('Rappel de style');
    expect(text).toBe(`Quel indice te ferait retenir l'un des deux mécanismes ?${BLOCK}`);
  });

  it('compte aussi le point d\'interrogation arabe et renvoie la seconde réponse même fautive', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const twice = `لماذا؟ وكيف؟${BLOCK}`;
    const fetchMock = stubCompletions(twice, twice);

    const text = await createDeepSeekClient('cle-factice').chat(req);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(text).toBe(twice);
  });

  it('ne relance pas une réponse à une seule question', async () => {
    const fetchMock = stubCompletions(`Une seule question ?${BLOCK}`);

    await createDeepSeekClient('cle-factice').chat(req);

    expect(fetchMock).toHaveBeenCalledOnce();
  });
});
