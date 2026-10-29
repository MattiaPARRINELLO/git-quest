# AGENTS.md — GitQuest

PWA pédagogique pour apprendre Git par la visualisation. Vite + React + TypeScript
strict, Zustand, Tailwind v4, Framer Motion, SVG maison, Vitest, IndexedDB via
`StorageAdapter`.

## Commandes

- `npm run dev` — bac à sable en développement (Vite).
- `npm run typecheck` — `tsc --noEmit`, obligatoire avant commit.
- `npm test` — Vitest (moteur, layout, composants).
- `npm run coverage` — couverture du moteur.
- `npm run build` — typecheck + build PWA (génère `dist/sw.js`).
- `npm run preview` — sert le build (vérifier le mode hors ligne).

## Règles d'architecture

- `src/engine/` est **pur** : aucune dépendance React, DOM, stockage, `Date.now()`
  ou `Math.random()`. Horloge et compteur sont dans `RepoState`.
- Toute commande renvoie un nouvel état immuable :
  `execute(state, command) => { newState, output, events, error? }`.
  En cas d'erreur, `newState === state`.
- Les commandes applicatives (`explain`, `undo`, `hint`, `reset-mission`) sont
  interceptées dans `src/app/commands.ts`, jamais dans le moteur. Le moteur ne gère
  que `git *`, `touch`, `edit`, `rm`, `ls`, `cd`.
- `explain` est un dry-run via `execute`.
- Le contenu est data-driven : aucune leçon ou mission codée en dur dans un composant.
- Pas de `any`. Unions discriminées, `readonly`, `exactOptionalPropertyTypes`.
- Les messages d'erreur Git sont fidèles ; les écarts assumés sont documentés dans
  `docs/ARCHITECTURE.md` et `docs/VERIFY.md`.
- Ajouter une commande = parseur + handler + registry + test dédié + event/explanation.
- Ajouter une mission = fichier dans `src/content/chapters/<chapitre>/missions/` +
  test de sa solution (`validate(state).ok === true`).

## UI (Phase 2)

- Seul écran : `src/screens/SandboxScreen.tsx` (route `#/sandbox`). Ne pas ajouter
  missions/cours/XP avant la Phase 3.
- `layoutGraph(state)` dans `src/components/graph/layout.ts` reste **pur et testé**.
  Ne jamais recalculer une position à partir de la liste des branches courantes :
  la stabilité des positions existantes est un contrat (x = timestamp, lane =
  `Commit.branch`).
- Le graphe joue les `GitEvent` de `lastEvents`, il ne diffe jamais deux états.
- Tout service web local doit passer par Portless (`https://<nom>.localhost`).
- UI en français, commandes Git en anglais. Thème sombre par défaut, tokens CSS
  dans `src/styles/index.css`, pas de couleurs codées en dur dans les composants.
- Le terminal reste utilisable clavier : focus auto, `aria-live`, Tab/↑/↓/Ctrl+L/C.

## Conventions

- Code et noms en anglais, UI en français, commandes Git en anglais.
- Fichiers en kebab-case pour les modules, composants en PascalCase.
- Un commit par unité de travail vérifiée (typecheck + tests + build si UI).
- Ne jamais logger de secret ; aucun secret n'est nécessaire au projet.

## Méthode

Travail par phases (0 à 4), avec arrêt et validation à la fin de chaque phase.
Ne pas démarrer la phase suivante sans accord explicite. Phases 0, 1 et 2 livrées.
