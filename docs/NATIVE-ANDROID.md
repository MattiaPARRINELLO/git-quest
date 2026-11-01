# GitQuest — chantier Android natif (Capacitor)

Objectif : produire un **vrai APK/AAB Android** autonome (sans hébergement, sans
Chrome externe), installable par APK direct puis publiable sur le Play Store,
sans réécrire l'application.

Décision : **Capacitor 8** avec la WebView embarquée (`webDir: dist`). La PWA
reste la cible principale ; le natif est une coquille autour du même build.

Non retenus :

- **TWA / Bubblewrap** : dépend de Chrome sur l'appareil, exige un hébergement
  HTTPS et `assetlinks.json`, mises à jour liées au déploiement web.
- **React Native** : le moteur Git pur, `layoutGraph` et le contenu data-driven
  sont l'actif du projet ; les porter coûterait des semaines sans gain.

## Une seule base de code, deux livrables

Le même `src/` alimente la PWA et l'APK : un `vite build` produit `dist/`, que
la PWA sert directement et que Capacitor embarque tel quel. Ajouter une mission,
un chapitre ou une commande ne touche jamais `android/`.

Ce qui reste spécifique à la plateforme (et coûte un peu d'entretien) :

| Élément | Emplacement | Coût de maintenance |
| --- | --- | --- |
| Bouton retour, barre de statut, clavier, splash | `src/native/*.ts` (no-op sur web) | nul après la Phase 2 |
| Barre de touches du terminal | `KeyBar.tsx`, montée si mobile | nul : même composant web et natif |
| Service worker désactivé en natif | une condition dans `vite.config.ts` | nul |
| Projet `android/` | `android/` | ~1 mise à jour par an (SDK/AGP) |
| Signature et `versionCode` | `android/app/build.gradle` | 1 ligne par release |

Les composants ne connaissent pas la plateforme : ils réagissent à la taille
d'écran (`useMediaQuery`) ou à des capacités déclarées par `src/native/`. Il n'y
a donc pas deux rendus à maintenir, seulement des affordances tactiles en plus
qui ne s'affichent pas sur desktop.

La seule vraie discipline : **tester une nouveauté tactile sur les deux
cibles** (web mobile + APK) avant commit, car la WebView Android peut différer
du Chrome desktop sur le clavier et les safe areas.

## État

| Phase | État |
| --- | --- |
| 0 — Fondations natives | livrée (commit `e23356a`) |
| 1 — Pipeline de build | livrée (dans `e23356a`) |
| 2 — Comportement natif | livrée (commit `7383b7b`) |
| 3 — Terminal et graphe tactiles | livrée (commit `7a2a7a0`) |
| 4 — Données et robustesse | livrée |
| 5 — Release Play Store | hors périmètre de cette session |

## Règles du chantier

- Une phase = un commit (typecheck + tests + build avant commit).
- `src/engine/` reste pur : aucune API Capacitor n'y entre.
- Toute détection de plateforme passe par un module unique
  `src/native/` (`isNative()`, `initNative()`), jamais directement dans un
  composant métier.
- Le natif ne change **aucune** règle du moteur ni du contenu.
- Le build web (`npm run build`) doit continuer à produire une PWA identique.

## Phase 0 — Fondations natives (≈ ½ journée)

Livrables :

- Dépendances : `@capacitor/core`, `@capacitor/cli`, `@capacitor/android` +
  plugins `app`, `keyboard`, `status-bar`, `splash-screen`.
- `capacitor.config.ts` :
  - `appId: 'dev.gitquest.app'`, `appName: 'GitQuest'`
  - `webDir: 'dist'`
  - `android.scheme`/`server.androidScheme: 'https'` — **à figer maintenant** :
    changer ce schéma plus tard change l'origine WebView et **efface**
    IndexedDB et `localStorage` (progression perdue).
  - `backgroundColor: '#0a0b0f'`, `android.minWebViewVersion` par défaut.
- Projet `android/` généré (`npx cap add android`) et **committé** (source +
  gradle wrapper), sorties de build ignorées.
- JDK : le système a Java 27 par défaut, AGP exige **21** →
  `JAVA_HOME=/usr/lib/jvm/java-21-openjdk` fixé dans les scripts, pas dans le
  shell de l'utilisateur.
- `targetSdk 36`, `compileSdk 36`, `minSdk 24` (platforms 35/36 déjà présents
  dans `/opt/android-sdk`).

Critère d'acceptation : `assembleDebug` produit un APK qui démarre en mode
avion (aucun réseau), écran d'accueil affiché.

## Phase 1 — Pipeline de build (≈ ½ journée)

Livrables :

- `capacitor.config.ts` + scripts npm :
  - `build:native` = `vite build && cap sync android`
  - `android:apk` = `build:native && gradlew assembleDebug`
  - `android:install` = `apk` + `adb install -r`
- `vite.config.ts` : `VitePWA({ disable: isNativeBuild })` piloté par
  `process.env['CAPACITOR'] === '1'`. Motif : un service worker dans une WebView
  embarquée met en cache un build périmé et rend les mises à jour fantômes.
- `docs/CI.md` : note sur l'absence de build natif en CI (coût temps) et la
  procédure locale.
- `.gitignore` : `android/app/build/`, `android/build/`, `.gradle/`,
  `*.keystore`, `keystore.properties`.
- **`dist/` est écrasé par le dernier build.** Après `npm run android:apk`,
  `dist/` contient un build natif (sans service worker) : relancer `npm run build`
  avant `npm run preview` ou `npm run ci:smoke`. La CI reconstruit toujours côté
  web, elle n'est donc pas concernée.

Critère d'acceptation : `npm run android:apk` enchaîne build + sync + APK sans
intervention, et `chrome://inspect` ne montre **aucun** service worker actif.

## Phase 2 — Comportement natif (≈ 1 journée)

Livrables, dans `src/native/` :

- **Bouton retour** (`App.addListener('backButton')`) :
  - route non racine → `history.back()` ;
  - route racine → `App.minimizeApp()` (pas de sortie brutale).
- **Barre de statut** : couleur `#0a0b0f`, icônes claires, cohérente avec le
  thème clair/sombre de `useUiStore`.
- **Clavier** : `android:windowSoftInputMode="adjustResize"` +
  `Keyboard` plugin ; le terminal garde le focus et la zone de saisie reste
  visible au-dessus du clavier.
- **Safe areas** : `env(safe-area-inset-*)` en padding dans `App.tsx` et la
  `TopBar` (le `viewport-fit=cover` est déjà dans `index.html`).
- **Splash** : réutilise `public/icons/icon-512.png`, fond `#0a0b0f`,
  `launchAutoHide: false` + masquage explicite après hydratation de la
  progression (évite le flash d'écran vide).
- **Anti-flash** : fond natif `#0a0b0f` côté `styles.xml`, pas de blanc au boot.
- `initNative()` appelé une seule fois depuis `main.tsx`, no-op sur le web.

Critère d'acceptation : navigation retour Android conforme, clavier n'occulte
jamais la saisie, aucun flash blanc, splash masqué une fois l'app prête.

## Phase 3 — Terminal et graphe tactiles (≈ 2 journées, le vrai travail)

C'est ici que se joue la différence entre « un site dans une coquille » et une
vraie app. `Terminal.tsx` n'a aujourd'hui qu'un `<input>` + une liste
d'autocomplétion en texte.

Livrables :

- `src/components/terminal/KeyBar.tsx` : barre de touches au-dessus du clavier
  (`-`, `~`, `/`, `|`, `>`, `$`, `*`, `↑`, `↓`, `Tab`, `Ctrl+C`, `Entrée`).
  - insertion au caret via `inputRef.setSelectionRange`, jamais un remplacement
    de valeur ;
  - `onPointerDown` + `preventDefault()` pour ne pas fermer le clavier ;
  - cibles ≥ 44 px, scroll horizontal si trop large ;
  - affichée uniquement sur mobile (`useMediaQuery`), donc sans impact desktop.
- `autocomplete.ts` → suggestions **cliquables** (boutons, pas du texte), avec
  validation directe.
- Clavier logiciel : `autoCapitalize="off"` déjà présent, ajouter
  `autoCorrect="off"`, `inputMode` adapté, et police ≥ 16 px en mobile pour
  éviter le zoom automatique.
- `CommitGraph.tsx` : pinch-zoom à deux pointeurs (le viewport
  `{x, y, scale}` et `clampScale` existent déjà, le drag et le zoom bouton
  aussi). Boutons `±` visibles en mobile.
- Vérifier `h-dvh` + clavier (le `100dvh` suit le viewport visuel).

Critère d'acceptation : mission complète (briefing → commandes → validation)
réalisée au doigt sur téléphone, sans clavier physique.

## Phase 4 — Données et robustesse (≈ ½ journée)

Livrables :

- Export / import de la progression en JSON (bouton dans la `TopBar` ou les
  réglages) : `useProgressStore` sérialise déjà un document versionné.
  Motif : l'OS peut évincer le stockage WebView sous pression disque.
- Garde-fous : `localStorage` et IndexedDB peuvent lever en WebView
  (mode restreint) — le repli mémoire existe déjà pour `StorageAdapter`,
  l'étendre à `useUiStore` et `story-flags`.
- `docs/VERIFY.md` : procédure de test appareil (checklist).

Critère d'acceptation : export → effacement des données de l'app → import →
étoiles et slides restaurés.

## Phase 5 — Release (≈ ½ journée + délais Google)

Livrables :

- Keystore généré une fois (`pkexec keytool -genkeypair`), propriétés dans
  `keystore.properties` **ignoré par git**, `signingConfig` release branché.
- `versionCode` / `versionName` centralisés, `applicationId dev.gitquest.app`.
- Icônes adaptatives Android (foreground + background) à partir du maskable
  existant ; splash par densité.
- `bundleRelease` → AAB signé ; APK release pour distribution directe.
- Page de confidentialité (aucune donnée collectée, aucun réseau) + formulaire
  Data Safety du Play Console.

Critère d'acceptation : AAB signé, installation en test interne, `versionCode`
incrémentable en une ligne.

Hors délais techniques : compte Play Console (25 $ une fois) et **test fermé
12 testeurs / 14 jours** imposé aux comptes personnels récents avant toute
publication en production.

## Hors périmètre de cette v1

- iOS (Mac + 99 $/an obligatoires, décision séparée).
- Mises à jour live (Capgo / Appflow) : complexité de politique Play.
- Notifications, widgets, mode paysage forcé, refonte du contenu.

## Risques identifiés

| Risque | Parade |
| --- | --- |
| Java 27 par défaut casse AGP | `JAVA_HOME` figé sur java-21 dans les scripts |
| Premier `gradle sync` long (téléchargement AGP) | à faire une fois, cache `~/.gradle` déjà présent |
| `androidScheme` changé après coup = progression effacée | figé en Phase 0 et documenté |
| Service worker + WebView = build fantôme | PWA désactivée en build natif |
| Clavier tactile = point de friction n° 1 | Phase 3 dédiée, critère d'acceptation explicite |
| Stockage WebView évincé par l'OS | export/import JSON en Phase 4 |

## Estimation

| Phase | Durée |
| --- | --- |
| 0 — Fondations | ½ j |
| 1 — Pipeline | ½ j |
| 2 — Comportement natif | 1 j |
| 3 — Terminal + graphe tactiles | 2 j |
| 4 — Données | ½ j |
| 5 — Release | ½ j |
| **Total dev** | **≈ 5 j** |

Calendrier réel jusqu'à publication en production : ≈ 1 semaine de dev +
14 jours de test fermé Play Console.
