import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ProgressBackup } from './ProgressBackup';
import { createEmptyStory, useProgressStore } from '../../store/useProgressStore';
import { serializeProgress } from '../../store/progress-file';

function resetProgress(): void {
  useProgressStore.setState({
    completed: {},
    lessonSlides: {},
    draft: null,
    story: createEmptyStory(),
    hydrated: true,
  });
}

describe('ProgressBackup', () => {
  beforeEach(resetProgress);

  it('exporte la progression dans un texte relisible', () => {
    useProgressStore.setState({ completed: { 'm-1': { stars: 3 } } });
    render(<ProgressBackup />);

    fireEvent.click(screen.getByRole('button', { name: 'Sauvegarder' }));

    const field = screen.getByRole('textbox', { name: /contenu de la sauvegarde/i });
    const raw = (field as HTMLTextAreaElement).value;
    expect(JSON.parse(raw).format).toBe('gitquest-progress');
    expect(JSON.parse(raw).completed).toEqual({ 'm-1': { stars: 3 } });
  });

  it('refuse une sauvegarde invalide sans toucher à la progression', () => {
    useProgressStore.setState({ completed: { 'm-1': { stars: 2 } } });
    render(<ProgressBackup />);

    fireEvent.click(screen.getByRole('button', { name: 'Restaurer' }));
    const field = screen.getByRole('textbox', { name: /sauvegarde à restaurer/i });
    fireEvent.change(field, { target: { value: 'pas du json' } });
    fireEvent.click(screen.getByRole('button', { name: 'Restaurer la sauvegarde' }));

    expect(screen.getByRole('status')).toHaveTextContent(/JSON valide/i);
    expect(useProgressStore.getState().completed).toEqual({ 'm-1': { stars: 2 } });
  });

  it('restaure les étoiles d’une sauvegarde valide', () => {
    const raw = serializeProgress({
      completed: { 'm-2': { stars: 3 }, 'm-4': { stars: 1 } },
      lessonSlides: { 'ch-2': 1 },
      story: createEmptyStory(),
    });
    render(<ProgressBackup />);

    fireEvent.click(screen.getByRole('button', { name: 'Restaurer' }));
    const field = screen.getByRole('textbox', { name: /sauvegarde à restaurer/i });
    fireEvent.change(field, { target: { value: raw } });
    fireEvent.click(screen.getByRole('button', { name: 'Restaurer la sauvegarde' }));

    expect(useProgressStore.getState().completed).toEqual({
      'm-2': { stars: 3 },
      'm-4': { stars: 1 },
    });
    expect(useProgressStore.getState().lessonSlides).toEqual({ 'ch-2': 1 });
    expect(screen.getByRole('status')).toHaveTextContent(/2 mission/i);
  });
});
