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
    'a.txt': 'version 1',
    'b.txt': 'version 1',
    'app.ts': 'v1',
    'bug.txt': 'bug critique',
  })
  .build();
