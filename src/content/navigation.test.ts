import { describe, expect, it } from 'vitest';
import { afterMission, allMissions, chapters } from './index';

describe('navigation après une mission', () => {
  for (const [index, mission] of allMissions.entries()) {
    it(`${mission.number} — destination de « Continuer »`, () => {
      const after = afterMission(mission.id);
      const next = allMissions[index + 1];

      if (!next) {
        expect(after).toEqual({ kind: 'home' });
        return;
      }

      if (next.chapterId === mission.chapterId) {
        expect(after.kind).toBe('mission');
        if (after.kind === 'mission') expect(after.mission.id).toBe(next.id);
        return;
      }

      const nextChapter = chapters.find((chapter) => chapter.id === next.chapterId);
      expect(after.kind).toBe('lesson');
      if (after.kind === 'lesson') expect(after.chapter.id).toBe(nextChapter?.id);
    });
  }
});
