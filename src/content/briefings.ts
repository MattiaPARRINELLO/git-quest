import type { TeammateId } from '../story/types';

/**
 * Briefing narratif de chaque mission, affiché au démarrage et skippable.
 * Données pures : aucun texte d'histoire dans un composant.
 */
export type BriefingSpeaker = TeammateId | 'narrateur';

export interface BriefingLine {
  readonly speaker: BriefingSpeaker;
  readonly text: string;
}

export interface MissionBriefing {
  readonly title: string;
  readonly lines: readonly BriefingLine[];
  /** Ce que le joueur vient d'accomplir, raconté. */
  readonly outcome?: string;
  /** Accroche vers l'épisode suivant. */
  readonly teaser?: string;
}

export const missionBriefings: Readonly<Record<string, MissionBriefing>> = {
  'trois-zones': {
    title: 'Nova, acte I : le correctif qui n’attend pas',
    lines: [
      {
        speaker: 'narrateur',
        text: 'Nova est l’assistant de notes de l’équipe. Ce matin, deux fichiers ont été modifiés : a.txt et b.txt.',
      },
      { speaker: 'lea', text: 'Le correctif de a.txt part à midi. b.txt peut attendre demain.' },
      {
        speaker: 'narrateur',
        text: 'Prépare une photo qui ne contient que a.txt, sans embarquer le reste du chantier.',
      },
    ],
    outcome:
      'Le correctif de a.txt est parti seul ; les idées de b.txt attendent toujours sur ton disque.',
    teaser: 'Le CTO veut maintenant prouver que cette photo ne bougera plus.',
  },
  'snapshot-fige': {
    title: 'Nova, acte I : la photo ne bouge plus',
    lines: [
      {
        speaker: 'yanis',
        text: 'Le disque est déjà en v3, mais l’index est resté sur v2. Qu’est-ce que le commit va photographier ?',
      },
      {
        speaker: 'narrateur',
        text: 'Le CTO veut la preuve : commit l’index sans refaire git add, et regarde ce qui reste sur le disque.',
      },
    ],
    outcome: 'La photo est figée sur v2 : v3 est resté sur le disque, hors du commit.',
    teaser: 'Un coéquipier jure que -am suffit pour tout livrer.',
  },
  'piege-am': {
    title: 'Nova, acte I : le raccourci qui trahit',
    lines: [
      { speaker: 'ines', text: 'git commit -am s’occupe de tout, non ? Pas besoin d’indexer.' },
      { speaker: 'samir', text: 'L’ADR vient d’arriver, et README.md a été retouché.' },
      {
        speaker: 'narrateur',
        text: 'Vérifie ce que -am photographie vraiment, et livre les deux fichiers sans laisser de travail sale.',
      },
    ],
    outcome:
      'README et notes sont partis ensemble ; le réflexe -am a montré sa limite sur l’ADR.',
    teaser: 'L’équipe veut explorer une idée sans toucher à main.',
  },
  'branche-pointeur': {
    title: 'Nova, acte II : une idée à part',
    lines: [
      { speaker: 'lea', text: 'On veut tester des notes internes sans polluer main. Je te confie l’exploration.' },
      {
        speaker: 'narrateur',
        text: 'notes.txt est déjà modifié. Crée experiment, commite la modification dessus, et prouve que main n’a pas bougé.',
      },
    ],
    outcome: 'experiment porte tes notes, main n’a pas bougé d’un pixel.',
    teaser: 'La facturation doit avancer en parallèle de la configuration.',
  },
  'qui-avance': {
    title: 'Nova, acte II : deux chantiers en parallèle',
    lines: [
      { speaker: 'lea', text: 'La facturation part sur sa branche ; la configuration avance sur main.' },
      {
        speaker: 'narrateur',
        text: 'feature.ts et main.ts sont déjà écrits. Commite chacun sur la bonne branche, puis reviens sur main pour vérifier qui a bougé.',
      },
    ],
    outcome: 'Deux lignes parallèles, deux étiquettes distinctes : chaque commit a déplacé la bonne.',
    teaser: 'Une régression dans la facturation t’attend sur un vieux commit.',
  },
  'commit-perdu': {
    title: 'Nova, acte II : l’expérience qui s’échappe',
    lines: [
      { speaker: 'ines', text: 'La facturation a régressé. Remonte sur un vieux commit pour enquêter.' },
      {
        speaker: 'narrateur',
        text: 'exp.txt est déjà prêt. Commit-le en HEAD détaché, reviens sur main, puis sauve l’orphelin dans une branche.',
      },
    ],
    outcome: 'L’expérience est sauvée : sauvetage la garde accessible, même détachée.',
    teaser: 'L’export CSV est prêt, main est restée en arrière.',
  },
  'avance-rapide': {
    title: 'Nova, acte III : livrer sans cérémonie',
    lines: [
      { speaker: 'ines', text: 'L’export CSV est prêt, et main n’a pas bougé depuis.' },
      { speaker: 'narrateur', text: 'Livre sans commit de fusion : ici, un fast-forward suffit.' },
    ],
    outcome: 'main a glissé sur le travail déjà fait, sans commit de fusion.',
    teaser: 'Notifications et configuration ont divergé.',
  },
  'merge-commit': {
    title: 'Nova, acte III : le point de convergence',
    lines: [
      { speaker: 'lea', text: 'Notifications d’un côté, configuration de l’autre : les deux lignes ont avancé.' },
      { speaker: 'ines', text: 'Il nous faut un point de convergence, pas un camp qui gagne.' },
    ],
    outcome: 'Le merge commit relie les deux lignes : personne n’a perdu son travail.',
    teaser: 'Inès est partie en laissant deux branches derrière elle.',
  },
  'menage-branches': {
    title: 'Nova, acte III : le placard mal rangé',
    lines: [
      { speaker: 'ines', text: 'Je pars : feature-login est fusionnée, mais experiment contient un test jamais intégré.' },
      {
        speaker: 'narrateur',
        text: 'Commence par constater le refus de -d sur experiment. Ensuite, choisis consciemment : fusionner, ou forcer.',
      },
    ],
    outcome: 'Le placard est rangé : feature-login supprimée, experiment traitée consciemment.',
    teaser: 'Un bug critique tombe en pleine refonte.',
  },
  'hotfix-worktree': {
    title: 'Nova, acte IV : le bug de prod',
    lines: [
      { speaker: 'yanis', text: 'J’ai poussé le correctif de login sur la branche hotfix.' },
      {
        speaker: 'narrateur',
        text: 'Ton WIP sur feature bloque le switch vers main. Monte un second espace de travail sur hotfix pour vérifier, sans lâcher la refonte.',
      },
    ],
    outcome: 'Le correctif est vérifié depuis un second bureau, ton WIP n’a pas bougé.',
    teaser: 'La doc doit avancer pendant que tu réécris le README.',
  },
  'deux-worktrees': {
    title: 'Nova, acte IV : deux casquettes',
    lines: [
      { speaker: 'samir', text: 'Le guide est déjà commité sur la branche docs.' },
      { speaker: 'yanis', text: 'J’ai repris ta refonte et commité ton WIP : tu peux passer sur main.' },
      {
        speaker: 'narrateur',
        text: 'Monte un worktree sur docs pour relire le guide, sans interrompre ton README en cours.',
      },
    ],
    outcome: 'Le guide est relu depuis son worktree, main garde ton brouillon.',
    teaser: 'Le worktree temporaire traîne encore sur le disque.',
  },
  'menage-worktree': {
    title: 'Nova, acte IV : ranger le chantier',
    lines: [
      { speaker: 'ines', text: 'Le hotfix est livré, mais le worktree temporaire traîne encore.' },
      {
        speaker: 'narrateur',
        text: 'Rangement propre : supprime l’espace de travail, garde la branche et le correctif.',
      },
    ],
    outcome: 'Le chantier est rangé ; les branches et l’histoire restent.',
    teaser: 'Il reste à gagner du temps sur les gestes du quotidien.',
  },
  'commit-cible': {
    title: 'Nova, acte V : le correctif qui part seul',
    lines: [
      { speaker: 'lea', text: 'La config doit partir maintenant ; la doc attend la revue de demain.' },
      {
        speaker: 'narrateur',
        text: 'Trois fichiers ont changé, un seul doit être commité. Fais-le sans git add.',
      },
    ],
    outcome: 'La configuration est livrée seule ; la doc et la refonte restent sur le disque.',
    teaser: 'La documentation finale mérite sa propre branche.',
  },
  'branche-en-une-commande': {
    title: 'Nova, acte V : une branche pour la doc',
    lines: [
      { speaker: 'samir', text: 'La doc finale est prête, mais pas question de la poser sur main tout de suite.' },
      {
        speaker: 'narrateur',
        text: 'Crée la branche docs-final et bascule dessus en une seule commande, puis commite le README seul.',
      },
    ],
    outcome: 'La doc vit sur docs-final ; main n’a pas bougé d’un commit.',
    teaser: 'Dernier sprint : tout le chantier doit partir d’un coup.',
  },
  'tout-indexer': {
    title: 'Nova, acte V : le dernier sprint',
    lines: [
      { speaker: 'ines', text: 'Trois fichiers suivis ont changé, et src/health.ts vient d’apparaître.' },
      {
        speaker: 'narrateur',
        text: 'Un seul commit propre, en deux commandes maximum, nouveau fichier compris.',
      },
    ],
    outcome: 'Tout le sprint tient dans un commit ; le dépôt est propre.',
    teaser: 'Le guide a été réécrit deux fois, sur deux branches.',
  },
  'conflit-docs': {
    title: 'Nova, acte III : le guide déchiré',
    lines: [
      { speaker: 'samir', text: 'J’ai réécrit le guide sur doc-conflit pendant que tu corrigeais la même page sur main.' },
      {
        speaker: 'narrateur',
        text: 'Fusionne sa branche : Git va s’arrêter sur README.md. À toi de choisir la version finale.',
      },
    ],
    outcome: 'Une seule version du guide est livrée, et le commit de fusion garde les deux histoires.',
    teaser: 'Nova doit maintenant quitter ta machine.',
  },
  'premier-push': {
    title: 'Nova, acte VI : mettre Nova en ligne',
    lines: [
      { speaker: 'lea', text: 'Le dépôt GitHub est créé mais vide. Il faut y envoyer notre historique.' },
      {
        speaker: 'narrateur',
        text: 'Ajoute origin, publie main, et relie ta branche à origin/main pour les prochains push.',
      },
    ],
    outcome: 'Nova vit sur GitHub : origin/main pointe sur ton dernier commit.',
    teaser: 'Pendant que tu poussais, Léa a poussé elle aussi.',
  },
  'pull-equipe': {
    title: 'Nova, acte VI : le commit du coéquipier',
    lines: [
      { speaker: 'lea', text: 'J’ai ajouté un préfixe aux notifications et poussé sur main.' },
      {
        speaker: 'narrateur',
        text: 'Ton main est en retard. Récupère son commit : ici, aucune divergence, l’avance rapide suffit.',
      },
    ],
    outcome: 'main a rejoint origin/main sans commit de fusion.',
    teaser: 'Cette fois, vous avez touché le même fichier.',
  },
  'conflit-de-pull': {
    title: 'Nova, acte VI : le même fichier, deux versions',
    lines: [
      { speaker: 'lea', text: 'J’ai retravaillé notify.ts et poussé sur main.' },
      { speaker: 'samir', text: 'Et toi tu as commité ta propre version du même fichier sans récupérer.' },
      {
        speaker: 'narrateur',
        text: 'Fais le pull, résous le conflit, et termine la fusion.',
      },
    ],
    outcome: 'Le préfixe de Léa et ton nettoyage cohabitent dans une seule version.',
    teaser: 'Ton arbre Nova t’attend sur la carte.',
  },
};

export function briefingFor(missionId: string): MissionBriefing | undefined {
  return missionBriefings[missionId];
}
