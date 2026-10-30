import { describe, expect, it } from 'vitest';
import { chapters, estimatedLessonMinutes } from './index';

describe('leçons', () => {
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
