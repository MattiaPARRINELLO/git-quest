import { Scenario, scenario } from '../../../engine/scenario';
import type { Lesson } from '../../types';

const ORIGIN = 'git@github.com:nova/nova.git';

const pushed = scenario()
  .init()
  .commit('docs: cadrage', { 'README.md': '# Nova' })
  .remote('origin', ORIGIN)
  .run('git push -u origin main')
  .build();

const demo = Scenario.from(pushed)
  .remoteCommit('origin', 'main', 'feat: accroche de l’équipe', {
    'README.md': '# Nova — accroche de l’équipe',
  })
  .build();

export const lesson06: Lesson = {
  id: 'lesson-collaboration',
  title: 'Collaborer',
  slides: [
    {
      kind: 'text',
      title: 'Un dépôt, deux machines',
      paragraphs: [
        'Jusqu’ici ton dépôt vivait seul. Sur un projet d’équipe, il existe une copie de référence sur un serveur : GitHub, GitLab ou un dépôt interne. On l’appelle le remote.',
        'git remote add origin <url> enregistre cette adresse. Rien n’est copié à ce moment-là : origin est juste un nom qui pointe vers une URL.',
        'origin/main désigne la dernière version connue de main sur le serveur. C’est une mémoire locale, pas le serveur lui-même.',
      ],
      command: 'git remote add origin git@github.com:nova/nova.git',
      note: 'origin est le nom conventionnel du dépôt principal.',
    },
    {
      kind: 'text',
      title: 'Publier avec push et upstream',
      paragraphs: [
        'git push -u origin main envoie tes commits sur origin et relie ta branche locale main à origin/main : c’est l’upstream.',
        'Une fois l’upstream posé, git push et git pull savent où aller sans argument.',
        'Git refuse un push qui n’est pas un avancement rapide du serveur. Ce refus protège le travail des autres : il faut d’abord récupérer leurs commits.',
      ],
      command: 'git push -u origin main',
      note: 'Rejet classique : « Updates were rejected because the remote contains work that you do not have locally ».',
    },
    {
      kind: 'text',
      title: 'fetch n’est pas pull',
      paragraphs: [
        'git fetch télécharge les nouveaux commits et met à jour origin/main, sans toucher à tes branches locales : tu peux inspecter avant d’intégrer.',
        'git pull = git fetch, puis une fusion de origin/main dans ta branche courante : avance rapide si tu n’as rien commité, merge commit sinon.',
        'Si les deux côtés ont modifié la même ligne, le pull s’arrête en conflit, exactement comme un merge.',
      ],
      command: 'git pull',
      note: 'En cas de doute : git fetch, puis git status, puis git pull.',
    },
    {
      kind: 'demo',
      title: 'Un coéquipier a poussé',
      initialState: demo,
      caption: 'Suis origin/main : le serveur avance avant ton dépôt local.',
      steps: [
        {
          command: 'git fetch',
          explanation:
            'origin/main avance sur le commit du coéquipier ; ta branche main et ton disque ne bougent pas.',
        },
        {
          command: 'git status',
          explanation: 'Git annonce que ta branche est en retard et peut être avancée rapidement.',
        },
        {
          command: 'git pull',
          explanation:
            'La fusion fait avancer main jusqu’à origin/main : ton fichier README est mis à jour.',
        },
      ],
    },
    {
      kind: 'recap',
      title: 'Antisèche du chapitre',
      commands: [
        { command: 'git remote -v', description: 'Affiche les dépôts distants et leurs URL.' },
        { command: 'git remote add origin <url>', description: 'Enregistre un dépôt distant.' },
        { command: 'git push -u origin main', description: 'Publie main et pose son upstream.' },
        { command: 'git fetch', description: 'Récupère sans fusionner.' },
        { command: 'git pull', description: 'Récupère puis fusionne dans la branche courante.' },
        { command: 'git status', description: 'Montre l’avance ou le retard sur origin/main.' },
      ],
    },
  ],
};
