import {
  allOf,
  branchFile,
  check,
  hasBranch,
  headBranch,
  headFile,
  workingFile,
} from '../../../../engine/validate';
import { entryState } from '../../../../story/checkpoints';
import { branchUnchanged, commitDelta } from '../../../../story/preconditions';
import type { Mission } from '../../../types';

const initial = entryState('menage-branches');

export const mission33: Mission = {
  id: 'menage-branches',
  chapterId: 'merging',
  order: 3,
  number: '3.3',
  title: 'Le ménage',
  story:
    "Un collègue est parti en laissant deux branches derrière lui. feature-login est déjà fusionnée dans main ; experiment, elle, contient un test de cache jamais intégré. Le lead veut un nettoyage propre : constater le refus de -d sur la branche non fusionnée, puis choisir consciemment entre la merger ou forcer sa suppression.",
  situation:
    'feature-login est déjà fusionnée ; experiment contient un commit jamais intégré à main.',
  objective:
    'Supprime feature-login et experiment. Pour experiment : tente -d, puis fusionne-la ou utilise -D.',
  steps: [
    {
      label: 'Supprimer feature-login',
      done: (state) => !hasBranch(state, 'feature-login'),
    },
    {
      label: 'Supprimer experiment',
      done: (state) => !hasBranch(state, 'experiment'),
    },
    {
      label: 'Choisir consciemment le sort d’experiment',
      done: (state, ctx) => {
        const entry = ctx?.entry ?? initial;
        return (
          !hasBranch(state, 'experiment') &&
          (branchFile(state, 'main', 'exp.txt') === 'expérience' ||
            branchUnchanged(state, entry, 'main'))
        );
      },
    },
  ],
  takeaway:
    'git branch -d vérifie que la branche est fusionnée ; -D force la suppression, avec un risque assumé.',
  difficulty: 3,
  par: 3,
  initialState: initial,
  validate: (state, ctx) => {
    const entry = ctx?.entry ?? initial;
    const merged = branchFile(state, 'main', 'exp.txt') === 'expérience';
    const forced = branchUnchanged(state, entry, 'main');
    return allOf(
      check(headBranch(state) === 'main', 'HEAD doit rester sur main.'),
      check(!hasBranch(state, 'feature-login'), 'La branche feature-login doit être supprimée.'),
      check(!hasBranch(state, 'experiment'), 'La branche experiment doit être supprimée.'),
      check(
        merged || forced,
        'Choisis consciemment : fusionner experiment puis -d, ou forcer avec -D.',
      ),
      check(
        merged ? headFile(state, 'exp.txt') === 'expérience' : workingFile(state, 'exp.txt') === undefined,
        merged
          ? 'La fusion doit intégrer exp.txt.'
          : 'La suppression forcée doit laisser main inchangée.',
      ),
      check(commitDelta(state, entry) === 0, 'Aucun commit supplémentaire ne doit être créé.'),
    );
  },
  validateAttempt: (commands) =>
    check(
      commands.some((command) => command.trim().replace(/\s+/g, ' ') === 'git branch -d experiment'),
      'Essaie d’abord git branch -d experiment et observe le refus de Git.',
    ),
  hints: [
    'feature-login est déjà fusionnée : git branch -d doit passer directement.',
    'Sur experiment, git branch -d échoue avec « not fully merged ». Tu peux alors fusionner puis -d, ou forcer avec -D.',
    'git branch -d feature-login, git merge experiment, git branch -d experiment. Alternative : git branch -D experiment (après avoir constaté le refus de -d).',
  ],
  solution: [
    'git branch -d feature-login',
    'git merge experiment',
    'git branch -d experiment',
  ],
  successNote: 'Deux branches rangées, aucun commit perdu par accident.',
};
