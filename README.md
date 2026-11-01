<p align="center">
  <img src="docs/screenshots/banner.svg" alt="GitQuest — apprendre Git par la pratique" width="100%">
</p>

<h1 align="center">GitQuest</h1>

<p align="center">
  <strong>Apprends Git sans souffrir.</strong><br>
  Un jeu gratuit, dans ton navigateur ou sur Android, où chaque commande devient une image.
</p>

<p align="center">
  <a href="https://mattiaparrinello.github.io/git-quest/"><img alt="Jouer maintenant" src="https://img.shields.io/badge/▶_Jouer_maintenant-en_ligne-ff7a45?style=for-the-badge"></a>
  <a href="https://github.com/MattiaPARRINELLO/git-quest/releases/latest"><img alt="Télécharger l'APK Android" src="https://img.shields.io/badge/Android-APK_4_Mo-3DDC84?style=for-the-badge&amp;logo=android&amp;logoColor=white"></a>
</p>

<p align="center">
  <img alt="6 chapitres" src="https://img.shields.io/badge/parcours-6_chapitres-0b0d10">
  <img alt="19 missions" src="https://img.shields.io/badge/missions-19-0b0d10">
  <img alt="Gratuit" src="https://img.shields.io/badge/prix-gratuit-0b0d10">
  <img alt="Sans compte" src="https://img.shields.io/badge/compte-aucun-0b0d10">
  <img alt="Hors ligne" src="https://img.shields.io/badge/PWA-hors_ligne-5A0FC8">
</p>

<p align="center">
  <img src="docs/screenshots/demo.gif" alt="Créer une branche, commiter, revenir sur main et fusionner — le graphe se dessine" width="820">
</p>

<p align="center">
  <sub>Tu tapes une vraie commande Git ; le graphe se dessine sous tes yeux.</sub>
</p>

---

## Git, ce n'est pas difficile. C'est invisible.

Tout le monde connaît `git commit`, `git merge`, `git pull`. Et presque personne ne sait
ce qui se passe vraiment quand on les tape. Alors on apprend des commandes par cœur, on
copie celles du collègue, et on a peur de casser quelque chose.

GitQuest rend ce mécanisme **visible**.

- Tu tapes `git switch -c feature` → une nouvelle branche apparaît, et tu comprends
  qu'une branche n'est qu'une étiquette qui bouge.
- Tu commites → le fichier passe du disque à l'index, puis devient un point dans le
  graphe. Tu vois enfin les trois zones.
- Tu merges → la ligne se dessine, avec ou sans commit de fusion. Plus de schéma abstrait
  à imaginer.
- Tu fais une erreur → Git répond comme il répondrait vraiment (« local changes would be
  overwritten », « fetch first »…), et tu comprends pourquoi.

Pas de vidéo à regarder passivement. Pas de quiz à cocher. Tu joues, tu manipules, tu
retiens.

> **En clair :** GitQuest, c'est un vrai dépôt Git en miniature dans ton navigateur, avec
> un terminal, un graphe animé et un parcours guidé pour apprendre pas à pas.

---

## C'est fait pour qui ?

- **Tu débutes avec Git** et tu ne sais jamais sur quelle branche tu es.
- **Tu l'utilises tous les jours** mais tu voudrais comprendre les worktrees, les merges
  et les conflits.
- **Tu formes quelqu'un** et tu cherches un support pratique, sans installation.
- **Tu aimes comprendre** comment les outils marchent, sous le capot.

Aucun prérequis : pas de compte, pas de dépôt à créer, pas de risque de casser quoi que ce
soit. Le pire qui puisse arriver, c'est de recommencer une mission.

---

## Comment ça se passe

1. **Un cours court** (3 à 5 min) explique un concept avec un schéma animé et une vraie
   démonstration — pas une capture d'écran, de vraies commandes rejouées.
2. **Trois ou quatre missions** mettent ce concept en pratique dans une situation
   d'équipe réaliste : un bug en prod, un collègue qui pousse en même temps, un commit
   perdu.
3. **Tu tapes les commandes** dans le terminal. Le graphe, HEAD, l'index et les worktrees
   réagissent immédiatement, avec une explication en français.
4. **Tu es noté sur l'efficacité** : une solution de référence, des indices si tu bloques,
   et jusqu'à 3 étoiles selon le nombre de commandes utilisées.

Deux ou trois heures suffisent pour faire tout le parcours. Et si tu veux juste tester
sans leçon, le **bac à sable** est toujours ouvert : un terminal Git libre, avec le même
graphe.

---

## Aperçu

<table>
  <tr>
    <td width="50%">
      <img src="docs/screenshots/home.png" alt="Carte de progression, XP, niveaux et badges">
      <p align="center"><sub><b>La carte</b> — tu vois où tu en es, chapitre par chapitre.</sub></p>
    </td>
    <td width="50%">
      <img src="docs/screenshots/lesson.png" alt="Cours avec diagramme fast-forward et merge commit">
      <p align="center"><sub><b>Les cours</b> — un concept, un schéma, une démo jouée.</sub></p>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <img src="docs/screenshots/mission.png" alt="Mission avec objectif, checklist, terminal, graphe et pipeline">
      <p align="center"><sub><b>Les missions</b> — une vraie situation, des indices, des étoiles.</sub></p>
    </td>
    <td width="50%">
      <img src="docs/screenshots/sandbox.png" alt="Bac à sable : terminal, worktrees, graphe et pipeline">
      <p align="center"><sub><b>Le bac à sable</b> — juste toi et Git, sans consigne.</sub></p>
    </td>
  </tr>
</table>

<p align="center">
  <img src="docs/screenshots/home-mobile.png" alt="GitQuest sur mobile" width="280">
  <br>
  <sub>Ça marche aussi sur téléphone : dans le navigateur, ou en APK Android.</sub>
</p>

---

## Le parcours

**6 chapitres, 19 missions, un prologue.** Les missions se débloquent au fur et à mesure,
et chaque chapitre commence par un cours.

| Chapitre | Ce que tu vas enfin comprendre |
|----------|-------------------------------|
| **1 · Sous le capot** | Ce qu'est vraiment un commit, à quoi servent le working directory, l'index et HEAD. |
| **2 · Les branches** | Pourquoi une branche n'est qu'un pointeur, comment en changer sans rien perdre, pourquoi un commit peut devenir orphelin. |
| **3 · Fusionner** | La différence entre avance rapide et merge commit, et comment résoudre un conflit sans paniquer. |
| **4 · Worktrees** | Travailler sur deux choses à la fois, corriger la prod sans toucher à ton brouillon. |
| **5 · Raccourcis** | Les commandes qui font plusieurs choses d'un coup, et quand les utiliser. |
| **6 · Collaborer** | Remote, `push`, `fetch`, `pull`, upstream, et le fameux « fetch first ». |

Un **prologue** est là pour démarrer du bon pied : lire une commande, comprendre les
options, les guillemets et les placeholders.

À la fin, tu n'as pas mémorisé une liste de commandes : tu sais **lire un graphe Git et
prédire ce qu'une commande va faire**.

---

## Une histoire, pas une liste d'exercices

Les missions suivent une trame continue : une petite équipe, un projet nommé Nova, des
collègues qui commitent en même temps que toi. Chaque mission a une intro en dialogue et
un épilogue, pour que les exercices ressemblent à de vraies situations de travail.

Au fil du jeu, tu construis **ton** arbre Git. À la fin, l'écran « Ton arbre Nova » te
montre le graphe complet que tu as créé, avec les commits, les branches, les merges et les
worktrees — et te laisse l'exporter en image.

---

## Ça donne envie de continuer

- **Des étoiles** à chaque mission : 3 si tu atteins l'objectif avec le minimum de
  commandes, 2 si tu traînes un peu, 1 sinon. Tu peux toujours rejouer pour faire mieux.
- **De l'XP et des niveaux**, de « Novice » à « Maître du dépôt », calculés à partir de ta
  vraie progression.
- **11 badges** : un par chapitre, mais aussi « Sans faute » pour cinq missions à trois
  étoiles, ou « Érudit » pour avoir lu tous les cours.
- **Des prédictions** : parfois, avant d'exécuter une commande, le jeu te demande ce qui
  va se passer. Tu réponds en cliquant sur le graphe, puis tu vérifies. C'est le meilleur
  moyen de repérer ce qu'on croit avoir compris.

Ta progression est sauvegardée localement, sur ton appareil. Rien ne part sur un serveur.

---

## Commencer

Le plus simple : **<https://mattiaparrinello.github.io/git-quest/>**. Ça s'ouvre tout de
suite, sans compte.

Tu peux aussi l'installer comme une application : dans ton navigateur, cherche l'icône
« Installer » dans la barre d'adresse. Une fois installée, GitQuest fonctionne **hors
ligne**, y compris dans le train.

### Sur Android, en APK

Télécharge l'APK signé depuis les
[releases GitHub](https://github.com/MattiaPARRINELLO/git-quest/releases/latest) (4 Mo).
Android demande d'autoriser l'installation depuis cette source, puis tout le jeu vit sur
l'appareil : démarrage sans réseau, sans compte, sans navigateur.

C'est la même application que la version web, empaquetée : le terminal y gagne une barre
de touches (`-`, `"`, `/`, `.`, `_`, `~`, espace, `Tab`, historique, `Entrée`) pour taper
du Git au pouce sans refermer le clavier, les suggestions de complétion se touchent au
doigt, et le graphe se zoome à deux doigts.

> **Astuce** : commence par le prologue, puis le chapitre 1. Tu peux aussi ouvrir
> directement le bac à sable si tu veux juste essayer des commandes.

---

## Questions fréquentes

**Est-ce que je risque de casser quelque chose ?**
Non. Tout se passe dans ton navigateur, sur un dépôt simulé. Rien n'est réel, rien n'est
envoyé, et tu peux tout réinitialiser d'un bouton.

**Faut-il connaître Git ?**
Non. Le prologue et le chapitre 1 partent de zéro. Si tu connais déjà les bases, tu peux
sauter les cours et attaquer les missions.

**Est-ce que ce sont de vraies commandes Git ?**
Oui : la syntaxe, les sorties et les messages d'erreur suivent Git. Le moteur est une
réimplémentation fidèle en TypeScript, pas un habillage.

**Combien de temps ?**
Environ 2 à 3 heures pour tout le parcours, en plusieurs sessions. La progression est
conservée.

**Ça marche sur téléphone ?**
Oui. L'interface s'adapte en onglets Terminal / Graphe / Fichiers, avec une barre de
touches pour les caractères Git et un graphe qui se zoome au doigt. Il existe aussi un
**APK Android** à installer depuis les releases, pour jouer sans navigateur.

**Est-ce que mes étoiles sont conservées si je change d'appareil ?**
Pas automatiquement : la progression reste sur l'appareil. L'écran d'accueil propose
« Sauvegarder » / « Restaurer » : un texte JSON à copier, qui contient tes étoiles, tes
cours lus et ton arbre Nova.

**C'est gratuit ?**
Oui, et sans publicité ni compte.

---

## Sous le capot

Pour les curieux et les développeurs : GitQuest est une PWA React + TypeScript, sans
backend. Le moteur Git (`src/engine/`) est **pur** — aucun accès au DOM, au stockage ou
à l'horloge système — ce qui le rend entièrement testable et reproductible. Le contenu
(cours, missions, prédictions) est de la donnée typée, jamais du texte codé dans un
composant.

```bash
npm ci
npm run dev          # développement local
npm test             # 433 tests
npm run build        # build PWA
npm run android:apk  # APK Android de développement
npm run android:aab  # AAB + APK signés, pour le Play Store
```

Deux livrables, une seule base de code : le `dist/` produit par Vite alimente la PWA et
est embarqué tel quel dans la coquille Capacitor. Les seules différences sont déclaratives
— détection de plateforme dans `src/native/`, affordances tactiles montées selon la taille
d'écran — jamais un second rendu à maintenir.

Documentation technique : [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) ·
[`docs/VERIFY.md`](docs/VERIFY.md) · [`docs/CI.md`](docs/CI.md) ·
[`docs/STORY-REPO.md`](docs/STORY-REPO.md) · [`docs/NATIVE-ANDROID.md`](docs/NATIVE-ANDROID.md)
— et, côté Android : [`docs/ANDROID-VERIFY.md`](docs/ANDROID-VERIFY.md) (recette sur
appareil) et [`docs/RELEASE.md`](docs/RELEASE.md) (signature et Play Store).

Envie de contribuer ? Les conventions et les guides « ajouter une commande / une
mission » sont dans [`AGENTS.md`](AGENTS.md) et dans l'architecture.

---

<p align="center">
  <sub>GitQuest — apprendre Git en le voyant. Progression enregistrée uniquement sur ton appareil.</sub>
</p>
