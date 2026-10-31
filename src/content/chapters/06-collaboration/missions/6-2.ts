import { entryState } from '../../../../story/checkpoints';
import {
  allOf,
  branchTip,
  check,
  headBranch,
  headFile,
  isMergeInProgress,
  remoteBranchTip,
  upstreamRef,
} from '../../../../engine/validate';
import type { Mission } from '../../../types';

const initial = entryState('pull-equipe');
const TEAM_NOTIFY = "export const notify = (message: string) => 'Nova: ' + message;";

export const mission62: Mission = {
  id: 'pull-equipe',
  chapterId: 'collaboration',
  order: 2,
  number: '6.2',
  title: 'Le commit du coéquipier',
  story:
    "Pendant que tu documentais, Léa a poussé un préfixe de notifications sur origin/main. Ton main local est resté une version en arrière, et ton push serait refusé.",
  situation:
    'origin/main a un commit que ta branche main ne possède pas ; ton dépôt local est propre.',
  objective: 'Récupère le travail de Léa et fais avancer main sans commit de fusion.',
  steps: [
    {
      label: 'Faire avancer main sur origin/main',
      done: (state) =>
        branchTip(state, 'main') === remoteBranchTip(state, 'origin', 'main'),
    },
    {
      label: 'Récupérer src/notify.ts',
      done: (state) => headFile(state, 'src/notify.ts') === TEAM_NOTIFY,
    },
  ],
  takeaway:
    'Quand ta branche n’a pas divergé, git pull fait une avance rapide : aucun merge commit inutile, et ton historique reste linéaire.',
  difficulty: 1,
  par: 1,
  initialState: initial,
  validate: (state) => {
    const tip = branchTip(state, 'main');
    const remoteTip = remoteBranchTip(state, 'origin', 'main');
    return allOf(
      check(headBranch(state) === 'main', 'HEAD doit rester sur main.'),
      check(!isMergeInProgress(state), 'La récupération doit être terminée, sans conflit ouvert.'),
      check(remoteTip !== undefined, 'origin/main doit exister.'),
      check(tip === remoteTip, 'main doit pointer sur le commit de origin/main.'),
      check(
        headFile(state, 'src/notify.ts') === TEAM_NOTIFY,
        'Le working dir doit contenir la version de Léa.',
      ),
      check(upstreamRef(state, 'main') === 'origin/main', 'main doit garder son upstream.'),
    );
  },
  hints: [
    'Ton main est en retard : inutile de commiter, il faut récupérer les commits du serveur.',
    'git fetch met à jour origin/main ; git pull va plus loin et fusionne.',
    'git pull (ou git pull origin main).',
  ],
  solution: ['git pull'],
  predictions: [
    {
      trigger: (parsed) => parsed.kind === 'git-pull',
      question: 'Que va faire git pull ici ?',
      options: [
        { id: 'fetch', label: 'Récupérer seulement, sans toucher à main' },
        { id: 'ff', label: 'Récupérer puis avancer main (fast-forward)' },
        { id: 'push', label: 'Pousser ton main local vers le serveur' },
      ],
      correctOptionId: 'ff',
      explanation:
        'Ton main est un ancêtre direct de origin/main : la fusion se réduit à déplacer l’étiquette. Aucun commit de fusion n’est créé.',
    },
  ],
  suggestedCommands: ['git status', 'git fetch', 'git log --oneline --graph', 'git pull'],
};
