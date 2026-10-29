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
      'README.md': '# Projet de démo\n\nBac à sable GitQuest.',
      'src/app.ts': "export const app = 'demo';",
    })
    .branch('feature/login')
    .checkout('feature/login')
    .commit('feat: formulaire de connexion', {
      'src/login.ts': "export function login() {\n  return 'ok';\n}",
    })
    .checkout('main')
    .commit('fix: configuration API', {
      'src/config.ts': "export const API_URL = 'https://api.example.com';",
    })
    .run('git merge feature/login')
    .run('git worktree add ../gitquest-hotfix -b hotfix main')
    .build();
}
