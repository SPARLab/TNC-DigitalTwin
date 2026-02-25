import { useCallback } from 'react';
import type {
  AnimlViewFilters,
  CalFloraViewFilters,
  DataOneViewFilters,
  DendraViewFilters,
  GBIFViewFilters,
  INaturalistViewFilters,
  MotusViewFilters,
  PinnedLayer,
  TNCArcGISViewFilters,
} from '../../../types';
import {
  buildAnimlFilterSummary,
  buildAnimlViewName,
  buildCalFloraFilterSummary,
  buildCalFloraViewName,
  buildDataOneFilterSummary,
  buildDataOneViewName,
  buildDendraFilterSummary,
  buildDendraViewName,
  buildGBIFFilterSummary,
  buildGBIFViewName,
  buildINaturalistFilterSummary,
  buildINaturalistViewName,
  buildMotusFilterSummary,
  buildMotusViewName,
  buildTNCArcGISFilterSummary,
  getAnimlFilterCount,
  getCalFloraFilterCount,
  getDataOneFilterCount,
  getDendraFilterCount,
  getGBIFFilterCount,
  getINaturalistFilterCount,
  getMotusFilterCount,
  getTNCArcGISFilterCount,
} from '../../utils/layerFilterBuilders';
import {
  animlFiltersEqual,
  calFloraFiltersEqual,
  dataOneFiltersEqual,
  dendraFiltersEqual,
  filtersEqual,
  gbifFiltersEqual,
  motusFiltersEqual,
  tncArcgisFiltersEqual,
} from '../../utils/layerFilterEquality';

type SetPinnedLayers = React.Dispatch<React.SetStateAction<PinnedLayer[]>>;

function commitIfChanged(prev: PinnedLayer[], next: PinnedLayer[]): PinnedLayer[] {
  const changed = next.some((layer, index) => layer !== prev[index]);
  return changed ? next : prev;
}

export function useLayerSourceSyncActions(setPinnedLayers: SetPinnedLayers) {
  const syncINaturalistFilters = useCallback(
    (layerId: string, filters: INaturalistViewFilters, resultCount: number, viewId?: string) => {
      setPinnedLayers((prev) => {
        const nextLayers = prev.map((p) => {
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
            const targetView = p.views.find((v) => v.id === viewId);
            const nextViewName = targetView?.isNameCustom
              ? targetView.name
              : buildINaturalistViewName(normalizedFilters);

            if (
              targetView &&
              targetView.name === nextViewName &&
              targetView.filterCount === nextFilterCount &&
              targetView.filterSummary === nextFilterSummary &&
              targetView.resultCount === resultCount &&
              filtersEqual(targetView.inaturalistFilters, normalizedFilters)
            ) {
              return p;
            }

            return {
              ...p,
              views: p.views.map((v) =>
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

          if (
            p.filterCount === nextFilterCount &&
            p.filterSummary === nextFilterSummary &&
            p.resultCount === resultCount &&
            filtersEqual(p.inaturalistFilters, normalizedFilters)
          ) {
            return p;
          }

          return {
            ...p,
            filterCount: nextFilterCount,
            filterSummary: nextFilterSummary,
            inaturalistFilters: normalizedFilters,
            resultCount,
          };
        });

        return commitIfChanged(prev, nextLayers);
      });
    },
    [setPinnedLayers]
  );

  const syncAnimlFilters = useCallback(
    (layerId: string, filters: AnimlViewFilters, resultCount: number, viewId?: string) => {
      setPinnedLayers((prev) => {
        const nextLayers = prev.map((p) => {
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
            const targetView = p.views.find((v) => v.id === viewId);
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
            ) {
              return p;
            }

            return {
              ...p,
              views: p.views.map((v) =>
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
          ) {
            return p;
          }

          return {
            ...p,
            filterCount: nextFilterCount,
            filterSummary: nextFilterSummary,
            animlFilters: normalizedFilters,
            resultCount,
          };
        });

        return commitIfChanged(prev, nextLayers);
      });
    },
    [setPinnedLayers]
  );

  const syncDendraFilters = useCallback(
    (layerId: string, filters: DendraViewFilters, resultCount: number, viewId?: string) => {
      setPinnedLayers((prev) => {
        const nextLayers = prev.map((p) => {
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
            const targetView = p.views.find((v) => v.id === viewId);
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
            ) {
              return p;
            }

            return {
              ...p,
              views: p.views.map((v) =>
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
          ) {
            return p;
          }

          return {
            ...p,
            filterCount: nextFilterCount,
            filterSummary: nextFilterSummary,
            dendraFilters: normalizedFilters,
            resultCount,
          };
        });

        return commitIfChanged(prev, nextLayers);
      });
    },
    [setPinnedLayers]
  );

  const syncTNCArcGISFilters = useCallback(
    (layerId: string, filters: TNCArcGISViewFilters, resultCount?: number, viewId?: string) => {
      setPinnedLayers((prev) => {
        const nextLayers = prev.map((p) => {
          if (p.layerId !== layerId) return p;

          const normalizedFilters: TNCArcGISViewFilters = {
            whereClause: filters.whereClause.trim() || '1=1',
            fields: (filters.fields ?? []).map((filter) => ({
              field: filter.field,
              operator: filter.operator,
              value: filter.value,
            })),
          };
          const nextFilterCount = getTNCArcGISFilterCount(normalizedFilters);
          const nextFilterSummary = buildTNCArcGISFilterSummary(normalizedFilters);

          if (viewId && p.views) {
            const targetView = p.views.find((v) => v.id === viewId);
            if (
              targetView &&
              targetView.filterCount === nextFilterCount &&
              targetView.filterSummary === nextFilterSummary &&
              targetView.resultCount === resultCount &&
              tncArcgisFiltersEqual(targetView.tncArcgisFilters, normalizedFilters)
            ) {
              return p;
            }

            return {
              ...p,
              views: p.views.map((v) =>
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
          ) {
            return p;
          }

          return {
            ...p,
            filterCount: nextFilterCount,
            filterSummary: nextFilterSummary,
            tncArcgisFilters: normalizedFilters,
            resultCount,
          };
        });

        return commitIfChanged(prev, nextLayers);
      });
    },
    [setPinnedLayers]
  );

  const syncDataOneFilters = useCallback(
    (layerId: string, filters: DataOneViewFilters, resultCount: number, viewId?: string) => {
      setPinnedLayers((prev) => {
        const nextLayers = prev.map((p) => {
          if (p.layerId !== layerId) return p;

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

          if (viewId && p.views) {
            const targetView = p.views.find((v) => v.id === viewId);
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
            ) {
              return p;
            }

            return {
              ...p,
              views: p.views.map((v) =>
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
          ) {
            return p;
          }

          return {
            ...p,
            filterCount: nextFilterCount,
            filterSummary: nextFilterSummary,
            dataoneFilters: normalizedFilters,
            resultCount,
          };
        });

        return commitIfChanged(prev, nextLayers);
      });
    },
    [setPinnedLayers]
  );

  const syncCalFloraFilters = useCallback(
    (layerId: string, filters: CalFloraViewFilters, resultCount: number, viewId?: string) => {
      setPinnedLayers((prev) => {
        const nextLayers = prev.map((p) => {
          if (p.layerId !== layerId) return p;

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

          if (viewId && p.views) {
            const targetView = p.views.find((v) => v.id === viewId);
            const nextViewName = targetView?.isNameCustom
              ? targetView.name
              : buildCalFloraViewName(normalizedFilters);

            if (
              targetView &&
              targetView.name === nextViewName &&
              targetView.filterCount === nextFilterCount &&
              targetView.filterSummary === nextFilterSummary &&
              targetView.resultCount === resultCount &&
              calFloraFiltersEqual(targetView.calfloraFilters, normalizedFilters)
            ) {
              return p;
            }

            return {
              ...p,
              views: p.views.map((v) =>
                v.id === viewId
                  ? {
                      ...v,
                      name: nextViewName,
                      filterCount: nextFilterCount,
                      filterSummary: nextFilterSummary,
                      calfloraFilters: normalizedFilters,
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
            calFloraFiltersEqual(p.calfloraFilters, normalizedFilters)
          ) {
            return p;
          }

          return {
            ...p,
            filterCount: nextFilterCount,
            filterSummary: nextFilterSummary,
            calfloraFilters: normalizedFilters,
            resultCount,
          };
        });

        return commitIfChanged(prev, nextLayers);
      });
    },
    [setPinnedLayers]
  );

  const syncGBIFFilters = useCallback(
    (layerId: string, filters: GBIFViewFilters, resultCount: number, viewId?: string) => {
      setPinnedLayers((prev) => {
        const nextLayers = prev.map((p) => {
          if (p.layerId !== layerId) return p;

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

          if (viewId && p.views) {
            const targetView = p.views.find((v) => v.id === viewId);
            const nextViewName = targetView?.isNameCustom
              ? targetView.name
              : buildGBIFViewName(normalizedFilters);

            if (
              targetView &&
              targetView.name === nextViewName &&
              targetView.filterCount === nextFilterCount &&
              targetView.filterSummary === nextFilterSummary &&
              targetView.resultCount === resultCount &&
              gbifFiltersEqual(targetView.gbifFilters, normalizedFilters)
            ) {
              return p;
            }

            return {
              ...p,
              views: p.views.map((v) =>
                v.id === viewId
                  ? {
                      ...v,
                      name: nextViewName,
                      filterCount: nextFilterCount,
                      filterSummary: nextFilterSummary,
                      gbifFilters: normalizedFilters,
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
            gbifFiltersEqual(p.gbifFilters, normalizedFilters)
          ) {
            return p;
          }

          return {
            ...p,
            filterCount: nextFilterCount,
            filterSummary: nextFilterSummary,
            gbifFilters: normalizedFilters,
            resultCount,
          };
        });

        return commitIfChanged(prev, nextLayers);
      });
    },
    [setPinnedLayers]
  );

  const syncMotusFilters = useCallback(
    (layerId: string, filters: MotusViewFilters, resultCount: number, viewId?: string) => {
      setPinnedLayers((prev) => {
        const nextLayers = prev.map((p) => {
          if (p.layerId !== layerId) return p;

          const normalizedFilters: MotusViewFilters = {
            selectedSpecies: filters.selectedSpecies?.trim() || undefined,
            selectedTagId: filters.selectedTagId,
            startDate: filters.startDate || undefined,
            endDate: filters.endDate || undefined,
            minHitCount:
              typeof filters.minHitCount === 'number'
                ? Math.max(0, Math.floor(filters.minHitCount))
                : undefined,
            minMotusFilter:
              typeof filters.minMotusFilter === 'number' ? filters.minMotusFilter : undefined,
          };
          const nextFilterCount = getMotusFilterCount(normalizedFilters);
          const nextFilterSummary = buildMotusFilterSummary(normalizedFilters);

          if (viewId && p.views) {
            const targetView = p.views.find((v) => v.id === viewId);
            const nextViewName = targetView?.isNameCustom
              ? targetView.name
              : buildMotusViewName(normalizedFilters);

            if (
              targetView &&
              targetView.name === nextViewName &&
              targetView.filterCount === nextFilterCount &&
              targetView.filterSummary === nextFilterSummary &&
              targetView.resultCount === resultCount &&
              motusFiltersEqual(targetView.motusFilters, normalizedFilters)
            ) {
              return p;
            }

            return {
              ...p,
              views: p.views.map((v) =>
                v.id === viewId
                  ? {
                      ...v,
                      name: nextViewName,
                      filterCount: nextFilterCount,
                      filterSummary: nextFilterSummary,
                      motusFilters: normalizedFilters,
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
            motusFiltersEqual(p.motusFilters, normalizedFilters)
          ) {
            return p;
          }

          return {
            ...p,
            filterCount: nextFilterCount,
            filterSummary: nextFilterSummary,
            motusFilters: normalizedFilters,
            resultCount,
          };
        });

        return commitIfChanged(prev, nextLayers);
      });
    },
    [setPinnedLayers]
  );

  return {
    syncINaturalistFilters,
    syncAnimlFilters,
    syncDendraFilters,
    syncTNCArcGISFilters,
    syncDataOneFilters,
    syncCalFloraFilters,
    syncGBIFFilters,
    syncMotusFilters,
  };
}
