import type { BriefingText } from '../types';

export const briefingsText: Readonly<Record<string, BriefingText>> = {
  'trois-zones': {
    title: 'Nova, act I: the fix that cannot wait',
    lines: [
      'Nova is the team’s note-taking assistant. This morning, two files were modified: a.txt and b.txt.',
      'The a.txt fix ships at noon. b.txt can wait until tomorrow.',
      'Prepare a snapshot that contains only a.txt, without dragging in the rest of the work.',
    ],
    outcome:
      'The a.txt fix left on its own; the b.txt ideas are still waiting on your disk.',
    teaser: 'The CTO now wants proof that this snapshot will not move.',
  },
  'snapshot-fige': {
    title: 'Nova, act I: the snapshot no longer moves',
    lines: [
      'The disk is already on v3, but the index stayed on v2. What will the commit photograph?',
      'The CTO wants proof: commit the index without running git add again, and watch what stays on disk.',
    ],
    outcome: 'The snapshot is frozen on v2: v3 stayed on disk, outside the commit.',
    teaser: 'A teammate swears that -am is enough to ship everything.',
  },
  'piege-am': {
    title: 'Nova, act I: the shortcut that betrays',
    lines: [
      'git commit -am takes care of everything, right? No need to stage anything.',
      'The ADR just arrived, and README.md was touched up.',
      'Check what -am really photographs, and ship both files without leaving dirty work behind.',
    ],
    outcome:
      'The README and the notes left together; the -am reflex showed its limit on the ADR.',
    teaser: 'The team wants to explore an idea without touching main.',
  },
  'branche-pointeur': {
    title: 'Nova, act II: an idea apart',
    lines: [
      'We want to test internal notes without polluting main. I am handing you the exploration.',
      'notes.txt is already modified. Create experiment, commit the change on it, and prove that main has not moved.',
    ],
    outcome: 'experiment carries your notes, main has not moved a pixel.',
    teaser: 'Billing must move forward in parallel with configuration.',
  },
  'qui-avance': {
    title: 'Nova, act II: two workstreams in parallel',
    lines: [
      'Billing is going on its own branch; configuration moves forward on main.',
      'feature.ts and main.ts are already written. Commit each one on the right branch, then go back to main to check which one moved.',
    ],
    outcome:
      'Two parallel lines, two distinct labels: each commit moved the right one.',
    teaser: 'A regression in billing is waiting for you on an old commit.',
  },
  'commit-perdu': {
    title: 'Nova, act II: the experiment that escapes',
    lines: [
      'Billing has regressed. Go back to an old commit to investigate.',
      'exp.txt is already ready. Commit it on a detached HEAD, go back to main, then save the orphan in a branch.',
    ],
    outcome: 'The experiment is saved: sauvetage keeps it accessible, even detached.',
    teaser: 'The CSV export is ready, main stayed behind.',
  },
  'avance-rapide': {
    title: 'Nova, act III: ship without ceremony',
    lines: [
      'The CSV export is ready, and main has not moved since.',
      'Ship without a merge commit: here, a fast-forward is enough.',
    ],
    outcome: 'main slid onto the work already done, without a merge commit.',
    teaser: 'Notifications and configuration have diverged.',
  },
  'merge-commit': {
    title: 'Nova, act III: the convergence point',
    lines: [
      'Notifications on one side, configuration on the other: both lines moved forward.',
      'We need a convergence point, not a winning side.',
    ],
    outcome:
      'The merge commit links both lines: nobody lost their work.',
    teaser: 'Inès left two branches behind her.',
  },
  'menage-branches': {
    title: 'Nova, act III: the badly ordered closet',
    lines: [
      'I am leaving: feature-login is merged, but experiment contains a test that was never integrated.',
      'Start by seeing -d refuse on experiment. Then choose deliberately: merge, or force.',
    ],
    outcome:
      'The closet is tidy: feature-login deleted, experiment handled deliberately.',
    teaser: 'A critical bug lands in the middle of the refactor.',
  },
  'hotfix-worktree': {
    title: 'Nova, act IV: the production bug',
    lines: [
      'I pushed the login fix on the hotfix branch.',
      'Your WIP on feature blocks the switch to main. Set up a second workspace on hotfix to check it, without dropping the refactor.',
    ],
    outcome:
      'The fix is verified from a second desk, your WIP has not moved.',
    teaser: 'The docs must move forward while you rewrite the README.',
  },
  'deux-worktrees': {
    title: 'Nova, act IV: two hats',
    lines: [
      'The guide is already committed on the docs branch.',
      'I took over your refactor and committed your WIP: you can switch to main.',
      'Set up a worktree on docs to review the guide, without interrupting your README in progress.',
    ],
    outcome: 'The guide is reviewed from its worktree, main keeps your draft.',
    teaser: 'The temporary worktree is still lying on disk.',
  },
  'menage-worktree': {
    title: 'Nova, act IV: clear the site',
    lines: [
      'The hotfix is shipped, but the temporary worktree is still lying around.',
      'Clean removal: delete the workspace, keep the branch and the fix.',
    ],
    outcome: 'The site is cleared; branches and history remain.',
    teaser: 'Time to save time on everyday moves.',
  },
  'commit-cible': {
    title: 'Nova, act V: the fix that leaves alone',
    lines: [
      'The config must ship now; the docs wait for tomorrow’s review.',
      'Three files changed, only one must be committed. Do it without git add.',
    ],
    outcome:
      'The configuration ships alone; the docs and the refactor stay on disk.',
    teaser: 'The final documentation deserves its own branch.',
  },
  'branche-en-une-commande': {
    title: 'Nova, act V: a branch for the docs',
    lines: [
      'The final docs are ready, but there is no question of putting them on main right away.',
      'Create the docs-final branch and switch to it in a single command, then commit the README alone.',
    ],
    outcome: 'The docs live on docs-final; main has not moved a single commit.',
    teaser: 'Final sprint: the whole workstream must ship at once.',
  },
  'tout-indexer': {
    title: 'Nova, act V: the final sprint',
    lines: [
      'Three tracked files changed, and src/health.ts has just appeared.',
      'One clean commit, in two commands maximum, new file included.',
    ],
    outcome: 'The whole sprint fits in one commit; the repository is clean.',
    teaser: 'The guide was rewritten twice, on two branches.',
  },
  'conflit-docs': {
    title: 'Nova, act III: the torn guide',
    lines: [
      'I rewrote the guide on doc-conflit while you were fixing the same page on main.',
      'Merge his branch: Git will stop on README.md. You choose the final version.',
    ],
    outcome:
      'A single version of the guide ships, and the merge commit keeps both stories.',
    teaser: 'Nova must now leave your machine.',
  },
  'premier-push': {
    title: 'Nova, act VI: put Nova online',
    lines: [
      'The GitHub repository is created but empty. We need to send our history there.',
      'Add origin, publish main, and link your branch to origin/main for future pushes.',
    ],
    outcome: 'Nova lives on GitHub: origin/main points at your latest commit.',
    teaser: 'While you were pushing, Léa pushed too.',
  },
  'pull-equipe': {
    title: 'Nova, act VI: the teammate’s commit',
    lines: [
      'I added a prefix to notifications and pushed to main.',
      'Your main is behind. Fetch her commit: here, with no divergence, a fast-forward is enough.',
    ],
    outcome: 'main joined origin/main without a merge commit.',
    teaser: 'This time, you both touched the same file.',
  },
  'conflit-de-pull': {
    title: 'Nova, act VI: the same file, two versions',
    lines: [
      'I reworked notify.ts and pushed to main.',
      'And you committed your own version of the same file without fetching.',
      'Do the pull, resolve the conflict, and finish the merge.',
    ],
    outcome:
      'Léa’s prefix and your cleanup coexist in a single version.',
    teaser: 'Your Nova tree is waiting on the map.',
  },
};
