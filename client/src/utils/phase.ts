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
  // 1. Marqueur en fin de message : on ne coupe au séparateur --- que si la
  // mention de phase se trouve après lui (un --- décoratif en milieu de
  // message ne doit jamais avaler la suite du texte).
  const phaseIdx = text.search(/Phase\s*:?\s*\d/i);
  const separatorIndex = text.lastIndexOf('---');
  if (separatorIndex !== -1 && phaseIdx > separatorIndex) {
    return text.substring(0, separatorIndex).trim();
  }

  // 2. Sécurité : recherche de mots-clés techniques au cas où le séparateur est oublié
  const keywords = ['Phase:', 'Phase 0', 'Phase 1', 'Phase 2', 'Phase 3', 'Phase 4', '**Phase', 'Exigence:', 'Contrôle:'];
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
  const match = text.match(/Phase\s*:?\s*\**\s*(\d)/i);
  return match ? parseInt(match[1], 10) : currentPhase;
};
