import { Message } from '../types';

/**
 * Message utilisateur tel qu'enregistré dans la transcription. Tout texte
 * envoyé au modèle y figure : message tapé, bouton d'action rapide, ou
 * message d'ouverture (marqué `opening`, masqué à l'écran et dans le rapport).
 */
export type UserMessageKind = 'typed' | 'preset' | 'opening';

export const buildUserMessage = (
  text: string,
  kind: UserMessageKind,
  responseTimeSeconds: number,
  now: number = Date.now()
): Message => {
  // Rupture de rythme : saisie trop rapide d'un long texte tapé à la main.
  const cpm = (text.length / responseTimeSeconds) * 60;
  return {
    id: crypto.randomUUID(),
    role: 'user',
    text,
    timestamp: now,
    responseTimeSeconds: kind === 'opening' ? 0 : responseTimeSeconds,
    hasRhythmAnomaly: kind === 'typed' && text.length > 100 && cpm > 600,
    ...(kind === 'opening' ? { opening: true } : {}),
  };
};

/** Seul le message d'ouverture technique est masqué à l'affichage. */
export const isOpeningMessage = (m: Message): boolean => m.opening === true;
