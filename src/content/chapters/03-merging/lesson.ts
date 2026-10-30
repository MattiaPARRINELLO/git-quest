import { scenario } from '../../../engine/scenario';
import type { Lesson } from '../../types';

const demo = scenario()
  .init()
  .commit('Initial commit', { 'README.md': '# Projet Nova' })
  .branch('feature')
  .checkout('feature')
  .commit('feat: notifications', { 'src/notify.ts': "export const notify = () => 'ok';" })
  .checkout('main')
  .commit('fix: configuration', { 'src/config.ts': 'export const config = {};' })
  .build();

export const lesson03: Lesson = {
  id: 'lesson-merging',
  title: 'Fusionner',
  minutes: 5,
  slides: [
    {
      kind: 'text',
      title: 'Deux histoires, une seule branche',
      paragraphs: [
        'git merge rapproche une branche de la branche courante. Git choisit automatiquement entre avance rapide et commit de fusion.',
        'Le critère est simple : la cible est-elle déjà un ancêtre de HEAD, ou les deux lignes ont-elles divergé ?',
      ],
      command: 'git merge feature',
    },
    {
      kind: 'diagram',
      title: 'Avance rapide ou point de convergence',
      diagram: 'merge-modes',
      caption: 'Fast-forward = déplacer l’étiquette. Merge commit = créer un nœud à deux parents.',
    },
    {
      kind: 'text',
      title: 'Fast-forward : rien à créer',
      paragraphs: [
        'Si main est un ancêtre direct de feature, Git déplace simplement main sur le commit de feature.',
        'Aucun commit n’est créé, l’historique reste linéaire. C’est le cas quand main n’a pas avancé pendant le travail.',
      ],
    },
    {
      kind: 'demo',
      title: 'Créer un merge commit',
      initialState: demo,
      caption: 'Les deux branches divergent : Git relie les deux parents.',
      steps: [
        {
          command: 'git merge feature',
          explanation: 'Un commit de fusion apparaît avec deux parents : main et feature.',
        },
        {
          command: 'git switch feature',
          explanation: 'HEAD peut encore visiter feature, dont l’étiquette n’a pas bougé.',
        },
        {
          command: 'git switch main',
          explanation: 'main contient désormais les deux lignes d’historique.',
        },
      ],
    },
    {
      kind: 'text',
      title: 'Déjà à jour, et nettoyage',
      paragraphs: [
        'Si la cible est déjà contenue dans HEAD, Git répond « Already up to date. » et ne fait rien.',
        'Une branche fusionnée peut être supprimée avec git branch -d. Git refuse si des commits seraient perdus ; -D force.',
      ],
      command: 'git branch -d feature',
      note: 'Les conflits existent dans Git réel mais sont hors du périmètre de GitQuest.',
    },
    {
      kind: 'recap',
      title: 'Antisèche du chapitre',
      commands: [
        { command: 'git merge <branche>', description: 'Fusionne la branche dans HEAD.' },
        { command: 'git log --oneline --graph', description: 'Visualise la forme de l’historique.' },
        { command: 'git branch -d <branche>', description: 'Supprime une branche fusionnée.' },
        { command: 'git branch -D <branche>', description: 'Force la suppression.' },
      ],
    },
  ],
};
