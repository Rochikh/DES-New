// Modèles Anthropic. Constantes en tête de fichier, faciles à changer.
export const MODEL_CHAT = 'claude-haiku-4-5-20251001';
export const MODEL_ANALYSIS = 'claude-sonnet-4-6';

export const PORT = Number(process.env.PORT) || 3000;

// Garde-fous sur les payloads entrants
export const MAX_MESSAGE_LENGTH = 4000;
export const MAX_HISTORY_MESSAGES = 200;
export const MAX_TOPIC_LENGTH = 500;
export const MAX_DECLARATION_LENGTH = 4000;
export const MAX_TRANSCRIPT_MESSAGES = 400;

// Rate limiting : l'application est publique, la clé paie à l'usage.
export const RATE_LIMIT_WINDOW_MS = 60_000;
export const RATE_LIMIT_MAX = 30;
