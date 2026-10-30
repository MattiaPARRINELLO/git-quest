import { describe, expect, it } from 'vitest';
import { DEFAULT_AUTHOR } from '../../engine/hashes';
import { scenario } from '../../engine/scenario';
import { PLAYER, TEAMMATES, teammateForAuthor, stampAuthor, teammateAuthor } from '../actor';

const state = scenario()
  .init()
  .commit('Initial commit', { 'README.md': 'v1' })
  .commit('feat: suite', { 'a.txt': 'A' })
  .build();

const tip = state.branches.main ?? '';
const root = Object.values(state.commits).find((commit) => commit.parents.length === 0)?.hash ?? '';

describe('auteur de coéquipier', () => {
  it('expose quatre coéquipiers nommés et un joueur distinct', () => {
    expect(Object.keys(TEAMMATES)).toEqual(['lea', 'samir', 'ines', 'yanis']);
    expect(teammateAuthor('lea')).toEqual({ name: 'Léa Moreau', email: 'lea@nova.dev' });
    expect(PLAYER).toBe(DEFAULT_AUTHOR);
  });

  it('réécrit uniquement l’auteur du commit ciblé, sans muter l’entrée', () => {
    const stamped = stampAuthor(state, tip, teammateAuthor('samir'));

    expect(stamped).not.toBe(state);
    expect(stamped.commits[tip]?.author.name).toBe('Samir Haddad');
    expect(stamped.commits[tip]?.message).toBe('feat: suite');
    expect(stamped.commits[tip]?.snapshot).toEqual(state.commits[tip]?.snapshot);
    expect(stamped.commits[root]?.author).toEqual(DEFAULT_AUTHOR);
    expect(state.commits[tip]?.author).toEqual(DEFAULT_AUTHOR);
    expect(stamped.branches).toEqual(state.branches);
  });

  it('laisse l’état intact si le commit est inconnu', () => {
    expect(stampAuthor(state, 'inconnu', teammateAuthor('ines'))).toBe(state);
  });

  it('retrouve un coéquipier par le nom d’auteur', () => {
    expect(teammateForAuthor({ name: 'Samir Haddad', email: 'samir@nova.dev' })?.id).toBe('samir');
    expect(teammateForAuthor({ name: 'GitQuest', email: 'gitquest@example.com' })).toBeUndefined();
  });

  it('refuse un coéquipier inconnu', () => {
    expect(() => teammateAuthor('inconnu')).toThrow(/Coéquipier inconnu/);
  });
});
