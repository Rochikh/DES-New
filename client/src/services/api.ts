import { Message, SocraticMode, AnalysisData } from "../types";

/**
 * Client HTTP du backend Argos. Les prompts système et la clé API
 * vivent exclusivement côté serveur : le client n'envoie que le mode,
 * le sujet, le corpus facultatif et l'historique du dialogue.
 */

interface HistoryEntry {
  role: 'user' | 'model';
  text: string;
}

const postJSON = async <T>(url: string, body: unknown): Promise<T> => {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    let detail = '';
    try {
      const data = await response.json();
      detail = data.error || '';
    } catch {
      // corps non JSON, on garde le statut seul
    }
    throw new Error(detail || `Erreur serveur (${response.status})`);
  }

  return response.json() as Promise<T>;
};

export class ChatSession {
  private mode: SocraticMode;
  private topic: string;
  private corpus?: string;
  private history: HistoryEntry[];

  constructor(mode: SocraticMode, topic: string, history: Message[], corpus?: string) {
    this.mode = mode;
    this.topic = topic;
    this.corpus = corpus;
    this.history = history.map(m => ({ role: m.role, text: m.text }));
  }

  async sendMessage({ message }: { message: string }): Promise<{ text: string }> {
    const data = await postJSON<{ text: string }>('/api/chat', {
      mode: this.mode,
      topic: this.topic,
      corpus: this.corpus,
      history: this.history,
      message,
    });

    this.history.push({ role: 'user', text: message });
    this.history.push({ role: 'model', text: data.text });

    return { text: data.text };
  }
}

export const createChatSession = (mode: SocraticMode, topic: string, history: Message[] = [], corpus?: string): ChatSession => {
  return new ChatSession(mode, topic, history, corpus);
};

export const sendMessage = async (chat: ChatSession, message: string) => {
  const response = await chat.sendMessage({ message });
  return { text: response.text || "Erreur de transmission." };
};

export const generateAnalysis = async (
  mode: SocraticMode,
  transcript: Message[],
  topic: string,
  aiDeclaration: string
): Promise<AnalysisData> => {
  const parsed = await postJSON<Omit<AnalysisData, 'transcript' | 'aiDeclaration'>>('/api/analysis', {
    mode,
    topic,
    aiDeclaration,
    transcript: transcript.map(m => ({
      role: m.role,
      text: m.text,
      responseTimeSeconds: m.responseTimeSeconds,
      hasRhythmAnomaly: m.hasRhythmAnomaly,
    })),
  });

  return { ...parsed, transcript, aiDeclaration };
};
