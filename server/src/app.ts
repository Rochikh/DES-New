import express, { type Express, type Request, type Response } from 'express';
import rateLimit from 'express-rate-limit';
import path from 'node:path';
import fs from 'node:fs';
import {
  MODEL_CHAT,
  MODEL_ANALYSIS,
  MAX_MESSAGE_LENGTH,
  MAX_HISTORY_MESSAGES,
  MAX_TOPIC_LENGTH,
  MAX_DECLARATION_LENGTH,
  MAX_TRANSCRIPT_MESSAGES,
  MAX_CORPUS_LENGTH,
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX,
} from './config.js';
import type { CompletionClient, CompletionMessage, CompletionResponse } from './moonshot.js';
import { buildChatSystemPrompt, type ChatMode } from './prompts/core.js';
import { buildAnalysisPrompt, type TranscriptEntry } from './prompts/analysis.js';

interface CreateAppOptions {
  /** Répertoire du build client à servir en statique (optionnel en test) */
  clientDist?: string;
  /** Plafond du rate limit, surchargeable en test */
  rateLimitMax?: number;
}

const isHistoryEntry = (m: unknown): m is { role: 'user' | 'model'; text: string } =>
  typeof m === 'object' &&
  m !== null &&
  ((m as { role: unknown }).role === 'user' || (m as { role: unknown }).role === 'model') &&
  typeof (m as { text: unknown }).text === 'string';

const extractText = (response: CompletionResponse): string =>
  response.choices?.[0]?.message?.content ?? '';

const stripJsonFences = (text: string): string =>
  text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');

const clampScore = (n: unknown): number =>
  Math.max(0, Math.min(100, Math.round(typeof n === 'number' && Number.isFinite(n) ? n : 0)));

export const createApp = (client: CompletionClient, options: CreateAppOptions = {}): Express => {
  const app = express();

  // Derrière Traefik : nécessaire pour que le rate limit voie l'IP réelle
  app.set('trust proxy', 1);
  // 2mb : le corpus de référence facultatif s'ajoute à l'historique.
  app.use(express.json({ limit: '2mb' }));

  const limiter = rateLimit({
    windowMs: RATE_LIMIT_WINDOW_MS,
    limit: options.rateLimitMax ?? RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Trop de requêtes, réessaie dans une minute.' },
  });
  app.use('/api', limiter);

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok' });
  });

  app.post('/api/chat', async (req: Request, res: Response) => {
    const { mode, topic, history, message, corpus } = req.body ?? {};

    if (mode !== 'TUTOR' && mode !== 'CRITIC') {
      res.status(400).json({ error: 'Mode invalide.' });
      return;
    }
    if (typeof topic !== 'string' || !topic.trim() || topic.length > MAX_TOPIC_LENGTH) {
      res.status(400).json({ error: 'Sujet invalide.' });
      return;
    }
    if (typeof message !== 'string' || !message.trim() || message.length > MAX_MESSAGE_LENGTH) {
      res.status(400).json({ error: 'Message invalide.' });
      return;
    }
    if (corpus !== undefined && (typeof corpus !== 'string' || corpus.length > MAX_CORPUS_LENGTH)) {
      res.status(400).json({ error: 'Corpus invalide.' });
      return;
    }
    if (
      !Array.isArray(history) ||
      history.length > MAX_HISTORY_MESSAGES ||
      !history.every(isHistoryEntry)
    ) {
      res.status(400).json({ error: 'Historique invalide.' });
      return;
    }

    const messages: CompletionMessage[] = [
      { role: 'system', content: buildChatSystemPrompt(mode as ChatMode, topic, typeof corpus === 'string' ? corpus : undefined) },
      ...history.map((m) => ({
        role: m.role === 'model' ? ('assistant' as const) : ('user' as const),
        content: m.text,
      })),
      { role: 'user', content: message },
    ];
    // Robustesse inter-fournisseurs : certains backends exigent un tour
    // utilisateur avant le premier tour assistant ; une session importée
    // peut commencer par la première réplique d'Argos.
    if (messages[1]?.role === 'assistant') {
      messages.splice(1, 0, { role: 'user', content: '(Reprise de session)' });
    }

    try {
      const response = await client.create({
        model: MODEL_CHAT,
        max_tokens: 5120,
        max_completion_tokens: 5120,
        messages,
      });
      res.json({ text: extractText(response) });
    } catch (err) {
      console.error('Erreur /api/chat:', err);
      res.status(500).json({ error: 'Argos est momentanément indisponible.' });
    }
  });

  app.post('/api/analysis', async (req: Request, res: Response) => {
    const { topic, aiDeclaration, transcript } = req.body ?? {};

    if (typeof topic !== 'string' || !topic.trim() || topic.length > MAX_TOPIC_LENGTH) {
      res.status(400).json({ error: 'Sujet invalide.' });
      return;
    }
    if (typeof aiDeclaration !== 'string' || aiDeclaration.length > MAX_DECLARATION_LENGTH) {
      res.status(400).json({ error: 'Déclaration invalide.' });
      return;
    }
    if (
      !Array.isArray(transcript) ||
      transcript.length === 0 ||
      transcript.length > MAX_TRANSCRIPT_MESSAGES ||
      !transcript.every(isHistoryEntry)
    ) {
      res.status(400).json({ error: 'Transcription invalide.' });
      return;
    }

    const analysisMode = req.body?.mode === 'CRITIC' ? 'CRITIC' : 'TUTOR';
    const prompt = buildAnalysisPrompt(analysisMode, topic, aiDeclaration, transcript as TranscriptEntry[]);

    const runAnalysis = async () => {
      const response = await client.create({
        model: MODEL_ANALYSIS,
        max_tokens: 6144,
        max_completion_tokens: 6144,
        response_format: { type: 'json_object' },
        messages: [{ role: 'user', content: prompt }],
      });
      return JSON.parse(stripJsonFences(extractText(response)));
    };

    try {
      let parsed;
      try {
        parsed = await runAnalysis();
      } catch {
        // Une seconde tentative absorbe les échecs transitoires (réseau,
        // sortie tronquée) avant de renvoyer une erreur à l'apprenant·e.
        parsed = await runAnalysis();
      }

      res.json({
        summary: typeof parsed.summary === 'string' ? parsed.summary : '',
        reasoningScore: clampScore(parsed.reasoningScore),
        clarityScore: clampScore(parsed.clarityScore),
        skepticismScore: clampScore(parsed.skepticismScore),
        processScore: clampScore(parsed.processScore),
        reflectionScore: clampScore(parsed.reflectionScore),
        integrityScore: clampScore(parsed.integrityScore),
        rhythmBreakCount: Math.max(0, Math.round(Number(parsed.rhythmBreakCount) || 0)),
        keyStrengths: Array.isArray(parsed.keyStrengths) ? parsed.keyStrengths.map(String) : [],
        weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses.map(String) : [],
        scoreRationales:
          typeof parsed.scoreRationales === 'object' && parsed.scoreRationales !== null
            ? parsed.scoreRationales
            : undefined,
      });
    } catch (err) {
      console.error('Erreur /api/analysis:', err);
      res.status(502).json({ error: "Le bilan n'a pas pu être généré, réessaie." });
    }
  });

  // Service statique du build client (production)
  if (options.clientDist && fs.existsSync(options.clientDist)) {
    const indexHtml = path.join(options.clientDist, 'index.html');
    app.use(express.static(options.clientDist));
    app.use((req: Request, res: Response, next) => {
      if (req.method === 'GET' && !req.path.startsWith('/api')) {
        res.sendFile(indexHtml);
      } else {
        next();
      }
    });
  }

  return app;
};
