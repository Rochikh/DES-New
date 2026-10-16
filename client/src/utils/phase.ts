/**
 * Parsing du bloc technique émis par Argos en fin de message :
 *   ---
 *   Plan: [une ligne]     (absente tant que le diagnostic n'a pas fixé le plan)
 *   Régime: [une ligne]   (absente pendant le diagnostic)
 *   Phase: [n]
 * Le marqueur pilote le tracker de progression. Le bloc n'est jamais affiché
 * mais reste dans le texte brut renvoyé au serveur : Argos y relit son plan.
 */

import type { Regime } from '../types';

/**
 * Supprime tout ce qui se trouve après le séparateur technique ---
 * ou les mots-clés techniques si le séparateur a été oublié.
 */
export const cleanDisplayBotText = (text: string): string => {
  // 1. Marqueur en fin de message : on ne coupe au séparateur --- que si la
  // mention de phase se trouve après lui (un --- décoratif en milieu de
  // message ne doit jamais avaler la suite du texte).
  const phaseIdx = text.search(/Phase\s*:?\s*\d/i);
  const separatorIndex = text.lastIndexOf('---');
  if (separatorIndex !== -1 && phaseIdx > separatorIndex) {
    return text.substring(0, separatorIndex).trim();
  }

  // 2. Sécurité : recherche de mots-clés techniques au cas où le séparateur est oublié
  const keywords = ['Plan:', 'Régime:', 'Phase:', 'Phase 0', 'Phase 1', 'Phase 2', 'Phase 3', 'Phase 4', '**Phase', 'Exigence:', 'Contrôle:'];
  let firstKeywordIndex = -1;

  for (const kw of keywords) {
    const idx = text.indexOf(kw);
    if (idx !== -1 && (firstKeywordIndex === -1 || idx < firstKeywordIndex)) {
      firstKeywordIndex = idx;
    }
  }

  if (firstKeywordIndex !== -1) {
    return text.substring(0, firstKeywordIndex).trim();
  }

  return text;
};

/**
 * Extrait le numéro de phase du dernier marqueur (la ligne Plan qui le
 * précède peut mentionner une phase) ; à défaut, conserve la phase courante.
 */
export const extractPhase = (text: string, currentPhase: number): number => {
  const matches = [...text.matchAll(/Phase\s*:?\s*\**\s*(\d)/gi)];
  return matches.length ? parseInt(matches[matches.length - 1][1], 10) : currentPhase;
};

/**
 * Extrait le régime de la dernière ligne Régime ; à défaut, conserve le
 * régime courant.
 */
export const extractRegime = (text: string, currentRegime: Regime | null): Regime | null => {
  const matches = [...text.matchAll(/R[ée]gime\s*:\s*\**\s*(acquisition|consolidation|(?:mise à l')?[ée]preuve)/gi)];
  if (!matches.length) return currentRegime;
  const value = matches[matches.length - 1][1].toLowerCase();
  return value.startsWith('acq') ? 'acquisition' : value.startsWith('cons') ? 'consolidation' : 'epreuve';
};
