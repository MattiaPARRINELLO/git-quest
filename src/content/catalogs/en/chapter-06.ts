import type { ChapterText } from '../types';

export const chapter06Text: ChapterText = {
  title: 'Collaborating',
  tagline: 'Remote, push, pull, pull conflicts',
  description:
    'Connect a local repository to GitHub, publish a branch, fetch a teammate’s work, and resolve the conflict a pull can cause.',
  lesson: {
    title: 'Collaborating',
    slides: [
      {
        title: 'One repository, two machines',
        paragraphs: [
          'Until now your repository lived alone. On a team project, there is a reference copy on a server: GitHub, GitLab or an internal repository. It is called the remote.',
          'git remote add origin <url> records that address. Nothing is copied at that moment: origin is just a name pointing at a URL.',
          'origin/main is the last known version of main on the server. It is local memory, not the server itself.',
        ],
        note: 'origin is the conventional name of the main remote repository.',
      },
      {
        title: 'Publish with push and upstream',
        paragraphs: [
          'git push -u origin main sends your commits to origin and links your local main branch to origin/main: that is the upstream.',
          'Once the upstream is set, git push and git pull know where to go without arguments.',
          'Git refuses a push that is not a fast-forward of the server. That refusal protects other people’s work: you must fetch their commits first.',
        ],
        note: 'Classic rejection: "Updates were rejected because the remote contains work that you do not have locally".',
      },
      {
        title: 'fetch is not pull',
        paragraphs: [
          'git fetch downloads the new commits and updates origin/main, without touching your local branches: you can inspect before integrating.',
          'git pull = git fetch, then a merge of origin/main into your current branch: fast-forward if you committed nothing, merge commit otherwise.',
          'If both sides changed the same line, the pull stops on a conflict, exactly like a merge.',
        ],
        note: 'When in doubt: git fetch, then git status, then git pull.',
      },
      {
        title: 'A teammate pushed',
        caption: 'Follow origin/main: the server moves ahead of your local repository.',
        steps: [
          'origin/main moves forward onto the teammate’s commit; your main branch and your disk do not move.',
          'Git reports that your branch is behind and can be fast-forwarded.',
          'The merge moves main forward to origin/main: your README file is updated.',
        ],
      },
      {
        title: 'Chapter cheat sheet',
        commands: [
          'Shows the remote repositories and their URLs.',
          'Records a remote repository.',
          'Publishes main and sets its upstream.',
          'Fetches without merging.',
          'Fetches then merges into the current branch.',
          'Shows whether you are ahead of or behind origin/main.',
        ],
      },
    ],
  },
  missions: {
    'premier-push': {
      title: 'Put Nova online',
      story:
        'Nova must finally live somewhere other than your machine. The team created the GitHub repository, but it is empty: you are the one laying the first stone.',
      situation:
        'Your local repository contains the whole history, but no remote is configured.',
      objective: 'Connect your repository to origin, publish main and set its upstream.',
      takeaway:
        'git remote add declares the address, git push -u publishes the branch and records its upstream: after that, push and pull no longer need arguments.',
      stepLabels: [
        'Configure the origin remote',
        'Publish main to the server',
        'Link main to origin/main',
      ],
      hints: [
        'The link between your repository and GitHub is missing: start with git remote add.',
        'git push sends the commits; -u also records the upstream branch.',
        'git remote add origin git@github.com:nova/nova.git, then git push -u origin main.',
      ],
      predictions: [
        {
          question: 'After git push -u origin main, where do the commits live?',
          options: [
            { id: 'local', label: 'Only on your machine' },
            { id: 'both', label: 'On origin and locally, exactly the same' },
            { id: 'remote-only', label: 'Only on origin' },
          ],
          explanation:
            'A push publishes a copy: your local repository keeps its whole history, and origin/main points at the same commit.',
        },
      ],
    },
    'pull-equipe': {
      title: 'The teammate’s commit',
      story:
        'While you were writing docs, Léa pushed a notification prefix to origin/main. Your local main is one version behind, and your push would be rejected.',
      situation:
        'origin/main has a commit that your main branch does not have; your local repository is clean.',
      objective: 'Fetch Léa’s work and move main forward without a merge commit.',
      takeaway:
        'When your branch has not diverged, git pull performs a fast-forward: no useless merge commit, and your history stays linear.',
      stepLabels: [
        'Move main forward onto origin/main',
        'Bring in src/notify.ts',
      ],
      hints: [
        'Your main is behind: there is nothing to commit, you need to fetch the server’s commits.',
        'git fetch updates origin/main; git pull goes further and merges.',
        'git pull (or git pull origin main).',
      ],
      predictions: [
        {
          question: 'What will git pull do here?',
          options: [
            { id: 'fetch', label: 'Fetch only, without touching main' },
            { id: 'ff', label: 'Fetch then move main forward (fast-forward)' },
            { id: 'push', label: 'Push your local main to the server' },
          ],
          explanation:
            'Your main is a direct ancestor of origin/main: the merge boils down to moving the label. No merge commit is created.',
        },
      ],
    },
    'conflit-de-pull': {
      title: 'The same file, two versions',
      story:
        'Léa reworked src/notify.ts and pushed to origin/main. On your side, you committed another version of the same file without fetching her work.',
      situation:
        'main and origin/main have diverged, and both sides changed the same line of src/notify.ts.',
      objective: 'Fetch Léa’s work, resolve the conflict and publish a single version.',
      takeaway:
        'A pull can conflict exactly like a merge: the merge stops, you resolve the file, then git add and git merge --continue finish the integration.',
      stepLabels: [
        'Fetch and see the conflict',
        'Write the merged version of src/notify.ts',
        'Conclude the merge',
      ],
      hints: [
        'git pull will try to merge origin/main: both versions of src/notify.ts will clash.',
        'Edit src/notify.ts to keep Léa’s prefix and your cleanup, with no markers left.',
        'git pull, then edit src/notify.ts, git add src/notify.ts and git merge --continue.',
      ],
      predictions: [
        {
          question: 'What will git pull produce?',
          options: [
            { id: 'ff', label: 'A fast-forward, without a commit' },
            { id: 'auto', label: 'An automatic merge commit' },
            { id: 'conflict', label: 'A conflict: the merge stops' },
          ],
          explanation:
            'Both branches changed the same line of src/notify.ts: Git writes both versions and waits for you to choose the final content.',
        },
      ],
    },
  },
};
