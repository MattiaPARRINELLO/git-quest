# GitQuest — release Android

Procédure de publication sur le Play Store. Le détail du chantier natif est dans
`docs/NATIVE-ANDROID.md`, la recette sur appareil dans `docs/ANDROID-VERIFY.md`.

## Construire un livrable

```bash
npm run android:aab     # APK debug + AAB + APK release signés
```

Sorties :

| Fichier | Usage |
| --- | --- |
| `android/app/build/outputs/bundle/release/app-release.aab` | envoi sur le Play Store |
| `android/app/build/outputs/apk/release/app-release.apk` | installation directe / test |
| `android/app/build/outputs/apk/debug/app-debug.apk` | développement |

`npm run android:assets` régénère les icônes et le splash à partir de `assets/`
(`icon-only.png`, `icon-foreground.png`, `icon-background.png`, `splash.png`).

## Signature

Le keystore `android/gitquest-release.jks` et `android/keystore.properties`
sont **ignorés par git**. Sans eux, `assembleRelease` compile un APK non signé :
la CI et un nouveau clone restent fonctionnels, seule la signature manque.

> **Sauvegarde le keystore et ses mots de passe hors du dépôt** (gestionnaire de
> secrets). Perdre la clé d'upload oblige à demander une réinitialisation à
> Google ; sans Play App Signing, l'application ne pourrait plus être mise à jour.

Empreinte du certificat, pour vérifier un APK publié :

```bash
apksigner verify --print-certs android/app/build/outputs/apk/release/app-release.apk
```

## Version

`android/app/build.gradle` :

```gradle
versionCode 1        // entier, strictement croissant, jamais réutilisé
versionName "1.0.0"  // visible par les utilisateurs
```

Incrémenter `versionCode` **avant chaque envoi**, même pour un test interne.

## Publication Play Console

1. **Créer l'application** : nom `GitQuest`, langue par défaut `Français (fr-FR)`,
   type « Application », gratuite.
2. **Fiche du magasin** : reprendre les textes de la section suivante.
3. **Graphismes** (`assets/store/`) : icône 512×512, bannière 1024×500, au moins
   2 captures d'écran.
4. **Contenu de l'application** :
   - Politique de confidentialité :
     <https://mattiaparrinello.github.io/git-quest/confidentialite.html>
   - Sécurité des données : « Aucune donnée collectée ni partagée ».
   - Classification du contenu : questionnaire → tous publics, aucune violence,
     aucun achat intégré, aucune publicité.
   - Public cible : 13 ans et plus (aucune donnée collectée) ; éviter la case
     « conçu pour les familles », qui impose des contraintes de vérification
     supplémentaires.
   - Applications de gouvernement / finance : non.
5. **Test fermé** : comptes personnels récents → 12 testeurs pendant 14 jours
   avant de pouvoir demander la production.
6. **Production** : envoyer l'AAB, déployer par paliers si l'audience grandit.

## Fiche du magasin (FR)

**Nom** : GitQuest

**Description courte** (80 caractères max) :

```
Apprends Git en voyant le graphe : commandes réelles, six chapitres, hors ligne.
```

**Description complète** :

```
GitQuest transforme l'apprentissage de Git en jeu d'observation.

Tape une vraie commande, regarde le graphe se dessiner : les commits, les
branches, HEAD, l'index et les worktrees deviennent enfin lisibles. Chaque
commande est rejouée comme dans un terminal, avec les vrais messages d'erreur
quand elle échoue, et une explication en français quand elle réussit.

CE QUE TU APPRENDS
• Six chapitres progressifs, dix-neuf missions, du premier commit aux worktrees
• Un bac à sable libre pour expérimenter sans risque
• Les prédictions : devine ce que va faire une commande avant de la lancer
• Un arbre personnel qui garde la trace de tes missions

PENSÉ POUR LE TÉLÉPHONE
• Barre de touches avec tiret, guillemets et chemins, pour taper du Git au pouce
• Graphe tactile : un doigt pour déplacer, deux pour zoomer
• Suggestions de commandes et d'historique au toucher

HORS LIGNE, SANS COMPTE
• Aucune inscription, aucune publicité, aucune donnée envoyée
• Ta progression reste sur ton appareil et s'exporte en une sauvegarde

GitQuest s'adresse aux débutants qui ont déjà buté sur git reset, et aux
curieux qui veulent voir ce que fait vraiment Git.
```

**Mots-clés / catégorie** : Éducation (ou Développement). Pas de mots-clés
séparés sur le Play Store, la découverte passe par la description.

## Sécurité des données — réponses

| Question | Réponse |
| --- | --- |
| L'application collecte-t-elle ou partage-t-elle des données ? | Non |
| Données chiffrées en transit ? | Sans objet (aucune donnée transmise) |
| L'utilisateur peut-il demander la suppression ? | Sans objet (désinstallation = suppression) |

## Vérifications avant envoi

- [ ] `npm run typecheck`, `npm test`, `npm run build` verts.
- [ ] `docs/ANDROID-VERIFY.md` rejouée sur un appareil réel.
- [ ] `versionCode` incrémenté.
- [ ] AAB signé (`apksigner verify`), installé en test interne avant production.
- [ ] `androidScheme` toujours `https` (sinon la progression des utilisateurs
      existants est perdue).
