import { describe, expect, it } from 'vitest';
import { createEmptyStory } from './useProgressStore';
import { parseProgress, serializeProgress } from './progress-file';

const NOW = new Date('2026-03-14T10:00:00.000Z');

function snapshot() {
  return {
    completed: { 'm-1': { stars: 3 as const }, 'm-2': { stars: 1 as const } },
    lessonSlides: { 'ch-1': 2 },
    story: createEmptyStory(),
  };
}

describe('fichier de progression', () => {
  it('fait un aller-retour sans perdre les étoiles', () => {
    const raw = serializeProgress(snapshot(), NOW);
    const parsed = parseProgress(raw);

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.file.completed).toEqual({ 'm-1': { stars: 3 }, 'm-2': { stars: 1 } });
    expect(parsed.file.lessonSlides).toEqual({ 'ch-1': 2 });
    expect(parsed.file.exportedAt).toBe('2026-03-14T10:00:00.000Z');
  });

  it('refuse un texte qui n’est pas du JSON', () => {
    const parsed = parseProgress('git status');
    expect(parsed).toEqual({ ok: false, error: "Ce texte n'est pas du JSON valide." });
  });

  it('refuse un JSON étranger à GitQuest', () => {
    const parsed = parseProgress(JSON.stringify({ format: 'autre', version: 1 }));
    expect(parsed.ok).toBe(false);
  });

  it('refuse une version inconnue', () => {
    const parsed = parseProgress(
      JSON.stringify({ format: 'gitquest-progress', version: 99, completed: {}, lessonSlides: {}, story: createEmptyStory() }),
    );
    expect(parsed).toEqual({ ok: false, error: 'Version de sauvegarde 99 non reconnue.' });
  });

  it('refuse des étoiles hors barème', () => {
    const parsed = parseProgress(
      JSON.stringify({
        format: 'gitquest-progress',
        version: 1,
        completed: { 'm-1': { stars: 7 } },
        lessonSlides: {},
        story: createEmptyStory(),
      }),
    );
    expect(parsed).toEqual({ ok: false, error: 'Les missions enregistrées sont illisibles.' });
  });

  it('refuse un arbre Nova d’une autre version', () => {
    const parsed = parseProgress(
      JSON.stringify({
        format: 'gitquest-progress',
        version: 1,
        completed: {},
        lessonSlides: {},
        story: { version: 2 },
      }),
    );
    expect(parsed.ok).toBe(false);
  });
});
