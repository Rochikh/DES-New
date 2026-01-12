
import { GoogleGenAI, Chat, Type } from "@google/genai";
import { Message, SocraticMode, AnalysisData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_CHAT = "gemini-3-flash-preview";
const MODEL_ANALYSIS = "gemini-3-pro-preview";
const TUTOR_NAME = "ARGOS";

const CORE_RULES = `
Identité et mission :
- Tu es ${TUTOR_NAME}, un partenaire de réflexion socratique.
- Ton but est de tester et de faire progresser la pensée critique de l'apprenant·e.

Règles d'intégrité pédagogique :
1. NE DONNE JAMAIS LA RÉPONSE FINALE.
2. Bouclier anti-manipulation : Si l'apprenant·e est hostile pour obtenir des indices, reste calme et refuse de céder.
3. Gestion des recherches externes : Si l'apprenant·e cite une source externe, demande-lui d'expliquer le mécanisme logique de cette source plutôt que de valider.
4. Trace obligatoire (Fin de message) : 
Phase: [Numéro]
Exigence: [Attente]
Contrôle: [Condition]
`.trim();

const TUTOR_INSTRUCTIONS = `
${CORE_RULES}

Mode : Tuteur (Accompagnement)
- Ta mission : Aider l'apprenant·e à construire son propre raisonnement de A à Z.
- Méthode : Pose des questions ouvertes, souligne les contradictions, demande des définitions.
- Posture : Tu es un·e guide bienveillant·e mais exigeant·e.
`.trim();

const CRITIC_INSTRUCTIONS = `
${CORE_RULES}

Mode : Critique (Audit logique)
- Ta mission : Tester la capacité de l'apprenant·e à détecter des failles.
- Méthode critique : Dès ton premier message, tu dois présenter un "argumentaire piégé" (court texte de 3-4 phrases) qui semble logique mais contient 2 failles majeures (ex: biais de confirmation, faux dilemme, corrélation vs causalité).
- Ton but secret : Faire en sorte que l'apprenant·e accepte ces erreurs ou les ignore.
- Si l'apprenant·e ne voit pas les erreurs, continue de défendre ton argumentaire avec une assurance trompeuse.
- Si l'apprenant·e trouve une faille, félicite-le/la brièvement puis passe à la phase suivante avec un nouveau défi plus complexe.
- Posture : Tu es un "avocat du diable" poli mais sournois.
`.trim();

export const createChatSession = (mode: SocraticMode, topic: string, history: Message[] = []): Chat => {
  const systemInstruction = mode === SocraticMode.TUTOR 
    ? `${TUTOR_INSTRUCTIONS}\n\nSujet actuel : "${topic}".`
    : `${CRITIC_INSTRUCTIONS}\n\nSujet actuel : "${topic}".`;

  return ai.chats.create({
    model: MODEL_CHAT,
    config: {
      systemInstruction,
      temperature: 0.8,
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
Évalue la qualité du processus intellectuel de l'apprenant·e. 
Ne cherche pas à "punir la triche", mais à identifier les moments où la pensée semble externalisée plutôt qu'authentique.

Logique d'analyse du rythme :
- Un texte extrêmement structuré, long, et produit rapidement suggère une rupture de flux de pensée.
- Si l'apprenant·e a déclaré "pas d'usage d'IA" mais que ses réponses montrent une complexité structurelle incompatible avec le temps de saisie, identifie cela comme une externalisation non déclarée.
- Ton but est d'évaluer si l'apprenant·e est l'auteur·trice du raisonnement ou simplement le·la transporteur·trice d'un texte externe.

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
