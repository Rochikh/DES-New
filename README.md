# Argos socratique — DES (Dialogue Évaluatif Socratique)

Argos est un dispositif de traçabilité cognitive : un tuteur socratique qui aide
l'apprenant·e à construire son raisonnement (mode Tuteur) ou teste sa vigilance
face aux sophismes (mode Critique), puis génère une trace d'apprentissage
évaluée (radar, scores, transcription).

## Modèle

L'application appelle **Kimi K3** (Moonshot AI, sorti le 16 juillet 2026 —
~2,8 T de paramètres, 1 M de tokens de contexte, raisonnement toujours actif,
3 $ / 15 $ par million de tokens), pour le dialogue comme pour l'analyse finale.

Le fournisseur est **détecté automatiquement d'après le préfixe de la clé**
(`services/ai.ts`) :

| Clé | Endpoint | Modèle |
|---|---|---|
| `sk-or-…` (OpenRouter) | `openrouter.ai/api/v1` | `moonshotai/kimi-k3` |
| autre (plateforme Moonshot/Kimi) | `api.moonshot.ai/v1` | `kimi-k3` |

Points clés de l'intégration :

- **Corpus de référence** : l'apprenant·e peut fournir des extraits ou notes de
  lecture au démarrage ; Argos ne s'autorise à attribuer des concepts ou des
  citations à l'ouvrage étudié qu'à partir de ce corpus.
- **Honnêteté épistémique** : le prompt impose de distinguer « dans le corpus » /
  « savoir général » / « prolongement proposé », et interdit les guillemets de
  citation non vérifiables.
- **Spécificités kimi-k3** : `temperature` est figée à 1.0 (aucun paramètre
  d'échantillonnage envoyé) ; le raisonnement, toujours actif, est facturé en
  tokens de sortie (`max_tokens` généreux) ; le message assistant complet
  (`reasoning_content` inclus) est renvoyé tel quel dans l'historique,
  conformément à la documentation de l'API.
- Relance automatique (backoff) sur erreur réseau, 5xx et réponse vide ; les
  échecs remontent dans l'interface avec un bouton « Réessayer » au lieu de
  polluer la transcription.

## Lancer en local

Prérequis : Node.js 20+.

1. Installer les dépendances : `npm install`
2. Créer `.env.local` avec votre clé :

   ```
   KIMI_API_KEY=sk-...          # clé plateforme Moonshot/Kimi (API directe)
   # ou
   OPENROUTER_API_KEY=sk-or-... # via OpenRouter
   ```

   (Les noms `MOONSHOT_API_KEY`, `GEMINI_API_KEY` et `API_KEY` restent acceptés.)
3. Lancer : `npm run dev`

Si l'appel direct à `api.moonshot.ai` est bloqué par le navigateur (CORS),
utilisez une clé OpenRouter : l'interface affiche alors l'indication dans le
message d'erreur.

## Déploiement — avertissement sécurité

La clé API est injectée dans le bundle client au moment du build
(`vite.config.ts`) : toute personne accédant au site déployé peut l'extraire.
Pour un déploiement public, utilisez une clé **plafonnée** (limite de crédit)
ou placez un proxy serveur (fonction Vercel) devant l'API.

## Données

Aucune donnée n'est stockée côté serveur : le dialogue vit dans le navigateur et
s'exporte/se réimporte en JSON (bouton « Sauvegarder » / « Reprendre un
travail »). Le corpus est inclus dans l'export pour que la reprise conserve
l'ancrage documentaire.

© Rochane Kherbouche • Licence CC BY SA
