import type { RepoState } from '../../engine/types';

const COMMANDS = [
  'git',
  'touch',
  'edit',
  'rm',
  'ls',
  'cd',
  'explain',
  'undo',
  'hint',
  'reset-mission',
];

const GIT_SUBCOMMANDS = [
  'init',
  'status',
  'add',
  'commit',
  'log',
  'branch',
  'switch',
  'checkout',
  'merge',
  'worktree',
  'rm',
];

const WORKTREE_SUBCOMMANDS = ['add', 'list', 'remove'];

export interface Completion {
  /** Ligne complétée (ou inchangée si aucune correspondance). */
  readonly value: string;
  readonly suggestions: readonly string[];
}

function replaceLastToken(input: string, value: string): string {
  if (input.trim() === '') return value;
  if (/\s$/.test(input)) return `${input}${value}`;
  const match = /(\S+)$/.exec(input);
  if (!match) return `${input} ${value}`;
  return `${input.slice(0, match.index)}${value}`;
}

function files(state: RepoState): string[] {
  const worktree = state.worktrees[state.activeWorktree];
  return worktree ? Object.keys(worktree.workingDir).sort() : [];
}

function branches(state: RepoState): string[] {
  return Object.keys(state.branches).sort();
}

function hashes(state: RepoState): string[] {
  return Object.keys(state.commits)
    .sort()
    .map((hash) => hash.slice(0, 7));
}

function worktreePaths(state: RepoState): string[] {
  return Object.values(state.worktrees)
    .map((worktree) => worktree.path)
    .sort();
}

function candidatesFor(tokens: readonly string[], state: RepoState): string[] {
  const [command, subcommand, third] = tokens;

  if (command === undefined) return COMMANDS;

  if (command === 'explain') {
    return candidatesFor(tokens.slice(1), state);
  }

  if (command === 'git') {
    if (subcommand === undefined) return GIT_SUBCOMMANDS;
    if (subcommand === 'worktree') {
      if (third === undefined) return WORKTREE_SUBCOMMANDS;
      return [...worktreePaths(state), ...branches(state)];
    }
    if (subcommand === 'switch') {
      return ['-c', ...branches(state), ...hashes(state)];
    }
    if (subcommand === 'checkout' || subcommand === 'merge') {
      return [...branches(state), ...hashes(state)];
    }
    if (subcommand === 'branch') {
      return ['-d', '-D', ...branches(state)];
    }
    if (subcommand === 'add' || subcommand === 'rm') {
      return [...files(state), ...branches(state)];
    }
    return [];
  }

  if (command === 'touch' || command === 'edit' || command === 'rm') {
    return files(state);
  }

  if (command === 'cd') {
    return worktreePaths(state);
  }

  return [];
}

function commonPrefix(values: readonly string[]): string {
  const first = values[0];
  if (first === undefined) return '';
  let prefix = first;
  for (const value of values.slice(1)) {
    while (!value.startsWith(prefix)) prefix = prefix.slice(0, -1);
  }
  return prefix;
}

/**
 * Complétion Tab : commandes, sous-commandes, branches, fichiers et worktrees.
 * Une seule correspondance (ou un préfixe commun plus long) complète la saisie.
 */
export function completeInput(input: string, state: RepoState): Completion {
  const trimmed = input.trim();
  const tokens = trimmed === '' ? [] : trimmed.split(/\s+/);
  const endsWithSpace = /\s$/.test(input);
  const lastToken = endsWithSpace ? '' : (tokens[tokens.length - 1] ?? '');
  const previousTokens = endsWithSpace ? tokens : tokens.slice(0, -1);

  const candidates = candidatesFor(previousTokens, state).filter((candidate) =>
    candidate.startsWith(lastToken),
  );

  if (candidates.length === 0) {
    return { value: input, suggestions: [] };
  }

  if (candidates.length === 1) {
    const only = candidates[0];
    return {
      value: only === undefined ? input : replaceLastToken(input, only),
      suggestions: candidates,
    };
  }

  const prefix = commonPrefix(candidates);
  if (prefix.length > lastToken.length) {
    return { value: replaceLastToken(input, prefix), suggestions: candidates };
  }

  return { value: input, suggestions: candidates };
}
