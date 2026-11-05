# Contribuer à GitQuest

Merci de vouloir aider. GitQuest est une PWA pédagogique sans backend : tout tient dans
le navigateur, et le contenu est de la donnée typée. Une contribution utile peut être un
correctif, une mission, une traduction ou une amélioration de l'interface.

Ce guide donne le chemin le plus court. Les détails de contenu sont dans
[`docs/CONTENT.md`](docs/CONTENT.md), la traduction dans [`docs/I18N.md`](docs/I18N.md),
l'architecture dans [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Démarrage en trois commandes

```bash
npm ci
npm run dev
npm test
```

- `npm run dev` ouvre le bac à sable Vite (l'URL est affichée dans le terminal).
- `npm test` lance Vitest. Les tests couvrent le moteur, le contenu, le layout et les
  composants.
- `npm run check` vérifie le typecheck, les invariants du contenu et la parité des
  traductions. C'est le contrôle à passer avant d'ouvrir une PR.

Pour un service web local, expose-le avec Portless (`https://<nom>.localhost`) plutôt
qu'avec un port en dur, conformément aux conventions du projet.

## Carte du code

| Dossier | Rôle | Règle |
| --- | --- | --- |
| `src/engine/` | Moteur Git pur | Aucun import React, DOM, stockage, `Date.now()` ou `Math.random()` |
| `src/story/` | Chaîne narrative « Nova », slots, préconditions | Pur, alimenté par `src/content/story/` |
| `src/content/` | Cours, missions, briefings | Data-driven, jamais de texte en dur dans un composant |
| `src/screens/` | Écrans routés | UI en français par défaut, textes via `t()` |
| `src/components/` | Graphe, terminal, panneaux | Composants sans logique métier |
| `src/i18n/` | Catalogues FR/EN et `t()` | Toute nouvelle chaîne d'interface passe par là |
| `src/store/` | Zustand + persistance | La progression reste locale |

## Les règles à ne pas casser

1. **Le moteur reste pur.** Une commande renvoie toujours
   `{ newState, output, events, error? }`, et `newState === state` en cas d'erreur.
2. **Le contenu est de la donnée.** Pas de leçon ni de mission codée dans un composant.
3. **Pas de `any`.** Unions discriminées, `readonly`, `exactOptionalPropertyTypes`.
4. **UI en français, commandes Git en anglais.** Les textes d'interface passent par
   `t('clé')` ; les commandes restent des commandes.
5. **Jamais de tiret cadratin** (U+2014) dans un texte produit : réponse, code,
   documentation, commit, issue ou PR. Utiliser une virgule, deux-points, parenthèses ou
   un tiret simple.
6. **Un commit par unité de travail vérifiée.** Typecheck + tests avant de commiter, un
   commit qui raconte une seule intention.

## Ajouter une mission

La commande génère le fichier, l'import dans le chapitre et un stub dans la chaîne story :

```bash
npm run new:mission -- --chapter shortcuts --id ma-mission --title "Ma mission"
```

Elle refuse un identifiant déjà pris et calcule le numéro et l'ordre. Ensuite :

1. écrire l'histoire (3 phrases maximum), la situation, l'objectif, les étapes et le
   `takeaway` dans le fichier généré ;
2. décrire le préambule, les slots et la `reference` dans `src/content/story/<chapitre>.ts` ;
3. ajouter un briefing dans `src/content/briefings.ts` si la mission raconte une scène ;
4. lancer `npm run check:content` puis `npm test` ;
5. ajouter les textes anglais correspondants si la traduction du chapitre est ouverte.

Le détail des champs et des invariants est dans [`docs/CONTENT.md`](docs/CONTENT.md).

## Ajouter une commande Git

Le chemin est balisé dans [`AGENTS.md`](AGENTS.md) :

1. parseur dans `src/engine/parse/` ;
2. handler dans `src/engine/commands/` ;
3. enregistrement dans le registry ;
4. test dédié dans `src/engine/__tests__/` ;
5. événement et explication (`src/explanations/`, clés i18n) ;
6. si la commande doit apparaître dans l'aide terminal : `src/app/help.ts`.

Les messages d'erreur Git restent fidèles à Git. Un écart assumé se documente dans
`docs/ARCHITECTURE.md` et `docs/VERIFY.md`.

## Traduire

L'interface est entièrement pilotée par `src/i18n/locales/fr.ts` et
`src/i18n/locales/en.ts`, avec une parité garantie au typecheck. Voir
[`docs/I18N.md`](docs/I18N.md) pour ajouter une clé, une langue ou traduire un chapitre.

## Ouvrir une PR

- Décrire le problème et la solution, pas seulement la liste des fichiers.
- Indiquer ce qui a été exécuté : `npm run check`, `npm test`, `npm run build`, test
  manuel, etc.
- **Divulgation IA obligatoire** : préciser si la contribution a été écrite avec un
  assistant IA et ce que l'humain a réellement exécuté, testé ou vérifié. Pas
  d'attribution humaine implicite.
- La CI doit passer. Les modèles de PR et d'issue sont dans `.github/`.

## Signaler un bug

Ouvrez une issue avec le modèle « Bug » : version ou commit, écran concerné, commande
tapée, résultat attendu et résultat observé. Une capture du terminal ou du graphe aide
beaucoup.
