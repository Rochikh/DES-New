import { Message, SessionConfig, SocraticMode } from '../types';

/**
 * Import d'une session exportée en JSON. Le schéma d'export est stable :
 *   { metadata: { student, topic, mode, date }, transcript: Message[], aiDeclaration }
 * Les fichiers produits par les versions antérieures de l'application doivent
 * rester importables : champs metadata manquants tolérés, seul transcript est requis.
 */

export interface ParsedSession {
  config: SessionConfig;
  messages: Message[];
  aiDeclaration: string;
}

export const parseSessionFile = (raw: string): ParsedSession => {
  const json = JSON.parse(raw);
  if (!json.transcript || !Array.isArray(json.transcript)) {
    throw new Error('Format invalide');
  }

  return {
    config: {
      studentName: json.metadata?.student || 'Apprenant·e',
      topic: json.metadata?.topic || 'Sujet importé',
      mode: json.metadata?.mode === SocraticMode.CRITIC ? SocraticMode.CRITIC : SocraticMode.TUTOR,
    },
    messages: json.transcript as Message[],
    aiDeclaration: json.aiDeclaration || '',
  };
};
