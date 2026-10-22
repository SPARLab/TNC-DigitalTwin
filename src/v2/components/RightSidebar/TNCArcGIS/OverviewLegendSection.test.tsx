import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OverviewLegendSection } from './OverviewLegendSection';
import type { CatalogLayer } from '../../../types';

const mocks = vi.hoisted(() => ({
  state: {
    legendData: null as unknown,
    legendLoading: false,
    legendError: null as string | null,
  },
}));

vi.mock('../../FloatingWidgets/TNCArcGISLegendWidget/useTNCArcGISLegend', () => ({
  useTNCArcGISLegend: () => mocks.state,
}));

const layer = { id: 'layer-1', name: 'Fire History' } as unknown as CatalogLayer;

describe('OverviewLegendSection', () => {
  it('lists the legend entries of the layer under a Legend heading', () => {
    mocks.state = {
      legendData: {
        layerId: 1,
        rendererType: 'uniqueValue',
        items: [
          { label: 'Burned 2019', swatchColor: '#ff0000', value: 'a' },
          { label: 'Burned 2020', swatchColor: '#00ff00', value: 'b' },
        ],
      },
      legendLoading: false,
      legendError: null,
    };

    render(<OverviewLegendSection targetLayer={layer} />);

    expect(screen.getByRole('heading', { name: 'Legend' })).toBeInTheDocument();
    expect(screen.getByText('Burned 2019')).toBeInTheDocument();
    expect(screen.getByText('Burned 2020')).toBeInTheDocument();
  });

  it('is display-only: entries are not filter toggles', () => {
    mocks.state = {
      legendData: { layerId: 1, rendererType: 'uniqueValue', items: [{ label: 'Burned 2019', value: 'a' }] },
      legendLoading: false,
      legendError: null,
    };
    render(<OverviewLegendSection targetLayer={layer} />);

    expect(document.getElementById('tnc-arcgis-overview-legend-item-0')).not.toHaveClass('cursor-pointer');
  });

  it('explains when no legend is available', () => {
    mocks.state = { legendData: null, legendLoading: false, legendError: 'No legend entries returned for this layer.' };

    render(<OverviewLegendSection targetLayer={layer} />);

    expect(screen.getByText('No legend entries returned for this layer.')).toBeInTheDocument();
  });
});
