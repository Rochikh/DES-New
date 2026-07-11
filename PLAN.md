# PLAN — Refonte d'Argos (Dialogue Évaluatif Socratique)

Plan d'exécution répondant au BRIEF.md. Aucun code écrit avant validation de ce plan (point de contrôle 1).

État vérifié au démarrage :
- DNS : `argos.rochane.fr` → 168.231.81.126, IPv4 de ce serveur (srv807481). Aucune action DNS nécessaire.
- Traefik : pattern confirmé dans `/root/docker-compose.yml` (labels `websecure` + `myresolver`, réseau externe `root_default`).
- `index.html` actuel charge Tailwind par CDN et un importmap esm.sh en plus du build Vite : redondance à purger lors du nettoyage.

---

## 1. Architecture cible

```
argos/
├── client/                      # React 19 + Vite + Tailwind 3
│   ├── index.html               # purgé du CDN Tailwind et de l'importmap
│   ├── vite.config.ts           # sans injection define, avec proxy /api en dev
│   ├── tailwind.config.js       # tokens de la section 5 (couleurs, fontes, rayons)
│   ├── package.json
│   └── src/
│       ├── App.tsx, index.tsx, index.css, types.ts
│       ├── components/          # SetupView, ChatView, ReportView, GuideModal, PhaseTracker
│       ├── services/api.ts      # ex-gemini.ts, réécrit : appels au backend uniquement
│       ├── utils/phase.ts       # extractPhase + cleanDisplayBotText (extraits de ChatView pour testabilité)
│       └── utils/session.ts     # parseSessionFile (extrait de SetupView pour testabilité)
├── server/                      # Node 22 + Express + @anthropic-ai/sdk
│   ├── package.json, tsconfig.json
│   ├── src/
│   │   ├── index.ts             # Express : /api/chat, /api/analysis, statique client, rate limit
│   │   ├── config.ts            # constantes modèles en tête de fichier
│   │   ├── anthropic.ts         # client SDK (injectable pour les tests)
│   │   └── prompts/
│   │       ├── core.ts          # socle commun (section 3)
│   │       ├── tutor.ts, critic.ts
│   │       ├── analysis.ts      # prompt du rapport (3.6)
│   │       └── domainCriteria.ts # grille + mapping documenté en en-tête (section 4)
│   └── test/
│       ├── chat.test.ts, analysis.test.ts   # intégration supertest, SDK mocké
├── Dockerfile                   # multi-stage : build client → build server → runtime
├── docker-compose.yml           # service local, prêt à transposer en production
├── .env.example                 # ANTHROPIC_API_KEY=
├── .dockerignore
└── README.md                    # réécrit
```

Choix structurants :
- **Un seul conteneur** : Express sert le build client en statique et expose `/api`. Un seul service Traefik, pas de nginx intermédiaire.
- **Client sans état serveur** : le client conserve l'historique localement (comme aujourd'hui) et envoie `{ mode, topic, history }` à chaque tour. Le serveur est sans état, les prompts n'existent que côté serveur.
- **Modèles** (constantes dans `server/src/config.ts`) : `claude-haiku-4-5-20251001` (dialogue), `claude-sonnet-4-6` (analyse).

### Contrats d'API

`POST /api/chat`
```json
→ { "mode": "TUTOR|CRITIC", "topic": "string", "history": [{ "role": "user|model", "text": "string" }], "message": "string" }
← { "text": "réponse avec marqueur ---\nPhase: [n] en fin" }
```

`POST /api/analysis`
```json
→ { "topic": "string", "aiDeclaration": "string", "transcript": [{ "role", "text", "responseTimeSeconds"? }] }
← { "summary", "reasoningScore", "clarityScore", "skepticismScore", "processScore",
    "reflectionScore", "integrityScore", "rhythmBreakCount", "keyStrengths", "weaknesses",
    "scoreRationales": { "reasoning", "clarity", "skepticism", "process", "reflection", "integrity" } }
```

- Validation d'entrée manuelle (types, bornes de taille : message ≤ 4 000 caractères, historique ≤ 200 messages), `express.json({ limit: '1mb' })`.
- `express-rate-limit` : 30 req/min/IP sur `/api`.
- Analyse : consigne JSON strict, retrait des éventuelles clôtures ` ```json `, un retry en cas d'échec de parsing, puis erreur 502 propre.
- `AnalysisData` (client) gagne `scoreRationales?` optionnel : l'absence du champ (ancienne session, erreur) n'affiche simplement rien.

---

## 2. Refonte pédagogique : structure des prompts (section 4 du BRIEF)

Le prompt de dialogue est reconstruit en blocs à fonction unique, assemblés dans `core.ts` :

1. **Identité et posture socioconstructiviste** (4.3) : partenaire de co-construction ; questions en zone proximale (un cran au-dessus du niveau manifesté, jamais deux) ; étayage dégressif (indices concrets puis abstraits puis retrait) ; reformulation-miroir avant creusement ; en mode Critique, le sophisme est un désaccord fertile à résoudre ensemble.
2. **Moteur de progression Bloom** (4.2) : tableau des 5 phases avec niveau dominant et critère de passage observable, repris tel quel du BRIEF ; règle anti-blocage (4-5 échanges max par phase, puis abaissement temporaire du niveau exigé + analogie + remontée) ; marqueur `---\nPhase: [n]` conservé au format exact.
3. **Couche métacognitive** (4.1) : relance métacognitive environ un échange sur trois ou quatre, jamais mécanique, tirée d'un répertoire (source du jugement, conscience de la démarche, calibration de la confiance) ; micro-bilan demandé en fin de phase.
4. **Adaptativité** (4.4) : sondage implicite sur les 2-3 premiers échanges (longueur, vocabulaire, structure), calibration continue du registre, ré-ajustement si le signal change ; interdiction de nommer les cadres pédagogiques face à l'apprenant·e.
5. **Grille d'évaluation injectée** (section 5) : les 6 critères et leur dimension du radar, avec consigne d'orienter subtilement les relances pour donner l'occasion de manifester chaque critère.
6. **Conservé de l'existant** (4.5) : tutoiement, ton sobre sans flatterie, 3-4 phrases max, pause pédagogique, écriture inclusive.

Le prompt d'analyse (`analysis.ts`) impose (4.6) : ouverture du `summary` par le fait cognitif le plus saillant sans préambule ; départ d'un moment précis du dialogue (citation courte ou paraphrase) vers le constat général ; transitions déductives ; interdits stylistiques (tirets cadratins, structure « ce n'est pas X, c'est Y », vocabulaire IA générique) ; `scoreRationales` avec une phrase de justification par dimension, ancrée dans le transcript.

---

## 3. Grille d'évaluation (section 5 du BRIEF)

Mapping documenté en commentaire d'en-tête de `server/src/prompts/domainCriteria.ts` :

| Critère | Dimension radar |
|---|---|
| Cohérence logique globale et rigueur argumentative | Raisonnement (`reasoningScore`) |
| Mise en question des prémisses et présupposés | Clarté (`clarityScore`) |
| Qualité et hiérarchisation des preuves | Doute constructif (`skepticismScore`) |
| Identification et dépassement des biais cognitifs | Méthode (`processScore`) |
| Capacité de décentrement et d'empathie intellectuelle | Prise de recul (`reflectionScore`) |
| Honnêteté intellectuelle et transparence du processus | Intégrité (`integrityScore`) |

Justification des deux appariements les moins évidents : la mise en question des prémisses exige d'abord que les termes soient définis avec précision (clarté opératoire, phase 1) ; l'identification des biais est une compétence de méthode (procédure de contrôle de son propre raisonnement), là où le décentrement relève de la prise de recul. Ce mapping est injecté dans les deux prompts (dialogue et analyse).

---

## 4. Nettoyage technique (section 6 du BRIEF)

- Supprimer : `@google/genai`, `AppMode.LOGIN`, `components/ChatScreen.tsx`, `ReportScreen.tsx`, `SetupScreen.tsx`, les 3 fichiers sans extension `ChatScreen`, `ReportScreen`, `SetupScreen`, `migrated_prompt_history/` (retiré du dépôt).
- `metadata.json` : résidu AI Studio sans usage dans le build Vite, supprimé.
- `index.html` : retrait du CDN Tailwind, de l'importmap esm.sh et de la fonte Inter (remplacée, voir section 5).
- `services/gemini.ts` → `client/src/services/api.ts`, réécrit.
- README réécrit : description réelle, lancement local (`npm install`, `.env` serveur, `docker compose up`), aucune référence Gemini/AI Studio.
- Rappel en fin de session : description GitHub (« jmùljùljl ») à corriger manuellement.

---

## 5. Plan design finalisé (section 7 du BRIEF)

### 5.1 Tokens définitifs

**Couleurs** (namespace Tailwind `argos.*`) :

| Token | Valeur | Usage |
|---|---|---|
| `nuit` | `#1B2A32` | fond des en-têtes et de l'en-tête du rapport, texte principal sur fond clair |
| `paon` | `#12676B` | primaire : actions, phase active, radar, liens |
| `paon-sombre` | `#0D4F53` | état hover/actif du primaire |
| `iris` | `#C9A227` | accent unique : iris de l'œil actif, moments d'attention (parcimonie stricte) |
| `ambre` | `#8F5D1E` | mode Critique (déclinaison chaude de l'iris) ; version foncée pour garantir AA en texte sur craie |
| `craie` | `#F5F3EE` | fond clair général |
| `blanc` | `#FFFFFF` | surfaces (cartes, bulles) |
| `ardoise` | `#55606A` | texte secondaire, icônes |
| `brume` | `#DDD9CF` | bordures fines, filets |

Rôles fonctionnels dérivés (pas de nouvelles teintes) : succès = `paon`, alerte rythme = `ambre`, erreur = `nuit` sur fond `craie` avec bordure `ambre` (pas de rouge : cohérent avec « le mode Critique est un jeu »).

**Typographie** (auto-hébergée via `@fontsource`, pas de Google Fonts) :
- Source Serif 4 : titres d'écran, en-tête et corps du bilan du rapport. Graisses 400/600/700.
- Source Sans 3 : corps, UI, données, transcript. Graisses 400/600/700.
- Capitales espacées (`uppercase tracking`) réservées aux seuls libellés utilitaires (labels de formulaire, légendes) en Source Sans 600, 11px. Suppression de l'empilement font-black + uppercase + tracking-widest partout ailleurs.

**Formes** :
- Rayons : `8px` (boutons, champs, puces) et `14px` (cartes, modales, bulles). Deux valeurs, aucune autre.
- Ombres : supprimées, sauf une élévation unique pour les modales (`0 8px 24px rgb(27 42 50 / 0.12)`). Partout ailleurs : bordures 1px `brume` et aplats.
- Zéro dégradé, zéro glassmorphism (les `backdrop-blur` des modales deviennent un voile `nuit/60` opaque simple).

### 5.2 Élément signature : le tracker à cinq yeux

Une rangée de cinq yeux SVG (trait fin 1.5px, ~28×16px chacun), remplaçant les pilules actuelles :

```
   franchie        franchie         ACTIVE          à venir         à venir

   ╭─────╮        ╭─────╮        ╭──────╮
  (   ●   )      (   ●   )      (  ◉    )        ─────────       ─────────
   ╰─────╯        ╰─────╯        ╰──────╯        (paupière        (paupière
                                    ⌃              close)           close)
  trait ardoise  trait ardoise  trait paon,     trait brume     trait brume
  pupille nuit   pupille nuit   iris `iris`,
                                 cils courts
   Ciblage      Clarification    Mécanisme      Vérification    Stress-test
```

- **À venir** : paupière close, simple arc convexe `brume`.
- **Active** : œil ouvert, contour `paon`, iris `C9A227` (seul emploi systématique de l'accent), trois cils courts au-dessus.
- **Franchie** : œil ouvert au trait `ardoise`, pupille `nuit`, sans iris doré.
- Libellé de phase sous chaque œil (Source Sans, 11px ; libellé seul visible en mobile pour la phase active, yeux seuls pour les autres).
- Micro-animation d'ouverture (paupière qui se lève, 350ms, `ease-out`) au changement de phase, neutralisée sous `prefers-reduced-motion`.
- Composant dédié `PhaseTracker.tsx` (SVG inline, états pilotés par `currentPhase`), même emplacement et même prop que le tracker actuel.

Tout le reste de l'interface reste calme : c'est le seul geste.

### 5.3 Déclinaison par écran (isostructure stricte)

- **Setup** : carte `blanc` bordure `brume` rayon 14 sur fond `craie` ; titre Source Serif ; le pictogramme cerveau indigo devient un œil d'Argos au trait `paon` ; carte de mode Tuteur sélectionnée = bordure `paon`, carte Critique sélectionnée = bordure `ambre` ; bouton principal `paon` → hover `paon-sombre`.
- **Chat** : tracker à yeux en tête ; bulles utilisateur `nuit` texte `craie`, bulles Argos `blanc` bordure `brume` ; bouton « Terminer la session » `ambre` (l'actuel rose disparaît) ; indicateur de chargement sobre (« Argos réfléchit », trait `paon`, sans pulse criard).
- **Report** : en-tête `nuit` texte `craie`, titre Source Serif ; radar en `paon` (remplace `#4f46e5`) ; encadrés points forts/pistes : `blanc` bordure `brume` avec filet gauche `paon` / `ambre` (plus de vert/jaune émeraude/ambre Tailwind génériques) ; `scoreRationales` affichées sous le radar (liste dimension → phrase, Source Sans 13px) ; badge de cohérence : `paon` si ≥ 70, `ambre` sinon.
- **Impression** : styles print réécrits aux nouvelles couleurs, testés en N&B (l'en-tête `nuit` passe en fond blanc bordé, radar lisible en niveaux de gris, `scoreRationales` imprimées sous le radar).

### 5.4 Interdits vérifiés à chaque itération visuelle

Pas d'indigo/violet, pas de dégradé, pas d'emoji, pas de numérotation décorative (la numérotation 0-4 des phases est conservée : elle est informationnelle, c'est l'ordre réel du protocole), pas d'effets de survol multipliés (un seul état hover par élément interactif : changement de couleur, sans scale ni ombre portée).

### 5.5 Auto-critique du plan design

- **Risque « cream + serif + accent doré »** : craie + Source Serif + iris ressemble au poncif actuel des designs IA (fond crème, display serif, accent terracotta/or). Les valeurs sont imposées par le BRIEF (proposition à affiner, pas à remplacer), mais la révision porte sur la répartition : l'or `iris` est retiré de tout usage décoratif et réservé à l'iris de l'œil actif et aux rares moments d'attention ; la couleur qui porte l'identité à l'écran est le duo `paon`/`nuit` (froid, nocturne), pas le doré. Le serif est cantonné aux titres et au bilan, le reste de l'UI est en sans : l'impression dominante est « veille nocturne », pas « éditorial crème ».
- **Bulles de chat** : la première idée (bulles arrondies asymétriques `rounded-tr-none`, héritées de l'existant) est le défaut messagerie générique ; révisée en blocs à rayon uniforme 14px différenciés par couleur et alignement seulement.
- **Loader** : le « pulse + spinner dans une bulle colorée » actuel est un tic d'app IA ; remplacé par trois points sobres et le libellé « Argos réfléchit », sans animation agressive.
- **Radar** : conservé (imposé fonctionnellement), mais débarrassé du remplissage indigo 60% ; remplissage `paon` à 30%, trait plein, grille `brume`.
- **Ce qui est assumé** : la numérotation des phases (informationnelle), la sobriété générale (le BRIEF l'exige : un seul geste audacieux).

---

## 6. Étapes d'exécution et critères de vérification

Chaque étape se conclut par un ou plusieurs commits atomiques en français. Rien n'est poussé sur GitHub avant le point de contrôle 2.

**Étape 0 — Validation de ce plan** (point de contrôle 1).
→ Vérification : accord explicite de Rochane.

**Étape 1 — Restructuration et nettoyage.** Déplacement du frontend dans `client/` (`git mv`), suppressions de la section 4 du présent plan, purge d'`index.html`, retrait de l'injection `define`.
→ Vérification : `npm run build` (client) passe ; `grep -ri "gemini\|genai\|openrouter" client/` ne retourne rien ; `git log` montre des commits séparés (déplacement / suppressions).

**Étape 2 — Backend Express + SDK Anthropic.** `server/` complet : routes, prompts (sections 2 et 3), rate limit, validation, service statique du client, `.env.example`, `.dockerignore`.
→ Vérification : tests d'intégration vitest + supertest, SDK mocké, tous verts :
- `/api/chat` : 200 avec texte contenant le marqueur de phase ; 400 sur payload invalide (mode inconnu, historique non-tableau, message trop long) ; 429 au-delà de 30 req/min ; 500 propre si le SDK échoue.
- `/api/analysis` : 200 avec les 6 scores, `rhythmBreakCount`, `scoreRationales` complet ; retry puis 502 si JSON invalide deux fois ; 400 sur transcript vide.
- Vérification que la clé API n'apparaît dans aucune réponse HTTP.

**Étape 3 — Réécriture client.** `services/api.ts`, extraction `utils/phase.ts` et `utils/session.ts`, affichage `scoreRationales`, proxy `/api` en dev dans `vite.config.ts`.
→ Vérification : tests vitest client tous verts :
- parsing du marqueur : `--- Phase: [n]` extrait, texte affiché nettoyé, fallback sur mots-clés, absence de marqueur = phase inchangée ;
- import JSON rétrocompatible : fixture générée avec le schéma d'export actuel (metadata/transcript/aiDeclaration), champs manquants tolérés ;
- `npm run build` passe ; `grep -r "API_KEY" client/dist/` ne retourne rien après build.

**Étape 4 — Refonte design.** Tokens dans `tailwind.config.js`, fontes `@fontsource`, `PhaseTracker.tsx`, reprise des quatre composants et des styles print, footer conservé à l'identique.
→ Vérification (boucle jusqu'à conformité) : build + serveur local + captures Playwright des trois écrans (Setup, Chat avec conversation factice, Report avec `AnalysisData` factice) en desktop et 375px, plus rendu print (PDF) ; contrôle sur captures : conformité aux tokens (aucun indigo/rose résiduel : `grep -r "indigo\|rose-\|slate-" client/src/` vide), structure inchangée, focus clavier visible, lisibilité N&B du PDF, `prefers-reduced-motion` testé.

**Étape 5 — Docker.** `Dockerfile` multi-stage (build client → build server → runtime node:22-alpine, utilisateur non-root), `docker-compose.yml` local (port exposé, `env_file: .env`).
→ Vérification : `docker compose up --build` ; session complète de test en local avec la vraie clé (si fournie à ce stade) : dialogue de 6-8 échanges traversant au moins 2 phases, génération du rapport, export puis réimport JSON, impression PDF ; `docker exec` : la clé n'est présente que dans l'environnement du serveur.

**Étape 6 — README et finitions.** README réécrit, dernier passage sur les textes (écriture inclusive, aucune mention institutionnelle : `grep -ri` sur le nom de l'employeur dans code, README, métadonnées et messages de commit).
→ Vérification : relecture complète du diff ; checklist section 8 du BRIEF point par point.

**Étape 7 — Point de contrôle 2.** Démonstration locale (docker compose up, session complète), présentation des captures et du PDF.
→ Vérification : validation explicite de Rochane avant toute modification de `/root/docker-compose.yml`.

**Étape 8 — Mise en production** (après validation). Ajout du service `argos` dans `/root/docker-compose.yml` sur le pattern chartebf (labels websecure/myresolver, réseau `root_default`, port interne 3000), `.env` de production, `docker compose up -d argos`.
→ Vérification : `curl -I https://argos.rochane.fr` en 200 avec certificat valide ; session complète de test en production ; les autres services du compose restent up.

**Étape 9 — Clôture.** Push GitHub (validé au point 2), rappel des actions manuelles (section 11 du BRIEF) : révocation de la clé OpenRouter exposée, fourniture de `ANTHROPIC_API_KEY` si pas déjà fait, décommission de des-new.vercel.app, correction de la description GitHub.

---

## 7. Contraintes transverses (rappel opposable à chaque étape)

Cinq phases, deux modes, détection de rupture de rythme (>600 car./min sur message >100 car.), déclaration d'usage IA, export/import JSON au schéma actuel, radar 6 dimensions, export PDF : préservés. Structure UI intacte. Footer « © Rochane Kherbouche • Licence CC BY SA » + contact@rochane.fr. Écriture inclusive. Aucune mention institutionnelle. Aucune clé côté client.
