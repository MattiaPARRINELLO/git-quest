import type { ExecuteResult, FileTree, RepoState } from './types';
import { execute } from './execute';
import { DEFAULT_AUTHOR, hashFor, timestampFor } from './hashes';

function assertOk(result: ExecuteResult, command: string): RepoState {
  if (result.error) {
    throw new Error(`Scénario invalide : « ${command} » a échoué — ${result.error.message}`);
  }
  return result.newState;
}

/**
 * Builder de dépôt pour les tests et les missions.
 * Chaque opération passe par le vrai moteur : un scénario invalide échoue fort.
 *
 * ```ts
 * const repo = scenario()
 *   .init()
 *   .commit('Initial commit', { 'README.md': '# Projet' })
 *   .branch('feature/login')
 *   .checkout('feature/login')
 *   .build();
 * ```
 */
export class Scenario {
  private constructor(private readonly state: RepoState) {}

  /** Reprend un état existant (utile pour composer des scénarios de contenu). */
  static from(state: RepoState): Scenario {
    return new Scenario(state);
  }

  static create(): Scenario {
    return new Scenario({
      version: 1,
      initialized: false,
      commits: {},
      branches: {},
      worktrees: {},
      activeWorktree: 'main',
      clock: 0,
      nextId: 0,
    });
  }

  /** Exécute une commande et renvoie un nouveau builder. */
  run(command: string): Scenario {
    return new Scenario(assertOk(execute(this.state, command), command));
  }

  init(): Scenario {
    return this.run('git init');
  }

  /** Écrit des fichiers dans le worktree actif, les indexe, puis commit. */
  commit(message: string, files: FileTree = {}): Scenario {
    const worktree = this.state.worktrees[this.state.activeWorktree];
    if (!worktree) throw new Error('Scénario invalide : aucun worktree actif');

    const workingDir = { ...worktree.workingDir, ...files };
    const withFiles: RepoState = {
      ...this.state,
      worktrees: {
        ...this.state.worktrees,
        [worktree.id]: { ...worktree, workingDir },
      },
    };

    const staged = assertOk(execute(withFiles, 'git add -A'), 'git add -A');
    const committed = assertOk(
      execute(staged, `git commit -m ${JSON.stringify(message)}`),
      `git commit -m ${JSON.stringify(message)}`,
    );
    return new Scenario(committed);
  }

  /** Crée une branche sans changer de branche active. */
  branch(name: string): Scenario {
    return this.run(`git branch ${name}`);
  }

  /** Bascule sur une branche, ou détache HEAD sur un commit. */
  checkout(target: string): Scenario {
    if (this.state.branches[target] !== undefined) {
      return this.run(`git switch ${target}`);
    }
    return this.run(`git checkout ${target}`);
  }

  /** Ajoute un dépôt distant (`git remote add`). */
  remote(name: string, url: string): Scenario {
    return this.run(`git remote add ${name} ${url}`);
  }

  /**
   * Simule un coéquipier qui a poussé sur le serveur : crée un commit
   * inatteignable depuis les branches locales et avance la branche distante.
   */
  remoteCommit(
    remoteName: string,
    branch: string,
    message: string,
    files: FileTree = {},
  ): Scenario {
    const remote = this.state.remotes?.[remoteName];
    if (remote === undefined) {
      throw new Error(`Scénario invalide : le remote « ${remoteName} » n'existe pas`);
    }

    const parent = remote.branches[branch];
    const snapshot = {
      ...(parent === undefined ? {} : (this.state.commits[parent]?.snapshot ?? {})),
      ...files,
    };
    const hash = hashFor(this.state.nextId);

    return new Scenario({
      ...this.state,
      commits: {
        ...this.state.commits,
        [hash]: {
          hash,
          parents: parent === undefined ? [] : [parent],
          message,
          snapshot,
          author: DEFAULT_AUTHOR,
          timestamp: timestampFor(this.state.clock + 1),
        },
      },
      remotes: {
        ...this.state.remotes,
        [remoteName]: {
          ...remote,
          branches: { ...remote.branches, [branch]: hash },
        },
      },
      clock: this.state.clock + 1,
      nextId: this.state.nextId + 1,
    });
  }

  worktreeAdd(path: string, options: { branch?: string; createBranch?: string } = {}): Scenario {
    const parts = ['git worktree add', path];
    if (options.createBranch !== undefined) parts.push('-b', options.createBranch);
    else if (options.branch !== undefined) parts.push(options.branch);
    return this.run(parts.join(' '));
  }

  /** Supprime un fichier du working dir (le moteur n'expose volontairement pas `rm`). */
  remove(path: string): Scenario {
    const worktree = this.state.worktrees[this.state.activeWorktree];
    if (!worktree) throw new Error('Scénario invalide : aucun worktree actif');
    const workingDir = { ...worktree.workingDir };
    delete workingDir[path];
    return new Scenario({
      ...this.state,
      worktrees: {
        ...this.state.worktrees,
        [worktree.id]: { ...worktree, workingDir },
      },
    });
  }

  /** Écrit dans le working dir sans indexer (pour simuler des modifications locales). */
  write(path: string, content: string): Scenario {
    const worktree = this.state.worktrees[this.state.activeWorktree];
    if (!worktree) throw new Error('Scénario invalide : aucun worktree actif');
    return new Scenario({
      ...this.state,
      worktrees: {
        ...this.state.worktrees,
        [worktree.id]: {
          ...worktree,
          workingDir: { ...worktree.workingDir, [path]: content },
        },
      },
    });
  }

  /** Active un worktree (comme `cd`), sans exécuter de commande Git. */
  activate(path: string): Scenario {
    return this.run(`cd ${path}`);
  }

  get current(): RepoState {
    return this.state;
  }

  build(): RepoState {
    return this.state;
  }
}

export function scenario(): Scenario {
  return Scenario.create();
}
