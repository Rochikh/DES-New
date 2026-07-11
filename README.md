# Argos — Dialogue Évaluatif Socratique

Agent conversationnel socratique d'évaluation de la pensée critique. Argos accompagne l'apprenant·e dans un protocole en cinq phases (ciblage, clarification, mécanisme, vérification, stress-test), sans jamais donner les réponses, puis produit une trace d'apprentissage : bilan rédigé, radar à six dimensions avec justification de chaque score, transcription complète, indicateurs d'authenticité (rythme de saisie, déclaration d'usage d'IA).

Deux modes : **Tuteur** (accompagnement du raisonnement) et **Critique** (audit logique, Argos glisse des sophismes à débusquer). Les sessions s'exportent et se réimportent en JSON, le rapport s'enregistre en PDF par impression.

## Architecture

- `client/` : React 19 + TypeScript + Vite + Tailwind 3. Aucune clé côté client.
- `server/` : Node 22 + Express, appels à OpenRouter (API compatible OpenAI). Deux routes (`POST /api/chat`, `POST /api/analysis`), prompts système et clé API exclusivement côté serveur, rate limit 30 req/min/IP. Le serveur sert aussi le build client en statique.
- Modèle : `deepseek/deepseek-v4-pro` pour le dialogue et le bilan (constantes dans `server/src/config.ts`).

## Lancement local

Prérequis : Node.js ≥ 22, ou Docker.

```bash
# 1. Clé API serveur
cp .env.example .env      # puis renseigner OPENROUTER_API_KEY

# 2a. Avec Docker
docker compose up --build # http://localhost:8090

# 2b. Sans Docker (deux terminaux)
cd server && npm install && npm run dev   # API sur :3000
cd client && npm install && npm run dev   # front Vite sur :5173, proxy /api
```

## Tests

```bash
cd server && npm test   # intégration des routes (SDK mocké)
cd client && npm test   # parsing du marqueur de phase, import JSON rétrocompatible
```

## Déploiement

L'application tourne dans un conteneur unique (voir `Dockerfile`) derrière un reverse proxy qui termine le TLS. En production, le service est déclaré dans le docker-compose global du serveur avec les labels Traefik (entrypoint `websecure`, resolver ACME), port interne 3000.

## Licence

© Rochane Kherbouche • CC BY-SA — contact@rochane.fr
