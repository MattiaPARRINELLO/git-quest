import { entryState } from '../../../../story/checkpoints';
import {
  allOf,
  branchTip,
  check,
  headBranch,
  headFile,
  isMergeInProgress,
  isWorkingTreeClean,
} from '../../../../engine/validate';
import type { Mission } from '../../../types';

const initial = entryState('conflit-docs');
const MERGED = '# Nova — guide (version finale)';
const OURS = '# Nova — guide (version locale)';
const THEIRS = '# Nova — guide (version équipe)';

/** Contenu écrit par le joueur : ni marqueurs, ni simple copie d’un des deux côtés. */
function isResolved(content: string | undefined): boolean {
  const value = (content ?? '').trim();
  return (
    value !== '' &&
    !value.includes('<<<<<<<') &&
    !value.includes('=======') &&
    !value.includes('>>>>>>>') &&
    value !== OURS &&
    value !== THEIRS
  );
}

export const mission34: Mission = {
  id: 'conflit-docs',
  chapterId: 'merging',
  order: 4,
  number: '3.4',
  title: 'Le guide déchiré',
  story:
    "Samir a réécrit le guide sur sa branche pendant que tu corrigeais la même page sur main. Les deux versions sont parties du même paragraphe, et Git ne peut pas choisir à votre place.",
  situation:
    'main et doc-conflit ont modifié la même ligne de README.md depuis la même base.',
  objective: 'Fusionne doc-conflit et livre une seule version de README.md.',
  steps: [
    {
      label: 'Lancer la fusion et constater le conflit',
      done: (state) =>
        isMergeInProgress(state) ||
        (state.commits[branchTip(state, 'main') ?? '']?.parents.length ?? 0) === 2,
    },
    {
      label: 'Écrire la version finale de README.md',
      done: (state) =>
        isResolved(state.worktrees[state.activeWorktree]?.workingDir['README.md']),
    },
    {
      label: 'Conclure la fusion',
      done: (state) =>
        !isMergeInProgress(state) &&
        (state.commits[branchTip(state, 'main') ?? '']?.parents.length ?? 0) === 2,
    },
  ],
  takeaway:
    'Un conflit n’est pas une erreur : Git s’arrête, écrit les deux versions, et tu choisis le contenu final avant de conclure avec git add puis git commit.',
  difficulty: 3,
  par: 4,
  initialState: initial,
  validate: (state) =>
    allOf(
      check(headBranch(state) === 'main', 'HEAD doit rester sur main.'),
      check(!isMergeInProgress(state), 'La fusion doit être terminée, pas laissée en conflit.'),
      check(
        (state.commits[branchTip(state, 'main') ?? '']?.parents.length ?? 0) === 2,
        'Le sommet de main doit être un commit de fusion à deux parents.',
      ),
      check(
        isResolved(headFile(state, 'README.md')),
        'README.md doit contenir une version fusionnée, sans marqueurs.',
      ),
      check(isWorkingTreeClean(state), 'Le working dir doit être propre après la fusion.'),
    ),
  hints: [
    'La fusion va s’arrêter : ce n’est pas un échec, c’est Git qui te passe la main.',
    'Ouvre README.md : les deux versions sont entre <<<<<<< et >>>>>>>. Garde une seule ligne, celle que tu veux livrer.',
    'Après l’édition : git add README.md, puis git merge --continue.',
  ],
  solution: ['git merge doc-conflit', `edit README.md "${MERGED}"`, 'git add README.md', 'git merge --continue'],
  predictions: [
    {
      trigger: (parsed) => parsed.kind === 'git-merge',
      question: 'Que va faire Git en fusionnant doc-conflit ?',
      options: [
        { id: 'ff', label: 'Avancer main sans commit' },
        { id: 'merge', label: 'Créer un merge commit directement' },
        { id: 'conflict', label: 'S’arrêter en conflit' },
      ],
      correctOptionId: 'conflict',
      explanation:
        'Les deux branches ont modifié la même ligne de README.md : Git ne peut pas choisir, il écrit les deux versions et attend ta décision.',
    },
  ],
  suggestedCommands: ['git status', 'git merge doc-conflit', 'cat README.md', 'git add README.md'],
};
