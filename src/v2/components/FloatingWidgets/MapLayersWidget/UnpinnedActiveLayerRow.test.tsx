import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UnpinnedActiveLayerRow } from './UnpinnedActiveLayerRow';
import type { ActiveLayer } from '../../../types';

// The row's legend entries are covered by LayerRowLegend.test.tsx.
vi.mock('./LayerRowLegend', () => ({ LayerRowLegend: () => null }));

vi.mock('../../../context/INaturalistFilterContext', () => ({
  useINaturalistFilter: () => ({
    selectedTaxa: new Set<string>(),
    selectedSpecies: new Set<string>(),
    excludeAllSpecies: false,
    startDate: '',
    endDate: '',
    hasFilter: false,
  }),
}));

vi.mock('../../../context/AnimlFilterContext', () => ({
  useAnimlFilter: () => ({
    selectedAnimals: new Set<string>(['Bobcat']),
    selectedCameras: new Set<number>(),
    startDate: '',
    endDate: '',
    deployments: [],
    hasAnyFilter: true,
  }),
}));

const layer = {
  id: 'layer-1',
  layerId: 'layer-1',
  name: 'Fire History',
  dataSource: 'tnc-arcgis',
  isPinned: false,
} as unknown as ActiveLayer;

describe('UnpinnedActiveLayerRow', () => {
  it('shows the layer with a highlighted row and a pin button', () => {
    render(<UnpinnedActiveLayerRow activeLayer={layer} onPin={() => {}} />);

    expect(screen.getByText('Fire History')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pin Fire History' })).toHaveAttribute('title', 'Pin layer');
    expect(document.getElementById('unpinned-active-layer-row')).toHaveClass('bg-amber-50', 'border-amber-300');
  });

  it('pins the layer when the pin button is pressed', async () => {
    const user = userEvent.setup();
    const onPin = vi.fn();
    render(<UnpinnedActiveLayerRow activeLayer={layer} onPin={onPin} />);

    await user.click(screen.getByRole('button', { name: 'Pin Fire History' }));

    expect(onPin).toHaveBeenCalledTimes(1);
  });

  it('summarises live ANiML filters under the layer name', () => {
    render(
      <UnpinnedActiveLayerRow
        activeLayer={{ ...layer, name: 'Camera Traps', dataSource: 'animl' } as unknown as ActiveLayer}
        onPin={() => {}}
      />,
    );

    expect(screen.getByText('Bobcat')).toBeInTheDocument();
  });
});
