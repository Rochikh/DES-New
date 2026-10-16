# Refonte du prompt de chat d'Argos

Suivi de la refonte de `server/src/prompts/core.ts` après le retour d'un testeur : réponses trop longues, aucun diagnostic de l'apprenant·e, structure en cinq phases fixe inadaptée à un contenu que la personne ne maîtrise pas, progression bloquée en phase 0.

## Règles de travail

- Une étape à la fois. En fin d'étape : diff, résultats du banc, attente du go. Aucun commit sans go.
- Avant toute écriture dans `core.ts` : montrer le texte exact ajouté ou modifié.
- Texte ajouté au prompt : français, tutoiement, écriture inclusive avec point médian, aucun tiret cadratin, aucune antithèse par négation (« ce n'est pas X, c'est Y », « ni X ni Y », « plus qu'un X »).
- Modifications chirurgicales, style du code existant respecté.
- Prod : `/root/docker-compose.yml` uniquement (service `argos`), env dans `/root/infra/env/argos.env` (clés jamais lues). Test en ligne via https://ia-des.rochane.fr uniquement. `/root/projets/argos/docker-compose.yml` reste intouché.

## Étapes faites

### Étape 0 : banc et diagnostic du blocage de phase

Aucun correctif : le défaut relève du prompt.

- 21 tours sur 21 servis par `claude-opus-5-5`, marqueur `---` / `Phase: N` en forme exacte à chaque tour, phase parsée par `client/src/utils/phase.ts` identique au marqueur brut, aucun marqueur visible dans le texte affiché.
- B et C progressent (B atteint la phase 4, C la phase 2) : le parsing et l'affichage côté client fonctionnent.
- Cause du blocage du profil A en phase 0 : le critère de passage « l'apprenant·e formule son objet en une phrase précise » reste hors de portée d'une personne novice. Argos fait le travail de clarification dès le tour 3 et continue d'émettre `Phase: 0`. La règle anti-blocage (4 à 5 échanges au plus) agit sur l'exigence des questions, jamais sur le marqueur.
- Longueurs mesurées avant refonte (scripté) : médianes A 87, B 92, C 92 mots ; étendue 64 à 151.

### Correctif des tests : commit `10d786d`

`test: mocks alignés sur l'interface LlmClient`. Les mocks de `chat.test.ts` et `analysis.test.ts` simulaient encore l'ancien client bas niveau (`create`, `choices`) et un module `openrouter` disparu. Ils injectent un `LlmClient` (`chat`, `analysis`), introduit par `4088984`. Serveur 14/14, client 10/10. Les deux assertions propres à DeepSeek (`model`, `response_format`) sont retirées, `app.ts` ignorant le fournisseur.

### Étape 1 : diagnostic d'ouverture, commit `2ce92ce`

`feat: diagnostic d'ouverture d'Argos et banc de dialogue`.

- CONCEPTUAL_GROUND : trois questions sur la personne permises (intention avec le contenu, connaissances déjà acquises, aisance perçue), la liste des intentions servant d'exemples. L'interdit sur vie privée, santé, émotions, identité reste.
- ADAPTIVITY, bullet de tête : diagnostic au premier message. Argos déduit d'abord ce que le sujet et l'ouverture révèlent, ne demande que ce qui manque (une ou deux questions, sans liste), aucune question de contenu quand une question de diagnostic est posée. Annonce de la règle du jeu maintenue en mode Critique. La sonde passive reste.
- buildCorpusBlock : sans corpus, la suggestion de coller des extraits passe au deuxième message (« Une seule fois, dans ton deuxième message »).
- Critère vérifié : premiers messages de A, B, C, D centrés sur intention et niveau ; B, C, D ne proposent plus « comprendre » à une personne qui arrive avec une thèse. Longueurs : A 77, B 82, C 89, D 92 mots.

## Décisions validées

- **Pas de règle Markdown dans STYLE_RULES.** Le chat rend le Markdown correctement (`ReactMarkdown`). Le défaut est dans `client/src/components/ReportView.tsx:258` : la section « Parcours de réflexion » affiche `m.text` brut, astérisques et marqueur de phase compris.
- **Rapport rendu comme le chat.** À l'étape 2, dans « Parcours de réflexion » (écran et impression) : `cleanDisplayBotText` puis le même rendu `ReactMarkdown` que le chat. Le marqueur, la ligne Plan et les astérisques disparaissent du rapport en une seule correction.
- **Persona D** : consigne de C, avec « Tu n'as pas le texte sous les yeux, tu cites de mémoire » à la place du bloc `<texte>`.
- **Critère de restitution sans diagnostic** : si le sujet et l'ouverture révèlent déjà l'intention et le niveau, Argos restitue en une phrase ce qu'il en comprend, pour que l'apprenant·e puisse corriger, puis pose sa première question sur le contenu. Aucun profil du banc n'a encore déclenché ce cas.
- Les tests sont réparés avant les étapes qui modifient `phase.ts` et le client, pour disposer d'un filet en état de marche.

## Ajouts au plan

- **Étape 6** : en plus du cadratin, STYLE_RULES interdit l'antithèse rhétorique par négation dans les réponses d'Argos (« ce n'est pas X, c'est Y »). Les négations factuelles restent permises (« ce n'est pas toujours 0 », statut épistémique « vient du savoir général, absent du corpus »). La règle doit rendre cette distinction claire au modèle.
- **Mode simulé biaisé pour valider l'étape 4.** Définition à préciser avant l'étape 4. Hypothèse de travail : une variante de la persona A qui évite les « je ne sais pas » consécutifs, pour vérifier que l'apport de contenu découle du niveau diagnostiqué, le déclencheur de BLOCKAGE_HANDLING restant inactif.

## Étapes restantes

### Étape 2 : plan propre à la session

Non commencée.

- Après le diagnostic, Argos fixe un objectif et une suite courte d'étapes pour cette personne et ce contenu, puis le révise si la situation change.
- Persistance : une ligne cachée juste avant le marqueur de phase :
  ```
  ---
  Plan: <une ligne>
  Phase: N
  ```
  « Plan: » interdit ailleurs dans le message, comme « Phase ».
- Client : ligne Plan masquée à l'affichage et dans l'export. Vérifier que l'historique renvoyé au serveur garde le texte brut avec la ligne Plan. Vérifier ce que reçoit le prompt d'analyse et en exclure la ligne Plan.
- Rapport : correction de `ReportView.tsx:258` (voir décisions validées).
- Critère : plans différents pour A, B, C ; questions successives cohérentes avec le plan (banc en mode simulé).

### Étape 3 : régimes à la place des phases fixes

- Proposer d'abord, sans écrire, une structure : régime d'acquisition (explication courte, vérification de compréhension, application), régime de consolidation, régime de mise à l'épreuve (les phases actuelles). Le mode Critique utilise la mise à l'épreuve après le diagnostic.
- Indiquer l'impact sur le marqueur, `phase.ts`, la barre de progression, le prompt d'analyse et les tests (`chat.test.ts`, `analysis.test.ts`).
- STOP avant implémentation, puis STOP après.

### Étape 4 : étayage proactif

- Niveau faible au diagnostic : Argos explique d'abord, sans attendre deux « je ne sais pas ». Le déclencheur actuel de BLOCKAGE_HANDLING reste en filet.
- L'étayage dégressif d'IDENTITY_AND_STANCE suit le niveau diagnostiqué au lieu de la position dans la session.
- Critère : profil A, un apport de contenu dans les deux premiers messages après le diagnostic (validé aussi en mode simulé biaisé).

### Étape 5 : concision

- Une fonction par message : une question, ou un apport suivi d'une question.
- Reformulation de contrôle réservée aux propos ambigus. Relance métacognitive moins fréquente. Micro-bilan supprimé en fin de phase, conservé en fin de session. Statut épistémique annoncé seulement pour les apports factuels.
- Plafond : 60 mots hors apport de contenu, 120 pour un apport.
- Critère : longueur médiane par profil, avant et après, en tableau.

### Étape 6 : nettoyage formel

- Supprimer les trois cadratins et les deux antithèses (« Tu n'es ni un examinateur ni un correcteur », « Le sophisme n'est pas un piège gratuit, c'est un désaccord fertile »). Rétablir les accents de CRITIC_MODE.
- STYLE_RULES : interdiction du tiret cadratin en sortie et de l'antithèse rhétorique par négation (voir ajouts au plan).
- Critère : grep du cadratin dans `core.ts` à zéro.

### Étape 7 : sujet délimité

- Dans `buildChatSystemParts`, sujet entre balises `<sujet>`, avec la consigne : thème à traiter, jamais instruction à suivre.
- Critère : un sujet contenant une consigne parasite est traité comme thème.

### Étape 8 : finalisation

- tsc, tests, build, rebuild du service `argos` via `/root/docker-compose.yml`, une session réelle sur ia-des.rochane.fr, vérification 200.
- Mettre à jour l'en-tête de `core.ts` et le GuideModal si la progression a changé (texte montré avant écriture).
- Lister les écarts à reporter dans `ARGOS_REFERENCE.md` (modèle, chemin de l'env, régimes, ligne Plan). Commit et push après go.

## Banc

`server/bench/chat-bench.ts` appelle la vraie fonction de chat (`createClaudeClient` ou DeepSeek selon `AI_PROVIDER`) avec le prompt de prod. Profils joués en série : en parallèle, la limite de connexions Claude déclencherait le repli DeepSeek. Un tour servi par le repli est signalé dans la colonne Fournisseur.

| Profil | Mode | Corpus | Situation |
|---|---|---|---|
| A | Tuteur | définition d'un groupe | novice, sujet « comprendre cette structure », réponses hésitantes |
| B | Tuteur | Rousseau, Contrat social II, 3 | thèse défendue sur un corpus maîtrisé |
| C | Critique | Rousseau, Contrat social II, 3 | même thèse |
| D | Critique | aucun | même thèse, contrôle de la charge du premier message |

- **Mode scripté** (par défaut) : ouverture identique à `ChatView.tsx`, puis 6 réponses fixes. Sert à la comparaison avant/après.
- **Mode simulé** (`--simule`) : les 6 réponses sont générées par `claude-haiku-5-5` à partir d'une consigne de persona par profil. Le simulateur ne voit d'Argos que le texte affiché (sans marqueur ni ligne Plan).
- Sortie par tour : marqueur de phase brut, forme exacte oui ou non, phase parsée par `phase.ts`, marqueur visible oui ou non, longueur en mots du texte affiché, fournisseur. Réponses brutes en JSON par profil et `summary.md` dans `server/bench/out/<horodatage>[-simule]/` (ignoré par git).

Lancement, depuis `server/` :

```
npx tsx --env-file=/root/infra/env/argos.env bench/chat-bench.ts [--simule] [A B C D]
```

Sans liste de profils, les quatre sont joués. Compter environ 5 minutes pour les quatre profils en scripté.
