import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import type { LlmClient } from '../src/llm.js';

const validAnalysis = {
  summary: 'Tu as défini le terme central dès le deuxième échange, ce qui a structuré la suite.',
  reasoningScore: 72,
  clarityScore: 65,
  skepticismScore: 58,
  processScore: 61,
  reflectionScore: 70,
  integrityScore: 88,
  rhythmBreakCount: 1,
  keyStrengths: ['Définitions précises', 'Reconnaissance des incertitudes'],
  weaknesses: ['Peu de contre-exemples spontanés'],
  scoreRationales: {
    reasoning: 'La relation cause-effet sur le marché du travail était articulée sans contradiction.',
    clarity: 'Le terme « automatisation » a été défini avec tes propres mots en phase 1.',
    skepticism: 'Tu as demandé une source avant d\'accepter la statistique avancée par Argos.',
    process: 'Le biais de confirmation évoqué en phase 3 a été repéré puis contourné.',
    reflection: 'La position adverse a été reformulée au plus fort en phase 4.',
    integrity: 'Tu as reconnu deux fois ne pas savoir, sans chercher à masquer.',
  },
};

const makeMock = (payload: unknown = validAnalysis) => {
  const analysis = vi.fn().mockResolvedValue(JSON.stringify(payload));
  const client: LlmClient = { chat: vi.fn(), analysis };
  return { client, analysis };
};

const validBody = {
  topic: "L'impact de l'IA sur l'emploi",
  aiDeclaration: 'Aucun usage déclaré.',
  transcript: [
    { role: 'model', text: 'Quel est ton objet ?\n---\nPhase: 0' },
    { role: 'user', text: 'Je veux comprendre si l\'IA détruit des emplois.', responseTimeSeconds: 42 },
  ],
};

describe('POST /api/analysis', () => {
  it('répond 200 avec les 6 scores, rhythmBreakCount et scoreRationales complet', async () => {
    const { client, analysis } = makeMock();
    const app = createApp(client);

    const res = await request(app).post('/api/analysis').send(validBody);

    expect(res.status).toBe(200);
    expect(res.body.summary).toBe(validAnalysis.summary);
    for (const key of [
      'reasoningScore',
      'clarityScore',
      'skepticismScore',
      'processScore',
      'reflectionScore',
      'integrityScore',
    ]) {
      expect(res.body[key]).toBeTypeOf('number');
    }
    expect(res.body.rhythmBreakCount).toBe(1);
    expect(Object.keys(res.body.scoreRationales)).toEqual(
      expect.arrayContaining(['reasoning', 'clarity', 'skepticism', 'process', 'reflection', 'integrity'])
    );
    expect(analysis).toHaveBeenCalledOnce();
    expect(analysis.mock.calls[0][0]).toContain("L'impact de l'IA sur l'emploi");
  });

  it('borne les scores hors limites dans [0, 100]', async () => {
    const { client } = makeMock({ ...validAnalysis, reasoningScore: 150, clarityScore: -20 });
    const app = createApp(client);

    const res = await request(app).post('/api/analysis').send(validBody);

    expect(res.body.reasoningScore).toBe(100);
    expect(res.body.clarityScore).toBe(0);
  });

  it('réessaie une fois après un échec transitoire puis répond 200', async () => {
    const analysis = vi
      .fn()
      .mockRejectedValueOnce(new Error('transient'))
      .mockResolvedValueOnce(JSON.stringify(validAnalysis));
    const app = createApp({ chat: vi.fn(), analysis });

    const res = await request(app).post('/api/analysis').send(validBody);

    expect(res.status).toBe(200);
    expect(analysis).toHaveBeenCalledTimes(2);
  });

  it('renvoie 502 si le JSON est invalide deux fois', async () => {
    const analysis = vi.fn().mockResolvedValue('pas du JSON');
    const app = createApp({ chat: vi.fn(), analysis });

    const res = await request(app).post('/api/analysis').send(validBody);

    expect(res.status).toBe(502);
    expect(analysis).toHaveBeenCalledTimes(2);
  });

  it('refuse un transcript vide (400)', async () => {
    const app = createApp(makeMock().client);
    const res = await request(app).post('/api/analysis').send({ ...validBody, transcript: [] });
    expect(res.status).toBe(400);
  });
});
