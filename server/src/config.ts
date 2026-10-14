// Fournisseur choisi par AI_PROVIDER (claude ou deepseek, deepseek par
// défaut). Constantes en tête de fichier, faciles à changer.
export const CLAUDE_MODEL = 'claude-opus-5-5';
export const CLAUDE_EFFORT_CHAT = 'medium';
export const CLAUDE_EFFORT_ANALYSIS = 'high';
// Le raisonnement compte dans max_tokens même s'il n'est pas renvoyé.
export const CLAUDE_MAX_TOKENS = 16_000;
// Même réglage que Compagnon de route : 280 s par appel, sans retry SDK.
export const CLAUDE_TIMEOUT_MS = 280_000;

// DeepSeek (endpoint compatible OpenAI) : fournisseur principal ou repli sur 429 Claude.
export const MODEL_CHAT = 'deepseek-v4-flash';
export const MODEL_ANALYSIS = 'deepseek-v4-flash';
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
