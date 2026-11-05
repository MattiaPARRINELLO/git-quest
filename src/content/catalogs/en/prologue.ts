import type { LessonText } from '../types';

export const prologueText: LessonText = {
  title: 'Reading a Git command',
  slides: [
    {
      title: 'One command, three levels',
      paragraphs: [
        'Every Git command reads from left to right: git is the program, commit is the subcommand, then come the options and their values.',
        'In git commit -m "docs: first version", -m is an option that expects a value: the commit message. Without -m, Git would open an editor to ask you for that message.',
        'That is why we write -m just before the quoted text: the option and its value go together.',
      ],
      note: '-m stands for "message". A global option, such as --version, goes before the subcommand.',
    },
    {
      title: 'Short options, long options',
      paragraphs: [
        'Each option often has two spellings: -m and --message, -a and --all. Both do exactly the same thing; the long form is just more readable.',
        'Short options can be grouped: -am means -a -m. It is a writing shortcut, not a different command.',
        'When you group them, the expected value follows the last option: git commit -am "fix: quick".',
      ],
      note: '-am "..." = -a (everything tracked) + -m "..." (message).',
    },
    {
      title: 'Quotes and placeholders',
      paragraphs: [
        'A message contains spaces: without quotes, the shell splits it into several words and Git takes them for files.',
        'In this course, <file> or <branch> are placeholders: replace them with a real name, without keeping the angle brackets.',
        '-- marks the end of the options. git checkout -- app.ts forces Git to read app.ts as a file, even if a file or a branch has an ambiguous name.',
      ],
      note: 'Without quotes, git commit -m fix: login fails: Git looks for a file named login.',
    },
    {
      title: 'Reading the order of arguments',
      paragraphs: [
        'Options and their values come before the arguments; paths or branch names usually close the command.',
        'git commit -m "msg" <file>: the message first, the file after. git switch -c <branch>: the -c option then the name to create.',
        'When a command fails, read it again in that order: program, subcommand, options, arguments. Most errors come from a forgotten quote or a placeholder left unreplaced.',
      ],
      note: 'Two long options add up without a value: they only filter the display.',
    },
    {
      title: 'Reading cheat sheet',
      commands: [
        'The structure of any Git command.',
        'A short option followed by its quoted value.',
        'The same option in long form, more readable.',
        'Two short options grouped: -a and -m.',
        'A placeholder to replace, without the angle brackets.',
        'End of options: what follows is a path.',
      ],
    },
  ],
};
