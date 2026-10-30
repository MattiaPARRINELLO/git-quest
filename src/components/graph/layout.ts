import type { Commit, Head, RepoState, Worktree } from '../../engine/types';
import { reachableCommits } from '../../engine/ops/diff';
import { branchColor, ORPHAN_COLOR } from '../../lib/colors';

export const X_SPACING = 148;
export const ROW_HEIGHT = 78;
export const PADDING_X = 48;
export const PADDING_Y = 72;
/** Ligne de la branche principale : les autres alternent au-dessus et en dessous. */
const LANE_CENTER_ROWS = 3;

/** lane 0 = 0, lane 1 = -1 (haut), lane 2 = +1 (bas), lane 3 = -2, lane 4 = +2… */
function laneOffset(lane: number): number {
  if (lane === 0) return 0;
  const magnitude = Math.ceil(lane / 2);
  return lane % 2 === 1 ? -magnitude : magnitude;
}

export interface Point {
  readonly x: number;
  readonly y: number;
}

export interface GraphNode {
  readonly hash: string;
  readonly shortHash: string;
  readonly message: string;
  readonly x: number;
  readonly y: number;
  readonly lane: number;
  readonly orphan: boolean;
  readonly files: readonly string[];
  readonly parents: readonly string[];
  readonly branch?: string;
  /** Un worktree a son HEAD sur ce commit : le nœud est rempli. */
  readonly head: boolean;
  /** Le worktree actif (celui du terminal) est sur ce commit. */
  readonly activeHead: boolean;
  /** Au moins un HEAD détaché pointe ici. */
  readonly detachedHead: boolean;
  readonly headPaths: readonly string[];
}

export interface GraphEdge {
  readonly id: string;
  readonly fromHash: string;
  readonly toHash: string;
  readonly from: Point;
  readonly to: Point;
  readonly isMergeParent: boolean;
}

export interface GraphLane {
  readonly index: number;
  readonly y: number;
  readonly color: string;
  readonly branch?: string;
}

export interface BranchLabel {
  readonly name: string;
  readonly commit: string;
  readonly x: number;
  readonly y: number;
  readonly color: string;
}

export interface HeadMarker {
  readonly worktreeId: string;
  readonly path: string;
  readonly commit: string;
  readonly branch: string | null;
  readonly detached: boolean;
  readonly x: number;
  readonly y: number;
  readonly active: boolean;
}

export interface GraphLayout {
  readonly nodes: readonly GraphNode[];
  readonly edges: readonly GraphEdge[];
  readonly lanes: readonly GraphLane[];
  readonly branchLabels: readonly BranchLabel[];
  readonly headMarkers: readonly HeadMarker[];
  readonly width: number;
  readonly height: number;
}

function sortedCommits(state: RepoState): Commit[] {
  return Object.values(state.commits).sort((left, right) => {
    const delta = left.timestamp - right.timestamp;
    return delta !== 0 ? delta : left.hash.localeCompare(right.hash);
  });
}

function connectedHashes(state: RepoState): Set<string> {
  const connected = new Set<string>();
  for (const tip of Object.values(state.branches)) {
    for (const hash of reachableCommits(state, tip)) connected.add(hash);
  }
  for (const worktree of Object.values(state.worktrees)) {
    if (worktree.head.kind === 'detached') {
      for (const hash of reachableCommits(state, worktree.head.commit)) connected.add(hash);
    }
  }
  return connected;
}

function headCommitOfHead(state: RepoState, head: Head): string | undefined {
  return head.kind === 'branch' ? state.branches[head.branch] : head.commit;
}

/**
 * Layout pur du graphe : temps de gauche à droite, une lane par lignée de branche.
 *
 * Stabilité : l'ordonnancement se fait par timestamp de commit, et la lane d'un
 * commit est dérivée de la branche sur laquelle il a été créé (métadonnée figée à la
 * création). Ajouter un commit, une branche ou un merge ne déplace donc jamais un
 * commit existant. Les commits détachés reçoivent chacun leur lane, dans l'ordre de
 * création.
 */
export function layoutGraph(state: RepoState): GraphLayout {
  const commits = sortedCommits(state);
  const connected = connectedHashes(state);

  const headsByCommit = new Map<string, Worktree[]>();
  for (const worktree of Object.values(state.worktrees)) {
    const commit = headCommitOfHead(state, worktree.head);
    if (commit === undefined) continue;
    const list = headsByCommit.get(commit) ?? [];
    list.push(worktree);
    headsByCommit.set(commit, list);
  }

  const laneByKey = new Map<string, number>();
  let laneCount = 0;

  const nodes: GraphNode[] = commits.map((commit, creationIndex) => {
    const key = commit.branch === undefined ? `detached:${commit.hash}` : `branch:${commit.branch}`;
    let lane = laneByKey.get(key);
    if (lane === undefined) {
      lane = laneCount;
      laneCount += 1;
      laneByKey.set(key, lane);
    }

    const heads = headsByCommit.get(commit.hash) ?? [];

    return {
      hash: commit.hash,
      shortHash: commit.hash.slice(0, 7),
      message: commit.message,
      // Index d'ordre de création : les commandes non-commit ne créent aucun espace.
      x: PADDING_X + creationIndex * X_SPACING,
      y: PADDING_Y + (LANE_CENTER_ROWS + laneOffset(lane)) * ROW_HEIGHT,
      lane,
      orphan: !connected.has(commit.hash),
      files: Object.keys(commit.snapshot).sort(),
      parents: commit.parents,
      ...(commit.branch === undefined ? {} : { branch: commit.branch }),
      head: heads.length > 0,
      activeHead: heads.some((worktree) => worktree.id === state.activeWorktree),
      detachedHead: heads.some((worktree) => worktree.head.kind === 'detached'),
      headPaths: heads.map((worktree) => worktree.path),
    };
  });

  const nodeByHash = new Map(nodes.map((node) => [node.hash, node]));

  const edges: GraphEdge[] = [];
  for (const node of nodes) {
    for (const [index, parentHash] of node.parents.entries()) {
      const parent = nodeByHash.get(parentHash);
      if (!parent) continue;
      edges.push({
        id: `${parent.hash}->${node.hash}`,
        fromHash: parent.hash,
        toHash: node.hash,
        from: { x: parent.x, y: parent.y },
        to: { x: node.x, y: node.y },
        isMergeParent: node.parents.length > 1 && index > 0,
      });
    }
  }

  const laneBranch = new Map<number, string>();
  for (const node of nodes) {
    if (node.branch !== undefined && !laneBranch.has(node.lane)) {
      laneBranch.set(node.lane, node.branch);
    }
  }

  const lanes: GraphLane[] = Array.from({ length: laneCount }, (_, index) => {
    const branch = laneBranch.get(index);
    return {
      index,
      y: PADDING_Y + (LANE_CENTER_ROWS + laneOffset(index)) * ROW_HEIGHT,
      color: branch === undefined ? ORPHAN_COLOR : branchColor(branch),
      ...(branch === undefined ? {} : { branch }),
    };
  });

  const branchesAtCommit = new Map<string, string[]>();
  for (const name of Object.keys(state.branches)) {
    const tip = state.branches[name];
    if (tip === undefined) continue;
    const list = branchesAtCommit.get(tip) ?? [];
    list.push(name);
    branchesAtCommit.set(tip, list);
  }

  const branchLabels: BranchLabel[] = [];
  for (const [commitHash, names] of branchesAtCommit) {
    const node = nodeByHash.get(commitHash);
    if (!node) continue;
    names.sort();
    // Collées au nœud, centrées dessus puis empilées vers le bas : on voit
    // immédiatement à quel commit appartient chaque étiquette.
    names.forEach((name, index) => {
      const label: BranchLabel = {
        name,
        commit: commitHash,
        x: node.x + 13,
        y: node.y - 9 + index * 20,
        color: branchColor(name),
      };
      branchLabels.push(label);
    });
  }

  const headMarkers: HeadMarker[] = [];
  for (const [commitHash, worktrees] of headsByCommit) {
    const node = nodeByHash.get(commitHash);
    if (!node) continue;
    worktrees.forEach((worktree, index) => {
      const branch = worktree.head.kind === 'branch' ? worktree.head.branch : null;
      headMarkers.push({
        worktreeId: worktree.id,
        path: worktree.path,
        commit: commitHash,
        branch,
        detached: branch === null,
        x: node.x + 14,
        // Sous le hash du commit (y + 22) : jamais par-dessus.
        y: node.y + 34 + index * 20,
        active: worktree.id === state.activeWorktree,
      });
    });
  }

  const maxX = nodes.reduce((max, node) => Math.max(max, node.x), PADDING_X);
  const maxY = lanes.reduce((max, lane) => Math.max(max, lane.y), PADDING_Y);
  const width = Math.max(560, maxX + 220);
  const height = Math.max(300, maxY + 90);

  return {
    nodes,
    edges,
    lanes,
    branchLabels,
    headMarkers,
    width,
    height,
  };
}
