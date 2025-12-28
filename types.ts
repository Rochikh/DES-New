
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
  phase?: number;
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
  integrityScore: number; // Nouveau score : Intégrité pédagogique
  keyStrengths: string[];
  weaknesses: string[];
  transcript: Message[];
  aiDeclaration: string;
}

export const PROTOCOL_PHASES = [
  { id: 0, label: "Ciblage", desc: "Identification de l'intention et de l'objet de recherche." },
  { id: 1, label: "Clarification", desc: "Définition rigoureuse des termes et des concepts utilisés." },
  { id: 2, label: "Mécanisme", desc: "Exploration du 'Comment' : les relations de cause à effet." },
  { id: 3, label: "Vérification", desc: "Recherche de preuves, de protocoles et de critères de vérité." },
  { id: 4, label: "Stress-test", desc: "Confrontation à des contre-exemples et limites du modèle." }
];
