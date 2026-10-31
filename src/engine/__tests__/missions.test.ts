import { describe, expect, it } from 'vitest';
import { allMissions, findMission, isMissionUnlocked } from '../../content';
import { execute } from '../execute';
import { findForbiddenCommand, findPrediction } from '../../app/mission';
import { runAll } from './helpers';

describe('missions (contenu réel)', () => {
  it('contient 6 chapitres et 19 missions', () => {
    expect(allMissions).toHaveLength(19);
    expect(new Set(allMissions.map((mission) => mission.chapterId)).size).toBe(6);
  });

  for (const mission of allMissions) {
    it(`${mission.number} ${mission.id} — solution valide, état initial non gagné`, () => {
      const finalState = runAll(mission.initialState, mission.solution);
      const result = mission.validate(finalState);
      expect(result.ok, result.reason).toBe(true);

      const initialResult = mission.validate(mission.initialState);
      expect(initialResult.ok, 'l’état initial ne doit pas déjà valider la mission').toBe(false);

      expect(mission.solution).toHaveLength(mission.par);
      expect(mission.hints).toHaveLength(3);
      expect(mission.story.length).toBeGreaterThan(80);
      expect(mission.objective.length).toBeGreaterThan(10);
      expect(mission.situation.length).toBeGreaterThan(20);
      expect(mission.takeaway.length).toBeGreaterThan(20);
      expect(mission.steps.length).toBeGreaterThanOrEqual(2);
      expect(mission.steps.length).toBeLessThanOrEqual(4);

      const sentences = mission.story.split(/[.!?](?:\s|$)/).filter((part) => part.trim() !== '');
      expect(sentences.length).toBeLessThanOrEqual(3);

      for (const step of mission.steps) {
        expect(step.done(mission.initialState), `étape cochée au départ : ${step.label}`).toBe(false);
        expect(step.done(finalState), `étape non cochée à la fin : ${step.label}`).toBe(true);
      }

      if (mission.suggestedCommands) {
        expect(mission.suggestedCommands.length).toBeGreaterThanOrEqual(3);
        expect(mission.suggestedCommands.length).toBeLessThanOrEqual(5);
      }
    });
  }

  for (const mission of allMissions.filter(
    (candidate) => (candidate.predictions?.length ?? 0) > 0,
  )) {
    it(`${mission.number} — prédictions cohérentes`, () => {
      for (const prediction of mission.predictions ?? []) {
        expect(typeof prediction.trigger).toBe('function');
        expect(prediction.options.length).toBeGreaterThan(1);
        expect(
          prediction.options.some((option) => option.id === prediction.correctOptionId),
        ).toBe(true);
        expect(prediction.explanation.length).toBeGreaterThan(20);
      }
    });
  }

  it('3 variantes de commit déclenchent la même prédiction (toggle de branche)', () => {
    const mission = findMission('qui-avance');
    if (!mission) throw new Error('mission 2.2 attendue');
    const prediction = mission.predictions?.[0];
    if (!prediction) throw new Error('prédiction attendue');

    for (const command of [
      'git commit -m "feat: x"',
      'git commit -am "feat: x"',
      'git commit --message "feat: x"',
    ]) {
      expect(findPrediction(mission, command, mission.initialState)).toBe(prediction);
    }
  });

  it('switch et checkout de branche déclenchent la même prédiction', () => {
    const mission = findMission('branche-pointeur');
    if (!mission) throw new Error('mission 2.1 attendue');
    const prediction = mission.predictions?.[0];
    if (!prediction) throw new Error('prédiction attendue');
    const state = runAll(mission.initialState, ['git branch experiment']);

    for (const command of [
      'git switch experiment',
      'git checkout experiment',
      'git checkout   experiment ',
    ]) {
      expect(findPrediction(mission, command, state)).toBe(prediction);
    }
  });

  it('une fusion déclenche la prédiction quelle que soit la syntaxe', () => {
    const mission = findMission('avance-rapide');
    if (!mission) throw new Error('mission 3.1 attendue');
    const prediction = mission.predictions?.[0];
    if (!prediction) throw new Error('prédiction attendue');
    for (const command of ['git merge feature', 'git   merge feature', 'git merge  feature ']) {
      expect(findPrediction(mission, command, mission.initialState)).toBe(prediction);
    }
  });

  it('1.3 — prédiction ciblée sur -a et chemin add puis commit -am', () => {
    const mission = findMission('piege-am');
    if (!mission) throw new Error('mission 1.3 attendue');

    expect(findPrediction(mission, 'git commit -m "docs"', mission.initialState)).toBeUndefined();
    const prediction = findPrediction(
      mission,
      'git commit -am "docs"',
      mission.initialState,
    );
    expect(prediction?.correctOptionId).toBe('non');
    expect(prediction?.question).toContain('notes.txt');

    const alternative = runAll(mission.initialState, [
      'git add notes.txt',
      'git commit -am "docs: tout"',
    ]);
    expect(mission.validate(alternative).ok).toBe(true);
    for (const step of mission.steps) expect(step.done(alternative)).toBe(true);
    expect(mission.story.toLowerCase()).not.toContain('untracked');
  });

  it('1.3 — git commit -am seul laisse l’untracked hors du commit', () => {
    const mission = findMission('piege-am');
    if (!mission) throw new Error('mission 1.3 attendue');
    const result = execute(mission.initialState, 'git commit -am "docs"');
    expect(result.error).toBeUndefined();
    expect(result.newState.worktrees.main?.index['notes.txt']).toBeUndefined();
    expect(
      result.newState.commits[result.newState.branches.main ?? '']?.snapshot['notes.txt'],
    ).toBeUndefined();
  });

  it('3.3 — -d refuse la branche non fusionnée, -D est une sortie consciente', () => {
    const mission = findMission('menage-branches');
    if (!mission) throw new Error('mission 3.3 attendue');
    const refused = execute(mission.initialState, 'git branch -d experiment');
    expect(refused.error?.code).toBe('branch-not-fully-merged');
    expect(refused.error?.message).toContain("The branch 'experiment' is not fully merged.");

    const forced = runAll(mission.initialState, [
      'git branch -d feature-login',
      'git branch -D experiment',
    ]);
    const result = mission.validate(forced);
    expect(result.ok, result.reason).toBe(true);

    const directAttempt = mission.validateAttempt?.(['git branch -D experiment']);
    expect(directAttempt?.ok, 'forcer sans avoir tenté -d ne suffit pas').toBe(false);
    expect(directAttempt?.reason).toContain('Essaie d’abord git branch -d experiment');
    expect(
      mission.validateAttempt?.(['git branch -d experiment', 'git branch -D experiment'])?.ok,
    ).toBe(true);
  });

  it('3.3 — merge experiment puis -d valide la mission', () => {
    const mission = findMission('menage-branches');
    if (!mission) throw new Error('mission 3.3 attendue');
    const commands = [
      'git branch -d feature-login',
      'git merge experiment',
      'git branch -d experiment',
    ];
    const state = runAll(mission.initialState, commands);
    expect(mission.validate(state).ok).toBe(true);
    expect(mission.validateAttempt?.(commands)?.ok).toBe(true);
  });

  it('3.3 — -d refusé puis -D valide la mission', () => {
    const mission = findMission('menage-branches');
    if (!mission) throw new Error('mission 3.3 attendue');
    const refused = execute(mission.initialState, 'git branch -d experiment');
    expect(refused.error?.code).toBe('branch-not-fully-merged');

    const commands = ['git branch -d feature-login', 'git branch -D experiment'];
    const state = runAll(refused.newState, commands);
    expect(mission.validate(state).ok).toBe(true);
    expect(
      mission.validateAttempt?.(['git branch -d experiment', ...commands])?.ok,
    ).toBe(true);
  });

  it('la clé de progression « commit-perdu » reste valide après renumérotation', () => {
    const mission = findMission('commit-perdu');
    expect(mission?.number).toBe('2.3');
    expect(
      isMissionUnlocked('avance-rapide', { 'commit-perdu': { stars: 3 } }),
      'une mission 2.3 déjà terminée doit déverrouiller la suite',
    ).toBe(true);
  });

  it('4.1 — le WIP initial rend le switch sur main impossible', () => {
    const mission = findMission('hotfix-worktree');
    if (!mission) throw new Error('mission 4.1 attendue');
    const result = execute(mission.initialState, 'git switch main');
    expect(result.error?.code).toBe('local-changes-would-be-overwritten');
    expect(result.newState).toBe(mission.initialState);
  });

  for (const mission of allMissions.filter(
    (candidate) => (candidate.forbidden?.length ?? 0) > 0,
  )) {
    it(`${mission.number} — une commande interdite est refusée`, () => {
      const forbidden = mission.forbidden?.[0];
      if (!forbidden) throw new Error('forbidden attendu');
      expect(findForbiddenCommand(mission, forbidden.prefix)).not.toBeNull();
      expect(findForbiddenCommand(mission, mission.solution[0] ?? '')).toBeNull();

      const result = execute(mission.initialState, forbidden.prefix);
      expect(result.error).toBeDefined();
      expect(result.newState).toBe(mission.initialState);
    });
  }
});
