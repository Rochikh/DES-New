# Argos socratique — DES (Dialogue Évaluatif Socratique)

Argos est un dispositif de traçabilité cognitive : un tuteur socratique qui aide
l'apprenant·e à construire son raisonnement (mode Tuteur) ou teste sa vigilance
face aux sophismes (mode Critique), puis génère une trace d'apprentissage
évaluée (radar, scores, transcription).

## Modèle

L'application appelle **Claude Opus 4.8** (`anthropic/claude-opus-4.8`) via
[OpenRouter](https://openrouter.ai), pour le dialogue comme pour l'analyse
finale. C'est un modèle haut de gamme : la qualité des références et de
l'accompagnement prime sur le coût par session.

Points clés de l'intégration (`services/ai.ts`) :

- **Corpus de référence** : l'apprenant·e peut fournir des extraits ou notes de
  lecture au démarrage ; Argos ne s'autorise à attribuer des concepts ou des
  citations à l'ouvrage étudié qu'à partir de ce corpus (mis en cache via
  `cache_control` pour réduire le coût des tours suivants).
- **Honnêteté épistémique** : le prompt impose de distinguer « dans le corpus » /
  « savoir général » / « prolongement proposé », et interdit les guillemets de
  citation non vérifiables.
- Pas de paramètre `temperature` : les modèles Opus 4.7+ n'acceptent plus les
  paramètres d'échantillonnage (erreur 400).
- Relance automatique (backoff) sur erreur réseau, 5xx et réponse vide ; les
  échecs remontent dans l'interface avec un bouton « Réessayer » au lieu de
  polluer la transcription.

## Lancer en local

Prérequis : Node.js 20+.

1. Installer les dépendances : `npm install`
2. Créer `.env.local` avec votre clé OpenRouter :

   ```
   OPENROUTER_API_KEY=sk-or-v1-...
   ```

   (Les anciens noms `GEMINI_API_KEY` / `API_KEY` restent acceptés.)
3. Lancer : `npm run dev`

## Déploiement — avertissement sécurité

La clé API est injectée dans le bundle client au moment du build
(`vite.config.ts`) : toute personne accédant au site déployé peut l'extraire.
Pour un déploiement public, utilisez une clé OpenRouter **plafonnée** (limite de
crédit) ou placez un proxy serveur (fonction Vercel) devant OpenRouter.

## Données

Aucune donnée n'est stockée côté serveur : le dialogue vit dans le navigateur et
s'exporte/se réimporte en JSON (bouton « Sauvegarder » / « Reprendre un
travail »). Le corpus est inclus dans l'export pour que la reprise conserve
l'ancrage documentaire.

© Rochane Kherbouche • Licence CC BY SA
