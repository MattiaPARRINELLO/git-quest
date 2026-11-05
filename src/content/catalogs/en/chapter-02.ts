import type { ChapterText } from '../types';

export const chapter02Text: ChapterText = {
  title: 'Branches',
  tagline: 'Create, switch, detach cleanly',
  description:
    'Let two lines of work diverge, explore an old commit without breaking anything, and rescue an orphaned commit.',
  lesson: {
    title: 'Branches',
    slides: [
      {
        title: 'Creating a branch changes nothing',
        paragraphs: [
          'git branch <name> creates a label on the current commit. HEAD stays where it is: you have not switched context yet.',
          'To work on the new branch, you need a second move: git switch <name>.',
        ],
        note: 'Two labels can point at the same commit without any conflict.',
      },
      {
        title: 'Labels, not copies',
        caption: 'A branch becomes interesting when it moves forward on its own.',
      },
      {
        title: 'Let two lines diverge',
        caption: 'feature moves forward, main stays put, then HEAD comes back.',
        steps: [
          'The feature label joins main on the same commit.',
          'HEAD attaches to feature.',
          'A local change appears in the working dir.',
          'The index is ready for the snapshot.',
          'feature moves forward; main does not move.',
          'HEAD returns to main, and notes.txt leaves the working dir.',
          'HEAD detaches: it points at the commit, not at a branch.',
          'HEAD attaches to main again. Commits made while detached would stay orphaned.',
        ],
      },
      {
        title: 'HEAD attached or detached',
        caption:
          'Detached means you are looking at a commit. New snapshots no longer have a label.',
      },
      {
        title: 'Leaving a detached HEAD',
        paragraphs: [
          'A commit created on a detached HEAD belongs to no branch: Git warns you when you leave.',
          'Two clean exits: go back to a branch with git switch, or create a branch on the spot with git switch -c.',
          'To rescue an already orphaned commit: git branch <name> <hash>.',
        ],
      },
      {
        title: 'Chapter cheat sheet',
        commands: [
          'Creates a label without moving HEAD.',
          'Creates a label on a specific commit.',
          'Attaches HEAD to a branch.',
          'Creates the branch and attaches HEAD to it.',
          'Detaches HEAD on a commit.',
          'Deletes a merged branch; -D forces it.',
        ],
      },
    ],
  },
  missions: {
    'branche-pointeur': {
      title: 'The ghost pointer',
      story:
        'The team wants to try an internal notes idea without polluting main. You create an experiment branch, work on it, then check that main has not moved a millimetre. A branch is just a label: time to prove it.',
      situation: 'HEAD is on main; the experiment branch does not exist yet.',
      objective:
        'notes.txt has been updated with real notes: commit that change on experiment, and leave main untouched.',
      takeaway: 'A branch is a pointer: only the label HEAD points at moves on commit.',
      stepLabels: [
        'Create the experiment branch',
        'Commit notes.txt on experiment',
        'End on experiment with main unchanged',
      ],
      hints: [
        'Creating a branch does not move HEAD: you still have to switch to it.',
        'notes.txt is already modified in the working dir: after the switch, you only need to stage and commit it.',
        'git branch experiment, git switch experiment, git add notes.txt, git commit -m "docs: internal notes".',
      ],
      predictions: [
        {
          question: 'After this branch switch, where will HEAD be?',
          options: [
            { id: 'main', label: 'On branch main' },
            { id: 'experiment', label: 'On branch experiment' },
            { id: 'detached', label: 'Detached on a commit' },
          ],
          explanation:
            'switch and checkout of a branch attach HEAD to the label: experiment, even if it still points at the commit of main.',
        },
      ],
    },
    'qui-avance': {
      title: 'Which one moves?',
      story:
        'You are on feature, and main still points at the same commit. Before shipping, the team wants to understand a simple rule: when you commit, which label moves? Move feature forward, then main on its own, to create two parallel lines.',
      situation: 'main and feature point at the same commit; HEAD is on feature.',
      objective:
        'Commit feature.ts on feature, then main.ts on main, and leave the two branches diverged.',
      takeaway: 'A commit only moves the branch HEAD is attached to.',
      stepLabels: [
        'Commit feature.ts on feature',
        'Switch to main',
        'Commit main.ts on main',
        'Make main and feature diverge',
      ],
      hints: [
        'A commit only moves the label of the branch HEAD is attached to.',
        'Both files are already written: commit feature.ts on feature, then main.ts on main.',
        'git add feature.ts, git commit -m "feat: feature module", git switch main, git add main.ts, git commit -m "feat: main module".',
      ],
      predictions: [
        {
          question: 'Which label moves after this commit?',
          options: [
            { id: 'main', label: 'main' },
            { id: 'feature', label: 'feature' },
          ],
          explanation:
            'HEAD is attached to feature: only its pointer moves forward. main stays on the shared commit.',
        },
      ],
    },
    'commit-perdu': {
      title: 'The lost commit',
      story:
        'A regression has appeared in the billing API. You detach onto an older commit to investigate, commit an experiment, then go back to main. Git then warns that the commit is no longer connected to any branch: keep it in a rescue branch before it disappears.',
      situation: 'HEAD is on main; no branch protects the upcoming experiment yet.',
      objective:
        'Detach onto the starting commit, commit exp.txt (any content), go back to main, then create sauvetage on the orphaned commit.',
      takeaway:
        'A detached commit belongs to no branch: it becomes orphaned as soon as you leave, unless you create a label on it.',
      stepLabels: [
        'Go through a detached HEAD on the old commit',
        'Create the experiment commit',
        'Return to main',
        'Create sauvetage on the orphaned commit',
      ],
      hints: [
        'git checkout <hash> detaches HEAD: the commit created here will belong to no branch.',
        'After returning to main, Git lists the commit left behind and suggests git branch <name> <hash>.',
        'git checkout {m1.1-c1}, git add exp.txt, git commit -m "exp: idea", git switch main, git branch sauvetage {m2.3-c1}.',
      ],
      display: {
        objective:
          'Detach onto {m1.1-c1}, commit exp.txt (any content), go back to main, then create sauvetage on the orphaned commit.',
        hints: [
          'git checkout <hash> detaches HEAD: the commit created here will belong to no branch.',
          'After returning to main, Git lists the commit left behind and suggests git branch <name> <hash>.',
          'git checkout {m1.1-c1}, git add exp.txt, git commit -m "exp: idea", git switch main, git branch sauvetage {m2.3-c1}.',
        ],
      },
      predictions: [
        {
          question: 'Where will HEAD be after this checkout?',
          options: [
            { id: 'main', label: 'On branch main' },
            { id: 'detached', label: 'Detached on this commit' },
            { id: 'feature', label: 'On branch feature' },
          ],
          explanation:
            'checkout of a hash detaches HEAD on the commit. No label moves, and the next commit will be orphaned if you leave without a branch.',
        },
      ],
    },
  },
};
