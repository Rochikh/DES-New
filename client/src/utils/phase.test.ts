import { describe, it, expect } from 'vitest';
import { cleanDisplayBotText, extractPhase, extractRegime } from './phase';

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

describe('extractRegime', () => {
  it('lit le régime de la ligne Régime', () => {
    expect(extractRegime('Texte\n---\nPlan: X ; en cours : 1\nRégime: acquisition\nPhase: 1', null)).toBe('acquisition');
    expect(extractRegime('Texte\n---\nRégime: consolidation\nPhase: 2', null)).toBe('consolidation');
  });

  it('normalise les graphies de la mise à l\'épreuve', () => {
    expect(extractRegime('Texte\n---\nRégime: épreuve\nPhase: 1', null)).toBe('epreuve');
    expect(extractRegime('Texte\n---\nRegime: mise à l\'épreuve\nPhase: 1', null)).toBe('epreuve');
  });

  it('conserve le régime courant si la ligne manque', () => {
    expect(extractRegime('Texte\n---\nPhase: 0', null)).toBeNull();
    expect(extractRegime('Texte\n---\nPhase: 2', 'consolidation')).toBe('consolidation');
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

  it('supprime la ligne Régime avec le marqueur', () => {
    expect(cleanDisplayBotText('Reformule-le.\n---\nPlan: X ; en cours : 1\nRégime: acquisition\nPhase: 1')).toBe(
      'Reformule-le.'
    );
    expect(cleanDisplayBotText('Reformule-le.\nRégime: acquisition\nPhase: 1')).toBe('Reformule-le.');
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
