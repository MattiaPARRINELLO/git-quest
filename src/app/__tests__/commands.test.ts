import { describe, expect, it } from 'vitest';
import { basicRepo, emptyRepo, run } from '../../engine/__tests__/helpers';
import { countsTowardScore, routeCommand } from '../commands';
import type { MissionContext, RoutedContext, RoutedResult } from '../commands';

const noMission: RoutedContext = {
  state: basicRepo(),
  history: [],
  mission: null,
  hintsUsed: 0,
};

function contextOf(
  result: RoutedResult,
  mission: MissionContext | null = null,
): RoutedContext {
  return {
    state: result.state,
    history: result.history,
    mission,
    hintsUsed: result.hintsUsed,
  };
}

describe('commandes applicatives', () => {
  it('explain ne modifie pas l’état et décrit les événements', () => {
    const result = routeCommand(noMission, 'explain git branch feature');
    expect(result.state).toBe(noMission.state);
    expect(result.effect).toBe('explain');
    expect(result.output.map((line) => line.text).join('\n')).toContain(
      'La branche « feature » est créée',
    );
    expect(result.scored).toBe(false);
  });

  it('explain affiche l’erreur et son explication', () => {
    const result = routeCommand(noMission, 'explain git switch inconnue');
    const text = result.output.map((line) => line.text).join('\n');
    expect(text).toContain('invalid reference');
    expect(text).toContain('Pourquoi :');
    expect(result.state).toBe(noMission.state);
  });

  it('explain signale une commande sans effet', () => {
    const result = routeCommand(noMission, 'explain git status');
    expect(result.output.map((line) => line.text)).toContain(
      'Cette commande ne modifie pas le dépôt.',
    );
  });

  it('explain sans argument affiche l’usage', () => {
    const result = routeCommand(noMission, 'explain');
    expect(result.output[0]?.text).toBe('usage: explain <commande>');
  });

  it('undo restaure l’état précédent et n’est pas scoré', () => {
    const executed = routeCommand(noMission, 'git branch feature');
    expect(executed.history).toHaveLength(1);

    const undone = routeCommand(contextOf(executed), 'undo');
    expect(undone.state).toBe(noMission.state);
    expect(undone.history).toHaveLength(0);
    expect(undone.output[0]?.text).toBe('Commande annulée.');
    expect(undone.scored).toBe(false);
  });

  it('undo sans historique ne fait rien', () => {
    const result = routeCommand(noMission, 'undo');
    expect(result.output[0]?.text).toBe('Rien à annuler.');
    expect(result.state).toBe(noMission.state);
  });

  it('hint dévoile les indices progressivement', () => {
    const initialState = run(basicRepo(), 'git branch feature').newState;
    const mission: MissionContext = {
      title: 'Mission test',
      hints: ['vague', 'précis', 'solution'],
      initialState,
    };
    const context: RoutedContext = { ...noMission, mission };

    const first = routeCommand(context, 'hint');
    expect(first.output[0]?.text).toContain('vague');
    expect(first.hintsUsed).toBe(1);

    const second = routeCommand(contextOf(first, mission), 'hint');
    expect(second.output[0]?.text).toContain('précis');
    expect(second.hintsUsed).toBe(2);

    const third = routeCommand(contextOf(second, mission), 'hint');
    expect(third.output[0]?.text).toContain('solution');
    expect(third.hintsUsed).toBe(3);

    const fourth = routeCommand(contextOf(third, mission), 'hint');
    expect(fourth.hintsUsed).toBe(3);
  });

  it('hint sans mission est inerte', () => {
    const result = routeCommand(noMission, 'hint');
    expect(result.output[0]?.text).toBe('Aucune mission active.');
  });

  it('reset-mission restaure l’état initial et vide l’historique', () => {
    const context: RoutedContext = {
      ...noMission,
      state: run(basicRepo(), 'touch brouillon.txt').newState,
      history: [emptyRepo()],
      hintsUsed: 2,
      mission: {
        title: 'Mission test',
        hints: ['a', 'b', 'c'],
        initialState: basicRepo(),
      },
    };

    const result = routeCommand(context, 'reset-mission');
    expect(result.state).toBe(context.mission?.initialState);
    expect(result.history).toEqual([]);
    expect(result.hintsUsed).toBe(0);
    expect(result.output[0]?.text).toBe('Mission réinitialisée.');
  });
});

describe('score', () => {
  it('exclut status, log, ls, worktree list, erreurs et commandes app', () => {
    expect(countsTowardScore('git status', false)).toBe(false);
    expect(countsTowardScore('git log --oneline', false)).toBe(false);
    expect(countsTowardScore('ls', false)).toBe(false);
    expect(countsTowardScore('git worktree list', false)).toBe(false);
    expect(countsTowardScore('git add .', true)).toBe(false);
    expect(countsTowardScore('explain git merge x', false)).toBe(false);
    expect(countsTowardScore('hint', false)).toBe(false);
  });

  it('compte les commandes qui changent réellement le dépôt', () => {
    expect(countsTowardScore('git add .', false)).toBe(true);
    expect(countsTowardScore('git commit -m test', false)).toBe(true);
    expect(countsTowardScore('touch a.txt', false)).toBe(true);
    expect(countsTowardScore('git branch feature', false)).toBe(true);
  });

  it('n’empile pas d’historique pour une commande sans effet', () => {
    const result = routeCommand(noMission, 'git status');
    expect(result.history).toEqual([]);
    expect(result.scored).toBe(false);
  });
});
