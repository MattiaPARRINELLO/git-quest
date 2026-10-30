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
    line('  touch <fichier>          créer un fichier vide — ex. touch notes.txt'),
    line('  edit <fichier> "texte"   écrire — ex. edit app.ts "v2"'),
    line('  cat <fichier>            lire le working dir — ex. cat app.ts'),
    line('  rm <fichier>             supprimer du working dir — ex. rm notes.txt'),
    line('  git rm <fichier>         supprimer + indexer — ex. git rm notes.txt'),
    line('  ls                       lister les fichiers — ex. ls'),
    line('  cd <worktree>            changer de worktree — ex. cd ../gitquest-hotfix'),
    line(''),
    line('Git', 'muted'),
    line('  git init                 initialiser — ex. git init'),
    line('  git status               état des 3 zones — ex. git status'),
    line('  git add <fichier> | -A   indexer — ex. git add app.ts'),
    line('  git commit -m "message"  committer — ex. git commit -m "docs: v2"'),
    line('  git commit -am "msg"     indexer le suivi + committer — ex. git commit -am "fix"'),
    line('  git log --oneline --graph  historique — ex. git log --oneline --graph'),
    line('  git branch [nom] [-d|-D] étiquettes — ex. git branch feature'),
    line('  git switch <nom> | -c    changer de branche — ex. git switch -c feature'),
    line('  git checkout <branche|hash>  changer/détacher — ex. git checkout abc1234'),
    line('  git merge <branche>      fusionner — ex. git merge feature'),
    line('  git worktree add <chemin> [-b <nom>]  — ex. git worktree add ../hotfix -b hotfix'),
    line('  git worktree list        lister les worktrees — ex. git worktree list'),
    line('  git worktree remove <chemin>  — ex. git worktree remove ../hotfix'),
    line(''),
    line('Outils', 'muted'),
    line('  help                     cette aide — ex. help'),
    line('  explain <commande>       expliquer sans exécuter — ex. explain git merge feature'),
    line('  undo                     annuler la dernière commande — ex. undo'),
    line('  hint                     indice de mission — ex. hint'),
    line('  reset-mission            recommencer la mission — ex. reset-mission'),
    line(''),
    line('Astuce : « explain <commande> » montre ce qui va se passer avant d’exécuter.', 'muted'),
  ];
}

const KNOWN_COMMANDS = [
  'git init',
  'git status',
  'git add',
  'git commit',
  'git log',
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
