# Unslop — stories et vidéos

Chaque fichier `*.html` est une story autonome : la page avant la refonte, puis
4 passes CSS (Espacement, Couleur, Typographie et copie, Détails) qui la
transforment en page actuelle. Le crédit `unslop by @heydamir` est ajouté par le
script de rendu.

| Page | Story | Vidéo |
| --- | --- | --- |
| Accueil | `accueil.html` | `accueil.mp4` |
| Cours | `cours.html` | `cours.mp4` |
| Mission | `mission.html` | `mission.mp4` |
| Bac à sable | `bac-a-sable.html` | `bac-a-sable.mp4` |
| Arbre Nova | `arbre-nova.html` | `arbre-nova.mp4` |

Les vidéos sont des artefacts générés, ignorés par Git. Pour les regénérer :

```bash
node ~/.config/opencode/skills/unslop/scripts/story.mjs unslop-story/accueil.html unslop-story/accueil.mp4
```

Prérequis : `playwright` (navigateur Chromium) et `ffmpeg`. Le dossier
`fonts/` contient les trois familles utilisées par l'application (Inter,
JetBrains Mono, Newsreader).
