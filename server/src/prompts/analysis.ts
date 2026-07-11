import { CRITICAL_THINKING_CRITERIA } from './domainCriteria.js';

/**
 * Prompt et schéma du bilan final.
 *
 * Exigences d'écriture du bilan :
 * - attaque directe : la première phrase nomme le fait cognitif le plus
 *   saillant de la session, sans préambule ;
 * - concret vers abstrait : chaque constat part d'un moment précis du
 *   dialogue (citation courte ou paraphrase) puis en tire le général ;
 * - transitions déductives : chaque constat découle du précédent ;
 * - scores justifiés : une phrase d'ancrage par dimension (scoreRationales).
 */

export interface TranscriptEntry {
  role: 'user' | 'model';
  text: string;
  responseTimeSeconds?: number;
  hasRhythmAnomaly?: boolean;
}

const criteriaMapping = CRITICAL_THINKING_CRITERIA.map(
  (c) => `- ${c.scoreKey}Score (« ${c.dimension} ») évalue : ${c.label}. Observable attendu : ${c.observable}.`
).join('\n');

export const buildAnalysisPrompt = (
  topic: string,
  aiDeclaration: string,
  transcript: TranscriptEntry[]
): string => {
  const transcriptText = transcript
    .map((m) => {
      const timing =
        m.role === 'user' && m.responseTimeSeconds
          ? ` [Temps de saisie: ${m.responseTimeSeconds}s${m.hasRhythmAnomaly ? ', rupture de rythme détectée' : ''}]`
          : '';
      return `[${m.role === 'user' ? 'Apprenant·e' : 'Argos'}]: ${m.text}${timing}`;
    })
    .join('\n');

  return `
Tu analyses une session de dialogue socratique sur "${topic}" pour produire le bilan d'apprentissage.

Déclaration d'usage d'IA faite par l'apprenant·e : "${aiDeclaration}"

Grille d'évaluation. Chaque dimension du radar est adossée à un critère précis, évalue chaque score à l'aune de son critère et de rien d'autre :
${criteriaMapping}

Chaque score va de 0 à 100. Ancre chaque jugement dans des moments précis du transcript, pas dans une impression d'ensemble. rhythmBreakCount compte les réponses de l'apprenant·e marquées d'une rupture de rythme dans le transcript.

Règles d'écriture du champ summary (bilan, 150 mots max) :
- La première phrase nomme le fait cognitif le plus saillant de la session. Aucun préambule, aucune mise en contexte.
- Pars toujours d'un moment concret du dialogue (citation courte ou paraphrase fidèle) et tires-en ensuite le constat général, jamais l'inverse.
- Chaque constat découle du précédent : transitions déductives, pas de liste juxtaposée.
- Interdictions : tirets cadratins ; structures binaires « ce n'est pas X, c'est Y » ; vocabulaire générique (« il est important de noter », « dans l'ensemble », « force est de constater »).
- Tutoiement, écriture inclusive, ton sobre sans flatterie.

Règles du champ scoreRationales : pour chaque dimension, une seule phrase qui justifie le score en pointant un moment précis de la session. Mêmes interdictions stylistiques que le summary.

keyStrengths et weaknesses : 2 à 3 éléments chacun, formulés en une phrase courte, ancrés dans la session.

Format de sortie : réponds uniquement avec un objet JSON valide, sans texte autour, contenant exactement ces champs :
{
  "summary": string,
  "reasoningScore": entier 0-100,
  "clarityScore": entier 0-100,
  "skepticismScore": entier 0-100,
  "processScore": entier 0-100,
  "reflectionScore": entier 0-100,
  "integrityScore": entier 0-100,
  "rhythmBreakCount": entier,
  "keyStrengths": [string],
  "weaknesses": [string],
  "scoreRationales": { "reasoning": string, "clarity": string, "skepticism": string, "process": string, "reflection": string, "integrity": string }
}

Transcription :
${transcriptText}
`.trim();
};
