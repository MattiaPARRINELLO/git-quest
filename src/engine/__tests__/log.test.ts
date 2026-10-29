import { describe, expect, it } from 'vitest';
import { basicRepo, emptyRepo, expectError, run } from './helpers';

function lines(state: ReturnType<typeof basicRepo>, command: string): string[] {
  return run(state, command).output.map((line) => line.text);
}

describe('git log', () => {
  it('affiche les commits du plus récent au plus ancien', () => {
    const repo = run(
      run(basicRepo(), 'edit README.md "v2"').newState,
      'git commit -am "docs: v2"',
    ).newState;

    const output = lines(repo, 'git log --oneline');
    expect(output).toHaveLength(2);
    expect(output[0]).toContain('docs: v2');
    expect(output[1]).toContain('Initial commit');
  });

  it('préfixe avec * en mode --graph', () => {
    const output = lines(basicRepo(), 'git log --oneline --graph');
    expect(output[0]).toMatch(/^\* [0-9a-f]{7} Initial commit$/);
  });

  it('affiche le détail sans --oneline', () => {
    const output = lines(basicRepo(), 'git log').join('\n');
    expect(output).toContain('commit ');
    expect(output).toContain('Author: GitQuest <gitquest@example.com>');
  });

  it('refuse un log sans commit', () => {
    expectError(emptyRepo(), 'git log', 'no-commits');
  });
});
