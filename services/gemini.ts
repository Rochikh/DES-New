
import { Message, SocraticMode, AnalysisData } from "../types";

const MODEL_CHAT = "deepseek/deepseek-v4-flash";
const MODEL_ANALYSIS = "deepseek/deepseek-v4-flash";
const TUTOR_NAME = "ARGOS";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

const CORE_RULES = `
Identité et mission :
- Tu es ${TUTOR_NAME}, un mentor socratique bienveillant, empathique et complice.
- Tu utilises systématiquement le "TU" (tutoiement) pour t'adresser à l'apprenant·e.
- Ton but est de faire accoucher l'esprit (maïeutique) en guidant la réflexion pas à pas.

Règles d'interaction (BIENVEILLANCE & PROGRESSION) :
1. CONCISION & CLARTÉ : Ne dépasse jamais 3 à 4 phrases par message. Sois limpide.
2. TON NEUTRE ET ENCOURAGEANT : Évite absolument l'enthousiasme excessif, dithyrambique ou les flatteries (ne dis jamais "Excellent", "Parfait", "Fantastique", "Bravo", etc.). Sois sobre, bienveillant mais neutre ("Je vois", "C'est une hypothèse", "Poursuivons sur ce point"). Valide l'effort sans en faire trop. Si l'apprenant·e bloque, propose une analogie simple au lieu de répéter la question.
3. PAUSE PÉDAGOGIQUE : Si l'apprenant·e demande une définition ou semble perdu·e sur un concept, explique-le brièvement (max 2 phrases) puis vérifie immédiatement sa compréhension par une question. Ne laisse jamais l'apprenant·e dans l'impasse.
4. DYNAMISME : Ne reste pas bloqué en Phase 1. Dès qu'une base est posée, avance vers les mécanismes (Phase 2). Si une question ne fonctionne pas, change d'angle d'attaque.
5. POSTURE : Évite les reproches ("Tu esquives"). Préfère l'invitation : "Ce point semble complexe, essayons de le regarder sous un autre angle : ..."

Pilotage invisible : À la toute fin de ton message, ajoute obligatoirement le marqueur de phase sous cette forme exacte, précédé de trois tirets :
---
Phase: [Numéro]
`.trim();

const TUTOR_INSTRUCTIONS = `
${CORE_RULES}

Mode : Tuteur (Accompagnement)
- Ta mission : Fortifier le raisonnement par des questions ouvertes et encourageantes.
- Posture : Un guide qui marche à côté de l'apprenant·e, attentif à ses difficultés.
`.trim();

const CRITIC_INSTRUCTIONS = `
${CORE_RULES}

Mode : Critique (Audit Logique)
- Ta mission : Proposer des raisonnements fallacieux pour tester la vigilance, mais reste un partenaire de jeu.
- Posture : Un avocat du diable élégant et stimulant, qui s'amuse des sophismes sans être méprisant.
`.trim();

export class OpenRouterChatSession {
  private systemInstruction: string;
  private history: {role: string, content: string}[];

  constructor(systemInstruction: string, history: Message[]) {
    this.systemInstruction = systemInstruction;
    this.history = history.map(m => ({
      role: m.role === 'model' ? 'assistant' : 'user',
      content: m.text
    }));
  }

  async sendMessage({ message }: { message: string }) {
    this.history.push({ role: 'user', content: message });

    const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("Clé API manquante ou non configurée");

    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': window.location?.origin || 'https://rochanekherbouche.com',
        'X-Title': 'Argos Socratique (OpenRouter)',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: MODEL_CHAT,
        temperature: 0.8,
        messages: [
          { role: 'system', content: this.systemInstruction },
          ...this.history
        ]
      })
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`OpenRouter Error: ${response.status} ${err}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "";
    
    this.history.push({ role: 'assistant', content: text });

    return { text };
  }
}

export const createChatSession = (mode: SocraticMode, topic: string, history: Message[] = []): any => {
  const systemInstruction = mode === SocraticMode.TUTOR 
    ? `${TUTOR_INSTRUCTIONS}\n\nSujet d'exploration : "${topic}".`
    : `${CRITIC_INSTRUCTIONS}\n\nSujet d'exploration : "${topic}".`;

  return new OpenRouterChatSession(systemInstruction, history);
};

export const sendMessage = async (chat: any, message: string) => {
  const response = await chat.sendMessage({ message });
  return { text: response.text || "Erreur de transmission." };
};

export const generateAnalysis = async (
  transcript: Message[],
  topic: string,
  aiDeclaration: string
): Promise<AnalysisData> => {
  const transcriptWithTiming = transcript.map(m => {
    const timing = m.role === 'user' ? ` [Temps de saisie: ${m.responseTimeSeconds}s]` : '';
    return `[${m.role === "user" ? "Apprenant·e" : TUTOR_NAME}]: ${m.text}${timing}`;
  }).join("\n");

  const prompt = `
Analyse cette discussion sur "${topic}".
Déclaration d'usage IA : "${aiDeclaration}"

Ta mission :
Évalue la progression cognitive. Sois attentif à l'honnêteté intellectuelle et à la capacité de l'apprenant·e à tenir tête à Argos.

Transcription :
${transcriptWithTiming}

Instructions de sortie (JSON) :
- summary: Bilan de la progression cognitive (150 mots max).
- reasoningScore: (0 à 100)
- clarityScore: (0 à 100)
- skepticismScore: (0 à 100)
- processScore: (0 à 100)
- reflectionScore: (0 à 100)
- rhythmBreakCount: Le nombre de réponses utilisateur présentant une rupture de rythme (saisie trop rapide).
- integrityScore: Reflet de la cohérence globale (0 à 100).
- keyStrengths: ["...", "..."]
- weaknesses: ["...", "..."]
`.trim();

  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Clé API manquante");

  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': window.location?.origin || 'https://rochanekherbouche.com',
      'X-Title': 'Argos Socratique (OpenRouter)',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: MODEL_ANALYSIS,
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        { role: 'user', content: prompt }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`OpenRouter Analysis Error: ${response.status}`);
  }

  const data = await response.json();
  const textContent = data.choices?.[0]?.message?.content || "{}";
  
  try {
    const parsed = JSON.parse(textContent);
    return { ...parsed, transcript, aiDeclaration };
  } catch (err) {
    console.error("Erreur de parsing JSON", textContent);
    return {
      summary: "Erreur d'analyse.",
      reasoningScore: 0,
      clarityScore: 0,
      skepticismScore: 0,
      processScore: 0,
      reflectionScore: 0,
      integrityScore: 0,
      rhythmBreakCount: 0,
      keyStrengths: [],
      weaknesses: [],
      transcript,
      aiDeclaration
    };
  }
};
