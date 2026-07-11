import { describe, it, expect } from 'vitest';
import { parseSessionFile } from './session';
import { SocraticMode } from '../types';

/**
 * Fixture au schéma exact produit par handleExportJSON de la version
 * actuellement déployée : la rétrocompatibilité de l'import est une
 * contrainte absolue du projet.
 */
const legacyExport = JSON.stringify({
  metadata: {
    student: 'Alex',
    topic: "L'impact de l'IA sur l'emploi",
    mode: 'CRITIC',
    date: '2026-05-12T09:30:00.000Z',
  },
  transcript: [
    {
      id: 'a1b2c3',
      role: 'model',
      text: 'Quel est ton objet de recherche ?\n---\nPhase: 0',
      timestamp: 1770000000000,
      phase: 0,
    },
    {
      id: 'd4e5f6',
      role: 'user',
      text: "Je veux savoir si l'IA détruit plus d'emplois qu'elle n'en crée.",
      timestamp: 1770000060000,
      responseTimeSeconds: 45,
      hasRhythmAnomaly: false,
    },
  ],
  aiDeclaration: "J'ai utilisé un moteur de recherche classique.",
});

describe('parseSessionFile (rétrocompatibilité)', () => {
  it('importe un export de la version actuelle sans perte', () => {
    const session = parseSessionFile(legacyExport);

    expect(session.config.studentName).toBe('Alex');
    expect(session.config.topic).toBe("L'impact de l'IA sur l'emploi");
    expect(session.config.mode).toBe(SocraticMode.CRITIC);
    expect(session.messages).toHaveLength(2);
    expect(session.messages[1].responseTimeSeconds).toBe(45);
    expect(session.aiDeclaration).toBe("J'ai utilisé un moteur de recherche classique.");
  });

  it('tolère les métadonnées manquantes (valeurs par défaut)', () => {
    const session = parseSessionFile(JSON.stringify({ transcript: [] }));

    expect(session.config.studentName).toBe('Apprenant·e');
    expect(session.config.topic).toBe('Sujet importé');
    expect(session.config.mode).toBe(SocraticMode.TUTOR);
    expect(session.aiDeclaration).toBe('');
  });

  it('rejette un fichier sans transcript', () => {
    expect(() => parseSessionFile(JSON.stringify({ metadata: {} }))).toThrow();
  });

  it('rejette un JSON corrompu', () => {
    expect(() => parseSessionFile('{pas du json')).toThrow();
  });
});
