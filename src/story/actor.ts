import type { Author, CommitHash, RepoState } from '../engine/types';
import { DEFAULT_AUTHOR } from '../engine/hashes';
import type { Teammate, TeammateId } from './types';

/**
 * Auteur d'un commit de prelude.
 *
 * Le moteur ne connaît qu'un auteur fixe. On ne modifie pas les commandes Git :
 * `stampAuthor` réécrit **uniquement** le champ `author` du commit créé, de
 * façon pure. Rien de tout cela n'est exposé au terminal.
 */

export const PLAYER: Author = DEFAULT_AUTHOR;

export const TEAMMATES: Readonly<Record<TeammateId, Teammate>> = {
  lea: {
    id: 'lea',
    name: 'Léa Moreau',
    role: 'backend',
    author: { name: 'Léa Moreau', email: 'lea@nova.dev' },
  },
  samir: {
    id: 'samir',
    name: 'Samir Haddad',
    role: 'docs',
    author: { name: 'Samir Haddad', email: 'samir@nova.dev' },
  },
  ines: {
    id: 'ines',
    name: 'Inès Bouvet',
    role: 'QA / release',
    author: { name: 'Inès Bouvet', email: 'ines@nova.dev' },
  },
  yanis: {
    id: 'yanis',
    name: 'Yanis Perret',
    role: 'frontend',
    author: { name: 'Yanis Perret', email: 'yanis@nova.dev' },
  },
};

export function teammateAuthor(id: TeammateId): Author {
  const teammate = TEAMMATES[id];
  if (teammate === undefined) throw new Error(`Coéquipier inconnu : ${id}`);
  return teammate.author;
}

/** Réécrit l'auteur d'un commit existant. État inchangé si le hash est absent. */
export function stampAuthor(
  state: RepoState,
  hash: CommitHash,
  author: Author,
): RepoState {
  const commit = state.commits[hash];
  if (commit === undefined) return state;
  return {
    ...state,
    commits: {
      ...state.commits,
      [hash]: { ...commit, author },
    },
  };
}
