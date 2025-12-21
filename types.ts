
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

export enum SocraticStrategy {
  CLARIFICATION = 'clarification',
  TEST_NECESSITE = 'test_necessite',
  CONTRE_EXEMPLE = 'contre_exemple',
  PREDICTION = 'prediction',
  FALSIFIABILITE = 'falsifiabilite',
  MECANISME_CAUSAL = 'mecanisme_causal',
  CHANGEMENT_CADRE = 'changement_cadre',
  COMPRESSION = 'compression',
  CONCESSION_CONTROLEE = 'concession_controlee'
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  strategy?: SocraticStrategy;
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
  keyStrengths: string[];
  weaknesses: string[];
  transcript: Message[];
  aiDeclaration: string;
}
