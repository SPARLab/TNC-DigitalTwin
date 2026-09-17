import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BasemapPicker } from './BasemapPicker';

const setBasemap = vi.fn();

vi.mock('../../context/MapContext', () => ({
  useMap: () => ({
    basemapId: 'topo-vector',
    setBasemap,
  }),
}));

describe('BasemapPicker', () => {
  it('opens a compact gallery and selects the dark basemap', async () => {
    const user = userEvent.setup();
    render(<BasemapPicker />);

    await user.click(screen.getByRole('button', { name: 'Change basemap' }));
    expect(screen.getByRole('dialog', { name: 'Basemap' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Dark' }));
    expect(setBasemap).toHaveBeenCalledWith('dark-gray-vector');
    expect(screen.queryByRole('dialog', { name: 'Basemap' })).not.toBeInTheDocument();
  });
});
