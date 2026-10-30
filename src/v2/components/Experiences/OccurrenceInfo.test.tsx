import { render, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { OccurrenceInfo } from './OccurrenceInfo';

vi.mock('../../services/geoprocessingService', () => ({
  fetchOccurrenceFeatures: vi.fn().mockResolvedValue([{ geometry: { coordinates: [-120, 34] } }]),
}));

describe('OccurrenceInfo', () => {
  it('lets go of the records of a species that is no longer chosen', async () => {
    const onTogglePoints = vi.fn();
    const { rerender } = render(
      <OccurrenceInfo species="Lynx rufus" onTogglePoints={onTogglePoints} />,
    );
    expect(onTogglePoints).not.toHaveBeenCalled();

    rerender(<OccurrenceInfo species="Puma concolor" onTogglePoints={onTogglePoints} />);
    await waitFor(() =>
      expect(onTogglePoints).toHaveBeenCalledWith({ species: 'Lynx rufus', action: 'release' }),
    );
    expect(onTogglePoints).toHaveBeenCalledTimes(1);
  });

  it('lets go when the species is cleared', async () => {
    const onTogglePoints = vi.fn();
    const { rerender } = render(
      <OccurrenceInfo species="Lynx rufus" onTogglePoints={onTogglePoints} />,
    );
    rerender(<OccurrenceInfo species="" onTogglePoints={onTogglePoints} />);
    await waitFor(() =>
      expect(onTogglePoints).toHaveBeenCalledWith({ species: 'Lynx rufus', action: 'release' }),
    );
  });

  it('does nothing when the same species is rendered again', () => {
    const onTogglePoints = vi.fn();
    const { rerender } = render(
      <OccurrenceInfo species="Lynx rufus" onTogglePoints={onTogglePoints} />,
    );
    rerender(<OccurrenceInfo species="Lynx rufus" onTogglePoints={onTogglePoints} />);
    expect(onTogglePoints).not.toHaveBeenCalled();
  });
});
