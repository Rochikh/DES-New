import { GoogleGenAI, Chat, Type } from "@google/genai";
import { Message, SocraticMode, AnalysisData } from "../types";
import { CRITICAL_THINKING_CRITERIA } from "../domainCriteria";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

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
  try {
    const response = await chat.sendMessage({ message });
    return { text: response.text || "Argos réfléchit... peux-tu reformuler ta pensée ?" };
  } catch (e: any) {
    console.error("Gemini Error:", e);
    return { text: "Oups, une petite déconnexion. Vérifie ta clé API ou ta connexion internet." };
  }
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
Identifie si l'étudiant a progressé dans son autonomie de pensée ou s'il s'est reposé sur des généralités.

Réponds au format JSON strict.
  `.trim();

  try {
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

    const jsonStr = response.text?.trim() || "{}";
    return { ...JSON.parse(jsonStr), transcript, aiDeclaration };
  } catch (e) {
    console.error("Analysis Error:", e);
    return { 
      summary: "L'analyse automatique n'a pas pu être finalisée.", 
      reasoningScore: 0, clarityScore: 0, skepticismScore: 0, processScore: 0, reflectionScore: 0, 
      disciplinaryDiscernmentScore: 0, aiDeclarationCoherenceScore: 0, 
      keyStrengths: [], weaknesses: [], aiUsageAnalysis: "Erreur technique lors de l'audit.", 
      transcript, aiDeclaration 
    };
  }
};