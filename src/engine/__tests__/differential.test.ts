/**
 * Tests différentiels : le même scénario est joué dans un vrai dépôt Git et
 * dans le moteur GitQuest, puis les deux états sont comparés étape par étape.
 *
 * Table de correspondance utilisée par la comparaison :
 *
 * | Moteur                                  | Git réel                                  |
 * | --------------------------------------- | ----------------------------------------- |
 * | `RepoState.branches[nom]`               | `refs/heads/nom` (`for-each-ref`)          |
 * | `Worktree.head` (`branch` / `detached`) | `HEAD` (`symbolic-ref` / `rev-parse`)      |
 * | `Commit.parents`                        | parents (`git rev-list --parents`)         |
 * | `Commit.message`                        | sujet du commit (`git show -s --format=%s`)|
 * | `Commit.snapshot` (chemin -> contenu)   | arbre (`git ls-tree -r` + hash de blob)    |
 * | `Worktree.index` (chemin -> contenu)    | index (`git ls-files --stage`)             |
 * | `Worktree.workingDir` (chemin -> texte) | fichiers du disque hors `.git`             |
 * | `MergeState.conflicts` + `index`        | index multi-étages (`git ls-files --stage`)|
 * | `worktreeStatus()` / `MergeState`       | `git status --porcelain=v1`                |
 *
 * Normalisations assumées (elles ne corrigent pas le moteur, elles isolent ce
 * qui diffère légitimement) :
 *
 * 1. Le moteur ne calcule pas de vrais SHA-1 de commit (`hashFor` hashe un
 *    compteur). On compare donc une identité structurelle : message + arbre
 *    (hashes de blob Git réels) + identités des parents. Les SHA de commit ne
 *    sont jamais comparés.
 * 2. Les hashes de blob et d'arbre sont réels des deux côtés : le contenu des
 *    fichiers est comparé octet pour octet via le SHA-1 de blob Git.
 * 3. Pendant un conflit non résolu, Git stocke trois étages dans l'index alors
 *    que le moteur ne garde que la version « ours ». On compare donc l'index
 *    effectif : étage 0 partout, étage 2 (ours) pour les chemins en conflit.
 * 4. Les en-têtes `index <sha>..<sha>` des diffs sont cosmétiques (le moteur
 *    utilise un hash FNV) : ils sont retirés avant comparaison. Git ajoute
 *    aussi `\ No newline at end of file`, que le moteur n'émet pas ; c'est un
 *    écart observé, asserté explicitement et retiré de la comparaison.
 * 5. `git diff` et `git diff HEAD` du moteur incluent les fichiers non suivis,
 *    contrairement à Git réel. C'est un écart observé, documenté et asserté
 *    explicitement plus bas, pas une normalisation silencieuse.
 *
 * Environnement Git neutralisé : configuration globale et système vides,
 * identité locale, dates fixes, hooks et signature désactivés. Aucun réseau.
 */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { execute } from '../execute';
import { scenario } from '../scenario';
import { diffTrees } from '../ops/diff';
import { activeWorktree, headCommitOf, snapshotOf } from '../ops/refs';
import type { RepoState, Worktree } from '../types';

// ---------------------------------------------------------------------------
// Disponibilité de Git et environnement
// ---------------------------------------------------------------------------

function hasGit(): boolean {
  try {
    execFileSync('git', ['--version'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

const GIT_AVAILABLE = hasGit();
if (!GIT_AVAILABLE) {
  console.warn(
    '[differential] git est introuvable : la suite différentielle est ignorée. ' +
      'Installez git pour comparer le moteur au vrai Git.',
  );
}

const describeDifferential = GIT_AVAILABLE ? describe : describe.skip;

const GIT_ENV: NodeJS.ProcessEnv = {
  ...process.env,
  GIT_CONFIG_GLOBAL: '/dev/null',
  GIT_CONFIG_SYSTEM: '/dev/null',
  GIT_CONFIG_NOSYSTEM: '1',
  GIT_AUTHOR_NAME: 'GitQuest',
  GIT_AUTHOR_EMAIL: 'gitquest@example.com',
  GIT_COMMITTER_NAME: 'GitQuest',
  GIT_COMMITTER_EMAIL: 'gitquest@example.com',
  GIT_AUTHOR_DATE: '2023-11-14T22:13:20Z',
  GIT_COMMITTER_DATE: '2023-11-14T22:13:20Z',
  GIT_TERMINAL_PROMPT: '0',
  GIT_MERGE_AUTOEDIT: 'no',
  LC_ALL: 'C',
};

// ---------------------------------------------------------------------------
// Petit dépôt Git réel dans un dossier temporaire
// ---------------------------------------------------------------------------

class RealRepo {
  readonly dir: string;

  constructor() {
    this.dir = mkdtempSync(join(tmpdir(), 'gitquest-differential-'));
  }

  git(args: readonly string[]): string {
    return execFileSync('git', [...args], {
      cwd: this.dir,
      env: GIT_ENV,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  }

  /** Exécute une commande qui peut légitimement sortir en erreur (merge en conflit). */
  gitAllowFailure(args: readonly string[]): string {
    try {
      return this.git(args);
    } catch (error) {
      const failure = error as { readonly stdout?: string };
      return failure.stdout ?? '';
    }
  }

  init(): void {
    this.git(['init', '-q', '-b', 'main']);
    this.git(['config', 'user.name', 'GitQuest']);
    this.git(['config', 'user.email', 'gitquest@example.com']);
    this.git(['config', 'commit.gpgsign', 'false']);
    this.git(['config', 'tag.gpgsign', 'false']);
    this.git(['config', 'core.autocrlf', 'false']);
    this.git(['config', 'core.safecrlf', 'false']);
    // Aucun hook ne doit s'exécuter, même si l'environnement en fournit.
    this.git(['config', 'core.hooksPath', join(this.dir, '.git', 'no-hooks')]);
  }

  write(path: string, content: string): void {
    const full = join(this.dir, path);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, content, 'utf8');
  }

  remove(path: string): void {
    rmSync(join(this.dir, path), { force: true });
  }

  cleanup(): void {
    rmSync(this.dir, { recursive: true, force: true });
  }
}

type GitAction =
  | { readonly type: 'run'; readonly args: readonly string[]; readonly allowFailure?: boolean }
  | { readonly type: 'write'; readonly path: string; readonly content: string }
  | { readonly type: 'remove'; readonly path: string };

interface Step {
  readonly name: string;
  readonly engine: readonly string[];
  readonly git: readonly GitAction[];
}

function runGit(...args: string[]): GitAction {
  return { type: 'run', args };
}

/** Comme `runGit`, mais un code de sortie non nul est attendu (merge en conflit). */
function runGitAllowingFailure(...args: string[]): GitAction {
  return { type: 'run', args, allowFailure: true };
}

function writeFile(path: string, content: string): GitAction {
  return { type: 'write', path, content };
}

function removeFile(path: string): GitAction {
  return { type: 'remove', path };
}

/** Commande `edit` du moteur, équivalente à une écriture disque. */
function edit(path: string, content: string): string {
  return `edit ${path} ${JSON.stringify(content)}`;
}

function applyGitAction(repo: RealRepo, action: GitAction): void {
  if (action.type === 'run') {
    if (action.allowFailure === true) repo.gitAllowFailure(action.args);
    else repo.git(action.args);
    return;
  }
  if (action.type === 'write') {
    repo.write(action.path, action.content);
    return;
  }
  repo.remove(action.path);
}

// ---------------------------------------------------------------------------
// Normalisation des deux états
// ---------------------------------------------------------------------------

interface CommitShape {
  readonly message: string;
  readonly parents: readonly string[];
  /** chemin -> SHA-1 du blob Git (contenu réel, pas un hash maison). */
  readonly tree: Readonly<Record<string, string>>;
}

interface GraphSnapshot {
  readonly head: string;
  readonly branches: Readonly<Record<string, string>>;
  /** identité structurelle -> forme du commit. */
  readonly commits: Readonly<Record<string, CommitShape>>;
}

interface RepoSnapshot extends GraphSnapshot {
  readonly index: Readonly<Record<string, string>>;
  readonly workingTree: Readonly<Record<string, string>>;
  readonly status: readonly string[];
}

/** SHA-1 d'un blob Git, calculé depuis son contenu (`blob <len>\0<contenu>`). */
function gitBlobHash(content: string): string {
  const header = `blob ${Buffer.byteLength(content, 'utf8')}\0`;
  return createHash('sha1').update(header, 'utf8').update(content, 'utf8').digest('hex');
}

function canonicalId(shape: CommitShape): string {
  const tree = Object.keys(shape.tree)
    .sort()
    .map((path) => [path, shape.tree[path]] as const);
  return createHash('sha256')
    .update(JSON.stringify({ message: shape.message, parents: shape.parents, tree }))
    .digest('hex');
}

function engineGraph(state: RepoState): GraphSnapshot {
  const worktree = activeWorktree(state);
  const tips = new Set<string>(Object.values(state.branches));
  const headHash = headCommitOf(state, worktree.head);
  if (headHash !== undefined) tips.add(headHash);

  const canonicalByHash = new Map<string, string>();
  const commits: Record<string, CommitShape> = {};

  const resolve = (hash: string): string => {
    const cached = canonicalByHash.get(hash);
    if (cached !== undefined) return cached;
    const commit = state.commits[hash];
    if (commit === undefined) throw new Error(`commit introuvable dans le moteur : ${hash}`);

    const parents = commit.parents.map(resolve);
    const tree: Record<string, string> = {};
    for (const [path, content] of Object.entries(commit.snapshot)) {
      tree[path] = gitBlobHash(content);
    }
    const shape: CommitShape = { message: commit.message, parents, tree };
    const canonical = canonicalId(shape);
    canonicalByHash.set(hash, canonical);
    commits[canonical] = shape;
    return canonical;
  };

  for (const tip of tips) resolve(tip);

  const branches: Record<string, string> = {};
  for (const [name, hash] of Object.entries(state.branches)) {
    branches[name] = resolve(hash);
  }

  const head =
    worktree.head.kind === 'branch'
      ? `branch:${worktree.head.branch}`
      : `detached:${resolve(worktree.head.commit)}`;

  return { head, branches, commits };
}

function readRealObjectNames(repo: RealRepo): Record<string, string> {
  const branches: Record<string, string> = {};
  const raw = repo.git([
    'for-each-ref',
    '--format=%(refname:short)%09%(objectname)',
    'refs/heads',
  ]);
  for (const line of raw.split('\n')) {
    if (line === '') continue;
    const [name, object] = line.split('\t');
    if (name !== undefined && object !== undefined) branches[name] = object;
  }
  return branches;
}

function readRealTree(repo: RealRepo, commit: string): Record<string, string> {
  const tree: Record<string, string> = {};
  const raw = repo.git(['ls-tree', '-r', '-z', '--full-tree', commit]);
  for (const record of raw.split('\0')) {
    if (record === '') continue;
    const tab = record.indexOf('\t');
    if (tab < 0) continue;
    const [, type, object] = record.slice(0, tab).split(' ');
    if (type === 'blob' && object !== undefined) tree[record.slice(tab + 1)] = object;
  }
  return tree;
}

function realGraph(repo: RealRepo): GraphSnapshot {
  const branchObjects = readRealObjectNames(repo);
  let headObject: string | undefined;
  try {
    headObject = repo.git(['rev-parse', '--verify', 'HEAD']).trim();
  } catch {
    headObject = undefined;
  }

  const tips = new Set<string>(Object.values(branchObjects));
  if (headObject !== undefined) tips.add(headObject);

  const parentsByHash = new Map<string, string[]>();
  if (tips.size > 0) {
    const raw = repo.git(['rev-list', '--parents', ...tips]);
    for (const line of raw.split('\n')) {
      if (line === '') continue;
      const [hash, ...parents] = line.split(' ');
      if (hash !== undefined) parentsByHash.set(hash, parents);
    }
  }

  const canonicalByHash = new Map<string, string>();
  const commits: Record<string, CommitShape> = {};

  const resolve = (hash: string): string => {
    const cached = canonicalByHash.get(hash);
    if (cached !== undefined) return cached;

    const parents = (parentsByHash.get(hash) ?? []).map(resolve);
    const message = repo.git(['show', '-s', '--format=%s', hash]).replace(/\n$/, '');
    const tree = readRealTree(repo, hash);
    const shape: CommitShape = { message, parents, tree };
    const canonical = canonicalId(shape);
    canonicalByHash.set(hash, canonical);
    commits[canonical] = shape;
    return canonical;
  };

  for (const tip of tips) resolve(tip);

  const branches: Record<string, string> = {};
  for (const [name, object] of Object.entries(branchObjects)) {
    branches[name] = resolve(object);
  }

  let head: string;
  try {
    const branch = repo.git(['symbolic-ref', '--quiet', '--short', 'HEAD']).trim();
    head = `branch:${branch}`;
  } catch {
    if (headObject === undefined) throw new Error('HEAD réel introuvable');
    head = `detached:${resolve(headObject)}`;
  }

  return { head, branches, commits };
}

function readRealWorkingTree(repo: RealRepo): Record<string, string> {
  const files: Record<string, string> = {};

  const walk = (relative: string): void => {
    const absolute = relative === '' ? repo.dir : join(repo.dir, relative);
    for (const entry of readdirSync(absolute, { withFileTypes: true })) {
      if (relative === '' && entry.name === '.git') continue;
      const next = relative === '' ? entry.name : `${relative}/${entry.name}`;
      if (entry.isDirectory()) walk(next);
      else if (entry.isFile()) files[next] = readFileSync(join(repo.dir, next), 'utf8');
    }
  };

  walk('');
  return files;
}

interface IndexEntry {
  readonly path: string;
  readonly stage: number;
  readonly hash: string;
}

function readRealIndex(repo: RealRepo): IndexEntry[] {
  const raw = repo.git(['ls-files', '--stage', '-z']);
  const entries: IndexEntry[] = [];
  for (const record of raw.split('\0')) {
    if (record === '') continue;
    const tab = record.indexOf('\t');
    if (tab < 0) continue;
    const [mode, hash, stage] = record.slice(0, tab).split(' ');
    if (mode === undefined || hash === undefined || stage === undefined) continue;
    entries.push({ path: record.slice(tab + 1), stage: Number(stage), hash });
  }
  return entries;
}

/**
 * Index effectif : étage 0 pour les fichiers normaux, étage 2 (« ours ») pour
 * les chemins en conflit. C'est exactement ce que le moteur stocke dans
 * `Worktree.index` pendant une fusion.
 */
function realEffectiveIndex(entries: readonly IndexEntry[]): Record<string, string> {
  const index: Record<string, string> = {};
  for (const entry of entries) {
    if (entry.stage === 0) index[entry.path] = entry.hash;
  }
  for (const entry of entries) {
    if (entry.stage === 2) index[entry.path] = entry.hash;
  }
  return index;
}

function engineIndex(worktree: Worktree): Record<string, string> {
  const index: Record<string, string> = {};
  for (const [path, content] of Object.entries(worktree.index)) {
    index[path] = gitBlobHash(content);
  }
  return index;
}

function readRealStatus(repo: RealRepo): string[] {
  const raw = repo.git(['status', '--porcelain=v1', '--untracked-files=all']);
  return raw
    .split('\n')
    .filter((line) => line !== '')
    .sort();
}

/** Statut porcelain reconstruit depuis l'état du moteur, conflits compris. */
function engineStatus(state: RepoState, worktree: Worktree): string[] {
  const lines: string[] = [];
  const headSnapshot = snapshotOf(state, headCommitOf(state, worktree.head));
  const conflicted = new Map<string, string>();

  for (const conflict of worktree.merge?.conflicts ?? []) {
    const code =
      conflict.ours === undefined
        ? 'DU'
        : conflict.theirs === undefined
          ? 'UD'
          : conflict.base === undefined
            ? 'AA'
            : 'UU';
    conflicted.set(conflict.path, code);
  }

  const staged = new Map<string, string>();
  for (const change of diffTrees(headSnapshot, worktree.index)) {
    staged.set(
      change.path,
      change.status === 'added' ? 'A' : change.status === 'modified' ? 'M' : 'D',
    );
  }

  const unstaged = new Map<string, string>();
  for (const path of Object.keys(worktree.index)) {
    const before = worktree.index[path];
    const after = worktree.workingDir[path];
    if (before === after) continue;
    unstaged.set(path, after === undefined ? 'D' : 'M');
  }

  const tracked = new Set([...staged.keys(), ...unstaged.keys()]);
  for (const path of [...tracked].sort()) {
    if (conflicted.has(path)) continue;
    const x = staged.get(path) ?? ' ';
    const y = unstaged.get(path) ?? ' ';
    if (x === ' ' && y === ' ') continue;
    lines.push(`${x}${y} ${path}`);
  }

  for (const path of Object.keys(worktree.workingDir).sort()) {
    if (worktree.index[path] !== undefined) continue;
    if (headSnapshot[path] !== undefined) continue;
    lines.push(`?? ${path}`);
  }

  for (const [path, code] of conflicted) lines.push(`${code} ${path}`);
  return lines.sort();
}

function engineSnapshot(state: RepoState): RepoSnapshot {
  const worktree = activeWorktree(state);
  return {
    ...engineGraph(state),
    index: engineIndex(worktree),
    workingTree: { ...worktree.workingDir },
    status: engineStatus(state, worktree),
  };
}

function realSnapshot(repo: RealRepo): RepoSnapshot {
  return {
    ...realGraph(repo),
    index: realEffectiveIndex(readRealIndex(repo)),
    workingTree: readRealWorkingTree(repo),
    status: readRealStatus(repo),
  };
}

// ---------------------------------------------------------------------------
// Exécution d'un scénario et comparaison étape par étape
// ---------------------------------------------------------------------------

function runEngine(state: RepoState, command: string): RepoState {
  const result = execute(state, command);
  if (result.error) {
    throw new Error(`« ${command} » a échoué dans le moteur : ${result.error.message}`);
  }
  return result.newState;
}

function compareStep(name: string, state: RepoState, repo: RealRepo): void {
  expect(realSnapshot(repo), `étape « ${name} »`).toEqual(engineSnapshot(state));
}

function runDifferential(steps: readonly Step[]): void {
  const repo = new RealRepo();
  let state = scenario().build();

  try {
    repo.init();
    state = runEngine(state, 'git init');
    compareStep('init', state, repo);

    for (const step of steps) {
      for (const action of step.git) applyGitAction(repo, action);
      for (const command of step.engine) state = runEngine(state, command);
      compareStep(step.name, state, repo);
    }
  } finally {
    repo.cleanup();
  }
}

// ---------------------------------------------------------------------------
// Scénarios partagés
// ---------------------------------------------------------------------------

const INITIAL_STEPS: readonly Step[] = [
  {
    name: 'écriture des fichiers',
    git: [
      writeFile('README.md', '# Projet'),
      writeFile('src/app.ts', 'export const app = 1;'),
    ],
    engine: [edit('README.md', '# Projet'), edit('src/app.ts', 'export const app = 1;')],
  },
  {
    name: 'indexation initiale',
    git: [runGit('add', '-A')],
    engine: ['git add -A'],
  },
  {
    name: 'premier commit',
    git: [runGit('commit', '-m', 'Initial commit')],
    engine: ['git commit -m "Initial commit"'],
  },
];

describeDifferential('moteur vs Git réel (différentiel)', () => {
  it(
    'init puis premier commit',
    () => {
      runDifferential(INITIAL_STEPS);
    },
    30_000,
  );

  it(
    'création de branche puis changement de branche',
    () => {
      runDifferential([
        ...INITIAL_STEPS,
        {
          name: 'création de feature',
          git: [runGit('branch', 'feature')],
          engine: ['git branch feature'],
        },
        {
          name: 'changement vers feature',
          git: [runGit('switch', 'feature')],
          engine: ['git switch feature'],
        },
        {
          name: 'fichier sur feature',
          git: [writeFile('notes.txt', 'notes de feature')],
          engine: [edit('notes.txt', 'notes de feature')],
        },
        {
          name: 'indexation sur feature',
          git: [runGit('add', 'notes.txt')],
          engine: ['git add notes.txt'],
        },
        {
          name: 'commit sur feature',
          git: [runGit('commit', '-m', 'feat: notes')],
          engine: ['git commit -m "feat: notes"'],
        },
        {
          name: 'retour sur main',
          git: [runGit('switch', 'main')],
          engine: ['git switch main'],
        },
      ]);
    },
    30_000,
  );

  it(
    'merge fast-forward',
    () => {
      runDifferential([
        ...INITIAL_STEPS,
        {
          name: 'création puis changement de branche',
          git: [runGit('branch', 'feature'), runGit('switch', 'feature')],
          engine: ['git branch feature', 'git switch feature'],
        },
        {
          name: 'commit sur feature',
          git: [
            writeFile('notes.txt', 'notes de feature'),
            runGit('add', 'notes.txt'),
            runGit('commit', '-m', 'feat: notes'),
          ],
          engine: [
            edit('notes.txt', 'notes de feature'),
            'git add notes.txt',
            'git commit -m "feat: notes"',
          ],
        },
        {
          name: 'retour sur main',
          git: [runGit('switch', 'main')],
          engine: ['git switch main'],
        },
        {
          name: 'merge fast-forward',
          git: [runGit('merge', 'feature')],
          engine: ['git merge feature'],
        },
      ]);
    },
    30_000,
  );

  it(
    'merge avec conflit puis résolution',
    () => {
      runDifferential([
        ...INITIAL_STEPS,
        {
          name: 'branche feature',
          git: [runGit('branch', 'feature'), runGit('switch', 'feature')],
          engine: ['git branch feature', 'git switch feature'],
        },
        {
          name: 'modification sur feature',
          git: [
            writeFile('README.md', 'version feature'),
            runGit('add', 'README.md'),
            runGit('commit', '-m', 'feat: readme feature'),
          ],
          engine: [
            edit('README.md', 'version feature'),
            'git add README.md',
            'git commit -m "feat: readme feature"',
          ],
        },
        {
          name: 'retour sur main',
          git: [runGit('switch', 'main')],
          engine: ['git switch main'],
        },
        {
          name: 'modification divergente sur main',
          git: [
            writeFile('README.md', 'version main'),
            runGit('add', 'README.md'),
            runGit('commit', '-m', 'feat: readme main'),
          ],
          engine: [
            edit('README.md', 'version main'),
            'git add README.md',
            'git commit -m "feat: readme main"',
          ],
        },
        {
          name: 'merge en conflit',
          git: [runGitAllowingFailure('merge', 'feature')],
          engine: ['git merge feature'],
        },
        {
          name: 'résolution du conflit',
          git: [writeFile('README.md', 'version finale')],
          engine: [edit('README.md', 'version finale')],
        },
        {
          name: 'indexation de la résolution',
          git: [runGit('add', 'README.md')],
          engine: ['git add README.md'],
        },
        {
          name: 'commit de fusion',
          git: [runGit('commit', '-m', 'merge: readme')],
          engine: ['git commit -m "merge: readme"'],
        },
      ]);
    },
    30_000,
  );

  it(
    'diff entre working tree, index et HEAD',
    () => {
      const steps: readonly Step[] = [
        ...INITIAL_STEPS,
        {
          name: 'préparation des trois zones',
          git: [
            writeFile('README.md', 'version indexée'),
            runGit('add', 'README.md'),
            writeFile('src/app.ts', 'export const app = 2;'),
            writeFile('notes.txt', 'brouillon non suivi'),
          ],
          engine: [
            edit('README.md', 'version indexée'),
            'git add README.md',
            edit('src/app.ts', 'export const app = 2;'),
            edit('notes.txt', 'brouillon non suivi'),
          ],
        },
      ];

      runDifferential(steps);

      // Les états sont comparés ci-dessus. On compare maintenant la sortie des
      // trois diffs, en retirant les en-têtes `index` (hash cosmétique).
      const repo = new RealRepo();
      let state = scenario().build();
      try {
        repo.init();
        state = runEngine(state, 'git init');
        for (const step of steps) {
          for (const action of step.git) applyGitAction(repo, action);
          for (const command of step.engine) state = runEngine(state, command);
        }

        const diffCases = [
          { git: ['diff', '--staged'], engine: 'git diff --staged', untracked: false },
          { git: ['diff'], engine: 'git diff', untracked: true },
          { git: ['diff', 'HEAD'], engine: 'git diff HEAD', untracked: true },
        ] as const;

        for (const diffCase of diffCases) {
          const realRaw = repo.git(diffCase.git);
          const engineRaw = execute(state, diffCase.engine)
            .output.map((line) => line.text)
            .join('\n');

          // Écart observé : Git signale l'absence de newline final, le moteur
          // non. Asserté ici pour documenter le comportement actuel.
          expect(realRaw, diffCase.engine).toContain('\\ No newline at end of file');
          expect(engineRaw, diffCase.engine).not.toContain('\\ No newline at end of file');

          const real = normalizeDiff(realRaw);
          const engine = normalizeDiff(engineRaw);

          if (!diffCase.untracked) {
            expect(engine, diffCase.engine).toEqual(real);
            continue;
          }

          // Écart observé : Git ignore les fichiers non suivis, le moteur les
          // ajoute comme des créations. On l'asserte pour qu'une correction
          // future fasse échouer ce test et force la mise à jour du rapport.
          expect(real.join('\n'), diffCase.engine).not.toContain('diff --git a/notes.txt');
          expect(engine.join('\n'), diffCase.engine).toContain('diff --git a/notes.txt');
          expect(
            withoutFileDiff(engine, 'notes.txt'),
            diffCase.engine,
          ).toEqual(withoutFileDiff(real, 'notes.txt'));
        }
      } finally {
        repo.cleanup();
      }
    },
    30_000,
  );

  it(
    'commit sur une branche puis retour sur main',
    () => {
      runDifferential([
        ...INITIAL_STEPS,
        {
          name: 'branche feature',
          git: [runGit('switch', '-c', 'feature')],
          engine: ['git switch -c feature'],
        },
        {
          name: 'commit sur feature',
          git: [
            writeFile('src/app.ts', 'export const app = 2;'),
            runGit('commit', '-am', 'feat: app v2'),
          ],
          engine: [edit('src/app.ts', 'export const app = 2;'), 'git commit -am "feat: app v2"'],
        },
        {
          name: 'retour sur main',
          git: [runGit('switch', 'main')],
          engine: ['git switch main'],
        },
      ]);
    },
    30_000,
  );

  it(
    'suppression suivie depuis le working tree puis git rm',
    () => {
      runDifferential([
        ...INITIAL_STEPS,
        {
          name: 'suppression disque (non indexée)',
          git: [removeFile('README.md')],
          engine: ['rm README.md'],
        },
        {
          name: 'suppression indexée',
          git: [runGit('rm', 'src/app.ts')],
          engine: ['git rm src/app.ts'],
        },
      ]);
    },
    30_000,
  );
});

function normalizeDiff(text: string): string[] {
  const lines = text
    .split('\n')
    .filter((line) => !line.startsWith('index ') && line !== '\\ No newline at end of file');
  while (lines.length > 0 && lines[lines.length - 1] === '') lines.pop();
  return lines;
}

/** Retire le bloc `diff --git` d'un chemin, pour isoler un écart connu. */
function withoutFileDiff(lines: readonly string[], path: string): string[] {
  const header = `diff --git a/${path} b/${path}`;
  const result: string[] = [];
  let skipping = false;
  for (const line of lines) {
    if (line === header) {
      skipping = true;
      continue;
    }
    if (line.startsWith('diff --git ')) skipping = false;
    if (!skipping) result.push(line);
  }
  return result;
}
