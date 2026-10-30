import { scenario } from '../../../engine/scenario';
import type { Lesson } from '../../types';

const demo = scenario()
  .init()
  .commit('Initial commit', {
    'README.md': '# Projet Nova',
    'bug.txt': 'bug critique',
  })
  .build();

export const lesson04: Lesson = {
  id: 'lesson-worktrees',
  title: 'Worktrees',
  minutes: 5,
  slides: [
    {
      kind: 'text',
      title: 'Le problème du seul bureau',
      paragraphs: [
        'Un dépôt classique n’a qu’un working dir et qu’un HEAD. Impossible d’être sur deux branches à la fois sans stash ou commit temporaire.',
        'Un worktree ajoute un second bureau relié au même dépôt : son propre HEAD, son index, ses fichiers.',
      ],
      note: 'Les commits et les branches restent partagés entre tous les worktrees.',
    },
    {
      kind: 'diagram',
      title: 'Un dépôt, plusieurs bureaux',
      diagram: 'worktrees',
      caption: 'Chaque worktree a sa branche et son working dir ; le dépôt est commun.',
    },
    {
      kind: 'demo',
      title: 'Corriger sans quitter son travail',
      initialState: demo,
      caption: 'Le worktree principal reste sur main pendant que hotfix travaille ailleurs.',
      steps: [
        {
          command: 'git worktree add ../gitquest-hotfix -b hotfix',
          explanation: 'Une branche hotfix et un worktree séparé apparaissent.',
        },
        { command: 'cd ../gitquest-hotfix', explanation: 'Le terminal change de bureau : HEAD est celui de hotfix.' },
        { command: 'edit bug.txt "corrigé"', explanation: 'Le fichier est modifié dans le worktree hotfix uniquement.' },
        { command: 'git add bug.txt', explanation: 'L’index du worktree hotfix est mis à jour.' },
        { command: 'git commit -m "fix: bug"', explanation: 'hotfix avance ; main et son working dir ne bougent pas.' },
        { command: 'cd ../gitquest', explanation: 'Retour au worktree principal, toujours sur main.' },
      ],
    },
    {
      kind: 'text',
      title: 'Lister, nettoyer, partager',
      paragraphs: [
        'git worktree list montre tous les bureaux. Une branche ne peut être checkout que dans un seul worktree à la fois.',
        'git worktree remove refuse un worktree sale ; --force jette les modifications. La branche, elle, survit à la suppression du worktree.',
        'Un commit créé dans un worktree est immédiatement visible depuis les autres : le dépôt est partagé.',
      ],
      command: 'git worktree list',
    },
    {
      kind: 'recap',
      title: 'Antisèche du chapitre',
      commands: [
        { command: 'git worktree add <chemin> <branche>', description: 'Ouvre un worktree sur une branche existante.' },
        { command: 'git worktree add <chemin> -b <nom> [<start>]', description: 'Crée la branche puis le worktree.' },
        { command: 'git worktree list', description: 'Liste chemins, commits et branches.' },
        { command: 'git worktree remove <chemin>', description: 'Supprime un worktree propre.' },
        { command: 'cd <chemin>', description: 'Change de worktree actif dans GitQuest.' },
      ],
    },
  ],
};
