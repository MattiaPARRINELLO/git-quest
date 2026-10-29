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
| Branches | `git branch`, `-d`, `-D`, `git switch`, `git switch -c`, `git checkout` |
| Fusion | `git merge` (fast-forward et merge commit) |
| Worktrees | `git worktree add` (+ `-b`), `git worktree list`, `git worktree remove` |
| Shell simulé | `touch`, `edit`, `ls`, `cd` |
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
  story: string;
  objective: string;
  difficulty: 1 | 2 | 3;
  par: number;
  initialState: RepoState;                 // construit via scenario()
  validate: (state: RepoState) => ValidationResult;
  hints: readonly [string, string, string];
  solution: readonly string[];             // rejouée par un test
  predictions?: readonly Prediction[];
  forbidden?: readonly string[];
}
```

Une mission est un fichier dans `src/content/chapters/<chapitre>/missions/`.
`validate` s'appuie sur les helpers de `engine/validate.ts` (`branchTip`,
`isHeadDetached`, `fileContent`, …). La solution de chaque mission est testée :
elle doit mener à `validate(state).ok === true`.

## 8. Stockage

Tout passe par `StorageAdapter` (`get`, `set`, `remove`). Implémentations :
`IndexedDbAdapter` (idb-keyval) et `MemoryAdapter` (tests). Clés versionnées
(`gitquest.progress.v1`) et module de migration avant toute synchronisation future.

## 9. Hors périmètre MVP (prévu dans l'archi, non implémenté)

Conflits de merge, rebase, cherry-pick, reset/revert, stash, remotes, reflog,
bisect, comptes utilisateurs, backend, partage de progression.

## 10. Contraintes de qualité

- `tsc --noEmit` en mode strict, zéro `any`.
- Un fichier de test par commande + tests de scénarios et de worktrees.
- On commit à chaque unité de travail vérifiée.
