
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

export interface ScoreDetail {
  score: number;
  feedback: string;
}

export interface AnalysisData {
  summary: string;
  diagnostic: string;
  // Scores basés sur les critères du domaine
  criteriaScores: {
    premises: ScoreDetail;       // Mise en question des prémisses
    evidence: ScoreDetail;       // Qualité des preuves
    bias: ScoreDetail;           // Identification des biais
    decentering: ScoreDetail;    // Décentrement
    logic: ScoreDetail;          // Cohérence logique
    integrity: ScoreDetail;      // Honnêteté intellectuelle
  };
  globalScore: number;
  keyStrengths: string[];
  weaknesses: string[];
  pivotalMoments: { quote: string; analysis: string; impact: 'positive' | 'negative' | 'neutral' }[];
  aiUsageAnalysis: string;
  finalRecommendation: string;
  transcript: Message[];
  aiDeclaration: string;
}
