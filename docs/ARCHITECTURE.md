# Architecture — GitQuest

Document de référence. Il décrit les décisions structurantes, le contrat du moteur
et les règles de fidélité vis-à-vis de Git. Toute évolution doit le mettre à jour.

## 1. Principes

1. **Le moteur est pur.** `src/engine/` ne connaît ni React, ni le DOM, ni le stockage.
   Toute commande prend un `RepoState` et rend un nouveau `RepoState`.
2. **Le contenu est de la donnée.** Cours et missions vivent dans `src/content/`.
   Un composant ne contient jamais le texte d'une leçon ou d'une mission.
3. **Une seule direction.** UI → store → moteur. Le moteur ne rappelle jamais l'UI ;
   les `events` sont la seule sortie sémantique destinée aux animations.
4. **Pas de `any`.** Les états impossibles sont exclus par des unions discriminées.
5. **Déterminisme.** Aucun `Date.now()`, aucun `Math.random()` dans le moteur :
   horloge logique (`clock`) et compteur (`nextId`) sont dans l'état.

## 2. Arborescence

```
src/
├─ engine/            # pur TypeScript : état, parsing, commandes, validations
│  ├─ types.ts
│  ├─ hashes.ts
│  ├─ scenario.ts     # builder de dépôt pour missions et tests
│  ├─ validate.ts     # prédicats de validation de mission
│  ├─ parse/          # tokenizer + ParsedCommand
│  ├─ ops/            # refs, graph, checkout (sécurité), diff, worktrees
│  ├─ commands/       # 1 fichier par commande + registry
│  └─ __tests__/
├─ app/               # hors moteur : explain, undo, hint, reset-mission, scoring
├─ explanations/      # event -> phrase française
├─ content/           # chapitres, cours, missions (données typées)
├─ storage/           # StorageAdapter + implémentations IndexedDB / mémoire
├─ store/             # Zustand (repo, mission, progression, UI)
├─ components/        # terminal, graphe, pipeline, worktrees, mission, cours
├─ screens/
├─ router/
├─ hooks/
├─ lib/
└─ styles/
```

## 3. Modèle de données

```ts
interface RepoState {
  version: 1;
  initialized: boolean;
  commits: Record<CommitHash, Commit>;      // partagé par tous les worktrees
  branches: Record<BranchName, CommitHash>; // simples pointeurs
  worktrees: Record<WorktreeId, Worktree>;  // HEAD + index + working dir propres
  activeWorktree: WorktreeId;
  clock: number;                            // horloge logique monotone
  nextId: number;                           // génération des hashes
}
```

- Un **commit** est un snapshot complet (`FileTree`), pas un diff, avec 0, 1 ou 2 parents.
- Une **branche** n'est qu'un pointeur ; elle n'existe qu'une fois le premier commit créé.
- `HEAD` est soit `{ kind: 'branch', branch }`, soit `{ kind: 'detached', commit }`.
- L'**index** est un `FileTree` du contenu indexé ; l'absence d'une clé = suppression
  indexée. Le **working dir** est un `FileTree` du contenu disque.
- Les hashes sont déterministes (`abc1234`-like) et non cryptographiques : c'est un
  écart assumé avec Git, nécessaire pour des tests et des missions stables.

`init` crée le worktree principal et attache HEAD à `main`, mais ne crée pas encore la
référence `main` : elle naît au premier commit (comportement Git réel).

## 4. API du moteur

```ts
execute(state: RepoState, command: string): ExecuteResult

interface ExecuteResult {
  newState: RepoState;                 // identique à `state` en cas d'erreur
  output: TerminalLine[];              // lignes terminal + tone
  events: GitEvent[];
  error?: GitError;                    // code + message fidèle à Git
}
```

Le moteur ne gère **que** `git *` et les commandes shell `touch`, `edit`, `ls`, `cd`.
Les commandes applicatives (`explain`, `undo`, `hint`, `reset-mission`) sont
interceptées par `src/app/commands.ts` **avant** d'appeler `execute`.

`explain` est un dry-run : il exécute la commande sur l'état courant, jette le
`newState`, et rend l'erreur éventuelle + l'explication des `events`. Aucune logique
n'est dupliquée.

### Ordre et unicité des events

Les events sont émis dans l'ordre causal, groupés ainsi :

1. fichiers (`working-file-created`, `file-staged`, …)
2. graphe (`commit-created`, `branch-created`, `branch-deleted`, `branch-moved`)
3. HEAD (`head-attached`, `head-detached`, `head-moved`)
4. worktrees et résumés de merge (`worktree-added`, `merge-fast-forward`, …)

Chaque événement est émis **au plus une fois par commande**. Une action produit soit
`head-attached`, soit `head-detached`, soit `head-moved`, jamais deux d'entre eux.
Un commit sur une branche produit `commit-created` + `branch-moved` (ou
`branch-created` si la branche était encore à naître) ; il ne produit pas d'event HEAD.
Un commit en HEAD détaché produit `commit-created` + `head-moved`.

## 5. Commandes du MVP

| Domaine | Commandes |
| --- | --- |
| Dépôt | `git init`, `git status` |
| Index / commits | `git add`, `git commit -m`, `git commit -am`, `git log --oneline --graph` |
| Branches | `git branch [<nom> [<start>]]`, `-d`, `-D`, `git switch`, `git switch -c [<nom> [<start>]]`, `git checkout` |
| Fusion | `git merge` (fast-forward et merge commit) |
| Fichiers | `git rm` (working dir + index) |
| Worktrees | `git worktree add` (+ `-b`), `git worktree list`, `git worktree remove` |
| Shell simulé | `touch`, `edit`, `rm` (working dir seul), `ls`, `cd` |
| Applicatif | `explain`, `undo`, `hint`, `reset-mission` (hors moteur) |

### Worktrees

Chaque worktree possède son HEAD, son index et son working dir. Les commits et les
branches sont partagés. `cd <path>` active un worktree ; le prompt affiche son chemin.
`git worktree add <path>` sans branche crée une branche du nom du dossier (comportement
Git). `-b <nom> [<point de départ>]` crée une branche (depuis HEAD par défaut, ou depuis
un commit/branche) avant d'ajouter le worktree.

### `git switch` / `git checkout` avec modifications locales

Règle fidèle à Git, implémentée dans `ops/checkout.ts` :

- Pour chaque fichier suivi modifié (working dir ou index par rapport au commit source) :
  si le fichier est **identique entre source et cible**, la modification est emportée.
  Sinon, si la version locale diffère aussi de la cible, Git refuserait : erreur
  `local-changes-would-be-overwritten` avec le message exact et la liste des fichiers.
- Un fichier non suivi (untracked) qui serait écrasé par la cible est refusé
  (`untracked-files-would-be-overwritten`).
- Le nouvel index et le nouveau working dir sont la cible, plus les modifications
  locales autorisées reportées.

### `git merge`

- Cible déjà ancêtre de HEAD → `Already up to date.`
- HEAD ancêtre de la cible → **fast-forward** : la branche avance, pas de commit.
- Sinon, **merge 3-way fichier par fichier** relativement à la merge-base :
  - un seul côté a modifié (ou ajouté/supprimé) → on prend ce côté ;
  - les deux côtés ont fait la même chose → OK ;
  - sinon → erreur `merge-would-conflict` (les conflits sont hors MVP, on refuse
    explicitement plutôt que de produire un état faux).
- Un merge commit a exactement deux parents.
- Les modifications locales sont emportées si elles ne sont pas écrasées par le
  résultat de la fusion, refusées sinon.

### Branches

- `git branch <nom>` crée sans déplacer HEAD.
- `-d` refuse une branche non fusionnée dans HEAD ; `-D` force.
- Supprimer une branche checkout dans **n'importe quel** worktree est refusé avec le
  message Git exact (`error: Cannot delete branch 'x' checked out at '…'`).
- `init` crée `main` par défaut ; le builder `branch()` crée une branche sans changer
  de branche active.

### Messages d'erreur

Les messages vivent dans `src/engine/errors.ts` et `commands/*`. Ils suivent Git quand le
comportement est modélisé. Les écarts assumés sont listés dans `docs/verification.md`
et en fin de phase.

## 6. Commandes applicatives et score

`src/app/commands.ts` expose `routeCommand(ctx, input)` : c'est le seul point d'entrée
du terminal. Il gère `explain`, `undo`, `hint`, `reset-mission` puis délègue le reste à
`execute`.

- `undo` restaure le dernier état de la pile (états immuables, undo gratuit),
  profondeur 50, hors moteur.
- `hint` dévoile les indices dans l'ordre vague → précis → solution.
- `reset-mission` restaure l'état initial de la mission et vide l'historique.

**Ne comptent pas pour les étoiles** : `status`, `log`, `ls`, `worktree list`, toute
commande en erreur, et les commandes applicatives (`explain`, `undo`, `hint`,
`reset-mission`). Étoiles : 3 si `commandes ≤ par`, 2 si `≤ par + 2`, sinon 1.

## 7. Format d'une mission

```ts
interface Mission {
  id: string;
  chapterId: string;
  order: number;
  title: string;
  story: string;                            // 3 phrases maximum
  situation: string;                        // état de départ, 1 phrase
  objective: string;
  steps: readonly { label: string; done: (state) => boolean }[]; // checklist 2-4
  takeaway: string;                         // « Ce que tu dois remarquer »
  difficulty: 1 | 2 | 3;
  par: number;
  initialState: RepoState;                 // construit via scenario()
  validate: (state: RepoState) => ValidationResult;
  hints: readonly [string, string, string];
  solution: readonly string[];             // rejouée par un test
  predictions?: readonly Prediction[];
  forbidden?: readonly ForbiddenCommand[];
  suggestedCommands?: readonly string[];    // 3-5, pré-remplissent le terminal
  validateAttempt?: (commands: readonly string[]) => ValidationResult;
}
```

Une mission est un fichier dans `src/content/chapters/<chapitre>/missions/`.
La checklist `steps` est cochée en direct dans le panneau mission ; `validate`
reste la seule règle de réussite. `afterMission(id)` décide de la destination du
bouton « Continuer » : mission suivante, cours du chapitre suivant, ou carte.

Le panneau mission propose aussi « Commandes utiles ici » (`suggestedCommands`),
qui pré-remplit le terminal sans exécuter.

### Découvrabilité et inspection

- `help` (app) liste les commandes groupées avec exemples ; une commande inconnue
  suggère `help` et la commande la plus proche.
- `cat <fichier>` lit le working dir sans mutation.
- Le pipeline affiche le contenu d'un fichier par zone au survol/clic et signale
  les écarts (`≠ index`, `≠ HEAD`).
`validate` s'appuie sur les helpers de `engine/validate.ts` (`branchTip`,
`isHeadDetached`, `fileContent`, …). La solution de chaque mission est testée :
elle doit mener à `validate(state).ok === true`.

## 8. Stockage

Tout passe par `StorageAdapter` (`get`, `set`, `remove`). Implémentations :
`IndexedDbAdapter` (idb-keyval) et `MemoryAdapter` (tests). Clés versionnées :
`gitquest.progress.v2` (progression + story-repo), `gitquest.sandbox.v1`
(bac à sable, inchangé). La clé `gitquest.progress.v1` reste écrite en miroir
minimal (`completed`, `lessonSlides`) pour les anciens builds et le rollback.

## 9. Hors périmètre MVP (prévu dans l'archi, non implémenté)

Conflits de merge, rebase, cherry-pick, reset/revert, stash, remotes, reflog,
bisect, comptes utilisateurs, backend, partage de progression.

## 10. Contraintes de qualité

- `tsc --noEmit` en mode strict, zéro `any`.
- Un fichier de test par commande + tests de scénarios et de worktrees.
- On commit à chaque unité de travail vérifiée.

## 11. Phase 2 — bac à sable (`#/sandbox`)

### Écran et layout

- `src/screens/SandboxScreen.tsx` : desktop = `SplitPane` 40/60 redimensionnable
  (poignée clavier + pointeur) ; mobile (< 768 px) = onglets Terminal / Graphe /
  Fichiers, avec badge sur Graphe quand des events arrivent hors de l'onglet.
- Colonne droite : `WorktreeStrip` (si plusieurs worktrees), `CommitGraph`,
  `StagingPipeline` (worktree actif uniquement).
- Aucune notion de mission, cours ou XP : ces éléments arrivent en Phase 3/4.

### Store et persistance

- `useRepoStore` : `state`, pile d'undo (50), `lastEvents`, transcript, historique
  de commandes. Tout passe par `routeCommand` (`src/app/commands.ts`).
- Persistance : clé `gitquest.sandbox.v1` via `StorageAdapter` (IndexedDB, fallback
  mémoire). Le dépôt, le transcript et l'historique sont restaurés au chargement.
- `resetSandbox()` restaure un dépôt vierge initialisé ; `loadDemo()` charge un
  scénario main + 2 branches + 1 merge + 1 worktree.
- `useUiStore` : thème (sombre par défaut), explications, onglet mobile, badge.

### Layout du graphe (pur, testé)

`src/components/graph/layout.ts` : `layoutGraph(state) -> { nodes, edges, lanes,
branchLabels, headMarkers }`, sans React.

- **x** = index d’ordre de création du commit (0, 1, 2…) : les commandes non-commit ne créent aucun espace.
- **lane** = lignée de la branche de création (`Commit.branch`, métadonnée figée
  au commit) ; les commits détachés ont chacun leur lane. Ajouter un commit, une
  branche ou un merge ne déplace donc jamais un commit existant (testé).
- Les commits non atteignables depuis une branche ou un HEAD sont marqués
  `orphan`, affichés à 35 % d'opacité (jamais masqués).
- Couleurs de branches dérivées du nom (`src/lib/colors.ts`), stables.
- Un marqueur HEAD par worktree ; pointillés + « détaché » pour un HEAD détaché.

### Animations et events

- Le graphe ne différencie pas deux états : il consomme `lastEvents` et calcule des
  délais séquentiels par event (commit, branche, HEAD).
- Durées 300–450 ms (`0.36 s`), `AnimatePresence` pour les nœuds/étiquettes/cartes.
- Une nouvelle commande remplace les animations en cours (nouveaux events).
- `prefers-reduced-motion` et case « sans animation » forcent des transitions nulles.

### Terminal

- Prompt `<chemin> (<branche|hash détaché>) $`.
- Historique ↑/↓, Ctrl+L (effacer), Ctrl+C (annuler), Tab (complétion commandes,
  sous-commandes, branches, fichiers, worktrees).
- Sorties colorées par `OutputTone` ; après une commande mutante, une ligne muted
  par event peut être ajoutée (bascule « Explications »).
- Zone `role="log"` + `aria-live="polite"`, focus automatique, accessible clavier.

### PWA

`vite-plugin-pwa` (generateSW) précache le bundle, les polices et les icônes.
Manifest `standalone`, thème sombre, icônes 192/512 + maskable. Vérifié en
production (`npm run build && npm run preview`) avec service worker actif puis
rechargement hors ligne.

## 12. Phase 3 — cours, missions, prédictions

### Routes

- `#/` : carte des chapitres (`HomeScreen`).
- `#/chapter/:id/lesson` : `LessonScreen`.
- `#/mission/:id` : `MissionScreen` (réutilise `SandboxLayout`).
- `#/sandbox` : bac à sable libre (inchangé).

Routeur maison par hash (`src/router/useHashRoute.ts`), aucun routeur externe.

### Contenu

- `src/content/types.ts` : `Chapter`, `Lesson`, `LessonSlide` (`text`, `diagram`,
  `demo`, `recap`), `Mission`, `Prediction`, `ForbiddenCommand`.
- Un chapitre = un dossier `src/content/chapters/<id>/` avec `lesson.ts`, ses
  missions (un fichier par mission) et un `index.ts`. Ajouter une mission = ajouter
  un fichier + une ligne dans le chapitre.
- Les démos de cours rejouent une séquence avec le vrai moteur ; `MiniDemo` calcule
  les états à l'avance et affiche `CommitGraph` pas à pas.
- Les diagrammes sont un registre typé par `DiagramId` (`components/lesson/diagrams`).

### Progression

`useProgressStore` (clé `gitquest.progress.v1`) stocke :

- `completed: Record<missionId, { stars }>` (les étoiles ne peuvent que monter) ;
- `lessonSlides: Record<chapterId, index>` pour reprendre un cours.

La renumérotation 2.4 → 2.3 ne change pas l'id persisté (`commit-perdu`) : le
format réel `{ version: 1, completed, lessonSlides }` reste valide tel quel. Un
test utilise une fixture issue de ce format pour garantir qu'une mission 2.4
terminée reste acquise en 2.3.

Les missions se déverrouillent **linéairement** : la première est ouverte, chaque
suivante exige la précédente terminée (`isMissionUnlocked`). Le bac à sable reste
toujours accessible.

### Mode mission

- `MissionScreen` démarre la mission via `startMission` : le dépôt du bac à sable
  est sauvegardé en mémoire, remplacé par l'état initial, et restauré à la sortie
  (`endMission`). Le mode mission ne persiste **pas** dans `gitquest.sandbox.v1`.
- Compteur de commandes : seules les commandes `scored` comptent (mêmes exclusions
  que le bac à sable). Étoiles : 3 si `≤ par`, 2 si `≤ par + 2`, sinon 1
  (`src/app/mission.ts`).
- Validation après chaque commande mutante (`events.length > 0`). En cas d'échec,
  aucune raison n'est affichée automatiquement : l'utilisateur demande un indice.
- `forbidden` : interception avant le moteur, message pédagogique dans le terminal.
- `validateAttempt(commands)` (optionnel) : garde-fou de parcours, par exemple avoir
  tenté `git branch -d experiment` (refusée) avant de merger ou de forcer avec `-D`.
  La réussite exige `validate(state).ok` **et** `validateAttempt(commands).ok`.
- `hint` et `reset-mission` sont interceptés en mode mission ; le panneau propose
  aussi les trois indices.
- `MissionComplete` : étoiles, commandes/par, note de réussite, solution de
  référence, mission suivante.

### Prédictions

- `Prediction.trigger(parsed: ParsedCommand, state: RepoState) => boolean` est
  évalué sur la commande parsée et l'état **avant** exécution : toute fusion
  (`merge`), tout commit sous une branche donnée, ou tout `switch`/`checkout`
  d'une branche partagent ainsi le même déclencheur. Une prédiction ne se
  déclenche qu'une fois par tentative.
- L'exécution est suspendue : overlay avec choix, clic possible sur un commit/une
  étiquette du graphe (`onSelectCommit` / `onSelectBranch`) ou boutons, et bouton
  « Passer ».
- Après réponse : exécution réelle + animation, puis feedback correct/incorrect et
  explication. Rien ne bloque la suite.
- Les cibles de graphe sont des `PredictionTarget` (`commit` avec hash complet,
  `branch` avec nom).

## 13. Phase 4 — histoire continue « Nova »

Le dépôt `src/story/` est **pur** (aucun import React/DOM/stockage) et le moteur
n'importe jamais `story/`.

### Chaîne de référence

- `content/story/root.ts` + `content/story/0N.ts` déclarent, chapitre par
  chapitre, `prelude` (commandes + garde + coéquipier), `slots` (signatures de
  contenu) et `reference` (solution avec `{slotId}`).
- `story/chain.ts` rejoue la chaîne avec le vrai moteur :
  `checkpoint(n) = checkpoint(n-1) + prelude(n) + solution(n)`. Rien n'est écrit
  à la main ; changer une solution casse le test de chaîne.
- `story/checkpoints.ts` met le résultat en cache et expose
  `entryState(missionId)` : `Mission.initialState` est cette valeur calculée.
- `story/slots.ts` associe les commits du joueur aux slots **par contenu**
  (fichiers + versions). Un commit peut remplir plusieurs slots ; il reste un
  seul commit.
- `story/display.ts` résout les `{slotId}` des textes depuis l'état réel du
  joueur (jamais de hash littéral). `Prediction.resolve` fait de même pour les
  libellés de prédiction.
- `story/actor.ts` attribue les commits de prelude aux coéquipiers sans modifier
  les commandes Git.
- `story/journal.ts` ne stocke que missions, slots, chemins et raisons : jamais
  de hashes, donc un recalage ne le rend jamais faux.

### Session

- Jeu normal : la mission part de `story.nova` (arbre réel, détours compris) et
  le prelude est appliqué une seule fois (`appliedPreludes` + gardes).
- Rejeu d'une mission dépassée : **copie isolée**, Nova n'est jamais écrite.
- Rejeu de la dernière mission : recalage sur le checkpoint canonique, messages
  du joueur réappliqués par slot (`buildChain(root, specs, messages)`).
- Rechargement en pleine mission : `activeMission` (état + compteur + essais)
  est restauré tel quel, sans rejouer le prelude.
- `reset-mission` revient à l'entrée effective ; l'undo ne descend jamais
  en dessous.

### Progression

`gitquest.progress.v2` = `{ version: 2, completed, lessonSlides, story }`.
`story` contient `nova`, `activeMission`, `slots`, `slotGroups`, `journal`,
`appliedPreludes`, `isolated`. Migration v1 → v2 : étoiles conservées (max),
Nova positionné au checkpoint de la première mission non terminée.

### Écran final

`#/nova` (accessible après 4.3) : graphe en lecture seule, statistiques
(commits, branches, merges, worktrees créés via le journal / actifs via l'état,
orphelins), détail d'un commit (auteur, branche, mission d'origine), export PNG
côté client et `git log --oneline --graph` copiable.

### Briefing et tolérance de contenu

- Chaque mission s'ouvre sur un **briefing narratif** (`src/content/briefings.ts`),
  affiché en surcouche et skippable (« Passer l'intro », `Entrer dans le dépôt`,
  ou la première commande). Le texte vit dans le contenu, jamais dans le composant.
- Quand le contenu d'un fichier n'est pas le concept de la mission (branche,
  worktree, rescue), la validation vérifie sa **présence**, pas sa valeur
  exacte : `notes.txt` (2.1), `exp.txt` (2.3), `bug.txt` (4.1),
  `docs/GUIDE.md` (4.2). Les slots correspondants utilisent `present`.
- Les missions dont le contenu est le concept (1.1, 1.2, 1.3) gardent des
  vérifications exactes.

### Isolation

Le bac à sable (`gitquest.sandbox.v1`) et les mini-démos de cours n'importent
rien de `story/` : Nova ne fuit ni dans l'un ni dans les autres.
