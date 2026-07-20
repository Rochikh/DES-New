// Modèle servi via l'API DeepSeek (endpoint compatible OpenAI).
// Constantes en tête de fichier, faciles à changer.
export const MODEL_CHAT = 'deepseek-chat';
export const MODEL_ANALYSIS = 'deepseek-chat';
export const DEEPSEEK_URL = 'https://api.deepseek.com/v1/chat/completions';

export const PORT = Number(process.env.PORT) || 3000;

// Garde-fous sur les payloads entrants
export const MAX_MESSAGE_LENGTH = 4000;
export const MAX_HISTORY_MESSAGES = 200;
export const MAX_TOPIC_LENGTH = 500;
export const MAX_DECLARATION_LENGTH = 4000;
export const MAX_TRANSCRIPT_MESSAGES = 400;
// Corpus de référence facultatif (extraits, notes de lecture).
export const MAX_CORPUS_LENGTH = 100_000;

// Rate limiting : l'application est publique, la clé paie à l'usage.
export const RATE_LIMIT_WINDOW_MS = 60_000;
export const RATE_LIMIT_MAX = 30;
