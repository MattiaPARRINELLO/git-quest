# Dépôt continu « Nova » — conception

> **Statut : conception seule.** Aucun code, aucune mission, aucun test n'est modifié
> par ce document. Il décrit la cible ; la mise en œuvre fera l'objet de commits
> séparés (§9.4).
>
> Référence : commit `ebfbe9a` (contenu `63e68ef`), 197 tests verts, 27 fichiers de
> test, 12 missions sur 4 chapitres.

## Changelog de cette révision

| # | Changement | Sections |
| --- | --- | --- |
| R1 | Les 10 questions ouvertes sont tranchées (§10) | §3, §6, §7, §10 |
| R2 | **Le recalage n'a lieu qu'au rejeu** ; en jeu normal l'arbre réel du joueur est conservé, détours compris, affichés comme « commits hors histoire » | §3.4, §6.4, §7 |
| R3 | Règle `nextId` après recalage (repart de la valeur canonique du checkpoint) ; le journal référence des slots, jamais des hashes | §3.5, §6.1 |
| R4 | Un commit couvrant N slots reste **un seul commit** qui remplit les N slots, y compris au recalage (jamais de dédoublement) | §3.5, §3.6, §6.1 |
| R5 | Brouillon de mission persisté après chaque commande mutante, restauré sans réappliquer le prelude | §6.1, §6.4, §8.5 |
| R6 | 4.1 : contradiction précondition / prelude corrigée (`v4` avant `v5`) | Fiche 4.1 |
| R7 | 2.3 : plusieurs commits détachés → message explicite dans le terminal, aucun choix silencieux | Fiche 2.3 |
| R8 | Sandbox et mini-démos explicitement sans accès à Nova | §6.5 |
| R9 | Estimation recomptée et chantier découpé en Phase A / Phase B | §9.4 |

---

## 0. Ce que dit le code aujourd'hui (et où le prompt dévie)

### 0.1 Compréhension de l'existant

1. Une mission est une donnée : `story`, `situation`, `steps`, `par`, `validate`,
   `hints`, `solution`, `predictions`, `forbidden`, `validateAttempt`.
2. Son état de départ est un `RepoState` **figé**, construit par `scenario()` au
   chargement du module (`mission.initialState`).
3. `MissionScreen` démarre la mission avec `startMission(mission.initialState)`,
   `reset-mission` ré applique ce même état, et `endMission` restaure le sandbox
   depuis `sandboxBackup` (variable de module, non persistée).
4. La progression vit dans `gitquest.progress.v1` :
   `{ version: 1, completed: Record<id,{stars}>, lessonSlides }` ; les étoiles ne
   peuvent que monter.
5. Le dépôt du bac à sable vit séparément dans `gitquest.sandbox.v1` et n'est
   jamais écrit en mode mission.
6. `undo` est une pile d'états dans `src/app/commands.ts` (limite 50, hors moteur),
   vide au démarrage d'une mission.
7. Le moteur est pur, immuable, et rend `{ newState, output, events, error? }`.
8. Les hashes sont `hashFor(nextId)` : déterministes, mais fonction du **compteur**
   de commits, pas du message ni du contenu.
9. `Commit.author` existe, mais vaut toujours `DEFAULT_AUTHOR` ; aucun mécanisme
   d'auteur alternatif.
10. Les validations comparent souvent des **valeurs absolues** (`commitCount`,
    tips capturés à la construction) — incompatible tel quel avec un dépôt continu.

### 0.2 Contradictions et écarts à signaler

| Point du prompt | Réalité du code | Conséquence |
| --- | --- | --- |
| `src/app/persist.ts` | n'existe pas ; progression dans `src/store/useProgressStore.ts`, sandbox dans `src/store/useRepoStore.ts` | la conception vise ces deux modules |
| « les hashes dépendent du message » | `hashFor(nextId)` ne dépend que du compteur | l'argument change, la règle « zéro hash en dur » reste valable : un **détour** décale les hashes, un message personnalisé non |
| commits de prelude « attribués à des coéquipiers » | `author` figé à `DEFAULT_AUTHOR` dans `commit.ts` et `merge.ts` | il faut un mécanisme d'auteur (cf. §9.3) |
| « commit 63e68ef » | HEAD = `ebfbe9a` (merge PR), `63e68ef` = dernier commit de contenu | sans incidence, documenté pour la traçabilité |
| `undo` « jamais en deçà de l'entrée » | déjà vrai en mission (pile vide à l'entrée), mais la limite 50 s'applique | à préserver explicitement, pas à créer |
| `Mission.initialState` | champ obligatoire, statique | conservé mais **calculé** depuis la chaîne (Q10) |

---

## 1. Synopsis Nova en 12 missions

Nova est un assistant de notes d'équipe. Le joueur en construit l'historique.
Chaque ligne : événement de l'histoire → concept Git → fichier réel touché.

| # | Événement | Concept | Fichier(s) |
| --- | --- | --- | --- |
| 1.1 | Un correctif de démarrage est prêt, mais le travail sur le login ne doit pas partir | index vs working dir | `src/app.ts` (commité), `src/login.ts` (laissé de côté) |
| 1.2 | Le CTO veut prouver qu'un commit est une photo figée | snapshot de l'index | `src/app.ts` (v3 commitée, v4 sur le disque) |
| 1.3 | Un coéquipier jure que `commit -am` fait tout ; un ADR attend d'être ajouté | `-a` ignore les untracked | `README.md`, `docs/adr-001.md` |
| 2.1 | Une idée de notes internes part en exploration | une branche est un pointeur | `src/notes.ts` (branche `spike/notes`) |
| 2.2 | La facturation part sur sa branche, la config avance sur main | qui avance au commit | `src/billing.ts`, `src/config.ts` |
| 2.3 | Une régression de facturation : on enquête sur un vieux commit, puis on perd l'expérience | HEAD détaché, commit orphelin, rescue | `src/trace-billing.ts` |
| 3.1 | L'export CSV est prêt, main n'a pas bougé depuis la facturation | fast-forward | `src/export.ts` |
| 3.2 | Les notifications et un réglage de config ont divergé | merge commit à deux parents | `src/notify.ts`, `src/config.ts` |
| 3.3 | Inès est partie en laissant deux branches | `-d` refuse, `-D` assume | `src/login.ts` (fusionnée), `src/cache.ts` (non fusionnée) |
| 4.1 | Bug critique en prod pendant la refonte UI | worktree, WIP préservé | `src/login.ts` (correctif), `src/app.ts` (WIP) |
| 4.2 | La doc doit avancer pendant la réécriture du README ; Yanis a repris le WIP de refonte | worktree sur branche existante | `docs/GUIDE.md`, `README.md` |
| 4.3 | Le hotfix est livré, le worktree traîne | `worktree remove` ne supprime pas la branche | `~/gitquest-hotfix` |

---

## 2. Fichiers du projet et coéquipiers

### 2.1 Fichiers (remplacent tous les fichiers génériques)

| Fichier | Rôle | Introduit par |
| --- | --- | --- |
| `README.md` | présentation de Nova | racine (v1), modifié 1.3 puis 4.2/4.3 |
| `src/app.ts` | bootstrap de l'application | racine (v1) ; 1.1, 1.2, 1.3 (prelude), 4.1 |
| `src/login.ts` | authentification | racine (v1) ; 1.1 (WIP), 1.2 (prelude), 3.3, 4.1 (correctif) |
| `src/config.ts` | configuration runtime | 2.2, 3.2 |
| `src/billing.ts` | module de facturation | 2.2 |
| `src/trace-billing.ts` | trace d'enquête (commit sauvé) | 2.3 |
| `src/notes.ts` | notes internes (exploration) | 2.1 |
| `src/export.ts` | export CSV | 3.1 |
| `src/notify.ts` | notifications | 3.2 |
| `src/cache.ts` | cache mémoire (branche abandonnée) | 3.3 |
| `docs/adr-001.md` | décision d'architecture (untracked au départ) | 1.3 |
| `docs/GUIDE.md` | guide utilisateur | 4.2 |

Règle : `a.txt`, `b.txt`, `notes.txt`, `exp.txt`, `feature.ts`, `main.ts`,
`bug.txt` disparaissent du contenu Nova.

### 2.2 Coéquipiers

| Nom | Rôle | Ce qu'il commite | Slots prelude |
| --- | --- | --- | --- |
| Léa Moreau | backend | `src/login.ts` (fix de session), `src/app.ts` (livraison v4), `src/config.ts` (retries) | `m1.2-p1`, `m1.3-p1`, `m3.2-p2` |
| Samir Haddad | docs | `README.md` (versions), `docs/GUIDE.md` relu | `m4.3-p1` |
| Inès Bouvet | QA / release | merge de la facturation, `src/export.ts`, `src/notify.ts`, `src/login.ts` (feature), branche `experiment` | `m3.1-p1`, `m3.1-p2`, `m3.2-p1`, `m3.3-p1`, `m3.3-p2` |
| Yanis Perret | frontend | refonte `src/app.ts`, `src/config.ts` (bump app) | `m4.1-p1`, `m4.1-p2`, `m4.2-p1` |

Le joueur est `GitQuest <gitquest@example.com>` (valeur actuelle de
`DEFAULT_AUTHOR`) ; les coéquipiers reçoivent des identités distinctes (§9.3).

---

## 3. Modèle de continuité : « recalage doux »

### 3.1 Vocabulaire

- **Root** : état initial de Nova (branche `main`, commit racine, working dir propre).
- **Checkpoint N** : `root + prelude(1..N) + solution(1..N)` rejoué.
- **Slot** : identifiant stable d'un commit de la chaîne de référence
  (`m1.2-c1` pour un commit du joueur, `m1.2-p1` pour un commit de prelude).
- **Journal** : trace de parcours (missions, détours, recalages), indépendante de
  l'arbre.

### 3.2 Chaîne de référence

```ts
interface StoryMission {
  readonly missionId: string;          // id existant, ex. 'commit-perdu'
  readonly prelude: readonly PreludeStep[];
  readonly slots: readonly CommitSlot[];
  readonly solution: readonly SolutionStep[];   // peut contenir {slot:...}
  readonly entry: readonly Precondition[];      // vérifiées AVANT le prelude
  readonly exit: readonly Precondition[];       // sanity check du checkpoint
}

interface PreludeStep {
  readonly id: string;                  // 'm2.3-p1', unique
  readonly when?: (state: RepoState) => boolean;  // garde d'idempotence
  readonly actor: TeammateId;
  readonly commands: readonly string[];
  readonly slots: readonly CommitSlot[]; // remplis par cette étape
}
```

**Checkpoints calculés, jamais écrits.** Un module pur `src/story/chain.ts` rejoue :

```
checkpoint(0)   = storyRoot()
checkpoint(n)   = applyCommands(checkpoint(n-1), prelude(n).commands)
                  |> applyCommands(solution(n))     // messages de référence
```

Propriétés exigées (testées) :

- `checkpoint(n)` satisfait `storyMission(n+1).entry` ;
- changer une solution invalide automatiquement les checkpoints suivants (le test
  de chaîne casse) ;
- aucun checkpoint n'est persisté en dur : le cache mémoire est optionnel et
  recalculé au chargement.

### 3.3 Préconditions = résultat, jamais chemin

Une précondition est un prédicat sur `RepoState` :

| Famille | Exemple | Interdit |
| --- | --- | --- |
| branches présentes/absentes | `hasBranch('feature/billing')` | — |
| position de HEAD (worktree principal) | `headBranch === 'main'` | — |
| contenu d'une branche | `branchFile('main','src/app.ts') === "…v5"` | comparer un hash |
| fichier suivi / contenu disque | `workingFile('README.md') === …` | compter les commits |
| worktrees | `worktreePaths()` ensembliste | — |
| propreté | `isWorkingTreeClean()` | — |

**Interdits absolus** : `commitCount(state) === N`, `branchTip(...) === hash`,
`state.commits[h]` littéral, comparaison de parents sauf pour un merge attendu par
la mission elle-même.

Conséquence directe : le chemin alternatif 1.3 (1 commit au lieu de 2) reste
valide et ne déclenche **aucun** recalage ensuite, parce qu'aucune précondition ne
compte les commits.

### 3.4 Quand a lieu le recalage

Règle structurante (décision R2) : **le recalage n'existe qu'au rejeu.** En jeu
normal, Nova reste l'arbre réel du joueur.

```
JEU NORMAL (mission suivante de la chaîne)
  entry(mission) = diagnostic, pas une porte
    vrai  → partie normale
    faux  → la mission démarre quand même sur l'état réel
            journal += { kind: 'hors-chaine', missionId, détails }
            les commits hors slot restent dans l'arbre, étiquetés
            « commit hors histoire » (jamais supprimés)
  prelude appliqué avec gardes : il ne défait jamais un détour
  aucun recalage

REJEU (mission déjà terminée, réécriture ou copie isolée)
  entry(mission) = condition stricte
    vrai  → rejeu sur l'état du joueur
    faux  → recalage : nova := checkpoint(n-1), messages des slots réappliqués
            message non culpabilisant + journal += { kind: 'recalage' }

RESET-MISSION
  retour à l'état d'entrée capturé au démarrage (brouillon), pas au canonique
  le prelude n'est pas réappliqué

MIGRATION v1 → v2
  construction de checkpoint(0..n), jamais un « recalage »
```

Message exact de recalage (uniquement au rejeu) :

> « Ton dépôt a été remis au propre pour cette mission. Ton parcours reste
> visible dans le journal. »

Conséquences :

- un joueur qui explore (commit en trop, branche oubliée) ne perd **jamais** son
  travail en avançant dans l'histoire ;
- un diagnostic faux n'empêche pas de jouer : l'UI affiche un bandeau discret
  « Ton dépôt diffère de l'histoire de référence ; la mission reste jouable. »
  Les préconditions ne servent qu'à qualifier l'arbre (dans la chaîne ou non) ;
- l'arbre final contient ses détours ; l'écran final les distingue des commits de
  la chaîne (cf. §7) ;
- seule une demande explicite de rejeu peut réécrire la structure.

### 3.5 Procédure de recalage (rejeu uniquement)

1. Calculer `checkpoint(n-1)` (structure canonique) avec son `nextId` canonique.
2. **Règle `nextId`** : le rejeu repart de `checkpoint(n-1).nextId` ; chaque commit
   reconstruit consomme le compteur exactement comme la chaîne de référence. Les
   hashes sont donc déterministes et identiques à ceux du checkpoint canonique,
   indépendamment des détours passés du joueur.
3. Pour chaque **groupe de slots** de la chaîne 1..n-1, appliquer le message du
   joueur :
   - groupe de 1 slot → le message remplace celui du commit canonique ;
   - groupe de k slots (un commit joueur a couvert k slots) → les k commits
     canoniques sont **fusionnés en un seul** : snapshot = celui du dernier slot
     du groupe, message = celui du joueur. On ne crée jamais k commits jumeaux.
4. La table `slots` est ré-indexée après recalage (`slot → hash`), et le journal
   n'écrit que des **slots**, jamais des hashes.
5. Les commits hors slot (détours) ne sont pas reconstruits : ils restent au
   journal (`kind: 'detour'`, avec la liste des slots voisins, pas des hashes).

### 3.6 Association commits du joueur → slots

Association par **contenu**, pas par position :

1. Pour chaque commit du joueur produit pendant la mission, calculer
   `delta = diffTrees(parentSnapshot, commit.snapshot)` → `{ fichier: contenu | suppression }`.
2. Chaque slot déclare sa `signature` : ensemble de deltas attendus
   (fichier → contenu) **et** la branche attendue.
3. Un commit couvre un slot si `signature(slot) ⊆ delta(commit)` et si la branche
   du commit est celle du slot.
4. Parcours chronologique : le premier commit non attribué qui couvre le premier
   slot non couvert est associé. On continue tant que les slots suivants sont
   couverts par le même commit.

Trois cas prévus :

| Cas | Règle |
| --- | --- |
| 1 commit ↔ 1 slot | association directe, message du joueur dans le slot |
| 1 commit ↔ N slots (ex. 1.3 `add` + `commit -am`) | le commit **reste unique** et remplit les N slots ; le groupe est mémorisé (`slotGroups`) ; au recalage, les N commits canoniques sont fondus en un seul (cf. §3.5.3) |
| slot sans commit (chemin plus court) | le slot garde son message de référence ; sa structure canonique n'est reconstruite qu'au recalage |

Un commit qui ne couvre aucun slot est un **détour** : conservé dans l'arbre réel,
affiché comme « commit hors histoire », consigné au journal.

Limite assumée : deux commits distincts portant exactement le même delta et la
même branche sont ambigus → on associe dans l'ordre chronologique.

### 3.7 Prelude idempotent

Trois verrous, du plus sûr au plus fragile :

1. **Garde structurelle** (`when`) : si l'état montre déjà l'effet, on saute
   l'étape. Ex. prelude 2.3 : `when: state => !hasBranch(state, 'sauvetage')` ne
   suffit pas ; on garde plutôt `when: s => !commitExistsByMessage(s, 'exp: trace facturation')`.
2. **Ensemble persisté** `appliedPreludes: string[]` (ids), écrit après application
   réussie.
3. **Atomicité** : un prelude est appliqué en une transaction logique ; si une
   commande échoue, on ne marque rien et on recalcule le checkpoint d'entrée.

Le prelude ne s'applique **jamais** à un état qu'on cherche à canoniser : en jeu
normal il s'applique sur l'état réel du joueur avec ses gardes, sans défaire un
détour ; au rejeu il s'applique après recalage sur le checkpoint. Si une étape
n'a pas de garde satisfaite et que sa commande échouerait, elle est **sautée** et
la mission affiche « Le prelude de cette étape a été ignoré : ton dépôt contenait
déjà autre chose. » — jamais d'échec silencieux, jamais de réécriture forcée en
jeu normal.

### 3.8 Zéro hash en dur

Les slots sont résolus dynamiquement :

```ts
type SlotRef = { readonly slot: string };
type ResolvedCommand = string;   // 'git checkout a1b2c3d'

interface SolutionStep {
  readonly template: string;                  // 'git checkout {m1.1-c1}'
  readonly resolve?: readonly SlotRef[];      // slots à résoudre avant exécution
}
```

Résolution :

- slot canonique → hash du commit portant ce slot dans l'état courant ;
- slot « orphelin » (`m2.3-c1`) → hash du commit détaché créé dans la mission,
  retrouvé par signature de contenu (fichier `src/trace-billing.ts`) ;
- slot introuvable → la mission bascule en mode dégradé : la solution affichée est
  masquée et remplacée par l'indice générique, jamais par un hash faux.

Points à convertir (aujourd'hui calculés depuis le scénario canonique) :

- 2.1 : label de prédiction « Détaché sur le commit `<tip>` » ;
- 2.2 / 2.3 : tout `mainTip` / `featureTip` capturé en module ;
- 2.3 : `oldest.hash`, `orphan.hash` dans `objective`, `hints[2]`, `solution`,
  `steps[0].done`, `validate` ;
- 3.1 / 4.1 / 4.2 / 4.3 : comparaisons « main ne bouge pas » (cf. §3.9).

### 3.9 Comparaison « ne bouge pas »

Impossible avec un hash statique. Décision actée (§10, Q5) :

- `validate(state, ctx)` reçoit `ctx.entry: RepoState` (second paramètre
  optionnel, rétro-compatible : les fonctions à un argument restent valides) et
  compare `branchTip(state,'main')` à `branchTip(ctx.entry,'main')` ;
- repli possible : comparer le contenu de la branche (`snapshot`), plus permissif.

`Mission.validate` devient
`(state: RepoState, ctx?: ValidationContext) => ValidationResult`, sans `any`.
En Phase A, ce changement s'applique aux 12 missions actuelles **sans** Nova :
`ctx.entry` y vaut `mission.initialState`, ce qui rend les validations relatives
sans modifier leur sémantique.

`ValidationContext` (types) :

```ts
interface ValidationContext {
  readonly entry: RepoState;        // état au démarrage effectif (prelude inclus)
  readonly commands?: readonly string[];
}
```

---

## 4. Fiches par mission

Convention : `C0` = commit racine. Les hashes réels sont toujours résolus, jamais
écrits. `par` et `solution.length` restent égaux (test existant).

### Fiche 1.1 — Les 3 zones (`trois-zones`)

- **Préconditions** : `main` existe, HEAD sur `main`, working dir propre,
  `src/app.ts` = `"export const app = 'nova v1';"`, `src/login.ts` présent.
- **Prelude** : aucune commande Git. Deux `write` (non commités) par Yanis :
  `src/app.ts` → v2, `src/login.ts` → v2. (Aucun commit de prelude ici : la
  situation est un working dir sale.)
- **Slots** : `m1.1-c1` (commit `fix: bootstrap v2`, `src/app.ts`).
- **Solution** : `git add src/app.ts`, `git commit -m "fix: bootstrap v2"`.
- **Objectif** : commiter app seulement, laisser login modifié.
- **Sortie** : main +1 commit (`app` v2), `login` v2 sur le disque, HEAD main.
- **Textes** : `story`/`situation` remplacent a.txt/b.txt par app/login.
  `steps` et `validate` inchangés dans l'esprit ; `commitCount === 2` devient
  « exactement un commit de plus que `ctx.entry` ».
- **Prédiction** : inchangée (déclenchée par tout `git-commit`), options
  `src/app.ts` / `src/app.ts et src/login.ts` / `Aucun`.

### Fiche 1.2 — La photo ne bouge plus (`snapshot-fige`)

- **Préconditions** : `main` = checkpoint 1, `src/app.ts` = v2 commité,
  `src/login.ts` = v2 **modifié non commité**, HEAD main.
- **Prelude** : Léa commite `src/login.ts` (`fix: rafraîchir le jeton de session`)
  → slot `m1.2-p1`, working dir propre.
- **Slots** : `m1.2-c1` (`docs: figer le bootstrap v3`, `src/app.ts` v3).
- **Solution** : `edit src/app.ts "…v3"`, `git add src/app.ts`,
  `edit src/app.ts "…v4"`, `git commit -m "docs: figer le bootstrap v3"`.
- **Objectif** : le commit contient v3, le disque garde v4.
- **Sortie** : main +2 commits au total depuis la racine ; `src/app.ts` commité v3,
  disque v4.
- **Textes** : les valeurs `v1/v2/v3` deviennent `nova v2/v3/v4` ; indice 3 et
  prédiction alignés. `commitCount === 2` → delta de 1 vs entrée.
- **Note de continuité** : le prelude « nettoie » la saleté héritée de 1.1, ce qui
  rend la mission jouable sans changer son concept.

### Fiche 1.3 — Le piège du -am (`piege-am`)

- **Préconditions** : main = checkpoint 2, `src/app.ts` disque = v4 (non commité),
  `README.md` = version 1.
- **Prelude** : Léa commite `src/app.ts` v4 (`chore: livrer le bootstrap v4`) →
  `m1.3-p1` ; Samir écrit `README.md` v2 et crée `docs/adr-001.md` (untracked,
  non commités).
- **Slots** : `m1.3-c1` (`docs: readme v2`), `m1.3-c2` (`docs: adr-001`).
- **Solution** : `git commit -am "docs: readme v2"`, `git add docs/adr-001.md`,
  `git commit -m "docs: adr-001"`.
- **Chemin alternatif valide** : `git add docs/adr-001.md` puis
  `git commit -am "docs: tout"` → **1 seul commit couvrant les 2 slots**. Ce
  commit reste unique dans l'arbre et dans le recalage : les slots `m1.3-c1` et
  `m1.3-c2` sont remplis par le même commit, jamais dédoublés (R4).
- **Objectif / garde-fous** : par 3, prédiction déclenchée **uniquement** par un
  commit avec `-a` (`stageAllTracked`), réponse « non » pour l'ADR. Working dir
  propre à la fin.
- **Sortie** : main contient `README.md` v2 et `docs/adr-001.md`.
- **Textes** : `notes.txt` → `docs/adr-001.md` ; `isWorkingTreeClean` reste mais
  s'applique à un arbre déjà nettoyé par le prelude.
- **Point de continuité** : c'est **le** cas qui impose « préconditions sur le
  résultat ». Les deux chemins donnent des arbres de 1 ou 2 commits, contenus
  identiques.

### Fiche 2.1 — Le pointeur fantôme (`branche-pointeur`)

- **Préconditions** : main = checkpoint 3, HEAD main, pas de `spike/notes`.
- **Prelude** : aucune.
- **Slots** : `m2.1-c1` (`feat: notes internes`, `src/notes.ts`).
- **Solution** : `git branch spike/notes`, `git switch spike/notes`,
  `edit src/notes.ts "…"`, `git add`, `git commit -m "feat: notes internes"`.
- **Objectif** : main ne bouge pas, un seul commit sur la branche.
- **Sortie** : HEAD sur `spike/notes`, main inchangée.
- **Textes** : `experiment` → `spike/notes` (le nom `experiment` est réservé à
  3.3) ; `commitCount === 2` → « un commit de plus qu'à l'entrée » ; `mainTip`
  capturé → `ctx.entry.branches.main`.
- **Prédiction** : options main / spike/notes / « détaché sur `<slot m1.3-c1 ou
  m2.1-c1 résolu>` ». Le label doit être résolu à l'exécution.

### Fiche 2.2 — Qui avance ? (`qui-avance`)

- **Préconditions** : main = checkpoint 4, `spike/notes` existe, HEAD main,
  pas de `feature/billing`.
- **Prelude** : `git branch feature/billing`, `git switch feature/billing`
  (aucun commit).
- **Slots** : `m2.2-c1` (`feat: module facturation`, `src/billing.ts`) sur
  `feature/billing` ; `m2.2-c2` (`fix: configuration`, `src/config.ts`) sur `main`.
- **Solution** : commit billing sur la branche, `git switch main`, commit config.
- **Objectif** : divergence réelle, HEAD main, main sans `billing.ts`.
- **Sortie** : deux branches divergeantes, 2 commits.
- **Textes** : `feature.ts`/`main.ts` → `src/billing.ts`/`src/config.ts` ;
  `commitCount === 3` → delta 2 ; `initialTip` → entrée.
- **Prédiction** : inchangée sur le fond (« quelle étiquette bouge »), cibles
  `feature/billing` et `main`.

### Fiche 2.3 — Le commit perdu (`commit-perdu`) ⚠️

- **Préconditions** : main = checkpoint 5, `feature/billing` existe et contient
  `src/billing.ts`, HEAD main, working dir propre.
- **Prelude** : aucune.
- **Slots** : `m2.3-c1` = **commit orphelin créé par le joueur** (signature :
  ajout de `src/trace-billing.ts`, branche `undefined`). Aucun slot canonique
  écrit à l'avance.
- **Solution (template)** :
  1. `git checkout {m1.1-c1}` — le commit de démarrage, avant la facturation
  2. `edit src/trace-billing.ts "…"`, `git add`, `git commit -m "exp: trace facturation"`
  3. `git switch main`
  4. `git branch sauvetage {m2.3-c1}`
- **Objectif** : HEAD redevient détaché puis revient sur main, `sauvetage` pointe
  exactement le commit orphelin.
- **Sortie** : un commit hors de toute branche, protégé par `sauvetage`.
- **Textes** : `objective`, indice 3 et solution affichée utilisent le hash
  **réel du joueur** (résolu, jamais recopié) ; `oldest`/`orphan` calculés depuis
  l'état courant, pas depuis le scénario du module.
- **Risques de continuité** (explicites) :
  - le hash de l'orphelin change si le joueur a pris un détour avant ;
  - si le joueur crée **plusieurs** commits détachés, la mission ne choisit pas
    en silence : le terminal affiche
    « Plusieurs commits détachés ont été créés : `<message 1>` (`<hash 1>`),
    `<message 2>` (`<hash 2>`). Le sauvetage portera sur `<hash n>` (le plus
    récent). Les autres restent dans le journal. »
    et `validate` accepte `sauvetage` sur **n'importe lequel** de ces commits,
    conformément à l'esprit de la mission ;
  - `validate` doit accepter tout commit portant `src/trace-billing.ts` et non
    référencé, pas un hash ;
  - l'indice 3 et la solution affichée montrent le hash du commit choisi, résolu
    à l'affichage.

### Fiche 3.1 — Livrer sans cérémonie (`avance-rapide`)

- **Préconditions** : main = checkpoint 6, `feature/billing` existe, HEAD main,
  pas de `feature/export`.
- **Prelude** :
  1. `m3.1-p1` (Inès) : `git merge feature/billing` → merge commit (les branches
     ont divergé en 2.2), puis `git branch feature/export`.
  2. `m3.1-p2` (Inès) : `git switch feature/export`, commit `src/export.ts`,
     retour sur main.
- **Slots** : `m3.1-p1` (merge), `m3.1-p2` (commit export). **Aucun slot joueur** :
  le fast-forward ne crée pas de commit.
- **Solution** : `git merge feature/export`.
- **Objectif** : main avance sans commit.
- **Sortie** : `main === feature/export`, aucun commit créé par la mission.
- **Textes** : `feature` → `feature/export` ; `commitCount === 2` → « main pointe
  sur le commit déjà existant de `feature/export` » + `ctx.entry` ; `headFile`
  inchangé.

### Fiche 3.2 — Le point de convergence (`merge-commit`)

- **Préconditions** : main = checkpoint 7, `feature/billing` présente, HEAD main,
  pas de `feature/notify`.
- **Prelude** : `m3.2-p1` Inès crée `feature/notify` + commit `src/notify.ts` ;
  `m3.2-p2` Léa commite `src/config.ts` (retries 5) sur main.
- **Slots** : `m3.2-p1`, `m3.2-p2`, `m3.2-c1` (merge du joueur).
- **Solution** : `git merge feature/notify`.
- **Objectif** : merge commit à deux parents, notify + config conservés.
- **Sortie** : main = merge commit.
- **Textes** : `feature` → `feature/notify` ; validations déjà structurelles
  (`parents.length === 2`) et compatibles continuité.

### Fiche 3.3 — Le ménage (`menage-branches`) ⚠️

- **Préconditions** : main = checkpoint 8, HEAD main, `feature/login` absente,
  `experiment` absente.
- **Prelude** (le « collègue parti », joué par Inès) :
  - `m3.3-p1` : `git branch feature/login`, `git switch feature/login`,
    commit `src/login.ts`, `git switch main`, `git merge feature/login`
    (fast-forward).
  - `m3.3-p2` : `git branch experiment`, `git switch experiment`,
    commit `src/cache.ts` (`exp: cache mémoire`), `git switch main`.
- **Slots** : `m3.3-p1` (commit fusionné), `m3.3-p2` (commit de cache).
- **Solution** : `git branch -d feature/login`, `git merge experiment`,
  `git branch -d experiment` (le merge est un fast-forward).
- **Chemin alternatif valide** : `git branch -d feature/login`,
  `git branch -D experiment` après avoir constaté le refus de `-d`.
- **Garde-fou conservé** : `validateAttempt` exige d'avoir tapé
  `git branch -d experiment` (normalisation identique).
- **Sortie** :
  - chemin A (merge) : main pointe sur le commit `src/cache.ts` ;
  - chemin B (`-D`) : main inchangée, commit de cache **orphelin**.
- **⚠️ Point dur** : les deux chemins donnent des **contenus différents** pour
  main (`src/cache.ts` présent ou non). Toutes les préconditions des missions 4.x
  doivent accepter les deux. Aucun fichier de 4.x ne doit dépendre de
  `src/cache.ts`.
- **⚠️ Arbre final** : avec `-D`, un commit de l'histoire n'est plus atteignable.
  Décision actée (Q3) : l'écran final affiche le graphe atteignable **et** les
  commits abandonnés à 35 % d'opacité (`orphan` déjà supporté par `layout.ts`),
  avec une info-bulle « orphelin (supprimé par -D) ». Le sujet pédagogique
  (`-D` fait perdre l'accessibilité, pas les objets) reste visible.

### Fiche 4.1 — Le bug de prod (`hotfix-worktree`) ⚠️

- **Préconditions** : main = checkpoint 9 (contenu cache **optionnel**),
  HEAD main, working dir propre, `src/app.ts` = **v4** sur main (le prelude
  commite v5), pas de `~/gitquest-hotfix`.
- **Prelude** :
  - `m4.1-p1` Yanis, sur main : commit `src/app.ts` (`fix: bootstrap v5`).
    Garde : `when: state => branchFile(state,'main','src/app.ts') !== v5`.
  - `m4.1-p2` Yanis : `git branch feature/ui`, `git switch feature/ui`, commit
    `src/app.ts` (`feat: refonte du panneau`), puis `write src/app.ts` (WIP).
    Garde : `when: state => !hasBranch(state,'feature/ui')`.
    L'ordre est contraint : le bump de main doit être commité **avant** d'écrire
    le WIP, sinon le `switch` de fin de prelude est refusé.
- **Slots** : `m4.1-p1`, `m4.1-p2`, `m4.1-c1` (correctif hotfix du joueur).
- **Solution** : `git worktree add ../gitquest-hotfix -b hotfix main`,
  `cd`, `edit src/login.ts "corrigé"`, `git add`, `git commit`,
  `cd ../gitquest`.
- **Objectif** : prod corrigée, WIP intact, `switch main` reste impossible.
- **Sortie** : worktree `~/gitquest-hotfix` sur `hotfix` (+1 commit), HEAD
  principal `feature/ui`, WIP non commité.
- **Textes** : `bug.txt` → `src/login.ts` ; `forbidden: git stash` conservé ;
  `mainTip`/`featureTip` → entrée ; le garde-fou « switch bloqué » reste vérifié
  par un test dédié (`local-changes-would-be-overwritten`).

### Fiche 4.2 — Deux casquettes (`deux-worktrees`) ⚠️

- **Préconditions** : checkpoint 10, HEAD `feature/ui`, WIP `src/app.ts` présent,
  `~/gitquest-hotfix` existe.
- **Prelude** :
  1. `m4.2-p1` Yanis commite le WIP sur `feature/ui`
     (`wip: refonte UI (reprise)`), ce qui rend la bascule possible.
  2. `git switch main`, `git branch docs`, `write README.md` (WIP de doc).
- **Story (décision Q1, option A)** : la story de 4.2 (réécrite en ≤ 3 phrases)
  dit explicitement « Yanis a repris ta refonte : il a commité ton WIP sur
  `feature/ui`, rien n'est perdu, et tu peux maintenant passer sur main. » Le
  joueur ne découvre pas la reprise par surprise.
- **Slots** : `m4.2-p1` (commit de reprise), `m4.2-c1` (`docs: guide`).
- **Solution** : `git worktree add ../gitquest-docs docs`, `cd`,
  `edit docs/GUIDE.md "# Guide Nova"`, `git add`, `git commit`,
  `cd ../gitquest`.
- **Objectif** : GUIDE sur docs, WIP README intact, main inchangée.
- **Sortie** : 2 worktrees, HEAD main, README sale.
- **⚠️ Point dur** : la bascule 4.1 → 4.2 est **impossible sans traiter le WIP**
  de `feature/ui`. Décision actée (Q1) : option A, le coéquipier commite le WIP
  (voir Story ci-dessus). L'option B (rester sur `feature/ui`) est écartée.
- **Textes** : `mainTip` → entrée ; `GUIDE.md` → `docs/GUIDE.md` ; le contrôle
  `worktrees.main.workingDir['GUIDE.md']` reste identique.

### Fiche 4.3 — Ranger le chantier (`menage-worktree`)

- **Préconditions** : checkpoint 11, `~/gitquest-hotfix` existe, `hotfix` pointe
  sur un commit contenant `src/login.ts` = corrigé, HEAD main.
- **Prelude** : `m4.3-p1` Samir commite `README.md` sur main (livraison de la doc,
  nettoie le WIP) — décision Q9, c'est bien un commit de prelude, `par` reste 1 ;
  garde `when: !commitExistsByMessage('docs: readme final')`.
- **Slots** : `m4.3-p1`. Aucun commit joueur.
- **Solution** : `git worktree remove ../gitquest-hotfix`.
- **Objectif** : un seul worktree, branche `hotfix` conservée.
- **Sortie** : état final de l'histoire.
- **⚠️ Ce qu'il reste de 4.1/4.2** : les worktrees disparaissent (c'est le but),
  mais `hotfix` et `docs` restent visibles comme branches dans l'arbre final ;
  `docs` porte `docs/GUIDE.md`, `hotfix` porte le correctif. La statistique
  « worktrees créés » est donc tirée du **journal**, pas de l'état final.
- **Textes** : `mainTip`/`hotfixTip` → entrée ; `par` 1 inchangé.

---

## 5. Arbre final attendu

Chaîne de référence complète (variante A de 3.3, cache fusionné). `C0` = racine ;
numérotation = ordre de création (donc x dans `layoutGraph`). Ligne principale :

```
C0  [root]      Initial commit
C1  [m1.1-c1]   fix: bootstrap v2                      (main)
C2  [m1.2-p1]   fix: rafraîchir le jeton de session    (main, Léa)
C3  [m1.2-c1]   docs: figer le bootstrap v3            (main)
C4  [m1.3-p1]   chore: livrer le bootstrap v4          (main, Léa)
C5  [m1.3-c1]   docs: readme v2                        (main)
C6  [m1.3-c2]   docs: adr-001                          (main)
C9  [m2.2-c2]   fix: configuration                     (main)
C11 [m3.1-p1]   Merge branch 'feature/billing'         (main, Inès)
C12 [m3.1-p2]   feat: export CSV                       (main, Inès)
C14 [m3.2-p2]   fix: retries 5                         (main, Léa)
C15 [m3.2-c1]   Merge branch 'feature/notify'          (main, joueur)
C16 [m3.3-p1]   feat: formulaire de connexion          (main, Inès)
C17 [m3.3-p2]   exp: cache mémoire                     (main, Inès)
C18 [m4.1-p1]   fix: bootstrap v5                      (main, Yanis)
C23 [m4.3-p1]   docs: readme final                     (main, Samir)   ← tip
```

Branches latérales (parent indiqué) :

```
C7  [m2.1-c1]   feat: notes internes                   parent C6    ← spike/notes
C8  [m2.2-c1]   feat: module facturation               parent C6    ← feature/billing
C10 [m2.3-c1]   exp: trace facturation                 parent C1    ← sauvetage (orphelin sauvé)
C13 [m3.2-p1]   feat: notifications                    parent C12   ← feature/notify
C19 [m4.1-p2]   feat: refonte du panneau               parent C18   ← feature/ui
C20 [m4.1-c1]   fix: bug critique                      parent C18   ← hotfix
C21 [m4.2-p1]   wip: refonte UI (reprise)              parent C19   ← feature/ui (tip)
C22 [m4.2-c1]   docs: guide                            parent C18   ← docs
```

(`feature/export` pointe sur C12, identique à main après le fast-forward ;
`feature/login` et `experiment` sont supprimées en 3.3.)

Topologie simplifiée (lecture logique, pas un rendu de lanes) :

```
* C23 (main)              m4.3-p1
* C22 (docs)              m4.2-c1      ← docs
* C18 (main)              m4.1-p1
| * C21 (feature/ui)      m4.2-p1      ← feature/ui
| * C19 (feature/ui)      m4.1-p2
|/
| * C20 (hotfix)          m4.1-c1      ← hotfix
|/
* C17 (main)              m3.3-p2
* C16 (main)              m3.3-p1
* C15 (main)              m3.2-c1
|\
| * C13 (feature/notify)  m3.2-p1      ← feature/notify
* | C14 (main)            m3.2-p2
|/
* C12 (main)              m3.1-p2      ← feature/export
* C11 (main)              m3.1-p1
|\
| * C8  (feature/billing) m2.2-c1      ← feature/billing
* | C9  (main)            m2.2-c2
|/
* C6  (main)              m1.3-c2
* C5  (main)              m1.3-c1
* C4  (main)              m1.3-p1
* C3  (main)              m1.2-c1
* C2  (main)              m1.2-p1
* C1  (main)              m1.1-c1
* C0  (main)              root

hors ligne principale :
C7  ← spike/notes        m2.1-c1
C10 ← sauvetage          m2.3-c1      (créé en HEAD détaché sur C1)
```

Variante B de 3.3 (`-D experiment`) : `C16` (le login) reste le tip de main à
l'étape 3.3, `C17` (cache) devient orphelin et l'écran final l'affiche dans « commits
abandonnés ». La numérotation des commits suivants ne change pas (le compteur
`nextId` dépend du nombre de commits créés, pas de leur accessibilité).

Le layout réel reste `layoutGraph(state)` : x = ordre de création, lane =
`Commit.branch`. Cet ASCII est une vue logique, pas une vérité de rendu.

---

## 6. Persistance

### 6.1 Clé et schéma

Une seule clé atomique : **`gitquest.progress.v2`** (le story-repo et les étoiles
doivent être écrits ensemble, sinon on peut valider une mission sans son état).

```ts
interface PersistedProgressV2 {
  readonly version: 2;
  readonly completed: Readonly<Record<string, { readonly stars: 1 | 2 | 3 }>>;
  readonly lessonSlides: Readonly<Record<string, number>>;
  readonly story: PersistedStory;
}

interface PersistedStory {
  readonly nova: RepoState;                       // état courant du dépôt
  readonly missionId: string | null;              // mission active (déroulée)
  readonly activeMission: DraftRun | null;        // brouillon de la mission en cours
  readonly slots: Readonly<Record<string, SlotRecord>>;
  readonly slotGroups: readonly (readonly string[])[]; // slots couverts par un même commit
  readonly journal: readonly JournalEntry[];
  readonly appliedPreludes: readonly string[];
  readonly isolated: IsolatedRun | null;          // copie d'entraînement
}

/** Brouillon de mission : restauré au rechargement sans réappliquer le prelude. */
interface DraftRun {
  readonly missionId: string;
  readonly entry: RepoState;        // état d'entrée effectif (prelude inclus)
  readonly state: RepoState;        // dernier état après commande mutante
  readonly commandsUsed: number;    // commandes comptées
  readonly hintsUsed: number;
  readonly attempts: readonly string[];  // pour validateAttempt
  readonly updatedAt: number;       // horodatage local (hors moteur)
}

interface SlotRecord {
  readonly slotId: string;
  readonly missionId: string;
  readonly message: string;       // message du joueur (ou de référence)
  readonly commitHash: string;    // hash dans `nova`, ré-indexé après recalage
}

type JournalEntry =
  | { readonly kind: 'mission-complete'; readonly missionId: string; readonly stars: 1 | 2 | 3 }
  | { readonly kind: 'recalage'; readonly missionId: string; readonly reason: string }
  // jamais de hash : le commit est désigné par son slot ou par son message
  | { readonly kind: 'detour'; readonly missionId: string; readonly afterSlot: string; readonly message: string }
  | { readonly kind: 'hors-chaine'; readonly missionId: string; readonly details: string }
  | { readonly kind: 'prelude'; readonly stepId: string }
  | { readonly kind: 'migration'; readonly from: 1 };

interface IsolatedRun {
  readonly missionId: string;
  readonly state: RepoState;
  readonly slots: Readonly<Record<string, SlotRecord>>;
  readonly bestStars: 1 | 2 | 3;
  readonly draft: DraftRun | null;
}
```

**Non persistés** : checkpoints (recalculés au chargement depuis la chaîne),
pile d'undo, transcript, `lastEvents`.

**Écriture du brouillon (correction R5)** : après chaque commande qui modifie le
dépôt (`events.length > 0`) en mode mission, on écrit
`activeMission = { state, commandsUsed, hintsUsed, attempts, entry }` dans
`gitquest.progress.v2`. Une seule écriture par commande, groupée avec `slots` si
la commande a produit un commit. Au rechargement :

```
si activeMission !== null
    → restaurer state + compteurs ; ne PAS réappliquer le prelude ;
      ne PAS recalculer l'entrée ; repartir de activeMission.entry pour undo/reset
si activeMission === null
    → hydratation normale de nova
```

Le brouillon est effacé à la fin de la mission (succès ou abandon) et remplacé
par `nova` définitif.

### 6.2 Migration v1 → v2

```
lire gitquest.progress.v1
→ completed, lessonSlides conservés tels quels (étoiles = max)
→ firstUncompleted = première mission de missionSequence absente de completed
    si aucune    → nova = checkpoint(12)
    si la première → nova = root (checkpoint 0)
    sinon        → nova = checkpoint(index(firstUncompleted) - 1)
→ slots = {} ; slotGroups = [] ; activeMission = null
→ journal = [{kind:'migration', from:1}]
→ appliedPreludes = []   (les preludes seront réappliqués sur le checkpoint)
→ écrire v2, garder v1 en lecture seule (rollback), ne plus le réécrire
```

Cas particulier documenté : l'ancien id de 2.3 (`commit-perdu`) est conservé ;
aucune renumérotation de clé.

### 6.3 Articulation avec le sandbox

| Mode | Lecture | Écriture |
| --- | --- | --- |
| sandbox | `gitquest.sandbox.v1` | `gitquest.sandbox.v1` |
| mission (histoire) | `gitquest.progress.v2`.story | `gitquest.progress.v2` uniquement |
| copie isolée | état isolé en mémoire + `isolated` | jamais `nova` ni le sandbox |

- `startMission` reçoit l'**état d'entrée effectif** : l'état réel de Nova en jeu
  normal, le checkpoint recalé en rejeu — jamais `mission.initialState` tel quel.
- La sauvegarde/restauration actuelle (`sandboxBackup` en variable de module)
  reste inchangée : elle protège le bac à sable pendant une mission. On y ajoute
  seulement un marqueur `mode: 'story'` pour que `persist()` ne confonde pas les
  deux clés.
- Limite connue à conserver : `sandboxBackup` n'est pas persisté ; un rechargement
  en pleine mission perd le sandbox en mémoire mais pas `gitquest.sandbox.v1`
  (déjà écrit avant l'entrée en mission). Nova, elle, est persistée.

### 6.4 Rejeu, reset, undo

| Cas | Mode | Écriture Nova | Détail |
| --- | --- | --- | --- |
| jeu normal | — | oui, à chaque commande mutante | l'arbre réel est conservé, détours compris ; `entry` n'est qu'un diagnostic (R2) |
| mission en cours, rechargement | — | non (lecture du brouillon) | `activeMission` restauré tel quel ; prelude **non** réappliqué (R5) |
| dernière mission terminée, rejouée | réécriture | oui (remplace slots/messages) | `nova := checkpoint(n-1)`, `nextId` canonique (§3.5), prelude, partie libre |
| une mission suivante est terminée | copie isolée | non | bandeau « Entraînement : ton arbre Nova n'est pas modifié » ; étoiles comptées, `bestStars = max` conservé dans `isolated` |
| `reset-mission` | — | non (brouillon) | retour à `activeMission.entry` (prelude inclus) ; prelude non réappliqué |
| `undo` | — | non | pile vide à l'entrée ; jamais en deçà ; profondeur 50 existante ; en copie isolée, borne identique mais ne touche que la copie |
| après recalage (rejeu) | — | oui | pile vidée ; le hash→slot est ré-indexé ; le journal ne garde que des slots |

Bouton **« Reprendre l'histoire depuis ici »** (copie isolée) — feature flag
`story.replay.branchFromHere`, désactivé par défaut, activé par `?story=beta`
**et** mémorisé dans `localStorage` (`gitquest.flags.v1`) pour les visites
suivantes, désactivable depuis l'URL `?story=stable` :

- **efface** : `nova` (remplacée par l'état de la copie au moment du clic),
  les slots des missions suivantes, leurs entrées de journal, les préconditions
  de rejeu ;
- **conserve** : `completed` et les étoiles (aucune régression de progression),
  `lessonSlides`, le journal des missions passées, l'entrée `migration` ;
- **ajoute** : `journal += { kind: 'recalage', missionId: next, reason: 'reprise depuis ici' }`
  et `appliedPreludes` des missions suivantes repart à vide ;
- confirmation forte (saisie du numéro de mission) car l'action est destructive.

### 6.5 Isolation : sandbox et mini-démos n'ont aucun accès à Nova

Explicite et testé :

- `#/sandbox` continue d'utiliser son propre dépôt (`createSandboxState`) et sa
  clé `gitquest.sandbox.v1`. Il **ne lit ni n'écrit** `gitquest.progress.v2`, ne
  connaît ni `checkpoint`, ni slot, ni prelude, ni journal.
- Les mini-démos des cours (`DemoSlide`) construisent leur état localement avec
  `scenario()` / `execute` au chargement du module ; elles restent des dépôts
  jetables, sans lien avec Nova.
- Aucun composant partagé ne reçoit l'état Nova hors des routes d'histoire :
  `SandboxLayout` reçoit l'état par props (déjà le cas) ; `MissionScreen` est le
  seul écran qui branche le story-store.
- Conséquence : effacer la progression v2 ne casse ni le sandbox ni les cours ;
  vider le sandbox ne touche pas à Nova.

---

## 7. Écran final « Ton arbre Nova »

- Route `#/nova`, accessible depuis la carte **après** 4.3 (et depuis le dernier
  écran de mission).
- Graphe complet en lecture seule via `CommitGraph` + `layoutGraph(nova)` :
  - commits du joueur : couleur primaire, avatar `GQ` ;
  - commits de coéquipiers : couleur dédiée par auteur + initiales ;
  - **commits hors histoire** (détours du joueur) : bordure pointillée + info-bulle
    « hors histoire — ne fait pas partie de la chaîne » ; ils restent affichés
    (R2), sauf si un rejeu les a explicitement abandonnés ;
  - **orphelins** (accessibles par aucun ref, ex. 3.3 par `-D`) : opacité 35 % +
    info-bulle « orphelin (supprimé par -D) » ;
  - clic sur un commit → fiche (message, auteur, slot ou hors-histoire, mission
    d'origine, fichiers du delta).
- Cohérence des hashes : tout hash affiché est résolu depuis `nova` au rendu.
  Après un recalage, `nextId` repart de la valeur canonique (§3.5) et la table
  `slots` est ré-indexée ; un clic sur un commit, une info-bulle ou l'export
  `git log` désigne donc **toujours** le bon commit, jamais une valeur mémorisée.
  Le journal ne stocke que des slots, ce qui rend cette garantie testable.
- Statistiques : commits, branches, merges (`parents.length === 2`), étoiles, et
  worktrees affichés **séparément** (Q7) :
  - « créés » = comptage du journal (`worktree-added` historique) ;
  - « actifs » = `Object.keys(nova.worktrees).length`.
- Export :
  - PNG du graphe (canvas/SVG → `toBlob`, téléchargement local, aucun réseau) ;
  - texte `git log --oneline --graph` copiable, généré par le moteur sur l'état
    final (jamais une reproduction manuelle).
- Aucune exécution de commande : écran `readonly`.

---

## 8. Stratégie de tests

Base : les 197 tests existants restent la référence ; les nouveaux tests
s'ajoutent, aucun n'est supprimé sans justification.

### 8.1 Chaîne et checkpoints (nouveaux)

`src/story/__tests__/chain.test.ts`

1. Les 12 solutions de référence, rejouées depuis `root`, produisent l'arbre
   final attendu (§5) : mêmes messages, mêmes parents, mêmes contenus par branche,
   mêmes étiquettes.
2. `checkpoint(n)` satisfait `storyMission(n+1).entry`, pour n = 0..11.
3. Aucun slot orphelin : chaque slot déclaré est rempli exactement une fois.
4. Changer une solution (fixture) casse les checkpoints suivants → prouve que rien
   n'est écrit à la main.

### 8.2 Chemins alternatifs

`src/story/__tests__/alternatives.test.ts`

1. 1.3 en 2 commandes (`git add docs/adr-001.md` puis `git commit -am`) :
   mission validée, puis **entrée 2.1 satisfaite → aucun recalage**, journal sans
   `recalage`.
2. 1.3 en 3 commandes (référence) : idem.
3. 3.3 par merge puis `-d`, et 3.3 par `-D` : les deux valident 3.3 **et**
   satisfont l'entrée de 4.1.
4. 3.3 par `-D` : `src/cache.ts` absent de main, entrée 4.1 toujours vraie.
5. 1.3 alternatif : après la mission, `nova` contient **un seul** commit pour les
   slots `m1.3-c1` et `m1.3-c2`, et `slotGroups` contient le groupe correspondant.
   Un recalage forcé ensuite reconstruit **un seul** commit, pas deux (R4).

### 8.3 Recalage et slots

`src/story/__tests__/recalage.test.ts`

1. État divergent au rejeu (branche en trop, commit en trop) → recalage, `nova` =
   checkpoint(n-1), journal contient `recalage`.
2. Messages du joueur conservés : jouer 1.1 avec un message personnalisé, rejouer
   une mission terminée, vérifier que le commit du slot `m1.1-c1` porte toujours le
   message du joueur.
3. **Détour sans rejeu** : un commit hors slot pris en jeu normal reste dans
   `nova`, n'est pas supprimé, figure au journal (`detour`) et est marqué
   « hors histoire » ; aucun `recalage` n'est émis (R2).
4. **Détour au rejeu** : le même détour disparaît de l'arbre reconstruit mais
   reste au journal (`detour`, désigné par `afterSlot` + message, jamais un hash).
5. Commit couvrant 2 slots (1.3 alternatif) → un seul commit, deux slots remplis,
   `slotGroups` cohérent.
6. **`nextId` après recalage** : le recalage repart de la valeur canonique du
   checkpoint ; deux recalages successifs produisent les mêmes hashes.
7. **2.3 multi-détachés** : deux commits créés en HEAD détaché → le terminal
   affiche les deux hashes et les messages, `sauvetage` est accepté sur l'un ou
   l'autre, et l'indice 3 affiche le hash choisi.

### 8.4 Zéro hash en dur

`src/story/__tests__/no-hardcoded-hash.test.ts`

1. Balayage du contenu : aucune regex `\b[0-9a-f]{7}\b` dans
   `src/content/**` (hors fixtures de test), ni dans `hints`, `objective`,
   `solution`.
2. 2.3 jouée avec des messages personnalisés : `objective`, indice 3 et solution
   affichée contiennent le hash réel de l'état du joueur.
3. 2.3 jouée avec un détour préalable : `git branch sauvetage <hash>` résolu passe.
4. 2.1 / 2.2 / 2.3 : les prédictions ciblant un commit utilisent un hash résolu
   depuis l'état courant.
5. **Hash affiché après recalage** : rejouer 1.2 après un détour, puis vérifier
   que le hash affiché pour `m1.2-c1` — fiche de commit, info-bulle du graphe,
   export `git log --oneline --graph`, et écran final `#/nova` — désigne bien le
   commit portant ce slot dans `nova`, et non un hash du journal ou de l'ancienne
   partie. Vérifier aussi que `git checkout <hash>` (utilisé en 2.3) tombe sur ce
   commit.

### 8.5 Rejeu, copie isolée, prelude, undo

`src/story/__tests__/session.test.ts`

1. Rejouer la dernière mission : `nova` réécrite, slots mis à jour, étoiles max.
2. Rejouer une mission suivie d'une autre terminée : `isolated` non nul, `nova`
   **strictement identique** (deep equal avant/après), aucun appel d'écriture sur
   la clé v2 (spy sur `StorageAdapter`).
3. Copie isolée : étoiles comptées, `bestStars` = max(ancien, nouveau).
4. `reset-mission` ×2 : retour au même `activeMission.entry`, prelude **jamais**
   réappliqué (ni à la 1re, ni à la 2e réinitialisation), état identique aux deux
   retours.
5. Reload (nouveau store hydraté) : prelude non réappliqué.
6. Rejeu complet d'une mission terminée : prelude non réappliqué.
7. `undo` : impossible de descendre sous l'état d'entrée ; après recalage, pile
   vide.
8. Migration v1 → v2 : fixture `{version:1, completed:{...3 missions}, lessonSlides}`
   → étoiles conservées, `nova` = checkpoint 2, `journal` contient `migration`.
9. **Brouillon de mission** : exécuter deux commandes mutantes en 2.1, recharger
   le store → `activeMission.state` restauré, `commandsUsed`, `hintsUsed` et
   `attempts` conservés, prelude **non** réappliqué, `commandsUsed` non remis à 0.
10. **Brouillon effacé** : terminer la mission → `activeMission === null`.
11. **Brouillon non écrit** : une commande non mutante (`git status`) ou une
    commande en erreur ne déclenche aucune écriture de `activeMission` (spy sur
    `StorageAdapter`).

### 8.6 Contenu préservé (tests existants adaptés, pas supprimés)

- 1.3 : prédiction déclenchée **seulement** par `-a` ; alternative 2 commandes.
- 3.3 : `validateAttempt` exige `git branch -d experiment`.
- 4.1 : `git switch main` refusé (`local-changes-would-be-overwritten`) et
  `git stash` interdit.
- `par === solution.length`, 3 indices, story ≤ 3 phrases, `steps` 2–4 : test
  générique existant conservé.
- `initialState` ne valide pas la mission : il reste exposé, mais **calculé**
  depuis la chaîne (`storyCheckpoint(index-1)`) ; le test vérifie l'égalité avec
  le checkpoint canonique et la non-réussite de la mission (Q10).

### 8.7 Isolation Nova / sandbox / cours

`src/story/__tests__/isolation.test.ts`

1. Exécuter des commandes dans le sandbox puis hydrater l'histoire : Nova est
   inchangée (`gitquest.progress.v2` non relu par le sandbox).
2. Terminer une mission puis vider le sandbox : Nova et ses slots sont intacts.
3. Les `DemoSlide` des 4 leçons produisent les mêmes états qu'avant : leur
   `initialState` ne dépend d'aucun module `src/story/` (test d'import/absence de
   dépendance).
4. `SandboxScreen` ne monte jamais le story-store (test de rendu : aucun accès à
   `gitquest.progress.v2`).

---

## 9. Risques et alternatives

### 9.1 Alternatives écartées

| Option | Avantages | Coûts | Verdict |
| --- | --- | --- | --- |
| **Persistance totale** (sauver chaque checkpoint joué) | aucun rejeu au chargement, reprise instantanée | 12 × `RepoState` complets dans IndexedDB, migration lourde, risque de désynchronisation avec la chaîne | écartée ; les checkpoints sont recalculés |
| **Chaîne canonique pure** (le joueur ne fait qu'exécuter la référence, aucun message libre) | simplicité maximale, zéro recalage, arbre toujours connu | perd l'histoire personnelle, contredit l'objectif produit, rend les chemins alternatifs inutiles | écartée |
| **Hybride recalage doux** (retenue) | arbre stable + narration du joueur, chemins alternatifs tolérés | complexité slots/préconditions, deux sources de vérité (état + slots) | retenue |

### 9.2 Risques principaux

1. **Variantes de contenu divergentes** (3.3 merge vs `-D`) : chaque précondition
   aval doit être écrite en « union de variantes », sinon recalage injuste.
   Mitigation : tests 8.2.3/4 + fixtures des deux états.
2. **WIP non commité entre deux missions** (1.2→1.3, 4.1→4.2) : le prelude doit
   absorber la saleté, ce qui modifie la narration. Décision actée (Q1) : Yanis
   commite le WIP et la story de 4.2 le dit ; message de fin de mission qui
   annonce la reprise.
3. **Association par contenu ambiguë** : deux commits identiques sur la même
   branche. Mitigation : ordre chronologique documenté + test.
4. **Auteur de prelude** : nécessite une extension moteur (§9.3 ci-dessous) ;
   sans elle, impossible de distinguer joueur/coéquipier dans le graphe.
5. **Hash instable** : tout détour décale les hashes en jeu normal, donc tout hash
   affiché doit être résolu à l'affichage ; au rejeu, `nextId` repart du canonique
   et la table slots est ré-indexée (§3.5).
6. **Migration** : un utilisateur ayant terminé 3 missions doit retrouver ses
   étoiles et un Nova cohérent ; risque de « saut » de mission si la première non
   terminée n'est pas contiguë (ex. mission 2.1 terminée sans 1.3). Mitigation :
   prendre la **première** mission non terminée dans l'ordre, pas la plus avancée.
7. **Poids du `RepoState`** : ~12 commits × 12 fichiers = petit, mais 12 checkpoints
   recalculés à chaque hydratation ; mitigation : cache mémoire, calcul paresseux.

### 9.3 Extension moteur nécessaire : auteur de prelude

Le moteur ne connaît qu'un auteur. Deux options :

- **A (retenue)** : module pur `src/story/actor.ts` —
  `stampAuthor(state, hash, author)` réécrit uniquement `author` du commit créé
  par l'étape. Aucun impact sur les commandes, aucune dépendance React.
- B : option `--author` non documentée dans `git commit` → contredit la fidélité
  GitQuest/Git et pollue le parseur.

### 9.4 Ampleur du chantier (recomptée)

Estimation : **36 à 42 fichiers distincts**, **7 nouveaux fichiers de test**,
**~36 nouveaux cas**. Le chantier est découpé en **deux phases livrables
séparément**, chacune vérifiée (typecheck + tests + build si UI).

#### Phase A — socle, sans Nova (les 197 tests restent verts)

Objectif : rendre le moteur de contenu *prêt* pour la continuité, sans changer
une seule mission.

| Zone | Fichiers | Nature |
| --- | --- | --- |
| `src/story/` | `types.ts`, `preconditions.ts`, `checkpoints.ts`, `slots.ts`, `actor.ts`, `journal.ts` (6) | nouveaux, purs |
| contenu | `src/content/types.ts` (`ValidationContext`, `initialState` calculé) + **12** fichiers de mission (signature `validate(state, ctx)`, comparaisons relatives) (13) | modifiés |
| moteur | `src/engine/validate.ts` (helpers de delta / comptage relatif) (1) | modifié |
| stockage | `src/store/useProgressStore.ts` (v2 + migration) (1) | modifié |
| tests | `preconditions.test.ts`, `checkpoints.test.ts`, `actor.test.ts`, `progress-migration.test.ts` (4) + `missions.test.ts` adapté | nouveaux/modifié |

Total Phase A : **~24 fichiers**, 4 nouveaux fichiers de test, ~12 cas.
`mission.initialState` conserve sa valeur (calculée depuis la chaîne) ; les 12
missions actuelles gardent leur `par`, leurs indices et leurs prédictions.

#### Phase B — contenu Nova et expérience

| Zone | Fichiers | Nature |
| --- | --- | --- |
| `src/story/` | `prelude.ts`, `recalage.ts`, `session.ts`, `draft.ts`, `groups.ts` (5) | nouveaux |
| contenu | 4 `preludes.ts` (un par chapitre), 12 missions réécrites (Nova, fichiers réels, slots), `content/index.ts` (story wiring) (17) | modifiés/nouveaux |
| stores | `useStoryStore.ts` (nouveau), `useRepoStore.ts`, `useProgressStore.ts` (branchement story) (3) | mixte |
| écrans | `MissionScreen.tsx`, `NovaScreen.tsx`, `HomeScreen.tsx`, `MissionComplete.tsx`, export du graphe (5) | mixte |
| docs | `ARCHITECTURE.md` (1) | modifié |
| tests | `alternatives.test.ts`, `recalage.test.ts`, `no-hardcoded-hash.test.ts`, `session.test.ts`, `isolation.test.ts`, `nova-screen.test.tsx` (6) | nouveaux |

Total Phase B : **~31 fichiers** (dont les 12 missions déjà comptées), 6 nouveaux
fichiers de test, ~24 cas. Aucune migration supplémentaire : la clé v2 est posée
en Phase A.

#### Découpage en commits

**Phase A**

1. `story: types, ValidationContext et préconditions pures` + tests.
2. `story: checkpoints calculés et résolution de slots (types)` + tests.
3. `story: auteur de coéquipier (stampAuthor pur)` + tests.
4. `content: validations relatives sur les 12 missions actuelles` — les 197
   tests restent verts.
5. `storage: progression v2 et migration v1 → v2` + tests.

**Phase B**

6. `story: prelude idempotent, groupes de slots et recalage (rejeu)` + tests.
7. `story: brouillon de mission persisté et restauré` + tests.
8. `content(1.x-2.x): Nova, fichiers réels, slots et hash dynamique`.
9. `content(3.x-4.x): variantes 3.3, WIP 4.1→4.2, arbre final`.
10. `store: mode histoire, détours hors chaîne, copie isolée`.
11. `screen: Ton arbre Nova, statistiques, orphelins et export`.
12. `story: « Reprendre depuis ici » derrière ?story=beta`.
13. `docs: ARCHITECTURE + STORY-REPO à jour`.

---

## 10. Décisions actées

| # | Question | Décision | Impact |
| --- | --- | --- | --- |
| Q1 | 4.1 → 4.2 et le WIP | **Option A** : Yanis commite le WIP de `feature/ui` ; la story de 4.2 le dit explicitement | Fiche 4.2, §9.2 |
| Q2 | Renommages de branches | **Validés** : `spike/notes`, `feature/billing`, `feature/export`, `feature/notify` | Fiches 2.1–3.2, §5 |
| Q3 | 3.3 et `-D` | Commits abandonnés **affichés à 35 %**, info-bulle « orphelin (supprimé par -D) » | Fiche 3.3, §7 |
| Q4 | Commit couvrant 2 slots | **Un seul commit** remplit les 2 slots, jamais dédoublé, y compris au recalage (`slotGroups`) | §3.5, §3.6, §6.1, §8.2 |
| Q5 | Signature de `validate` | `validate(state, ctx)` avec `ctx.entry: RepoState` | §3.9, Phase A |
| Q6 | Feature flag « Reprendre depuis ici » | `?story=beta`, mémorisé dans `localStorage` (`gitquest.flags.v1`) | §6.4 |
| Q7 | Stat worktrees | **Deux** compteurs : « créés » (journal) et « actifs » (état) | §7 |
| Q8 | Hash | On garde `hashFor(nextId)` ; `nextId` repart du canonique au recalage | §3.5, §8.3 |
| Q9 | README de 4.3 | Commit de **prelude** (Samir), `par` inchangé | Fiche 4.3 |
| Q10 | `initialState` | **Conservé** comme valeur calculée depuis la chaîne | §8.6, Phase A |

### Questions résiduelles (non bloquantes)

1. **Formulation exacte des info-bulles** (« hors histoire », « orphelin
   (supprimé par -D) ») : à valider en UI, sans impact sur le modèle.
2. **Durée de conservation d'un brouillon** : on garde le dernier
   `activeMission` indéfiniment. Faut-il l'expirer (ex. 30 jours) ? Proposition :
   non pour l'instant, un brouillon n'a pas de coût significatif.
3. **Comptage des détours** dans les statistiques de l'écran final : proposé
   « hors histoire : N » à côté de « commits », à confirmer visuellement.

---

## 11. Journal des révisions

| Révision | Date | Contenu |
| --- | --- | --- |
| v1 | 2026-10-30 | Conception initiale (12 fiches, modèle hybride, persistance v2, tests, risques). |
| v2 | 2026-10-30 | Décisions Q1–Q10 ; recalage limité au rejeu ; `nextId` et slots ; groupes de slots ; brouillon de mission ; corrections 4.1 et 2.3 ; isolation sandbox/cours ; estimation et découpage Phase A/B. |
