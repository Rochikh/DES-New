/**
 * Grille d'évaluation de la pensée critique — charpente commune du dialogue
 * et de l'analyse finale.
 *
 * Mapping critère → dimension du radar (6 axes affichés côté client) :
 *
 * | Critère                                                    | Dimension radar   | Champ JSON        |
 * |------------------------------------------------------------|-------------------|-------------------|
 * | Cohérence logique globale et rigueur argumentative         | Raisonnement      | reasoningScore    |
 * | Mise en question des prémisses et présupposés              | Clarté            | clarityScore      |
 * | Qualité et hiérarchisation des preuves (force probante)    | Doute constructif | skepticismScore   |
 * | Identification et dépassement des biais cognitifs          | Méthode           | processScore      |
 * | Capacité de décentrement et d'empathie intellectuelle      | Prise de recul    | reflectionScore   |
 * | Honnêteté intellectuelle et transparence du processus      | Intégrité         | integrityScore    |
 *
 * Justification des deux appariements les moins évidents : mettre en question
 * les prémisses exige d'abord que les termes soient définis avec précision,
 * c'est la clarté opératoire travaillée en phase 1 ; identifier ses biais est
 * une procédure de contrôle de son propre raisonnement, donc une compétence de
 * méthode, là où le décentrement (adopter le point de vue adverse) relève de
 * la prise de recul.
 *
 * Ce mapping est injecté dans les deux prompts : le dialogue oriente ses
 * relances pour donner l'occasion de manifester chaque critère (on n'évalue
 * pas ce qu'on n'a pas permis d'exercer), l'analyse évalue chaque dimension à
 * l'aune de son critère.
 */

export interface Criterion {
  /** Libellé du critère pédagogique */
  label: string;
  /** Dimension du radar côté client */
  dimension: string;
  /** Clé du score dans le JSON d'analyse */
  scoreKey: 'reasoning' | 'clarity' | 'skepticism' | 'process' | 'reflection' | 'integrity';
  /** Ce qu'Argos cherche à faire manifester pendant le dialogue */
  observable: string;
}

export const CRITICAL_THINKING_CRITERIA: Criterion[] = [
  {
    label: 'Cohérence logique globale et rigueur argumentative',
    dimension: 'Raisonnement',
    scoreKey: 'reasoning',
    observable: "enchaîner des arguments sans contradiction, articuler des relations de cause à effet",
  },
  {
    label: 'Mise en question des prémisses et présupposés',
    dimension: 'Clarté',
    scoreKey: 'clarity',
    observable: "définir ses termes avec ses propres mots, repérer ce que son affirmation tient pour acquis",
  },
  {
    label: 'Qualité et hiérarchisation des preuves (force probante)',
    dimension: 'Doute constructif',
    scoreKey: 'skepticism',
    observable: "distinguer anecdote, corrélation et preuve, proposer un critère de vérification",
  },
  {
    label: 'Identification et dépassement des biais cognitifs',
    dimension: 'Méthode',
    scoreKey: 'process',
    observable: "repérer un biais dans son propre raisonnement ou dans celui d'Argos, ajuster sa démarche",
  },
  {
    label: 'Capacité de décentrement et d\'empathie intellectuelle',
    dimension: 'Prise de recul',
    scoreKey: 'reflection',
    observable: "reformuler la position adverse au plus fort, envisager un autre cadre d'analyse",
  },
  {
    label: 'Honnêteté intellectuelle et transparence du processus',
    dimension: 'Intégrité',
    scoreKey: 'integrity',
    observable: "reconnaître une incertitude ou une erreur, expliciter d'où vient son jugement",
  },
];

/** Rendu texte de la grille pour injection dans les prompts. */
export const renderCriteriaGrid = (): string =>
  CRITICAL_THINKING_CRITERIA.map(
    (c) => `- ${c.label} (dimension « ${c.dimension} ») : ${c.observable}.`
  ).join('\n');
