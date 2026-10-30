import { beforeEach, describe, expect, it } from 'vitest';
import { missionSequence } from '../content';
import { storage } from '../storage/storage';
import { useProgressStore } from '../store/useProgressStore';
import { resumeContext, resumeTarget } from './resume';

const KEY = 'gitquest.progress.v1';

const empty = { completed: {}, lessonSlides: {} } as const;

const catchUpToChapterTwo = {
  completed: {
    'trois-zones': { stars: 3 },
    'snapshot-fige': { stars: 3 },
    'piege-am': { stars: 3 },
  },
  lessonSlides: {},
};

const allCompleted = {
  completed: Object.fromEntries(missionSequence.map((mission) => [mission.id, { stars: 3 }])),
  lessonSlides: {},
};

describe('resumeTarget — point d’entrée de l’accueil', () => {
  beforeEach(async () => {
    await storage.remove(KEY);
    useProgressStore.setState({ completed: {}, lessonSlides: {}, hydrated: false });
  });

  it('1 — reprend le brouillon de mission actif', () => {
    expect(
      resumeTarget({ completed: { 'trois-zones': { stars: 3 } }, lessonSlides: {} }, 'piege-am'),
    ).toEqual({ label: 'Reprendre la mission 1.3', route: '#/mission/piege-am' });
  });

  it('1 — le brouillon actif est prioritaire sur un cours inachevé', () => {
    expect(
      resumeTarget(
        { completed: {}, lessonSlides: { branches: 1 } },
        'branche-pointeur',
      ),
    ).toEqual({ label: 'Reprendre la mission 2.1', route: '#/mission/branche-pointeur' });
  });

  it('1 — ignore un brouillon déjà terminé', () => {
    expect(
      resumeTarget({ completed: { 'trois-zones': { stars: 3 } }, lessonSlides: {} }, 'trois-zones'),
    ).toEqual({ label: 'Continuer : mission 1.2', route: '#/mission/snapshot-fige' });
  });

  it('2 — reprend le cours commencé mais inachevé', () => {
    expect(
      resumeTarget({ completed: { 'trois-zones': { stars: 3 } }, lessonSlides: { 'under-the-hood': 2 } }),
    ).toEqual({ label: 'Reprendre le cours : Sous le capot', route: '#/chapter/under-the-hood/lesson' });
  });

  it('2 — ne reprend pas un cours déjà terminé', () => {
    expect(
      resumeTarget({ completed: { 'trois-zones': { stars: 3 } }, lessonSlides: { 'under-the-hood': 7 } }),
    ).toEqual({ label: 'Continuer : mission 1.2', route: '#/mission/snapshot-fige' });
  });

  it('3 — propose la mission suivante du même chapitre', () => {
    expect(resumeTarget({ completed: { 'trois-zones': { stars: 3 } }, lessonSlides: {} })).toEqual({
      label: 'Continuer : mission 1.2',
      route: '#/mission/snapshot-fige',
    });
  });

  it('3 — frontière 1.3 → cours du chapitre suivant', () => {
    expect(resumeTarget(catchUpToChapterTwo)).toEqual({
      label: 'Commencer le cours : Les branches',
      route: '#/chapter/branches/lesson',
    });
  });

  it('4 — aucune progression : démarre le chapitre 1', () => {
    expect(resumeTarget(empty)).toEqual({
      label: 'Commencer avec le chapitre 1',
      route: '#/chapter/under-the-hood/lesson',
    });
  });

  it('5 — tout terminé : renvoie vers l’écran final', () => {
    expect(resumeTarget(allCompleted)).toEqual({
      label: 'Revoir ton arbre Nova',
      route: '#/final',
    });
  });

  it('expose une ligne de contexte discrète', () => {
    expect(resumeContext(catchUpToChapterTwo)).toBe('Chapitre 2 · Les branches · 0/3 missions');
    expect(resumeContext(empty)).toBe('Chapitre 1 · Sous le capot · 0/3 missions');
    expect(resumeContext(allCompleted)).toBe('Terminé · 12/12 missions');
  });

  it('progression v1 migrée : la cible suit l’id réel de la mission', async () => {
    await storage.set(KEY, {
      version: 1,
      completed: {
        'trois-zones': { stars: 3 },
        'snapshot-fige': { stars: 3 },
        'piege-am': { stars: 3 },
        'branche-pointeur': { stars: 3 },
        'qui-avance': { stars: 3 },
        'commit-perdu': { stars: 2 },
      },
      lessonSlides: { branches: 2 },
    });
    await useProgressStore.getState().hydrate();

    const { completed, lessonSlides } = useProgressStore.getState();
    expect(resumeTarget({ completed, lessonSlides })).toEqual({
      label: 'Commencer le cours : Fusionner',
      route: '#/chapter/merging/lesson',
    });
  });
});
