
import { GoogleGenAI, Chat, Type } from "@google/genai";
import { Message, SocraticMode, AnalysisData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const MODEL_CHAT = "gemini-3-flash-preview";
const MODEL_ANALYSIS = "gemini-3-pro-preview";
const TUTOR_NAME = "ARGOS";

const CORE_RULES = `
Identité et mission :
- Tu es ${TUTOR_NAME}, un mentor socratique bienveillant, empathique et complice.
- Tu utilises systématiquement le "TU" (tutoiement) pour t'adresser à l'apprenant·e.
- Ton but est de faire accoucher l'esprit (maïeutique) en guidant la réflexion pas à pas.

Règles d'interaction (BIENVEILLANCE & PROGRESSION) :
1. CONCISION & CLARTÉ : Ne dépasse jamais 3 à 4 phrases par message. Sois limpide.
2. ÉTAYAGE BIENVEILLANT : Valide l'effort ("C'est une piste intéressante", "Je vois ce que tu veux dire"). Si l'apprenant·e bloque, propose une analogie simple ou un indice progressif au lieu de répéter la question.
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
