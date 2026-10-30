import { scenario } from '../../../engine/scenario';
import type { Lesson } from '../../types';

const demo = scenario()
  .init()
  .commit('Initial commit', {
    'README.md': '# Nova — documentation',
    'src/config.ts': 'export const config = { retries: 3 };',
    'app.ts': "export const app = 'v2';",
  })
  .build();

export const lesson05: Lesson = {
  id: 'lesson-shortcuts',
  title: 'Moins de commandes',
  slides: [
    {
      kind: 'text',
      title: 'Des raccourcis, pas une autre règle',
      paragraphs: [
        'Tout ce que tu as appris reste vrai : un commit photographie l’index. Les raccourcis changent seulement le nombre de commandes pour arriver au même résultat.',
        'Chaque raccourci s’adresse à une situation précise. Mal choisi, il embarque ce que tu voulais laisser dehors — c’est le piège de -a avec les nouveaux fichiers.',
      ],
      command: 'git status',
      note: 'Comprendre ce que la commande indexe reste plus important que sa brièveté.',
    },
    {
      kind: 'text',
      title: 'Un fichier seul, sans git add',
      paragraphs: [
        'Placer un chemin après le message limite le commit à ce chemin : Git prend sa version du disque, même s’il n’a jamais été indexé.',
        'Les autres modifications restent hors du commit, et restent sur le disque. Pratique pour livrer un correctif sans embarquer un chantier en cours.',
      ],
      command: 'git commit -m "fix: retries 5" src/config.ts',
      note: 'Le chemin vient après le message ; plusieurs chemins sont acceptés.',
    },
    {
      kind: 'demo',
      title: 'Un correctif seul dans la photo',
      initialState: demo,
      caption: 'README.md reste modifié après le commit : seul src/config.ts est parti.',
      steps: [
        { command: 'edit src/config.ts "export const config = { retries: 5 };"', explanation: 'Le correctif arrive dans le working dir.' },
        { command: 'edit README.md "# Nova — documentation finale"', explanation: 'La doc change aussi, mais elle attendra.' },
        { command: 'git status', explanation: 'Deux fichiers modifiés, aucun indexé.' },
        { command: 'git commit -m "fix: retries 5" src/config.ts', explanation: 'Seul src/config.ts entre dans la photo.' },
        { command: 'git status', explanation: 'README.md est toujours modifié, hors du commit.' },
      ],
    },
    {
      kind: 'text',
      title: 'Créer et basculer en une fois',
      paragraphs: [
        'git branch <nom> puis git switch <nom> reste valable, mais git switch -c <nom> fait les deux d’un coup.',
        'La branche est créée sur HEAD, puis HEAD s’y rattache aussitôt. Tes modifications locales suivent si elles ne sont pas écrasées par la destination.',
      ],
      command: 'git switch -c docs-final',
      note: 'start optionnel : git switch -c <nom> <commit> crée la branche depuis un autre point.',
    },
    {
      kind: 'text',
      title: 'Indexer tout, ou seulement le suivi',
      paragraphs: [
        'git add . indexe les modifications des fichiers suivis et les nouveaux fichiers. C’est la version large.',
        'git commit -am indexe seulement les fichiers déjà suivis : rapide, mais un fichier untracked reste dehors. À réserver aux corrections qui ne créent rien.',
        'Deux familles de raccourcis : ceux qui choisissent les chemins (commit ciblé, add .) et ceux qui choisissent les options groupées (-am).',
      ],
      command: 'git add .',
      note: 'git add . puis git commit -m "..." : deux commandes pour tout le chantier.',
    },
    {
      kind: 'demo',
      title: 'Une branche neuve, un commit',
      initialState: demo,
      caption: 'docs-final naît et reçoit le commit ; main reste intacte.',
      steps: [
        { command: 'edit README.md "# Nova — documentation finale"', explanation: 'La doc est prête sur le disque.' },
        { command: 'git switch -c docs-final', explanation: 'La branche est créée et HEAD s’y rattache en une commande.' },
        { command: 'git add .', explanation: 'Le README modifié passe dans l’index.' },
        { command: 'git commit -m "docs: finale"', explanation: 'Seule docs-final avance.' },
        { command: 'git switch main', explanation: 'main retrouve sa version du README : rien n’a été livré.' },
      ],
    },
    {
      kind: 'recap',
      title: 'Antisèche du chapitre',
      commands: [
        { command: 'git commit -m "msg" <fichier>', description: 'Commite ce seul chemin, sans git add préalable.' },
        { command: 'git switch -c <branche>', description: 'Crée la branche et bascule dessus en une commande.' },
        { command: 'git switch -c <branche> <start>', description: 'Crée la branche depuis un commit ou une branche.' },
        { command: 'git add .', description: 'Indexe tout le working dir, nouveaux fichiers compris.' },
        { command: 'git commit -am "msg"', description: 'Indexe et commite les fichiers déjà suivis seulement.' },
        { command: 'git log --oneline --graph', description: 'Résume l’historique sur une ligne par commit.' },
      ],
    },
  ],
};
