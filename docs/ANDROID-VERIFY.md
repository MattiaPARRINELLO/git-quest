# GitQuest — vérification sur appareil Android

Checklist à rejouer avant chaque release. Le projet se construit sur n'importe
quel poste avec Android SDK + JDK 21 (voir `docs/NATIVE-ANDROID.md`).

```bash
npm run android:apk                       # build web + sync + APK debug
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

## Réseau et démarrage

- [ ] Mode avion activé : l'app démarre et joue normalement (aucune requête).
- [ ] Aucun flash blanc entre le splash et l'accueil.
- [ ] Le splash disparaît une fois la progression chargée, pas avant.
- [ ] Rotation / retour d'arrière-plan : la progression est intacte.

## Navigation

- [ ] Bouton retour : quitte une mission vers la carte, puis réduit l'app à
      l'accueil (jamais de sortie brutale en pleine mission).
- [ ] Le thème clair/sombre se propage à la barre de statut.
- [ ] Encoches et barre de gestes ne recouvrent ni le terminal ni la KeyBar.

## Terminal tactile

- [ ] Clavier ouvert : l'écran se redimensionne, la ligne de saisie et la
      KeyBar restent visibles au-dessus du clavier.
- [ ] Appuyer sur une touche de la KeyBar ne referme pas le clavier.
- [ ] Les touches insèrent au curseur, pas en fin de ligne.
- [ ] `Tab` propose des suggestions cliquables ; un appui complète la saisie.
- [ ] `↑` / `↓` rappellent l'historique ; `Entrée` exécute.
- [ ] Le pavé de suggestions ne dépasse pas de l'écran.

## Graphe

- [ ] Un doigt déplace le graphe, deux doigts zooment.
- [ ] Le point entre les doigts reste fixe pendant le zoom.
- [ ] Les boutons `+` / `−` / `HEAD` restent accessibles sur petit écran.

## Progression

- [ ] Terminer une mission sur mobile : étoiles et slide de cours enregistrés.
- [ ] `Sauvegarder` sur l'accueil : le texte contient `"format": "gitquest-progress"`.
- [ ] `Copier` fonctionne (ou le message d'erreur explique quoi faire).
- [ ] Désinstaller, réinstaller, `Restaurer` avec le texte copié : étoiles
      revenues.
- [ ] Coller un texte invalide : message d'erreur, progression inchangée.

## Web (non-régression)

- [ ] `npm run build` puis `npm run preview` : la PWA fonctionne hors ligne.
- [ ] Aucun service worker dans le build natif (`chrome://inspect`).
- [ ] Sur navigateur mobile, la KeyBar apparaît, les raccourcis clavier non.
