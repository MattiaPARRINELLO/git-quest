# GitQuest

PWA pédagogique pour apprendre Git visuellement : cours court, bac à sable et missions
scénarisées. Le moteur Git simulé est un module TypeScript **pur**, testé indépendamment
de l'interface.

> État : **Phase 1 terminée** — moteur + tests. L'interface arrive en Phase 2.

## Démarrer

```bash
npm install
npm run typecheck   # tsc --noEmit, strict
npm test            # Vitest (moteur + commandes applicatives)
npm run coverage    # rapport de couverture
```

Aucun navigateur n'est nécessaire pour cette phase.

## Utiliser le moteur

```ts
import { execute, scenario } from './src/engine';

const repo = scenario()
  .init()
  .commit('Initial commit', { 'README.md': '# Projet' })
  .branch('feature')
  .checkout('feature')
  .build();

const result = execute(repo, 'git commit -am "feat: login"');
// result.newState, result.output, result.events, result.error?
```

- En cas d'erreur, `newState === state` (aucune mutation partielle) et `error` porte un
  code + un message fidèle à Git.
- Chaque commande réussie renvoie un nouvel état : undo et animations avant/après sont
  gratuits.
- Les `events` (`commit-created`, `branch-moved`, `head-detached`, …) sont traduits en
  français par `src/explanations/fr.ts`.

Les commandes applicatives (`explain`, `undo`, `hint`, `reset-mission`) ne sont **pas**
dans le moteur : `src/app/commands.ts` les intercepte avant `execute`.

## Architecture

```
src/engine/     moteur pur : types, parsing, commandes, worktrees, validations
src/app/        explain / undo / hint / reset-mission + score
src/explanations/  event -> phrase française
src/content/    chapitres et missions (données, Phase 3+)
docs/ARCHITECTURE.md  décisions et contrat détaillé
docs/VERIFY.md        5 scénarios à comparer avec un vrai Git
```

## Ajouter une commande au moteur

1. Ajouter le cas dans `src/engine/parse/parse-command.ts` (`ParsedCommand` dans
   `types.ts` si besoin).
2. Créer `src/engine/commands/<commande>.ts` : fonction pure
   `(state, command) => ExecuteResult`.
3. L'enregistrer dans `src/engine/commands/registry.ts`.
4. Émettre les `events` dans l'ordre fichiers → graphe → HEAD → worktree.
5. Ajouter un événement dans `GitEvent` et sa phrase dans `src/explanations/fr.ts`.
6. Ajouter `src/engine/__tests__/<commande>.test.ts` (succès, erreurs, état immutable).

## Ajouter une mission

Une mission sera un fichier dans
`src/content/chapters/<chapitre>/missions/<id>.ts` :

```ts
export const mission: Mission = {
  id: 'worktree-hotfix',
  chapterId: 'worktrees',
  order: 1,
  title: 'Le bug de prod',
  story: '…',
  objective: 'Corrige la prod sans toucher à ton WIP.',
  difficulty: 3,
  par: 8,
  initialState: scenario()
    .init()
    .commit('Initial', { 'bug.txt': 'bug' })
    .branch('feature')
    .checkout('feature')
    .write('src/app.ts', 'wip')
    .build(),
  validate: (state) => check(branchFile(state, 'hotfix', 'bug.txt') === 'corrigé', '…'),
  hints: ['vague', 'précis', 'solution'],
  solution: ['git worktree add ../hotfix -b hotfix main', 'cd ../hotfix', '…'],
};
```

Chaque mission doit avoir un test qui rejoue `solution` et vérifie
`validate(state).ok === true` (voir `src/engine/__tests__/missions.test.ts`).

## Commandes du MVP

`git init`, `status`, `add`, `commit -m` / `-am`, `log --oneline --graph`, `branch`
(créer / lister / `-d` / `-D`), `switch`, `switch -c`, `checkout` (branche ou commit),
`merge` (fast-forward, merge commit, merge 3-way fichiers), `worktree add` (+ `-b`),
`worktree list`, `worktree remove`, `touch`, `edit`, `ls`, `cd`.

Hors périmètre MVP : conflits, rebase, cherry-pick, reset/revert, stash, remotes,
reflog, bisect, comptes, backend.
