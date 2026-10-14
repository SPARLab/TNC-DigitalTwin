import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LayerRowLegend } from './LayerRowLegend';
import { LayerLegendsVisibleProvider } from './layerLegendsPreference';
import type { CatalogLayer } from '../../../types';

const mocks = vi.hoisted(() => ({
  layers: new Map<string, unknown>(),
  legend: { legendData: null as unknown, legendLoading: false, legendError: null as string | null },
}));

vi.mock('../../../context/CatalogContext', () => ({
  useCatalog: () => ({ layerMap: mocks.layers }),
}));

vi.mock('../TNCArcGISLegendWidget/useTNCArcGISLegend', () => ({
  useTNCArcGISLegend: () => mocks.legend,
}));

const arcgisLayer = { id: 'layer-1', name: 'Fire History', dataSource: 'tnc-arcgis' } as unknown as CatalogLayer;
const otherLayer = { id: 'layer-2', name: 'Camera Traps', dataSource: 'animl' } as unknown as CatalogLayer;

beforeEach(() => {
  mocks.layers = new Map<string, unknown>([
    [arcgisLayer.id, arcgisLayer],
    [otherLayer.id, otherLayer],
  ]);
  mocks.legend = {
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
});

describe('LayerRowLegend', () => {
  it('lists the legend entries for a TNC ArcGIS layer that is on the map', () => {
    render(<LayerRowLegend layerId="layer-1" isOnMap />);

    expect(screen.getByText('Burned 2019')).toBeInTheDocument();
    expect(screen.getByText('Burned 2020')).toBeInTheDocument();
  });

  it('shows nothing while legends are switched off for the list', () => {
    render(
      <LayerLegendsVisibleProvider value={false}>
        <LayerRowLegend layerId="layer-1" isOnMap />
      </LayerLegendsVisibleProvider>,
    );

    expect(screen.queryByText('Burned 2019')).not.toBeInTheDocument();
  });

  it('shows nothing once the layer is off the map', () => {
    render(<LayerRowLegend layerId="layer-1" isOnMap={false} />);

    expect(screen.queryByText('Burned 2019')).not.toBeInTheDocument();
  });

  it('shows nothing for data sources that keep their own legend widget', () => {
    const { container } = render(<LayerRowLegend layerId="layer-2" isOnMap />);

    expect(container).toBeEmptyDOMElement();
  });

  it('stays quiet when the legend cannot be loaded', () => {
    mocks.legend = { legendData: null, legendLoading: false, legendError: 'Legend fetch failed.' };

    const { container } = render(<LayerRowLegend layerId="layer-1" isOnMap />);

    expect(container).toBeEmptyDOMElement();
  });
});
