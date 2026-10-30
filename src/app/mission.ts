import type { ForbiddenCommand, Mission, Prediction } from '../content/types';
import type { RepoState } from '../engine/types';
import { parseCommand } from '../engine/parse/parse-command';

export function normalizeCommand(input: string): string {
  return input.trim().replace(/\s+/g, ' ');
}

export function findForbiddenCommand(
  mission: Mission,
  input: string,
): ForbiddenCommand | null {
  const normalized = normalizeCommand(input);
  return (
    mission.forbidden?.find(
      (forbidden) =>
        normalized === forbidden.prefix || normalized.startsWith(`${forbidden.prefix} `),
    ) ?? null
  );
}

export function findPrediction(
  mission: Mission,
  input: string,
  state: RepoState,
): Prediction | undefined {
  const parsed = parseCommand(input);
  if (!parsed.ok) return undefined;
  return mission.predictions?.find((prediction) =>
    prediction.trigger(parsed.command, state),
  );
}

/** 3 étoiles sous le par, 2 jusqu'à par + 2, sinon 1. */
export function starsFor(commandCount: number, par: number): 1 | 2 | 3 {
  if (commandCount <= par) return 3;
  if (commandCount <= par + 2) return 2;
  return 1;
}
