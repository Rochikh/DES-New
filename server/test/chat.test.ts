import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { createApp, type AnthropicLike } from '../src/app.js';

const FAKE_KEY = 'sk-ant-test-cle-factice-000';
process.env.ANTHROPIC_API_KEY = FAKE_KEY;

const makeMock = (text = 'Bonjour. Quel est ton objectif ?\n---\nPhase: 0') => {
  const create = vi.fn().mockResolvedValue({
    content: [{ type: 'text', text }],
  });
  const client: AnthropicLike = { messages: { create } };
  return { client, create };
};

const validBody = {
  mode: 'TUTOR',
  topic: "L'impact de l'IA sur l'emploi",
  history: [],
  message: 'Bonjour Argos, je suis Alex. Lancez la session.',
};

describe('POST /api/chat', () => {
  it('répond 200 avec le texte contenant le marqueur de phase', async () => {
    const { client, create } = makeMock();
    const app = createApp(client);

    const res = await request(app).post('/api/chat').send(validBody);

    expect(res.status).toBe(200);
    expect(res.body.text).toMatch(/---\s*\nPhase:\s*\d/);
    expect(create).toHaveBeenCalledOnce();
    const params = create.mock.calls[0][0];
    expect(params.model).toBe('claude-haiku-4-5-20251001');
    expect(params.system).toContain('Phase: [Numéro]');
    expect(params.system).toContain("L'impact de l'IA sur l'emploi");
  });

  it('transmet le mode Critique dans le prompt système', async () => {
    const { client, create } = makeMock();
    const app = createApp(client);

    await request(app).post('/api/chat').send({ ...validBody, mode: 'CRITIC' });

    expect(create.mock.calls[0][0].system).toContain('Mode : Critique');
  });

  it('convertit l\'historique et garantit un premier tour utilisateur', async () => {
    const { client, create } = makeMock();
    const app = createApp(client);

    // Session importée : commence par la première réplique d'Argos
    await request(app).post('/api/chat').send({
      ...validBody,
      history: [
        { role: 'model', text: 'Quel est ton objet de recherche ?\n---\nPhase: 0' },
        { role: 'user', text: 'Je veux comprendre le sujet X.' },
      ],
    });

    const messages = create.mock.calls[0][0].messages;
    expect(messages[0].role).toBe('user');
    expect(messages[1].role).toBe('assistant');
    expect(messages.at(-1)).toEqual({ role: 'user', content: validBody.message });
  });

  it('refuse un mode inconnu (400)', async () => {
    const app = createApp(makeMock().client);
    const res = await request(app).post('/api/chat').send({ ...validBody, mode: 'EXAMINER' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeTruthy();
  });

  it('refuse un historique non-tableau (400)', async () => {
    const app = createApp(makeMock().client);
    const res = await request(app).post('/api/chat').send({ ...validBody, history: 'oops' });
    expect(res.status).toBe(400);
  });

  it('refuse un message trop long (400)', async () => {
    const app = createApp(makeMock().client);
    const res = await request(app)
      .post('/api/chat')
      .send({ ...validBody, message: 'x'.repeat(4001) });
    expect(res.status).toBe(400);
  });

  it('renvoie 500 propre si le SDK échoue', async () => {
    const create = vi.fn().mockRejectedValue(new Error('boom'));
    const app = createApp({ messages: { create } });
    const res = await request(app).post('/api/chat').send(validBody);
    expect(res.status).toBe(500);
    expect(res.body.error).toBeTruthy();
  });

  it('applique le rate limit (429 au-delà du plafond)', async () => {
    const app = createApp(makeMock().client, { rateLimitMax: 3 });
    for (let i = 0; i < 3; i++) {
      const ok = await request(app).post('/api/chat').send(validBody);
      expect(ok.status).toBe(200);
    }
    const blocked = await request(app).post('/api/chat').send(validBody);
    expect(blocked.status).toBe(429);
  });

  it('ne laisse jamais fuiter la clé API dans une réponse', async () => {
    const create = vi.fn().mockRejectedValue(new Error(`auth failed for ${FAKE_KEY}`));
    const app = createApp({ messages: { create } });
    const res = await request(app).post('/api/chat').send(validBody);
    expect(JSON.stringify(res.body)).not.toContain(FAKE_KEY);
    expect(JSON.stringify(res.headers)).not.toContain(FAKE_KEY);
  });
});
