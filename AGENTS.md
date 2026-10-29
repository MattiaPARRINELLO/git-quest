# AGENTS.md — GitQuest

PWA pédagogique pour apprendre Git par la visualisation. Vite + React + TypeScript
strict, Zustand, Tailwind v4, Framer Motion, SVG maison, Vitest, IndexedDB via
`StorageAdapter`.

## Commandes

- `npm run typecheck` — `tsc --noEmit`, obligatoire avant commit.
- `npm test` — Vitest (moteur + app).
- `npm run coverage` — couverture du moteur.
- L'UI (Vite) sera ajoutée en Phase 2 ; il n'y a pas encore de `npm run dev`.

## Règles d'architecture

- `src/engine/` est **pur** : aucune dépendance React, DOM, stockage, `Date.now()`
  ou `Math.random()`. Horloge et compteur sont dans `RepoState`.
- Toute commande renvoie un nouvel état immuable :
  `execute(state, command) => { newState, output, events, error? }`.
  En cas d'erreur, `newState === state`.
- Les commandes applicatives (`explain`, `undo`, `hint`, `reset-mission`) sont
  interceptées dans `src/app/commands.ts`, jamais dans le moteur. Le moteur ne gère
  que `git *`, `touch`, `edit`, `ls`, `cd`.
- `explain` est un dry-run via `execute`.
- Le contenu est data-driven : aucune leçon ou mission codée en dur dans un composant.
- Pas de `any`. Unions discriminées, `readonly`, `exactOptionalPropertyTypes`.
- Les messages d'erreur Git sont fidèles ; les écarts assumés sont documentés dans
  `docs/ARCHITECTURE.md` et `docs/verification.md`.
- Ajouter une commande = parseur + handler + registry + test dédié.
- Ajouter une mission = fichier dans `src/content/chapters/<chapitre>/missions/` +
  test de sa solution (`validate(state).ok === true`).

## Conventions

- Code et noms en anglais, UI en français, commandes Git en anglais.
- Fichiers en kebab-case pour les modules, composants en PascalCase.
- Un commit par unité de travail vérifiée (typecheck + tests).
- Ne jamais logger de secret ; aucun secret n'est nécessaire au projet.

## Méthode

Travail par phases (0 à 4), avec arrêt et validation à la fin de chaque phase.
Ne pas démarrer la phase suivante sans accord explicite.
