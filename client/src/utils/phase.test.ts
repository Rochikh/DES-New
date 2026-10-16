import { describe, it, expect } from 'vitest';
import { cleanDisplayBotText, extractPhase } from './phase';

describe('extractPhase', () => {
  it('extrait le numéro depuis le marqueur officiel', () => {
    expect(extractPhase('Bonne question.\n---\nPhase: 2', 0)).toBe(2);
  });

  it('tolère les variantes de casse et d\'espacement', () => {
    expect(extractPhase('Texte\n---\nphase:3', 0)).toBe(3);
    expect(extractPhase('Texte\n---\nPhase:  4', 0)).toBe(4);
  });

  it('lit le dernier marqueur quand la ligne Plan mentionne une phase', () => {
    expect(extractPhase('Texte\n---\nPlan: revoir la phase 1 ; en cours : 2\nPhase: 3', 0)).toBe(3);
  });

  it('conserve la phase courante si aucun marqueur', () => {
    expect(extractPhase('Réponse sans marqueur.', 3)).toBe(3);
  });
});

describe('cleanDisplayBotText', () => {
  it('supprime le marqueur après le séparateur ---', () => {
    expect(cleanDisplayBotText('Que veux-tu explorer ?\n---\nPhase: 0')).toBe(
      'Que veux-tu explorer ?'
    );
  });

  it('supprime la ligne Plan avec le marqueur', () => {
    expect(cleanDisplayBotText('Que sais-tu de N ?\n---\nPlan: comprendre un groupe ; en cours : 1\nPhase: 1')).toBe(
      'Que sais-tu de N ?'
    );
  });

  it('coupe sur les mots-clés techniques si le séparateur est oublié', () => {
    expect(cleanDisplayBotText('Très bien.\nPhase: 1')).toBe('Très bien.');
    expect(cleanDisplayBotText('Continuons.\nExigence: définir X')).toBe('Continuons.');
    expect(cleanDisplayBotText('Continuons.\nPlan: définir X\nPhase: 1')).toBe('Continuons.');
  });

  it('rend le texte intact quand il ne contient rien de technique', () => {
    expect(cleanDisplayBotText('Simple réponse.')).toBe('Simple réponse.');
  });
});
