import { useEffect, useState } from 'react';

/**
 * Fournisseur d'IA réellement utilisé (AI_PROVIDER côté serveur), nommé
 * dans les textes de transparence. null tant que /api/config n'a pas répondu.
 */
export type Provider = 'claude' | 'deepseek';

let providerRequest: Promise<Provider | null> | null = null;

const fetchProvider = (): Promise<Provider | null> => {
  providerRequest ??= fetch('/api/config')
    .then((r) => (r.ok ? r.json() : null))
    .then((data) => (data?.provider === 'claude' || data?.provider === 'deepseek' ? data.provider : null))
    .catch(() => null);
  return providerRequest;
};

export const useProvider = (): Provider | null => {
  const [provider, setProvider] = useState<Provider | null>(null);
  useEffect(() => {
    let active = true;
    fetchProvider().then((p) => active && setProvider(p));
    return () => {
      active = false;
    };
  }, []);
  return provider;
};

/** Ligne de transparence de l'écran d'accueil. */
export const transitText = (provider: Provider | null): string => {
  if (provider === 'claude') {
    return "Les échanges transitent par l'API d'Anthropic (Claude), ou par DeepSeek si Claude est indisponible, le temps de générer chaque réponse";
  }
  if (provider === 'deepseek') return "Les échanges transitent par l'API de DeepSeek le temps de générer chaque réponse";
  return "Les échanges transitent par l'API du fournisseur d'IA le temps de générer chaque réponse";
};

/** Proposition du guide : « tes échanges transitent par le serveur d'Argos, qui interroge … ». */
export const guideProviderText = (provider: Provider | null): string => {
  if (provider === 'claude') {
    return "l'API d'Anthropic (modèle Claude) le temps de générer chaque réponse, ou celle de DeepSeek quand Claude est indisponible";
  }
  if (provider === 'deepseek') return "l'API de DeepSeek le temps de générer chaque réponse";
  return "l'API du fournisseur d'IA le temps de générer chaque réponse";
};
