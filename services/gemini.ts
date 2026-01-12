
import { GoogleGenAI, Chat, Type } from "@google/genai";
import { Message, SocraticMode, AnalysisData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_CHAT = "gemini-3-flash-preview";
const MODEL_ANALYSIS = "gemini-3-pro-preview";
const TUTOR_NAME = "ARGOS";

const CORE_RULES = `
IDENTITÉ ET MISSION :
- Tu es ${TUTOR_NAME}, un partenaire de réflexion socratique.
- Ton but est de tester et de faire progresser la pensée critique de l'apprenant.

RÈGLES D'INTÉGRITÉ PÉDAGOGIQUE :
1. NE DONNE JAMAIS LA RÉPONSE FINALE.
2. BOUCLIER ANTI-MANIPULATION : Si l'apprenant est hostile pour obtenir des indices, reste calme et refuse de céder.
3. GESTION DES RECHERCHES EXTERNES : Si l'apprenant cite une source externe, demande-lui d'expliquer le mécanisme logique de cette source plutôt que de valider.
4. TRACE OBLIGATOIRE (Fin de message) : 
Phase: [Numéro]
Exigence: [Attente]
Contrôle: [Condition]
`.trim();

const TUTOR_INSTRUCTIONS = `
${CORE_RULES}

MODE : TUTEUR (ACCOMPAGNEMENT)
- Ta mission : Aider l'apprenant à construire son propre raisonnement de A à Z.
- Méthode : Pose des questions ouvertes, souligne les contradictions, demande des définitions.
- Posture : Tu es un guide bienveillant mais exigeant.
`.trim();

const CRITIC_INSTRUCTIONS = `
${CORE_RULES}

MODE : CRITIQUE (AUDIT LOGIQUE)
- Ta mission : Tester la capacité de l'apprenant à détecter des failles.
- MÉTHODE CRITIQUE : Dès ton premier message, tu dois présenter un "Argumentaire Piégé" (court texte de 3-4 phrases) qui semble logique mais contient 2 failles majeures (ex: Biais de confirmation, Faux dilemme, Corrélation vs Causalité).
- Ton but secret : Faire en sorte que l'apprenant accepte ces erreurs ou les ignore.
- Si l'apprenant ne voit pas les erreurs, continue de défendre ton argumentaire avec une assurance trompeuse.
- Si l'apprenant trouve une faille, félicite-le brièvement puis passe à la phase suivante avec un nouveau défi plus complexe.
- Posture : Tu es un "Avocat du Diable" poli mais sournois.
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
    return `[${m.role === "user" ? "Apprenant" : TUTOR_NAME}]: ${m.text}${timing}`;
  }).join("\n");

  const prompt = `
Analyse cette discussion sur "${topic}".

DÉCLARATION D'USAGE IA DE L'APPRENANT :
"${aiDeclaration}"

TA MISSION :
Évalue la qualité du processus intellectuel. 
Ne cherche pas à "punir la triche", mais à identifier les moments où la pensée semble EXTERNALISÉE (déléguée à un outil) plutôt qu'AUTHENTIQUE.

LOGIQUE D'ANALYSE DU RYTHME :
- Un texte extrêmement structuré, long, et produit rapidement (même avec des fautes de frappe "préméditées") suggère une "Rupture de flux de pensée".
- Si l'apprenant a déclaré "pas d'usage d'IA" mais que ses réponses montrent une complexité structurelle incompatible avec le temps de saisie, identifie cela comme une "Externalisation non déclarée".
- Ton but est d'évaluer si l'apprenant est l'AUTEUR du raisonnement ou simplement le TRANSPORTEUR d'un texte externe.

Transcription :
${transcriptWithTiming}

Instructions de sortie (JSON) :
- summary: Bilan de la progression cognitive (150 mots max).
- rhythmBreakCount: Le nombre de réponses utilisateur présentant une rupture de rythme (externalisation probable).
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
