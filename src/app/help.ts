import type { TerminalLine } from '../engine/types';

function line(text: string, tone?: TerminalLine['tone']): TerminalLine {
  return tone === undefined ? { text } : { text, tone };
}

/** Aide groupée : chaque commande est accompagnée d'un exemple concret. */
export function helpOutput(): TerminalLine[] {
  return [
    line('Commandes GitQuest', 'success'),
    line(''),
    line('Fichiers', 'muted'),
    line('  touch <fichier>         ex. touch notes.txt'),
    line('  edit <fichier> "texte"  ex. edit app.ts "v2"'),
    line('  cat <fichier>           ex. cat app.ts'),
    line('  rm <fichier>            ex. rm notes.txt'),
    line('  git rm <fichier>        ex. git rm notes.txt'),
    line('  ls                      ex. ls'),
    line('  cd <worktree>           ex. cd ../gitquest-hotfix'),
    line(''),
    line('Git', 'muted'),
    line('  git init                ex. git init'),
    line('  git status              ex. git status'),
    line('  git add <fichier>|-A    ex. git add app.ts'),
    line('  git commit -m "msg"     ex. git commit -m "docs: v2"'),
    line('  git commit -am "msg"    ex. git commit -am "fix"'),
    line('  git log --oneline --graph  ex. git log --oneline --graph'),
    line('  git diff                ex. git diff'),
    line('  git diff --staged       ex. git diff --staged'),
    line('  git diff HEAD           ex. git diff HEAD'),
    line('  git branch [nom]        ex. git branch feature'),
    line('  git branch -d|-D <nom>  ex. git branch -d feature'),
    line('  git switch <nom> | -c   ex. git switch -c feature'),
    line('  git checkout <ref>      ex. git checkout abc1234'),
    line('  git merge <branche>     ex. git merge feature'),
    line('  git worktree add -b <branche> <chemin>'),
    line('                          ex. git worktree add -b hotfix ../gitquest-hotfix'),
    line('  git worktree list       ex. git worktree list'),
    line('  git worktree remove <p> ex. git worktree remove ../gitquest-hotfix'),
    line(''),
    line('Outils', 'muted'),
    line('  help                    ex. help'),
    line('  explain <commande>      ex. explain git merge feature'),
    line('  undo                    ex. undo'),
    line('  hint                    ex. hint'),
    line('  reset-mission           ex. reset-mission'),
    line(''),
    line('Astuce : « explain <commande> » montre ce qui va se passer.', 'muted'),
  ];
}

const KNOWN_COMMANDS = [
  'git init',
  'git status',
  'git add',
  'git commit',
  'git log',
  'git diff',
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
