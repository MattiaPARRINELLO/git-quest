import type { FileTree } from '../types';

export type DiffLineKind = 'meta' | 'context' | 'add' | 'del';

export interface DiffLine {
  readonly kind: DiffLineKind;
  readonly text: string;
}

const CONTEXT = 3;

/** Hash court déterministe (FNV-1a) pour l'en-tête `index a..b`, purement cosmétique. */
function blobHash(content: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < content.length; index += 1) {
    hash ^= content.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0').slice(0, 7);
}

function toLines(content: string | undefined): string[] {
  if (content === undefined || content === '') return [];
  return content.split('\n');
}

type Op = { readonly kind: 'context' | 'add' | 'del'; readonly text: string };

/** Diff ligne à ligne via LCS : les fichiers de GitQuest restent petits. */
function lineOps(before: readonly string[], after: readonly string[]): Op[] {
  const rows = before.length;
  const cols = after.length;
  const table: number[][] = Array.from({ length: rows + 1 }, () =>
    Array.from({ length: cols + 1 }, () => 0),
  );

  for (let row = rows - 1; row >= 0; row -= 1) {
    for (let col = cols - 1; col >= 0; col -= 1) {
      table[row]![col] =
        before[row] === after[col]
          ? (table[row + 1]?.[col + 1] ?? 0) + 1
          : Math.max(table[row + 1]?.[col] ?? 0, table[row]![col + 1] ?? 0);
    }
  }

  const ops: Op[] = [];
  let row = 0;
  let col = 0;
  while (row < rows && col < cols) {
    const oldLine = before[row];
    const newLine = after[col];
    if (oldLine === newLine) {
      ops.push({ kind: 'context', text: oldLine ?? '' });
      row += 1;
      col += 1;
    } else if ((table[row + 1]?.[col] ?? 0) >= (table[row]?.[col + 1] ?? 0)) {
      // Git affiche d'abord les suppressions, puis les ajouts.
      ops.push({ kind: 'del', text: oldLine ?? '' });
      row += 1;
    } else {
      ops.push({ kind: 'add', text: newLine ?? '' });
      col += 1;
    }
  }
  while (row < rows) {
    ops.push({ kind: 'del', text: before[row] ?? '' });
    row += 1;
  }
  while (col < cols) {
    ops.push({ kind: 'add', text: after[col] ?? '' });
    col += 1;
  }
  return ops;
}

function formatRange(start: number, count: number): string {
  if (count === 1) return `${start}`;
  return `${start},${count}`;
}

function hunks(ops: readonly Op[]): DiffLine[] {
  const changes = ops
    .map((op, index) => (op.kind === 'context' ? -1 : index))
    .filter((index) => index >= 0);
  if (changes.length === 0) return [];

  const ranges: Array<{ start: number; end: number }> = [];
  for (const index of changes) {
    const start = Math.max(0, index - CONTEXT);
    const end = Math.min(ops.length, index + CONTEXT + 1);
    const last = ranges[ranges.length - 1];
    if (last !== undefined && start <= last.end) {
      ranges[ranges.length - 1] = { start: last.start, end: Math.max(last.end, end) };
    } else {
      ranges.push({ start, end });
    }
  }

  const lines: DiffLine[] = [];
  let consumedOld = 0;
  let consumedNew = 0;
  let cursor = 0;

  for (const range of ranges) {
    while (cursor < range.start) {
      const op = ops[cursor];
      if (op?.kind !== 'add') consumedOld += 1;
      if (op?.kind !== 'del') consumedNew += 1;
      cursor += 1;
    }

    const slice = ops.slice(range.start, range.end);
    const oldCount = slice.filter((op) => op.kind !== 'add').length;
    const newCount = slice.filter((op) => op.kind !== 'del').length;
    const oldStart = oldCount === 0 ? consumedOld : consumedOld + 1;
    const newStart = newCount === 0 ? consumedNew : consumedNew + 1;

    lines.push({
      kind: 'meta',
      text: `@@ -${formatRange(oldStart, oldCount)} +${formatRange(newStart, newCount)} @@`,
    });
    for (const op of slice) {
      const prefix = op.kind === 'add' ? '+' : op.kind === 'del' ? '-' : ' ';
      lines.push({ kind: op.kind, text: `${prefix}${op.text}` });
    }

    for (const op of slice) {
      if (op.kind !== 'add') consumedOld += 1;
      if (op.kind !== 'del') consumedNew += 1;
    }
    cursor = range.end;
  }

  return lines;
}

/** Diff unifié d'un fichier, dans le format de Git (`diff --git`, `---`, `+++`, `@@`). */
export function fileDiff(path: string, before: string | undefined, after: string | undefined): DiffLine[] {
  const oldSide = toLines(before);
  const newSide = toLines(after);
  const body = hunks(lineOps(oldSide, newSide));
  if (body.length === 0) return [];

  const lines: DiffLine[] = [{ kind: 'meta', text: `diff --git a/${path} b/${path}` }];

  if (before === undefined) {
    lines.push({ kind: 'meta', text: 'new file mode 100644' });
    lines.push({
      kind: 'meta',
      text: `index 0000000..${blobHash(after ?? '')}`,
    });
    lines.push({ kind: 'meta', text: '--- /dev/null' });
    lines.push({ kind: 'meta', text: `+++ b/${path}` });
  } else if (after === undefined) {
    lines.push({ kind: 'meta', text: 'deleted file mode 100644' });
    lines.push({
      kind: 'meta',
      text: `index ${blobHash(before)}..0000000`,
    });
    lines.push({ kind: 'meta', text: `--- a/${path}` });
    lines.push({ kind: 'meta', text: '+++ /dev/null' });
  } else {
    lines.push({
      kind: 'meta',
      text: `index ${blobHash(before)}..${blobHash(after)} 100644`,
    });
    lines.push({ kind: 'meta', text: `--- a/${path}` });
    lines.push({ kind: 'meta', text: `+++ b/${path}` });
  }

  return [...lines, ...body];
}

/** Diff unifié de deux arbres, trié par chemin. */
export function treeDiff(from: FileTree, to: FileTree, paths?: readonly string[]): DiffLine[] {
  const selected = new Set([...Object.keys(from), ...Object.keys(to)]);
  const lines: DiffLine[] = [];
  for (const path of [...selected].sort()) {
    if (paths !== undefined && paths.length > 0 && !paths.includes(path)) continue;
    lines.push(...fileDiff(path, from[path], to[path]));
  }
  return lines;
}
