import { Scenario, scenario } from '../../../../engine/scenario';
import {
  allOf,
  branchTip,
  check,
  commitCount,
  hasBranch,
  headBranch,
  headFile,
  workingFile,
} from '../../../../engine/validate';
import type { Mission } from '../../../types';

const base = scenario()
  .init()
  .commit('Initial commit', {
    'README.md': '# Projet Nova',
    'src/app.ts': "export const app = 'nova';",
  })
  .branch('feature-login')
  .checkout('feature-login')
  .commit('feat: formulaire de connexion', {
    'src/login.ts': "export const login = () => 'ok';",
  })
  .checkout('main')
  .run('git merge feature-login')
  .build();

const initial = Scenario.from(base)
  .branch('experiment')
  .checkout('experiment')
  .commit('exp: test de cache', {
    'exp.txt': 'expérience',
  })
  .checkout('main')
  .build();

const initialMainTip = initial.branches.main ?? '';
const experimentTip = initial.branches.experiment ?? '';
const initialCount = Object.keys(initial.commits).length;

export const mission33: Mission = {
  id: 'menage-branches',
  chapterId: 'merging',
  order: 3,
  number: '3.3',
  title: 'Le ménage',
  story:
    "Un collègue est parti en laissant deux branches derrière lui. feature-login est déjà fusionnée dans main ; experiment, elle, contient un test de cache jamais intégré. Le lead veut un nettoyage propre : constater le refus de -d sur la branche non fusionnée, puis choisir consciemment entre la merger ou forcer sa suppression.",
  objective:
    'Supprime feature-login et experiment. Pour experiment : tente -d, puis fusionne-la ou utilise -D.',
  difficulty: 3,
  par: 3,
  initialState: initial,
  validate: (state) => {
    const merged = branchTip(state, 'main') === experimentTip;
    const forced = branchTip(state, 'main') === initialMainTip;
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
      check(commitCount(state) === initialCount, 'Aucun commit supplémentaire ne doit être créé.'),
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
