import { scenario } from '../engine/scenario';
import type { RepoState } from '../engine/types';

/** Dépôt vierge initialisé : HEAD sur `main`, aucun commit. */
export function createSandboxState(): RepoState {
  return scenario().init().build();
}

/**
 * Démo pédagogique : main + deux branches, un merge commit et un worktree.
 * Utilisée par le bouton « Charger une démo ».
 */
export function createDemoState(): RepoState {
  return scenario()
    .init()
    .commit('Initial commit', {
      'README.md': '# Demo project\n\nGitQuest sandbox.',
      'src/app.ts': "export const app = 'demo';",
    })
    .branch('feature/login')
    .checkout('feature/login')
    .commit('feat: login form', {
      'src/login.ts': "export function login() {\n  return 'ok';\n}",
    })
    .checkout('main')
    .commit('fix: API configuration', {
      'src/config.ts': "export const API_URL = 'https://api.example.com';",
    })
    .run('git merge feature/login')
    .run('git worktree add ../gitquest-hotfix -b hotfix main')
    .build();
}
