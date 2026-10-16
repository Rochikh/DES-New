export enum AppMode {
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
  regime?: Regime;
  responseTimeSeconds?: number;
  hasRhythmAnomaly?: boolean;
}

export interface SessionConfig {
  studentName: string;
  topic: string;
  mode: SocraticMode;
  /** Corpus de référence (extraits, notes) ancrant les apports du tuteur. */
  corpus?: string;
}

export interface ScoreRationales {
  reasoning: string;
  clarity: string;
  skepticism: string;
  process: string;
  reflection: string;
  integrity: string;
}

export interface AnalysisData {
  summary: string;
  /** null : critère non observé dans la session (le régime ne l'a pas exercé) */
  reasoningScore: number | null;
  clarityScore: number | null;
  skepticismScore: number | null;
  processScore: number | null;
  reflectionScore: number | null;
  integrityScore: number;
  rhythmBreakCount: number;
  keyStrengths: string[];
  weaknesses: string[];
  /** Justification d'une phrase par dimension (absent des anciennes sessions) */
  scoreRationales?: ScoreRationales;
  transcript: Message[];
  aiDeclaration: string;
}

/** Régime choisi par Argos au diagnostic, lu dans la ligne Régime du bloc technique. */
export type Regime = 'acquisition' | 'consolidation' | 'epreuve';

export interface ProtocolPhase {
  id: number;
  label: string;
  desc: string;
}

export const REGIME_LABELS: Record<Regime, string> = {
  acquisition: "Acquisition",
  consolidation: "Consolidation",
  epreuve: "Mise à l'épreuve"
};

const DIAGNOSTIC_PHASE: ProtocolPhase = { id: 0, label: "Diagnostic", desc: "Identification de l'intention et du niveau." };

const REGIME_PHASES: Record<Regime, ProtocolPhase[]> = {
  acquisition: [
    { id: 1, label: "Comprendre", desc: "Explication courte, puis reformulation avec ses propres mots." },
    { id: 2, label: "Vérifier", desc: "Réponse juste à une question de contrôle." },
    { id: 3, label: "Appliquer", desc: "Traitement d'un cas nouveau." }
  ],
  consolidation: [
    { id: 1, label: "Rappeler", desc: "Restitution d'une notion sans aide." },
    { id: 2, label: "Relier", desc: "Articulation de deux notions par une relation explicite." },
    { id: 3, label: "Transférer", desc: "Résolution d'une question du type de l'évaluation, ou d'un cas nouveau." }
  ],
  epreuve: [
    { id: 1, label: "Clarification", desc: "Définition rigoureuse des termes et des concepts utilisés." },
    { id: 2, label: "Mécanisme", desc: "Exploration du 'comment' : les relations de cause à effet." },
    { id: 3, label: "Vérification", desc: "Recherche de preuves, de protocoles et de critères de vérité." },
    { id: 4, label: "Stress-test", desc: "Confrontation à des contre-exemples et limites du modèle." }
  ]
};

/** Phases affichées : le diagnostic seul tant que le régime n'est pas choisi. */
export const protocolPhases = (regime: Regime | null): ProtocolPhase[] =>
  [DIAGNOSTIC_PHASE, ...(regime ? REGIME_PHASES[regime] : [])];
