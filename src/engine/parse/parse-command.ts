import type { GitError, ParsedCommand } from '../types';
import { gitError } from '../errors';
import { tokenize } from './tokenize';

export type ParseResult =
  | { readonly ok: true; readonly command: ParsedCommand }
  | { readonly ok: false; readonly error: GitError };

function fail(code: GitError['code'], message: string): ParseResult {
  return { ok: false, error: gitError(code, message) };
}

function unknownCommand(name: string): ParseResult {
  return fail('unknown-command', `command not found: ${name}`);
}

function unknownGitCommand(name: string): ParseResult {
  return fail(
    'unknown-command',
    `git: '${name}' is not a git command. See 'git --help'.`,
  );
}

function parseCommit(args: readonly string[]): ParseResult {
  let message: string | undefined;
  let stageAllTracked = false;
  const pathspecs: string[] = [];

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === undefined) continue;

    if (arg === '-m' || arg === '--message') {
      const value = args[index + 1];
      if (value === undefined) {
        return fail('invalid-commit-message', "error: switch `m' requires a value");
      }
      message = value;
      index += 1;
      continue;
    }

    if (arg === '-a' || arg === '--all') {
      stageAllTracked = true;
      continue;
    }

    if (arg === '-am' || arg === '-ma') {
      const value = args[index + 1];
      if (value === undefined) {
        return fail('invalid-commit-message', "error: switch `m' requires a value");
      }
      stageAllTracked = true;
      message = value;
      index += 1;
      continue;
    }

    if (arg.startsWith('-am') && arg.length > 3) {
      stageAllTracked = true;
      message = arg.slice(3);
      continue;
    }

    if (arg.startsWith('-m') && arg.length > 2) {
      message = arg.slice(2);
      continue;
    }

    if (arg.startsWith('-')) {
      return fail('invalid-option', `error: unknown option \`${arg}'`);
    }

    // Git traite les mots non quotés après -m comme des pathspecs.
    pathspecs.push(arg);
  }

  const [firstPathspec] = pathspecs;
  if (firstPathspec !== undefined) {
    return fail(
      'commit-message-not-quoted',
      `error: pathspec '${firstPathspec}' did not match any file(s) known to git`,
    );
  }

  if (message === undefined || message.trim() === '') {
    return fail('invalid-commit-message', "error: switch `m' requires a value");
  }

  return { ok: true, command: { kind: 'git-commit', message, stageAllTracked } };
}

function parseBranch(args: readonly string[]): ParseResult {
  let action: 'list' | 'create' | 'delete' = 'list';
  let force = false;
  let name: string | undefined;
  let start: string | undefined;

  for (const arg of args) {
    if (arg === '-d' || arg === '--delete') {
      action = 'delete';
      continue;
    }
    if (arg === '-D') {
      action = 'delete';
      force = true;
      continue;
    }
    if (arg.startsWith('-')) {
      return fail('invalid-option', `error: unknown option \`${arg}'`);
    }
    if (name === undefined) {
      name = arg;
    } else if (start === undefined) {
      start = arg;
    } else {
      return fail('invalid-option', 'fatal: too many arguments for a branch name');
    }
  }

  if (action === 'delete' && name === undefined) {
    return fail('invalid-option', 'fatal: branch name required');
  }
  if (action === 'delete' && start !== undefined) {
    return fail('invalid-option', 'fatal: too many arguments for a branch name');
  }
  if (action === 'list' && name !== undefined) {
    action = 'create';
  }

  const base = { kind: 'git-branch' as const, action, force };
  if (name === undefined) return { ok: true, command: base };
  if (start === undefined) return { ok: true, command: { ...base, name } };
  return { ok: true, command: { ...base, name, start } };
}

function parseWorktree(args: readonly string[]): ParseResult {
  const [subcommand, ...rest] = args;
  if (subcommand === undefined) {
    return fail('invalid-option', 'error: missing worktree subcommand');
  }

  if (subcommand === 'list') {
    if (rest.length > 0) {
      return fail('invalid-option', `error: unknown option \`${rest[0] ?? ''}'`);
    }
    return { ok: true, command: { kind: 'git-worktree', action: 'list', force: false } };
  }

  if (subcommand === 'add') {
    let path: string | undefined;
    let branch: string | undefined;
    let createBranch: string | undefined;

    for (let index = 0; index < rest.length; index += 1) {
      const arg = rest[index];
      if (arg === undefined) continue;
      if (arg === '-b') {
        const value = rest[index + 1];
        if (value === undefined) {
          return fail('invalid-option', "error: option `-b' requires a value");
        }
        createBranch = value;
        index += 1;
        continue;
      }
      if (arg === '--detach') {
        return fail(
          'invalid-option',
          'error: --detach n’est pas supporté dans GitQuest',
        );
      }
      if (arg.startsWith('-')) {
        return fail('invalid-option', `error: unknown option \`${arg}'`);
      }
      if (path === undefined) {
        path = arg;
      } else if (branch === undefined) {
        branch = arg;
      } else {
        return fail('invalid-option', 'fatal: too many arguments');
      }
    }

    if (path === undefined) {
      return fail('invalid-option', 'fatal: working tree path is required');
    }

    const base: ParsedCommand = { kind: 'git-worktree', action: 'add', path, force: false };
    if (createBranch !== undefined) {
      // `git worktree add <path> -b <new> [<start-point>]`
      return {
        ok: true,
        command:
          branch === undefined
            ? { ...base, createBranch }
            : { ...base, createBranch, branch },
      };
    }
    if (branch !== undefined) {
      return { ok: true, command: { ...base, branch } };
    }
    return { ok: true, command: base };
  }

  if (subcommand === 'remove') {
    let path: string | undefined;
    let force = false;
    for (const arg of rest) {
      if (arg === '--force' || arg === '-f') {
        force = true;
        continue;
      }
      if (arg.startsWith('-')) {
        return fail('invalid-option', `error: unknown option \`${arg}'`);
      }
      if (path !== undefined) {
        return fail('invalid-option', 'fatal: too many arguments');
      }
      path = arg;
    }
    if (path === undefined) {
      return fail('invalid-option', 'fatal: working tree path is required');
    }
    return { ok: true, command: { kind: 'git-worktree', action: 'remove', path, force } };
  }

  return fail('invalid-option', `error: unknown worktree subcommand '${subcommand}'`);
}

function parseGit(args: readonly string[]): ParseResult {
  const [subcommand, ...rest] = args;
  if (subcommand === undefined) {
    return fail('unknown-command', 'usage: git <command> [<args>]');
  }

  switch (subcommand) {
    case 'init':
      return { ok: true, command: { kind: 'git-init' } };

    case 'status':
      return { ok: true, command: { kind: 'git-status' } };

    case 'add': {
      const paths: string[] = [];
      let all = false;
      for (const arg of rest) {
        if (arg === '-A' || arg === '--all') {
          all = true;
          continue;
        }
        if (arg.startsWith('-')) {
          return fail('invalid-option', `error: unknown option \`${arg}'`);
        }
        paths.push(arg);
      }
      if (paths.length === 0 && !all) {
        return fail('invalid-option', 'Nothing specified, nothing added.');
      }
      return { ok: true, command: { kind: 'git-add', paths, all } };
    }

    case 'commit':
      return parseCommit(rest);

    case 'log': {
      let graph = false;
      let oneline = false;
      for (const arg of rest) {
        if (arg === '--graph') graph = true;
        else if (arg === '--oneline') oneline = true;
        else {
          return fail('invalid-option', `error: unrecognized argument: ${arg}`);
        }
      }
      return { ok: true, command: { kind: 'git-log', graph, oneline } };
    }

    case 'branch':
      return parseBranch(rest);

    case 'switch': {
      let create = false;
      let branch: string | undefined;
      let start: string | undefined;
      for (const arg of rest) {
        if (arg === '-c' || arg === '--create') {
          create = true;
          continue;
        }
        if (arg.startsWith('-')) {
          return fail('invalid-option', `error: unknown option \`${arg}'`);
        }
        if (branch === undefined) {
          branch = arg;
        } else if (start === undefined) {
          start = arg;
        } else {
          return fail('invalid-option', 'fatal: too many arguments');
        }
      }
      if (branch === undefined) {
        return fail('invalid-option', 'fatal: missing branch name');
      }
      if (!create && start !== undefined) {
        return fail('invalid-option', 'fatal: too many arguments');
      }
      const base = { kind: 'git-switch' as const, branch, create };
      return {
        ok: true,
        command: start === undefined ? base : { ...base, start },
      };
    }

    case 'checkout': {
      const target = rest[0];
      if (target === undefined) {
        return fail('invalid-option', 'fatal: missing branch or commit');
      }
      if (rest.length > 1) {
        return fail('invalid-option', 'fatal: too many arguments');
      }
      return { ok: true, command: { kind: 'git-checkout', target } };
    }

    case 'merge': {
      const branch = rest[0];
      if (branch === undefined) {
        return fail('invalid-option', 'fatal: missing branch to merge');
      }
      if (rest.length > 1) {
        return fail('invalid-option', 'fatal: too many arguments');
      }
      return { ok: true, command: { kind: 'git-merge', branch } };
    }

    case 'worktree':
      return parseWorktree(rest);

    case 'rm': {
      const path = rest[0];
      if (path === undefined) {
        return fail('invalid-option', 'fatal: No pathspec was given. Which files should I remove?');
      }
      if (rest.length > 1) {
        return fail('invalid-option', 'fatal: too many arguments');
      }
      return { ok: true, command: { kind: 'git-rm', path } };
    }

    default:
      return unknownGitCommand(subcommand);
  }
}

/** Parse une ligne de commande (git ou shell). Les commandes applicatives sont exclues. */
export function parseCommand(input: string): ParseResult {
  const tokens = tokenize(input);
  const [name, ...args] = tokens;
  if (name === undefined) {
    return fail('unknown-command', 'command not found: ');
  }

  if (name === 'git') return parseGit(args);

  switch (name) {
    case 'touch': {
      const path = args[0];
      if (path === undefined) {
        return fail('invalid-option', 'touch: missing file operand');
      }
      return { ok: true, command: { kind: 'shell-touch', path } };
    }

    case 'edit': {
      const path = args[0];
      if (path === undefined) {
        return fail('invalid-option', 'edit: missing file operand');
      }
      const content = args.slice(1).join(' ');
      return {
        ok: true,
        command:
          content === ''
            ? { kind: 'shell-edit', path }
            : { kind: 'shell-edit', path, content },
      };
    }

    case 'rm': {
      const path = args[0];
      if (path === undefined) {
        return fail('invalid-option', 'rm: missing operand');
      }
      return { ok: true, command: { kind: 'shell-rm', path } };
    }

    case 'ls':
      return { ok: true, command: { kind: 'shell-ls' } };

    case 'cd': {
      const target = args[0];
      if (target === undefined) {
        return fail('directory-not-found', 'cd: no such file or directory: ');
      }
      return { ok: true, command: { kind: 'shell-cd', target } };
    }

    default:
      return unknownCommand(name);
  }
}
