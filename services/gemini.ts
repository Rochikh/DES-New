
import { GoogleGenAI, Chat, Type } from "@google/genai";
import { Message, SocraticMode, AnalysisData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_CHAT = "gemini-3-flash-preview";
const MODEL_ANALYSIS = "gemini-3-pro-preview";
const TUTOR_NAME = "ARGOS";

const CORE_RULES = `
Identité et mission :
- Tu es ${TUTOR_NAME}, un mentor socratique exigeant mais complice.
- Tu utilises systématiquement le "TU" (tutoiement) pour t'adresser à l'apprenant·e.
- Ton but est de faire accoucher l'esprit (maïeutique) sans jamais donner de réponses toutes faites.

Règles d'interaction (CONCISION & RYTHME) :
1. CONCISION EXTRÊME : Ne dépasse jamais 3 phrases par message. Sois percutant.
2. PAS DE COMPLAISANCE : Ne dis jamais "C'est bien", "Bravo" ou "Je suis d'accord". Rebondis directement sur la faille logique ou la prochaine étape.
3. FLUIDITÉ DES PHASES : Ne reste pas bloqué en Phase 1 (Clarification). Dès que l'apprenant·e a donné une définition même imparfaite, passe immédiatement à la Phase 2 (Mécanisme) pour explorer les causes et conséquences. Le mouvement est vital pour l'intérêt du dialogue.
4. DÉTECTION D'ESQUIVE : Si l'apprenant·e te pose une question pour fuir sa propre réflexion, dis-lui : "Tu esquives ma question. Pourquoi ce point t'embarrasse-t-il ? Revenons à..."

Pilotage invisible : À la toute fin de ton message, ajoute obligatoirement le marqueur de phase sous cette forme exacte, précédé de trois tirets :
---
Phase: [Numéro]
`.trim();

const TUTOR_INSTRUCTIONS = `
${CORE_RULES}

Mode : Tuteur (Le Sparring-Partner)
- Ta mission : Guider la réflexion par des questions courtes. Pose une seule question à la fois.
- Posture : Direct, franc, mais engagé dans la réussite de l'autre.
`.trim();

const CRITIC_INSTRUCTIONS = `
${CORE_RULES}

Mode : Critique (L'Audit Logique)
- Ta mission : Proposer des raisonnements fallacieux pour tester la vigilance de l'autre.
- Posture : Un partenaire de débat provocateur qui utilise des sophismes élégants.
`.trim();

export const createChatSession = (mode: SocraticMode, topic: string, history: Message[] = []): Chat => {
  const systemInstruction = mode === SocraticMode.TUTOR 
    ? `${TUTOR_INSTRUCTIONS}\n\nSujet d'exploration : "${topic}".`
    : `${CRITIC_INSTRUCTIONS}\n\nSujet d'exploration : "${topic}".`;

  return ai.chats.create({
    model: MODEL_CHAT,
    config: {
      systemInstruction,
      temperature: 0.8,
      thinkingConfig: { thinkingBudget: 1024 }
    },
    history: history.map(m => ({
      role: m.role,
      parts: [{ text: m.text }]
    }))
  });
};

export const sendMessage = async (chat: Chat, message: string) => {
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
- rhythmBreakCount: Le nombre de réponses utilisateur présentant une rupture de rythme (saisie trop rapide).
- integrityScore: Reflet de la cohérence globale (0 à 100).
`.trim();

  const response = await ai.models.generateContent({
    model: MODEL_ANALYSIS,
    contents: prompt,
    config: {
      temperature: 0.1,
      thinkingConfig: { thinkingBudget: 4096 },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          reasoningScore: { type: Type.INTEGER },
          clarityScore: { type: Type.INTEGER },
          skepticismScore: { type: Type.INTEGER },
          processScore: { type: Type.INTEGER },
          reflectionScore: { type: Type.INTEGER },
          integrityScore: { type: Type.INTEGER },
          rhythmBreakCount: { type: Type.INTEGER },
          keyStrengths: { type: Type.ARRAY, items: { type: Type.STRING } },
          weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["summary", "reasoningScore", "clarityScore", "skepticismScore", "processScore", "reflectionScore", "integrityScore", "rhythmBreakCount", "keyStrengths", "weaknesses"]
      } as any
    }
  });

  const parsed = JSON.parse(response.text || "{}");
  return { ...parsed, transcript, aiDeclaration };
};
