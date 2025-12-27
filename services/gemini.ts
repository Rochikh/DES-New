
import { GoogleGenAI, Chat, Type } from "@google/genai";
import { Message, SocraticMode, AnalysisData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_CHAT = "gemini-3-flash-preview";
const MODEL_ANALYSIS = "gemini-3-pro-preview";
const TUTOR_NAME = "ARGOS";

const buildCommonSystem = (topic: string) => {
  return `
IDENTITÉ :
- Tu es ${TUTOR_NAME}.
- Tu es un partenaire de discussion qui aide à réfléchir de façon simple et claire.
- Sujet : "${topic}".

NIVEAU DE LANGUE : 
- Très accessible (Niveau Fin de Collège / Grand Public).
- Interdiction absolue d'utiliser du jargon complexe.
- Utilise des mots simples de tous les jours. 

STYLE ET TON :
- Direct, mais amical et encourageant. Tutoiement obligatoire.
- Utilise des ANALOGIES CONCRÈTES.
- Phrases courtes.

CONTRÔLE DU DIALOGUE :
- Une SEULE question par message.
- Ne donne JAMAIS la réponse. Aide l'autre à la trouver par lui-même.

PHASAGE DU PROTOCOLE (Phased V3) :
Phase 0: Ciblage
Phase 1: Clarification
Phase 2: Mécanisme
Phase 3: Vérification
Phase 4: Stress-test

TRACE OBLIGATOIRE (Fin de message) : 
Chaque message doit se terminer par :
Phase: [Numéro]
Exigence: [Attente]
Contrôle: [Condition]
`.trim();
};

export const createChatSession = (mode: SocraticMode, topic: string, history: Message[] = []): Chat => {
  const systemInstruction = mode === SocraticMode.TUTOR 
    ? `${buildCommonSystem(topic)}\n\nMODE : ACCOMPAGNEMENT.`
    : `${buildCommonSystem(topic)}\n\nMODE : DÉTECTIVE.`;

  return ai.chats.create({
    model: MODEL_CHAT,
    config: {
      systemInstruction,
      temperature: 0.7,
      thinkingConfig: { thinkingBudget: 2048 }
    },
    history: history.map(m => ({
      role: m.role,
      parts: [{ text: m.text }]
    }))
  });
};

export const sendMessage = async (chat: Chat, message: string) => {
  const response = await chat.sendMessage({ message });
  return { text: response.text || "Oups, petit souci technique." };
};

export const generateAnalysis = async (
  transcript: Message[],
  topic: string,
  aiDeclaration: string
): Promise<AnalysisData> => {
  const transcriptText = transcript.map(m => `[${m.role === "user" ? "Apprenant" : TUTOR_NAME}]: ${m.text}`).join("\n");

  const prompt = `
Analyse cette discussion sur "${topic}".
RECOMMANDATION IMPORTANTE : Ne sois pas trop sévère. Si l'apprenant a répondu avec sérieux et a utilisé les images proposées, les scores doivent être élevés (entre 75 et 95). Évite l'incohérence entre un texte positif et des notes basses.

Transcription :
${transcriptText}

Instructions pour le JSON :
1. summary: Un bilan bienveillant de 120 mots.
2. scores: Doivent refléter la réalité de l'échange. Si l'échange est fluide, les scores sont > 80.
3. weaknesses: Appelle-les "Pistes de progression". Ne sois pas cassant.
`.trim();

  const response = await ai.models.generateContent({
    model: MODEL_ANALYSIS,
    contents: prompt,
    config: {
      temperature: 0.2,
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
          keyStrengths: { type: Type.ARRAY, items: { type: Type.STRING } },
          weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["summary", "reasoningScore", "clarityScore", "skepticismScore", "processScore", "reflectionScore", "keyStrengths", "weaknesses"]
      } as any
    }
  });

  return { ...JSON.parse(response.text || "{}"), transcript, aiDeclaration };
};
