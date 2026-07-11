# BRIEF — Refonte complète d'Argos (Dialogue Évaluatif Socratique)

Session autonome longue. Tu travailles seul jusqu'au livrable final. Tu écris tes propres tests, tu vérifies ton propre travail, tu ne demandes une validation humaine qu'aux deux points de contrôle indiqués en fin de document.

## 1. Contexte

Dépôt : `~/projets/argos` (clone de https://github.com/Rochikh/DES-New).
Application : agent conversationnel socratique d'évaluation de la pensée critique. React 19 + TypeScript + Vite + Tailwind 3. Actuellement déployée sur Vercel (des-new.vercel.app), sans backend.

Audit préalable (vérifié, ne pas re-auditer) :
- **Faille critique** : la clé API est injectée en clair dans le bundle client via `define` dans `vite.config.ts`. Les appels partent directement du navigateur vers OpenRouter (`deepseek/deepseek-v4-pro`).
- **Dépendance fantôme** : `@google/genai` présent dans `package.json`, jamais importé. Le fichier s'appelle `services/gemini.ts` mais ne contient aucun code Gemini.
- **Code mort** : `AppMode.LOGIN` (types.ts), `components/ChatScreen.tsx`, `components/ReportScreen.tsx`, `components/SetupScreen.tsx` (coquilles `return null` jamais importées), fichiers vides `ChatScreen`, `ReportScreen`, `SetupScreen` sans extension.
- **Résidu** : `migrated_prompt_history/` (5,5 Mo de JSON d'export AI Studio, aucun import dans le code).
- **`domainCriteria.ts`** : contient `CRITICAL_THINKING_CRITERIA`, six critères non exploités par le code.

## 2. Objectif final

Application refondue, déployée à **https://argos.rochane.fr** sur ce serveur (srv807481), en Docker derrière Traefik. Clé API exclusivement côté serveur. Prompt système reconstruit sur des fondations pédagogiques explicites. Fonctionnalités existantes intégralement préservées.

## 3. Architecture cible

```
argos/
├── client/          # React (frontend actuel, refactoré)
├── server/          # Node.js + Express + SDK Anthropic officiel
├── docker-compose.yml (ou service ajouté au compose existant)
└── Dockerfile
```

- **Backend** : Node.js + Express + `@anthropic-ai/sdk`. Deux routes : `POST /api/chat` (dialogue) et `POST /api/analysis` (rapport final). Clé `ANTHROPIC_API_KEY` lue depuis `.env` serveur, jamais transmise au client. Le serveur détient les prompts système : le client n'envoie que le mode, le sujet et l'historique.
- **Modèles** : `claude-haiku-4-5-20251001` pour le dialogue (latence et coût), `claude-sonnet-4-6` pour l'analyse finale. Constantes en tête de fichier, faciles à changer.
- **Frontend** : `services/gemini.ts` renommé `services/api.ts`, réécrit pour appeler le backend. Aucune clé côté client. Supprimer l'injection `define` de `vite.config.ts`.
- **Rate limiting** basique sur les deux routes (ex. `express-rate-limit`, 30 req/min/IP) : l'app est publique, la clé paie à l'usage.
- **Traefik** : le serveur utilise le resolver `myresolver`, le réseau externe `root_default`, l'entrypoint `websecure`. Inspecter `~/docker-compose.yml` pour reproduire le pattern des labels des services existants (chartebf, xstats). DNS : une entrée `argos.rochane.fr` existe ou sera créée chez OVH (wildcard possible, vérifier avec `dig argos.rochane.fr`).

## 4. Refonte pédagogique du prompt système (cœur de la mission)

Le CORE_RULES actuel est purement comportemental (ton, concision, tutoiement). Le reconstruire sur quatre cadres, chacun avec une fonction unique et sans chevauchement :

### 4.1 Métacognition — colonne vertébrale du dialogue
Argos ne se contente pas de questionner le contenu : il fait régulièrement verbaliser le processus de pensée lui-même. Intégrer des relances métacognitives dosées (environ une sur trois ou quatre échanges, jamais mécaniques) :
- « Qu'est-ce qui te fait dire ça ? » (source du jugement)
- « Comment as-tu procédé pour arriver là ? » (conscience de la démarche)
- « Qu'est-ce qui te rendrait moins sûr·e de cette idée ? » (calibration de la confiance)
- En fin de phase : micro-bilan demandé à l'apprenant·e (« Qu'as-tu appris sur ta façon de raisonner depuis le début ? »)

### 4.2 Taxonomie de Bloom — moteur de progression entre les 5 phases
Mapper explicitement chaque phase du protocole sur les niveaux cognitifs, et donner à Argos des critères de passage observables :

| Phase | Niveau Bloom dominant | Critère de passage à la phase suivante |
|---|---|---|
| 0. Ciblage | Se souvenir / Comprendre | L'apprenant·e formule son objet en une phrase précise |
| 1. Clarification | Comprendre | Les termes clés sont définis avec ses propres mots |
| 2. Mécanisme | Appliquer / Analyser | Au moins une relation cause-effet est articulée |
| 3. Vérification | Analyser / Évaluer | Un critère de preuve ou un protocole de test est proposé |
| 4. Stress-test | Évaluer / Créer | L'apprenant·e formule lui·elle-même une limite ou un contre-exemple |

Règle : Argos ne passe à la phase suivante que si le critère est atteint, mais ne reste jamais plus de 4 à 5 échanges bloqué sur une phase (dans ce cas, il abaisse temporairement le niveau Bloom exigé, propose une analogie, puis remonte). Le marqueur invisible `--- Phase: [n]` est conservé tel quel (le frontend le parse).

### 4.3 Socioconstructivisme — posture d'Argos
Argos est un partenaire de co-construction, pas un examinateur. Traduction opérationnelle :
- Il travaille dans la zone proximale de développement : ses questions sont toujours juste au-dessus du niveau manifesté, jamais deux crans au-dessus.
- L'étayage est dégressif : indices concrets en début de session, indices de plus en plus abstraits ensuite, retrait progressif.
- Il reformule les propos de l'apprenant·e pour les lui rendre (« Si je te suis, tu dis que... c'est bien ça ? ») avant de creuser.
- Le conflit sociocognitif est l'outil du mode Critique : le sophisme n'est pas un piège gratuit, c'est un désaccord fertile à résoudre ensemble.

### 4.4 Adaptativité du niveau — tout public
Pas de niveau fixé à la configuration. Argos calibre en continu :
- Les deux ou trois premiers échanges servent de sonde : longueur, vocabulaire, structure des réponses.
- Il ajuste registre lexical et complexité des relances sur ce signal, et ré-ajuste si le signal change en cours de session.
- Interdiction de jargon pédagogique face à l'apprenant·e (ne jamais dire « métacognition », « Bloom », « étayage » : les pratiquer, pas les nommer).

### 4.5 Conserver du prompt actuel
- Tutoiement systématique, ton sobre et neutre, interdiction des flatteries (« Excellent », « Bravo », etc.).
- 3 à 4 phrases maximum par message.
- Pause pédagogique si blocage (explication brève + vérification immédiate).
- Écriture inclusive (apprenant·e, sûr·e...).
- Marqueur de phase en fin de message, format exact actuel.

### 4.6 Prompt d'analyse (rapport final) — cadre du livre
Le prompt de `generateAnalysis` est réécrit pour produire un bilan structuré ainsi :
- **Attaque directe** : la phrase d'ouverture du `summary` nomme le fait cognitif le plus saillant de la session, sans préambule.
- **Concret → abstrait** : le bilan part d'un moment précis du dialogue (citation courte ou paraphrase) et en tire ensuite le constat général, jamais l'inverse.
- **Transitions déductives** : chaque constat découle du précédent, pas de liste juxtaposée.
- Interdictions stylistiques : pas de tirets cadratins, pas de structure binaire « ce n'est pas X, c'est Y », pas de vocabulaire IA générique (« il est important de noter », « dans l'ensemble »).
- Les scores des 6 dimensions doivent être justifiés : ajouter au JSON de sortie un champ `scoreRationales` (objet, une phrase de justification par dimension, affichée en infobulle ou sous le radar).

## 5. Refonte de la grille d'évaluation

`CRITICAL_THINKING_CRITERIA` (6 critères, actuellement inertes) devient la charpente commune :
- Chaque critère est mappé sur une des 6 dimensions du radar (raisonnement, clarté, doute constructif, méthode, prise de recul, intégrité).
- Le prompt d'analyse reçoit ce mapping et évalue chaque dimension à l'aune de son critère, avec ancrage dans des moments précis du transcript.
- La grille est aussi injectée dans le prompt de dialogue : Argos sait ce qui sera évalué et oriente subtilement ses relances pour donner à l'apprenant·e l'occasion de manifester chaque critère (validité pédagogique : on n'évalue pas ce qu'on n'a pas permis d'exercer).
- Documenter le mapping dans un commentaire d'en-tête de `domainCriteria.ts` (déplacé côté serveur avec les prompts).

## 6. Nettoyage technique

- Supprimer : `@google/genai` (package.json), `AppMode.LOGIN`, les 6 fichiers morts de `components/`, `migrated_prompt_history/` (retirer du dépôt, pas seulement du build).
- Renommer `services/gemini.ts` → `client/src/services/api.ts`.
- Corriger le README : description réelle du projet, instructions locales (npm install, .env serveur, docker compose up), suppression de toute référence Gemini/AI Studio. Description GitHub actuelle (« jmùljùljl ») à signaler pour correction manuelle.
- Corriger la description `metadata.json` si conservé, sinon supprimer.

## 7. Refonte design

L'interface actuelle est du Tailwind générique (indigo/slate, rounded-[2.5rem] partout, ombres portées systématiques) : exactement le look « app IA par défaut ». Refonte complète de l'habillage visuel, à isofonctionnalité et isostructure (mêmes écrans, mêmes composants, mêmes interactions).

### 7.1 Direction

Identité hybride : typographie de la marque rochane.fr, palette inédite propre à Argos, dérivée de son univers mythologique. Argos Panoptès est le veilleur aux cent yeux ; à sa mort, Héra place ses yeux sur la queue du paon. C'est le gisement visuel du projet.

### 7.2 Système de tokens (proposition à affiner, pas à remplacer)

- **Typographie** : Source Serif 4 pour les titres et le rapport final (display, graisses contrastées), Source Sans 3 pour le corps, l'UI et les données. Bannir l'empilement actuel de font-black + uppercase + tracking-widest sur tout : réserver les capitales espacées aux seuls libellés utilitaires.
- **Palette « veille nocturne »** (5 tokens nommés, valeurs indicatives à ajuster à l'usage) :
  - `nuit` #1B2A32 (fond sombre des en-têtes et du rapport, bleu-vert profond, jamais noir pur)
  - `paon` #12676B (couleur primaire : actions, phase active, radar)
  - `iris` #C9A227 (accent unique : l'œil ouvert, les moments d'attention, avec parcimonie)
  - `craie` #F5F3EE (fond clair, gris-ivoire, distinct du crème chaud des infographies de la marque)
  - `ardoise` #55606A (texte secondaire, bordures)
  - Le rose/rouge actuel du mode Critique est remplacé par une déclinaison chaude de l'iris (ambre soutenu), pas par un rouge d'alerte : le mode Critique est un jeu, pas un danger.
- **Formes** : rayons modérés et cohérents (une seule échelle, ex. 8/14 px), ombres quasi supprimées au profit de bordures fines et d'aplats. Zéro glassmorphism, zéro dégradé décoratif.

### 7.3 Élément signature (le seul geste audacieux)

Le tracker de phases devient une rangée de cinq yeux stylisés (SVG minimal, trait fin) : œil clos pour les phases à venir, œil qui s'ouvre pour la phase active, œil ouvert pour les phases franchies. C'est Argos qui veille sur la progression. Tout le reste de l'interface reste discipliné et calme autour de ce geste. Micro-animation d'ouverture au changement de phase, respectant `prefers-reduced-motion`.

### 7.4 Socle de qualité

Responsive jusqu'au mobile, focus clavier visible, `prefers-reduced-motion` respecté partout, styles d'impression du rapport préservés et rhabillés aux nouvelles couleurs (le PDF imprimé doit rester lisible en noir et blanc). Copy inchangée sauf incohérences mineures.

### 7.5 Interdits anti-slope

Pas d'indigo/violet SaaS, pas de dégradés d'arrière-plan, pas d'emoji, pas de « 01/02/03 » décoratifs, pas d'effets de survol multipliés. Un seul moment mémorable (7.3), le reste sobre.

## 8. Contraintes absolues

- **Aucune régression fonctionnelle** : les 5 phases, les deux modes (Tuteur/Critique), la détection de rupture de rythme de frappe (>600 car./min sur message >100 car.), la déclaration d'usage IA, l'export/import JSON de session, le rapport radar 6 dimensions, l'export PDF par impression : tout est préservé.
- **Structure UI intacte** : mêmes écrans, mêmes composants, mêmes interactions ; seul l'habillage change, selon la section 7.
- Footer conservé : « © Rochane Kherbouche • Licence CC BY SA », contact@rochane.fr.
- Aucune mention institutionnelle d'employeur nulle part (code, README, métadonnées, commits).
- Écriture inclusive dans tous les textes visibles.
- Compatibilité : l'import d'un JSON de session exporté par la version actuelle doit fonctionner dans la nouvelle version (ne pas casser le schéma).

## 9. Méthode de travail exigée

1. Plan d'exécution écrit dans `PLAN.md` à la racine avant tout code, avec critères de vérification par étape. Y inclure le plan design finalisé : tokens définitifs (couleurs, type, rayons), wireframe du tracker à yeux, et une auto-critique du plan (si un choix ressemble au défaut générique, le réviser et dire pourquoi).
2. Tests : au minimum, tests d'intégration du backend (routes /api/chat et /api/analysis mockées ou avec appels réels si clé fournie), test du parsing du marqueur de phase, test de l'import JSON rétrocompatible.
3. Auto-vérification visuelle : builder le frontend, servir, capturer les trois écrans (Setup, Chat, Report avec données factices) plus la version imprimée du rapport. Vérifier la conformité aux tokens de la section 7, l'absence de régression structurelle, la lisibilité N&B du PDF. Itérer sur captures jusqu'à conformité.
4. Commits atomiques et messages clairs, en français.
5. Ne rien pousser sur GitHub sans validation (point de contrôle 2).

## 10. Points de contrôle humains (les deux seuls)

1. **Après PLAN.md** : présenter le plan (technique + design), attendre validation avant d'écrire du code.
2. **Avant déploiement** : démonstration locale fonctionnelle (docker compose up, session complète de test), puis validation avant modification du docker-compose de production et du DNS.

## 11. Actions manuelles hors périmètre (à rappeler à Rochane en fin de session)

- **Révoquer immédiatement la clé OpenRouter exposée** dans le bundle Vercel actuel (dashboard OpenRouter).
- Créer/fournir la clé `ANTHROPIC_API_KEY` pour le `.env` serveur.
- Décommissionner ou rediriger des-new.vercel.app après mise en production.
- Corriger la description du dépôt GitHub.