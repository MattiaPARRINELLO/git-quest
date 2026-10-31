# CI — GitHub Actions

Le dépôt a une seule pipeline, `.github/workflows/ci.yml`. Elle ne publie rien et
ne déploie rien : elle prouve qu'un commit est typé, testé, installable comme PWA
et assez léger pour être servi.

## Déclencheurs

| Événement | Branche | Effet |
| --- | --- | --- |
| `push` | `main` | pipeline complète |
| `pull_request` | vers `main` | pipeline complète + revue des dépendances |
| `workflow_dispatch` | n'importe laquelle | relance manuelle depuis l'onglet Actions |

Un nouveau push sur la même ref annule la run précédente (`concurrency`,
`cancel-in-progress: true`). Chaque job a un `timeout-minutes` et le workflow
n'utilise que `permissions: contents: read`.

## Jobs

| Job (id) | Nom affiché | Rôle |
| --- | --- | --- |
| `verify` (matrice `22.x`, `24.x`) | Verify (Node 22.x / 24.x) | `npm ci`, `typecheck`, `test`, `build`, puis `node ci/check-dist.mjs` |
| `coverage` | Coverage budget | Vitest avec couverture, puis `node ci/check-coverage.mjs` |
| `smoke` | PWA smoke test | sert `dist/` avec `vite preview` et vérifie ce qu'un navigateur reçoit |
| `audit` | Dependency audit | `npm audit --omit=dev` bloquant, arbre complet en avertissement |
| `dependencyReview` | Dependency review | `actions/dependency-review-action` sur les PR, non bloquant |
| `gate` | CI | agrège les résultats ; c'est **ce job** qu'il faut cocher en protection de branche |

Les jobs `verify`, `coverage` et `smoke` sont les seuls bloquants avec `audit`.
`dependencyReview` est volontairement indicatif : une nouvelle advisory publiée ne
doit jamais geler une PR sans rapport.

## Ce que vérifie chaque job

### `verify`

1. `npm ci` — l'installation échoue si `package-lock.json` ne correspond plus à
   `package.json` : c'est notre test d'intégrité du lockfile.
2. `npm run typecheck` — `tsc --noEmit` avec `strict`, `noUncheckedIndexedAccess`,
   `exactOptionalPropertyTypes`, `noUnusedLocals` et `noUnusedParameters`.
3. `npm test` — les 60 fichiers Vitest (moteur, contenu, layout, composants).
4. `npm run build` — typecheck + build Vite/PWA, qui génère `dist/sw.js`.
5. `node ci/check-dist.mjs` — inspection du build (voir ci-dessous).
6. En Node 22 seulement : upload de `dist/` pour le job `smoke`.

### `ci/check-dist.mjs`

Aucune dépendance, Node natif. Échoue si :

- un fichier attendu manque : `index.html`, `manifest.webmanifest`,
  `registerSW.js`, `sw.js`, `favicon.svg`, `apple-touch-icon.png`, les trois icônes,
  et le runtime `workbox-*.js` ;
- `index.html` n'a plus son point de montage `<div id="root"></div>`, son
  `lang="fr"`, son lien manifest, sa balise `registerSW.js` ou son
  `viewport-fit=cover` ; ou si le bundle d'entrée `/assets/*.js` référencé n'existe
  pas ;
- des source maps `.map` sont présentes (fuite de sources + poids dans le cache) ;
- le manifest n'est pas du JSON valide, ou lui manque `name`, `short_name` (≤ 12
  caractères), `start_url`, `scope`, `display: standalone`, `lang: fr`,
  `theme_color`, `background_color`, une icône 192, une 512 et une `maskable` ;
- une icône PNG n'a pas réellement les dimensions annoncées (lecture du chunk
  `IHDR`, sans bibliothèque d'image) ;
- `sw.js` ne précache pas `index.html`, n'a pas de manifeste de précache
  révisionné (`revision`), ou n'a pas de stratégie de mise à jour ;
- un budget est dépassé :

| Budget | Limite actuelle | Mesure |
| --- | --- | --- |
| `dist/` complet | 4 Mio | octets sur disque |
| JS total | 250 kB | gzip |
| CSS total | 40 kB | gzip |
| Plus gros fichier | 800 kB | octets sur disque |

Les budgets se règlent dans `BUDGETS` en tête de `ci/check-dist.mjs`. Les augmenter
est un choix explicite : le faire dans un commit dédié, avec la raison en message.

### `ci/check-coverage.mjs`

Lit `coverage/coverage-summary.json` produit par le reporter `json-summary`. Deux
niveaux de planchers, en pourcentage :

| Portée | Statements | Branches | Functions | Lines |
| --- | --- | --- | --- | --- |
| global | 87 | 77 | 90 | 87 |
| `src/engine/` | 87 | 78 | 90 | 87 |
| `src/app/` | 94 | 83 | 95 | 94 |
| `src/explanations/` | 50 | 5 | 90 | 50 |

`src/engine` est le cœur pédagogique : il doit rester la partie la mieux couverte.
Les planchers se situent juste sous les valeurs courantes, pour attraper une
régression sans bloquer un refactor légitime. Un groupe renommé fait échouer le job
volontairement (« was the folder renamed? ») : il faut alors mettre à jour
`GROUP_FLOORS`.

Le script écrit aussi un tableau récapitulatif dans le résumé de la run
(`GITHUB_STEP_SUMMARY`).

### `smoke`

Télécharge l'artefact `dist-node-22.x`, relance `npm ci` (pour `vite preview`),
démarre `npx vite preview --host 127.0.0.1 --port 4173 --strictPort` en arrière-plan, puis
`ci/smoke-preview.mjs` vérifie en HTTP réel :

- `GET /` → 200, `text/html`, jamais une page 404 ;
- les marqueurs du shell : `#root`, `lang="fr"`, manifest, `registerSW.js` ;
- chaque `/assets/*.js` et `*.css` référencé répond 200 avec le bon type (pas de
  fallback HTML silencieux) ;
- `/manifest.webmanifest` est du JSON, `standalone`, au moins 3 icônes ;
- `/sw.js` répond en JavaScript, précache `index.html` ;
- `/registerSW.js` et le runtime `workbox-*` répondent 200 ;
- les trois icônes sont de vrais PNG d'au moins 512 octets ;
- une route inconnue (`/chapter/1/lesson`) renvoie 200 avec le shell, pour qu'un
  rafraîchissement ne casse pas l'application.

Le serveur est arrêté dans un step `if: always()`, et `preview.log` est publié en
artefact en cas d'échec.

Le script attend jusqu'à 60 s que le port réponde : pas besoin de `sleep` dans le
workflow. Il accepte une URL en argument, donc il marche aussi contre un
déploiement.

### `audit`

`npm audit --omit=dev --audit-level=high` est bloquant : les dépendances
d'exécution partent dans le bundle du navigateur. L'audit complet (qui inclut la
chaîne d'outils de build) est `continue-on-error: true` : il apparaît en rouge dans
la liste des steps mais ne fait pas échouer le job.

## Reproduction locale

```bash
npm ci
npm run typecheck
npm test
npm run build
npm run ci:dist        # équivalent de l'étape d'inspection du build

npm test -- --coverage --coverage.reporter=json-summary
npm run ci:coverage    # compare aux planchers

# smoke test : deux terminaux
npm run preview -- --host 127.0.0.1 --port 4173 --strictPort
npm run ci:smoke -- http://127.0.0.1:4173
```

Raccourci : `npm run ci:all` (typecheck + build + inspection de `dist/`).

## Protection de branche (recommandé)

Dans **Settings → Branches → main**, demander que le check **`CI`** (job `gate`)
soit vert avant merge, et interdire le merge si des conversations sont non
résolues. Le job `gate` n'est vert que si `verify`, `coverage`, `smoke` et `audit`
le sont : c'est le seul nom à référencer.

## Ce que la CI ne fait pas

- Pas de test bout-en-bout dans un vrai navigateur (pas de Playwright) : les
  composants sont testés en jsdom et le build est vérifié en HTTP.
- Pas de déploiement, pas de publication npm, pas de release.
- Pas de scan de secrets ni d'analyse statique au-delà de TypeScript.
- Pas de vérification du style des messages de commit.

Ces quatre points s'ajoutent sans toucher aux jobs existants si le besoin arrive.

## Dépannage

| Symptôme | Cause probable |
| --- | --- |
| `npm ci` échoue | `package-lock.json` non régénéré après une modification de `package.json` |
| `smoke` échoue sur `vite preview exited immediately` | port 4173 occupé ou build refusé plus tôt |
| `never answered within 60s (ECONNREFUSED)` | `vite preview` écoute sur `localhost`/`::1` : ajouter `--host 127.0.0.1` |
| `check-dist` échoue sur un budget | une dépendance ou un import a gonflé le bundle ; vérifier `dist/assets` |
| `check-coverage` échoue sur un groupe absent | dossier `src/<groupe>/` renommé : mettre à jour `GROUP_FLOORS` |
| `audit` rouge mais job vert | advisory dans les dépendances de développement uniquement |
