import { scenario } from '../../../engine/scenario';
import type { Lesson } from '../../types';

const demo = scenario()
  .init()
  .commit('Initial commit', { 'README.md': '# Projet Nova' })
  .commit('feat: API', { 'src/api.ts': "export const api = 'v1';" })
  .build();

const oldest = Object.values(demo.commits).sort(
  (left, right) => left.timestamp - right.timestamp,
)[0];
if (!oldest) throw new Error('Contenu invalide : commit racine absent');

export const lesson02: Lesson = {
  id: 'lesson-branches',
  title: 'Les branches',
  minutes: 5,
  slides: [
    {
      kind: 'text',
      title: 'Créer une branche ne change rien',
      paragraphs: [
        'git branch <nom> crée une étiquette sur le commit courant. HEAD reste où il est : tu n’as pas encore changé de contexte.',
        'Pour travailler sur la nouvelle branche, il faut un second geste : git switch <nom>.',
      ],
      command: 'git branch feature',
      note: 'Deux étiquettes peuvent pointer sur le même commit sans aucun conflit.',
    },
    {
      kind: 'diagram',
      title: 'Des étiquettes, pas des copies',
      diagram: 'branch-pointer',
      caption: 'Une branche devient intéressante quand elle avance toute seule.',
    },
    {
      kind: 'demo',
      title: 'Faire diverger deux lignes',
      initialState: demo,
      caption: 'feature avance, main reste immobile, puis HEAD revient.',
      steps: [
        { command: 'git branch feature', explanation: 'L’étiquette feature rejoint main sur le même commit.' },
        { command: 'git switch feature', explanation: 'HEAD se rattache à feature.' },
        { command: 'edit notes.txt "idée"', explanation: 'Une modification locale apparaît dans le working dir.' },
        { command: 'git add notes.txt', explanation: 'L’index est prêt pour la photo.' },
        { command: 'git commit -m "feat: note"', explanation: 'feature avance ; main ne bouge pas.' },
        { command: 'git switch main', explanation: 'HEAD revient sur main, notes.txt quitte le working dir.' },
        { command: `git checkout ${oldest.hash.slice(0, 7)}`, explanation: 'HEAD se détache : il pointe sur le commit, pas sur une branche.' },
        { command: 'git switch main', explanation: 'HEAD se rattache à nouveau à main. Les commits détachés resteraient orphelins.' },
      ],
    },
    {
      kind: 'diagram',
      title: 'HEAD attaché ou détaché',
      diagram: 'head-states',
      caption: 'Détaché = tu regardes un commit. Les nouvelles photos n’ont plus d’étiquette.',
    },
    {
      kind: 'text',
      title: 'Sortir d’un HEAD détaché',
      paragraphs: [
        'Un commit créé en HEAD détaché n’appartient à aucune branche : Git te prévient quand tu reparts ailleurs.',
        'Deux sorties propres : revenir sur une branche avec git switch, ou créer une branche sur place avec git switch -c.',
        'Pour rescuer un commit déjà orphelin : git branch <nom> <hash>.',
      ],
      command: 'git switch -c sauvetage',
    },
    {
      kind: 'recap',
      title: 'Antisèche du chapitre',
      commands: [
        { command: 'git branch <nom>', description: 'Crée une étiquette sans bouger HEAD.' },
        { command: 'git branch <nom> <hash>', description: 'Crée une étiquette sur un commit précis.' },
        { command: 'git switch <nom>', description: 'Rattache HEAD à une branche.' },
        { command: 'git switch -c <nom>', description: 'Crée la branche et s’y rattache.' },
        { command: 'git checkout <hash>', description: 'Détache HEAD sur un commit.' },
        { command: 'git branch -d <nom>', description: 'Supprime une branche fusionnée ; -D force.' },
      ],
    },
  ],
};
