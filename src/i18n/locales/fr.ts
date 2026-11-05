/**
 * Catalogue de référence (français).
 *
 * C'est la source de vérité des clés : `en.ts` est typé sur `MessageKey`, donc
 * l'ajout d'une clé ici casse le typecheck tant que l'anglais ne la couvre pas.
 * Les textes du contenu pédagogique (chapitres, missions, histoires) vivent
 * dans `src/content/` et suivent un autre rythme de traduction (voir
 * `docs/I18N.md`).
 */
export const fr = {
  // Application
  'app.title': 'GitQuest · Bac à sable Git',
  'app.description':
    'GitQuest : apprends Git en visualisant chaque commande. Commits, branches, merges et worktrees, pas à pas.',
  'app.skipToContent': 'Aller au contenu',
  'app.notFound': 'Page introuvable.',
  'app.backToChapters': 'Retour aux chapitres',

  // Navigation et contrôles
  'nav.homeAria': 'Accueil GitQuest',
  'nav.openMenu': 'Ouvrir le menu',
  'nav.main': 'Navigation principale',
  'nav.chapters': 'Chapitres',
  'nav.sandbox': 'Bac à sable',
  'nav.myTree': 'Mon arbre',
  'nav.prologue': 'Prologue',
  'controls.explanations': 'Explications',
  'controls.explanationsTitle': 'Afficher les explications après chaque commande',
  'controls.demo': 'Démo',
  'controls.demoTitle': 'Charger un dépôt de démonstration',
  'controls.reset': 'Réinitialiser',
  'controls.resetTitle': 'Réinitialiser le bac à sable',
  'controls.lightTheme': 'Passer en thème clair',
  'controls.darkTheme': 'Passer en thème sombre',
  'controls.lightThemeShort': 'Thème clair',
  'controls.darkThemeShort': 'Thème sombre',
  'controls.language': 'Langue',
  'controls.switchToEnglish': 'Passer en anglais',
  'controls.switchToFrench': 'Passer en français',

  // Accueil
  'home.title': 'Apprends Git en voyant le graphe.',
  'home.intro':
    '{chapters} chapitres, {missions} missions. Tu tapes une vraie commande, le dépôt se redessine : branches, HEAD, index et worktrees deviennent lisibles.',
  'home.loading': 'Chargement',
  'home.openSandbox': 'Ouvrir le bac à sable',
  'home.graphCaption':
    'Le dépôt de Nova : quatre commits, une branche fusionnée. Chaque mission en ajoute un.',
  'home.beforeTyping': 'Avant de taper',
  'home.prologueTitle': 'Prologue · Lire une commande Git',
  'home.prologueText':
    'Options, guillemets, placeholders : décoder n’importe quelle commande avant de commencer. {minutes} min.',
  'home.read': 'Lire',
  'home.reread': 'Relire',
  'home.path': 'Le parcours',
  'home.pathText':
    'Six voies, du premier commit aux conflits de pull. Une mission ne s’ouvre qu’une fois la précédente terminée.',
  'home.whatYouSee': 'Ce que tu regardes',
  'home.whatYouSeeText':
    'Quatre panneaux, un seul dépôt. Le terminal écrit, le graphe répond, le pipeline montre le fichier qui traverse l’index, la prédiction te fait parier avant de voir.',
  'home.whereYouAre': 'Où tu en es',
  'home.missionsLabel': 'missions sur',
  'home.starsLabel': 'étoiles sur',
  'home.percentLabel': 'du parcours',
  'home.lastEpisode': 'Dernier épisode',
  'home.nextUp': 'À suivre · ',
  'home.novaDepot': 'Le dépôt que tu construis',
  'home.novaTreeTitle': 'L’arbre de Nova',
  'home.novaTreeText':
    'Chaque mission laisse un commit. À la fin, tu ouvres l’arbre complet et tu le lis comme une histoire.',
  'home.yourNovaTree': 'Ton arbre Nova',
  'home.savedLocally': 'Progression enregistrée sur cet appareil. Hors ligne, sans compte.',

  // Chapitres
  'chapter.readCourse': 'Lire le cours',
  'chapter.meta': 'Chapitre {number} · {done}/{total} missions · {minutes} min de cours',
  'chapter.missionsOnLane': '{count} missions sur cette voie',
  'chapter.done': 'terminée',
  'chapter.todo': 'à faire',
  'chapter.locked': 'verrouillée',
  'chapter.starsAria': '{count} étoile(s) sur 3',

  // Cours
  'lesson.kindText': 'Texte',
  'lesson.kindDiagram': 'Schéma',
  'lesson.kindDemo': 'Démo',
  'lesson.kindRecap': 'Récapitulatif',
  'lesson.noteLabel': 'À noter · ',
  'lesson.readMinutes': '{minutes} min de lecture',
  'lesson.contents': 'Sommaire',
  'lesson.slideAria': 'Diapositive {index} sur {total}',
  'lesson.position': '{index} sur {total}',
  'lesson.previous': 'Précédent',
  'lesson.next': 'Suivant',
  'lesson.chapterBadge': 'Chapitre {number}',
  'lesson.prologueBadge': 'Prologue',
  'lesson.startMissions': 'Passer aux missions',
  'lesson.lockedHint':
    'Termine les missions précédentes pour déverrouiller celles de ce chapitre.',
  'lesson.notFound': 'Chapitre introuvable.',
  'lesson.startChapter': 'Commencer le chapitre {number}',
  'lesson.diagramAria': 'Schéma pédagogique',
  'demo.initial': 'État initial du dépôt. Lance la démo pour voir chaque étape.',
  'demo.restart': 'Recommencer',
  'demo.nextStep': 'Étape suivante',
  'diagram.step': 'Étape {index} / {total}',
  'diagram.empty': 'vide',
  'diagram.notStaged': 'non indexé → pas dans la photo',

  // Mission, panneau et briefing
  'mission.notFound': 'Mission introuvable.',
  'mission.lockedTitle': 'Mission verrouillée',
  'mission.lockedText':
    'Termine d’abord « {number} » et les missions précédentes pour débloquer celle-ci.',
  'mission.viewMap': 'Voir la carte des chapitres',
  'mission.header': 'Mission {number} · {title}',
  'mission.objectiveLine': 'Objectif : {objective}',
  'mission.training': 'Entraînement : ton arbre Nova n’est pas modifié.',
  'mission.recalaged':
    'Ton dépôt a été remis au propre pour cette mission. Ton parcours reste visible dans le journal.',
  'mission.allHints': 'Tous les indices sont déjà révélés.',
  'mission.hintLine': 'Indice {index}/{total} : {hint}',
  'mission.resumeStory': 'Reprendre l’histoire depuis ici',
  'mission.confirmResume':
    'Reprendre l’histoire depuis la mission {number} ?\n\nTon arbre Nova actuel et la suite de l’histoire seront remplacés. Tes étoiles déjà acquises sont conservées.',
  'mission.panelAria': 'Mission {number} : {title}',
  'mission.panelMeta': 'Mission {number} · {used} / {par} commandes',
  'mission.steps': '{done} / {total} étapes',
  'mission.objective': 'Objectif',
  'mission.hintButton': 'Indice {index}/{total}',
  'mission.hints': 'Indices',
  'mission.allHintsTitle': 'Tous les indices sont révélés',
  'mission.expand': 'Déplier la mission',
  'mission.collapse': 'Replier la mission',
  'mission.usefulCommands': 'Commandes utiles ici',
  'mission.prefillTitle': 'Pré-remplir la commande sans l’exécuter',
  'mission.validationNote':
    'La validation se fait après chaque commande. En cas d’échec, utilise « Indice » pour comprendre ce qui manque.',
  'mission.hintPrefix': 'Indice {index} · ',
  'mission.starsAria': '{count} étoile(s) sur 3',
  'mission.complete': 'Mission accomplie',
  'mission.commandsCount': '{count} commande(s) · par {par}',
  'mission.takeawayLabel': 'Ce que tu dois remarquer',
  'mission.nextUp': 'À suivre · ',
  'mission.solution': 'Solution de référence',
  'mission.continue': 'Continuer',
  'mission.review': 'Revoir',
  'mission.inspect': 'Inspecter',
  'mission.doneAria': 'Mission {number} réussie',
  'mission.keysContinue': 'Entrée pour continuer · Échap pour rester dans le dépôt',
  'mission.map': 'Carte des chapitres',
  'briefing.aria': 'Briefing {number}',
  'briefing.header': 'Mission {number}',
  'briefing.closeTitle': 'Fermer l’intro',
  'briefing.close': 'Fermer',
  'briefing.alreadyPrepared': 'Déjà dans ton working dir',
  'briefing.skip': 'Passer l’intro',
  'briefing.enter': 'Entrer dans le dépôt',
  'briefing.keys': 'Entrée pour entrer · Échap pour passer l’intro',
  'prepared.new': 'nouveau',
  'prepared.modified': 'modifié',
  'prepared.staged': 'indexé',

  // Prédictions
  'prediction.aria': 'Prédiction',
  'prediction.paused': 'Exécution en pause',
  'prediction.skip': 'Passer',
  'prediction.skipTitle': 'Exécuter la commande sans répondre',
  'prediction.label': 'Prédiction',
  'prediction.graph': 'graphe',
  'prediction.keys':
    '↑↓ puis Entrée pour valider · 1–{total} pour répondre directement · Échap pour passer. Tu peux aussi cliquer un commit ou une étiquette sur le graphe.',
  'prediction.correct': 'Bonne prédiction',
  'prediction.incorrect': 'Pas tout à fait',
  'prediction.continueKey': 'Entrée pour continuer',

  // Bac à sable et panneaux
  'sandbox.title': 'Bac à sable',
  'sandbox.subtitle': 'Un vrai dépôt Git, sans consigne',
  'tabs.terminal': 'Terminal',
  'tabs.graph': 'Graphe',
  'tabs.files': 'Fichiers',
  'sandbox.panelsAria': 'Panneaux du bac à sable',
  'sandbox.secondaryAria': 'Panneau secondaire',
  'sandbox.secondaryContentAria': 'Contenu du panneau secondaire',
  'sandbox.missionTab': 'Mission',
  'split.terminalAria': 'Terminal',
  'split.resizeAria': 'Redimensionner les panneaux',
  'split.vizAria': 'Visualisation',

  // Pipeline
  'pipeline.title': 'Pipeline',
  'pipeline.hint': 'survol ou clic pour voir un fichier',
  'pipeline.zoneWorking': 'Working dir',
  'pipeline.zoneStaging': 'Index',
  'pipeline.zoneCommit': 'Dernier commit',
  'pipeline.statusNew': 'nouveau',
  'pipeline.statusModified': 'modifié',
  'pipeline.statusDeleted': 'supprimé',
  'pipeline.statusStaged': 'stagé',
  'pipeline.statusCommitted': 'commit',
  'pipeline.noWorktree': 'Aucun worktree actif.',
  'pipeline.fileCount': '{count} fichier(s)',
  'pipeline.stagedCount': '{count} indexé(s)',
  'pipeline.emptyWorking': 'Aucune modification locale',
  'pipeline.emptyStaging': 'Index vide',
  'pipeline.emptyCommit': 'Aucun commit',
  'pipeline.chipTitle': '{path} · {status} ({zone})',
  'pipeline.untracked': 'non suivi',
  'pipeline.diffIndex': '≠ index',
  'pipeline.diffHead': '≠ dernier commit',
  'pipeline.closePreview': 'Fermer l’aperçu',
  'pipeline.absent': 'absent de cette zone',
  'pipeline.emptyFile': '(fichier vide)',

  // Terminal
  'terminal.title': 'Terminal',
  'terminal.shortcuts': '↑↓ historique · Tab complétion · Ctrl+L effacer',
  'terminal.outputAria': 'Sortie du terminal',
  'terminal.inputAria': 'Commande Git',
  'keybar.toolbar': 'Touches rapides du terminal',
  'keybar.complete': 'compléter la saisie',
  'keybar.previous': 'commande précédente',
  'keybar.next': 'commande suivante',
  'keybar.run': 'exécuter la commande',
  'keybar.enter': 'Entrée',
  'keybar.dash': 'tiret',
  'keybar.quote': 'guillemet',
  'keybar.slash': 'barre oblique',
  'keybar.dot': 'point',
  'keybar.underscore': 'tiret bas',
  'keybar.tilde': 'tilde',
  'keybar.space': 'espace',

  // Worktrees
  'worktree.title': 'Worktrees',
  'worktree.clickHint': 'cliquer = cd <chemin>',
  'worktree.goAria': 'Aller au worktree {path}',
  'worktree.active': 'actif',
  'worktree.cd': 'cd',
  'worktree.clean': 'propre',
  'worktree.modified': '{count} modif.',

  // Graphe
  'graph.title': 'Graphe',
  'graph.commitCount': '{count} commit(s)',
  'graph.zoom': 'Zoomer',
  'graph.unzoom': 'Dézoomer',
  'graph.center': 'Recentrer sur HEAD',
  'graph.aria':
    'Graphe des commits · flèches ou glisser pour déplacer, pincer, + et − pour zoomer, 0 pour recentrer',
  'graph.svgAria': 'Graphe des commits',
  'graph.selectCommit': 'Sélectionner le commit {hash}',
  'graph.selectBranch': 'Sélectionner la branche {name}',
  'graph.head': 'HEAD · {paths}{detached}',
  'graph.detached': ' (détaché)',
  'graph.orphan': 'orphelin',
  'graph.parents': 'parents : {list}',
  'graph.none': 'aucun',
  'graph.emptySnapshot': 'snapshot vide',
  'graph.orphanNote': 'Commit orphelin : aucune branche ne pointe ici.',
  'graph.emptyTitle': 'Ton dépôt n’a encore aucun commit',
  'graph.emptyText': 'Trois commandes suffisent pour créer la première photo.',
  'graph.pinchHint': 'pincer = zoom · glisser = déplacer',
  'graph.wheelHint': 'molette = zoom · glisser = déplacer',
  'graph.reducedMotion': 'sans animation',
  'graph.root': 'racine',
  'graph.branchTitle': 'Branche {name}',
  'graph.branchTitleHead': 'Branche {name} (HEAD)',

  // Progression, niveaux et badges
  'progress.panelAria': 'Niveau et badges',
  'progress.level': 'Niveau {level} · {title}',
  'progress.maxLevel': ' · niveau maximum',
  'progress.toNext': ' · encore {xp} XP pour le niveau {next}',
  'progress.badges': 'Badges · {unlocked} sur {total}',
  'progress.badgeChapterDesc': 'Terminer les {count} missions du chapitre {number}.',
  'level.1': 'Novice',
  'level.2': 'Apprenti',
  'level.3': 'Committeur',
  'level.4': 'Brancheur',
  'level.5': 'Fusionneur',
  'level.6': 'Architecte',
  'level.7': 'Maître du dépôt',
  'badge.premier-pas.title': 'Premier pas',
  'badge.premier-pas.description': 'Terminer une mission.',
  'badge.sans-faute.title': 'Sans faute',
  'badge.sans-faute.description': 'Réussir cinq missions avec trois étoiles.',
  'badge.erudit.title': 'Érudit',
  'badge.erudit.description': 'Lire tous les cours, prologue compris.',
  'badge.parcours-complet.title': 'Parcours complet',
  'badge.parcours-complet.description': 'Terminer les {count} missions.',
  'badge.maitre.title': 'Maître du dépôt',
  'badge.maitre.description': 'Terminer toutes les missions avec trois étoiles.',

  // Reprise du parcours
  'resume.resumeMission': 'Reprendre la mission {number}',
  'resume.reviewNova': 'Revoir ton arbre Nova',
  'resume.finished': 'Terminé · {done}/{total} missions',
  'resume.startChapter1': 'Commencer avec le chapitre 1',
  'resume.resumeLesson': 'Reprendre le cours : {title}',
  'resume.startLesson': 'Commencer le cours : {title}',
  'resume.continueMission': 'Continuer : mission {number}',
  'resume.chapterContext': 'Chapitre {number} · {title} · {done}/{total} missions',

  // Arbre Nova
  'nova.title': 'Ton arbre Nova',
  'nova.subtitle': 'Le dépôt que tu as construit, mission après mission.',
  'nova.emptyText': 'Ton arbre apparaîtra ici une fois ta première mission terminée.',
  'nova.emptyHint':
    'Chaque mission laisse un commit : tu pourras relire l’histoire, ouvrir un commit et retrouver la commande qui l’a créé.',
  'nova.exportPng': 'Exporter en PNG',
  'nova.copyLog': 'Copier git log',
  'nova.copied': 'Copié',
  'nova.map': 'Carte',
  'nova.storyAria': 'Fil de l’histoire',
  'nova.storyTitle': 'Le fil de l’histoire',
  'nova.noMessage': 'Aucun message personnel',
  'nova.selectedCommit': 'Commit sélectionné',
  'nova.detail': 'Détail',
  'nova.you': 'Toi · commit de ton parcours',
  'nova.parents': '{count} parent(s)',
  'nova.branch': 'Branche : {branch}',
  'nova.detachedHead': 'HEAD détaché',
  'nova.filesCount': '{count} fichier(s) dans la photo',
  'nova.orphanLabel': 'Orphelin : {value}',
  'nova.yes': 'oui',
  'nova.no': 'non',
  'nova.origin': 'Mission d’origine : {mission}',
  'nova.detailHint':
    'Clique sur un commit du graphe pour voir son message, son auteur et son contenu. Les commits abandonnés restent visibles, plus pâles.',
  'nova.starsAria': '{count} étoile(s)',
  'nova.missions': 'Missions',
  'nova.commits': 'Commits',
  'nova.branches': 'Branches',
  'nova.merges': 'Merges',
  'nova.stars': 'Étoiles',
  'nova.worktreesCreated': 'Worktrees créés',
  'nova.worktreesActive': 'Worktrees actifs',
  'nova.orphans': 'Abandonnés',

  // Interludes et fin
  'interlude.notFound': 'Transition introuvable.',
  'interlude.finished':
    'Chapitre {number} terminé · {missions} missions · {stars} / {max} étoiles',
  'interlude.whatLeft': 'Ce que tu as laissé',
  'interlude.starsAria': 'étoiles',
  'interlude.nextUp': 'À suivre · ',
  'interlude.map': 'Carte des chapitres',
  'interlude.startChapter': 'Commencer le chapitre {number}',
  'final.title': 'Ton arbre Nova',
  'final.intro':
    'Dix-neuf missions plus tard, tu lis un dépôt Git comme une histoire : des commits, des branches qui pointent, un HEAD qui avance et des worktrees qui travaillent en parallèle.',
  'final.done': 'Parcours terminé.',
  'final.missionsLabel': 'missions sur',
  'final.starsLabel': 'étoiles sur',
  'final.reviewMap': 'Revoir la carte des chapitres',
  'final.continueSandbox': 'Continuer dans le bac à sable',

  // Sauvegarde de la progression
  'backup.save': 'Sauvegarder',
  'backup.restore': 'Restaurer',
  'backup.saveTitle': 'Sauvegarder ma progression',
  'backup.restoreTitle': 'Restaurer ma progression',
  'backup.saveText':
    'Copie ce texte et garde-le : il contient tes étoiles, tes slides de cours et ton arbre Nova.',
  'backup.restoreText':
    'Colle une sauvegarde GitQuest. Elle remplace la progression actuelle de cet appareil.',
  'backup.contentAria': 'Contenu de la sauvegarde',
  'backup.restoreInputAria': 'Sauvegarde à restaurer',
  'backup.download': 'Télécharger un fichier',
  'backup.copy': 'Copier',
  'backup.copySuccess': 'Sauvegarde copiée. Colle-la où tu veux.',
  'backup.copyError': 'Copie impossible : sélectionne le texte et copie-le à la main.',
  'backup.restoreButton': 'Restaurer la sauvegarde',
  'backup.restored': 'Progression restaurée : {count} mission(s).',
  'backup.close': 'Fermer',

  // Fragments de l'accueil
  'fragments.mainCommits': '4 commits · 2 branches',
  'fragments.mergeCommit': 'commit de fusion',
  'fragments.terminalCaption':
    'Une ligne par commit, du plus récent au plus ancien. Chaque empreinte pointe vers un snapshot complet.',
  'fragments.missionPar': '{par} commandes pour 3 étoiles',
  'fragments.beforeRun': 'Avant d’exécuter',
  'fragments.predictionCaption': 'L’exécution attend ta réponse. Tu peux passer : rien ne bloque.',
  'fragments.pipeline': 'Pipeline',
  'fragments.zoneModified': 'a.txt modifié',
  'fragments.zoneStaged': 'a.txt indexé',
  'fragments.zoneCommit': 'commit {hash}',
  'fragments.pipelineNote':
    'Un fichier ne rejoint le graphe qu’en traversant les deux premières zones.',
  'fragments.workingDir': 'Working dir',
  'fragments.staging': 'Staging',
  'fragments.graph': 'Graphe',

  // Terminal applicatif
  'help.title': 'Commandes GitQuest',
  'help.files': 'Fichiers',
  'help.git': 'Git',
  'help.tools': 'Outils',
  'help.tip': 'Astuce : « explain <commande> » montre ce qui va se passer.',
  'help.example': 'ex.',
  'help.argFile': 'fichier',
  'help.argName': 'nom',
  'help.argBranch': 'branche',
  'help.argPath': 'chemin',
  'help.argCommand': 'commande',
  'help.argText': 'texte',
  'help.argRemote': 'remote',
  'app.explainHeader': 'Explication de « {command} » :',
  'app.explainWhy': 'Pourquoi : {reason}',
  'app.explainUsage': 'usage: explain <commande>',
  'app.explainNoChange': 'Cette commande ne modifie pas le dépôt.',
  'app.undoEmpty': 'Rien à annuler.',
  'app.undoDone': 'Commande annulée.',
  'app.hintNone': 'Aucune mission active.',
  'app.resetDone': 'Mission réinitialisée.',
  'app.suggest': 'Vouliez-vous dire « {command} » ?',
  'app.helpHint': 'Tape « help » pour voir toutes les commandes.',

  // Explications des événements
  'explain.repoInitialized':
    'Le dépôt est initialisé dans {path} : HEAD pointe vers la branche « main », encore vide.',
  'explain.commitCreatedBranch': 'Un commit « {commit} » est créé sur la branche « {branch} ».',
  'explain.commitCreatedDetached':
    'Un commit « {commit} » est créé : c’est un snapshot complet des fichiers, sans branche attachée.',
  'explain.branchCreated':
    'La branche « {name} » est créée : c’est un simple pointeur vers {commit}.',
  'explain.branchDeleted':
    'La branche « {name} » est supprimée (elle pointait vers {wasAt}).',
  'explain.branchMoved':
    'La branche « {name} » avance de {from} à {to}.',
  'explain.emptyRef': '(vide)',
  'explain.headAttached': 'HEAD se rattache à la branche « {branch} » (commit {commit}).',
  'explain.headDetached':
    'HEAD est maintenant détaché sur {commit} : il ne suit plus aucune branche.',
  'explain.headMoved': 'HEAD suit le nouveau commit ; aucune branche ne bouge.',
  'explain.fileStaged':
    '« {path} » est indexé : la prochaine photo (commit) le contiendra.',
  'explain.workingFileCreated':
    'Le fichier « {path} » est créé dans le working directory (pas encore suivi).',
  'explain.workingFileEdited': 'Le fichier « {path} » est modifié dans le working directory.',
  'explain.workingFileRemoved': 'Le fichier « {path} » est supprimé du working directory.',
  'explain.mergeFastForward':
    'Avance rapide : {target} rejoint {to} sans créer de commit.',
  'explain.mergeCommit': 'Un commit de fusion « {commit} » est créé : il a deux parents.',
  'explain.mergeConflict':
    'La fusion avec « {branch} » s’arrête : {paths} {verb} des deux côtés. Git a écrit les deux versions dans le fichier, entre les marqueurs <<<<<<<, ======= et >>>>>>>.',
  'explain.mergeConflictOne': 'a été modifié',
  'explain.mergeConflictMany': 'ont été modifiés',
  'explain.conflictResolved':
    '« {path} » est marqué comme résolu : c’est maintenant la version du disque qui sera commitée.',
  'explain.mergeAborted':
    'La fusion avec « {branch} » est annulée : le dépôt revient exactement à l’état d’avant.',
  'explain.remoteAdded':
    'Le dépôt distant « {name} » est ajouté ({url}) : c’est une simple adresse, rien n’est encore copié.',
  'explain.remoteRemoved':
    'Le dépôt distant « {name} » est oublié ; les branches de suivi associées disparaissent.',
  'explain.remoteFetchedEmpty':
    'Rien de nouveau sur « {remote} » : les références de suivi sont déjà à jour.',
  'explain.remoteFetched':
    'Récupération depuis « {remote} » : {branches} mis à jour dans les références de suivi. Le travail local n’a pas bougé.',
  'explain.remoteUpdated':
    '« {remote}/{branch} » passe de {from} à {to} sur le serveur : ton push est publié.',
  'explain.upstreamSet':
    'La branche « {branch} » suit maintenant « {upstream} » : « git push » et « git pull » sauront où aller.',
  'explain.upToDate': 'Rien à fusionner : « {branch} » est déjà à jour.',
  'explain.worktreeAdded': 'Le worktree {path} est ajouté.',
  'explain.worktreeAddedBranch': 'Le worktree {path} est ajouté sur la branche « {branch} ».',
  'explain.worktreeRemoved':
    'Le worktree {path} est supprimé ; le dépôt et la branche restent intacts.',
  'explain.worktreeActivated': 'Le worktree actif devient {path}.',

  // Explications des erreurs
  'error.notARepository': 'Aucun dépôt Git ici : commence par « git init ».',
  'error.localChanges':
    'Ces fichiers ont des modifications locales qui seraient écrasées par la destination. Commit ou annule ces changements avant de changer de branche.',
  'error.untrackedOverwritten':
    'Des fichiers non suivis portent le même nom que des fichiers de la destination. Git refuse de les écraser.',
  'error.branchCheckedOutElsewhere':
    'Une branche ne peut être checkout que dans un seul worktree à la fois. Utilise un autre worktree ou une autre branche.',
  'error.branchNotFullyMerged':
    'La branche contient des commits absents de HEAD. « -d » refuse de les perdre ; « -D » force la suppression.',
  'error.mergeWouldConflict':
    'Les deux branches ont modifié le même fichier de façon différente. Résous le conflit, puis « git add » et « git commit » (ou « git merge --abort » pour tout annuler).',
  'error.unmergedFiles':
    'Des fichiers sont encore en conflit. Édite-les pour retirer les marqueurs <<<<<<<, ======= et >>>>>>>, puis marque-les résolus avec « git add ».',
  'error.noMergeInProgress':
    'Aucune fusion n’est en cours : il n’y a rien à poursuivre ni à annuler.',
  'error.mergeInProgress':
    'Une fusion est en cours. Termine-la avec « git commit » ou abandonne-la avec « git merge --abort » avant de changer de branche.',
  'error.remoteNotFound':
    'Ce dépôt distant n’existe pas encore ici. Ajoute-le avec « git remote add origin <url> ».',
  'error.remoteAlreadyExists':
    'Un remote porte déjà ce nom. Choisis un autre nom ou supprime-le avec « git remote remove ».',
  'error.remoteRefNotFound':
    'Cette branche n’existe pas sur le serveur. Vérifie son nom ou pousse-la d’abord.',
  'error.noUpstream':
    'Cette branche ne suit aucune branche distante. Utilise « git push -u origin <branche> » ou précise « git pull <remote> <branche> ».',
  'error.pushRejected':
    'Le serveur a des commits que tu n’as pas : ton push n’est pas un avancement rapide. Fais « git pull » et résous les conflits éventuels avant de repousser.',
  'error.notOnABranch': 'HEAD est détaché : crée ou rejoins une branche avant de pousser ou de tirer.',
  'error.noPushDestination':
    'Aucun dépôt distant n’est configuré. Ajoute-en un avec « git remote add origin <url> ».',
  'error.worktreeLocalModifications':
    'Ce worktree contient des modifications ou des fichiers non suivis. Ajoute « --force » pour les jeter.',
  'error.worktreeRemoveMain': 'Le worktree principal ne peut pas être supprimé.',
  'error.worktreeRemoveActive':
    'Impossible de supprimer le worktree dans lequel tu te trouves : va ailleurs avec « cd ».',
  'error.branchNotFound': 'La branche ou le commit demandé n’existe pas.',
  'error.branchAlreadyExists': 'Ce nom de branche est déjà pris.',
  'error.nothingToCommit': 'Aucune modification indexée : il n’y a rien à photographier.',
  'error.noChangesAdded':
    'Les modifications existent mais ne sont pas indexées : ajoute-les avec « git add ».',
  'error.pathspecNoMatch': 'Aucun fichier ou commit ne correspond à ce nom.',
  'error.commitMessageNotQuoted':
    'Mets ton message entre guillemets : git commit -m "ton message".',
  'error.fileNotFound': 'Ce fichier n’existe pas dans le working directory.',
  'error.directoryNotFound': 'Ce chemin ne correspond à aucun worktree connu.',
  'error.noCommits': 'La branche n’a pas encore de commit.',
  'error.generic': 'La commande s’arrête sans rien modifier.',

  // Story et prompt
  'story.detachedNotice':
    'Plusieurs commits détachés ont été créés : {list}. Le sauvetage portera sur {hash} (le plus récent) ; les autres restent dans le journal.',
  'prompt.detached': '{hash} détaché',
} as const;

export type MessageKey = keyof typeof fr;
