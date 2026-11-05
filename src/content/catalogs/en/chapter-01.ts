import type { ChapterText } from '../types';

export const chapter01Text: ChapterText = {
  title: 'Under the hood',
  tagline: 'Commits, snapshots, branches and HEAD',
  description:
    'Understand what Git actually photographs, and why a branch is nothing more than a label.',
  lesson: {
    title: 'Under the hood',
    slides: [
      {
        title: 'A commit is a snapshot',
        paragraphs: [
          'Git does not store differences: every commit is a complete snapshot of the staged files at a given moment.',
          'That is why going back to an old commit does not depend on the commits around it: the snapshot contains everything.',
        ],
        note: 'Editing a file after the commit never changes the snapshot already taken.',
      },
      {
        title: 'Why -m?',
        paragraphs: [
          'A commit always carries a message: it is the written trace of the snapshot in the history. Git asks for it when you commit.',
          'Without -m, Git opens a text editor and waits for you to write the message. -m, short for --message, provides it directly in the command.',
          'The text must be quoted as soon as it contains spaces; otherwise Git takes the following words for file names, not for the rest of the message.',
        ],
        note: '-m and --message are equivalent: one short option, one long option.',
      },
      {
        title: 'From disk to snapshot',
        caption:
          'Three steps: working dir, index, commit. Only the index enters the snapshot.',
      },
      {
        title: 'The 3 areas: disk, index, commit',
        paragraphs: [
          'The working dir is what you see and edit. The index is the staging area: it is what the commit photographs.',
          'A modified file that is not staged does not enter the commit. A file that has never been tracked (untracked) must first be added to the index.',
          'That is why a commit can contain only part of your changes.',
        ],
        note: 'Working dir → index → commit: every step is explicit.',
      },
      {
        title: 'The -am trap',
        paragraphs: [
          'git commit -am automatically stages files that are already tracked, then commits. Handy for a quick fix.',
          'But -a ignores untracked files: a new file must go through git add, or it stays out of the commit.',
        ],
        note: 'An untracked file is never included by -a.',
      },
      {
        title: 'A branch is a label',
        paragraphs: [
          'A branch like main is just a pointer to a commit. Creating it copies no file and moves nothing.',
          'Making a commit only moves the label of the branch HEAD is attached to.',
        ],
      },
      {
        title: 'HEAD travels, main stays',
        caption: 'Follow the feature label and the HEAD marker at each step.',
        steps: [
          'A new label appears on the existing commit.',
          'HEAD attaches to feature; no commit moves.',
          'The file arrives in the working dir, not yet in Git.',
          'The file moves into the index: it will be in the next snapshot.',
          'Only the feature label moves forward. main still points at the root.',
          'HEAD returns to main: notes.txt disappears from the working dir.',
        ],
      },
      {
        title: 'HEAD: "you are here"',
        paragraphs: [
          'HEAD is a moving marker. Attached to a branch, it moves forward with it on every commit.',
          'Detached, it points directly at a commit. You will see that case in the next chapter.',
        ],
      },
      {
        title: 'Chapter cheat sheet',
        commands: [
          'Creates the repository and attaches HEAD to main.',
          'Shows the working dir, the index and the state of HEAD.',
          'Copies the file into the index.',
          'Photographs the index and moves the branch HEAD is attached to.',
          'Stages tracked files, but not untracked ones.',
          'Creates a label on the current commit.',
          'Attaches HEAD to a branch.',
        ],
      },
    ],
  },
  missions: {
    'trois-zones': {
      title: 'The 3 areas',
      story:
        'Two files have changed in the Nova project: a.txt and b.txt. The lead only wants to ship the a.txt fix now, and keep b.txt for the next release. The whole question is what the commit will actually photograph.',
      situation: 'a.txt and b.txt are modified; nothing is staged yet.',
      objective: 'Commit only a.txt and leave b.txt modified in the working dir.',
      takeaway:
        'The commit only photographs the index: only staged changes enter the new snapshot, and the b.txt changes stay uncommitted.',
      stepLabels: [
        'Stage a.txt with git add',
        'Commit the updated design note',
        'Keep the b.txt change uncommitted',
      ],
      hints: [
        'A commit photographs the index, not the whole working dir. You have to choose what to stage.',
        'Add only a.txt to the index, then commit: the b.txt change will stay uncommitted on disk.',
        'git add a.txt, then git commit -m "fix: a.txt".',
      ],
      predictions: [
        {
          question: 'Which files will be in this commit?',
          options: [
            { id: 'a', label: 'a.txt' },
            { id: 'both', label: 'a.txt and b.txt' },
            { id: 'none', label: 'None' },
          ],
          explanation:
            'The commit only reads the index: the new version of b.txt does not enter the snapshot, the change stays uncommitted.',
        },
      ],
    },
    'snapshot-fige': {
      title: 'The snapshot does not move',
      story:
        'The app.ts module of Nova is ready to move to v3, but the index was prepared with v2. The CTO wants to check an intuition: a commit is a frozen snapshot of the index, not a mirror of the file on your disk.',
      situation:
        'The index contains app.ts as v2; the file on disk is already v3.',
      objective:
        'Commit the index without restaging anything: the commit must keep v2, and v3 must stay on disk.',
      takeaway:
        'The commit takes the snapshot of the index, not of the disk. v3 is still there, uncommitted.',
      stepLabels: [
        'Commit the index without running git add again',
        'Leave v3 on disk, outside the commit',
      ],
      hints: [
        'The commit photographs the index, even if the file on disk is already newer.',
        'The index already contains v2: a git add app.ts would overwrite that state with v3.',
        'git commit -m "docs: v2".',
      ],
      predictions: [
        {
          question: 'Which version will be in the commit?',
          options: [
            { id: 'v2', label: 'v2, the staged version' },
            { id: 'v3', label: 'v3, the latest version on disk' },
          ],
          explanation:
            'Only v2 is in the index. v3 stays in the working dir, uncommitted.',
        },
      ],
    },
    'piege-am': {
      title: 'The -am trap',
      story:
        'A teammate claims that "git commit -am" takes care of everything, with no need to ever stage anything. Check what Git really photographs with that reflex.',
      situation: 'README.md is modified and notes.txt has just appeared in the project.',
      objective:
        'Commit the new version of the README and notes.txt, then leave a clean working dir.',
      takeaway:
        'git commit -am stages tracked files, not untracked ones: git add is still needed for a new file.',
      stepLabels: [
        'README v2 present in a commit',
        'notes.txt present in a commit',
        'Clean working dir',
      ],
      hints: [
        'First run the commit -am your teammate suggested, then inspect the result.',
        'notes.txt has never been tracked: -a cannot stage it. Add it explicitly, then commit.',
        'git commit -am "docs: readme", git add notes.txt, git commit -m "docs: notes".',
      ],
      predictions: [
        {
          question: 'Will notes.txt be in this commit?',
          options: [
            { id: 'oui', label: 'Yes' },
            { id: 'non', label: 'No' },
          ],
          explanation:
            'notes.txt has never been tracked: -a cannot stage it. It stays out of the snapshot.',
        },
      ],
    },
  },
};
