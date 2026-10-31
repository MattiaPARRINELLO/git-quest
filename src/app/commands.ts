import { execute } from '../engine/execute';
import type {
  GitError,
  GitEvent,
  RepoState,
  TerminalLine,
} from '../engine/types';
import { explainError, explainEvent } from '../explanations/fr';
import { helpOutput, suggestCommand } from './help';

export interface MissionContext {
  readonly title: string;
  readonly hints: readonly [string, string, string];
  readonly initialState: RepoState;
}

export interface RoutedContext {
  readonly state: RepoState;
  readonly history: readonly RepoState[];
  readonly mission: MissionContext | null;
  readonly hintsUsed: number;
}

export type AppEffect = 'execute' | 'explain' | 'undo' | 'hint' | 'reset-mission' | 'help';

export interface RoutedResult {
  readonly state: RepoState;
  readonly history: readonly RepoState[];
  readonly output: readonly TerminalLine[];
  readonly events: readonly GitEvent[];
  readonly error?: GitError;
  readonly effect: AppEffect;
  readonly hintsUsed: number;
  /** false = ne compte pas pour les étoiles. */
  readonly scored: boolean;
}

const HISTORY_LIMIT = 50;

function line(text: string, tone?: TerminalLine['tone']): TerminalLine {
  return tone === undefined ? { text } : { text, tone };
}

function unchanged(context: RoutedContext, effect: AppEffect, output: TerminalLine[]): RoutedResult {
  return {
    state: context.state,
    history: context.history,
    output,
    events: [],
    effect,
    hintsUsed: context.hintsUsed,
    scored: false,
  };
}

function isAppCommand(name: string): boolean {
  return (
    name === 'explain' ||
    name === 'undo' ||
    name === 'hint' ||
    name === 'reset-mission' ||
    name === 'help'
  );
}

export function isAppCommandInput(input: string): boolean {
  const [name] = input.trim().split(/\s+/);
  return name === undefined ? false : isAppCommand(name);
}

/** Commandes qui ne comptent pas dans le score, même réussies. */
export function countsTowardScore(input: string, failed: boolean): boolean {
  if (failed) return false;
  const tokens = input.trim().split(/\s+/);
  const name = tokens[0];
  if (name === undefined) return false;
  if (isAppCommand(name)) return false;
  if (name === 'status' || name === 'log' || name === 'ls' || name === 'cat' || name === 'diff') {
    return false;
  }
  if (name === 'git') {
    const subcommand = tokens[1];
    if (subcommand === 'status' || subcommand === 'log' || subcommand === 'diff') return false;
    if (subcommand === 'worktree' && tokens[2] === 'list') return false;
  }
  return true;
}

export function routeCommand(context: RoutedContext, input: string): RoutedResult {
  const trimmed = input.trim();
  const [name, ...rest] = trimmed.split(/\s+/);

  switch (name) {
    case 'help': {
      return unchanged(context, 'help', helpOutput());
    }

    case 'explain': {
      const command = rest.join(' ').trim();
      if (command === '') {
        return unchanged(context, 'explain', [line('usage: explain <commande>', 'error')]);
      }

      const dryRun = execute(context.state, command);
      if (dryRun.error) {
        return unchanged(context, 'explain', [
          line(`Explication de « ${command} » :`, 'muted'),
          line(dryRun.error.message, 'error'),
          line(`Pourquoi : ${explainError(dryRun.error)}`, 'muted'),
        ]);
      }

      const explanations =
        dryRun.events.length === 0
          ? [line('Cette commande ne modifie pas le dépôt.', 'muted')]
          : dryRun.events.map((event) => line(`• ${explainEvent(event)}`));

      return unchanged(context, 'explain', [
        line(`Explication de « ${command} » :`, 'muted'),
        ...explanations,
      ]);
    }

    case 'undo': {
      if (context.history.length === 0) {
        return unchanged(context, 'undo', [line('Rien à annuler.', 'muted')]);
      }
      const history = context.history.slice(0, -1);
      const previous = context.history[context.history.length - 1];
      if (previous === undefined) {
        return unchanged(context, 'undo', [line('Rien à annuler.', 'muted')]);
      }
      return {
        state: previous,
        history,
        output: [line('Commande annulée.', 'muted')],
        events: [],
        effect: 'undo',
        hintsUsed: context.hintsUsed,
        scored: false,
      };
    }

    case 'hint': {
      if (context.mission === null) {
        return unchanged(context, 'hint', [line('Aucune mission active.', 'muted')]);
      }
      const index = Math.min(context.hintsUsed, context.mission.hints.length - 1);
      const hint = context.mission.hints[index];
      return {
        ...unchanged(context, 'hint', [
          line(`Indice ${index + 1}/${context.mission.hints.length} : ${hint ?? ''}`),
        ]),
        hintsUsed: Math.min(context.hintsUsed + 1, context.mission.hints.length),
      };
    }

    case 'reset-mission': {
      if (context.mission === null) {
        return unchanged(context, 'reset-mission', [line('Aucune mission active.', 'muted')]);
      }
      return {
        state: context.mission.initialState,
        history: [],
        output: [line('Mission réinitialisée.', 'muted')],
        events: [],
        effect: 'reset-mission',
        hintsUsed: 0,
        scored: false,
      };
    }

    default: {
      const result = execute(context.state, trimmed);
      const changed = result.newState !== context.state;
      const history = changed
        ? [...context.history, context.state].slice(-HISTORY_LIMIT)
        : context.history;

      const output = [...result.output];
      if (result.error?.code === 'unknown-command') {
        const suggestion = suggestCommand(trimmed);
        if (suggestion) {
          output.push(line(`Vouliez-vous dire « ${suggestion} » ?`, 'muted'));
        }
        output.push(line('Tape « help » pour voir toutes les commandes.', 'muted'));
      }

      return {
        state: result.newState,
        history,
        output,
        events: result.events,
        ...(result.error === undefined ? {} : { error: result.error }),
        effect: 'execute',
        hintsUsed: context.hintsUsed,
        scored: countsTowardScore(trimmed, result.error !== undefined),
      };
    }
  }
}
