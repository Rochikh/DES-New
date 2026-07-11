/**
 * Parsing du marqueur de phase émis par Argos en fin de message :
 *   ---
 *   Phase: [n]
 * Le marqueur pilote le tracker de progression et ne doit jamais être affiché.
 */

/**
 * Supprime tout ce qui se trouve après le séparateur technique ---
 * ou les mots-clés techniques si le séparateur a été oublié.
 */
export const cleanDisplayBotText = (text: string): string => {
  // 1. Priorité au séparateur officiel ---
  const separatorIndex = text.indexOf('---');
  if (separatorIndex !== -1) {
    return text.substring(0, separatorIndex).trim();
  }

  // 2. Sécurité : recherche de mots-clés techniques au cas où le séparateur est oublié
  const keywords = ['Phase:', 'Exigence:', 'Contrôle:'];
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

/** Extrait le numéro de phase ; à défaut, conserve la phase courante. */
export const extractPhase = (text: string, currentPhase: number): number => {
  const match = text.match(/Phase:\s*(\d)/i);
  return match ? parseInt(match[1], 10) : currentPhase;
};
