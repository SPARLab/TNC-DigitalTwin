import { useCallback } from 'react';
import type { CatalogLayer, PinnedLayer } from '../../../types';
import type { DroneImageryMetadata } from '../../../../types/droneImagery';
import {
  buildAnimlViewName,
  buildCalFloraViewName,
  buildDataOneViewName,
  buildDendraViewName,
  buildDroneViewName,
  buildGBIFViewName,
  buildINaturalistViewName,
  buildMotusViewName,
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

const DRONE_LAYER_ID = 'dataset-193';

type SetPinnedLayers = React.Dispatch<React.SetStateAction<PinnedLayer[]>>;

interface UseLayerViewLifecycleActionsParams {
  layerMap: Map<string, CatalogLayer>;
  setPinnedLayers: SetPinnedLayers;
  activateLayer: (layerId: string, viewId?: string) => void;
  requestEditFilters: () => void;
}

export function useLayerViewLifecycleActions({
  layerMap,
  setPinnedLayers,
  activateLayer,
  requestEditFilters,
}: UseLayerViewLifecycleActionsParams) {
  const reorderLayers = useCallback((fromIndex: number, toIndex: number) => {
    setPinnedLayers((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next.map((p, i) => ({ ...p, order: i }));
    });
  }, [setPinnedLayers]);

  const createNewView = useCallback((pinnedId: string) => {
    const nextActiveViewRef: { current: { layerId: string; viewId: string } | null } = { current: null };

    setPinnedLayers((prev) =>
      prev.map((p) => {
        if (p.id !== pinnedId) return p;
        const isDendraLayer = layerMap.get(p.layerId)?.dataSource === 'dendra';
        const isAnimlLayer = layerMap.get(p.layerId)?.dataSource === 'animl';
        const isDataOneLayer = layerMap.get(p.layerId)?.dataSource === 'dataone';
        const isCalFloraLayer = layerMap.get(p.layerId)?.dataSource === 'calflora';
        const isGBIFLayer = layerMap.get(p.layerId)?.dataSource === 'gbif';
        const isMotusLayer = layerMap.get(p.layerId)?.dataSource === 'motus';
        const isDroneLayer = p.layerId === DRONE_LAYER_ID;
        if (isDroneLayer) return p;

        if (p.views && p.views.length > 0) {
          const newViewId = crypto.randomUUID();
          const newView = {
            id: newViewId,
            name: 'Add Filters',
            isNameCustom: false,
            isVisible: false,
            filterCount: 0,
            inaturalistFilters: createDefaultINaturalistViewFilters(),
            animlFilters: createDefaultAnimlViewFilters(),
            dendraFilters: isDendraLayer ? createDefaultDendraViewFilters() : undefined,
            dataoneFilters: isDataOneLayer ? createDefaultDataOneViewFilters() : undefined,
            calfloraFilters: isCalFloraLayer ? createDefaultCalFloraViewFilters() : undefined,
            gbifFilters: isGBIFLayer ? createDefaultGBIFViewFilters() : undefined,
            motusFilters: isMotusLayer ? createDefaultMotusViewFilters() : undefined,
            droneView: undefined,
          };
          nextActiveViewRef.current = { layerId: p.layerId, viewId: newViewId };
          return { ...p, views: [...p.views, newView] };
        }

        const view1Name = p.distinguisher || (
          isDendraLayer
            ? buildDendraViewName(
                p.dendraFilters || createDefaultDendraViewFilters()
              )
            : isAnimlLayer
            ? buildAnimlViewName(
              p.animlFilters || createDefaultAnimlViewFilters()
            )
            : isDataOneLayer
            ? buildDataOneViewName(
              p.dataoneFilters || createDefaultDataOneViewFilters()
            )
            : isCalFloraLayer
            ? buildCalFloraViewName(
              p.calfloraFilters || createDefaultCalFloraViewFilters()
            )
            : isGBIFLayer
            ? buildGBIFViewName(
              p.gbifFilters || createDefaultGBIFViewFilters()
            )
            : isMotusLayer
            ? buildMotusViewName(
              p.motusFilters || createDefaultMotusViewFilters()
            )
            : buildINaturalistViewName(
              p.inaturalistFilters || createDefaultINaturalistViewFilters()
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
          calfloraFilters: p.calfloraFilters,
          gbifFilters: p.gbifFilters,
          motusFilters: p.motusFilters,
          droneView: p.droneView,
          resultCount: p.resultCount,
        };
        const view2 = {
          id: crypto.randomUUID(),
          name: 'Add Filters',
          isNameCustom: false,
          isVisible: false,
          filterCount: 0,
          inaturalistFilters: createDefaultINaturalistViewFilters(),
          animlFilters: createDefaultAnimlViewFilters(),
          dendraFilters: isDendraLayer ? createDefaultDendraViewFilters() : undefined,
          dataoneFilters: isDataOneLayer ? createDefaultDataOneViewFilters() : undefined,
          calfloraFilters: isCalFloraLayer ? createDefaultCalFloraViewFilters() : undefined,
          gbifFilters: isGBIFLayer ? createDefaultGBIFViewFilters() : undefined,
          motusFilters: isMotusLayer ? createDefaultMotusViewFilters() : undefined,
          droneView: undefined,
        };
        nextActiveViewRef.current = { layerId: p.layerId, viewId: view2.id };

        return {
          ...p,
          views: [view1, view2],
          filterCount: 0,
          filterSummary: undefined,
          inaturalistFilters: createDefaultINaturalistViewFilters(),
          animlFilters: createDefaultAnimlViewFilters(),
          dendraFilters: isDendraLayer ? createDefaultDendraViewFilters() : undefined,
          dataoneFilters: isDataOneLayer ? createDefaultDataOneViewFilters() : undefined,
          calfloraFilters: isCalFloraLayer ? createDefaultCalFloraViewFilters() : undefined,
          gbifFilters: isGBIFLayer ? createDefaultGBIFViewFilters() : undefined,
          motusFilters: isMotusLayer ? createDefaultMotusViewFilters() : undefined,
          droneView: undefined,
          distinguisher: undefined,
          resultCount: undefined,
        };
      })
    );

    if (nextActiveViewRef.current) {
      activateLayer(nextActiveViewRef.current.layerId, nextActiveViewRef.current.viewId);
      requestEditFilters();
    }
  }, [layerMap, setPinnedLayers, activateLayer, requestEditFilters]);

  const removeView = useCallback((pinnedId: string, viewId: string) => {
    setPinnedLayers((prev) =>
      prev.map((p) => {
        if (p.id !== pinnedId || !p.views) return p;

        const remainingViews = p.views.filter((v) => v.id !== viewId);
        if (p.layerId === DRONE_LAYER_ID) {
          return {
            ...p,
            views: remainingViews,
            isVisible: remainingViews.some((view) => view.isVisible),
          };
        }

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
            calfloraFilters: lastView.calfloraFilters,
            gbifFilters: lastView.gbifFilters,
            motusFilters: lastView.motusFilters,
            droneView: lastView.droneView,
            distinguisher: lastView.isNameCustom ? lastView.name : undefined,
            resultCount: lastView.resultCount,
          };
        }

        return { ...p, views: remainingViews };
      })
    );
  }, [setPinnedLayers]);

  const renameView = useCallback((pinnedId: string, viewId: string, name: string) => {
    const trimmedName = name.trim();
    setPinnedLayers((prev) =>
      prev.map((p) => {
        if (p.id !== pinnedId || !p.views) return p;

        const targetView = p.views.find((v) => v.id === viewId);
        if (!targetView) return p;
        const isDendraLayer = layerMap.get(p.layerId)?.dataSource === 'dendra';
        const isAnimlLayer = layerMap.get(p.layerId)?.dataSource === 'animl';
        const isDataOneLayer = layerMap.get(p.layerId)?.dataSource === 'dataone';
        const isCalFloraLayer = layerMap.get(p.layerId)?.dataSource === 'calflora';
        const isGBIFLayer = layerMap.get(p.layerId)?.dataSource === 'gbif';
        const isMotusLayer = layerMap.get(p.layerId)?.dataSource === 'motus';
        const isDroneLayer = p.layerId === DRONE_LAYER_ID;

        const autoName = isDendraLayer
          ? buildDendraViewName(
              targetView.dendraFilters || createDefaultDendraViewFilters()
            )
          : isAnimlLayer
          ? buildAnimlViewName(
            targetView.animlFilters || createDefaultAnimlViewFilters()
          )
          : isDataOneLayer
          ? buildDataOneViewName(
            targetView.dataoneFilters || createDefaultDataOneViewFilters()
          )
          : isCalFloraLayer
          ? buildCalFloraViewName(
            targetView.calfloraFilters || createDefaultCalFloraViewFilters()
          )
          : isGBIFLayer
          ? buildGBIFViewName(
            targetView.gbifFilters || createDefaultGBIFViewFilters()
          )
          : isMotusLayer
          ? buildMotusViewName(
            targetView.motusFilters || createDefaultMotusViewFilters()
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
            } as DroneImageryMetadata)
          : buildINaturalistViewName(
            targetView.inaturalistFilters || createDefaultINaturalistViewFilters()
          );
        const nextName = trimmedName || autoName;
        const nextIsCustom = trimmedName.length > 0;

        if (targetView.name === nextName && !!targetView.isNameCustom === nextIsCustom) {
          return p;
        }

        return {
          ...p,
          views: p.views.map((v) =>
            v.id === viewId
              ? { ...v, name: nextName, isNameCustom: nextIsCustom }
              : v
          ),
        };
      })
    );
  }, [layerMap, setPinnedLayers]);

  return { reorderLayers, createNewView, removeView, renameView };
}
