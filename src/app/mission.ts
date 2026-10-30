import type { ForbiddenCommand, Mission, Prediction } from '../content/types';
import type { RepoState } from '../engine/types';
import { parseCommand } from '../engine/parse/parse-command';
import { resolvePlaceholders } from '../story/display';

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

/** Applique la résolution dynamique (hashes réels) sans changer l'identité du déclencheur. */
export function resolvePrediction(prediction: Prediction, state: RepoState): Prediction {
  const resolution = prediction.resolve?.(state);
  if (resolution === undefined) return prediction;
  return { ...prediction, ...resolution };
}

export interface MissionTexts {
  readonly objective: string;
  readonly hints: readonly [string, string, string];
  readonly solution: readonly string[];
}

/** Textes affichés : placeholders `{slotId}` résolus depuis l'état du joueur. */
export function missionText(mission: Mission, state: RepoState): MissionTexts {
  const display = mission.display;
  const hintsSource = display?.hints ?? mission.hints;
  const hints = hintsSource.map((hint) => resolvePlaceholders(hint, state)) as [
    string,
    string,
    string,
  ];
  return {
    objective: resolvePlaceholders(display?.objective ?? mission.objective, state),
    hints,
    solution: (display?.solution ?? mission.solution).map((command) =>
      resolvePlaceholders(command, state),
    ),
  };
}

/** 3 étoiles sous le par, 2 jusqu'à par + 2, sinon 1. */
export function starsFor(commandCount: number, par: number): 1 | 2 | 3 {
  if (commandCount <= par) return 3;
  if (commandCount <= par + 2) return 2;
  return 1;
}
