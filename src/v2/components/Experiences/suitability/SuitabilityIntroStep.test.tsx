import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SuitabilityIntroStep } from './SuitabilityIntroStep';
import { SUITABILITY_DATA_EXPLAINER, WEIGHTED_OVERLAY_EXPLAINER } from './wizardCopy';

describe('SuitabilityIntroStep beta note', () => {
  it('says the tool is in beta and welcomes feedback', () => {
    render(<SuitabilityIntroStep onStart={vi.fn()} />);
    expect(screen.getByRole('note').textContent).toMatch(/beta/i);
    expect(screen.getByRole('note').textContent).toMatch(/feedback/i);
  });
});

describe('SuitabilityIntroStep data help', () => {
  it('lists the usable data in a pop-up instead of on the page', () => {
    render(<SuitabilityIntroStep onStart={vi.fn()} />);
    expect(screen.queryByText(SUITABILITY_DATA_EXPLAINER.categoriesBody)).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'What data can you use?' }));
    const dialog = screen.getByRole('dialog');
    expect(dialog.textContent).toContain(SUITABILITY_DATA_EXPLAINER.title);
    expect(dialog.textContent).toContain(SUITABILITY_DATA_EXPLAINER.categoriesTitle);
    // Every area is listed with the cell sizes it is published at.
    expect(dialog.textContent).toContain('Dangermond Preserve');
    expect(dialog.textContent).toContain('Cell sizes: 2m, 10m, 30m, 100m, 500m, 1km');
    expect(dialog.textContent).toContain('Cell sizes: 100m, 500m, 1km');

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});

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
