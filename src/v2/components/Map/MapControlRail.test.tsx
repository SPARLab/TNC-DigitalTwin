import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MapControlRail } from './MapControlRail';
import { hideLegend, showLegend } from '../FloatingWidgets/shared/legendVisibilityStore';

const mocks = vi.hoisted(() => ({ hasLegend: true }));

vi.mock('../../context/MapContext', () => ({
  useMap: () => ({
    viewRef: { current: null },
    viewMode: '2d',
    toggleViewMode: () => {},
    isLidarVisible: false,
    toggleLidarVisibility: () => {},
  }),
}));

vi.mock('../../context/LayerContext', () => ({
  useLayers: () => ({ activeLayer: { layerId: 'layer-1', dataSource: 'tnc-arcgis' } }),
}));

vi.mock('../../dataSources/registry', () => ({
  getAdapterForActiveLayer: () => (mocks.hasLegend ? { LegendWidget: () => null } : { LegendWidget: undefined }),
}));

vi.mock('./BasemapPicker', () => ({ BasemapPicker: () => null }));
vi.mock('../../../components/icons/LidarIcon', () => ({ default: () => null }));

beforeEach(() => {
  mocks.hasLegend = true;
});
afterEach(() => act(() => showLegend()));

describe('MapControlRail legend button', () => {
  it('is absent while the legend is showing', () => {
    render(<MapControlRail />);

    expect(screen.queryByRole('button', { name: 'Show legend' })).not.toBeInTheDocument();
  });

  it('appears after the legend is closed and brings it back when pressed', async () => {
    const user = userEvent.setup();
    render(<MapControlRail />);

    act(() => hideLegend());
    const button = screen.getByRole('button', { name: 'Show legend' });
    expect(button.closest('#map-control-rail')).not.toBeNull();

    await user.click(button);
    expect(screen.queryByRole('button', { name: 'Show legend' })).not.toBeInTheDocument();
  });

  it('is not offered for a layer that has no legend', () => {
    mocks.hasLegend = false;
    render(<MapControlRail />);

    act(() => hideLegend());

    expect(screen.queryByRole('button', { name: 'Show legend' })).not.toBeInTheDocument();
  });
});
