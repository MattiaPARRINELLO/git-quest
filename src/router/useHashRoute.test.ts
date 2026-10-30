import { describe, expect, it } from 'vitest';
import { parseRoute, routePaths } from './useHashRoute';

describe('routeur par hash', () => {
  it('reconnaît l’écran final', () => {
    expect(parseRoute(routePaths.final)).toEqual({ name: 'final' });
  });

  it('conserve les routes existantes', () => {
    expect(parseRoute('#/')).toEqual({ name: 'home' });
    expect(parseRoute('#/sandbox')).toEqual({ name: 'sandbox' });
    expect(parseRoute('#/chapter/branches/lesson')).toEqual({
      name: 'lesson',
      chapterId: 'branches',
    });
    expect(parseRoute('#/mission/piege-am')).toEqual({ name: 'mission', missionId: 'piege-am' });
    expect(parseRoute('#/inconnu')).toEqual({ name: 'not-found' });
  });
});
