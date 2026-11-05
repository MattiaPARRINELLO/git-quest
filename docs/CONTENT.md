# Écrire du contenu

Tout le parcours est de la donnée : `src/content/`. Une mission est un objet typé, un
cours est une suite de slides, une histoire est un tableau de `ChainMission`. Aucun texte
pédagogique ne doit vivre dans un composant React.

## Où trouver quoi

```text
src/content/
  chapters/<NN-chapitre>/
    index.ts          # le chapitre : titre, tagline, description, leçon, missions
    lesson.ts         # les slides du cours
    missions/<N>-<M>.ts
  lessons/command-line.ts   # le prologue
  briefings.ts        # les scènes d'introduction des missions
  story/<NN>.ts       # les préambules et références de la chaîne Nova
  types.ts            # le contrat
```

## Ajouter une mission

```bash
npm run new:mission -- --chapter shortcuts --id ma-mission --title "Ma mission"
```

La commande crée le fichier, l'import et l'entrée dans le tableau `missions` du chapitre,
puis ajoute un stub `ChainMission`. Elle calcule l'ordre et le numéro. Un `--dry-run`
affiche le résultat sans écrire.

### Champs d'une mission

| Champ | Rôle | Contrainte |
| --- | --- | --- |
| `id` | Identifiant stable (kebab-case) | Unique dans tout le contenu |
| `chapterId` | Chapitre d'appartenance | Doit correspondre à un `Chapter.id` |
| `order` | Rang dans le chapitre | 1, 2, 3, dans l'ordre du tableau |
| `number` | Numéro affiché | `<numéro de chapitre>.<order>` |
| `title` | Titre affiché | Court, concret |
| `story` | Mise en situation narrative | 3 phrases maximum |
| `situation` | État du dépôt au départ | Factuel |
| `objective` | Résultat attendu | Une phrase |
| `steps` | 2 à 4 conditions observables | `done(state, ctx)` renvoie un booléen |
| `takeaway` | Ce qu'il faut retenir | Une phrase |
| `difficulty` | 1, 2 ou 3 | Affiche l'effort attendu |
| `par` | Nombre de commandes pour 3 étoiles | Doit égaler `solution.length` |
| `initialState` | État d'entrée | Fourni par `entryState('<missionId>')` |
| `validate` | Validation finale | `allOf(check(...), ...)` |
| `validateAttempt` | Garde-fou d'essai | Optionnel, ex. `-d` refusé avant `-D` |
| `hints` | Trois indices progressifs | Exactement 3 |
| `solution` | Solution de référence | Commandes réelles, exécutables |
| `suggestedCommands` | Aides pré-remplies | 3 à 5 commandes |
| `predictions` | Questions avant exécution | Optionnel |
| `forbidden` | Commandes interceptées | Optionnel |
| `successNote` | Note de réussite | Optionnel |
| `display` | Textes avec hashes résolus | Optionnel, placeholders `{slotId}` |

### Étapes observables

Une étape ne doit pas décrire une intention vague : elle vérifie l'état du dépôt.

```ts
steps: [
  {
    label: 'a.txt est dans un nouveau commit',
    done: (state, ctx) => commitDelta(state, ctx?.entry ?? initial) === 1,
  },
  {
    label: 'b.txt reste modifié dans le working dir',
    done: (state) => workingFile(state, 'b.txt') === 'v2',
  },
],
```

Les validations relatives utilisent `ctx.entry` (l'état d'entrée effectif) plutôt que des
valeurs absolues : un préambule peut avoir changé le dépôt avant la mission.

### Démonstration du cours

Un slide `demo` rejoue de vraies commandes avec `execute`. Il ne simule jamais l'UI :
`MiniDemo` lève une erreur si une commande de démonstration échoue.

## Chaîne story

Chaque mission doit avoir une entrée dans `src/content/story/<chapitre>.ts` :

```ts
{
  missionId: 'ma-mission',
  prelude: [
    {
      id: 'm5.4-p1',
      commands: ['edit app.ts "v2"'],
    },
  ],
  slots: [
    {
      slotId: 'm5.4-c1',
      missionId: 'ma-mission',
      signature: { branch: 'main', files: { 'app.ts': 'v2' } },
    },
  ],
  reference: ['git add app.ts', 'git commit -m "feat: app"'],
}
```

- `prelude` prépare le dépôt et peut être sauté si `when` est déjà satisfait.
- `slots` nomment les commits attendus. Les textes les référencent par `{slotId}`.
- `reference` est la solution canonique exécutée pour construire l'état suivant.
- Un même `missionId` ne peut apparaître qu'une fois. L'ordre des fichiers story définit
  l'ordre de la chaîne.

Les erreurs de chaîne sont détectées par `npm run check:content` et par les tests
`src/story/__tests__/`.

## Briefings

`src/content/briefings.ts` associe un `missionId` à une scène skippable :

```ts
'ma-mission': {
  title: 'Nova, acte V : ...',
  lines: [
    { speaker: 'lea', text: '...' },
    { speaker: 'narrateur', text: '...' },
  ],
  outcome: 'Ce que le joueur vient d’accomplir.',
  teaser: 'Accroche vers la suite.',
}
```

Un briefing est optionnel, mais une mission narrative sans briefing se sent vide.

## Prédictions

Une prédiction suspend l'exécution une fois par tentative :

```ts
predictions: [
  {
    trigger: (parsed, state) =>
      parsed.name === 'switch' && state.worktrees[...] !== undefined,
    question: 'Après ce changement, où sera HEAD ?',
    options: [
      { id: 'main', label: 'Sur main' },
      { id: 'detached', label: 'Détaché', target: { kind: 'commit', value: '{slot}' } },
    ],
    correctOptionId: 'main',
    explanation: '...',
  },
],
```

- `trigger` doit être structurel, jamais une égalité de chaîne sur la commande brute.
- `correctOptionId` doit pointer une option existante.
- `resolve(state)` recalcule les libellés avec les vrais hashes.
- Une prédiction ne doit jamais bloquer : « Passer » reste disponible.

## Cours

Un `Lesson` contient des slides `text`, `diagram`, `demo` ou `recap`. Le dernier slide est
toujours un `recap`. Un cours dure 3 à 5 minutes estimées. Un slide `text` peut porter une
`command` et une `note`.

Ordre pédagogique : le cours précède toujours le concept utilisé par une mission. Un
chapitre peut avoir trois ou quatre missions.

## Vérifier

```bash
npm run check:content   # invariants de schéma, ordres, par/solution, prédictions
npm test                # moteur, contenu, layout, composants
npm run check           # typecheck + contenu + i18n
```

`src/content/content-invariants.test.ts` vérifie :

- identifiants uniques de chapitres et de missions ;
- chapitre non vide, cours non vide, au moins une mission ;
- `order` croissant et `number` cohérent ;
- 2 à 4 étapes, 3 indices, `par === solution.length` ;
- 3 à 5 `suggestedCommands` quand le champ existe ;
- `correctOptionId` présent dans les options et `trigger` booléen ;
- histoire de 3 phrases maximum.

Une règle qui échoue indique le plus souvent un oubli de champ, pas un bug du moteur.
