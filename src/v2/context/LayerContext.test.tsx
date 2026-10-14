import { describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import type { CatalogLayer } from '../types';
import { LayerProvider, useLayers } from './LayerContext';

const boundary = {
  id: 'preserve-boundary',
  name: 'Dangermond Preserve Simple Boundary',
  categoryId: 'boundaries',
  dataSource: 'tnc-arcgis',
} as unknown as CatalogLayer;

const layerMap = new Map<string, CatalogLayer>([[boundary.id, boundary]]);

vi.mock('./CatalogContext', () => ({
  useCatalog: () => ({ layerMap }),
}));

function wrapper({ children }: { children: ReactNode }) {
  return <LayerProvider>{children}</LayerProvider>;
}

describe('LayerProvider active layer', () => {
  it('reports a layer pinned in the same tick it was activated as pinned', () => {
    const { result } = renderHook(() => useLayers(), { wrapper });

    // What the catalog does on first load: pin the preserve boundary, then activate it.
    act(() => {
      result.current.pinLayer(boundary.id);
      result.current.activateLayer(boundary.id);
    });

    expect(result.current.pinnedLayers).toHaveLength(1);
    expect(result.current.activeLayer?.layerId).toBe(boundary.id);
    expect(result.current.activeLayer?.isPinned).toBe(true);
  });

  it('reports an activated layer that is not pinned as unpinned, and follows later pin changes', () => {
    const { result } = renderHook(() => useLayers(), { wrapper });

    act(() => result.current.activateLayer(boundary.id));
    expect(result.current.activeLayer?.isPinned).toBe(false);

    act(() => result.current.pinLayer(boundary.id));
    expect(result.current.activeLayer?.isPinned).toBe(true);

    act(() => result.current.unpinLayer(result.current.pinnedLayers[0].id));
    expect(result.current.activeLayer?.isPinned).toBe(false);
  });
});
