
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
- Tu conduis un "Dialogue Évaluatif Socratique" (DES).
- Tu n’es pas un coach. Tu es un dispositif de guidage critique.
- Sujet : "${topic}".

LANGUE : Français uniquement. Tutoiement obligatoire. Écriture inclusive au point médian.

TON : Direct, sobre, sceptique. Interdits : compliments, flatterie, encouragements creux.
Autorisé : reconnaissance minimale de la charge cognitive (ex: "Difficile est normal ici.").

CONTRÔLE : Une seule question par message. Pas de corrigé. Longueur : 70-140 mots.

ANTI-GAMING : Refuse le "ça dépend" sans critère ou le "c'est logique".

INTENTIONS (A/B/C/D) : Identifier si l'étudiant veut explorer (A), vérifier (B), argumenter (C) ou produire (D).

PHASAGE :
Phase 0: Ouverture (Intention)
Phase 1: Clarification (Termes)
Phase 2: Mécanisme (Comment)
Phase 3: Vérification (Protocole)
Phase 4: Stress-test (Contre-exemple)

TRACE (obligatoire à partir de Phase 2) : 
Finir chaque message par exactement 2 lignes :
Exigence: [Action]
Contrôle: [Condition d'échec]
`.trim();
};

export const createChatSession = (mode: SocraticMode, topic: string, history: Message[] = []): Chat => {
  const systemInstruction = mode === SocraticMode.TUTOR 
    ? `${buildCommonSystem(topic)}\n\nMODE : DÉFENSE (évaluation du raisonnement). Reformulation neutre + Question unique.`
    : `${buildCommonSystem(topic)}\n\nMODE : AUDIT (vigilance). Propose un texte de 150 mots avec 3 défauts constants.`;

  return ai.chats.create({
    model: MODEL_CHAT,
    config: {
      systemInstruction,
      temperature: 0.6,
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
  return { text: response.text || "Erreur de réponse." };
};

export const generateAnalysis = async (
  transcript: Message[],
  topic: string,
  aiDeclaration: string
): Promise<AnalysisData> => {
  const transcriptText = transcript.map(m => `[${m.role === "user" ? "Étudiant·e" : TUTOR_NAME}]: ${m.text}`).join("\n");

  const prompt = `
Analyse le dialogue suivant sur "${topic}". Produis un rapport JSON de processus.
Déclaration IA : "${aiDeclaration}"
Transcription :
${transcriptText}

SCORING (0-100) : Commence à 40. >40 si protocoles explicités. <40 si flou persistant.
`.trim();

  const response = await ai.models.generateContent({
    model: MODEL_ANALYSIS,
    contents: prompt,
    config: {
      temperature: 0.3,
      thinkingConfig: { thinkingBudget: 4096 },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING, description: "120-170 mots, commence par les insuffisances." },
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
