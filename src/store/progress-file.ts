import type { PersistedStory } from '../story/types';

/** Version du format d'échange : à incrémenter si la forme change. */
export const PROGRESS_FILE_VERSION = 1;

export interface ProgressSnapshot {
  readonly completed: Readonly<Record<string, { readonly stars: 1 | 2 | 3 }>>;
  readonly lessonSlides: Readonly<Record<string, number>>;
  readonly story: PersistedStory;
}

export interface ProgressFile extends ProgressSnapshot {
  readonly format: 'gitquest-progress';
  readonly version: number;
  readonly exportedAt: string;
}

export type ProgressParseResult =
  | { readonly ok: true; readonly file: ProgressFile }
  | { readonly ok: false; readonly error: string };

/**
 * Sérialise la progression dans un document lisible et versionné. Le fichier
 * sert de sauvegarde : le stockage de la WebView peut être évincé par l'OS.
 */
export function serializeProgress(snapshot: ProgressSnapshot, now: Date = new Date()): string {
  const file: ProgressFile = {
    format: 'gitquest-progress',
    version: PROGRESS_FILE_VERSION,
    exportedAt: now.toISOString(),
    completed: snapshot.completed,
    lessonSlides: snapshot.lessonSlides,
    story: snapshot.story,
  };
  return `${JSON.stringify(file, null, 2)}\n`;
}

function isStars(value: unknown): value is 1 | 2 | 3 {
  return value === 1 || value === 2 || value === 3;
}

function readCompleted(value: unknown): Record<string, { stars: 1 | 2 | 3 }> | null {
  if (typeof value !== 'object' || value === null) return null;
  const completed: Record<string, { stars: 1 | 2 | 3 }> = {};
  for (const [missionId, completion] of Object.entries(value)) {
    const stars = (completion as { stars?: unknown } | null)?.stars;
    if (!isStars(stars)) return null;
    completed[missionId] = { stars };
  }
  return completed;
}

function readSlides(value: unknown): Record<string, number> | null {
  if (typeof value !== 'object' || value === null) return null;
  const slides: Record<string, number> = {};
  for (const [chapterId, index] of Object.entries(value)) {
    if (typeof index !== 'number' || !Number.isInteger(index) || index < 0) return null;
    slides[chapterId] = index;
  }
  return slides;
}

function readStory(value: unknown): PersistedStory | null {
  if (typeof value !== 'object' || value === null) return null;
  const story = value as { version?: unknown; journal?: unknown; slots?: unknown };
  if (story.version !== 1) return null;
  if (!Array.isArray(story.journal)) return null;
  if (typeof story.slots !== 'object' || story.slots === null) return null;
  return value as PersistedStory;
}

/**
 * Valide un fichier de sauvegarde. Un fichier refusé n'écrase jamais rien :
 * l'import est tout ou rien.
 */
export function parseProgress(raw: string): ProgressParseResult {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return { ok: false, error: "Ce texte n'est pas du JSON valide." };
  }

  if (typeof data !== 'object' || data === null) {
    return { ok: false, error: 'Le fichier ne contient pas une sauvegarde GitQuest.' };
  }

  const candidate = data as Partial<ProgressFile> & { format?: unknown; version?: unknown };
  if (candidate.format !== 'gitquest-progress') {
    return { ok: false, error: 'Ce fichier ne vient pas de GitQuest.' };
  }
  if (candidate.version !== PROGRESS_FILE_VERSION) {
    return {
      ok: false,
      error: `Version de sauvegarde ${String(candidate.version)} non reconnue.`,
    };
  }

  const completed = readCompleted(candidate.completed);
  if (completed === null) {
    return { ok: false, error: 'Les missions enregistrées sont illisibles.' };
  }

  const lessonSlides = readSlides(candidate.lessonSlides);
  if (lessonSlides === null) {
    return { ok: false, error: 'Les slides de cours sont illisibles.' };
  }

  const story = readStory(candidate.story);
  if (story === null) {
    return { ok: false, error: "L'état de l'arbre Nova est illisible." };
  }

  return {
    ok: true,
    file: {
      format: 'gitquest-progress',
      version: PROGRESS_FILE_VERSION,
      exportedAt: typeof candidate.exportedAt === 'string' ? candidate.exportedAt : '',
      completed,
      lessonSlides,
      story,
    },
  };
}
