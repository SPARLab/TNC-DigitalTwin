// ============================================================================
// ExperienceWorkspace — map + control sidebar for one experience.
//
// Suitability and SDM render their geoprocessing panels. Everything else still
// uses the coming-soon placeholder until those models exist.
// ============================================================================

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Construction, X } from 'lucide-react';
import { ResizablePanel, type ResizablePanelHandle } from '../shared/ResizablePanel';
import type { ExperienceDefinition } from '../../config/experienceRegistry';
import { fetchOccurrenceFeatures, readStoredArcGisToken } from '../../services/geoprocessingService';
import { CompletedRunsPanel } from './CompletedRunsPanel';
import { loadStoredRuns, runsStorageKey, saveStoredRuns } from './completedRunsStorage';
import { ExperienceMap } from './ExperienceMap';
import { SDMPanel } from './SDMPanel';
import { SdmRunsPanel } from './SdmRunsPanel';
import { speciesColorFor } from './sdm/speciesColors';
import { showRun } from './sdmRuns';
import { SuitabilityPanel } from './SuitabilityPanel';
import type { CompletedRun, PointsAction, PreviewAction, RasterScope, ResultLayerInfo } from './types';

interface ExperienceWorkspaceProps {
  experience: ExperienceDefinition;
  onClose: () => void;
}

function ComingSoonPanel({ experience }: { experience: ExperienceDefinition }) {
  const Icon = experience.icon;

  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center px-6 py-12 text-center">
      <Icon className="mb-3 h-8 w-8 text-gray-400" />
      <h3 className="text-base font-semibold text-gray-900">{experience.name}</h3>
      <p className="mt-2 max-w-[280px] text-xs leading-relaxed text-gray-600">
        {experience.description}
      </p>
      <span className="mt-5 inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
        <Construction className="h-3.5 w-3.5" />
        Coming soon
      </span>
    </div>
  );
}

export function ExperienceWorkspace({ experience, onClose }: ExperienceWorkspaceProps) {
  const Icon = experience.icon;
  const token = useMemo(() => readStoredArcGisToken(), []);
  const tracksRuns = experience.panel === 'suitability' || experience.panel === 'sdm';
  const runsKey = runsStorageKey(experience.id);
  // Runs from the last day survive a refresh; older ones are dropped on load.
  const [restored] = useState(() =>
    tracksRuns ? loadStoredRuns(runsKey) : { runs: [], activeRunId: null },
  );
  const [completedRuns, setCompletedRuns] = useState<CompletedRun[]>(restored.runs);
  const [activeRunId, setActiveRunId] = useState<string | null>(restored.activeRunId);
  const runsPanelRef = useRef<ResizablePanelHandle>(null);
  // Appended to, never replaced, so records for several species all reach the map.
  const [pointsActions, setPointsActions] = useState<PointsAction[]>([]);
  const [pointsOnMap, setPointsOnMap] = useState<string[]>([]);
  const pointsOnMapRef = useRef(new Set<string>());
  // Species whose records a finished run has already put on the map once. A user
  // who hides them is not shown them again by the next run.
  const autoAddedRef = useRef(new Set<string>());
  // Each species' color, taken in the order they first appear.
  const speciesColorIndexRef = useRef(new Map<string, number>());
  const [speciesColors, setSpeciesColors] = useState<Record<string, string>>({});
  const assignSpeciesColor = useCallback((speciesKey: string) => {
    if (speciesColorIndexRef.current.has(speciesKey)) return;
    const color = speciesColorFor(speciesColorIndexRef.current, speciesKey);
    setSpeciesColors((current) => ({ ...current, [speciesKey]: color }));
  }, []);
  const handlePoints = useCallback((action: PointsAction) => {
    if (action.action === 'add') assignSpeciesColor(action.species);
    if (action.action === 'add') pointsOnMapRef.current.add(action.species);
    else pointsOnMapRef.current.delete(action.species);
    setPointsOnMap([...pointsOnMapRef.current]);
    setPointsActions((current) => [...current, action]);
  }, [assignSpeciesColor]);
  // Appended to, never replaced, so several changes in one step all reach the map.
  const [previewActions, setPreviewActions] = useState<PreviewAction[]>([]);
  const queuePreview = useCallback(
    (action: PreviewAction) => setPreviewActions((current) => [...current, action]),
    [],
  );
  const [analysisExtent, setAnalysisExtent] = useState<RasterScope>('preserve');

  useEffect(() => {
    if (tracksRuns) saveStoredRuns(runsKey, completedRuns, activeRunId);
  }, [tracksRuns, runsKey, completedRuns, activeRunId]);
  const runNames = useMemo(() => completedRuns.map((run) => run.title), [completedRuns]);

  const rememberRun = useCallback((info: ResultLayerInfo | null) => {
    if (!info) return;
    // A finished model run brings its species' records onto the map, in the
    // species' group beside the run.
    const speciesKey = info.kind === 'model' ? info.speciesKey : undefined;
    if (speciesKey && !autoAddedRef.current.has(speciesKey)) {
      autoAddedRef.current.add(speciesKey);
      if (!pointsOnMapRef.current.has(speciesKey)) {
        fetchOccurrenceFeatures(speciesKey)
          .then((features) => {
            if (features.length > 0 && !pointsOnMapRef.current.has(speciesKey)) {
              handlePoints({ species: speciesKey, action: 'add', features });
            }
          })
          .catch(() => {
            // The run is still on the map without its records.
          });
      }
    }
    setCompletedRuns((current) => {
      const previous = current.find((run) => run.jobId === info.jobId);
      const next: CompletedRun = {
        jobId: info.jobId,
        mapServerUrl: info.mapServerUrl,
        title: info.title,
        summary: info.summary ?? previous?.summary ?? '',
        record: info.record ?? previous?.record ?? null,
        outputType: info.outputType ?? previous?.outputType ?? null,
        kind: info.kind ?? previous?.kind ?? (info.outputType ? 'model' : undefined),
        species: info.species ?? previous?.species,
        speciesKey: info.speciesKey ?? previous?.speciesKey,
        scenario: info.scenario ?? previous?.scenario,
        sdmSummary: info.sdmSummary ?? previous?.sdmSummary ?? null,
        comparison: info.comparison ?? previous?.comparison ?? null,
        common: info.common ?? previous?.common ?? null,
        inputRuns: info.inputRuns ?? previous?.inputRuns,
        downloads: info.downloads?.length ? info.downloads : previous?.downloads,
        mapExtent: info.mapExtent ?? previous?.mapExtent ?? null,
        view: previous?.view ?? (info.kind === 'comparison' ? 'difference' : undefined),
        analysis: info.analysis ?? previous?.analysis ?? null,
        visible: previous?.visible ?? true,
        selected: previous?.selected ?? false,
        pngUrl: info.pngUrl ?? previous?.pngUrl ?? null,
        tifUrl: info.tifUrl ?? previous?.tifUrl ?? null,
        addedAt: previous?.addedAt ?? Date.now(),
      };
      // A new run becomes the one on the map; earlier runs stay in the list.
      const others = current
        .filter((run) => run.jobId !== info.jobId)
        .map((run) => (previous ? run : { ...run, visible: false }));
      return [next, ...others];
    });
    setActiveRunId(info.jobId);
    // A finished run should be visible, so reopen the panel if it was collapsed.
    runsPanelRef.current?.expand();
  }, [handlePoints]);

  // Runs restored from the last visit have species too, oldest first.
  useEffect(() => {
    for (const run of [...completedRuns].reverse()) {
      if (run.kind === 'model' && run.speciesKey) assignSpeciesColor(run.speciesKey);
    }
  }, [completedRuns, assignSpeciesColor]);

  /** Viewing a run puts it, and only it, on the map. */
  const selectRun = useCallback((jobId: string) => {
    setActiveRunId(jobId);
    setCompletedRuns((current) =>
      current.map((run) => ({ ...run, visible: run.jobId === jobId })),
    );
  }, []);

  const removeRun = useCallback(
    (jobId: string) => {
      const remaining = completedRuns.filter((run) => run.jobId !== jobId);
      setCompletedRuns(remaining);
      if (activeRunId === jobId && remaining.length > 0) selectRun(remaining[0].jobId);
    },
    [completedRuns, activeRunId, selectRun],
  );

  const updateRun = (jobId: string, patch: Partial<CompletedRun>) => {
    setCompletedRuns((current) =>
      current.map((run) => (run.jobId === jobId ? { ...run, ...patch } : run)),
    );
  };

  /** A run's layer was switched on or off in the map's layer list. */
  const setRunVisible = (jobId: string, visible: boolean) =>
    setCompletedRuns((current) => {
      if (!current.some((run) => run.jobId === jobId && run.visible !== visible)) return current;
      return visible
        ? showRun(current, jobId)
        : current.map((run) => (run.jobId === jobId ? { ...run, visible } : run));
    });

  const toggleRunVisible = (jobId: string) =>
    setRunVisible(jobId, !completedRuns.find((run) => run.jobId === jobId)?.visible);

  return (
    <div id="experience-workspace" className="flex h-full w-full flex-col overflow-hidden bg-white">
      <header
        id="experience-workspace-header"
        className="flex flex-shrink-0 items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-2.5"
      >
        <div className="flex min-w-0 items-center gap-2 text-emerald-700">
          <Icon className="h-4 w-4 flex-shrink-0" />
          <h2 className="truncate text-sm font-semibold text-gray-900">{experience.name}</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          title="Close experience"
          aria-label="Close experience"
          className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-700"
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
        <ResizablePanel
          side="left"
          storageKey="v2-experience-controls-panel"
          defaultWidth={420}
          minWidth={340}
          maxWidth={640}
          label="experience controls"
          keepMounted
        >
        <div
          id="experience-workspace-sidebar"
          className="h-full min-h-0 min-w-0 overflow-x-hidden overflow-y-auto"
        >
          {experience.panel === 'suitability' ? (
            <SuitabilityPanel
              token={token}
              onLayerAdded={rememberRun}
              onPreviewLayer={queuePreview}
              onExtentChange={setAnalysisExtent}
              existingRunNames={runNames}
            />
          ) : experience.panel === 'sdm' ? (
            <SDMPanel
              token={token}
              onLayerAdded={rememberRun}
              onTogglePoints={handlePoints}
              pointsOnMap={pointsOnMap}
              onPreviewLayer={queuePreview}
            />
          ) : (
            <ComingSoonPanel experience={experience} />
          )}
        </div>
        </ResizablePanel>

        <ExperienceMap
          center={experience.mapCenter}
          zoom={experience.mapZoom}
          token={token}
          resultLayers={completedRuns}
          pointsActions={pointsActions}
          previewActions={previewActions}
          onResultVisibilityChange={setRunVisible}
          speciesColors={speciesColors}
          analysisExtent={experience.panel === 'suitability' ? analysisExtent : undefined}
        />

        {tracksRuns && (
          <ResizablePanel
            ref={runsPanelRef}
            side="right"
            storageKey="v2-experience-runs-panel"
            defaultWidth={experience.panel === 'sdm' ? 420 : 340}
            minWidth={300}
            maxWidth={620}
            label="completed runs"
          >
          {experience.panel === 'sdm' ? (
            <SdmRunsPanel
              token={token}
              runs={completedRuns}
              activeRunId={activeRunId}
              onSelectRun={selectRun}
              onToggleVisible={toggleRunVisible}
              onRemove={removeRun}
              onChangeView={(jobId, view) => updateRun(jobId, { view })}
              onLayerAdded={rememberRun}
              speciesColors={speciesColors}
            />
          ) : (
            <CompletedRunsPanel
              runs={completedRuns}
              activeRunId={activeRunId}
              onSelectRun={selectRun}
              onToggleVisible={toggleRunVisible}
              onRemove={removeRun}
            />
          )}
          </ResizablePanel>
        )}
      </div>
    </div>
  );
}
