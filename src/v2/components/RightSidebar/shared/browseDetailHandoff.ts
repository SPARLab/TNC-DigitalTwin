import type { MutableRefObject } from 'react';
import type { ActiveLayer } from '../../../types';

type FeatureId = string | number;

interface BrowseDetailHandoffInput<TItem, TLayerId extends string = string> {
  item: TItem;
  activeLayer: ActiveLayer | null;
  activateLayer: (layerId: string, viewId?: string, featureId?: FeatureId) => void;
  setSelectedItem: (item: TItem) => void;
  getItemFeatureId: (item: TItem) => FeatureId;
  layerId: TLayerId;
  lastHandledFeatureIdRef?: MutableRefObject<string | null>;
}

interface BrowseDetailCloseInput<TLayerId extends string = string> {
  activeLayer: ActiveLayer | null;
  activateLayer: (layerId: string, viewId?: string, featureId?: FeatureId) => void;
  setSelectedItem: (item: null) => void;
  layerId: TLayerId;
  lastHandledFeatureIdRef?: MutableRefObject<string | null>;
  clearLastHandledFeatureId?: boolean;
}

export function openBrowseDetail<TItem, TLayerId extends string = string>({
  item,
  activeLayer,
  activateLayer,
  setSelectedItem,
  getItemFeatureId,
  layerId,
  lastHandledFeatureIdRef,
}: BrowseDetailHandoffInput<TItem, TLayerId>): void {
  const featureId = getItemFeatureId(item);
  if (lastHandledFeatureIdRef) {
    lastHandledFeatureIdRef.current = String(featureId);
  }
  setSelectedItem(item);

  // Sync map and sidebar only when this browse tab owns the active layer.
  if (activeLayer?.layerId !== layerId) return;
  activateLayer(layerId, activeLayer.viewId, featureId);
}

export function closeBrowseDetail<TLayerId extends string = string>({
  activeLayer,
  activateLayer,
  setSelectedItem,
  layerId,
  lastHandledFeatureIdRef,
  clearLastHandledFeatureId = false,
}: BrowseDetailCloseInput<TLayerId>): void {
  setSelectedItem(null);
  if (clearLastHandledFeatureId && lastHandledFeatureIdRef) {
    lastHandledFeatureIdRef.current = null;
  }

  // Keep close transitions local to the currently active layer to avoid
  // cross-layer feature deselection during quick sidebar tab switching.
  if (activeLayer?.layerId !== layerId) return;
  activateLayer(layerId, activeLayer.viewId, undefined);
}
