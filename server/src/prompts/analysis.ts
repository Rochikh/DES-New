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

const equityRule = `Regle d'equite du mode Critique : ne reproche a l'apprenant·e de ne pas avoir debusque une faille QUE si le transcript contient un raisonnement d'Argos comportant une faille logique nommable, par exemple generalisation abusive, causalite inversee, fausse dichotomie, pente glissante, appel a la popularite. Une objection raisonnable d'Argos, meme presentee comme avocat du diable, n'est pas une faille : y repondre en enrichissant son modele est une reussite, jamais un manquement. En cas de doute sur la presence d'une vraie faille, n'en fais pas une piste de progression.`;

/**
 * Schéma JSON du bilan pour les sorties structurées Claude
 * (output_config.format). Les bornes 0-100 restent appliquées par le serveur.
 * Un critère non observé dans la session vaut null, sauf l'intégrité,
 * toujours observable puisque la déclaration d'usage d'IA est demandée.
 */
export const buildAnalysisSchema = () => {
  const scoreKeys = CRITICAL_THINKING_CRITERIA.map((c) => c.scoreKey);
  const scoreFields = scoreKeys.map((k) => `${k}Score`);
  const stringList = { type: 'array', items: { type: 'string' } } as const;
  const text = { type: 'string' } as const;
  const integer = { type: 'integer' } as const;
  const nullableInteger = { anyOf: [integer, { type: 'null' }] } as const;
  return {
    type: 'object',
    properties: {
      summary: text,
      ...Object.fromEntries(scoreFields.map((f) => [f, f === 'integrityScore' ? integer : nullableInteger])),
      rhythmBreakCount: integer,
      keyStrengths: stringList,
      weaknesses: stringList,
      scoreRationales: {
        type: 'object',
        properties: Object.fromEntries(scoreKeys.map((k) => [k, text])),
        required: scoreKeys,
        additionalProperties: false,
      },
    },
    required: ['summary', ...scoreFields, 'rhythmBreakCount', 'keyStrengths', 'weaknesses', 'scoreRationales'],
    additionalProperties: false,
  } as const;
};

export const buildAnalysisPrompt = (
  mode: 'TUTOR' | 'CRITIC',
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
      // La ligne Plan sert au pilotage du dialogue, elle reste hors du bilan.
      const text = m.role === 'model' ? m.text.replace(/^Plan:.*\n?/gm, '') : m.text;
      return `[${m.role === 'user' ? 'Apprenant·e' : 'Argos'}]: ${text}${timing}`;
    })
    .join('\n');

  return `
Tu analyses une session de dialogue socratique sur "${topic}" pour produire le bilan d'apprentissage.
Mode de la session : ${mode === 'CRITIC' ? "Critique (Argos a joue l'avocat du diable)" : 'Tuteur (accompagnement)'}.
${mode === 'CRITIC' ? equityRule : ''}

Déclaration d'usage d'IA faite par l'apprenant·e : "${aiDeclaration}"

Grille d'évaluation. Chaque dimension du radar est adossée à un critère précis, évalue chaque score à l'aune de son critère et de rien d'autre :
${criteriaMapping}

Règle des critères non observés : les lignes Régime du transcript indiquent le ou les régimes de la session (acquisition, consolidation, épreuve). Un critère que ces régimes n'ont pas permis d'exercer, et que l'apprenant·e n'a pas manifesté de lui·elle-même, reçoit le score null et la justification « non observé dans cette session ». Ne le note jamais faible. Un critère exercé reçoit un score de 0 à 100. L'intégrité reste toujours notée de 0 à 100 : la déclaration d'usage d'IA la rend observable dans chaque session.

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
  "reasoningScore": entier 0-100 ou null,
  "clarityScore": entier 0-100 ou null,
  "skepticismScore": entier 0-100 ou null,
  "processScore": entier 0-100 ou null,
  "reflectionScore": entier 0-100 ou null,
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
