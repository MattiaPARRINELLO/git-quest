# Vérification face à un vrai Git

Scénarios à rejouer dans un terminal réel pour comparer GitQuest et Git.
Chaque bloc est autonome, utilise un dossier temporaire et ne touche à rien d'existant.

Prérequis : `git` ≥ 2.34 (messages de worktree modernes), `bash`.
Notation : `$` = commande tapée, le reste = sortie attendue (extrait significatif).

---

## 1. Modifications locales au changement de branche

### 1a. Modifications emportées (fichier identique entre les commits)

```bash
$ cd "$(mktemp -d)" && git init -q -b main && git config user.email q@q && git config user.name q
$ echo base > commun.txt && echo main > main.txt
$ git add . && git commit -qm "Initial commit"
$ git branch feature
$ git switch -q feature
$ echo feature > feature.txt && git add . && git commit -qm "feat"
$ git switch -q main
$ echo local > commun.txt
$ git switch feature
M	commun.txt
Switched to branch 'feature'
$ cat commun.txt
local
```

Point à comparer : la modification de `commun.txt` survit au switch, et `feature.txt` apparaît.

### 1b. Modifications refusées (fichier modifié des deux côtés)

```bash
$ git switch -q main
$ echo version-main > feature.txt && git commit -qam "main change feature.txt"
$ echo local > feature.txt
$ git switch feature
error: Your local changes to the following files would be overwritten by checkout:
	feature.txt
Please commit your changes or stash them before you switch branches.
Aborting
$ echo $?
1
```

GitQuest : `git switch feature` → erreur `local-changes-would-be-overwritten`, même liste,
état inchangé.

---

## 2. Worktree : branche déjà checkout ailleurs, suppression de branche

```bash
$ cd "$(mktemp -d)" && git init -q -b main repo && cd repo
$ git config user.email q@q && git config user.name q
$ echo a > a.txt && git add . && git commit -qm "Initial"
$ git branch feature
$ git worktree add -q ../repo-feature feature
$ git switch feature
fatal: 'feature' is already checked out at '/tmp/.../repo-feature'
$ git worktree add ../autre feature
fatal: 'feature' is already checked out at '/tmp/.../repo-feature'
$ git branch -d feature
error: Cannot delete branch 'feature' checked out at '/tmp/.../repo-feature'
$ git worktree list
/tmp/.../repo           <sha> [main]
/tmp/.../repo-feature   <sha> [feature]
```

À comparer : chemins complets dans Git, chemins `~/...` dans GitQuest ; le reste des
messages doit être identique.

---

## 3. Fusion 3-way : unique, identique, conflit

### 3a. Modifications sur des fichiers différents

```bash
$ cd "$(mktemp -d)" && git init -q -b main && git config user.email q@q && git config user.name q
$ echo base > base.txt && echo app > app.txt && git add . && git commit -qm "Initial"
$ git switch -qc feature
$ echo feature > feature.txt && git add . && git commit -qm "feat"
$ git switch -q main
$ echo main > app.txt && git commit -qam "main"
$ git merge feature
Merge made by the 'ort' strategy.
 feature.txt | 1 +
 1 file changed, 1 insertion(+)
$ cat app.txt feature.txt
main
feature
$ git log --oneline --graph --max-count=1
*   <sha> Merge branch 'feature'
```

GitQuest : un merge commit à deux parents, `app.txt` = `main`, `feature.txt` = `feature`.

### 3b. Modification identique des deux côtés

```bash
$ git switch -qc feature2
$ echo same > base.txt && git commit -qam "feature2 same"
$ git switch -q main
$ echo same > base.txt && git commit -qam "main same"
$ git merge feature2
Merge made by the 'ort' strategy.
```

Aucun conflit. GitQuest fusionne aussi sans conflit.

### 3c. Modifications différentes → conflit

```bash
$ git switch -qc feature3
$ echo feature > base.txt && git commit -qam "feature3"
$ git switch -q main
$ echo main > base.txt && git commit -qam "main"
$ git merge feature3
Auto-merging base.txt
CONFLICT (content): Merge conflict in base.txt
Automatic merge failed; fix conflicts and then commit the result.
$ echo $?
1
```

GitQuest produit les mêmes lignes, écrit les marqueurs dans `base.txt`, laisse
`git status` afficher `Unmerged paths`, puis conclut la fusion après
`git add base.txt` et `git commit` (ou `git merge --continue`). `git merge --abort`
restaure l'état d'avant, sans commit partiel.

### 3d. Résolution de conflit, puis fusion

```bash
$ cat base.txt
<<<<<<< HEAD
main
=======
feature3
>>>>>>> feature3
$ echo "main + feature3" > base.txt
$ git add base.txt
$ git commit -m "merge: base"
[main <sha>] merge: base
$ git log --oneline --graph
*   <sha> merge: base
|\
| * <sha3> feature3
* | <sha2> main
|/
* <sha1> Initial
$ git status
On branch main
nothing to commit, working tree clean
```

GitQuest : commit à deux parents, contenu `main + feature3`, plus aucun conflit
dans le worktree.

---

## 4. Fast-forward vs « Already up to date »

```bash
$ cd "$(mktemp -d)" && git init -q -b main && git config user.email q@q && git config user.name q
$ echo a > a.txt && git add . && git commit -qm "Initial"
$ git branch feature
$ git switch -q feature
$ echo b > b.txt && git add . && git commit -qm "feat"
$ git switch -q main
$ git merge feature
Updating <sha1>..<sha2>
Fast-forward
 b.txt | 1 +
 1 file changed, 1 insertion(+)
$ git merge feature
Already up to date.
$ git log --oneline --graph
* <sha2> feat
* <sha1> Initial
```

GitQuest : aucun commit supplémentaire en fast-forward, puis `Already up to date.` et
état strictement identique.

---

## 4b. `git diff` : disque, index, HEAD

```bash
$ cd "$(mktemp -d)" && git init -q -b main && git config user.email q@q && git config user.name q
$ printf 'v1\n' > f.txt && git add . && git commit -qm "Initial"
$ printf 'v2\n' > f.txt
$ git diff
diff --git a/f.txt b/f.txt
index 944a466..974a4b2 100644
--- a/f.txt
+++ b/f.txt
@@ -1 +1 @@
-v1
+v2
$ git add f.txt && git diff
$ git diff --staged
diff --git a/f.txt b/f.txt
...
-v1
+v2
$ printf 'v3\n' > f.txt && git diff HEAD
...
-v1
+v3
```

GitQuest produit les mêmes en-têtes, hunks et lignes préfixées `-`/`+`, avec les
mêmes trois lignes de contexte. Les hashes de l'en-tête `index` sont cosmétiques.

---

## 5. HEAD détaché, commit orphelin, worktree sale

### 5a. Commit orphelin

```bash
$ cd "$(mktemp -d)" && git init -q -b main && git config user.email q@q && git config user.name q
$ echo a > a.txt && git add . && git commit -qm "Initial"
$ git checkout -q HEAD
$ echo exp > a.txt && git commit -qam "expérience"
$ git switch -q main
$ git branch --contains $(git rev-parse HEAD@{1}) 2>/dev/null
# aucune branche ne contient le commit d'expérience
$ git log --oneline --all
<sha-initial> Initial
```

GitQuest : le commit reste dans `commits` mais n'est référencé par aucune branche ;
`git log` ne le montre plus depuis `main`.

### 5b. Worktree avec modifications → refus sans --force

```bash
$ cd "$(mktemp -d)" && git init -q -b main repo && cd repo
$ git config user.email q@q && git config user.name q
$ echo a > a.txt && git add . && git commit -qm "Initial"
$ git branch feature
$ git worktree add -q ../repo-feature feature
$ echo brouillon > ../repo-feature/brouillon.txt
$ git worktree remove ../repo-feature
fatal: '/tmp/.../repo-feature' has local modifications
(use --force to override)
$ git worktree remove --force ../repo-feature
$ git worktree list
/tmp/.../repo <sha> [main]
```

GitQuest : `worktree-has-local-modifications` puis suppression avec `--force` ; la
branche `feature` survit dans les deux cas.

---

## Écarts attendus pendant la comparaison

| Point | Git réel | GitQuest |
| --- | --- | --- |
| Hashes | SHA-1/SHA-256 | 7 caractères déterministes |
| Chemins | absolus | `~/gitquest`, `~/gitquest-…` |
| Auteur / date | config utilisateur, horloge réelle | auteur fixe, horloge logique |
| `git log --graph` | art ASCII multi-lanes | lignes `*` simples + graphe SVG (Phase 2) |
| Conflits | résolus à la main | refus explicite (hors MVP) |
| `git worktree remove` du worktree courant | message dépend de la plateforme | `fatal: '…' is the working tree you are in` |
| `git init` sur dépôt existant | réinitialise les réglages | succès sans changement |

Si un scénario diverge **ailleurs**, c'est un bug du moteur : ouvrir une issue avec les
commandes rejouées et la sortie des deux côtés.
