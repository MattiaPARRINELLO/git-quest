import { beforeEach, describe, expect, it } from 'vitest';
import { resetStoryFlag, storyBetaEnabled } from './story-flags';

describe('feature flag story=beta', () => {
  beforeEach(() => {
    resetStoryFlag();
  });

  it('est désactivé par défaut', () => {
    expect(storyBetaEnabled('')).toBe(false);
  });

  it('active et mémorise ?story=beta', () => {
    expect(storyBetaEnabled('?story=beta')).toBe(true);
    expect(storyBetaEnabled('')).toBe(true);
  });

  it('désactive et mémorise ?story=stable', () => {
    expect(storyBetaEnabled('?story=beta')).toBe(true);
    expect(storyBetaEnabled('?story=stable')).toBe(false);
    expect(storyBetaEnabled('')).toBe(false);
  });
});
