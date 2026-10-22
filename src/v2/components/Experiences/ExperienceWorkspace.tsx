// ============================================================================
// ExperienceWorkspace — map + control sidebar for one experience.
//
// Suitability and SDM render their geoprocessing panels. Everything else still
// uses the coming-soon placeholder until those models exist.
// ============================================================================

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Construction, X } from 'lucide-react';
import { ResizablePanel, type ResizablePanelHandle } from '../shared/ResizablePanel';
import type { MapWorkspaceExperience } from '../../config/experienceRegistry';
import { readStoredArcGisToken } from '../../services/geoprocessingService';
import { CompletedRunsPanel } from './CompletedRunsPanel';
import { loadStoredRuns, runsStorageKey, saveStoredRuns } from './completedRunsStorage';
import { ExperienceMap } from './ExperienceMap';
import { SDMPanel } from './SDMPanel';
import { SuitabilityPanel } from './SuitabilityPanel';
import type { CompletedRun, PointsAction, PreviewAction, RasterScope, ResultLayerInfo } from './types';

interface ExperienceWorkspaceProps {
  experience: MapWorkspaceExperience;
  onClose: () => void;
}

function ComingSoonPanel({ experience }: { experience: MapWorkspaceExperience }) {
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
  const [pointsAction, setPointsAction] = useState<PointsAction | null>(null);
  const [previewAction, setPreviewAction] = useState<PreviewAction | null>(null);
  const [analysisExtent, setAnalysisExtent] = useState<RasterScope>('preserve');

  useEffect(() => {
    if (tracksRuns) saveStoredRuns(runsKey, completedRuns, activeRunId);
  }, [tracksRuns, runsKey, completedRuns, activeRunId]);
  const runNames = useMemo(() => completedRuns.map((run) => run.title), [completedRuns]);

  const rememberRun = useCallback((info: ResultLayerInfo | null) => {
    if (!info) return;
    setCompletedRuns((current) => {
      const previous = current.find((run) => run.jobId === info.jobId);
      const next: CompletedRun = {
        jobId: info.jobId,
        mapServerUrl: info.mapServerUrl,
        title: info.title,
        summary: info.summary ?? previous?.summary ?? '',
        record: info.record ?? previous?.record ?? null,
        outputType: info.outputType ?? previous?.outputType ?? null,
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
  }, []);

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
              onPreviewLayer={setPreviewAction}
              onExtentChange={setAnalysisExtent}
              existingRunNames={runNames}
            />
          ) : experience.panel === 'sdm' ? (
            <SDMPanel
              token={token}
              onLayerAdded={rememberRun}
              onTogglePoints={setPointsAction}
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
          pointsAction={pointsAction}
          previewAction={previewAction}
          analysisExtent={experience.panel === 'suitability' ? analysisExtent : undefined}
        />

        {tracksRuns && (
          <ResizablePanel
            ref={runsPanelRef}
            side="right"
            storageKey="v2-experience-runs-panel"
            defaultWidth={340}
            minWidth={300}
            maxWidth={620}
            label="completed runs"
          >
          <CompletedRunsPanel
            runs={completedRuns}
            activeRunId={activeRunId}
            onSelectRun={selectRun}
            onToggleVisible={(jobId) =>
              updateRun(jobId, {
                visible: !completedRuns.find((run) => run.jobId === jobId)?.visible,
              })
            }
            onRemove={removeRun}
          />
          </ResizablePanel>
        )}
      </div>
    </div>
  );
}
