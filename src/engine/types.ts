/**
 * Types publics du moteur Git simulé.
 *
 * Aucun de ces types ne dépend de React, du DOM ou du stockage.
 */

export type CommitHash = string;
export type BranchName = string;
export type WorktreeId = string;
export type FilePath = string;

/** Contenu complet du disque (ou d'un commit) : chemin -> contenu. */
export type FileTree = Readonly<Record<FilePath, string>>;

export interface Author {
  readonly name: string;
  readonly email: string;
}

export interface Commit {
  readonly hash: CommitHash;
  /** [] pour un commit racine, 2 pour un merge commit. */
  readonly parents: readonly CommitHash[];
  readonly message: string;
  /** Snapshot complet de l'arbre, pas un diff. */
  readonly snapshot: FileTree;
  readonly author: Author;
  /** Horloge logique (jamais Date.now), pour un rendu déterministe. */
  readonly timestamp: number;
  /**
   * Branche sur laquelle HEAD était attaché à la création (métadonnée stable,
   * utile au layout du graphe). Absente pour un commit créé en HEAD détaché.
   */
  readonly branch?: BranchName;
}

export type Head =
  | { readonly kind: 'branch'; readonly branch: BranchName }
  | { readonly kind: 'detached'; readonly commit: CommitHash };

export interface Worktree {
  readonly id: WorktreeId;
  /** Chemin affiché, résolu (ex: `~/gitquest`, `~/gitquest-hotfix`). */
  readonly path: string;
  readonly isMain: boolean;
  readonly head: Head;
  /** Index (staging area) : contenu indexé, l'absence de clé = suppression. */
  readonly index: FileTree;
  /** Working directory : contenu disque. */
  readonly workingDir: FileTree;
}

export interface RepoState {
  readonly version: 1;
  readonly initialized: boolean;
  /** Commits partagés par tous les worktrees. */
  readonly commits: Readonly<Record<CommitHash, Commit>>;
  /** Branches = pointeurs partagés. Une branche absente n'existe pas encore. */
  readonly branches: Readonly<Record<BranchName, CommitHash>>;
  readonly worktrees: Readonly<Record<WorktreeId, Worktree>>;
  /** Worktree sur lequel le terminal agit. */
  readonly activeWorktree: WorktreeId;
  /** Horloge logique monotone (timestamps déterministes). */
  readonly clock: number;
  /** Compteur de génération des hashes déterministes. */
  readonly nextId: number;
}

export type OutputTone = 'default' | 'muted' | 'success' | 'error' | 'warning';

export interface TerminalLine {
  readonly text: string;
  readonly tone?: OutputTone;
}

export type GitErrorCode =
  | 'not-a-repository'
  | 'branch-not-found'
  | 'branch-already-exists'
  | 'invalid-branch-name'
  | 'invalid-reference'
  | 'pathspec-no-match'
  | 'commit-message-not-quoted'
  | 'file-not-found'
  | 'no-commits'
  | 'nothing-to-commit'
  | 'no-changes-added'
  | 'invalid-commit-message'
  | 'branch-checked-out-elsewhere'
  | 'branch-not-fully-merged'
  | 'local-changes-would-be-overwritten'
  | 'untracked-files-would-be-overwritten'
  | 'merge-would-conflict'
  | 'worktree-path-exists'
  | 'worktree-not-found'
  | 'worktree-has-local-modifications'
  | 'worktree-remove-main'
  | 'worktree-remove-active'
  | 'worktree-branch-checked-out'
  | 'directory-not-found'
  | 'invalid-option'
  | 'unknown-command';

export interface GitError {
  readonly code: GitErrorCode;
  /** Message fidèle à Git (multi-lignes si nécessaire). */
  readonly message: string;
}

/**
 * Événements sémantiques : ils pilotent les animations et les explications.
 * Ordre d'émission : fichiers → graphe → HEAD → worktrees/résumés.
 * Chaque action émet au plus un événement de HEAD.
 */
export type GitEvent =
  | { readonly type: 'repo-initialized'; readonly path: string }
  | {
      readonly type: 'commit-created';
      readonly commit: CommitHash;
      readonly message: string;
      readonly worktree: WorktreeId;
      readonly branch?: BranchName;
    }
  | { readonly type: 'branch-created'; readonly name: BranchName; readonly commit: CommitHash }
  | {
      readonly type: 'branch-deleted';
      readonly name: BranchName;
      readonly wasAt: CommitHash;
      readonly force: boolean;
    }
  | {
      readonly type: 'branch-moved';
      readonly name: BranchName;
      readonly from: CommitHash | null;
      readonly to: CommitHash;
    }
  | { readonly type: 'head-attached'; readonly branch: BranchName; readonly commit: CommitHash }
  | { readonly type: 'head-detached'; readonly commit: CommitHash }
  | { readonly type: 'head-moved'; readonly from: Head; readonly to: Head }
  | { readonly type: 'file-staged'; readonly path: FilePath }
  | { readonly type: 'working-file-created'; readonly path: FilePath }
  | { readonly type: 'working-file-edited'; readonly path: FilePath }
  | { readonly type: 'working-file-removed'; readonly path: FilePath }
  | {
      readonly type: 'merge-fast-forward';
      readonly branch: BranchName | null;
      readonly from: CommitHash;
      readonly to: CommitHash;
    }
  | {
      readonly type: 'merge-commit';
      readonly commit: CommitHash;
      readonly parents: readonly [CommitHash, CommitHash];
    }
  | { readonly type: 'up-to-date'; readonly branch: BranchName }
  | {
      readonly type: 'worktree-added';
      readonly id: WorktreeId;
      readonly path: string;
      readonly branch?: BranchName;
    }
  | { readonly type: 'worktree-removed'; readonly id: WorktreeId; readonly path: string }
  | { readonly type: 'worktree-activated'; readonly id: WorktreeId; readonly path: string };

export interface ExecuteResult {
  readonly newState: RepoState;
  readonly output: readonly TerminalLine[];
  readonly events: readonly GitEvent[];
  /** Présent uniquement si la commande a échoué (aucune mutation d'état). */
  readonly error?: GitError;
}

// ---------------------------------------------------------------------------
// Commandes reconnues par le moteur (hors commandes applicatives)
// ---------------------------------------------------------------------------

export type ParsedCommand =
  | { readonly kind: 'git-init' }
  | { readonly kind: 'git-status' }
  | { readonly kind: 'git-add'; readonly paths: readonly string[]; readonly all: boolean }
  | {
      readonly kind: 'git-commit';
      readonly message: string;
      readonly stageAllTracked: boolean;
    }
  | { readonly kind: 'git-log'; readonly graph: boolean; readonly oneline: boolean }
  | {
      readonly kind: 'git-branch';
      readonly action: 'list' | 'create' | 'delete';
      readonly name?: string;
      /** Point de départ optionnel : `git branch <nom> <start>`. */
      readonly start?: string;
      readonly force: boolean;
    }
  | {
      readonly kind: 'git-switch';
      readonly branch: string;
      readonly create: boolean;
      /** Point de départ optionnel : `git switch -c <nom> <start>`. */
      readonly start?: string;
    }
  | { readonly kind: 'git-checkout'; readonly target: string }
  | { readonly kind: 'git-merge'; readonly branch: string }
  | {
      readonly kind: 'git-worktree';
      readonly action: 'add' | 'list' | 'remove';
      readonly path?: string;
      readonly branch?: string;
      readonly createBranch?: string;
      readonly force: boolean;
    }
  | { readonly kind: 'git-rm'; readonly path: string }
  | { readonly kind: 'shell-touch'; readonly path: string }
  | { readonly kind: 'shell-edit'; readonly path: string; readonly content?: string }
  | { readonly kind: 'shell-rm'; readonly path: string }
  | { readonly kind: 'shell-ls' }
  | { readonly kind: 'shell-cd'; readonly target: string };
