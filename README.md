# GitQuest

PWA pédagogique pour apprendre Git visuellement : un terminal simulé et un graphe de
commits animé, branchés sur un moteur Git **pur TypeScript**.

> État : **Phases 0–3 livrées** — moteur, bac à sable, cours, 12 missions,
> prédictions et PWA. L'XP, les niveaux et les badges arrivent en Phase 4.

## Démarrer

```bash
npm install
npm run dev         # bac à sable en développement
npm run typecheck   # tsc --noEmit, strict
npm test            # Vitest : moteur, layout, composants
npm run coverage    # couverture du moteur
npm run build       # typecheck + build PWA
npm run preview     # sert dist/ (vérifier le mode hors ligne)
```

Routes : `#/` (carte des chapitres), `#/chapter/:id/lesson`, `#/mission/:id`,
`#/sandbox` (bac à sable libre). Thème sombre par défaut, thème clair disponible.
En local, servir via Portless : `portless gitquest npm run dev` puis
`https://gitquest.localhost`. `npm run dev` fonctionne aussi sans Portless
(Vite sur son port local).


## Le parcours

- **4 chapitres** : Sous le capot, Les branches, Fusionner, Worktrees.
- Chaque chapitre : un cours de 4–5 min (slides texte, diagrammes animés, mini-démo
  rejouée avec le vrai moteur, antisèche finale), puis 3 missions.
- **12 missions** scénarisées : story d'équipe, objectif, 3 indices progressifs,
  validation sur l'état final, solution de référence et étoiles selon le nombre de
  commandes (`par` = longueur de la solution).
- **Missions verrouillées** tant que la précédente n'est pas terminée ; le bac à
  sable reste toujours accessible.
- **Prédictions** sur 1.2, 2.2, 3.1 et 3.2 : l'exécution est suspendue, on répond en
  cliquant un commit/une étiquette du graphe ou un bouton, puis la commande
  s'exécute et le feedback explique.
- **Progression** persistée localement (missions terminées, étoiles, slide de cours)
  sous `gitquest.progress.v1`.

## Le bac à sable

- **Terminal** : prompt `<worktree> (<branche|hash détaché>) $`, historique ↑/↓,
  Tab (commandes, sous-commandes, branches, fichiers, worktrees), Ctrl+L, Ctrl+C,
  `explain <commande>` (dry-run), `undo`, explications en français activables.
- **Graphe SVG** : temps de gauche à droite, une lane par branche, couleurs stables,
  étiquettes de branches, un marqueur HEAD par worktree, commits orphelins estompés,
  pan/zoom, recentrage, infobulle (hash, message, parents, snapshot).
- **Pipeline** : Working dir → Staging → Dernier commit, puces colorées par statut.
- **Worktrees** : cartes cliquables (exécutent `cd <chemin>`, visible dans
  l'historique), branche/HEAD, nombre de modifications.
- **Persistance** : état, transcript et historique dans IndexedDB
  (`gitquest.sandbox.v1`), restaurés au chargement. Boutons « Démo » et
  « Réinitialiser ».
- **PWA** : manifest, icônes, service worker, fonctionnement hors ligne.

## Architecture

```
src/engine/        moteur pur : types, parsing, commandes, worktrees, validations
src/app/           explain / undo / hint / reset-mission + score
src/explanations/  event -> phrase française
src/components/
  graph/           layoutGraph (pur, testé) + CommitGraph (SVG/Framer Motion)
  terminal/        terminal, complétion
  pipeline/        working dir / index / commit
  worktrees/       cartes de worktrees
src/store/         useRepoStore (état, undo, events), useUiStore (thème, onglets)
src/storage/       StorageAdapter + IndexedDB + mémoire
src/content/       chapitres, cours, missions, prédictions, scénario de démo
src/screens/       HomeScreen (carte), LessonScreen, MissionScreen, SandboxScreen
docs/ARCHITECTURE.md  contrat détaillé, stabilité du layout, persistance
docs/VERIFY.md        scénarios à comparer avec un vrai Git
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

Une mission est un fichier dans
`src/content/chapters/<chapitre>/missions/<id>.ts`, référencé dans le `index.ts`
du chapitre :

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
  forbidden: [{ prefix: 'git stash', message: '…' }],
  hints: ['vague', 'précis', 'solution'],
  solution: ['git worktree add ../hotfix -b hotfix main', 'cd ../hotfix', '…'],
};
```

Chaque mission doit avoir un test qui rejoue `solution`, vérifie
`validate(state).ok === true`, et vérifie que l'état initial **ne** valide **pas**
la mission (voir `src/engine/__tests__/missions.test.ts`).

## Commandes du MVP

`git init`, `status`, `add`, `commit -m` / `-am`, `log --oneline --graph`,
`branch [<nom> [<start>]]` (créer / lister / `-d` / `-D`),
`switch`, `switch -c [<nom> [<start>]]`, `checkout` (branche ou commit),
`merge` (fast-forward, merge commit, merge 3-way fichiers), `worktree add` (+ `-b`),
`worktree list`, `worktree remove`, `git rm`, `touch`, `edit`, `cat`, `rm`, `ls`, `cd`.
Commandes d’aide : `help`, `explain`, `undo`, `hint`, `reset-mission`.

Hors périmètre MVP : conflits, rebase, cherry-pick, reset/revert, stash, remotes,
reflog, bisect, comptes, backend.
