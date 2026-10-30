import { scenario } from '../../engine/scenario';

/**
 * Racine de l'histoire Nova.
 *
 * Les fichiers sont volontairement ceux des missions existantes : la contrainte
 * « aucun ancien test modifié » prime sur les renommages proposés dans
 * STORY-REPO v2.
 */
export const storyRoot = scenario()
  .init()
  .commit('Initial commit', {
    'a.txt': 'Nova — notes de conception : synchronisation locale.',
    'b.txt': 'Nova — idées : mode sombre, export PDF.',
    'app.ts': 'v1',
    'bug.txt': 'export function login(req) { return db.find(req.user); }',
  })
  .build();
