import type { ExecuteResult, RepoState } from './types';
import { parseCommand } from './parse/parse-command';
import { dispatch } from './commands/registry';
import { failure } from './commands/shared';

/**
 * Point d'entrée unique du moteur.
 * En cas d'erreur, `newState === state` : aucune mutation partielle.
 */
export function execute(state: RepoState, command: string): ExecuteResult {
  const parsed = parseCommand(command);
  if (!parsed.ok) return failure(state, parsed.error);
  return dispatch(state, parsed.command);
}

export * from './types';
export { scenario } from './scenario';
export * from './validate';
export { REPO_ROOT } from './commands/shared';
