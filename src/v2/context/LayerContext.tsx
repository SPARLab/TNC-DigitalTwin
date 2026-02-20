// ============================================================================
// LayerContext — Active layer + Pinned layers state management
// Provides: activateLayer, pinLayer, unpinLayer, toggleVisibility, reorder
// ============================================================================

import { createContext, useContext, useCallback, useEffect, useState, type ReactNode } from 'react';
import type {
  ActiveLayer,
  PinnedLayer,
  CatalogLayer,
  UndoAction,
  DataSource,
  INaturalistViewFilters,
  AnimlViewFilters,
  DendraViewFilters,
  TNCArcGISViewFilters,
  DataOneViewFilters,
} from '../types';
import type { DroneImageryMetadata } from '../../types/droneImagery';
import { useCatalog } from './CatalogContext';
import { TAXON_CONFIG } from '../components/Map/layers/taxonConfig';

interface LayerContextValue {
  // Active layer (one at a time)
  activeLayer: ActiveLayer | null;
  activateLayer: (
    layerId: string,
    viewId?: string,
    featureId?: string | number,
    selectedSubLayerId?: string,
  ) => void;
  setActiveServiceSubLayer: (layerId: string) => void;
  deactivateLayer: () => void;

  // Pinned layers (multiple)
  pinnedLayers: PinnedLayer[];
  pinLayer: (layerId: string) => void;
  unpinLayer: (pinnedId: string) => void;
  toggleVisibility: (pinnedId: string) => void;
  setLayerOpacity: (layerId: string, opacity: number) => void;
  getLayerOpacity: (layerId: string) => number;
  toggleChildVisibility: (pinnedId: string, viewId: string) => void;
  clearFilters: (pinnedId: string, viewId?: string) => void;
  syncINaturalistFilters: (
    layerId: string,
    filters: INaturalistViewFilters,
    resultCount: number,
    viewId?: string,
  ) => void;
  syncAnimlFilters: (
    layerId: string,
    filters: AnimlViewFilters,
    resultCount: number,
    viewId?: string,
  ) => void;
  syncDendraFilters: (
    layerId: string,
    filters: DendraViewFilters,
    resultCount: number,
    viewId?: string,
  ) => void;
  syncTNCArcGISFilters: (
    layerId: string,
    filters: TNCArcGISViewFilters,
    resultCount?: number,
    viewId?: string,
  ) => void;
  syncDataOneFilters: (
    layerId: string,
    filters: DataOneViewFilters,
    resultCount: number,
    viewId?: string,
  ) => void;
  createDendraFilteredView: (
    layerId: string,
    filters: DendraViewFilters,
    resultCount: number,
  ) => string | undefined;
  createOrUpdateDataOneFilteredView: (
    layerId: string,
    filters: DataOneViewFilters,
    resultCount: number,
    targetViewId?: string,
  ) => string | undefined;
  createOrUpdateDroneView: (
    layerId: string,
    flight: DroneImageryMetadata,
    comparisonMode?: 'single' | 'temporal',
  ) => string | undefined;
  reorderLayers: (fromIndex: number, toIndex: number) => void;
  createNewView: (pinnedId: string) => void;
  removeView: (pinnedId: string, viewId: string) => void;
  renameView: (pinnedId: string, viewId: string, name: string) => void;

  // Edit Filters → open Browse tab (DFT-019)
  lastEditFiltersRequest: number;
  requestEditFilters: () => void;

  // Filters cleared → hydrate Browse tab with empty state
  lastFiltersClearedTimestamp: number;

  // Helpers
  isLayerPinned: (layerId: string) => boolean;
  isLayerVisible: (layerId: string) => boolean;
  getPinnedByLayerId: (layerId: string) => PinnedLayer | undefined;

  // Undo stack
  undoStack: UndoAction[];
  undo: () => void;
}

const LayerContext = createContext<LayerContextValue | null>(null);

function isServiceContainerLayer(layer: CatalogLayer | undefined): boolean {
  if (!layer) return false;
  return !!(
    layer.catalogMeta?.isMultiLayerService
    && !layer.catalogMeta?.parentServiceId
    && layer.catalogMeta?.siblingLayers
    && layer.catalogMeta.siblingLayers.length > 0
  );
}

function buildINaturalistFilterSummary(filters: INaturalistViewFilters): string | undefined {
  const parts: string[] = [];
  if (filters.excludeAllSpecies) {
    parts.push('Species: none selected');
  }
  if (filters.selectedTaxa.length > 0) {
    const taxonText = filters.selectedTaxa.length <= 2
      ? filters.selectedTaxa.join(' + ')
      : `${filters.selectedTaxa.length} taxa selected`;
    parts.push(`Taxa: ${taxonText}`);
  }
  if (filters.selectedSpecies.length > 0) {
    const speciesText = filters.selectedSpecies.length <= 2
      ? filters.selectedSpecies.join(' + ')
      : `${filters.selectedSpecies.length} species selected`;
    parts.push(`Species: ${speciesText}`);
  }
  if (filters.startDate || filters.endDate) {
    const rangeText = `${filters.startDate || 'Any'} to ${filters.endDate || 'Any'}`;
    parts.push(`Date: ${rangeText}`);
  }
  return parts.length > 0 ? parts.join(', ') : undefined;
}

function getINaturalistFilterCount(filters: INaturalistViewFilters): number {
  return filters.selectedTaxa.length + filters.selectedSpecies.length + (filters.excludeAllSpecies ? 1 : 0) + (filters.startDate || filters.endDate ? 1 : 0);
}

function buildDendraFilterSummary(filters: DendraViewFilters): string | undefined {
  const parts: string[] = [];
  if (filters.showActiveOnly) {
    parts.push('Stations: Active only');
  }
  if (filters.selectedStationName) {
    parts.push(`Station: ${filters.selectedStationName}`);
  }
  if (filters.selectedDatastreamName) {
    parts.push(`Datastream: ${filters.selectedDatastreamName}`);
  }
  if (filters.startDate || filters.endDate) {
    const rangeText = `${filters.startDate || 'Any'} to ${filters.endDate || 'Any'}`;
    parts.push(`Date: ${rangeText}`);
  }
  if (filters.aggregation) {
    parts.push(`Aggregation: ${filters.aggregation}`);
  }
  return parts.length > 0 ? parts.join(', ') : undefined;
}

function getDendraFilterCount(filters: DendraViewFilters): number {
  let count = 0;
  if (filters.showActiveOnly) count += 1;
  if (filters.selectedStationId != null) count += 1;
  if (filters.selectedDatastreamId != null) count += 1;
  if (filters.startDate || filters.endDate) count += 1;
  if (filters.aggregation && filters.aggregation !== 'hourly') count += 1;
  return count;
}

function buildDataOneFilterSummary(filters: DataOneViewFilters): string | undefined {
  if (filters.selectedDatasetId) {
    return `Dataset: ${filters.selectedDatasetTitle || filters.selectedDatasetId}`;
  }
  const parts: string[] = [];
  if (filters.searchText?.trim()) {
    parts.push(`Search: "${filters.searchText.trim()}"`);
  }
  if (filters.tncCategory?.trim()) {
    parts.push(`Category: ${filters.tncCategory.trim()}`);
  }
  if (filters.author?.trim()) {
    parts.push(`Author: ${filters.author.trim()}`);
  }
  if (filters.startDate || filters.endDate) {
    parts.push(`Date: ${filters.startDate || 'Any'} to ${filters.endDate || 'Any'}`);
  }
  return parts.length > 0 ? parts.join(', ') : undefined;
}

function getDataOneFilterCount(filters: DataOneViewFilters): number {
  if (filters.selectedDatasetId) return 1;
  let count = 0;
  if (filters.searchText?.trim()) count += 1;
  if (filters.tncCategory?.trim()) count += 1;
  if (filters.author?.trim()) count += 1;
  if (filters.startDate || filters.endDate) count += 1;
  return count;
}

function buildDataOneViewName(filters: DataOneViewFilters): string {
  if (filters.selectedDatasetId) {
    return filters.selectedDatasetTitle || filters.selectedDatasetId;
  }
  const searchPart = filters.searchText?.trim()
    ? `"${filters.searchText.trim()}"`
    : '';
  const categoryPart = filters.tncCategory?.trim() || '';
  const authorPart = filters.author?.trim() ? `Author: ${filters.author.trim()}` : '';
  const datePart = (filters.startDate || filters.endDate)
    ? `${filters.startDate || 'Any start'} to ${filters.endDate || 'Any end'}`
    : '';
  const nonDate = [searchPart, categoryPart, authorPart].filter(Boolean).join(' • ');
  if (nonDate && datePart) return `${nonDate} (${datePart})`;
  if (nonDate) return nonDate;
  if (datePart) return `Date: ${datePart}`;
  return 'All Datasets';
}

function buildDendraViewName(filters: DendraViewFilters): string {
  const stationPart = filters.selectedStationName?.trim();
  const datastreamPart = filters.selectedDatastreamName?.trim();
  const datePart = (filters.startDate || filters.endDate)
    ? `${filters.startDate || 'Any start'} to ${filters.endDate || 'Any end'}`
    : '';

  if (stationPart && datastreamPart && datePart) {
    return `${stationPart}: ${datastreamPart} (${datePart})`;
  }
  if (stationPart && datastreamPart) return `${stationPart}: ${datastreamPart}`;
  if (datastreamPart && datePart) return `${datastreamPart} (${datePart})`;
  if (datastreamPart) return datastreamPart;
  if (stationPart) return stationPart;
  if (filters.showActiveOnly) return 'Active Stations';
  return 'All Stations';
}

const TAXON_LABEL_BY_VALUE = new Map(TAXON_CONFIG.map(t => [t.value, t.label]));

function buildINaturalistViewName(filters: INaturalistViewFilters): string {
  const selectedTaxa = filters.selectedTaxa || [];
  const selectedSpecies = filters.selectedSpecies || [];
  const taxaLabels = selectedTaxa
    .map(taxon => TAXON_LABEL_BY_VALUE.get(taxon) || taxon)
    .sort((a, b) => a.localeCompare(b));
  const speciesLabels = [...selectedSpecies].sort((a, b) => a.localeCompare(b));

  const taxaPart = taxaLabels.length > 0
    ? (taxaLabels.length <= 3
      ? taxaLabels.join(', ')
      : `${taxaLabels.slice(0, 2).join(', ')}, +${taxaLabels.length - 2} more`)
    : '';
  const speciesPart = filters.excludeAllSpecies
    ? 'No species'
    : speciesLabels.length > 0
    ? (speciesLabels.length <= 2
      ? speciesLabels.join(', ')
      : `${speciesLabels.slice(0, 1).join(', ')}, +${speciesLabels.length - 1} more`)
    : '';

  const hasDate = !!(filters.startDate || filters.endDate);
  const datePart = hasDate
    ? `${filters.startDate || 'Any start'} to ${filters.endDate || 'Any end'}`
    : '';

  const nonDatePart = [taxaPart, speciesPart].filter(Boolean).join(' • ');
  if (nonDatePart && datePart) return `${nonDatePart} (${datePart})`;
  if (nonDatePart) return nonDatePart;
  if (datePart) return `Date: ${datePart}`;
  return 'All Observations';
}

/** Shallow equality check for iNaturalist filter objects */
function filtersEqual(
  a: INaturalistViewFilters | undefined,
  b: INaturalistViewFilters | undefined,
): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  if (a.startDate !== b.startDate || a.endDate !== b.endDate) return false;
  if (!!a.excludeAllSpecies !== !!b.excludeAllSpecies) return false;
  if (a.selectedTaxa.length !== b.selectedTaxa.length) return false;
  if (a.selectedSpecies.length !== b.selectedSpecies.length) return false;
  return a.selectedTaxa.every((t, i) => t === b.selectedTaxa[i])
    && a.selectedSpecies.every((s, i) => s === b.selectedSpecies[i]);
}

function buildAnimlFilterSummary(filters: AnimlViewFilters): string | undefined {
  const parts: string[] = [];
  if (filters.selectedAnimals.length > 0) {
    const speciesText = filters.selectedAnimals.length <= 2
      ? filters.selectedAnimals.join(' + ')
      : `${filters.selectedAnimals.length} species selected`;
    parts.push(`Species: ${speciesText}`);
  }
  if (filters.selectedCameras.length > 0) {
    const cameraText = filters.selectedCameras.length === 1
      ? '1 camera'
      : `${filters.selectedCameras.length} cameras`;
    parts.push(`Cameras: ${cameraText}`);
  }
  if (filters.startDate || filters.endDate) {
    const rangeText = `${filters.startDate || 'Any'} to ${filters.endDate || 'Any'}`;
    parts.push(`Date: ${rangeText}`);
  }
  return parts.length > 0 ? parts.join(', ') : undefined;
}

function getAnimlFilterCount(filters: AnimlViewFilters): number {
  return filters.selectedAnimals.length + filters.selectedCameras.length + (filters.startDate || filters.endDate ? 1 : 0);
}

function buildAnimlViewName(filters: AnimlViewFilters): string {
  const speciesPart = filters.selectedAnimals.length > 0
    ? (filters.selectedAnimals.length <= 2
      ? filters.selectedAnimals.join(', ')
      : `${filters.selectedAnimals.slice(0, 2).join(', ')}, +${filters.selectedAnimals.length - 2} more`)
    : '';

  const cameraPart = filters.selectedCameras.length > 0
    ? (filters.selectedCameras.length === 1
      ? '1 camera'
      : `${filters.selectedCameras.length} cameras`)
    : '';

  const hasDate = !!(filters.startDate || filters.endDate);
  const datePart = hasDate
    ? `${filters.startDate || 'Any start'} to ${filters.endDate || 'Any end'}`
    : '';

  const nonDateParts = [speciesPart, cameraPart].filter(Boolean).join(' • ');
  if (nonDateParts && datePart) return `${nonDateParts} (${datePart})`;
  if (nonDateParts) return nonDateParts;
  if (datePart) return `Date: ${datePart}`;
  return 'All Camera Traps';
}

function formatDroneCapturedDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function buildDroneViewName(flight: DroneImageryMetadata): string {
  const safePlanName = flight.planName?.trim() || `Flight ${flight.id}`;
  return `${safePlanName} (${formatDroneCapturedDate(flight.dateCaptured)})`;
}

function animlFiltersEqual(
  a: AnimlViewFilters | undefined,
  b: AnimlViewFilters | undefined,
): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  if (a.startDate !== b.startDate || a.endDate !== b.endDate) return false;
  if (a.selectedAnimals.length !== b.selectedAnimals.length) return false;
  if (a.selectedCameras.length !== b.selectedCameras.length) return false;
  return a.selectedAnimals.every((s, i) => s === b.selectedAnimals[i])
    && a.selectedCameras.every((c, i) => c === b.selectedCameras[i]);
}

function dendraFiltersEqual(
  a: DendraViewFilters | undefined,
  b: DendraViewFilters | undefined,
): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return (
    a.showActiveOnly === b.showActiveOnly &&
    a.selectedStationId === b.selectedStationId &&
    a.selectedStationName === b.selectedStationName &&
    a.selectedDatastreamId === b.selectedDatastreamId &&
    a.selectedDatastreamName === b.selectedDatastreamName &&
    a.startDate === b.startDate &&
    a.endDate === b.endDate &&
    a.aggregation === b.aggregation
  );
}

function buildTNCArcGISFilterSummary(filters: TNCArcGISViewFilters): string | undefined {
  const clause = filters.whereClause.trim();
  if (!clause || clause === '1=1') return undefined;
  return clause.length > 110 ? `${clause.slice(0, 107)}...` : clause;
}

function getTNCArcGISFilterCount(filters: TNCArcGISViewFilters): number {
  return (filters.fields ?? []).filter(filter => {
    const hasField = filter.field.trim().length > 0;
    const hasOperator = filter.operator.trim().length > 0;
    if (!hasField || !hasOperator) return false;
    if (filter.operator === 'is null' || filter.operator === 'is not null') return true;
    return filter.value.trim().length > 0;
  }).length;
}

function tncArcgisFiltersEqual(
  a: TNCArcGISViewFilters | undefined,
  b: TNCArcGISViewFilters | undefined,
): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  if (a.whereClause !== b.whereClause) return false;
  const aFields = a.fields ?? [];
  const bFields = b.fields ?? [];
  if (aFields.length !== bFields.length) return false;
  return aFields.every((field, index) => {
    const target = bFields[index];
    return !!target
      && field.field === target.field
      && field.operator === target.operator
      && field.value === target.value;
  });
}

function dataOneFiltersEqual(
  a: DataOneViewFilters | undefined,
  b: DataOneViewFilters | undefined,
): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return (
    (a.searchText || '') === (b.searchText || '') &&
    (a.tncCategory || '') === (b.tncCategory || '') &&
    (a.startDate || '') === (b.startDate || '') &&
    (a.endDate || '') === (b.endDate || '') &&
    (a.author || '') === (b.author || '') &&
    (a.selectedDatasetId || '') === (b.selectedDatasetId || '') &&
    (a.selectedDatasetTitle || '') === (b.selectedDatasetTitle || '')
  );
}

export function LayerProvider({ children }: { children: ReactNode }) {
  const { layerMap } = useCatalog();
  const [activeLayer, setActiveLayer] = useState<ActiveLayer | null>(null);
  const [pinnedLayers, setPinnedLayers] = useState<PinnedLayer[]>([]);
  const [layerOpacityById, setLayerOpacityById] = useState<Record<string, number>>({});
  const [undoStack, setUndoStack] = useState<UndoAction[]>([]);

  const pushUndo = useCallback((description: string, undoFn: () => void) => {
    setUndoStack(prev => [
      { id: crypto.randomUUID(), description, undo: undoFn, timestamp: Date.now() },
      ...prev,
    ].slice(0, 5)); // DFT-031: max 5 actions
  }, []);

  const activateLayer = useCallback((
    layerId: string,
    viewId?: string,
    featureId?: string | number,
    selectedSubLayerId?: string,
  ) => {
    const layer = layerMap.get(layerId);
    if (!layer) return;

    const pinned = pinnedLayers.find(p => p.layerId === layerId);
    const isService = isServiceContainerLayer(layer);
    const resolvedSubLayerId = isService
      ? (
        selectedSubLayerId
        && layer.catalogMeta?.siblingLayers?.some(sibling => sibling.id === selectedSubLayerId)
      )
        ? selectedSubLayerId
        : layer.catalogMeta?.siblingLayers?.[0]?.id
      : undefined;
    const resolvedFeatureId = (() => {
      if (featureId != null) return featureId;
      if (!viewId || layerId !== 'dataset-193' || !pinned?.views) return undefined;
      const selectedView = pinned.views.find((view) => view.id === viewId);
      return selectedView?.droneView?.flightId;
    })();
    setActiveLayer({
      id: layerId,
      layerId,
      name: layer.name,
      dataSource: layer.dataSource as DataSource,
      isPinned: !!pinned,
      viewId,
      featureId: resolvedFeatureId,
      isService,
      selectedSubLayerId: resolvedSubLayerId,
    });

    // DFT-001: clicking a pinned-but-hidden layer restores visibility
    if (pinned && !pinned.isVisible) {
      setPinnedLayers(prev =>
        prev.map(p => (p.layerId === layerId ? { ...p, isVisible: true } : p))
      );
    }
  }, [pinnedLayers, layerMap]);

  const [lastEditFiltersRequest, setLastEditFiltersRequest] = useState(0);
  const requestEditFilters = useCallback(() => setLastEditFiltersRequest(Date.now()), []);

  const [lastFiltersClearedTimestamp, setLastFiltersClearedTimestamp] = useState(0);

  const setActiveServiceSubLayer = useCallback((layerId: string) => {
    setActiveLayer(prev => {
      if (!prev?.isService) return prev;
      if (prev.selectedSubLayerId === layerId) return prev;

      const serviceLayer = layerMap.get(prev.layerId);
      const availableLayers = serviceLayer?.catalogMeta?.siblingLayers ?? [];
      const existsInService = availableLayers.some(layer => layer.id === layerId);
      if (!existsInService) return prev;

      return { ...prev, selectedSubLayerId: layerId };
    });
  }, [layerMap]);

  const deactivateLayer = useCallback(() => setActiveLayer(null), []);

  const pinLayer = useCallback((layerId: string) => {
    const layer = layerMap.get(layerId);
    if (!layer) return;
    if (isServiceContainerLayer(layer)) {
      console.warn(`[LayerContext] Skipping pin for service container: ${layerId}`);
      return;
    }
    if (pinnedLayers.some(p => p.layerId === layerId)) return; // already pinned

    const newPinned: PinnedLayer = {
      id: crypto.randomUUID(),
      layerId,
      name: layer.name,
      isVisible: true,
      opacity: layerOpacityById[layerId] ?? 1,
      isActive: activeLayer?.layerId === layerId,
      filterCount: 0,
      order: 0, // new layers go to the top
    };
    // Prepend new layer at top, reorder existing
    setPinnedLayers(prev => [newPinned, ...prev.map((p, i) => ({ ...p, order: i + 1 }))]);

    // Update active layer's isPinned flag
    if (activeLayer?.layerId === layerId) {
      setActiveLayer(prev => prev ? { ...prev, isPinned: true } : null);
    }
  }, [pinnedLayers, activeLayer, layerMap, layerOpacityById]);

  const unpinLayer = useCallback((pinnedId: string) => {
    const target = pinnedLayers.find(p => p.id === pinnedId);
    if (!target) return;

    setPinnedLayers(prev => prev.filter(p => p.id !== pinnedId));

    // Update active layer's isPinned flag
    if (activeLayer?.layerId === target.layerId) {
      setActiveLayer(prev => prev ? { ...prev, isPinned: false } : null);
    }

    // DFT-031: push undo
    pushUndo(`Unpinned ${target.name}`, () => {
      setPinnedLayers(prev => [...prev, target]);
      if (activeLayer?.layerId === target.layerId) {
        setActiveLayer(prev => prev ? { ...prev, isPinned: true } : null);
      }
    });
  }, [pinnedLayers, activeLayer, pushUndo]);

  const toggleVisibility = useCallback((pinnedId: string) => {
    setPinnedLayers(prev =>
      prev.map(p => {
        if (p.id !== pinnedId) return p;
        
        // If nested (has views), handle parent-child visibility relationship
        if (p.views && p.views.length > 0) {
          const turningOn = !p.isVisible;
          
          if (turningOn) {
            // Turning ON: restore the first visible child (or make first child visible if none are)
            const hasVisibleChild = p.views.some(v => v.isVisible);
            if (!hasVisibleChild) {
              // No visible children, turn on the first one
              return {
                ...p,
                isVisible: true,
                views: p.views.map((v, i) => ({ ...v, isVisible: i === 0 })),
              };
            }
            // Has visible child, just turn parent on
            return { ...p, isVisible: true };
          } else {
            // Turning OFF: hide parent and all children
            return {
              ...p,
              isVisible: false,
              views: p.views.map(v => ({ ...v, isVisible: false })),
            };
          }
        }
        
        // For flat layers, just toggle visibility
        return { ...p, isVisible: !p.isVisible };
      })
    );
  }, []);

  const setLayerOpacity = useCallback((layerId: string, opacity: number) => {
    const clampedOpacity = Math.min(1, Math.max(0, opacity));
    setLayerOpacityById(prev => ({ ...prev, [layerId]: clampedOpacity }));
    setPinnedLayers(prev =>
      prev.map(p => (p.layerId === layerId ? { ...p, opacity: clampedOpacity } : p))
    );
  }, []);

  const getLayerOpacity = useCallback((layerId: string) => {
    const pinnedLayer = pinnedLayers.find(p => p.layerId === layerId);
    if (typeof pinnedLayer?.opacity === 'number') return pinnedLayer.opacity;
    return layerOpacityById[layerId] ?? 1;
  }, [pinnedLayers, layerOpacityById]);

  const toggleChildVisibility = useCallback((pinnedId: string, viewId: string) => {
    setPinnedLayers(prev =>
      prev.map(p => {
        if (p.id !== pinnedId || !p.views) return p;
        const view = p.views.find(v => v.id === viewId);
        if (!view) return p;
        const turningOn = !view.isVisible;
        const nextViews = p.views.map(v => {
          if (v.id === viewId) return { ...v, isVisible: !v.isVisible };
          if (turningOn) return { ...v, isVisible: false }; // DFT-013: mutual exclusivity
          return v;
        });
        const anyVisible = nextViews.some(v => v.isVisible);
        return { ...p, views: nextViews, isVisible: anyVisible };
      })
    );
  }, []);

  const clearFilters = useCallback((pinnedId: string, viewId?: string) => {
    const target = pinnedLayers.find(p => p.id === pinnedId);
    if (!target) return;
    const prevState = JSON.parse(JSON.stringify(pinnedLayers));

    setPinnedLayers(prev =>
      prev.map(p => {
        if (p.id !== pinnedId) return p;
        if (viewId && p.views) {
          return {
            ...p,
            views: p.views.map(v =>
              v.id === viewId
                ? {
                    ...v,
                    filterCount: 0,
                    filterSummary: undefined,
                    inaturalistFilters: { selectedTaxa: [], selectedSpecies: [], startDate: undefined, endDate: undefined },
                    animlFilters: { selectedAnimals: [], selectedCameras: [], startDate: undefined, endDate: undefined },
                    tncArcgisFilters: { whereClause: '1=1', fields: [] },
                    dendraFilters: {
                      showActiveOnly: false,
                      selectedStationId: undefined,
                      selectedStationName: undefined,
                      selectedDatastreamId: undefined,
                      selectedDatastreamName: undefined,
                      startDate: undefined,
                      endDate: undefined,
                      aggregation: undefined,
                    },
                    dataoneFilters: {
                      searchText: undefined,
                      tncCategory: undefined,
                      startDate: undefined,
                      endDate: undefined,
                      author: undefined,
                      selectedDatasetId: undefined,
                    },
                  }
                : v
            ),
          };
        }
        return {
          ...p,
          filterCount: 0,
          filterSummary: undefined,
          inaturalistFilters: { selectedTaxa: [], selectedSpecies: [], startDate: undefined, endDate: undefined },
          animlFilters: { selectedAnimals: [], selectedCameras: [], startDate: undefined, endDate: undefined },
          tncArcgisFilters: { whereClause: '1=1', fields: [] },
          dendraFilters: {
            showActiveOnly: false,
            selectedStationId: undefined,
            selectedStationName: undefined,
            selectedDatastreamId: undefined,
            selectedDatastreamName: undefined,
            startDate: undefined,
            endDate: undefined,
            aggregation: undefined,
          },
          dataoneFilters: {
            searchText: undefined,
            tncCategory: undefined,
            startDate: undefined,
            endDate: undefined,
            author: undefined,
            selectedDatasetId: undefined,
          },
          distinguisher: undefined,
        };
      })
    );

    pushUndo('Filters cleared', () => setPinnedLayers(prevState));
    setLastFiltersClearedTimestamp(Date.now());
  }, [pinnedLayers, pushUndo]);

  const syncINaturalistFilters = useCallback(
    (layerId: string, filters: INaturalistViewFilters, resultCount: number, viewId?: string) => {
      setPinnedLayers(prev => {
        const nextLayers = prev.map(p => {
          if (p.layerId !== layerId) return p;

          const normalizedFilters: INaturalistViewFilters = {
            selectedTaxa: [...filters.selectedTaxa],
            selectedSpecies: [...filters.selectedSpecies],
            excludeAllSpecies: !!filters.excludeAllSpecies,
            startDate: filters.startDate,
            endDate: filters.endDate,
          };
          const nextFilterCount = getINaturalistFilterCount(normalizedFilters);
          const nextFilterSummary = buildINaturalistFilterSummary(normalizedFilters);

          if (viewId && p.views) {
            const targetView = p.views.find(v => v.id === viewId);
            const nextViewName = targetView?.isNameCustom
              ? targetView.name
              : buildINaturalistViewName(normalizedFilters);
            // Bail out if nothing changed — avoids unnecessary re-renders
            if (
              targetView &&
              targetView.name === nextViewName &&
              targetView.filterCount === nextFilterCount &&
              targetView.filterSummary === nextFilterSummary &&
              targetView.resultCount === resultCount &&
              filtersEqual(targetView.inaturalistFilters, normalizedFilters)
            ) return p;

            return {
              ...p,
              views: p.views.map(v =>
                v.id === viewId
                  ? {
                      ...v,
                      name: nextViewName,
                      filterCount: nextFilterCount,
                      filterSummary: nextFilterSummary,
                      inaturalistFilters: normalizedFilters,
                      resultCount,
                    }
                  : v
              ),
            };
          }

          // Bail out if nothing changed — avoids unnecessary re-renders
          if (
            p.filterCount === nextFilterCount &&
            p.filterSummary === nextFilterSummary &&
            p.resultCount === resultCount &&
            filtersEqual(p.inaturalistFilters, normalizedFilters)
          ) return p;

          return {
            ...p,
            filterCount: nextFilterCount,
            filterSummary: nextFilterSummary,
            inaturalistFilters: normalizedFilters,
            resultCount,
          };
        });

        // If every layer returned the same reference, skip the state update entirely
        const changed = nextLayers.some((l, i) => l !== prev[i]);
        return changed ? nextLayers : prev;
      });
    },
    []
  );

  const syncAnimlFilters = useCallback(
    (layerId: string, filters: AnimlViewFilters, resultCount: number, viewId?: string) => {
      setPinnedLayers(prev => {
        const nextLayers = prev.map(p => {
          if (p.layerId !== layerId) return p;

          const normalizedFilters: AnimlViewFilters = {
            selectedAnimals: [...filters.selectedAnimals],
            selectedCameras: [...filters.selectedCameras],
            startDate: filters.startDate,
            endDate: filters.endDate,
          };
          const nextFilterCount = getAnimlFilterCount(normalizedFilters);
          const nextFilterSummary = buildAnimlFilterSummary(normalizedFilters);

          if (viewId && p.views) {
            const targetView = p.views.find(v => v.id === viewId);
            const nextViewName = targetView?.isNameCustom
              ? targetView.name
              : buildAnimlViewName(normalizedFilters);

            if (
              targetView &&
              targetView.name === nextViewName &&
              targetView.filterCount === nextFilterCount &&
              targetView.filterSummary === nextFilterSummary &&
              targetView.resultCount === resultCount &&
              animlFiltersEqual(targetView.animlFilters, normalizedFilters)
            ) return p;

            return {
              ...p,
              views: p.views.map(v =>
                v.id === viewId
                  ? {
                      ...v,
                      name: nextViewName,
                      filterCount: nextFilterCount,
                      filterSummary: nextFilterSummary,
                      animlFilters: normalizedFilters,
                      resultCount,
                    }
                  : v
              ),
            };
          }

          if (
            p.filterCount === nextFilterCount &&
            p.filterSummary === nextFilterSummary &&
            p.resultCount === resultCount &&
            animlFiltersEqual(p.animlFilters, normalizedFilters)
          ) return p;

          return {
            ...p,
            filterCount: nextFilterCount,
            filterSummary: nextFilterSummary,
            animlFilters: normalizedFilters,
            resultCount,
          };
        });

        const changed = nextLayers.some((l, i) => l !== prev[i]);
        return changed ? nextLayers : prev;
      });
    },
    []
  );

  const syncDendraFilters = useCallback(
    (layerId: string, filters: DendraViewFilters, resultCount: number, viewId?: string) => {
      setPinnedLayers(prev => {
        const nextLayers = prev.map(p => {
          if (p.layerId !== layerId) return p;

          const normalizedFilters: DendraViewFilters = {
            showActiveOnly: !!filters.showActiveOnly,
            selectedStationId: filters.selectedStationId,
            selectedStationName: filters.selectedStationName,
            selectedDatastreamId: filters.selectedDatastreamId,
            selectedDatastreamName: filters.selectedDatastreamName,
            startDate: filters.startDate,
            endDate: filters.endDate,
            aggregation: filters.aggregation,
          };
          const nextFilterCount = getDendraFilterCount(normalizedFilters);
          const nextFilterSummary = buildDendraFilterSummary(normalizedFilters);

          if (viewId && p.views) {
            const targetView = p.views.find(v => v.id === viewId);
            const nextViewName = targetView?.isNameCustom
              ? targetView.name
              : buildDendraViewName(normalizedFilters);

            if (
              targetView &&
              targetView.name === nextViewName &&
              targetView.filterCount === nextFilterCount &&
              targetView.filterSummary === nextFilterSummary &&
              targetView.resultCount === resultCount &&
              dendraFiltersEqual(targetView.dendraFilters, normalizedFilters)
            ) return p;

            return {
              ...p,
              views: p.views.map(v =>
                v.id === viewId
                  ? {
                      ...v,
                      name: nextViewName,
                      filterCount: nextFilterCount,
                      filterSummary: nextFilterSummary,
                      dendraFilters: normalizedFilters,
                      resultCount,
                    }
                  : v
              ),
            };
          }

          if (
            p.filterCount === nextFilterCount &&
            p.filterSummary === nextFilterSummary &&
            p.resultCount === resultCount &&
            dendraFiltersEqual(p.dendraFilters, normalizedFilters)
          ) return p;

          return {
            ...p,
            filterCount: nextFilterCount,
            filterSummary: nextFilterSummary,
            dendraFilters: normalizedFilters,
            resultCount,
          };
        });

        const changed = nextLayers.some((l, i) => l !== prev[i]);
        return changed ? nextLayers : prev;
      });
    },
    []
  );

  const syncTNCArcGISFilters = useCallback(
    (layerId: string, filters: TNCArcGISViewFilters, resultCount?: number, viewId?: string) => {
      setPinnedLayers(prev => {
        const nextLayers = prev.map(p => {
          if (p.layerId !== layerId) return p;

          const normalizedFilters: TNCArcGISViewFilters = {
            whereClause: filters.whereClause.trim() || '1=1',
            fields: (filters.fields ?? []).map(filter => ({
              field: filter.field,
              operator: filter.operator,
              value: filter.value,
            })),
          };
          const nextFilterCount = getTNCArcGISFilterCount(normalizedFilters);
          const nextFilterSummary = buildTNCArcGISFilterSummary(normalizedFilters);

          if (viewId && p.views) {
            const targetView = p.views.find(v => v.id === viewId);
            if (
              targetView &&
              targetView.filterCount === nextFilterCount &&
              targetView.filterSummary === nextFilterSummary &&
              targetView.resultCount === resultCount &&
              tncArcgisFiltersEqual(targetView.tncArcgisFilters, normalizedFilters)
            ) return p;

            return {
              ...p,
              views: p.views.map(v =>
                v.id === viewId
                  ? {
                      ...v,
                      filterCount: nextFilterCount,
                      filterSummary: nextFilterSummary,
                      tncArcgisFilters: normalizedFilters,
                      resultCount,
                    }
                  : v
              ),
            };
          }

          if (
            p.filterCount === nextFilterCount &&
            p.filterSummary === nextFilterSummary &&
            p.resultCount === resultCount &&
            tncArcgisFiltersEqual(p.tncArcgisFilters, normalizedFilters)
          ) return p;

          return {
            ...p,
            filterCount: nextFilterCount,
            filterSummary: nextFilterSummary,
            tncArcgisFilters: normalizedFilters,
            resultCount,
          };
        });

        const changed = nextLayers.some((l, i) => l !== prev[i]);
        return changed ? nextLayers : prev;
      });
    },
    []
  );

  const syncDataOneFilters = useCallback(
    (layerId: string, filters: DataOneViewFilters, resultCount: number, viewId?: string) => {
      setPinnedLayers(prev => {
        const nextLayers = prev.map(p => {
          if (p.layerId !== layerId) return p;

          const normalizedFilters: DataOneViewFilters = {
            searchText: filters.searchText?.trim() || undefined,
            tncCategory: filters.tncCategory?.trim() || undefined,
            startDate: filters.startDate || undefined,
            endDate: filters.endDate || undefined,
            author: filters.author?.trim() || undefined,
            selectedDatasetId: filters.selectedDatasetId || undefined,
            selectedDatasetTitle: filters.selectedDatasetTitle?.trim() || undefined,
          };
          const nextFilterCount = getDataOneFilterCount(normalizedFilters);
          const nextFilterSummary = buildDataOneFilterSummary(normalizedFilters);

          if (viewId && p.views) {
            const targetView = p.views.find(v => v.id === viewId);
            const nextViewName = targetView?.isNameCustom
              ? targetView.name
              : buildDataOneViewName(normalizedFilters);

            if (
              targetView &&
              targetView.name === nextViewName &&
              targetView.filterCount === nextFilterCount &&
              targetView.filterSummary === nextFilterSummary &&
              targetView.resultCount === resultCount &&
              dataOneFiltersEqual(targetView.dataoneFilters, normalizedFilters)
            ) return p;

            return {
              ...p,
              views: p.views.map(v =>
                v.id === viewId
                  ? {
                      ...v,
                      name: nextViewName,
                      filterCount: nextFilterCount,
                      filterSummary: nextFilterSummary,
                      dataoneFilters: normalizedFilters,
                      resultCount,
                    }
                  : v
              ),
            };
          }

          if (
            p.filterCount === nextFilterCount &&
            p.filterSummary === nextFilterSummary &&
            p.resultCount === resultCount &&
            dataOneFiltersEqual(p.dataoneFilters, normalizedFilters)
          ) return p;

          return {
            ...p,
            filterCount: nextFilterCount,
            filterSummary: nextFilterSummary,
            dataoneFilters: normalizedFilters,
            resultCount,
          };
        });

        const changed = nextLayers.some((l, i) => l !== prev[i]);
        return changed ? nextLayers : prev;
      });
    },
    []
  );

  const createDendraFilteredView = useCallback(
    (layerId: string, filters: DendraViewFilters, resultCount: number) => {
      const layer = layerMap.get(layerId);
      if (!layer) return undefined;

      const newViewId = crypto.randomUUID();
      const normalizedFilters: DendraViewFilters = {
        showActiveOnly: !!filters.showActiveOnly,
        selectedStationId: filters.selectedStationId,
        selectedStationName: filters.selectedStationName,
        selectedDatastreamId: filters.selectedDatastreamId,
        selectedDatastreamName: filters.selectedDatastreamName,
        startDate: filters.startDate,
        endDate: filters.endDate,
        aggregation: filters.aggregation,
      };
      const nextFilterCount = getDendraFilterCount(normalizedFilters);
      const nextFilterSummary = buildDendraFilterSummary(normalizedFilters);
      const newViewName = buildDendraViewName(normalizedFilters);

      const newView = {
        id: newViewId,
        name: newViewName,
        isNameCustom: false,
        isVisible: true,
        filterCount: nextFilterCount,
        filterSummary: nextFilterSummary,
        dendraFilters: normalizedFilters,
        resultCount,
      };

      setPinnedLayers(prev => {
        const target = prev.find(p => p.layerId === layerId);
        if (!target) {
          const newPinned: PinnedLayer = {
            id: crypto.randomUUID(),
            layerId,
            name: layer.name,
            isVisible: true,
            opacity: layerOpacityById[layerId] ?? 1,
            isActive: activeLayer?.layerId === layerId,
            filterCount: 0,
            views: [newView],
            order: 0,
          };
          return [newPinned, ...prev.map((p, i) => ({ ...p, order: i + 1 }))];
        }

        return prev.map(p => {
          if (p.layerId !== layerId) return p;

          if (p.views && p.views.length > 0) {
            return {
              ...p,
              isVisible: true,
              views: [
                ...p.views.map(v => ({ ...v, isVisible: false })),
                newView,
              ],
            };
          }

          const existingFlatViewName = p.distinguisher || buildDendraViewName(
            p.dendraFilters || {
              showActiveOnly: false,
              selectedStationId: undefined,
              selectedStationName: undefined,
              selectedDatastreamId: undefined,
              selectedDatastreamName: undefined,
              startDate: undefined,
              endDate: undefined,
              aggregation: undefined,
            }
          );

          const existingFlatView = {
            id: crypto.randomUUID(),
            name: existingFlatViewName,
            isNameCustom: !!p.distinguisher,
            isVisible: false,
            filterCount: p.filterCount,
            filterSummary: p.filterSummary,
            inaturalistFilters: p.inaturalistFilters,
            dendraFilters: p.dendraFilters,
            resultCount: p.resultCount,
          };

          return {
            ...p,
            isVisible: true,
            views: [existingFlatView, newView],
            filterCount: 0,
            filterSummary: undefined,
            inaturalistFilters: { selectedTaxa: [], selectedSpecies: [], startDate: undefined, endDate: undefined },
            dendraFilters: {
              showActiveOnly: false,
              selectedStationId: undefined,
              selectedStationName: undefined,
              selectedDatastreamId: undefined,
              selectedDatastreamName: undefined,
              startDate: undefined,
              endDate: undefined,
              aggregation: undefined,
            },
            distinguisher: undefined,
            resultCount: undefined,
          };
        });
      });

      setActiveLayer(prev =>
        prev && prev.layerId === layerId
          ? { ...prev, isPinned: true, viewId: newViewId }
          : prev
      );
      return newViewId;
    },
    [activeLayer, layerMap, layerOpacityById]
  );

  const createOrUpdateDataOneFilteredView = useCallback(
    (layerId: string, filters: DataOneViewFilters, resultCount: number, targetViewId?: string) => {
      const layer = layerMap.get(layerId);
      if (!layer) return undefined;

      const normalizedFilters: DataOneViewFilters = {
        searchText: filters.searchText?.trim() || undefined,
        tncCategory: filters.tncCategory?.trim() || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        author: filters.author?.trim() || undefined,
        selectedDatasetId: filters.selectedDatasetId || undefined,
        selectedDatasetTitle: filters.selectedDatasetTitle?.trim() || undefined,
      };
      const nextFilterCount = getDataOneFilterCount(normalizedFilters);
      const nextFilterSummary = buildDataOneFilterSummary(normalizedFilters);
      const newViewName = buildDataOneViewName(normalizedFilters);
      const newViewId = targetViewId || crypto.randomUUID();

      const newView = {
        id: newViewId,
        name: newViewName,
        isNameCustom: false,
        isVisible: true,
        filterCount: nextFilterCount,
        filterSummary: nextFilterSummary,
        dataoneFilters: normalizedFilters,
        resultCount,
      };

      setPinnedLayers(prev => {
        const target = prev.find(p => p.layerId === layerId);
        if (!target) {
          const newPinned: PinnedLayer = {
            id: crypto.randomUUID(),
            layerId,
            name: layer.name,
            isVisible: true,
            isActive: activeLayer?.layerId === layerId,
            filterCount: 0,
            views: [newView],
            order: 0,
          };
          return [newPinned, ...prev.map((p, i) => ({ ...p, order: i + 1 }))];
        }

        return prev.map(p => {
          if (p.layerId !== layerId) return p;

          if (p.views && p.views.length > 0) {
            const hasTarget = !!targetViewId && p.views.some(v => v.id === targetViewId);
            if (hasTarget) {
              return {
                ...p,
                isVisible: true,
                views: p.views.map(v => {
                  if (v.id === targetViewId) {
                    const nextName = v.isNameCustom ? v.name : newViewName;
                    return {
                      ...v,
                      name: nextName,
                      isVisible: true,
                      filterCount: nextFilterCount,
                      filterSummary: nextFilterSummary,
                      dataoneFilters: normalizedFilters,
                      resultCount,
                    };
                  }
                  return { ...v, isVisible: false };
                }),
              };
            }

            return {
              ...p,
              isVisible: true,
              views: [
                ...p.views.map(v => ({ ...v, isVisible: false })),
                newView,
              ],
            };
          }

          const existingFlatViewName = p.distinguisher || buildDataOneViewName(
            p.dataoneFilters || {
              searchText: undefined,
              tncCategory: undefined,
              startDate: undefined,
              endDate: undefined,
              author: undefined,
              selectedDatasetId: undefined,
            }
          );

          const existingFlatView = {
            id: crypto.randomUUID(),
            name: existingFlatViewName,
            isNameCustom: !!p.distinguisher,
            isVisible: false,
            filterCount: p.filterCount,
            filterSummary: p.filterSummary,
            inaturalistFilters: p.inaturalistFilters,
            animlFilters: p.animlFilters,
            dendraFilters: p.dendraFilters,
            dataoneFilters: p.dataoneFilters,
            resultCount: p.resultCount,
          };

          return {
            ...p,
            isVisible: true,
            views: [existingFlatView, newView],
            filterCount: 0,
            filterSummary: undefined,
            inaturalistFilters: { selectedTaxa: [], selectedSpecies: [], startDate: undefined, endDate: undefined },
            animlFilters: { selectedAnimals: [], selectedCameras: [], startDate: undefined, endDate: undefined },
            dendraFilters: {
              showActiveOnly: false,
              selectedStationId: undefined,
              selectedStationName: undefined,
              selectedDatastreamId: undefined,
              selectedDatastreamName: undefined,
              startDate: undefined,
              endDate: undefined,
              aggregation: undefined,
            },
            dataoneFilters: {
              searchText: undefined,
              tncCategory: undefined,
              startDate: undefined,
              endDate: undefined,
              author: undefined,
              selectedDatasetId: undefined,
            },
            distinguisher: undefined,
            resultCount: undefined,
          };
        });
      });

      setActiveLayer(prev =>
        prev && prev.layerId === layerId
          ? { ...prev, isPinned: true, viewId: newViewId, featureId: normalizedFilters.selectedDatasetId }
          : prev
      );
      return newViewId;
    },
    [activeLayer, layerMap]
  );

  const createOrUpdateDroneView = useCallback(
    (layerId: string, flight: DroneImageryMetadata, comparisonMode: 'single' | 'temporal' = 'single') => {
      const layer = layerMap.get(layerId);
      if (!layer) return undefined;

      const baseView = {
        name: buildDroneViewName(flight),
        isNameCustom: false,
        isVisible: true,
        filterCount: 0,
        filterSummary: undefined,
        droneView: {
          flightId: flight.id,
          projectName: flight.projectName,
          planName: flight.planName,
          capturedAt: flight.dateCaptured.toISOString(),
          comparisonMode,
        },
      };

      let resolvedViewId: string | undefined;

      setPinnedLayers((prev) => {
        const target = prev.find((p) => p.layerId === layerId);

        if (!target) {
          const newViewId = crypto.randomUUID();
          resolvedViewId = newViewId;
          const newPinned: PinnedLayer = {
            id: crypto.randomUUID(),
            layerId,
            name: layer.name,
            isVisible: true,
            isActive: activeLayer?.layerId === layerId,
            filterCount: 0,
            filterSummary: undefined,
            views: [{ id: newViewId, ...baseView }],
            order: 0,
          };
          return [newPinned, ...prev.map((p, i) => ({ ...p, order: i + 1 }))];
        }

        return prev.map((p) => {
          if (p.layerId !== layerId) return p;

          const existingByFlight = p.views?.find(
            (view) => view.droneView?.flightId === flight.id
          );
          const targetViewId = existingByFlight?.id ?? crypto.randomUUID();
          resolvedViewId = targetViewId;

          if (p.views && p.views.length > 0) {
            return {
              ...p,
              isVisible: true,
              views: p.views.some((view) => view.id === targetViewId)
                ? p.views.map((view) => {
                    if (view.id !== targetViewId) return { ...view, isVisible: false };
                    const nextName = view.isNameCustom ? view.name : baseView.name;
                    return {
                      ...view,
                      name: nextName,
                      isVisible: true,
                      filterCount: 0,
                      filterSummary: undefined,
                      droneView: baseView.droneView,
                    };
                  })
                : [
                    ...p.views.map((view) => ({ ...view, isVisible: false })),
                    { id: targetViewId, ...baseView },
                  ],
            };
          }

          return {
            ...p,
            isVisible: true,
            views: [{ id: targetViewId, ...baseView }],
            filterCount: 0,
            filterSummary: undefined,
            inaturalistFilters: { selectedTaxa: [], selectedSpecies: [], startDate: undefined, endDate: undefined },
            animlFilters: { selectedAnimals: [], selectedCameras: [], startDate: undefined, endDate: undefined },
            dendraFilters: undefined,
            dataoneFilters: undefined,
            droneView: undefined,
            distinguisher: undefined,
            resultCount: undefined,
          };
        });
      });

      if (!resolvedViewId) return undefined;
      setActiveLayer((prev) =>
        prev && prev.layerId === layerId
          ? { ...prev, isPinned: true, viewId: resolvedViewId, featureId: flight.id }
          : prev
      );
      return resolvedViewId;
    },
    [activeLayer, layerMap]
  );

  const reorderLayers = useCallback((fromIndex: number, toIndex: number) => {
    setPinnedLayers(prev => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next.map((p, i) => ({ ...p, order: i }));
    });
  }, []);

  const createNewView = useCallback((pinnedId: string) => {
    let nextActiveView: { layerId: string; viewId: string } | null = null;

    setPinnedLayers(prev =>
      prev.map(p => {
        if (p.id !== pinnedId) return p;
        const isDendraLayer = layerMap.get(p.layerId)?.dataSource === 'dendra';
        const isAnimlLayer = layerMap.get(p.layerId)?.dataSource === 'animl';
        const isDataOneLayer = layerMap.get(p.layerId)?.dataSource === 'dataone';
        const isDroneLayer = p.layerId === 'dataset-193';
        if (isDroneLayer) return p;
        
        // If already nested, add a new view
        if (p.views && p.views.length > 0) {
          const newViewId = crypto.randomUUID();
          const newView = {
            id: newViewId,
            name: 'Add Filters',
            isNameCustom: false,
            isVisible: false,
            filterCount: 0,
            inaturalistFilters: { selectedTaxa: [], selectedSpecies: [], startDate: undefined, endDate: undefined },
            animlFilters: { selectedAnimals: [], selectedCameras: [], startDate: undefined, endDate: undefined },
            dendraFilters: isDendraLayer
              ? {
                  showActiveOnly: false,
                  selectedStationId: undefined,
                  selectedStationName: undefined,
                  selectedDatastreamId: undefined,
                  selectedDatastreamName: undefined,
                  startDate: undefined,
                  endDate: undefined,
                  aggregation: undefined,
                }
              : undefined,
            dataoneFilters: isDataOneLayer
              ? {
                  searchText: undefined,
                  tncCategory: undefined,
                  startDate: undefined,
                  endDate: undefined,
                  author: undefined,
                  selectedDatasetId: undefined,
                }
              : undefined,
            droneView: undefined,
          };
          nextActiveView = { layerId: p.layerId, viewId: newViewId };
          return { ...p, views: [...p.views, newView] };
        }
        
        // Convert flat → nested: current state becomes View 1, add empty View 2
        const view1Name = p.distinguisher || (
          isDendraLayer
            ? buildDendraViewName(
                p.dendraFilters || {
                  showActiveOnly: false,
                  selectedStationId: undefined,
                  selectedStationName: undefined,
                  selectedDatastreamId: undefined,
                  selectedDatastreamName: undefined,
                  startDate: undefined,
                  endDate: undefined,
                  aggregation: undefined,
                }
              )
            : isAnimlLayer
            ? buildAnimlViewName(
              p.animlFilters || { selectedAnimals: [], selectedCameras: [], startDate: undefined, endDate: undefined }
            )
            : isDataOneLayer
            ? buildDataOneViewName(
              p.dataoneFilters || {
                searchText: undefined,
                tncCategory: undefined,
                startDate: undefined,
                endDate: undefined,
                author: undefined,
                selectedDatasetId: undefined,
              }
            )
            : buildINaturalistViewName(
              p.inaturalistFilters || { selectedTaxa: [], selectedSpecies: [], startDate: undefined, endDate: undefined }
            )
        );
        const view1 = {
          id: crypto.randomUUID(),
          name: view1Name,
          isNameCustom: !!p.distinguisher,
          isVisible: p.isVisible,
          filterCount: p.filterCount,
          filterSummary: p.filterSummary,
          inaturalistFilters: p.inaturalistFilters,
          animlFilters: p.animlFilters,
          dendraFilters: p.dendraFilters,
          dataoneFilters: p.dataoneFilters,
          droneView: p.droneView,
          resultCount: p.resultCount,
        };
        const view2 = {
          id: crypto.randomUUID(),
          name: 'Add Filters',
          isNameCustom: false,
          isVisible: false,
          filterCount: 0,
          inaturalistFilters: { selectedTaxa: [], selectedSpecies: [], startDate: undefined, endDate: undefined },
          animlFilters: { selectedAnimals: [], selectedCameras: [], startDate: undefined, endDate: undefined },
          dendraFilters: isDendraLayer
            ? {
                showActiveOnly: false,
                selectedStationId: undefined,
                selectedStationName: undefined,
                selectedDatastreamId: undefined,
                selectedDatastreamName: undefined,
                startDate: undefined,
                endDate: undefined,
                aggregation: undefined,
              }
            : undefined,
          dataoneFilters: isDataOneLayer
            ? {
                searchText: undefined,
                tncCategory: undefined,
                startDate: undefined,
                endDate: undefined,
                author: undefined,
                selectedDatasetId: undefined,
              }
            : undefined,
          droneView: undefined,
        };
        nextActiveView = { layerId: p.layerId, viewId: view2.id };
        
        // Clear flat-level filter data (now in views)
        return {
          ...p,
          views: [view1, view2],
          filterCount: 0,
          filterSummary: undefined,
          inaturalistFilters: { selectedTaxa: [], selectedSpecies: [], startDate: undefined, endDate: undefined },
          animlFilters: { selectedAnimals: [], selectedCameras: [], startDate: undefined, endDate: undefined },
          dendraFilters: isDendraLayer
            ? {
                showActiveOnly: false,
                selectedStationId: undefined,
                selectedStationName: undefined,
                selectedDatastreamId: undefined,
                selectedDatastreamName: undefined,
                startDate: undefined,
                endDate: undefined,
                aggregation: undefined,
              }
            : undefined,
          dataoneFilters: isDataOneLayer
            ? {
                searchText: undefined,
                tncCategory: undefined,
                startDate: undefined,
                endDate: undefined,
                author: undefined,
                selectedDatasetId: undefined,
              }
            : undefined,
          droneView: undefined,
          distinguisher: undefined,
          resultCount: undefined,
        };
      })
    );
    if (nextActiveView) {
      activateLayer(nextActiveView.layerId, nextActiveView.viewId);
      requestEditFilters();
    }
  }, [layerMap, activateLayer, requestEditFilters]);

  const removeView = useCallback((pinnedId: string, viewId: string) => {
    setPinnedLayers(prev =>
      prev.map(p => {
        if (p.id !== pinnedId || !p.views) return p;
        
        const remainingViews = p.views.filter(v => v.id !== viewId);
        if (p.layerId === 'dataset-193') {
          return {
            ...p,
            views: remainingViews,
            isVisible: remainingViews.some((view) => view.isVisible),
          };
        }
        
        // If only one view left, convert back to flat
        if (remainingViews.length === 1) {
          const lastView = remainingViews[0];
          return {
            ...p,
            views: undefined,
            isVisible: lastView.isVisible,
            filterCount: lastView.filterCount,
            filterSummary: lastView.filterSummary,
            inaturalistFilters: lastView.inaturalistFilters,
            animlFilters: lastView.animlFilters,
            dendraFilters: lastView.dendraFilters,
            dataoneFilters: lastView.dataoneFilters,
            droneView: lastView.droneView,
            distinguisher: lastView.isNameCustom ? lastView.name : undefined,
            resultCount: lastView.resultCount,
          };
        }
        
        // Keep as nested with remaining views
        return { ...p, views: remainingViews };
      })
    );
  }, []);

  // Keep active view selection aligned with pinned child-view visibility/state.
  // This prevents map/sidebar drift when child visibility changes or views are removed.
  useEffect(() => {
    if (!activeLayer) return;

    const pinned = pinnedLayers.find((layer) => layer.layerId === activeLayer.layerId);
    if (!pinned?.views || pinned.views.length === 0) return;

    const currentActiveView = activeLayer.viewId
      ? pinned.views.find((view) => view.id === activeLayer.viewId)
      : undefined;
    const visibleView = pinned.views.find((view) => view.isVisible);

    const nextActiveView = (() => {
      if (currentActiveView?.isVisible) return currentActiveView;
      if (visibleView) return visibleView;
      if (currentActiveView) return currentActiveView;
      return pinned.views[0];
    })();

    const nextFeatureId = activeLayer.layerId === 'dataset-193'
      ? nextActiveView?.droneView?.flightId
      : activeLayer.featureId;

    if (
      nextActiveView &&
      activeLayer.viewId === nextActiveView.id &&
      activeLayer.featureId === nextFeatureId
    ) {
      return;
    }

    setActiveLayer((prev) => {
      if (!prev || prev.layerId !== activeLayer.layerId || !nextActiveView) return prev;
      return {
        ...prev,
        viewId: nextActiveView.id,
        featureId: nextFeatureId,
      };
    });
  }, [activeLayer, pinnedLayers]);

  const renameView = useCallback((pinnedId: string, viewId: string, name: string) => {
    const trimmedName = name.trim();
    setPinnedLayers(prev =>
      prev.map(p => {
        if (p.id !== pinnedId || !p.views) return p;

        const targetView = p.views.find(v => v.id === viewId);
        if (!targetView) return p;
        const isDendraLayer = layerMap.get(p.layerId)?.dataSource === 'dendra';
        const isAnimlLayer = layerMap.get(p.layerId)?.dataSource === 'animl';
        const isDataOneLayer = layerMap.get(p.layerId)?.dataSource === 'dataone';
        const isDroneLayer = p.layerId === 'dataset-193';

        const autoName = isDendraLayer
          ? buildDendraViewName(
              targetView.dendraFilters || {
                showActiveOnly: false,
                selectedStationId: undefined,
                selectedStationName: undefined,
                selectedDatastreamId: undefined,
                selectedDatastreamName: undefined,
                startDate: undefined,
                endDate: undefined,
                aggregation: undefined,
              }
            )
          : isAnimlLayer
          ? buildAnimlViewName(
            targetView.animlFilters || { selectedAnimals: [], selectedCameras: [], startDate: undefined, endDate: undefined }
          )
          : isDataOneLayer
          ? buildDataOneViewName(
            targetView.dataoneFilters || {
              searchText: undefined,
              tncCategory: undefined,
              startDate: undefined,
              endDate: undefined,
              author: undefined,
              selectedDatasetId: undefined,
            }
          )
          : isDroneLayer && targetView.droneView
          ? buildDroneViewName({
              id: targetView.droneView.flightId,
              projectName: targetView.droneView.projectName,
              planId: '',
              planName: targetView.droneView.planName,
              dateCaptured: new Date(targetView.droneView.capturedAt),
              lastUpdated: new Date(targetView.droneView.capturedAt),
              wmts: { link: '', itemId: '' },
              recordType: 'plan',
            })
          : buildINaturalistViewName(
            targetView.inaturalistFilters || { selectedTaxa: [], selectedSpecies: [], startDate: undefined, endDate: undefined }
          );
        const nextName = trimmedName || autoName;
        const nextIsCustom = trimmedName.length > 0;

        if (targetView.name === nextName && !!targetView.isNameCustom === nextIsCustom) {
          return p;
        }

        return {
          ...p,
          views: p.views.map(v =>
            v.id === viewId
              ? { ...v, name: nextName, isNameCustom: nextIsCustom }
              : v
          ),
        };
      })
    );
  }, [layerMap]);

  const isLayerPinned = useCallback(
    (layerId: string) => pinnedLayers.some(p => p.layerId === layerId),
    [pinnedLayers]
  );

  const isLayerVisible = useCallback(
    (layerId: string) => {
      const pinned = pinnedLayers.find(p => p.layerId === layerId);
      if (pinned) return pinned.isVisible;
      if (!activeLayer) return false;
      if (activeLayer.layerId === layerId) return true;
      return !!(activeLayer.isService && activeLayer.selectedSubLayerId === layerId);
    },
    [pinnedLayers, activeLayer]
  );

  const getPinnedByLayerId = useCallback(
    (layerId: string) => pinnedLayers.find(p => p.layerId === layerId),
    [pinnedLayers]
  );

  const undo = useCallback(() => {
    if (undoStack.length === 0) return;
    const [action, ...rest] = undoStack;
    action.undo();
    setUndoStack(rest);
  }, [undoStack]);

  // Keep active layer's isActive flag in sync with pinned layers
  const syncedPinned = pinnedLayers.map(p => ({
    ...p,
    isActive: activeLayer?.layerId === p.layerId,
  }));

  return (
    <LayerContext.Provider
      value={{
        activeLayer,
        activateLayer,
        setActiveServiceSubLayer,
        deactivateLayer,
        pinnedLayers: syncedPinned,
        pinLayer,
        unpinLayer,
        toggleVisibility,
        setLayerOpacity,
        getLayerOpacity,
        toggleChildVisibility,
        clearFilters,
        syncINaturalistFilters,
        syncAnimlFilters,
        syncDendraFilters,
        syncTNCArcGISFilters,
        syncDataOneFilters,
        createDendraFilteredView,
        createOrUpdateDataOneFilteredView,
        createOrUpdateDroneView,
        reorderLayers,
        createNewView,
        removeView,
        renameView,
        lastEditFiltersRequest,
        requestEditFilters,
        lastFiltersClearedTimestamp,
        isLayerPinned,
        isLayerVisible,
        getPinnedByLayerId,
        undoStack,
        undo,
      }}
    >
      {children}
    </LayerContext.Provider>
  );
}

export function useLayers() {
  const ctx = useContext(LayerContext);
  if (!ctx) throw new Error('useLayers must be used within LayerProvider');
  return ctx;
}
