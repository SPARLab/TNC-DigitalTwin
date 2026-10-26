// ============================================================================
// SuitabilityPanel — multi-step weighted raster overlay wizard.
// ============================================================================

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GP_SERVICES } from '../../config/geoprocessing';
import { fetchCatalogRasters, submitGpJob } from '../../services/geoprocessingService';
import { fetchRasterClassLabels } from '../../services/rasterClassLabels';
import { experienceUi } from './experienceUi';
import { WizardStepIndicator } from './WizardStepIndicator';
import { GpJobStatus } from './GpJobStatus';
import { initLayerConfig } from './LayerConfig';
import { SuitabilityConfigureStep } from './suitability/SuitabilityConfigureStep';
import { SuitabilityDataStep } from './suitability/SuitabilityDataStep';
import { SuitabilityIntroStep } from './suitability/SuitabilityIntroStep';
import { SuitabilityRunStep } from './suitability/SuitabilityRunStep';
import { validateRunName } from './suitability/runName';
import { ANALYSIS_EXTENT_BOUNDARIES } from './analysisExtentLayer';
import {
  defaultResolutionForScope,
  resolutionForScopeChange,
  resolutionsForScope,
} from './suitability/wizardCopy';
import { retainCompatibleSelection } from './suitability/rasterFamilies';
import {
  RASTER_SCOPE_OPTIONS,
  type CatalogRaster,
  type GpJobRecord,
  type LayerReclassConfig,
  type PreviewAction,
  type RasterScope,
  type ResultLayerInfo,
  type SuitabilityRunRecord,
} from './types';

type WizardStep = 'intro' | 'data' | 'configure' | 'run';

const STEP_META: Array<{ id: WizardStep; label: string }> = [
  { id: 'intro', label: 'Overview' },
  { id: 'data', label: 'Data' },
  { id: 'configure', label: 'Weights' },
  { id: 'run', label: 'Run' },
];

const FINISHED_JOB_STATUSES = ['esriJobSucceeded', 'esriJobFailed', 'esriJobCancelled'];

interface SuitabilityPanelProps {
  token: string | null;
  onLayerAdded?: (info: ResultLayerInfo | null) => void;
  onPreviewLayer?: (action: PreviewAction) => void;
  onExtentChange?: (scope: RasterScope) => void;
  /** Names of runs already on the map. A new run cannot reuse one. */
  existingRunNames?: string[];
}

const NO_RUN_NAMES: string[] = [];

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

export function SuitabilityPanel({
  token,
  onLayerAdded,
  onPreviewLayer,
  onExtentChange,
  existingRunNames = NO_RUN_NAMES,
}: SuitabilityPanelProps) {
  const [step, setStep] = useState<WizardStep>('intro');
  const [runName, setRunName] = useState('');
  const [catalog, setCatalog] = useState<CatalogRaster[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [scope, setScope] = useState<RasterScope>('preserve');
  const [resolution, setResolution] = useState<number | null>(
    () => defaultResolutionForScope('preserve'),
  );
  const [selectedLayers, setSelectedLayers] = useState<CatalogRaster[]>([]);
  const [configs, setConfigs] = useState<Record<number, LayerReclassConfig>>({});
  const [scaleMax, setScaleMax] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [job, setJob] = useState<GpJobRecord | null>(null);
  const [jobStatus, setJobStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewedIds, setPreviewedIds] = useState<Set<number>>(new Set());
  const isRunning =
    isSubmitting
    || (job != null && jobStatus != null && !FINISHED_JOB_STATUSES.includes(jobStatus));

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

  const availableResolutions = useMemo(() => resolutionsForScope(scope), [scope]);

  useEffect(() => {
    const available = resolutionsForScope(scope);
    setResolution((current) => {
      if (current != null && available.includes(current)) return current;
      return defaultResolutionForScope(scope);
    });
  }, [scope]);

  const selectedLayersRef = useRef(selectedLayers);
  selectedLayersRef.current = selectedLayers;
  const configsRef = useRef(configs);
  configsRef.current = configs;
  const previewedIdsRef = useRef(previewedIds);
  previewedIdsRef.current = previewedIds;

  const pruneIncompatibleSelection = useCallback(
    (nextScope: RasterScope, nextResolution: number | null) => {
      const current = selectedLayersRef.current;
      const { layers, idMap } = retainCompatibleSelection(
        current,
        catalog,
        nextScope,
        nextResolution,
      );

      const nextConfigs: Record<number, LayerReclassConfig> = {};
      for (const raster of current) {
        const mappedId = idMap.get(raster.id);
        if (mappedId == null || nextConfigs[mappedId]) continue;
        const config = configsRef.current[raster.id];
        if (config) nextConfigs[mappedId] = config;
      }
      for (const layer of layers) {
        if (!nextConfigs[layer.id]) nextConfigs[layer.id] = initLayerConfig(layer);
      }

      const nextPreviewed = new Set<number>();
      for (const rasterId of previewedIdsRef.current) {
        const raster = current.find((item) => item.id === rasterId);
        if (!raster) continue;
        const mappedId = idMap.get(raster.id);
        if (mappedId == null) {
          onPreviewLayer?.({ action: 'remove', rasterId: raster.id, title: raster.title });
          continue;
        }
        nextPreviewed.add(mappedId);
        if (mappedId === raster.id) continue;
        const replacement = layers.find((layer) => layer.id === mappedId);
        onPreviewLayer?.({ action: 'remove', rasterId: raster.id, title: raster.title });
        if (!replacement) continue;
        onPreviewLayer?.({
          action: 'add',
          rasterId: replacement.id,
          url: replacement.url,
          title: replacement.title,
          datasetId: replacement.datasetId,
          mosaicTag: replacement.mosaicTag,
        });
      }

      setSelectedLayers(layers);
      setConfigs(nextConfigs);
      setPreviewedIds(nextPreviewed);
    },
    [catalog, onPreviewLayer],
  );

  useEffect(() => {
    let cancelled = false;
    for (const raster of selectedLayers) {
      if (raster.units.toLowerCase() !== 'category' || !raster.url) continue;
      fetchRasterClassLabels({
        rasterUrl: raster.url,
        datasetId: raster.datasetId,
        token,
      }).then((result) => {
        if (cancelled || !result) return;
        setConfigs((current) => {
          const existing = current[raster.id];
          if (!existing || Object.keys(existing.categoryLabels).length > 0) return current;
          const categories: Record<string, number> = {};
          for (const [value, score] of Object.entries(result.categories)) {
            categories[value] = existing.categories[value] ?? score;
          }
          return {
            ...current,
            [raster.id]: {
              ...existing,
              categories,
              categoryLabels: result.labels,
            },
          };
        });
      });
    }
    return () => {
      cancelled = true;
    };
  }, [selectedLayers, token]);

  const handleAddLayer = useCallback((raster: CatalogRaster) => {
    setSelectedLayers((current) => {
      if (current.some((item) => item.id === raster.id)) return current;
      return [...current, raster];
    });
    const config = initLayerConfig(raster);
    setConfigs((current) => ({ ...current, [raster.id]: config }));
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
      const removing = previewedIds.has(raster.id);
      setPreviewedIds((current) => {
        const next = new Set(current);
        if (removing) next.delete(raster.id);
        else next.add(raster.id);
        return next;
      });
      onPreviewLayer?.(
        removing
          ? { action: 'remove', rasterId: raster.id, title: raster.title }
          : {
              action: 'add',
              rasterId: raster.id,
              url: raster.url,
              title: raster.title,
              datasetId: raster.datasetId,
              mosaicTag: raster.mosaicTag,
            },
      );
    },
    [onPreviewLayer, previewedIds],
  );

  const handleScopeChange = useCallback(
    (nextScope: RasterScope) => {
      if (nextScope === scope) return;
      setScope(nextScope);
      const nextResolution = resolutionForScopeChange(resolution, nextScope);
      setResolution(nextResolution);
      pruneIncompatibleSelection(nextScope, nextResolution);
    },
    [pruneIncompatibleSelection, resolution, scope],
  );

  const handleResolutionChange = useCallback(
    (nextResolution: number) => {
      if (nextResolution === resolution) return;
      setResolution(nextResolution);
      pruneIncompatibleSelection(scope, nextResolution);
    },
    [pruneIncompatibleSelection, resolution, scope],
  );

  const handleRun = useCallback(async () => {
    const name = runName.trim();
    if (selectedLayers.length === 0 || isRunning) return;
    const nameProblem = validateRunName(name, existingRunNames);
    if (nameProblem) {
      setError(nameProblem);
      return;
    }
    setIsSubmitting(true);
    setError(null);
    setJob(null);
    setJobStatus(null);

    const record: SuitabilityRunRecord = {
      name,
      extent: scope,
      extentLabel: RASTER_SCOPE_OPTIONS.find((option) => option.value === scope)?.label ?? scope,
      scaleMax,
      layers: selectedLayers.flatMap((raster) => {
        const config = configs[raster.id];
        if (!config) return [];
        return [{
          title: raster.title,
          url: raster.url,
          weight: config.weight,
          type: config.type,
          bins: config.type === 'continuous' ? config.bins : undefined,
          categories: config.type === 'categorical' ? config.categories : undefined,
          categoryLabels: config.type === 'categorical' ? config.categoryLabels : undefined,
          rescaleMin: config.type === 'rescale' ? config.rescaleMin : undefined,
          rescaleMax: config.type === 'rescale' ? config.rescaleMax : undefined,
          invert: config.type === 'rescale' ? config.invert : undefined,
        }];
      }),
    };

    try {
      const jobId = await submitGpJob(
        GP_SERVICES.suitabilityModeler.url,
        GP_SERVICES.suitabilityModeler.task,
        {
          input_rasters: JSON.stringify(selectedLayers.map((raster) => ({ url: raster.url }))),
          layer_config: JSON.stringify(buildGpConfig(configs, selectedLayers)),
          scale_max: String(scaleMax),
          analysis_mask: ANALYSIS_EXTENT_BOUNDARIES[scope].url,
          output_raster: 'suitability_result',
        },
        token,
        'suitability',
      );

      setJobStatus('esriJobSubmitted');
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
          title: name,
          record,
        },
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setIsSubmitting(false);
    }
  }, [configs, existingRunNames, isRunning, runName, scaleMax, scope, selectedLayers, token]);

  return (
    <div id="suitability-panel" className={experienceUi.panel}>
      <WizardStepIndicator
        steps={STEP_META}
        step={step}
        onStepChange={setStep}
        label="Suitability analysis steps"
        locked={isRunning}
      />

      {step === 'intro' && (
        <SuitabilityIntroStep onStart={() => setStep('data')} />
      )}

      {step === 'data' && (
        <SuitabilityDataStep
          catalog={catalog}
          catalogLoading={catalogLoading}
          catalogError={catalogError}
          scope={scope}
          resolution={resolution}
          availableResolutions={availableResolutions}
          selectedLayers={selectedLayers}
          previewedIds={previewedIds}
          onScopeChange={handleScopeChange}
          onResolutionChange={handleResolutionChange}
          onAddLayer={handleAddLayer}
          onRemoveLayer={handleRemoveLayer}
          onTogglePreview={handleTogglePreview}
          onBack={() => setStep('intro')}
          onContinue={() => setStep('configure')}
        />
      )}

      {step === 'configure' && (
        <SuitabilityConfigureStep
          selectedLayers={selectedLayers}
          configs={configs}
          scaleMax={scaleMax}
          analysisScope={scope}
          token={token}
          previewedIds={previewedIds}
          onScaleMaxChange={setScaleMax}
          onConfigChange={(rasterId, config) =>
            setConfigs((current) => ({ ...current, [rasterId]: config }))
          }
          onRemoveLayer={handleRemoveLayer}
          onTogglePreview={handleTogglePreview}
          onBack={() => setStep('data')}
          onContinue={() => setStep('run')}
        />
      )}

      {step === 'run' && (
        <SuitabilityRunStep
          selectedLayers={selectedLayers}
          configs={configs}
          scaleMax={scaleMax}
          scope={scope}
          resolution={resolution}
          runName={runName}
          existingRunNames={existingRunNames}
          isRunning={isRunning}
          isSubmitting={isSubmitting}
          error={error}
          onRunNameChange={setRunName}
          onBack={() => setStep('configure')}
          onRun={handleRun}
        />
      )}

      {job && (
        <GpJobStatus
          key={job.id}
          job={job}
          serviceUrl={GP_SERVICES.suitabilityModeler.url}
          task={GP_SERVICES.suitabilityModeler.task}
          token={token}
          onLayerAdded={onLayerAdded}
          onStatusChange={setJobStatus}
        />
      )}
    </div>
  );
}
