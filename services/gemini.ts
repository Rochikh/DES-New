
import { GoogleGenAI, Chat, Type } from "@google/genai";
import { Message, SocraticMode, AnalysisData, SocraticStrategy } from "../types";

const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === "undefined" || apiKey === "") {
    throw new Error("Clé API manquante");
  }
  return new GoogleGenAI({ apiKey });
};

const CHAT_MODEL = "gemini-3-flash-preview"; 
const ANALYSIS_MODEL = "gemini-3-pro-preview";
const TUTOR_NAME = "Argos";

export const createChatSession = (mode: SocraticMode, topic: string, history: Message[] = []): Chat => {
  const ai = getAI();
  
  const systemInstruction = `
Tu es ${TUTOR_NAME}, un tuteur socratique expert en pensée critique. Ton but est d'accompagner l'étudiant sur : "${topic}".

STRATÉGIES DISPONIBLES :
1. clarification (définir les termes)
2. test_necessite (vérifier si A implique forcément B)
3. contre_exemple (proposer un cas limite)
4. prediction (demander les conséquences d'une idée)
5. falsifiabilite (demander ce qui prouverait que l'idée est fausse)
6. mecanisme_causal (expliquer le "comment")
7. changement_cadre (changer d'échelle ou de point de vue)
8. compression (demander de résumer l'essentiel)
9. concession_controlee (admettre un point pour mieux tester le reste)

MÉTHODE :
- Tu recevras parfois une consigne interne de stratégie. Applique-la sans la nommer.
- Tutoiement. Une seule question courte par message.
- Mode ${mode === SocraticMode.TUTOR ? 'DÉFENSE' : 'CRITIQUE'}.
- Finis par :
💡 Exigence : [Action immédiate]
🔍 Contrôle : [Point de vigilance]
  `.trim();

  return ai.chats.create({
    model: CHAT_MODEL,
    history: history.map(m => ({ 
      role: m.role, 
      parts: [{ text: m.text }] 
    })),
    config: { systemInstruction, temperature: 0.7 }
  });
};

export const sendMessage = async (chat: Chat, message: string, strategy?: SocraticStrategy) => {
  const prompt = strategy ? `[STRATÉGIE INTERNE : ${strategy}] ${message}` : message;
  const response = await chat.sendMessage({ message: prompt });
  if (!response.text) throw new Error("Réponse vide");
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
En tant qu'expert en analyse cognitive, produis une TRACE D'APPRENTISSAGE du dialogue suivant sur "${topic}".

TRANSCRIPTION :
${transcriptText}

DÉCLARATION IA : "${aiDeclaration}"

CONSIGNES STRICTES :
1. AUCUNE NOTE, AUCUN CHIFFRE, AUCUN POURCENTAGE (Sauf dans le champ "score").
2. Ton neutre, analytique, factuel. Pas d'émojis.
3. Chaque observation doit être appuyée par des "evidenceQuotes" (citations courtes du transcript).
4. Statuts autorisés : non_traite, evoque, etaye, stress_teste.
5. Champ "score" : attribue un nombre parmi [0, 25, 50, 75, 100] selon la maturité de la dimension.

FORMAT JSON REQUIS.
  `.trim();

  const traceSchema = {
    type: Type.OBJECT,
    properties: {
      status: { 
        type: Type.STRING, 
        description: "Statut qualitatif de progression",
        enum: ["non_traite", "evoque", "etaye", "stress_teste"] 
      },
      score: {
        type: Type.INTEGER,
        description: "Maturité du critère (0, 25, 50, 75, 100)"
      },
      evidenceQuotes: { 
        type: Type.ARRAY, 
        items: { type: Type.STRING },
        description: "Citations exactes du transcript prouvant ce statut"
      },
      expertObservation: { 
        type: Type.STRING,
        description: "Observation factuelle et lecture cognitive"
      },
      nextMove: { 
        type: Type.STRING,
        description: "L'action unique à mener au prochain tour"
      }
    },
    required: ["status", "score", "evidenceQuotes", "expertObservation", "nextMove"]
  };

  const response = await ai.models.generateContent({
    model: ANALYSIS_MODEL,
    contents: prompt,
    config: {
      temperature: 0.1,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: {
            type: Type.OBJECT,
            properties: {
              built: { type: Type.STRING },
              unstable: { type: Type.ARRAY, items: { type: Type.STRING } },
              nextStep: { type: Type.STRING }
            },
            required: ["built", "unstable", "nextStep"]
          },
          diagnostic: { type: Type.STRING },
          criteria: {
            type: Type.OBJECT,
            properties: {
              premises: traceSchema,
              evidence: traceSchema,
              bias: traceSchema,
              decentering: traceSchema,
              logic: traceSchema,
              integrity: traceSchema
            },
            required: ["premises", "evidence", "bias", "decentering", "logic", "integrity"]
          },
          argumentMap: {
            type: Type.OBJECT,
            properties: {
              claim: { type: Type.STRING },
              definitions: { type: Type.ARRAY, items: { type: Type.STRING } },
              assumptions: { type: Type.ARRAY, items: { type: Type.STRING } },
              evidence: { type: Type.ARRAY, items: { type: Type.STRING } },
              objections: { type: Type.ARRAY, items: { type: Type.STRING } },
              rebuttals: { type: Type.ARRAY, items: { type: Type.STRING } },
              falsifier: { type: Type.STRING }
            },
            required: ["claim", "definitions", "assumptions", "evidence", "objections", "rebuttals", "falsifier"]
          },
          deltas: { type: Type.ARRAY, items: { type: Type.STRING } },
          pivotalMoments: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                quote: { type: Type.STRING },
                analysis: { type: Type.STRING },
                impact: { type: Type.STRING, enum: ["positive", "negative", "neutral"] },
                whyItMatters: { type: Type.STRING }
              },
              required: ["quote", "analysis", "impact", "whyItMatters"]
            }
          },
          aiUsageAnalysis: { type: Type.STRING }
        },
        required: ["summary", "diagnostic", "criteria", "argumentMap", "deltas", "pivotalMoments", "aiUsageAnalysis"]
      } as any
    }
  });

  try {
    const jsonStr = response.text.trim().replace(/^```json/, '').replace(/```$/, '');
    return { ...JSON.parse(jsonStr), transcript, aiDeclaration };
  } catch (e) {
    throw new Error("Erreur de parsing de l'analyse Argos. Le modèle n'a pas respecté le format attendu.");
  }
};
