/**
 * Interface commune aux fournisseurs (Claude, DeepSeek), injectable pour
 * les tests d'intégration. Chaque méthode renvoie le texte de la réponse.
 */

export interface ChatRequest {
  /** instructions : fixe par mode ; session : corpus et sujet */
  system: { instructions: string; session: string };
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export interface LlmClient {
  chat: (req: ChatRequest) => Promise<string>;
  /** Bilan final : la réponse est un objet JSON sérialisé */
  analysis: (prompt: string) => Promise<string>;
}
