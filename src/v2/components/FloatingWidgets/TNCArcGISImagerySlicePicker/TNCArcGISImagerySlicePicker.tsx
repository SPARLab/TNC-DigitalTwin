// ============================================================================
// TNCArcGISImagerySlicePicker — variable + time controls for multidimensional
// ImageServer layers (e.g. Living Atlas CHELSA climate projections).
// ============================================================================

import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCatalog } from '../../../context/CatalogContext';
import { useLayers } from '../../../context/LayerContext';
import { useTNCArcGIS } from '../../../context/TNCArcGISContext';
import {
  fetchImageServerMultidimensionalInfo,
  type ImageServerMultidimensionalInfo,
  type ImageServerVariable,
} from '../../../services/tncArcgisService';
import type { CatalogLayer, ImagerySliceSelection } from '../../../types';
import { formatImageryDimensionLabel, sliceSelectionFromFilters } from '../../../utils/imagerySliceUtils';

function getTargetLayer(
  activeCatalogLayer: CatalogLayer | undefined,
  selectedSubLayerId: string | undefined,
): CatalogLayer | null {
  if (!activeCatalogLayer) return null;
  const isServiceParent = !!(
    activeCatalogLayer.catalogMeta?.isMultiLayerService
    && !activeCatalogLayer.catalogMeta?.parentServiceId
    && activeCatalogLayer.catalogMeta?.siblingLayers
    && activeCatalogLayer.catalogMeta.siblingLayers.length > 0
  );
  if (!isServiceParent) return activeCatalogLayer;
  const siblings = activeCatalogLayer.catalogMeta?.siblingLayers ?? [];
  return siblings.find((layer) => layer.id === selectedSubLayerId) ?? siblings[0] ?? null;
}

function pickDefaultDimension(variable: ImageServerVariable): { name: string; values: number[] } | null {
  const preferred = variable.dimensions.find((dimension) => dimension.name === 'StdTime')
    ?? variable.dimensions[0];
  if (!preferred || preferred.values.length === 0) return null;
  return preferred;
}

function selectionWithStats(
  layerId: string,
  variable: ImageServerVariable,
  dimensionName: string,
  dimensionValue: number,
): ImagerySliceSelection {
  return {
    layerId,
    variableName: variable.name,
    dimensionName,
    dimensionValue,
    min: variable.min,
    max: variable.max,
  };
}

function selectionsEqual(a: ImagerySliceSelection | null, b: ImagerySliceSelection | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return a.layerId === b.layerId
    && a.variableName === b.variableName
    && a.dimensionName === b.dimensionName
    && a.dimensionValue === b.dimensionValue
    && a.min === b.min
    && a.max === b.max;
}

export function TNCArcGISImagerySlicePicker() {
  const { activeLayer, getPinnedByLayerId, isLayerPinned, pinLayer, syncTNCArcGISFilters } = useLayers();
  const { layerMap } = useCatalog();
  const { imagerySliceSelection, setImagerySliceSelection } = useTNCArcGIS();
  const [multidimensionalInfo, setMultidimensionalInfo] = useState<ImageServerMultidimensionalInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const initializedLayerIdRef = useRef<string | null>(null);

  const activeCatalogLayer = activeLayer ? layerMap.get(activeLayer.layerId) : undefined;
  const targetLayer = useMemo(
    () => getTargetLayer(activeCatalogLayer, activeLayer?.selectedSubLayerId),
    [activeCatalogLayer, activeLayer?.selectedSubLayerId],
  );
  const isImageServer = !!targetLayer?.catalogMeta?.hasImageServer
    && !targetLayer.catalogMeta.hasFeatureServer
    && !targetLayer.catalogMeta.hasMapServer;

  useEffect(() => {
    let cancelled = false;
    async function loadMultidimensionalInfo() {
      if (!targetLayer?.catalogMeta || !isImageServer) {
        setMultidimensionalInfo(null);
        initializedLayerIdRef.current = null;
        return;
      }
      setLoading(true);
      try {
        const info = await fetchImageServerMultidimensionalInfo(targetLayer.catalogMeta);
        if (cancelled) return;
        setMultidimensionalInfo(info);
      } catch {
        if (!cancelled) setMultidimensionalInfo(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadMultidimensionalInfo();
    return () => { cancelled = true; };
  }, [targetLayer?.id, isImageServer]);

  // Initialize selection once per layer from pinned filters or defaults.
  // Do not write back to pinnedLayers here — that caused update-depth loops.
  useEffect(() => {
    if (!targetLayer || !isImageServer) {
      initializedLayerIdRef.current = null;
      setImagerySliceSelection((prev) => (prev ? null : prev));
      return;
    }
    if (!multidimensionalInfo || multidimensionalInfo.variables.length === 0) {
      if (initializedLayerIdRef.current !== targetLayer.id) {
        initializedLayerIdRef.current = null;
      }
      return;
    }
    if (initializedLayerIdRef.current === targetLayer.id) return;

    const pinned = getPinnedByLayerId(targetLayer.id);
    const fromPinned = sliceSelectionFromFilters(targetLayer.id, pinned?.tncArcgisFilters);
    const variable = (
      fromPinned
        ? multidimensionalInfo.variables.find((entry) => entry.name === fromPinned.variableName)
        : null
    ) ?? multidimensionalInfo.variables[0];
    const dimension = (
      fromPinned
        ? variable.dimensions.find((entry) => entry.name === fromPinned.dimensionName)
        : null
    ) ?? pickDefaultDimension(variable);
    if (!dimension) return;

    const dimensionValue = fromPinned && dimension.values.includes(fromPinned.dimensionValue)
      ? fromPinned.dimensionValue
      : dimension.values[0];
    const next = selectionWithStats(targetLayer.id, variable, dimension.name, dimensionValue);
    initializedLayerIdRef.current = targetLayer.id;
    setImagerySliceSelection((prev) => (selectionsEqual(prev, next) ? prev : next));
  }, [
    targetLayer,
    isImageServer,
    multidimensionalInfo,
    getPinnedByLayerId,
    setImagerySliceSelection,
  ]);

  const activeVariable = useMemo(() => {
    if (!multidimensionalInfo || !imagerySliceSelection) return null;
    return multidimensionalInfo.variables.find((variable) => variable.name === imagerySliceSelection.variableName)
      ?? multidimensionalInfo.variables[0]
      ?? null;
  }, [multidimensionalInfo, imagerySliceSelection]);

  const activeDimension = useMemo(() => {
    if (!activeVariable || !imagerySliceSelection) return null;
    return activeVariable.dimensions.find((dimension) => dimension.name === imagerySliceSelection.dimensionName)
      ?? pickDefaultDimension(activeVariable);
  }, [activeVariable, imagerySliceSelection]);

  const currentIndex = activeDimension && imagerySliceSelection
    ? activeDimension.values.indexOf(imagerySliceSelection.dimensionValue)
    : -1;

  const commitSelection = (next: ImagerySliceSelection) => {
    if (!targetLayer) return;
    setImagerySliceSelection(next);

    const existing = getPinnedByLayerId(targetLayer.id);
    const existingFilters = existing?.tncArcgisFilters;
    if (!isLayerPinned(targetLayer.id)) {
      pinLayer(targetLayer.id);
    }

    // Defer filter sync until after pinLayer state commits to avoid dropped updates.
    queueMicrotask(() => {
      syncTNCArcGISFilters(targetLayer.id, {
        whereClause: existingFilters?.whereClause ?? '1=1',
        fields: existingFilters?.fields ?? [],
        imageryVariable: next.variableName,
        imageryDimensionName: next.dimensionName,
        imageryDimensionValue: next.dimensionValue,
      }, existing?.resultCount);
    });
  };

  if (!activeLayer || activeLayer.dataSource !== 'tnc-arcgis' || !targetLayer || !isImageServer) {
    return null;
  }
  if (loading || !multidimensionalInfo || !activeVariable || !activeDimension || !imagerySliceSelection) {
    return null;
  }
  if (activeDimension.values.length <= 1 && multidimensionalInfo.variables.length <= 1) {
    return null;
  }

  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < activeDimension.values.length - 1;
  const dimensionLabel = activeDimension.description?.trim() || activeDimension.name;

  return (
    <div
      id="tnc-arcgis-imagery-slice-picker"
      className="pointer-events-none absolute inset-x-0 bottom-24 z-[35] flex justify-center px-4"
    >
      <div
        id="tnc-arcgis-imagery-slice-picker-panel"
        className="pointer-events-auto flex max-w-[min(40rem,92vw)] flex-wrap items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white/95 px-3 py-2 shadow-lg backdrop-blur-sm"
      >
        {multidimensionalInfo.variables.length > 1 && (
          <label id="tnc-arcgis-imagery-slice-variable-label" className="flex items-center gap-1.5 text-xs text-gray-600">
            <span className="font-medium text-gray-700">Scenario</span>
            <select
              id="tnc-arcgis-imagery-slice-variable-select"
              value={activeVariable.name}
              onChange={(event) => {
                const nextVariable = multidimensionalInfo.variables.find(
                  (variable) => variable.name === event.target.value,
                );
                if (!nextVariable) return;
                const nextDimension = pickDefaultDimension(nextVariable);
                if (!nextDimension) return;
                const preferredValue = nextDimension.values.includes(imagerySliceSelection.dimensionValue)
                  ? imagerySliceSelection.dimensionValue
                  : nextDimension.values[0];
                commitSelection(
                  selectionWithStats(targetLayer.id, nextVariable, nextDimension.name, preferredValue),
                );
              }}
              className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-800"
            >
              {multidimensionalInfo.variables.map((variable) => (
                <option key={variable.name} value={variable.name}>
                  {variable.description?.trim() || variable.name}
                </option>
              ))}
            </select>
          </label>
        )}

        <div id="tnc-arcgis-imagery-slice-time-controls" className="flex items-center gap-1.5">
          <button
            id="tnc-arcgis-imagery-slice-prev"
            type="button"
            disabled={!hasPrevious}
            onClick={() => {
              if (!hasPrevious || currentIndex < 0) return;
              commitSelection(
                selectionWithStats(
                  targetLayer.id,
                  activeVariable,
                  activeDimension.name,
                  activeDimension.values[currentIndex - 1],
                ),
              );
            }}
            className={`rounded-full p-1.5 transition-colors ${
              hasPrevious ? 'text-gray-700 hover:bg-gray-100' : 'cursor-not-allowed text-gray-300'
            }`}
            aria-label={`Previous ${dimensionLabel}`}
            title={`Previous ${dimensionLabel}`}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div id="tnc-arcgis-imagery-slice-values" className="flex max-w-[18rem] items-center gap-1 overflow-x-auto">
            {activeDimension.values.map((value) => {
              const active = value === imagerySliceSelection.dimensionValue;
              const label = formatImageryDimensionLabel(value, activeDimension.name);
              return (
                <button
                  key={value}
                  id={`tnc-arcgis-imagery-slice-value-${value}`}
                  type="button"
                  onClick={() => commitSelection(
                    selectionWithStats(targetLayer.id, activeVariable, activeDimension.name, value),
                  )}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                    active
                      ? 'bg-emerald-700 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  aria-pressed={active}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <button
            id="tnc-arcgis-imagery-slice-next"
            type="button"
            disabled={!hasNext}
            onClick={() => {
              if (!hasNext || currentIndex < 0) return;
              commitSelection(
                selectionWithStats(
                  targetLayer.id,
                  activeVariable,
                  activeDimension.name,
                  activeDimension.values[currentIndex + 1],
                ),
              );
            }}
            className={`rounded-full p-1.5 transition-colors ${
              hasNext ? 'text-gray-700 hover:bg-gray-100' : 'cursor-not-allowed text-gray-300'
            }`}
            aria-label={`Next ${dimensionLabel}`}
            title={`Next ${dimensionLabel}`}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
