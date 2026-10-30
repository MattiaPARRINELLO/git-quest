import { describe, expect, it } from 'vitest';
import { chapters, commandLineLesson, estimatedLessonMinutes } from './index';

describe('leçons', () => {
  it('le prologue tient en 3 à 5 min et finit par une antisèche', () => {
    const minutes = estimatedLessonMinutes(commandLineLesson);
    expect(minutes).toBeGreaterThanOrEqual(3);
    expect(minutes).toBeLessThanOrEqual(5);
    expect(commandLineLesson.slides.at(-1)?.kind).toBe('recap');
  });

  for (const chapter of chapters) {
    it(`${chapter.lesson.title} — durée estimée et antisèche`, () => {
      const minutes = estimatedLessonMinutes(chapter.lesson);
      expect(minutes).toBeGreaterThanOrEqual(3);
      expect(minutes).toBeLessThanOrEqual(5);
      const lastSlide = chapter.lesson.slides[chapter.lesson.slides.length - 1];
      expect(lastSlide?.kind).toBe('recap');
    });
  }

  it('le chapitre 1 affiche 5 min avec ses 8 slides', () => {
    const chapter = chapters[0];
    if (!chapter) throw new Error('chapitre 1 attendu');
    expect(chapter.lesson.slides).toHaveLength(8);
    expect(estimatedLessonMinutes(chapter.lesson)).toBe(5);
  });
});
