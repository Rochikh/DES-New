
import { GoogleGenAI, Chat, Type } from "@google/genai";
import { Message, SocraticMode, AnalysisData } from "../types";
import { CRITICAL_THINKING_CRITERIA } from "../domainCriteria";

// On utilise une fonction pour récupérer l'instance afin d'être sûr de lire la clé au dernier moment
const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === "undefined" || apiKey === "") {
    throw new Error("Clé API manquante : Assurez-vous d'avoir configuré la variable d'environnement API_KEY dans Vercel.");
  }
  return new GoogleGenAI({ apiKey });
};

// Modèle Flash pour la discussion (plus rapide, moins de quota) 
// et Pro pour l'analyse finale (plus profond)
const CHAT_MODEL = "gemini-3-flash-preview"; 
const ANALYSIS_MODEL = "gemini-3-pro-preview";
const TUTOR_NAME = "Argos";

export const createChatSession = (mode: SocraticMode, topic: string, history: Message[] = []): Chat => {
  const ai = getAI();
  
  const systemInstruction = `
Tu es ${TUTOR_NAME}, un tuteur socratique bienveillant mais intellectuellement exigeant. Ton but est d'aider l'étudiant à muscler sa pensée critique sur : "${topic}".

OBJECTIF : Évaluer et encourager la capacité de l'étudiant à raisonner par lui-même.
CRITÈRES DE RÉFLEXION : ${CRITICAL_THINKING_CRITERIA.join(", ")}.

MÉTHODE :
- Tutoiement systématique et chaleureux.
- Ne donne JAMAIS la réponse. Aide l'étudiant à la trouver en le questionnant.
- Pose une seule question à la fois, courte, percutante et incitative.
- Au tout début, salue l'étudiant par son prénom de manière amicale.
- Mode ${mode === SocraticMode.TUTOR ? 'DÉFENSE : tu aides l\'étudiant à approfondir et solidifier sa propre argumentation' : 'CRITIQUE : tu proposes un court texte plausible contenant 2 ou 3 failles logiques que l\'étudiant doit identifier'}.

STRUCTURE DES RÉPONSES (À partir du 2ème message) :
Ajoute toujours ces balises pédagogiques en fin de message :
💡 Exigence : [Ce que j'attends de toi maintenant pour avancer]
🔍 Contrôle : [Le point logique ou le critère que nous surveillons ensemble]
  `.trim();

  return ai.chats.create({
    model: CHAT_MODEL,
    history: history.map(m => ({ 
      role: m.role, 
      parts: [{ text: m.text }] 
    })),
    config: { 
      systemInstruction, 
      temperature: 0.7 
    }
  });
};

export const sendMessage = async (chat: Chat, message: string) => {
  const response = await chat.sendMessage({ message });
  if (!response.text) {
    throw new Error("Réponse vide de l'IA. Vérifiez vos quotas ou les filtres de sécurité.");
  }
  return { text: response.text };
};

export const generateAnalysis = async (
  transcript: Message[],
  topic: string,
  aiDeclaration: string
): Promise<AnalysisData> => {
  const ai = getAI();
  const transcriptText = transcript.map(m => `[${m.role === "user" ? "Étudiant" : TUTOR_NAME}]: ${m.text}`).join("\n");

  const prompt = `
Analyse avec précision ce dialogue socratique sur le sujet "${topic}".
L'étudiant déclare ceci sur son usage de l'IA : "${aiDeclaration}"

Transcription :
${transcriptText}

Évalue sur 100 les dimensions de pensée critique suivantes : ${CRITICAL_THINKING_CRITERIA.join(", ")}.
Réponds au format JSON strict.
  `.trim();

  const response = await ai.models.generateContent({
    model: ANALYSIS_MODEL,
    contents: prompt,
    config: {
      temperature: 0.2,
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
          disciplinaryDiscernmentScore: { type: Type.INTEGER },
          aiDeclarationCoherenceScore: { type: Type.INTEGER },
          keyStrengths: { type: Type.ARRAY, items: { type: Type.STRING } },
          weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
          aiUsageAnalysis: { type: Type.STRING }
        },
        required: ["summary", "reasoningScore", "aiDeclarationCoherenceScore", "keyStrengths", "weaknesses", "aiUsageAnalysis"]
      }
    }
  });

  const jsonStr = response.text.trim();
  return { ...JSON.parse(jsonStr), transcript, aiDeclaration };
};
