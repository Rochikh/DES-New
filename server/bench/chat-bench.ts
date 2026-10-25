/**
 * Banc du dialogue : rejoue trois profils d'apprenant·e scriptés contre la
 * vraie fonction de chat (prompt de prod, fournisseur choisi par AI_PROVIDER)
 * et sauvegarde les réponses brutes, avant tout parsing.
 *
 * Lancement (depuis server/) :
 *   npx tsx --env-file=/root/infra/env/argos.env bench/chat-bench.ts [--simule] [--provider claude|deepseek] [A|B|C|D...]
 *
 * --provider remplace AI_PROVIDER pour ce lancement (client de prod du
 * fournisseur choisi, sans repli instrumenté pour deepseek).
 *
 * Par défaut, les réponses d'apprenant·e sont scriptées (comparaison avant/
 * après). Avec --simule, claude-haiku-5-5 les génère à partir d'une
 * consigne de persona, en réponse au texte affiché d'Argos.
 *
 * Sortie : bench/out/<horodatage>/<profil>.json et summary.md
 */
import Anthropic from '@anthropic-ai/sdk';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClaudeClient } from '../src/claude.js';
import { createDeepSeekClient } from '../src/deepseek.js';
import { CLAUDE_MODEL, DEEPSEEK_TIMEOUT_MS, MODEL_CHAT } from '../src/config.js';
import { withFallback } from '../src/provider.js';
import type { ChatRequest, LlmClient } from '../src/llm.js';
import { buildChatSystemParts, type ChatMode } from '../src/prompts/core.js';
import { cleanDisplayBotText, extractPhase, extractRegime } from '../../client/src/utils/phase.js';
import type { Regime } from '../../client/src/types.js';

interface Profile {
  id: string;
  label: string;
  mode: ChatMode;
  studentName: string;
  topic: string;
  corpus?: string;
  replies: string[];
  persona: string;
}

const SIMULATOR_MODEL = 'claude-haiku-5-5';
const SIMULATED_TURNS = 6;

const PERSONA_FRAME = `Tu joues un·e étudiant·e qui dialogue avec un tuteur nommé Argos. Écris uniquement la réplique de l'étudiant·e, en français, sans didascalie, sans mise en forme, sans sortir du rôle. Réponds à ce qu'Argos vient de te dire. Tes connaissances se limitent à ton profil et au texte ci-dessous.`;

const GROUP_CORPUS = `Définition. Un groupe est un couple (G, *) formé d'un ensemble G et d'une loi de composition interne * sur G qui vérifie trois propriétés :
1. Associativité : pour tous a, b, c de G, (a * b) * c = a * (b * c).
2. Élément neutre : il existe un élément e de G tel que, pour tout a de G, a * e = e * a = a.
3. Symétrique : pour tout a de G, il existe un élément a' de G tel que a * a' = a' * a = e.
Si de plus a * b = b * a pour tous a, b, le groupe est dit commutatif (ou abélien).
Exemples : (Z, +) est un groupe commutatif, de neutre 0, le symétrique de n étant -n. (N, +) n'est pas un groupe : 1 n'a pas de symétrique dans N.`;

const ROUSSEAU_CORPUS = `Rousseau, Du contrat social, livre II, chapitre 3 :
« Il y a souvent bien de la différence entre la volonté de tous et la volonté générale ; celle-ci ne regarde qu'à l'intérêt commun, l'autre regarde à l'intérêt privé, et n'est qu'une somme de volontés particulières : mais ôtez de ces mêmes volontés les plus et les moins qui s'entre-détruisent, reste pour somme des différences la volonté générale. »
« Si, quand le peuple suffisamment informé délibère, les citoyens n'avaient aucune communication entre eux, du grand nombre de petites différences résulterait toujours la volonté générale, et la délibération serait toujours bonne. Mais quand il se fait des brigues, des associations partielles aux dépens de la grande, la volonté de chacune de ces associations devient générale par rapport à ses membres, et particulière par rapport à l'État. »
« Il importe donc, pour avoir bien l'énoncé de la volonté générale, qu'il n'y ait pas de société partielle dans l'État, et que chaque citoyen n'opine que d'après lui. »`;

const THESIS_TOPIC =
  "Ma thèse : chez Rousseau, la volonté générale n'est pas la volonté de la majorité, et les factions la corrompent";

const THESIS_REPLIES = [
  "Je veux défendre une thèse : la volonté générale ne se confond pas avec la volonté de tous. J'ai bien travaillé ce chapitre, je le connais.",
  "La volonté de tous additionne des intérêts privés. La volonté générale vise l'intérêt commun : quand on retire les « plus et les moins qui s'entre-détruisent », il reste ce qui est commun à tous.",
  "Le mécanisme, c'est que les écarts individuels se compensent quand les citoyens votent chacun de leur côté. Les brigues cassent ça : une faction vote en bloc, donc son intérêt particulier pèse comme un seul gros écart qui ne se compense plus.",
  "Pour vérifier, je regarderais si, dans un vote où une faction domine, le résultat sert l'intérêt de la faction plutôt que celui de tous. Le texte dit que la volonté de l'association devient « générale par rapport à ses membres, et particulière par rapport à l'État ».",
  "Une limite : Rousseau suppose que le peuple est « suffisamment informé ». Si l'information est mauvaise, même sans faction, la somme des différences peut se tromper.",
  "Et l'interdiction des sociétés partielles pose problème aujourd'hui : partis, syndicats, associations. On pourrait y voir une tentation autoritaire.",
];

const PERSONA_A = `${PERSONA_FRAME}
Profil : Camille, première année de licence, aucune pratique de l'algèbre abstraite. Tu as sous les yeux le texte ci-dessous, qui définit un groupe, et tu le comprends mal. Tu veux comprendre cette structure, sans évaluation en vue. Tes réponses sont courtes : une phrase, souvent moins de quinze mots, avec des hésitations (« euh », « je crois », « je sais pas trop »). Environ une fois sur trois, tu dis que tu ne sais pas. Tu confonds facilement associativité et commutativité. Quand Argos explique avec un exemple simple, tu progresses un peu et tu le montres par une réponse en partie juste.
<texte>
${GROUP_CORPUS}
</texte>`;

const PERSONA_E = `${PERSONA_FRAME}
Profil : Alix, première année de licence. Tu as suivi le cours sur les groupes il y a trois semaines et tu révises pour un partiel la semaine prochaine. Tu as sous les yeux le texte ci-dessous. Tu sais citer les trois propriétés et tu sais que (Z, +) est un groupe. Tu confonds encore associativité et commutativité : tu crois que l'associativité permet d'échanger a et b. Tes réponses font une à trois phrases, sur un ton assez assuré, parfois fausses sans que tu le saches. Tu demandes volontiers des exercices du type de ceux du partiel. Quand Argos te montre la différence sur un exemple précis, tu la comprends en partie : il te faut un deuxième exemple pour cesser de confondre.
<texte>
${GROUP_CORPUS}
</texte>`;

const THESIS_PERSONA = `Profil : Sacha, licence de philosophie. Tu as travaillé à fond le passage du Contrat social ci-dessous. Ta thèse : chez Rousseau, la volonté générale diffère de la volonté de la majorité, et les factions la corrompent. Tu es à l'aise : deux à quatre phrases par réponse, vocabulaire précis, citations exactes du passage quand elles servent ton propos. Tu défends ta thèse avec conviction. Tu concèdes un point seulement face à un argument solide, et tu contestes quand Argos te paraît se tromper sur le texte.`;

const CRITIC_PERSONA_ADDON = `Argos t'a prévenu·e qu'il défendrait parfois des raisonnements douteux. Quand un de ses arguments te semble fallacieux, dis-le et nomme la faille. Les plus subtils t'échappent parfois.`;

const PERSONA_B = `${PERSONA_FRAME}
${THESIS_PERSONA}
<texte>
${ROUSSEAU_CORPUS}
</texte>`;

const PERSONA_C = `${PERSONA_FRAME}
${THESIS_PERSONA}
${CRITIC_PERSONA_ADDON}
<texte>
${ROUSSEAU_CORPUS}
</texte>`;

const PERSONA_D = `${PERSONA_FRAME}
${THESIS_PERSONA}
${CRITIC_PERSONA_ADDON}
Tu n'as pas le texte sous les yeux, tu cites de mémoire.`;

const PROFILES: Profile[] = [
  {
    id: 'A',
    persona: PERSONA_A,
    label: 'Novice, Tuteur, définition d\'un groupe',
    mode: 'TUTOR',
    studentName: 'Camille',
    topic: 'comprendre cette structure',
    corpus: GROUP_CORPUS,
    replies: [
      "euh je sais pas trop, j'ai jamais fait d'algèbre comme ça",
      "c'est un ensemble avec une opération ? je crois",
      'je sais pas',
      "l'associativité c'est quand l'ordre compte pas ?",
      "peut-être que l'élément neutre c'est zéro ? mais je suis pas sûre",
      'je vois pas trop',
    ],
  },
  {
    id: 'B',
    persona: PERSONA_B,
    label: 'Thèse sur corpus maîtrisé, Tuteur',
    mode: 'TUTOR',
    studentName: 'Sacha',
    topic: THESIS_TOPIC,
    corpus: ROUSSEAU_CORPUS,
    replies: THESIS_REPLIES,
  },
  {
    id: 'C',
    persona: PERSONA_C,
    label: 'Thèse sur corpus maîtrisé, Critique',
    mode: 'CRITIC',
    studentName: 'Sacha',
    topic: THESIS_TOPIC,
    corpus: ROUSSEAU_CORPUS,
    replies: THESIS_REPLIES,
  },
  {
    id: 'D',
    persona: PERSONA_D,
    label: 'Thèse sans corpus, Critique',
    mode: 'CRITIC',
    studentName: 'Sacha',
    topic: THESIS_TOPIC,
    replies: THESIS_REPLIES,
  },
  {
    id: 'E',
    persona: PERSONA_E,
    label: 'Révision avant partiel, Tuteur, définition d\'un groupe',
    mode: 'TUTOR',
    studentName: 'Alix',
    topic: 'réviser la notion de groupe pour mon partiel de la semaine prochaine',
    corpus: GROUP_CORPUS,
    // Profil joué en simulé seulement.
    replies: [],
  },
  {
    id: 'F',
    // Profils F et G joués en scripté seulement : langue de l'apprenant·e.
    persona: '',
    label: 'Novice anglophone, Tuteur, sans corpus',
    mode: 'TUTOR',
    studentName: 'Sam',
    topic: 'understanding photosynthesis',
    replies: [
      "I'd like to understand it for my biology class. I know plants need sunlight, but not much more.",
      'I think plants take in carbon dioxide and give out oxygen?',
      "Maybe the light gives energy to make sugar? I'm not sure where the water goes.",
      'So the oxygen comes from the water, not from the CO2? That surprises me.',
    ],
  },
  {
    id: 'G',
    persona: '',
    label: 'Novice arabophone, Tuteur, sans corpus',
    mode: 'TUTOR',
    studentName: 'Nour',
    topic: 'فهم أسباب الاحتباس الحراري',
    replies: [
      'أريد أن أفهم هذا الموضوع لدرس الجغرافيا. أعرف أن الأرض تسخن، لكنني لا أعرف لماذا.',
      'أظن أن ثاني أكسيد الكربون يحبس الحرارة؟',
      'ربما لأن أشعة الشمس تدخل ولا تستطيع الخروج كلها؟',
      'إذن الغازات تمتص الأشعة تحت الحمراء التي تصدرها الأرض؟',
    ],
  },
];

/** Dernière ligne mentionnant « phase » (insensible à la casse), telle quelle. */
const rawPhaseMarker = (text: string): string | null => {
  const lines = text.split('\n').filter((l) => /phase/i.test(l));
  return lines.length ? lines[lines.length - 1].trim() : null;
};

const wordCount = (text: string): number => text.split(/\s+/).filter(Boolean).length;

interface Turn {
  turn: number;
  user: string;
  /** Mode simulé : stop_reason de la réplique (max_tokens = réplique coupée) */
  learnerStop: string | null;
  raw: string;
  rawMarker: string | null;
  /** Ligne Plan du bloc technique, telle quelle */
  plan: string | null;
  /** Le message se termine-t-il par ---\n[Plan]\n[Régime]\nPhase: N, forme exacte exigée ? */
  markerWellFormed: boolean;
  parsedPhase: number;
  parsedRegime: Regime | null;
  displayed: string;
  displayedHasMarker: boolean;
  words: number;
  provider: string;
}

const buildClient = (providerArg: string | undefined, onFallback: () => void): { client: LlmClient; provider: string } => {
  const provider = (providerArg ?? process.env.AI_PROVIDER ?? 'deepseek').trim().toLowerCase();
  const deepseek = createDeepSeekClient(process.env.DEEPSEEK_API_KEY ?? '');
  if (provider !== 'claude') {
    // Même chemin que la prod : repli sur Claude (429, 5xx, délai), instrumenté.
    const claude = createClaudeClient(process.env.ANTHROPIC_API_KEY ?? '', deepseek);
    const fallback: LlmClient = {
      chat: (req) => {
        onFallback();
        return claude.chat(req);
      },
      analysis: (p) => claude.analysis(p),
    };
    return { client: withFallback(deepseek, fallback, DEEPSEEK_TIMEOUT_MS), provider: `deepseek ${MODEL_CHAT}` };
  }
  // Le repli est instrumenté : un tour servi par DeepSeek est signalé.
  const fallback: LlmClient = {
    chat: (req) => {
      onFallback();
      return deepseek.chat(req);
    },
    analysis: (p) => deepseek.analysis(p),
  };
  return { client: createClaudeClient(process.env.ANTHROPIC_API_KEY ?? '', fallback), provider: `claude ${CLAUDE_MODEL}` };
};

const simulator = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? '' });

/** Réplique de l'apprenant·e simulé·e : Argos parle en user, l'apprenant·e en assistant. */
const simulateReply = async (
  persona: string,
  dialogue: Array<{ argos: string; learner?: string }>
): Promise<{ reply: string; stop: Anthropic.Message['stop_reason'] }> => {
  const messages: Anthropic.MessageParam[] = dialogue.flatMap((d) => [
    { role: 'user' as const, content: d.argos },
    ...(d.learner ? [{ role: 'assistant' as const, content: d.learner }] : []),
  ]);
  // Raisonnement désactivé : actif par défaut, il épuisait le plafond
  // et laissait une réplique vide. À 400 tokens, les répliques étaient coupées.
  const response = await simulator.messages.create({
    model: SIMULATOR_MODEL,
    max_tokens: 1000,
    thinking: { type: 'disabled' },
    system: persona,
    messages,
  });
  const reply = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('')
    .trim();
  if (!reply) throw new Error(`Réplique simulée vide (stop=${response.stop_reason})`);
  return { reply, stop: response.stop_reason };
};

const runProfile = async (profile: Profile, simulated: boolean, providerArg: string | undefined, turns: Turn[]): Promise<void> => {
  let fellBack = false;
  const { client, provider } = buildClient(providerArg, () => (fellBack = true));
  const system = buildChatSystemParts(profile.mode, profile.topic, profile.corpus);
  // Même message d'ouverture que ChatView.tsx
  const opening = `Bonjour Argos, je suis ${profile.studentName}. Lancez la session sur : ${profile.topic}.`;
  const messages: ChatRequest['messages'] = [];
  let phase = 0;
  let regime: Regime | null = null;

  // Côté simulateur, l'apprenant·e ne voit que le texte affiché d'Argos.
  const dialogue: Array<{ argos: string; learner?: string }> = [];

  const nTurns = simulated ? SIMULATED_TURNS : profile.replies.length;
  for (let i = 0; i <= nTurns; i++) {
    let user: string;
    let learnerStop: string | null = null;
    if (i === 0) user = opening;
    else if (simulated) {
      const sim = await simulateReply(profile.persona, dialogue);
      user = sim.reply;
      learnerStop = sim.stop;
      dialogue[dialogue.length - 1].learner = user;
    } else user = profile.replies[i - 1];
    messages.push({ role: 'user', content: user });
    fellBack = false;
    const raw = await client.chat({ system, messages: [...messages] });
    messages.push({ role: 'assistant', content: raw });
    phase = extractPhase(raw, phase);
    regime = extractRegime(raw, regime);
    const displayed = cleanDisplayBotText(raw);
    dialogue.push({ argos: displayed });
    turns.push({
      turn: i,
      user,
      learnerStop,
      raw,
      rawMarker: rawPhaseMarker(raw),
      plan: raw.match(/^Plan:.*$/m)?.[0].trim() ?? null,
      markerWellFormed: /\n---\s*\n(Plan: .+\n)?(Régime: (acquisition|consolidation|épreuve)\n)?Phase: \d\s*$/.test(raw),
      parsedPhase: phase,
      parsedRegime: regime,
      displayed,
      displayedHasMarker: /phase\s*:?\s*\d|Plan:|R[ée]gime\s*:/i.test(displayed) || displayed.includes('---'),
      words: wordCount(displayed),
      provider: fellBack ? (provider.startsWith('claude') ? 'deepseek (repli)' : 'claude (repli)') : provider,
    });
    if (learnerStop === 'max_tokens') console.warn(`[${profile.id}] tour ${i} : réplique simulée coupée (stop=max_tokens)`);
    console.info(`[${profile.id}] tour ${i} : régime ${regime ?? '-'}, phase ${phase}, ${turns[i].words} mots, marqueur ${JSON.stringify(turns[i].rawMarker)}`);
  }
};

/** Numéros d'étapes de la ligne Plan (« 1. », « / 2. »...). */
const stepNumbers = (plan: string | null): number[] =>
  [...(plan ?? '').matchAll(/(?:étapes\s*:\s*|\/\s*)(\d+)\./g)].map((m) => Number(m[1]));

/**
 * Révisions du plan par type, d'un tour au suivant : régime changé, mention
 * « (aide renforcée) » nouvelle, étapes ajoutées (découpage ou nouvelle
 * direction : le type se lit dans la ligne Plan).
 */
const revisionCounts = (turns: Turn[]): string => {
  let regime = 0;
  let aid = 0;
  let added = 0;
  for (let i = 1; i < turns.length; i++) {
    const prev = turns[i - 1];
    const cur = turns[i];
    if (prev.parsedRegime && cur.parsedRegime !== prev.parsedRegime) regime++;
    const aidCount = (p: string | null) => (p?.match(/\(aide renforcée\)/g) ?? []).length;
    aid += Math.max(0, aidCount(cur.plan) - aidCount(prev.plan));
    if (prev.plan) {
      const before = new Set(stepNumbers(prev.plan));
      added += stepNumbers(cur.plan).filter((n) => !before.has(n)).length;
    }
  }
  return `Révisions : régime changé ${regime}, aide renforcée ${aid}, étapes ajoutées ${added}`;
};

const median = (xs: number[]): number => {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

const main = async () => {
  const args = process.argv.slice(2);
  const simulated = args.includes('--simule');
  const providerIndex = args.indexOf('--provider');
  const providerArg = providerIndex >= 0 ? args[providerIndex + 1] : undefined;
  if (providerIndex >= 0 && providerArg !== 'claude' && providerArg !== 'deepseek') {
    throw new Error(`--provider vaut "${providerArg}", valeurs acceptées : claude ou deepseek.`);
  }
  const wanted = args
    .filter((a, i) => a !== '--simule' && (providerIndex < 0 || (i !== providerIndex && i !== providerIndex + 1)))
    .map((a) => a.toUpperCase());
  const selected = wanted.length ? PROFILES.filter((p) => wanted.includes(p.id)) : PROFILES;
  const here = path.dirname(fileURLToPath(import.meta.url));
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outDir = path.join(here, 'out', simulated ? `${stamp}-simule` : stamp);
  fs.mkdirSync(outDir, { recursive: true });

  const summary: string[] = [];
  // Profils en série : en parallèle, la limite de connexions Claude
  // déclencherait le repli DeepSeek et fausserait la mesure.
  for (const profile of selected) {
    if (!simulated && !profile.replies.length) {
      console.info(`[${profile.id}] ignoré en scripté : profil sans réponses fixes`);
      continue;
    }
    if (simulated && !profile.persona) {
      console.info(`[${profile.id}] ignoré en simulé : profil sans persona`);
      continue;
    }
    const turns: Turn[] = [];
    try {
      await runProfile(profile, simulated, providerArg, turns);
    } finally {
      // Tours déjà joués sauvegardés même si un appel échoue en cours de route.
      fs.writeFileSync(path.join(outDir, `${profile.id}.json`), JSON.stringify({ profile, simulated, turns }, null, 2));
    }
    summary.push(
      `## Profil ${profile.id} : ${profile.label}`,
      '',
      '| Tour | Marqueur brut | Forme exacte | Régime | Phase parsée | Marqueur visible | Étape du plan | Mots | Fournisseur | Plan |',
      '|---|---|---|---|---|---|---|---|---|---|',
      ...turns.map(
        (t) =>
          `| ${t.turn} | ${t.rawMarker === null ? '(absent)' : '`' + t.rawMarker + '`'} | ${t.markerWellFormed ? 'oui' : 'non'} | ${t.parsedRegime ?? '-'} | ${t.parsedPhase} | ${t.displayedHasMarker ? 'oui' : 'non'} | ${t.plan?.match(/en cours\s*:\s*(\d+)/)?.[1] ?? '-'} | ${t.words} | ${t.provider} | ${t.plan ?? '(absent)'} |`
      ),
      '',
      `Longueur médiane : ${median(turns.map((t) => t.words))} mots`,
      '',
      revisionCounts(turns),
      ''
    );
  }
  fs.writeFileSync(path.join(outDir, 'summary.md'), summary.join('\n'));
  console.info(`\n${summary.join('\n')}\nRésultats : ${outDir}`);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
