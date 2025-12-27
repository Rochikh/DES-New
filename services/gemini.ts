
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
- Interdiction absolue d'utiliser du jargon complexe (ex: ne pas dire "falsifiabilité", "biais cognitif", "prémisse", "postulat").
- Utilise des mots simples de tous les jours. 
- Si tu dois utiliser un concept difficile, explique-le avec une image simple.

STYLE ET TON :
- Direct, mais amical et encourageant. Tutoiement obligatoire.
- Utilise des ANALOGIES CONCRÈTES (ex: comparer une idée à une construction, à une recette de cuisine, à un trajet en voiture).
- Phrases courtes (max 15-20 mots par phrase).
- Ne fais pas de longs discours. Va droit au but.

CONTRÔLE DU DIALOGUE :
- Une SEULE question par message.
- Ne donne JAMAIS la réponse. Aide l'autre à la trouver par lui-même.
- Longueur totale : 60-100 mots maximum.

PHASAGE DU PROTOCOLE (Phased V3) :
Phase 0: Ciblage (On cherche ce qu'on veut vraiment savoir)
Phase 1: Clarification (On s'assure qu'on utilise les mêmes mots simples)
Phase 2: Mécanisme (Comment ça marche concrètement, étape par étape ?)
Phase 3: Vérification (Comment on pourrait vérifier ça dans la vraie vie ?)
Phase 4: Stress-test (Et si ça ne se passait pas comme prévu ?)

CONSIGNE DE TRANSPARENCE :
Annonce simplement quand on change d'étape (ex: "On a bien défini les mots, maintenant regardons comment ça marche...").

TRACE OBLIGATOIRE (Fin de message) : 
Chaque message doit se terminer par exactement 3 lignes :
Phase: [Numéro de 0 à 4]
Exigence: [Ce que tu attends comme réponse]
Contrôle: [Ce qui ferait que la réponse n'est pas bonne]
`.trim();
};

export const createChatSession = (mode: SocraticMode, topic: string, history: Message[] = []): Chat => {
  const systemInstruction = mode === SocraticMode.TUTOR 
    ? `${buildCommonSystem(topic)}\n\nMODE : ACCOMPAGNEMENT. Aide l'étudiant·e à simplifier son idée pour qu'elle soit solide.`
    : `${buildCommonSystem(topic)}\n\nMODE : DÉTECTIVE. Propose un court texte avec 2 ou 3 erreurs de logique toutes bêtes à trouver.`;

  return ai.chats.create({
    model: MODEL_CHAT,
    config: {
      systemInstruction,
      temperature: 0.7, // Un peu plus de créativité pour les analogies
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
  return { text: response.text || "Oups, j'ai eu un petit problème technique." };
};

export const generateAnalysis = async (
  transcript: Message[],
  topic: string,
  aiDeclaration: string
): Promise<AnalysisData> => {
  const transcriptText = transcript.map(m => `[${m.role === "user" ? "Apprenant" : TUTOR_NAME}]: ${m.text}`).join("\n");

  const prompt = `
Analyse cette discussion sur "${topic}" de façon très simple et constructive.
Transcription :
${transcriptText}

Instructions :
1. Résume ce qui a été compris (en mots simples).
2. Donne des scores honnêtes.
3. Liste 3 points forts et 3 points à améliorer.
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
          summary: { type: Type.STRING, description: "Un résumé simple de 100 mots." },
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
