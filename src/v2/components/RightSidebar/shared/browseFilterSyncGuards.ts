import type { MutableRefObject } from 'react';
import type { ActiveLayer, PinnedLayer, PinnedLayerView } from '../../../types';

type GetPinnedByLayerId = (layerId: string) => PinnedLayer | undefined;

interface BrowseHydrationGuardInput {
  activeViewId?: string;
  lastEditFiltersRequest: number;
  lastFiltersClearedTimestamp: number;
  lastConsumedHydrateRef: MutableRefObject<number>;
  lastConsumedClearRef: MutableRefObject<number>;
  prevHydrateViewIdRef: MutableRefObject<string | undefined>;
}

interface ActivePinnedFiltersInput<TFilters> {
  activeLayer: ActiveLayer;
  getPinnedByLayerId: GetPinnedByLayerId;
  getRootFilters: (pinned: PinnedLayer) => TFilters | undefined;
  getViewFilters: (view: PinnedLayerView) => TFilters | undefined;
}

export function shouldHydrateBrowseFilters({
  activeViewId,
  lastEditFiltersRequest,
  lastFiltersClearedTimestamp,
  lastConsumedHydrateRef,
  lastConsumedClearRef,
  prevHydrateViewIdRef,
}: BrowseHydrationGuardInput): boolean {
  const viewChanged = activeViewId !== prevHydrateViewIdRef.current;
  const editRequested = lastEditFiltersRequest > lastConsumedHydrateRef.current;
  const clearRequested = lastFiltersClearedTimestamp > lastConsumedClearRef.current;
  prevHydrateViewIdRef.current = activeViewId;

  if (!viewChanged && !editRequested && !clearRequested) return false;
  if (editRequested) lastConsumedHydrateRef.current = lastEditFiltersRequest;
  if (clearRequested) lastConsumedClearRef.current = lastFiltersClearedTimestamp;
  return true;
}

export function getPinnedActiveView(
  activeLayer: ActiveLayer,
  getPinnedByLayerId: GetPinnedByLayerId,
): PinnedLayerView | undefined {
  if (!activeLayer.viewId) return undefined;
  const pinned = getPinnedByLayerId(activeLayer.layerId);
  return pinned?.views?.find((view) => view.id === activeLayer.viewId);
}

export function getPinnedFiltersForActiveView<TFilters>({
  activeLayer,
  getPinnedByLayerId,
  getRootFilters,
  getViewFilters,
}: ActivePinnedFiltersInput<TFilters>): TFilters | undefined {
  const pinned = getPinnedByLayerId(activeLayer.layerId);
  if (!pinned) return undefined;

  if (activeLayer.viewId && pinned.views) {
    const activeView = pinned.views.find((view) => view.id === activeLayer.viewId);
    return activeView ? getViewFilters(activeView) : undefined;
  }

  return getRootFilters(pinned);
}
