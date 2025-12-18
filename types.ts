export enum AppMode {
  LOGIN = 'LOGIN',
  SETUP = 'SETUP',
  CHAT = 'CHAT',
  REPORT = 'REPORT'
}

export enum SocraticMode {
  TUTOR = 'TUTOR',
  CRITIC = 'CRITIC'
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  responseTimeMs?: number;
}

export interface SessionConfig {
  studentName: string;
  topic: string;
  mode: SocraticMode;
}

export interface AnalysisData {
  summary: string;
  reasoningScore: number;
  clarityScore: number;
  skepticismScore: number;
  processScore: number;
  reflectionScore: number;
  disciplinaryDiscernmentScore: number;
  aiDeclarationCoherenceScore: number;
  keyStrengths: string[];
  weaknesses: string[];
  aiUsageAnalysis: string;
  transcript: Message[];
  aiDeclaration: string;
}
