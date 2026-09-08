// ============================================================================
// SuitabilityPanel — weighted raster overlay: pick rasters, reclassify, run.
// ============================================================================

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Info, Loader2, Play } from 'lucide-react';
import { GP_SERVICES } from '../../config/geoprocessing';
import { fetchCatalogRasters, fetchCategoryLabels, submitGpJob } from '../../services/geoprocessingService';
import { experienceUi } from './experienceUi';
import { GpJobStatus } from './GpJobStatus';
import { initLayerConfig, LayerConfigCard } from './LayerConfig';
import { LayerPicker } from './LayerPicker';
import type {
  CatalogRaster,
  GpJobRecord,
  LayerReclassConfig,
  PreviewAction,
  RasterScope,
  ResultLayerInfo,
} from './types';
import { RASTER_SCOPE_OPTIONS } from './types';

const MIN_RESOLUTION_M = 10;

interface SuitabilityPanelProps {
  token: string | null;
  onLayerAdded?: (info: ResultLayerInfo) => void;
  onPreviewLayer?: (action: PreviewAction) => void;
  onExtentChange?: (scope: RasterScope) => void;
}

function buildGpConfig(
  configs: Record<number, LayerReclassConfig>,
  selectedLayers: CatalogRaster[],
) {
  return selectedLayers.map((raster) => {
    const config = configs[raster.id];
    if (!config) return null;

    const entry: Record<string, unknown> = { weight: config.weight, type: config.type };
    if (config.type === 'continuous') {
      entry.bins = config.bins;
    } else if (config.type === 'categorical') {
      entry.categories = config.categories;
    } else {
      entry.input_min = config.rescaleMin;
      entry.input_max = config.rescaleMax;
      entry.invert = config.invert;
    }
    return entry;
  });
}

function resolutionsForScope(rasters: CatalogRaster[], scope: RasterScope): number[] {
  const values = new Set<number>();
  for (const raster of rasters) {
    if (raster.scope !== scope) continue;
    if (raster.resolution == null || raster.resolution < MIN_RESOLUTION_M) continue;
    values.add(raster.resolution);
  }
  return [...values].sort((a, b) => a - b);
}

function defaultResolution(available: number[]): number | null {
  if (available.includes(30)) return 30;
  return available[0] ?? null;
}

export function SuitabilityPanel({
  token,
  onLayerAdded,
  onPreviewLayer,
  onExtentChange,
}: SuitabilityPanelProps) {
  const [catalog, setCatalog] = useState<CatalogRaster[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [scope, setScope] = useState<RasterScope>('preserve');
  const [resolution, setResolution] = useState<number | null>(null);
  const [selectedLayers, setSelectedLayers] = useState<CatalogRaster[]>([]);
  const [configs, setConfigs] = useState<Record<number, LayerReclassConfig>>({});
  const [scaleMax, setScaleMax] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [job, setJob] = useState<GpJobRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewedIds, setPreviewedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    let isCancelled = false;
    setCatalogLoading(true);
    setCatalogError(null);

    fetchCatalogRasters(token)
      .then((result) => {
        if (!isCancelled) setCatalog(result);
      })
      .catch((caught) => {
        if (!isCancelled) {
          setCatalog([]);
          setCatalogError(caught instanceof Error ? caught.message : String(caught));
        }
      })
      .finally(() => {
        if (!isCancelled) setCatalogLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [token]);

  useEffect(() => {
    onExtentChange?.(scope);
  }, [onExtentChange, scope]);

  const availableResolutions = useMemo(
    () => (scope ? resolutionsForScope(catalog, scope) : []),
    [catalog, scope],
  );

  useEffect(() => {
    if (!scope) {
      setResolution(null);
      return;
    }
    const available = resolutionsForScope(catalog, scope);
    setResolution((current) => {
      if (current != null && available.includes(current)) return current;
      return defaultResolution(available);
    });
  }, [catalog, scope]);

  const filteredRasters = useMemo(() => {
    if (!scope || resolution == null) return [];
    return catalog.filter(
      (raster) => raster.scope === scope && raster.resolution === resolution,
    );
  }, [catalog, resolution, scope]);

  const selectedIds = new Set(selectedLayers.map((raster) => raster.id));

  const clearSelection = useCallback(() => {
    previewedIds.forEach((id) => {
      const raster = selectedLayers.find((item) => item.id === id);
      if (raster) onPreviewLayer?.({ action: 'remove', rasterId: id, title: raster.title });
    });
    setSelectedLayers([]);
    setConfigs({});
    setPreviewedIds(new Set());
  }, [onPreviewLayer, previewedIds, selectedLayers]);

  const confirmClear = useCallback(
    (what: string) => {
      if (selectedLayers.length === 0) return true;
      return window.confirm(
        `Changing ${what} will clear your ${selectedLayers.length} selected layer(s). Continue?`,
      );
    },
    [selectedLayers.length],
  );

  const handleAddLayer = useCallback((raster: CatalogRaster) => {
    setSelectedLayers((current) => [...current, raster]);
    const config = initLayerConfig(raster);
    setConfigs((current) => ({ ...current, [raster.id]: config }));

    if (config.type === 'categorical' && raster.url) {
      fetchCategoryLabels(raster.url).then((result) => {
        if (!result) return;
        setConfigs((current) => ({
          ...current,
          [raster.id]: {
            ...current[raster.id],
            categories: result.categories,
            categoryLabels: result.labels,
          },
        }));
      });
    }
  }, []);

  const handleRemoveLayer = useCallback(
    (id: number) => {
      setSelectedLayers((current) => current.filter((raster) => raster.id !== id));
      setConfigs((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
      setPreviewedIds((current) => {
        const next = new Set(current);
        if (next.delete(id)) {
          onPreviewLayer?.({ action: 'remove', rasterId: id });
        }
        return next;
      });
    },
    [onPreviewLayer],
  );

  const handleTogglePreview = useCallback(
    (raster: CatalogRaster) => {
      setPreviewedIds((current) => {
        const next = new Set(current);
        if (next.has(raster.id)) {
          next.delete(raster.id);
          onPreviewLayer?.({ action: 'remove', rasterId: raster.id, title: raster.title });
        } else {
          next.add(raster.id);
          onPreviewLayer?.({
            action: 'add',
            rasterId: raster.id,
            url: raster.url,
            title: raster.title,
          });
        }
        return next;
      });
    },
    [onPreviewLayer],
  );

  const handleScopeChange = useCallback(
    (nextScope: RasterScope) => {
      if (nextScope === scope) return;
      if (!confirmClear('extent')) return;
      clearSelection();
      setScope(nextScope);
    },
    [clearSelection, confirmClear, scope],
  );

  const handleResolutionChange = useCallback(
    (nextResolution: number) => {
      if (nextResolution === resolution) return;
      if (!confirmClear('resolution')) return;
      clearSelection();
      setResolution(nextResolution);
    },
    [clearSelection, confirmClear, resolution],
  );

  const handleRun = useCallback(async () => {
    if (selectedLayers.length === 0) return;
    setIsSubmitting(true);
    setError(null);
    setJob(null);

    try {
      const jobId = await submitGpJob(
        GP_SERVICES.suitabilityModeler.url,
        GP_SERVICES.suitabilityModeler.task,
        {
          input_rasters: JSON.stringify(selectedLayers.map((raster) => ({ url: raster.url }))),
          layer_config: JSON.stringify(buildGpConfig(configs, selectedLayers)),
          scale_max: String(scaleMax),
          output_raster: 'suitability_result',
        },
        token,
        'suitability',
      );

      setJob({
        id: jobId,
        status: 'esriJobSubmitted',
        summary: `${selectedLayers.length} layers`,
        defaultFilename: 'suitability_result.tif',
        jobsDirectory: GP_SERVICES.suitabilityModeler.jobsDirectory,
        filenamePattern: 'saved-to',
        result: {
          jobId,
          mapServerUrl: GP_SERVICES.suitabilityModeler.mapServer,
          groupTitle: 'Suitability Analysis',
          title: `Suitability (${selectedLayers.length} layers)`,
        },
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setIsSubmitting(false);
    }
  }, [configs, scaleMax, selectedLayers, token]);

  const canAddLayers = Boolean(scope && resolution != null);
  const pickerEmpty = catalogLoading
    ? 'Loading rasters…'
    : catalogError
      ? catalogError
      : !canAddLayers
        ? 'Choose an extent and resolution first'
        : filteredRasters.length === 0
          ? `No rasters at ${resolution}m for this extent`
          : 'No matching rasters';

  return (
    <div id="suitability-panel" className={experienceUi.panel}>
      <p className={experienceUi.description}>
        Select raster layers, assign weights and reclassification rules, then run a
        weighted overlay suitability analysis.
      </p>

      <div className={experienceUi.section}>
        <span className={experienceUi.label}>Extent</span>
        <select
          aria-label="Extent"
          value={scope}
          onChange={(event) => handleScopeChange(event.target.value as RasterScope)}
          className={experienceUi.input}
        >
          {RASTER_SCOPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className={experienceUi.section}>
        <span className={experienceUi.label}>Resolution</span>
        <select
          aria-label="Resolution"
          value={resolution ?? ''}
          disabled={!scope}
          onChange={(event) => handleResolutionChange(Number(event.target.value))}
          className={`${experienceUi.input} disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400`}
        >
          {availableResolutions.length === 0 && (
            <option value="">No resolutions available</option>
          )}
          {availableResolutions.map((value) => (
            <option key={value} value={value}>
              {value}m
            </option>
          ))}
        </select>
        <p className={experienceUi.hint}>
          {catalogLoading
            ? 'Loading available resolutions…'
            : availableResolutions.length === 0
              ? 'No rasters at 10 m or coarser for this extent yet. Once the catalog includes a matching scope, resolutions will appear here.'
              : resolution != null
                ? `All layers must share the same ${resolution}m grid.`
                : 'Resolutions of 10 m and coarser are listed for the selected extent.'}
        </p>
      </div>

      <div className={experienceUi.section}>
        <span className={experienceUi.label}>Analysis Layers</span>
        <LayerPicker
          rasters={filteredRasters}
          isLoading={catalogLoading}
          error={catalogError}
          disabled={!canAddLayers}
          disabledHint="Choose an extent and resolution first"
          emptyMessage={pickerEmpty}
          selectedIds={selectedIds}
          onAdd={handleAddLayer}
          onRemove={handleRemoveLayer}
        />
      </div>

      {selectedLayers.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <span className={experienceUi.label}>Selected ({selectedLayers.length})</span>
            <label className="flex items-center gap-1.5 text-[11px] text-gray-600">
              Scale
              <select
                value={scaleMax}
                onChange={(event) => setScaleMax(Number(event.target.value))}
                className="rounded-button border border-gray-200 bg-white px-1.5 py-1 text-xs focus:border-emerald-500 focus:outline-none"
              >
                {[3, 5, 7, 10].map((value) => (
                  <option key={value} value={value}>
                    1–{value}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {selectedLayers.map((raster) => {
            const config = configs[raster.id];
            if (!config) return null;
            return (
              <LayerConfigCard
                key={raster.id}
                raster={raster}
                config={config}
                scaleMax={scaleMax}
                isPreviewed={previewedIds.has(raster.id)}
                onConfigChange={(next) =>
                  setConfigs((current) => ({ ...current, [raster.id]: next }))
                }
                onRemove={() => handleRemoveLayer(raster.id)}
                onTogglePreview={() => handleTogglePreview(raster)}
              />
            );
          })}

          <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-gray-500">
            <Info className="mt-px h-3.5 w-3.5 flex-shrink-0" />
            Weighted average: each cell = Σ(weight × score) / Σ(weights)
          </p>
        </div>
      )}

      {error && <div className={experienceUi.error}>{error}</div>}

      <button
        type="button"
        onClick={handleRun}
        disabled={selectedLayers.length === 0 || isSubmitting}
        className={experienceUi.runBtn}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Submitting…
          </>
        ) : (
          <>
            <Play className="h-3.5 w-3.5" /> Run Suitability Analysis
          </>
        )}
      </button>

      {job && (
        <GpJobStatus
          job={job}
          serviceUrl={GP_SERVICES.suitabilityModeler.url}
          task={GP_SERVICES.suitabilityModeler.task}
          token={token}
          onLayerAdded={onLayerAdded}
        />
      )}
    </div>
  );
}
