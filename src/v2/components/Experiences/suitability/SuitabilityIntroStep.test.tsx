import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SuitabilityIntroStep } from './SuitabilityIntroStep';
import { WEIGHTED_OVERLAY_EXPLAINER } from './wizardCopy';

describe('SuitabilityIntroStep weighted overlay help', () => {
  it('puts a help button on the last step that opens and closes the explanation', () => {
    render(<SuitabilityIntroStep onStart={vi.fn()} />);
    expect(screen.queryByRole('dialog')).toBeNull();

    const help = screen.getByRole('button', { name: 'How the weighted overlay works' });
    // The button sits inside step four, not the others.
    expect(help.closest('li')?.textContent).toContain('4.');

    fireEvent.click(help);
    const dialog = screen.getByRole('dialog');
    expect(dialog.textContent).toContain(WEIGHTED_OVERLAY_EXPLAINER.title);
    expect(dialog.textContent).toContain('Σ(weight × score) ÷ Σ(weights)');
    expect(dialog.textContent).toContain('(3 × 5 + 1 × 1) ÷ (3 + 1) = 4.0');

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('closes from the close button', () => {
    render(<SuitabilityIntroStep onStart={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'How the weighted overlay works' }));
    fireEvent.click(screen.getByRole('button', { name: 'Close explanation' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
