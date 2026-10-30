import { execute } from '../engine/execute';
import type { RepoState } from '../engine/types';

/** Exécute une séquence en échouant fort si le contenu est invalide. */
export function applyCommands(state: RepoState, commands: readonly string[]): RepoState {
  return commands.reduce((current, command) => {
    const result = execute(current, command);
    if (result.error) {
      throw new Error(`Contenu invalide : « ${command} » → ${result.error.message}`);
    }
    return result.newState;
  }, state);
}

export function shortTip(state: RepoState, branch: string): string {
  const tip = state.branches[branch];
  if (!tip) throw new Error(`Contenu invalide : branche ${branch} absente`);
  return tip.slice(0, 7);
}
