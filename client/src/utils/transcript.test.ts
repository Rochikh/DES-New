import { describe, it, expect } from 'vitest';
import { buildUserMessage, isOpeningMessage } from './transcript';

const HELP = "Je suis un peu bloqué sur ce point, peux-tu m'aider à avancer ou m'expliquer ce concept ?";

describe('buildUserMessage', () => {
  it('enregistre le texte du bouton d\'action rapide tel qu\'envoyé au modèle', () => {
    const msg = buildUserMessage(HELP, 'preset', 4);
    expect(msg.role).toBe('user');
    expect(msg.text).toBe(HELP);
    expect(isOpeningMessage(msg)).toBe(false);
    expect(msg.hasRhythmAnomaly).toBe(false);
  });

  it('enregistre le message d\'ouverture, marqué pour être masqué', () => {
    const msg = buildUserMessage('Bonjour Argos, je suis Lou. Lancez la session sur : X.', 'opening', 12);
    expect(msg.text).toBe('Bonjour Argos, je suis Lou. Lancez la session sur : X.');
    expect(msg.responseTimeSeconds).toBe(0);
    expect(isOpeningMessage(msg)).toBe(true);
  });

  it('signale une rupture de rythme seulement pour un texte tapé', () => {
    const long = 'a'.repeat(150);
    expect(buildUserMessage(long, 'typed', 1).hasRhythmAnomaly).toBe(true);
    expect(buildUserMessage(long, 'preset', 1).hasRhythmAnomaly).toBe(false);
  });

  it('affiche un message tapé qui contient « Bonjour Argos »', () => {
    expect(isOpeningMessage(buildUserMessage('Bonjour Argos, je reprends ma réponse.', 'typed', 30))).toBe(false);
  });
});
