import type { ChapterText } from '../types';

export const chapter05Text: ChapterText = {
  title: 'Shortcuts',
  tagline: 'One intent, one command',
  description:
    'Commit a single file without git add, create and join a branch in one move, stage a whole workstream in a single gesture.',
  lesson: {
    title: 'Fewer commands',
    slides: [
      {
        title: 'Shortcuts, not another rule',
        paragraphs: [
          'Everything you have learned still holds: a commit photographs the index. Shortcuts only change the number of commands needed to reach the same result.',
          'Each shortcut fits a precise situation. Chosen badly, it brings in what you meant to leave out: that is the trap of -a with new files.',
        ],
        note: 'Understanding what the command stages matters more than its brevity.',
      },
      {
        title: 'One file only, without git add',
        paragraphs: [
          'Putting a path after the message limits the commit to that path: Git takes its version from disk, even if it was never staged.',
          'The other changes stay out of the commit, and stay on disk. Handy to ship a fix without dragging along a workstream in progress.',
        ],
        note: 'The path comes after the message; several paths are accepted.',
      },
      {
        title: 'A single fix in the snapshot',
        caption:
          'README.md stays modified after the commit: only src/config.ts left.',
        steps: [
          'The fix arrives in the working dir.',
          'The docs change too, but they will wait.',
          'Two modified files, none staged.',
          'Only src/config.ts enters the snapshot.',
          'README.md is still modified, outside the commit.',
        ],
      },
      {
        title: 'Create and switch in one move',
        paragraphs: [
          'git branch <name> then git switch <name> still works, but git switch -c <name> does both at once.',
          'The branch is created on HEAD, and HEAD attaches to it right away. Your local changes follow if they are not overwritten by the destination.',
        ],
        note: 'Optional start: git switch -c <name> <commit> creates the branch from another point.',
      },
      {
        title: 'Stage everything, or only tracked files',
        paragraphs: [
          'git add . stages changes to tracked files and new files. This is the broad version.',
          'git commit -am stages only files that are already tracked: fast, but an untracked file stays outside. Keep it for fixes that create nothing.',
          'Two families of shortcuts: those that choose paths (targeted commit, add .) and those that choose grouped options (-am).',
        ],
        note: 'git add . then git commit -m "...": two commands for the whole workstream.',
      },
      {
        title: 'A new branch, one commit',
        caption: 'docs-final is born and receives the commit; main stays intact.',
        steps: [
          'The docs are ready on disk.',
          'The branch is created and HEAD attaches to it in one command.',
          'The modified README moves into the index.',
          'Only docs-final moves forward.',
          'main gets its README version back: nothing was shipped.',
        ],
      },
      {
        title: 'Chapter cheat sheet',
        commands: [
          'Commits this single path, without a prior git add.',
          'Creates the branch and switches to it in one command.',
          'Creates the branch from a commit or a branch.',
          'Stages the whole working dir, new files included.',
          'Stages and commits already tracked files only.',
          'Summarizes the history with one line per commit.',
        ],
      },
    ],
  },
  missions: {
    'commit-cible': {
      title: 'One file, one command',
      story:
        'Three files have changed on main, but only the configuration fix ships now. The rest waits for tomorrow’s review: the commit must contain only src/config.ts, without going through git add.',
      situation:
        'src/config.ts, README.md and app.ts are modified in the working dir; the index is empty.',
      objective:
        'Commit only src/config.ts in a single command, and leave the other two modifications on disk.',
      takeaway:
        'git commit -m "msg" <file> photographs that single path: the other changes stay on disk.',
      stepLabels: [
        'src/config.ts is in a new commit',
        'README.md and app.ts stay out of the commit',
        'Their modifications stay in the working dir',
      ],
      hints: [
        'git add then git commit would work, but two commands are unnecessary here.',
        'git commit accepts a path after the message: Git then photographs only that file.',
        'git commit -m "fix: retries 5" src/config.ts.',
      ],
      predictions: [
        {
          question: 'Which files will enter this commit?',
          options: [
            { id: 'config', label: 'Only src/config.ts' },
            { id: 'tous', label: 'All three modified files' },
          ],
          explanation:
            'The path placed after the message limits the snapshot to that file; the other modifications stay out of the commit.',
        },
      ],
    },
    'branche-en-une-commande': {
      title: 'Create and join in one move',
      story:
        'The final documentation is ready on disk, but it must not land on main before review. The team always opens a dedicated branch: this time, do it in a single command, then commit the file alone.',
      situation:
        'README.md contains the final documentation, uncommitted; the docs-final branch does not exist.',
      objective:
        'Create the docs-final branch and switch to it in one command, then commit README.md on that branch.',
      takeaway:
        'git switch -c <branch> creates the branch and attaches HEAD in one command, instead of git branch then git switch.',
      stepLabels: [
        'docs-final exists and HEAD is on it',
        'The final README.md is committed on docs-final',
        'main has not moved',
      ],
      hints: [
        'git branch docs-final creates the branch without switching to it; you would then need a git switch.',
        'The -c option of git switch asks to create the branch along the way.',
        'git switch -c docs-final, then git commit -m "docs: final" README.md.',
      ],
      predictions: [
        {
          question: 'What does this command do?',
          options: [
            { id: 'deux', label: 'It creates docs-final and attaches HEAD to it' },
            { id: 'une', label: 'It only switches, the branch must already exist' },
          ],
          explanation:
            '-c means "create": the branch is created on the current commit, then HEAD attaches to it.',
        },
      ],
    },
    'tout-indexer': {
      title: 'The whole workstream at once',
      story:
        'End of sprint: three tracked files have changed and src/health.ts has just appeared. The team wants a single clean commit, in two commands maximum, without forgetting the new file.',
      situation:
        'app.ts, src/config.ts and main.ts are modified; src/health.ts is a new untracked file.',
      objective:
        'Stage the whole workstream then commit it in two commands, including the new file.',
      takeaway:
        'git add . stages modifications to tracked files and new files; git commit -am, on the other hand, ignores untracked files.',
      stepLabels: [
        'All four files are in a new commit',
        'The new file is tracked',
        'The working dir is clean',
      ],
      hints: [
        'git add . stages the whole working dir, including src/health.ts, which -a would not see.',
        'A single staging step is enough, then a commit without -a.',
        'git add ., then git commit -m "chore: sprint 5".',
      ],
      predictions: [
        {
          question: 'Will src/health.ts be in this commit?',
          options: [
            { id: 'oui', label: 'Yes' },
            { id: 'non', label: 'No' },
          ],
          explanation:
            '-a only knows about files that are already tracked. src/health.ts is untracked: git add is required.',
        },
      ],
    },
  },
};
