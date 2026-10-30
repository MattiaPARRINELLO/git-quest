/**
 * Briefing narratif de chaque mission, affiché au démarrage et skippable.
 * Données pures : aucun texte d'histoire dans un composant.
 */
export interface MissionBriefing {
  readonly title: string;
  readonly paragraphs: readonly string[];
  /** Ce que le joueur vient d'accomplir, raconté. */
  readonly outcome?: string;
  /** Accroche vers l'épisode suivant. */
  readonly teaser?: string;
}

export const missionBriefings: Readonly<Record<string, MissionBriefing>> = {
  'trois-zones': {
    title: 'Nova, acte I : le correctif qui n’attend pas',
    paragraphs: [
      'Nova est l’assistant de notes de l’équipe. Ce matin, deux fichiers ont été modifiés dans le dépôt : a.txt et b.txt.',
      'Le lead veut livrer uniquement le correctif de a.txt pour la release de midi. b.txt peut attendre demain.',
      'À toi de jouer : prépare une photo qui ne contient que a.txt, sans embarquer le reste du chantier.',
    ],
    outcome: "Le correctif de a.txt est parti seul ; les idées de b.txt attendent toujours sur ton disque.",
    teaser: "Le CTO veut maintenant prouver que cette photo ne bougera plus.",
  },
  'snapshot-fige': {
    title: 'Nova, acte I : la photo ne bouge plus',
    paragraphs: [
      'Le CTO doute : « si le fichier sur le disque change après l’index, le commit prend quelle version ? »',
      'Tout est déjà prêt : l’index contient app.ts en v2, le disque est déjà passé en v3.',
      'Commit l’index sans refaire git add, et observe : la photo reste figée sur v2.',
    ],
    outcome: "La photo est figée sur v2 : v3 est resté sur le disque, hors du commit.",
    teaser: "Un coéquipier jure que -am suffit pour tout livrer.",
  },
  'piege-am': {
    title: 'Nova, acte I : le raccourci qui trahit',
    paragraphs: [
      'Un coéquipier jure que « git commit -am » s’occupe de tout, sans jamais indexer.',
      'Pendant ce temps, un ADR vient d’arriver dans le projet et README.md a été retouché.',
      'Vérifie ce que -am photographie vraiment, et livre les deux fichiers sans laisser de travail sale.',
    ],
    outcome: "README et notes sont partis ensemble ; le réflexe -am a montré sa limite sur l’ADR.",
    teaser: "L’équipe veut explorer une idée sans toucher à main.",
  },
  'branche-pointeur': {
    title: 'Nova, acte II : une idée à part',
    paragraphs: [
      'L’équipe veut tester des notes internes sans polluer main. On te confie l’exploration.',
      'Crée une branche experiment, travaille dessus, puis prouve que main n’a pas bougé d’un millimètre.',
      'notes.txt a déjà été mis à jour avec de vraies notes internes : à toi de commiter cette modification sur la branche, sans toucher à main.',
    ],
    outcome: "experiment porte tes notes, main n’a pas bougé d’un pixel.",
    teaser: "La facturation doit avancer en parallèle de la configuration.",
  },
  'qui-avance': {
    title: 'Nova, acte II : deux chantiers en parallèle',
    paragraphs: [
      'La facturation part sur sa propre branche pendant que la configuration avance sur main.',
      'Personne ne veut écraser le travail de l’autre : chaque commit doit déplacer la bonne étiquette.',
      'feature.ts et main.ts sont déjà écrits dans ton working dir : à toi de les commiter sur la bonne branche, puis de vérifier qui a bougé.',
    ],
    outcome: "Deux lignes parallèles, deux étiquettes distinctes : chaque commit a déplacé la bonne.",
    teaser: "Une régression dans la facturation t’attend sur un vieux commit.",
  },
  'commit-perdu': {
    title: 'Nova, acte II : l’expérience qui s’échappe',
    paragraphs: [
      'Une régression est apparue dans la facturation. Tu remontes le temps sur un ancien commit pour enquêter.',
      'Tu y commites une expérience… puis tu reviens sur main. Git t’avertit : ce commit n’est plus relié à rien.',
      'exp.txt est déjà prêt dans ton working dir. Sauve ce commit dans une branche avant qu’il ne disparaisse.',
    ],
    outcome: "L’expérience est sauvée : sauvetage la garde accessible, même détachée.",
    teaser: "L’export CSV est prêt, main est restée en arrière.",
  },
  'avance-rapide': {
    title: 'Nova, acte III : livrer sans cérémonie',
    paragraphs: [
      'L’export CSV est terminé et main n’a pas bougé depuis. Le release manager veut livrer ce soir.',
      'Ici, aucune divergence : Git peut faire glisser l’étiquette main vers le travail déjà fait.',
      'Livre la fonctionnalité sans créer de commit de fusion inutile.',
    ],
    outcome: "main a glissé sur le travail déjà fait, sans commit de fusion.",
    teaser: "Notifications et configuration ont divergé.",
  },
  'merge-commit': {
    title: 'Nova, acte III : le point de convergence',
    paragraphs: [
      'Cette fois, main et feature ont toutes les deux avancé : notifications d’un côté, configuration de l’autre.',
      'Git ne doit pas choisir un camp : il lui faut un point de convergence qui relie les deux lignes.',
      'Fusionne, puis vérifie que le commit de fusion a bien deux parents et garde tout le monde.',
    ],
    outcome: "Le merge commit relie les deux lignes : personne n’a perdu son travail.",
    teaser: "Inès est partie en laissant deux branches derrière elle.",
  },
  'menage-branches': {
    title: 'Nova, acte III : le placard mal rangé',
    paragraphs: [
      'Inès est partie en laissant deux branches derrière elle. feature-login est déjà fusionnée ; experiment contient un test jamais intégré.',
      'Le lead veut un nettoyage propre, pas un ménage à l’aveugle : commence par constater le refus de -d sur experiment.',
      'Ensuite, choisis consciemment : fusionner, ou forcer la suppression en assumant la perte.',
    ],
    outcome: "Le placard est rangé : feature-login supprimée, experiment traitée consciemment.",
    teaser: "Un bug critique tombe en pleine refonte.",
  },
  'hotfix-worktree': {
    title: 'Nova, acte IV : le bug de prod',
    paragraphs: [
      'Tu es en pleine refonte sur feature, avec des modifications non commitées dans app.ts. Un bug critique tombe en prod.',
      'Réflexe naturel : git switch main. Mais main a aussi touché app.ts, et Git refuse d’écraser ton travail.',
      'Le bug est simple : login() appelle db.find(req.user) sans vérifier la session. Yanis a déjà poussé le correctif sur la branche hotfix.',
      'Pas de stash, pas de commit bricolé : monte un second espace de travail sur hotfix pour vérifier le correctif sans toucher au WIP.',
    ],
    outcome: "Le correctif est vérifié depuis un second bureau, ton WIP n’a pas bougé.",
    teaser: "La doc doit avancer pendant que tu réécris le README.",
  },
  'deux-worktrees': {
    title: 'Nova, acte IV : deux casquettes',
    paragraphs: [
      'La doc doit avancer pendant que tu réécris le README sur main. Impossible de tout faire dans le même working dir.',
      'Yanis a repris ta refonte : il a commité ton WIP sur feature, rien n’est perdu, et tu peux maintenant passer sur main.',
      'Samir a déjà poussé le guide sur la branche docs : monte un worktree sur docs pour le relire sans interrompre ton README.',
    ],
    outcome: "Le guide est relu depuis son worktree, main garde ton brouillon.",
    teaser: "Le worktree temporaire traîne encore sur le disque.",
  },
  'menage-worktree': {
    title: 'Nova, acte IV : ranger le chantier',
    paragraphs: [
      'Le hotfix est livré, la branche hotfix reste utile pour l’historique, mais le worktree temporaire traîne sur le disque.',
      'Git refuse de supprimer un worktree sale. Celui-ci est propre : tu peux ranger sans risque.',
      'Supprime l’espace de travail, garde la branche et le correctif.',
    ],
    outcome: "Le chantier est rangé ; les branches et l’histoire restent.",
    teaser: "Ton arbre Nova t’attend sur la carte.",
  },
};

export function briefingFor(missionId: string): MissionBriefing | undefined {
  return missionBriefings[missionId];
}
