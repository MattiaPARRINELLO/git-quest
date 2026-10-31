import { scenario } from '../../../engine/scenario';
import type { Lesson } from '../../types';

const conflictDemo = scenario()
  .init()
  .commit('Initial commit', { 'README.md': 'Titre' })
  .branch('feature')
  .checkout('feature')
  .commit('docs: accroche équipe', { 'README.md': 'Titre — équipe' })
  .checkout('main')
  .commit('docs: accroche locale', { 'README.md': 'Titre — local' })
  .build();

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
        'Une branche fusionnée peut être supprimée avec git branch -d. Si elle ne l’est pas, Git refuse avec « The branch … is not fully merged ».',
        'Deux choix conscients : fusionner d’abord puis -d, ou forcer avec -D. -D jette les commits non référencés : à utiliser en connaissance de cause.',
      ],
      command: 'git branch -d feature',
      note: 'Une branche fusionnée est une branche dont les commits sont déjà dans HEAD.',
    },
    {
      kind: 'text',
      title: 'Quand les deux côtés touchent la même ligne',
      paragraphs: [
        'Git fusionne fichier par fichier. Si les deux branches ont modifié le même fichier de façons différentes, il ne peut pas choisir : la fusion s’arrête en conflit.',
        'Git écrit les deux versions dans le fichier, entre <<<<<<< HEAD, ======= et >>>>>>>. Ce n’est pas une erreur : c’est à toi de décider du résultat.',
        'Tu édites le fichier, tu retires les marqueurs, puis git add marque le conflit comme résolu. git commit (ou git merge --continue) crée enfin le commit de fusion.',
      ],
      command: 'git add README.md',
      note: 'git merge --abort annule tout et restaure l’état d’avant la fusion.',
    },
    {
      kind: 'demo',
      title: 'Résoudre un conflit',
      initialState: conflictDemo,
      caption: 'La fusion s’arrête, le fichier porte les deux versions : à toi de trancher.',
      steps: [
        {
          command: 'git merge feature',
          explanation:
            'CONFLICT : README.md contient maintenant les deux accroches entre les marqueurs.',
        },
        {
          command: 'edit README.md "Titre — final"',
          explanation: 'Tu choisis le texte final et tu retires les marqueurs.',
        },
        {
          command: 'git add README.md',
          explanation: 'Le conflit est marqué résolu : la version du disque sera commitée.',
        },
        {
          command: 'git merge --continue',
          explanation: 'Le commit de fusion à deux parents est créé, la fusion est terminée.',
        },
      ],
    },
    {
      kind: 'recap',
      title: 'Antisèche du chapitre',
      commands: [
        { command: 'git merge <branche>', description: 'Fusionne la branche dans HEAD.' },
        { command: 'git log --oneline --graph', description: 'Visualise la forme de l’historique.' },
        { command: 'git branch -d <branche>', description: 'Supprime une branche fusionnée.' },
        { command: 'git add <fichier>', description: 'Marque un conflit comme résolu.' },
        { command: 'git merge --continue', description: 'Termine la fusion après résolution.' },
        { command: 'git merge --abort', description: 'Annule une fusion en conflit.' },
        { command: 'git branch -D <branche>', description: 'Force la suppression.' },
      ],
    },
  ],
};
