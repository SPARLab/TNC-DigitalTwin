import { useCallback } from 'react';
import type {
  ActiveLayer,
  CatalogLayer,
  CalFloraViewFilters,
  DataOneViewFilters,
  DendraViewFilters,
  GBIFViewFilters,
  MotusViewFilters,
  PinnedLayer,
} from '../../../types';
import type { DroneImageryMetadata } from '../../../../types/droneImagery';
import {
  buildCalFloraFilterSummary,
  buildCalFloraViewName,
  buildDataOneFilterSummary,
  buildDataOneViewName,
  buildDendraFilterSummary,
  buildDendraViewName,
  buildDroneViewName,
  buildGBIFFilterSummary,
  buildGBIFViewName,
  buildMotusFilterSummary,
  buildMotusViewName,
  getCalFloraFilterCount,
  getDataOneFilterCount,
  getDendraFilterCount,
  getGBIFFilterCount,
  getMotusFilterCount,
} from '../../utils/layerFilterBuilders';
import {
  createDefaultAnimlViewFilters,
  createDefaultCalFloraViewFilters,
  createDefaultDataOneViewFilters,
  createDefaultDendraViewFilters,
  createDefaultGBIFViewFilters,
  createDefaultINaturalistViewFilters,
  createDefaultMotusViewFilters,
} from '../../utils/layerFilterDefaults';

type SetPinnedLayers = React.Dispatch<React.SetStateAction<PinnedLayer[]>>;
type SetActiveLayer = React.Dispatch<React.SetStateAction<ActiveLayer | null>>;

interface UseLayerFilteredViewActionsParams {
  activeLayer: ActiveLayer | null;
  layerMap: Map<string, CatalogLayer>;
  layerOpacityById: Record<string, number>;
  setPinnedLayers: SetPinnedLayers;
  setActiveLayer: SetActiveLayer;
}

export function useLayerFilteredViewActions({
  activeLayer,
  layerMap,
  layerOpacityById,
  setPinnedLayers,
  setActiveLayer,
}: UseLayerFilteredViewActionsParams) {
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

      setPinnedLayers((prev) => {
        const target = prev.find((p) => p.layerId === layerId);
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

        return prev.map((p) => {
          if (p.layerId !== layerId) return p;

          if (p.views && p.views.length > 0) {
            return {
              ...p,
              isVisible: true,
              views: [...p.views.map((v) => ({ ...v, isVisible: false })), newView],
            };
          }

          const existingFlatViewName = p.distinguisher || buildDendraViewName(
            p.dendraFilters || createDefaultDendraViewFilters()
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
            inaturalistFilters: createDefaultINaturalistViewFilters(),
            dendraFilters: createDefaultDendraViewFilters(),
            distinguisher: undefined,
            resultCount: undefined,
          };
        });
      });

      setActiveLayer((prev) =>
        prev && prev.layerId === layerId ? { ...prev, isPinned: true, viewId: newViewId } : prev
      );
      return newViewId;
    },
    [activeLayer, layerMap, layerOpacityById, setActiveLayer, setPinnedLayers]
  );

  const createOrUpdateDataOneFilteredView = useCallback(
    (layerId: string, filters: DataOneViewFilters, resultCount: number, targetViewId?: string) => {
      const layer = layerMap.get(layerId);
      if (!layer) return undefined;

      const normalizedFilters: DataOneViewFilters = {
        searchText: filters.searchText?.trim() || undefined,
        tncCategories: (filters.tncCategories || []).map((value) => value.trim()).filter(Boolean),
        tncCategory: filters.tncCategory?.trim() || filters.tncCategories?.[0]?.trim() || undefined,
        fileTypes: (filters.fileTypes || [])
          .map((value) => value.trim())
          .filter(Boolean) as Array<'csv' | 'tif' | 'imagery' | 'other'>,
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

      setPinnedLayers((prev) => {
        const target = prev.find((p) => p.layerId === layerId);
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

        return prev.map((p) => {
          if (p.layerId !== layerId) return p;

          if (p.views && p.views.length > 0) {
            const hasTarget = !!targetViewId && p.views.some((v) => v.id === targetViewId);
            if (hasTarget) {
              return {
                ...p,
                isVisible: true,
                views: p.views.map((v) => {
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
              views: [...p.views.map((v) => ({ ...v, isVisible: false })), newView],
            };
          }

          return {
            ...p,
            isVisible: true,
            views: [newView],
            filterCount: 0,
            filterSummary: undefined,
            inaturalistFilters: createDefaultINaturalistViewFilters(),
            animlFilters: createDefaultAnimlViewFilters(),
            dendraFilters: createDefaultDendraViewFilters(),
            dataoneFilters: createDefaultDataOneViewFilters(),
            distinguisher: undefined,
            resultCount: undefined,
          };
        });
      });

      setActiveLayer((prev) =>
        prev && prev.layerId === layerId
          ? { ...prev, isPinned: true, viewId: newViewId, featureId: normalizedFilters.selectedDatasetId }
          : prev
      );
      return newViewId;
    },
    [activeLayer, layerMap, setActiveLayer, setPinnedLayers]
  );

  const createOrUpdateCalFloraFilteredView = useCallback(
    (layerId: string, filters: CalFloraViewFilters, resultCount: number, targetViewId?: string) => {
      const layer = layerMap.get(layerId);
      if (!layer) return undefined;

      const normalizedFilters: CalFloraViewFilters = {
        searchText: filters.searchText?.trim() || undefined,
        county: filters.county?.trim() || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        hasPhoto: !!filters.hasPhoto,
        selectedObservationId: filters.selectedObservationId || undefined,
        selectedObservationLabel: filters.selectedObservationLabel?.trim() || undefined,
      };
      const nextFilterCount = getCalFloraFilterCount(normalizedFilters);
      const nextFilterSummary = buildCalFloraFilterSummary(normalizedFilters);
      const newViewName = buildCalFloraViewName(normalizedFilters);
      const newViewId = targetViewId || crypto.randomUUID();

      const newView = {
        id: newViewId,
        name: newViewName,
        isNameCustom: false,
        isVisible: true,
        filterCount: nextFilterCount,
        filterSummary: nextFilterSummary,
        calfloraFilters: normalizedFilters,
        resultCount,
      };

      setPinnedLayers((prev) => {
        const target = prev.find((p) => p.layerId === layerId);
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

        return prev.map((p) => {
          if (p.layerId !== layerId) return p;

          if (p.views && p.views.length > 0) {
            const hasTarget = !!targetViewId && p.views.some((v) => v.id === targetViewId);
            if (hasTarget) {
              return {
                ...p,
                isVisible: true,
                views: p.views.map((v) => {
                  if (v.id === targetViewId) {
                    const nextName = v.isNameCustom ? v.name : newViewName;
                    return {
                      ...v,
                      name: nextName,
                      isVisible: true,
                      filterCount: nextFilterCount,
                      filterSummary: nextFilterSummary,
                      calfloraFilters: normalizedFilters,
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
              views: [...p.views.map((v) => ({ ...v, isVisible: false })), newView],
            };
          }

          const existingFlatViewName = p.distinguisher || buildCalFloraViewName(
            p.calfloraFilters || createDefaultCalFloraViewFilters()
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
            calfloraFilters: p.calfloraFilters,
            gbifFilters: p.gbifFilters,
            resultCount: p.resultCount,
          };

          return {
            ...p,
            isVisible: true,
            views: [existingFlatView, newView],
            filterCount: 0,
            filterSummary: undefined,
            inaturalistFilters: createDefaultINaturalistViewFilters(),
            animlFilters: createDefaultAnimlViewFilters(),
            dendraFilters: createDefaultDendraViewFilters(),
            dataoneFilters: createDefaultDataOneViewFilters(),
            calfloraFilters: createDefaultCalFloraViewFilters(),
            gbifFilters: createDefaultGBIFViewFilters(),
            distinguisher: undefined,
            resultCount: undefined,
          };
        });
      });

      setActiveLayer((prev) =>
        prev && prev.layerId === layerId
          ? { ...prev, isPinned: true, viewId: newViewId, featureId: normalizedFilters.selectedObservationId }
          : prev
      );
      return newViewId;
    },
    [activeLayer, layerMap, setActiveLayer, setPinnedLayers]
  );

  const createOrUpdateGBIFFilteredView = useCallback(
    (layerId: string, filters: GBIFViewFilters, resultCount: number, targetViewId?: string) => {
      const layer = layerMap.get(layerId);
      if (!layer) return undefined;

      const normalizedFilters: GBIFViewFilters = {
        searchText: filters.searchText?.trim() || undefined,
        kingdom: filters.kingdom?.trim() || undefined,
        taxonomicClass: filters.taxonomicClass?.trim() || undefined,
        family: filters.family?.trim() || undefined,
        basisOfRecord: filters.basisOfRecord?.trim() || undefined,
        datasetName: filters.datasetName?.trim() || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        selectedOccurrenceId: filters.selectedOccurrenceId || undefined,
        selectedOccurrenceLabel: filters.selectedOccurrenceLabel?.trim() || undefined,
      };
      const nextFilterCount = getGBIFFilterCount(normalizedFilters);
      const nextFilterSummary = buildGBIFFilterSummary(normalizedFilters);
      const newViewName = buildGBIFViewName(normalizedFilters);
      const newViewId = targetViewId || crypto.randomUUID();

      const newView = {
        id: newViewId,
        name: newViewName,
        isNameCustom: false,
        isVisible: true,
        filterCount: nextFilterCount,
        filterSummary: nextFilterSummary,
        gbifFilters: normalizedFilters,
        resultCount,
      };

      setPinnedLayers((prev) => {
        const target = prev.find((p) => p.layerId === layerId);
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

        return prev.map((p) => {
          if (p.layerId !== layerId) return p;

          if (p.views && p.views.length > 0) {
            const hasTarget = !!targetViewId && p.views.some((v) => v.id === targetViewId);
            if (hasTarget) {
              return {
                ...p,
                isVisible: true,
                views: p.views.map((v) => {
                  if (v.id === targetViewId) {
                    const nextName = v.isNameCustom ? v.name : newViewName;
                    return {
                      ...v,
                      name: nextName,
                      isVisible: true,
                      filterCount: nextFilterCount,
                      filterSummary: nextFilterSummary,
                      gbifFilters: normalizedFilters,
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
              views: [...p.views.map((v) => ({ ...v, isVisible: false })), newView],
            };
          }

          const existingFlatViewName = p.distinguisher || buildGBIFViewName(
            p.gbifFilters || createDefaultGBIFViewFilters()
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
            calfloraFilters: p.calfloraFilters,
            gbifFilters: p.gbifFilters,
            resultCount: p.resultCount,
          };

          return {
            ...p,
            isVisible: true,
            views: [existingFlatView, newView],
            filterCount: 0,
            filterSummary: undefined,
            inaturalistFilters: createDefaultINaturalistViewFilters(),
            animlFilters: createDefaultAnimlViewFilters(),
            dendraFilters: createDefaultDendraViewFilters(),
            dataoneFilters: createDefaultDataOneViewFilters(),
            calfloraFilters: createDefaultCalFloraViewFilters(),
            gbifFilters: createDefaultGBIFViewFilters(),
            distinguisher: undefined,
            resultCount: undefined,
          };
        });
      });

      setActiveLayer((prev) =>
        prev && prev.layerId === layerId
          ? { ...prev, isPinned: true, viewId: newViewId, featureId: normalizedFilters.selectedOccurrenceId }
          : prev
      );
      return newViewId;
    },
    [activeLayer, layerMap, setActiveLayer, setPinnedLayers]
  );

  const createOrUpdateMotusFilteredView = useCallback(
    (layerId: string, filters: MotusViewFilters, resultCount: number, targetViewId?: string) => {
      const layer = layerMap.get(layerId);
      if (!layer) return undefined;

      const normalizedFilters: MotusViewFilters = {
        selectedSpecies: filters.selectedSpecies?.trim() || undefined,
        selectedTagId: filters.selectedTagId,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        minHitCount:
          typeof filters.minHitCount === 'number' ? Math.max(0, Math.floor(filters.minHitCount)) : undefined,
        minMotusFilter: typeof filters.minMotusFilter === 'number' ? filters.minMotusFilter : undefined,
      };
      const nextFilterCount = getMotusFilterCount(normalizedFilters);
      const nextFilterSummary = buildMotusFilterSummary(normalizedFilters);
      const newViewName = buildMotusViewName(normalizedFilters);
      const newViewId = targetViewId || crypto.randomUUID();

      const newView = {
        id: newViewId,
        name: newViewName,
        isNameCustom: false,
        isVisible: true,
        filterCount: nextFilterCount,
        filterSummary: nextFilterSummary,
        motusFilters: normalizedFilters,
        resultCount,
      };

      setPinnedLayers((prev) => {
        const target = prev.find((p) => p.layerId === layerId);
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

        return prev.map((p) => {
          if (p.layerId !== layerId) return p;

          if (p.views && p.views.length > 0) {
            const hasTarget = !!targetViewId && p.views.some((v) => v.id === targetViewId);
            if (hasTarget) {
              return {
                ...p,
                isVisible: true,
                views: p.views.map((v) => {
                  if (v.id === targetViewId) {
                    const nextName = v.isNameCustom ? v.name : newViewName;
                    return {
                      ...v,
                      name: nextName,
                      isVisible: true,
                      filterCount: nextFilterCount,
                      filterSummary: nextFilterSummary,
                      motusFilters: normalizedFilters,
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
              views: [...p.views.map((v) => ({ ...v, isVisible: false })), newView],
            };
          }

          const existingFlatViewName = p.distinguisher || buildMotusViewName(
            p.motusFilters || createDefaultMotusViewFilters()
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
            calfloraFilters: p.calfloraFilters,
            gbifFilters: p.gbifFilters,
            motusFilters: p.motusFilters,
            resultCount: p.resultCount,
          };

          return {
            ...p,
            isVisible: true,
            views: [existingFlatView, newView],
            filterCount: 0,
            filterSummary: undefined,
            inaturalistFilters: createDefaultINaturalistViewFilters(),
            animlFilters: createDefaultAnimlViewFilters(),
            dendraFilters: createDefaultDendraViewFilters(),
            dataoneFilters: createDefaultDataOneViewFilters(),
            calfloraFilters: createDefaultCalFloraViewFilters(),
            gbifFilters: createDefaultGBIFViewFilters(),
            motusFilters: createDefaultMotusViewFilters(),
            distinguisher: undefined,
            resultCount: undefined,
          };
        });
      });

      setActiveLayer((prev) =>
        prev && prev.layerId === layerId
          ? { ...prev, isPinned: true, viewId: newViewId, featureId: normalizedFilters.selectedTagId }
          : prev
      );
      return newViewId;
    },
    [activeLayer, layerMap, setActiveLayer, setPinnedLayers]
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

          const existingByFlight = p.views?.find((view) => view.droneView?.flightId === flight.id);
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
            inaturalistFilters: createDefaultINaturalistViewFilters(),
            animlFilters: createDefaultAnimlViewFilters(),
            dendraFilters: undefined,
            dataoneFilters: undefined,
            calfloraFilters: undefined,
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
    [activeLayer, layerMap, setActiveLayer, setPinnedLayers]
  );

  return {
    createDendraFilteredView,
    createOrUpdateDataOneFilteredView,
    createOrUpdateCalFloraFilteredView,
    createOrUpdateGBIFFilteredView,
    createOrUpdateMotusFilteredView,
    createOrUpdateDroneView,
  };
}
