import type {
  ExecuteResult,
  GitError,
  GitEvent,
  OutputTone,
  RepoState,
  TerminalLine,
} from '../types';
import { activeWorktree } from '../ops/refs';

export const REPO_ROOT = '~/gitquest';

export function line(text: string, tone?: OutputTone): TerminalLine {
  return tone === undefined ? { text } : { text, tone };
}

export function success(
  newState: RepoState,
  output: readonly TerminalLine[] = [],
  events: readonly GitEvent[] = [],
): ExecuteResult {
  return { newState, output, events };
}

export function failure(
  state: RepoState,
  error: GitError,
  events: readonly GitEvent[] = [],
): ExecuteResult {
  return {
    newState: state,
    output: [line(error.message, 'error')],
    events,
    error,
  };
}

export function requireRepository(state: RepoState): GitError | null {
  if (state.initialized) return null;
  return {
    code: 'not-a-repository',
    message: 'fatal: not a git repository (or any of the parent directories): .git',
  };
}

export function activePath(state: RepoState): string {
  return activeWorktree(state).path;
}

export function plural(count: number, singular: string, pluralForm: string): string {
  return count === 1 ? singular : pluralForm;
}

export function describeChanges(count: number): string {
  return `${count} ${plural(count, 'file changed', 'files changed')}`;
}
