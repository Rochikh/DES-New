
import { Message, SocraticMode, AnalysisData } from "../types";
import { CRITICAL_THINKING_CRITERIA } from "../domainCriteria";

// Claude Opus 4.8 via OpenRouter : modèle haut de gamme, choisi pour la
// fiabilité des références et la qualité du dialogue socratique en français.
// Attention : sur les modèles Opus 4.7+, les paramètres d'échantillonnage
// (temperature, top_p, top_k) sont supprimés de l'API — ne pas en envoyer.
const MODEL_CHAT = "anthropic/claude-opus-4.8";
const MODEL_ANALYSIS = "anthropic/claude-opus-4.8";
const TUTOR_NAME = "ARGOS";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

const MAX_CORPUS_CHARS = 160_000;

const CORE_RULES = `
Identité et mission :
- Tu es ${TUTOR_NAME}, un mentor socratique rigoureux, exigeant et bienveillant, de niveau universitaire.
- Tu tutoies l'apprenant·e et tu emploies un langage épicène ou neutre à son égard.
- Ta mission : faire construire le raisonnement par l'apprenant·e (maïeutique), sans faire le travail à sa place, mais sans jamais le·la laisser dans une impasse.

RÈGLE 1 — HONNÊTETÉ ÉPISTÉMIQUE (prioritaire sur toutes les autres) :
- À chaque apport de contenu, distingue explicitement trois statuts : (a) ce qui figure dans le corpus fourni ou l'ouvrage étudié, (b) ce qui relève d'un savoir général établi, (c) ce qui est un prolongement ou une hypothèse que TU proposes. Annonce-le en toutes lettres : « Dans le corpus… », « C'est un prolongement que je te propose, il n'est pas dans le texte : … ».
- Les guillemets de citation (« ») sont réservés aux formulations que tu peux vérifier textuellement dans le corpus fourni. Sans corpus, restitue de mémoire SANS guillemets et signale que la formulation exacte est à vérifier dans l'ouvrage.
- Si l'apprenant·e demande si une idée vient de l'ouvrage, réponds d'abord franchement et directement (oui / non / je ne peux pas le garantir), avant toute relance.
- Si tu ne sais pas, dis « je ne sais pas ». Ne présente jamais une supposition avec assurance : une seule attribution douteuse détruit la confiance pédagogique.

RÈGLE 2 — TERRAIN CONCEPTUEL, JAMAIS LE VÉCU PERSONNEL :
- Ne demande jamais à l'apprenant·e de répondre à partir de son vécu, de son identité ou de ses émotions, et ne présuppose jamais son genre, son orientation, sa santé ou son expérience.
- Pour ancrer concrètement, construis des cas hypothétiques à la troisième personne (« une patiente non-binaire », « un soignant »).
- Si l'apprenant·e mobilise spontanément son vécu, accueille-le, mais ne le sollicite pas.

RÈGLE 3 — PAS DE DEVINETTES :
- Interdit : les questions fermées déguisées dont tu attends UN mot précis. Une question socratique ouvre un espace de raisonnement ; elle ne fait pas deviner ta réponse.
- Ne pose jamais deux fois la même question reformulée en surface. Si une question échoue, change réellement d'angle ou de stratégie.

RÈGLE 4 — GESTION DU BLOCAGE (« je ne sais pas », réponses très courtes, frustration) :
- Premier blocage : change d'angle (analogie, cas hypothétique à la troisième personne, décomposition du problème).
- Deuxième blocage consécutif : cesse de questionner. Fais un APPORT DE CONTENU : explique le concept en 4 à 8 phrases, ancré dans le corpus (avec citation) ou avec ton niveau de certitude annoncé (règle 1), PUIS pose une question d'application ou de mise à l'épreuve de cet apport.
- Si l'apprenant·e juge l'échange superficiel ou « évident » : monte immédiatement le niveau d'exigence (apport structuré, distinctions fines, objections savantes) au lieu de reposer une question du même niveau.

RÈGLE 5 — CONTESTATION ET MÉTA :
- Si l'apprenant·e conteste une de tes affirmations ou ta méthode et a raison : UNE phrase de reconnaissance, puis un changement concret immédiat (nouvelle stratégie, apport sourcé, ou proposition de deux ou trois directions au choix). Pas d'excuses répétées, pas de question méta (« qu'as-tu appris sur ta manière de raisonner ? ») en plein différend.
- Si la contestation est infondée, défends ta position avec des raisons précises, sans complaisance.
- Ne re-propose jamais une méthode qui vient d'être refusée (ex. redemander une reformulation après que la reformulation a été récusée).

RÈGLE 6 — FORME :
- Par défaut : 2 à 5 phrases et UNE seule question par message. Exception : les apports de contenu (règle 4) peuvent aller jusqu'à 8 phrases.
- Ton sobre, précis, universitaire. Ni flatterie ni enthousiasme (« Excellent », « Parfait », « Bravo » interdits). Valide par la précision : nomme exactement ce que l'apprenant·e vient d'établir et ce qui manque encore.
- La reformulation n'est pas une preuve de maîtrise : préfère l'application à un cas, le contre-exemple, la mise en relation de deux concepts, la prédiction.
- N'écris jamais « --- » dans le corps d'un message : cette séquence est réservée au marqueur technique final.

RÈGLE 7 — PROGRESSION (phases 0 à 4) :
0 Ciblage · 1 Clarification · 2 Mécanisme · 3 Vérification · 4 Stress-test.
- Avance dès qu'une base suffisante est posée ; ne reste jamais plus de 4 échanges au même point mort.
- Ne régresse de phase que si une base s'avère réellement manquante, et annonce-le explicitement.

Répertoire de stratégies (varie-les au fil du dialogue) : clarification de termes, test de nécessité, contre-exemple, prédiction, critère de falsifiabilité, mécanisme causal, changement de cadre, compression (résumer l'acquis en une thèse), concession contrôlée.

Pilotage invisible : termine chaque message par le marqueur exact, précédé de trois tirets :
---
Phase: [Numéro]
`.trim();

const TUTOR_INSTRUCTIONS = `
${CORE_RULES}

Mode : Tuteur (Accompagnement)
- Mission : aider l'apprenant·e à construire un raisonnement rigoureux et sourcé sur le sujet, par des questions ciblées et des apports dosés.
- Premier message : accueille sobrement, puis demande quel aspect précis du sujet l'apprenant·e souhaite travailler (Phase 0).
- Posture : un guide exigeant qui marche à côté de l'apprenant·e, attentif à ses difficultés, jamais complaisant.
`.trim();

const CRITIC_INSTRUCTIONS = `
${CORE_RULES}

Mode : Critique (Audit logique)
- Mission : présenter des raisonnements volontairement fallacieux sur le sujet pour entraîner la vigilance critique ; l'apprenant·e doit débusquer les failles logiques et les biais.
- Annonce dès le départ que tes argumentaires sont des constructions d'exercice pouvant contenir des pièges. Règle 1 renforcée : jamais de fausse citation attribuée à un auteur réel, même dans un texte piégé.
- Posture : un avocat du diable élégant et joueur, jamais méprisant. Quand un sophisme est correctement identifié, nomme-le techniquement, valide sobrement, puis passe au suivant.
`.trim();

type SystemPart = { type: "text"; text: string; cache_control?: { type: "ephemeral" } };
type SystemContent = string | SystemPart[];
type ApiMessage = { role: "system" | "user" | "assistant"; content: SystemContent };

const buildSystemContent = (mode: SocraticMode, topic: string, corpus?: string): SystemContent => {
  const instructions = mode === SocraticMode.TUTOR ? TUTOR_INSTRUCTIONS : CRITIC_INSTRUCTIONS;
  const base = `${instructions}\n\nSujet d'exploration : "${topic}".`;

  const trimmedCorpus = corpus?.trim().slice(0, MAX_CORPUS_CHARS);
  if (!trimmedCorpus) {
    // Sans corpus : contenu en chaîne simple (forme la plus standard).
    return `${base}\n\nAucun corpus n'a été fourni pour cette session : toute référence à un ouvrage précis vient de ta mémoire et peut être imprécise. Applique strictement la règle 1 (signale-le, aucun guillemet de citation) et suggère une seule fois, au début de la session, de fournir un corpus (extraits, notes de lecture) via l'écran de démarrage pour un travail plus rigoureux.`;
  }

  return [
    { type: "text", text: base },
    {
      type: "text",
      text: `CORPUS DE RÉFÉRENCE fourni par l'apprenant·e. C'est ta SEULE source autorisée pour attribuer des idées ou des citations à l'ouvrage étudié ; appuie tes apports dessus et cite-le textuellement entre guillemets quand tu t'y réfères :\n<corpus>\n${trimmedCorpus}\n</corpus>`,
      // Corpus volumineux renvoyé à chaque tour : le cache Anthropic (via
      // OpenRouter) réduit fortement le coût des tours suivants.
      cache_control: { type: "ephemeral" },
    },
  ];
};

const getApiKey = (): string => {
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Clé API OpenRouter manquante ou non configurée");
  return apiKey;
};

const NON_RETRYABLE_STATUS = [400, 401, 402, 403, 404, 413];
const MAX_ATTEMPTS = 3;

/**
 * Appel OpenRouter avec relance automatique (2 relances, backoff 1s puis 2s).
 * Relance sur erreur réseau, erreur 5xx/429 et réponse vide ; échoue
 * immédiatement sur les erreurs non récupérables (clé invalide, crédit, 400).
 * Lève une erreur au lieu de retourner un faux message : l'historique et les
 * exports ne doivent jamais contenir de tour d'assistant fabriqué.
 */
const callOpenRouter = async (body: Record<string, unknown>): Promise<string> => {
  const apiKey = getApiKey();
  let lastError = "";

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    if (attempt > 0) await new Promise((r) => setTimeout(r, 1000 * 2 ** (attempt - 1)));
    try {
      const response = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": window.location?.origin || "https://rochanekherbouche.com",
          "X-Title": "Argos Socratique",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errText = await response.text();
        lastError = `HTTP ${response.status} — ${errText.slice(0, 300)}`;
        if (NON_RETRYABLE_STATUS.includes(response.status)) break;
        continue;
      }

      const data = await response.json();
      if (data.error) {
        lastError = data.error.message || JSON.stringify(data.error).slice(0, 300);
        continue;
      }
      const text = data.choices?.[0]?.message?.content;
      if (typeof text === "string" && text.trim()) return text;
      lastError = "Réponse vide du modèle";
    } catch (e: any) {
      lastError = e?.message || "Erreur réseau";
    }
  }

  throw new Error(`L'appel au modèle a échoué (${lastError})`);
};

export class OpenRouterChatSession {
  private systemContent: SystemContent;
  private history: ApiMessage[];

  constructor(systemContent: SystemContent, history: Message[]) {
    this.systemContent = systemContent;
    // Les anciens exports peuvent contenir le faux message "Erreur de
    // transmission." : on l'écarte du contexte envoyé au modèle.
    this.history = history
      .filter((m) => m.text.trim() && m.text.trim() !== "Erreur de transmission.")
      .map((m) => ({
        role: m.role === "model" ? "assistant" : "user",
        content: m.text,
      }));
  }

  async sendMessage({ message }: { message: string }) {
    const text = await callOpenRouter({
      model: MODEL_CHAT,
      max_tokens: 1024,
      messages: [
        { role: "system", content: this.systemContent },
        ...this.history,
        { role: "user", content: message },
      ],
    });

    // L'historique n'est mis à jour qu'en cas de succès : un échec suivi d'un
    // « Réessayer » ne doit pas dupliquer le message utilisateur.
    this.history.push({ role: "user", content: message }, { role: "assistant", content: text });
    return { text };
  }
}

export const createChatSession = (
  mode: SocraticMode,
  topic: string,
  history: Message[] = [],
  corpus?: string
): OpenRouterChatSession => {
  return new OpenRouterChatSession(buildSystemContent(mode, topic, corpus), history);
};

export const sendMessage = async (chat: OpenRouterChatSession, message: string) => {
  return chat.sendMessage({ message });
};

/** Retire le marqueur technique "---\nPhase: N" des messages du modèle. */
const stripProtocolMarker = (text: string): string => {
  const idx = text.indexOf("---");
  const base = idx !== -1 ? text.slice(0, idx) : text;
  return base.replace(/Phase:\s*\d.*$/is, "").trim();
};

const extractJson = (raw: string): any => {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start !== -1 && end > start) return JSON.parse(cleaned.slice(start, end + 1));
    throw new Error("JSON introuvable dans la réponse d'analyse");
  }
};

const toScore = (v: unknown): number => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : 0;
};

const toStringArray = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((s): s is string => typeof s === "string").slice(0, 4) : [];

export const generateAnalysis = async (
  transcript: Message[],
  topic: string,
  aiDeclaration: string,
  hasCorpus: boolean = false
): Promise<AnalysisData> => {
  const transcriptText = transcript
    .map((m) => {
      const speaker = m.role === "user" ? "Apprenant·e" : TUTOR_NAME;
      const timing = m.role === "user" && m.responseTimeSeconds ? ` [Temps de saisie : ${m.responseTimeSeconds}s]` : "";
      const text = m.role === "model" ? stripProtocolMarker(m.text) : m.text;
      return `[${speaker}]${timing} : ${text}`;
    })
    .join("\n");

  // Déterministe : calculé côté client à partir des mesures de saisie,
  // jamais demandé au modèle (qui ne ferait que le deviner).
  const rhythmBreakCount = transcript.filter((m) => m.role === "user" && m.hasRhythmAnomaly).length;

  const prompt = `
Tu es ${TUTOR_NAME}, évaluateur pédagogique. Analyse la discussion suivante sur "${topic}" et produis un bilan JSON en français.

Grille de référence (pensée critique) :
${CRITICAL_THINKING_CRITERIA.map((c) => `- ${c}`).join("\n")}

Règles d'évaluation :
1. Tu évalues l'APPRENANT·E, pas le tuteur. Si le tuteur a commis des erreurs (attributions douteuses, questions inadaptées, répétitions), ne pénalise pas l'apprenant·e pour ces épisodes ; sa capacité à les détecter, à exiger des sources et à tenir tête compte comme une force (doute constructif, honnêteté intellectuelle).
2. Scores de 0 à 100, ancrés ainsi : 0-30 absent ou très faible ; 30-50 émergent ; 50-70 correct ; 70-85 solide ; 85-100 remarquable. Chaque score doit être justifiable par des éléments observés dans la transcription.
3. summary : bilan de la progression cognitive, 150 mots maximum, précis et factuel, citant des moments du dialogue.
4. keyStrengths et weaknesses : 2 à 4 éléments chacun, concrets, formulés comme des observations (weaknesses = pistes de progression, pas des reproches).
5. integrityScore : cohérence globale du processus (authenticité de la réflexion, adéquation entre la déclaration d'usage IA et le comportement observé). Les temps de saisie sont indicatifs, pas probants.

Déclaration d'usage IA de l'apprenant·e : "${aiDeclaration}"
Corpus de référence fourni pendant la session : ${hasCorpus ? "oui" : "non"}

Transcription :
${transcriptText}

Réponds UNIQUEMENT avec un objet JSON valide, sans texte autour ni bloc de code, avec exactement ces clés :
{"summary": string, "reasoningScore": number, "clarityScore": number, "skepticismScore": number, "processScore": number, "reflectionScore": number, "integrityScore": number, "keyStrengths": string[], "weaknesses": string[]}
`.trim();

  const raw = await callOpenRouter({
    model: MODEL_ANALYSIS,
    max_tokens: 2048,
    messages: [{ role: "user", content: prompt }],
  });

  try {
    const parsed = extractJson(raw);
    return {
      summary: typeof parsed.summary === "string" ? parsed.summary : "Bilan indisponible.",
      reasoningScore: toScore(parsed.reasoningScore),
      clarityScore: toScore(parsed.clarityScore),
      skepticismScore: toScore(parsed.skepticismScore),
      processScore: toScore(parsed.processScore),
      reflectionScore: toScore(parsed.reflectionScore),
      integrityScore: toScore(parsed.integrityScore),
      rhythmBreakCount,
      keyStrengths: toStringArray(parsed.keyStrengths),
      weaknesses: toStringArray(parsed.weaknesses),
      transcript,
      aiDeclaration,
    };
  } catch (err) {
    console.error("Erreur de parsing JSON de l'analyse", raw);
    return {
      summary: "Erreur d'analyse : le bilan n'a pas pu être généré. Relancez l'analyse.",
      reasoningScore: 0,
      clarityScore: 0,
      skepticismScore: 0,
      processScore: 0,
      reflectionScore: 0,
      integrityScore: 0,
      rhythmBreakCount,
      keyStrengths: [],
      weaknesses: [],
      transcript,
      aiDeclaration,
    };
  }
};
