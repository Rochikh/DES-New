
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

export enum CriterionStatus {
  NON_TRAITE = 'non_traite',
  EVOQUE = 'evoque',
  ETAYE = 'etaye',
  STRESS_TESTE = 'stress_teste'
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
  responseTimeMs?: number;
  strategy?: SocraticStrategy;
}

export interface SessionConfig {
  studentName: string;
  topic: string;
  mode: SocraticMode;
}

export interface CriterionTrace {
  status: CriterionStatus;
  score: number; // 0, 25, 50, 75, 100
  evidenceQuotes: string[];
  expertObservation: string;
  nextMove: string;
}

export interface ArgumentMap {
  claim: string;
  definitions: string[];
  assumptions: string[];
  evidence: string[];
  objections: string[];
  rebuttals: string[];
  falsifier: string;
}

export interface AnalysisData {
  summary: {
    built: string;
    unstable: string[];
    nextStep: string;
  };
  diagnostic: string;
  criteria: {
    premises: CriterionTrace;
    evidence: CriterionTrace;
    bias: CriterionTrace;
    decentering: CriterionTrace;
    logic: CriterionTrace;
    integrity: CriterionTrace;
  };
  argumentMap: ArgumentMap;
  deltas: string[];
  pivotalMoments: { 
    quote: string; 
    analysis: string; 
    impact: 'positive' | 'negative' | 'neutral';
    whyItMatters: string;
  }[];
  aiUsageAnalysis: string;
  transcript: Message[];
  aiDeclaration: string;
}
