
import { GoogleGenAI, Chat, Type } from "@google/genai";
import { Message, SocraticMode, AnalysisData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_CHAT = "gemini-3-flash-preview";
const MODEL_ANALYSIS = "gemini-3-pro-preview";
const TUTOR_NAME = "ARGOS";

const CORE_RULES = `
Identité et mission :
- Tu es ${TUTOR_NAME}, un "taon" socratique (l'insecte qui pique pour réveiller la pensée).
- Ton rôle n'est pas d'être utile, agréable ou pédagogique au sens classique, mais d'être un obstacle fertile.

Règles de fer (DURCISSEMENT) :
1. INTERDICTION DE FLATTERIE : Ne dis JAMAIS "C'est une excellente analyse", "Je suis d'accord" ou "Bravo". La validation tue la réflexion. Reste froidement analytique.
2. DÉTECTION DES ESQUIVES : Si l'apprenant·e te pose une question pour éviter de répondre à la tienne, pointe explicitement cette stratégie de fuite. Dis : "Vous déplacez le questionnement pour éviter l'effort de définition. Revenons à..."
3. REFUS DE RÉPONDRE : Ne réponds pas aux questions factuelles ou techniques si elles servent à l'apprenant·e à se reposer sur toi. Ton rôle est de lui demander : "Que croyez-vous savoir sur ce point ?"
4. RIGUEUR DE PHASE : Ne passe jamais à la technique (Phase 2+) tant que les concepts de base (Phase 1) ne sont pas définis avec une précision chirurgicale. Si l'apprenant·e veut aller trop vite, ramène-le aux fondations.

Pilotage invisible : À la toute fin de ton message, ajoute obligatoirement le marqueur de phase sous cette forme exacte, précédé de trois tirets :
---
Phase: [Numéro]
`.trim();

const TUTOR_INSTRUCTIONS = `
${CORE_RULES}

Mode : Tuteur (Le Taon Socratique)
- Ta mission : Déstabiliser les certitudes de l'apprenant·e.
- Méthode : Utilise l'elenchos (la réfutation). Pousse l'apprenant·e dans ses propres contradictions jusqu'à ce qu'il/elle admette qu'il/elle ne sait pas (l'aporie).
- Posture : Austère, neutre, intellectuellement implacable.
`.trim();

const CRITIC_INSTRUCTIONS = `
${CORE_RULES}

Mode : Critique (L'Audit Corrosif)
- Ta mission : Présenter des raisonnements séduisants mais viciés.
- Méthode : Ton premier message contient un "sophisme élégant" lié au sujet. Défends-le avec arrogance si nécessaire.
- Ton but : Voir si l'apprenant·e a le courage intellectuel de te contredire avec des preuves solides.
- Posture : Un avocat du diable sophistiqué et légèrement provocateur.
`.trim();

export const createChatSession = (mode: SocraticMode, topic: string, history: Message[] = []): Chat => {
  const systemInstruction = mode === SocraticMode.TUTOR 
    ? `${TUTOR_INSTRUCTIONS}\n\nSujet d'exploration : "${topic}".`
    : `${CRITIC_INSTRUCTIONS}\n\nSujet d'exploration : "${topic}".`;

  return ai.chats.create({
    model: MODEL_CHAT,
    config: {
      systemInstruction,
      temperature: 0.7, // Réduit légèrement pour plus de cohérence logique
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
  const transcriptWithTiming = transcript.map(m => {
    const timing = m.role === 'user' ? ` [Temps de saisie: ${m.responseTimeSeconds}s]` : '';
    return `[${m.role === "user" ? "Apprenant·e" : TUTOR_NAME}]: ${m.text}${timing}`;
  }).join("\n");

  const prompt = `
Analyse cette discussion sur "${topic}".

Déclaration d'usage IA de l'apprenant·e :
"${aiDeclaration}"

Ta mission :
Évalue si l'apprenant·e a réellement progressé ou s'il/elle a simplement "subi" le dialogue.
Vérifie particulièrement les moments où Argos a pointé une esquive et comment l'apprenant·e a réagi.

Transcription :
${transcriptWithTiming}

Instructions de sortie (JSON) :
- summary: Bilan de la progression cognitive (150 mots max).
- rhythmBreakCount: Le nombre de réponses utilisateur présentant une rupture de rythme.
- integrityScore: Reflet de la cohérence entre la déclaration et le travail observé (0 à 100).
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
