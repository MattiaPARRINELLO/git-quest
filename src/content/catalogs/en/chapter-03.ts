import type { ChapterText } from '../types';

export const chapter03Text: ChapterText = {
  title: 'Merging',
  tagline: 'Fast-forward, merge commit, cleanup',
  description:
    'Choose the right kind of merge, understand the two parents of a merge commit, and delete a branch without losing history.',
  lesson: {
    title: 'Merging',
    slides: [
      {
        title: 'Two stories, one branch',
        paragraphs: [
          'git merge brings a branch into the current branch. Git automatically picks between fast-forward and merge commit.',
          'The rule is simple: is the target already an ancestor of HEAD, or have the two lines diverged?',
        ],
      },
      {
        title: 'Fast-forward or convergence point',
        caption:
          'Fast-forward means moving the label. Merge commit means creating a node with two parents.',
      },
      {
        title: 'Fast-forward: nothing to create',
        paragraphs: [
          'If main is a direct ancestor of feature, Git simply moves main onto the feature commit.',
          'No commit is created, and the history stays linear. This happens when main has not moved while you were working.',
        ],
      },
      {
        title: 'Create a merge commit',
        caption: 'The two branches have diverged: Git links both parents.',
        steps: [
          'A merge commit appears with two parents: main and feature.',
          'HEAD can still visit feature, whose label has not moved.',
          'main now contains both lines of history.',
        ],
      },
      {
        title: 'Already up to date, and cleanup',
        paragraphs: [
          'If the target is already contained in HEAD, Git answers "Already up to date." and does nothing.',
          'A merged branch can be deleted with git branch -d. If it is not merged, Git refuses with "The branch ... is not fully merged".',
          'Two deliberate choices: merge first and then use -d, or force it with -D. -D throws away unreferenced commits: use it knowingly.',
        ],
        note: 'A merged branch is a branch whose commits are already in HEAD.',
      },
      {
        title: 'When both sides touch the same line',
        paragraphs: [
          'Git merges file by file. If both branches changed the same file in different ways, it cannot choose: the merge stops on a conflict.',
          'Git writes both versions into the file, between <<<<<<< HEAD, ======= and >>>>>>>. This is not an error: you are the one who decides the result.',
          'You edit the file, remove the markers, then git add marks the conflict as resolved. git commit (or git merge --continue) finally creates the merge commit.',
        ],
        note: 'git merge --abort cancels everything and restores the state before the merge.',
      },
      {
        title: 'Resolve a conflict',
        caption: 'The merge stops, the file holds both versions: you decide.',
        steps: [
          'CONFLICT: README.md now contains both taglines between the markers.',
          'You choose the final text and remove the markers.',
          'The conflict is marked resolved: the version on disk will be committed.',
          'The merge commit with two parents is created, and the merge is finished.',
        ],
      },
      {
        title: 'Chapter cheat sheet',
        commands: [
          'Merges the branch into HEAD.',
          'Shows the shape of the history.',
          'Deletes a merged branch.',
          'Marks a conflict as resolved.',
          'Finishes the merge after resolution.',
          'Cancels a merge that has conflicts.',
          'Forces the deletion.',
        ],
      },
    ],
  },
  missions: {
    'avance-rapide': {
      title: 'Ship without ceremony',
      story:
        'The CSV export feature is done and main has not moved since. The release manager wants to ship tonight: here, with no divergence, Git can simply slide the main label onto the work already done.',
      situation:
        'main is a direct ancestor of feature: no merge commit exists yet.',
      objective:
        'Merge feature into main as a fast-forward, without creating an extra commit.',
      takeaway: 'Fast-forward: Git moves the label, it does not create a commit.',
      stepLabels: [
        'Merge feature into main',
        'Create no merge commit',
        'Check that export.ts lands on main',
      ],
      hints: [
        'When HEAD is an ancestor of the target, Git can move forward without a commit.',
        'One command is enough: ask Git to merge feature.',
        'git merge feature.',
      ],
      predictions: [
        {
          question: 'Will this merge create a new commit?',
          options: [
            { id: 'oui', label: 'Yes, a merge commit' },
            { id: 'non', label: 'No, a fast-forward' },
          ],
          explanation:
            'main is a direct ancestor of feature: Git simply moves the main pointer, without creating a commit.',
        },
      ],
    },
    'merge-commit': {
      title: 'The convergence point',
      story:
        'This time, main and feature have both moved forward: the notifications feature sits next to a configuration fix. Git must create a convergence point that links both lines, not pick a winner.',
      situation:
        'main and feature have diverged: notifications and configuration live separately.',
      objective:
        'Merge feature into main and check that the merge commit has two parents.',
      takeaway:
        'A merge commit has two parents: it links the two lines of history instead of choosing one.',
      stepLabels: [
        'Create a merge commit',
        'Bring notify.ts into main',
        'Keep config.ts after the merge',
      ],
      hints: [
        'The two branches have diverged: Git cannot just move forward.',
        'A merge commit links two parents; the command is still git merge.',
        'git merge feature.',
      ],
      predictions: [
        {
          question: 'How many parents will the merge commit have?',
          options: [
            { id: 'zero', label: 'No parent' },
            { id: 'one', label: 'One parent' },
            { id: 'two', label: 'Two parents' },
          ],
          explanation:
            'A merge commit links the two heads of history: one parent on the main side and one parent on the feature side.',
        },
      ],
    },
    'menage-branches': {
      title: 'The cleanup',
      story:
        'A colleague left and left two branches behind. feature-login is already merged into main; experiment, on the other hand, contains a cache test that was never integrated. The lead wants a clean sweep: see -d refuse the unmerged branch, then deliberately choose between merging it or forcing its deletion.',
      situation:
        'feature-login is already merged; experiment contains a commit never integrated into main.',
      objective:
        'Delete feature-login and experiment. For experiment: try -d, then either merge it or use -D.',
      takeaway:
        'git branch -d checks that the branch is merged; -D forces the deletion, with a knowingly accepted risk.',
      stepLabels: [
        'Delete feature-login',
        'Delete experiment',
        'Deliberately decide the fate of experiment',
      ],
      hints: [
        'feature-login is already merged: git branch -d should succeed directly.',
        'On experiment, git branch -d fails with "not fully merged". You can then merge and use -d, or force with -D.',
        'git branch -d feature-login, git merge experiment, git branch -d experiment. Alternative: git branch -D experiment (after seeing -d refuse).',
      ],
      successNote: 'Two branches cleaned up, no commit lost by accident.',
    },
    'conflit-docs': {
      title: 'The torn guide',
      story:
        'Samir rewrote the guide on his branch while you were fixing the same page on main. Both versions started from the same paragraph, and Git cannot choose for you.',
      situation:
        'main and doc-conflit changed the same line of README.md from the same base.',
      objective: 'Merge doc-conflit and ship a single version of README.md.',
      takeaway:
        'A conflict is not an error: Git stops, writes both versions, and you choose the final content before concluding with git add then git commit.',
      stepLabels: [
        'Start the merge and see the conflict',
        'Write the final version of README.md',
        'Conclude the merge',
      ],
      hints: [
        'The merge will stop: that is not a failure, it is Git handing over to you.',
        'Open README.md: both versions sit between <<<<<<< and >>>>>>>. Keep one line, the one you want to ship.',
        'After editing: git add README.md, then git merge --continue.',
      ],
      predictions: [
        {
          question: 'What will Git do when merging doc-conflit?',
          options: [
            { id: 'ff', label: 'Move main forward without a commit' },
            { id: 'merge', label: 'Create a merge commit directly' },
            { id: 'conflict', label: 'Stop on a conflict' },
          ],
          explanation:
            'Both branches changed the same line of README.md: Git cannot choose, so it writes both versions and waits for your decision.',
        },
      ],
    },
  },
};
