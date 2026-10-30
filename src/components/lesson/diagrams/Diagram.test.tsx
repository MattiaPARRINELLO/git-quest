import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Diagram } from './index';

describe('diagramme du snapshot', () => {
  it('progresse en trois étapes et montre les fichiers hors index', async () => {
    const user = userEvent.setup();
    render(<Diagram id="commit-snapshot" />);

    expect(screen.getByText(/État initial/i)).toBeInTheDocument();
    expect(screen.getAllByText('vide').length).toBe(2);

    await user.click(screen.getByRole('button', { name: /Étape suivante/i }));
    expect(screen.getByText('git add README.md')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Étape suivante/i }));
    expect(screen.getByText(/git commit -m/i)).toBeInTheDocument();
    expect(screen.getByText(/non indexé → pas dans la photo/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Recommencer/i })).toBeInTheDocument();
  });
});
