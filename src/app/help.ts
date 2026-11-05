import type { TerminalLine } from '../engine/types';
import { t } from '../i18n';

function line(text: string, tone?: TerminalLine['tone']): TerminalLine {
  return tone === undefined ? { text } : { text, tone };
}

const USAGE_WIDTH = 32;

function usage(syntax: string, example?: string): TerminalLine {
  if (example === undefined) return line(`  ${syntax}`);
  return line(`  ${syntax.padEnd(USAGE_WIDTH)}${t('help.example')} ${example}`);
}

/** Aide groupée : chaque commande est accompagnée d'un exemple concret. */
export function helpOutput(): TerminalLine[] {
  const file = t('help.argFile');
  const name = t('help.argName');
  const branch = t('help.argBranch');
  const path = t('help.argPath');
  const command = t('help.argCommand');
  const text = t('help.argText');
  const remote = t('help.argRemote');

  return [
    line(t('help.title'), 'success'),
    line(''),
    line(t('help.files'), 'muted'),
    usage(`touch <${file}>`, 'touch notes.txt'),
    usage(`edit <${file}> "${text}"`, 'edit app.ts "v2"'),
    usage(`cat <${file}>`, 'cat app.ts'),
    usage(`rm <${file}>`, 'rm notes.txt'),
    usage(`git rm <${file}>`, 'git rm notes.txt'),
    usage('ls', 'ls'),
    usage(`cd <${path}>`, 'cd ../gitquest-hotfix'),
    line(''),
    line(t('help.git'), 'muted'),
    usage('git init', 'git init'),
    usage('git status', 'git status'),
    usage(`git add <${file}>|-A`, 'git add app.ts'),
    usage(`git commit -m "msg"`, 'git commit -m "docs: v2"'),
    usage(`git commit -am "msg"`, 'git commit -am "fix"'),
    usage('git log --oneline --graph', 'git log --oneline --graph'),
    usage('git diff', 'git diff'),
    usage('git diff --staged', 'git diff --staged'),
    usage('git diff HEAD', 'git diff HEAD'),
    usage(`git branch [${name}]`, 'git branch feature'),
    usage(`git branch -d|-D <${name}>`, 'git branch -d feature'),
    usage(`git switch <${name}> | -c`, 'git switch -c feature'),
    usage(`git checkout <${name}>`, 'git checkout abc1234'),
    usage(`git merge <${branch}>`, 'git merge feature'),
    usage('git remote [-v]', 'git remote -v'),
    usage(`git remote add <${name}> <url>`),
    usage('', 'git remote add origin git@github.com:nova/nova.git'),
    usage(`git push [-u] [${remote}] [${branch}]`),
    usage('', 'git push -u origin main'),
    usage(`git fetch [${remote}]`, 'git fetch origin'),
    usage(`git pull [${remote}] [${branch}]`),
    usage('', 'git pull origin main'),
    usage(`git worktree add -b <${branch}> <${path}>`),
    usage('', 'git worktree add -b hotfix ../gitquest-hotfix'),
    usage('git worktree list', 'git worktree list'),
    usage(`git worktree remove <${path}>`, 'git worktree remove ../gitquest-hotfix'),
    line(''),
    line(t('help.tools'), 'muted'),
    usage('help', 'help'),
    usage(`explain <${command}>`, 'explain git merge feature'),
    usage('undo', 'undo'),
    usage('hint', 'hint'),
    usage('reset-mission', 'reset-mission'),
    line(''),
    line(t('help.tip'), 'muted'),
  ];
}

const KNOWN_COMMANDS = [
  'git init',
  'git status',
  'git add',
  'git commit',
  'git log',
  'git diff',
  'git remote',
  'git push',
  'git fetch',
  'git pull',
  'git branch',
  'git switch',
  'git checkout',
  'git merge',
  'git worktree',
  'git worktree add',
  'git worktree list',
  'git worktree remove',
  'git rm',
  'touch',
  'edit',
  'cat',
  'rm',
  'ls',
  'cd',
  'explain',
  'undo',
  'hint',
  'reset-mission',
  'help',
];

function distance(left: string, right: string): number {
  const rows = left.length + 1;
  const cols = right.length + 1;
  const table = Array.from({ length: rows }, () => Array<number>(cols).fill(0));
  for (let row = 0; row < rows; row += 1) table[row]![0] = row;
  for (let col = 0; col < cols; col += 1) table[0]![col] = col;
  for (let row = 1; row < rows; row += 1) {
    for (let col = 1; col < cols; col += 1) {
      const cost = left[row - 1] === right[col - 1] ? 0 : 1;
      table[row]![col] = Math.min(
        (table[row - 1]![col] ?? 0) + 1,
        (table[row]![col - 1] ?? 0) + 1,
        (table[row - 1]![col - 1] ?? 0) + cost,
      );
    }
  }
  return table[left.length]![right.length] ?? 0;
}

/** Suggestion de commande proche pour une commande inconnue. */
export function suggestCommand(input: string): string | null {
  const normalized = input.trim().replace(/\s+/g, ' ');
  if (normalized === '') return null;
  const tokens = normalized.split(' ');
  const target =
    tokens[0] === 'git'
      ? tokens[1] === 'worktree' && tokens[2] !== undefined
        ? `git worktree ${tokens[2]}`
        : `git ${tokens[1] ?? ''}`.trim()
      : (tokens[0] ?? '');

  let best: { command: string; score: number } | null = null;
  for (const command of KNOWN_COMMANDS) {
    if (command.split(' ').length !== target.split(' ').length) continue;
    const score = distance(target, command);
    if (best === null || score < best.score) best = { command, score };
  }

  if (!best || best.score > 2 || best.score === 0) return null;
  return best.command;
}
