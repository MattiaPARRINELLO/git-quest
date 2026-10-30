import type { JournalEntry } from './types';

/**
 * Journal du parcours : il référence des **slots**, des missions et des chemins,
 * jamais des hashes. Un recalage peut donc changer tous les hashes sans le
 * rendre faux.
 */

export function appendJournal(
  journal: readonly JournalEntry[],
  entry: JournalEntry,
): readonly JournalEntry[] {
  return [...journal, entry];
}

export function lastCompletedMission(
  journal: readonly JournalEntry[],
): string | null {
  for (let index = journal.length - 1; index >= 0; index -= 1) {
    const entry = journal[index];
    if (entry?.kind === 'mission-complete') return entry.missionId;
  }
  return null;
}

export function completedMissions(
  journal: readonly JournalEntry[],
): readonly string[] {
  return journal
    .filter((entry): entry is Extract<JournalEntry, { kind: 'mission-complete' }> =>
      entry.kind === 'mission-complete',
    )
    .map((entry) => entry.missionId);
}

export function recalages(journal: readonly JournalEntry[]): readonly string[] {
  return journal
    .filter((entry): entry is Extract<JournalEntry, { kind: 'recalage' }> =>
      entry.kind === 'recalage',
    )
    .map((entry) => entry.missionId);
}

export function createdWorktrees(journal: readonly JournalEntry[]): readonly string[] {
  return journal
    .filter((entry): entry is Extract<JournalEntry, { kind: 'worktree' }> =>
      entry.kind === 'worktree',
    )
    .map((entry) => entry.path);
}

export function detours(
  journal: readonly JournalEntry[],
): readonly Extract<JournalEntry, { kind: 'detour' }>[] {
  return journal.filter(
    (entry): entry is Extract<JournalEntry, { kind: 'detour' }> =>
      entry.kind === 'detour',
  );
}

export function entriesForMission(
  journal: readonly JournalEntry[],
  missionId: string,
): readonly JournalEntry[] {
  return journal.filter((entry) => 'missionId' in entry && entry.missionId === missionId);
}
