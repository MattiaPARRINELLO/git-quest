import { describe, expect, it } from 'vitest';
import { execute } from '../execute';
import { Scenario, scenario } from '../scenario';
import { activeWorktree, basicRepo, expectError, run, runAll } from './helpers';

const ORIGIN = 'git@github.com:nova/nova.git';

function repoWithRemote() {
  return scenario()
    .init()
    .commit('Initial commit', { 'README.md': '# Projet' })
    .remote('origin', ORIGIN)
    .build();
}

describe('git remote', () => {
  it('liste, ajoute et supprime des remotes', () => {
    expect(run(basicRepo(), 'git remote').output).toEqual([]);

    const added = run(basicRepo(), `git remote add origin ${ORIGIN}`);
    expect(added.events).toEqual([{ type: 'remote-added', name: 'origin', url: ORIGIN }]);
    expect(added.newState.remotes?.origin?.url).toBe(ORIGIN);

    const listed = run(added.newState, 'git remote -v').output.map((line) => line.text);
    expect(listed).toEqual([`origin\t${ORIGIN} (fetch)`, `origin\t${ORIGIN} (push)`]);

    const removed = run(added.newState, 'git remote remove origin');
    expect(removed.newState.remotes).toEqual({});
  });

  it('refuse un doublon et un remote inconnu', () => {
    const repo = repoWithRemote();
    expectError(repo, `git remote add origin ${ORIGIN}`, 'remote-already-exists');
    expectError(repo, 'git remote remove absent', 'remote-not-found');
  });
});

describe('git push', () => {
  it('refuse sans remote configuré', () => {
    expectError(basicRepo(), 'git push', 'no-push-destination');
  });

  it('refuse sans upstream quand le remote existe', () => {
    const error = expectError(repoWithRemote(), 'git push', 'no-upstream');
    expect(error.message).toContain('has no upstream branch');
  });

  it('-u publie la branche et enregistre l’upstream', () => {
    const repo = repoWithRemote();
    const tip = repo.branches.main;
    if (!tip) throw new Error('main attendue');

    const result = run(repo, 'git push -u origin main');
    expect(result.newState.remotes?.origin?.branches.main).toBe(tip);
    expect(result.newState.upstream?.main).toBe('origin/main');
    expect(result.output.map((line) => line.text)).toContain(
      ' * [new branch]      main -> main',
    );
    expect(result.events.map((event) => event.type)).toEqual([
      'upstream-set',
      'remote-updated',
    ]);

    const again = run(result.newState, 'git push');
    expect(again.output[0]?.text).toBe('Everything up-to-date');
  });

  it('rejette un push non fast-forward', () => {
    const pushed = run(repoWithRemote(), 'git push -u origin main').newState;
    const behind = Scenario.from(pushed)
      .remoteCommit('origin', 'main', 'feat: coéquipier', { 'team.txt': 'notes' })
      .build();

    const error = expectError(behind, 'git push', 'push-rejected');
    expect(error.message).toContain('! [rejected]');
    expect(error.message).toContain('git pull');
  });
});

describe('git fetch', () => {
  it('met à jour les références de suivi sans toucher au local', () => {
    const pushed = run(repoWithRemote(), 'git push -u origin main').newState;
    const shared = Scenario.from(pushed)
      .remoteCommit('origin', 'main', 'feat: coéquipier', { 'team.txt': 'notes' })
      .build();
    const localTip = shared.branches.main;

    const result = run(shared, 'git fetch');
    const remoteTip = shared.remotes?.origin?.branches.main;
    if (!remoteTip) throw new Error('remote attendu');

    expect(result.newState.remoteTracking?.['origin/main']).toBe(remoteTip);
    expect(result.newState.branches.main).toBe(localTip);
    expect(result.output.map((line) => line.text).some((text) => text.includes('-> origin/main'))).toBe(
      true,
    );
    expect(result.events).toEqual([
      { type: 'remote-fetched', remote: 'origin', branches: ['main'] },
    ]);
  });

  it('refuse un remote inconnu', () => {
    expectError(repoWithRemote(), 'git fetch absent', 'remote-not-found');
  });
});

describe('git pull', () => {
  function divergedRepo() {
    const pushed = run(repoWithRemote(), 'git push -u origin main').newState;
    const remoteAhead = Scenario.from(pushed)
      .remoteCommit('origin', 'main', 'feat: coéquipier', { 'team.txt': 'notes' })
      .build();
    return { pushed, remoteAhead };
  }

  it('avance en fast-forward', () => {
    const { remoteAhead } = divergedRepo();
    const remoteTip = remoteAhead.remotes?.origin?.branches.main;
    if (!remoteTip) throw new Error('remote attendu');

    const result = run(remoteAhead, 'git pull');
    expect(result.newState.branches.main).toBe(remoteTip);
    expect(activeWorktree(result.newState).workingDir['team.txt']).toBe('notes');
    expect(result.output.map((line) => line.text)).toContain('Fast-forward');
  });

  it('crée un merge commit quand les historiques divergent', () => {
    const { remoteAhead } = divergedRepo();
    const local = run(remoteAhead, 'edit README.md "local"').newState;
    const withCommit = run(local, 'git commit -am "local"').newState;
    const localTip = withCommit.branches.main;
    const remoteTip = withCommit.remotes?.origin?.branches.main;
    if (!localTip || !remoteTip) throw new Error('commits attendus');

    const result = run(withCommit, 'git pull');
    const tip = result.newState.branches.main;
    if (!tip) throw new Error('main attendue');

    expect(result.newState.commits[tip]?.parents).toEqual([localTip, remoteTip]);
    expect(result.newState.commits[tip]?.message).toBe("Merge branch 'origin/main'");
    expect(result.events.map((event) => event.type)).toContain('merge-commit');
  });

  it('s’arrête en conflit quand les deux côtés touchent le même fichier', () => {
    const { remoteAhead } = divergedRepo();
    const local = runAll(remoteAhead, [
      'edit team.txt "version locale"',
      'git add team.txt',
      'git commit -m "local: team"',
    ]);

    const result = execute(local, 'git pull');
    expect(result.error).toBeUndefined();
    expect(result.newState.worktrees.main?.merge?.conflicts.map((c) => c.path)).toEqual([
      'team.txt',
    ]);
    expect(result.newState.worktrees.main?.workingDir['team.txt']).toContain('<<<<<<< HEAD');
  });

  it('refuse sans upstream ni argument', () => {
    const repo = repoWithRemote();
    const error = expectError(repo, 'git pull', 'no-upstream');
    expect(error.message).toContain('no tracking information');
  });

  it('refuse une branche absente du serveur', () => {
    const repo = run(repoWithRemote(), 'git push -u origin main').newState;
    expectError(repo, 'git pull origin absente', 'remote-ref-not-found');
  });
});

describe('git status et les remotes', () => {
  it('affiche l’avance par rapport à l’upstream', () => {
    const pushed = run(repoWithRemote(), 'git push -u origin main').newState;
    expect(run(pushed, 'git status').output.map((line) => line.text)).toContain(
      "Your branch is up to date with 'origin/main'.",
    );

    const ahead = runAll(pushed, ['edit README.md "v2"', 'git commit -am "v2"']);
    expect(run(ahead, 'git status').output.map((line) => line.text)).toContain(
      "Your branch is ahead of 'origin/main' by 1 commit.",
    );
  });

  it('affiche le retard après un fetch', () => {
    const pushed = run(repoWithRemote(), 'git push -u origin main').newState;
    const shared = Scenario.from(pushed)
      .remoteCommit('origin', 'main', 'feat: coéquipier', { 'team.txt': 'notes' })
      .build();
    const fetched = run(shared, 'git fetch').newState;
    const texts = run(fetched, 'git status').output.map((line) => line.text);
    expect(texts).toContain(
      "Your branch is behind 'origin/main' by 1 commit, and can be fast-forwarded.",
    );
  });
});
