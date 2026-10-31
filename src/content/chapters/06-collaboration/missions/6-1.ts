import { entryState } from '../../../../story/checkpoints';
import {
  allOf,
  branchTip,
  check,
  headBranch,
  hasRemote,
  remoteBranchTip,
  remoteTrackingTip,
  remoteUrl,
  upstreamRef,
} from '../../../../engine/validate';
import type { Mission } from '../../../types';

const initial = entryState('premier-push');
const ORIGIN = 'git@github.com:nova/nova.git';

export const mission61: Mission = {
  id: 'premier-push',
  chapterId: 'collaboration',
  order: 1,
  number: '6.1',
  title: 'Mettre Nova en ligne',
  story:
    "Nova doit enfin vivre ailleurs que sur ta machine. L’équipe a créé le dépôt GitHub, mais il est vide : c’est toi qui poses la première pierre.",
  situation:
    'Ton dépôt local contient tout l’historique, mais aucun remote n’est configuré.',
  objective: 'Relie ton dépôt à origin, publie main et pose son upstream.',
  steps: [
    {
      label: 'Configurer le remote origin',
      done: (state) => hasRemote(state, 'origin'),
    },
    {
      label: 'Publier main sur le serveur',
      done: (state) => {
        const tip = branchTip(state, 'main');
        return tip !== undefined && remoteBranchTip(state, 'origin', 'main') === tip;
      },
    },
    {
      label: 'Relier main à origin/main',
      done: (state) => upstreamRef(state, 'main') === 'origin/main',
    },
  ],
  takeaway:
    'git remote add déclare l’adresse, git push -u publie la branche et enregistre son upstream : ensuite push et pull n’ont plus besoin d’arguments.',
  difficulty: 1,
  par: 2,
  initialState: initial,
  validate: (state) => {
    const tip = branchTip(state, 'main');
    return allOf(
      check(headBranch(state) === 'main', 'HEAD doit rester sur main.'),
      check(hasRemote(state, 'origin'), 'Le remote origin doit exister.'),
      check(remoteUrl(state, 'origin') === ORIGIN, 'origin doit pointer vers l’URL du projet.'),
      check(tip !== undefined, 'main doit avoir un commit.'),
      check(
        remoteBranchTip(state, 'origin', 'main') === tip,
        'origin/main doit pointer sur le même commit que main.',
      ),
      check(
        upstreamRef(state, 'main') === 'origin/main',
        'main doit suivre origin/main (pense à -u).',
      ),
      check(
        remoteTrackingTip(state, 'origin/main') === tip,
        'La référence de suivi origin/main doit être à jour.',
      ),
    );
  },
  hints: [
    'Il manque le lien entre ton dépôt et GitHub : commence par git remote add.',
    'git push envoie les commits ; -u enregistre en plus la branche amont.',
    'git remote add origin git@github.com:nova/nova.git, puis git push -u origin main.',
  ],
  solution: [`git remote add origin ${ORIGIN}`, 'git push -u origin main'],
  predictions: [
    {
      trigger: (parsed) => parsed.kind === 'git-push',
      question: 'Après git push -u origin main, où vivent les commits ?',
      options: [
        { id: 'local', label: 'Seulement sur ta machine' },
        { id: 'both', label: 'Sur origin et en local, à l’identique' },
        { id: 'remote-only', label: 'Seulement sur origin' },
      ],
      correctOptionId: 'both',
      explanation:
        'Un push publie une copie : ton dépôt local garde tout son historique, et origin/main pointe sur le même commit.',
    },
  ],
  suggestedCommands: ['git remote -v', 'git status', `git remote add origin ${ORIGIN}`, 'git push -u origin main'],
};
