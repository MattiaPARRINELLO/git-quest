import type { ChapterText } from '../types';

export const chapter04Text: ChapterText = {
  title: 'Worktrees',
  tagline: 'Two branches, two desks, one repository',
  description:
    'Handle a production emergency without interrupting a WIP, run two workstreams in parallel, then clean up properly.',
  lesson: {
    title: 'Worktrees',
    slides: [
      {
        title: 'The single-desk problem',
        paragraphs: [
          'A classic repository has only one working dir and one HEAD. You cannot be on two branches at once without a stash or a temporary commit.',
          'A worktree adds a second desk connected to the same repository: its own HEAD, its own index, its own files.',
        ],
        note: 'Commits and branches stay shared across all worktrees.',
      },
      {
        title: 'One repository, several desks',
        caption:
          'Each worktree has its own branch and working dir; the repository is shared.',
      },
      {
        title: 'Fix without leaving your work',
        caption:
          'The main worktree stays on main while hotfix works somewhere else.',
        steps: [
          'A hotfix branch and a separate worktree appear.',
          'The terminal switches desks: HEAD is the one of hotfix.',
          'The file is modified only in the hotfix worktree.',
          'The index of the hotfix worktree is updated.',
          'hotfix moves forward; main and its working dir do not move.',
          'Back to the main worktree, still on main.',
        ],
      },
      {
        title: 'List, clean up, share',
        paragraphs: [
          'git worktree list shows every desk. A branch can only be checked out in one worktree at a time.',
          'git worktree remove refuses a dirty worktree; --force throws the modifications away. The branch itself survives the removal of the worktree.',
          'A commit made in a worktree is immediately visible from the others: the repository is shared.',
        ],
      },
      {
        title: 'Chapter cheat sheet',
        commands: [
          'Opens a worktree on an existing branch.',
          'Creates the branch, then the worktree.',
          'Lists paths, commits and branches.',
          'Removes a clean worktree.',
          'Switches the active worktree in GitQuest.',
        ],
      },
    ],
  },
  missions: {
    'hotfix-worktree': {
      title: 'The production bug',
      story:
        'You are in the middle of a refactor on feature, with uncommitted changes in app.ts. A critical bug hits production, and main has also touched app.ts: you cannot switch without overwriting your WIP. Yanis has already pushed the fix on the hotfix branch; your job is to set up a second workspace to verify it without dropping the refactor.',
      situation:
        'HEAD is on feature with app.ts modified and uncommitted; the fix is waiting on the hotfix branch.',
      objective:
        'Set up a hotfix worktree from the hotfix branch, check the fix, then return to the main worktree with the WIP intact.',
      takeaway:
        'A worktree is a second desk on the same repository: HEAD, the index and the disk are independent there.',
      stepLabels: [
        'Create a hotfix worktree from the hotfix branch',
        'Check that the worktree contains the fix',
        'Return to the main worktree with the WIP intact',
      ],
      hints: [
        'Try switching to main. What does Git say?',
        'The fix is already on the hotfix branch: create a worktree on that branch, not on main.',
        'git worktree add ../gitquest-hotfix hotfix, cd ../gitquest-hotfix, cat bug.txt, cd ../gitquest.',
      ],
      forbidden: [
        'No stash here: the goal is to learn worktrees. Your WIP must stay visible during the intervention.',
      ],
      successNote:
        'Fix verified, WIP intact, and no branch moved by accident.',
    },
    'deux-worktrees': {
      title: 'Two hats',
      story:
        'The Nova docs must be reviewed while you rewrite the README on main. Samir has already pushed the guide on the docs branch; you need a second workspace to read it without leaving your README in progress.',
      situation:
        'HEAD is on main with README modified; the docs branch already contains the guide.',
      objective:
        'Set up a docs worktree from the docs branch, check the guide, then return to main with the WIP intact.',
      takeaway:
        'Two worktrees let you run two branches in parallel without a stash or a temporary commit.',
      stepLabels: [
        'Create the docs worktree',
        'Check that the worktree contains the guide',
        'Return to main with the WIP intact',
      ],
      hints: [
        'The guide is already on the docs branch: create a worktree on that existing branch, then activate it with cd.',
        'In the docs worktree, you can read docs/GUIDE.md without touching the README of main.',
        'git worktree add ../gitquest-docs docs, cd ../gitquest-docs, cat docs/GUIDE.md, cd ../gitquest.',
      ],
      successNote:
        'Two branches, two workspaces, no stash and no crossed commits.',
    },
    'menage-worktree': {
      title: 'Clear the site',
      story:
        'The hotfix is shipped, the hotfix branch remains useful for history, but the temporary worktree is still lying on disk. Git refuses to remove a dirty worktree; this one is clean, so you can clean up safely.',
      situation:
        'The ~/gitquest-hotfix worktree still exists; the hotfix branch contains the shipped fix.',
      objective:
        'Remove the ~/gitquest-hotfix worktree without deleting the hotfix branch.',
      takeaway:
        'Removing a worktree does not delete the branch: history and commits stay in the repository.',
      stepLabels: [
        'Remove the hotfix worktree',
        'Keep the hotfix branch',
        'Keep the fix in the history',
      ],
      hints: [
        'The cleanup command is git worktree remove <path>.',
        'The worktree is clean: no --force is needed, and it is not the active worktree.',
        'git worktree remove ../gitquest-hotfix.',
      ],
      successNote:
        'The disk is clean, the branch and the fix stay in the repository.',
    },
  },
};
