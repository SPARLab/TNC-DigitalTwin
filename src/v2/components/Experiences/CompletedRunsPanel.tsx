// ============================================================================
// CompletedRunsPanel — finished suitability analyses beside the map.
//
// Pinned at the top: pick a run. Picking it puts it on the map and shows its
// downloads. Below, scrolling: a recap of the settings it was made with, then
// the analysis of what it chose.
// ============================================================================

import { CollapsibleSection } from './CollapsibleSection';
import { RunPicker } from './RunPicker';
import { RunAnalysisView } from './suitability/RunAnalysisView';
import { RunSettingsView } from './suitability/RunSettingsView';
import type { CompletedRun } from './types';

interface CompletedRunsPanelProps {
  runs: CompletedRun[];
  /** The run being viewed. Falls back to the newest run. */
  activeRunId: string | null;
  onSelectRun: (jobId: string) => void;
  onToggleVisible: (jobId: string) => void;
  onRemove: (jobId: string) => void;
}

export function CompletedRunsPanel({
  runs,
  activeRunId,
  onSelectRun,
  onToggleVisible,
  onRemove,
}: CompletedRunsPanelProps) {
  const activeRun = runs.find((run) => run.jobId === activeRunId) ?? runs[0] ?? null;

  return (
    <aside
      id="completed-runs-panel"
      className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden bg-white"
    >
      <RunPicker
        runs={runs}
        activeRun={activeRun}
        label="Runs"
        emptyMessage="Finished analyses stay here. Pick one to see it on the map, its settings and its analysis."
        onSelectRun={onSelectRun}
        onToggleVisible={onToggleVisible}
        onRemove={onRemove}
      />

      {activeRun?.record && (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <CollapsibleSection
            id="run-settings"
            title="Settings used"
            className="border-t-0"
            bodyClassName="pt-1"
          >
            <RunSettingsView record={activeRun.record} cellSize={activeRun.analysis?.cell_size} />
          </CollapsibleSection>

          <CollapsibleSection id="run-analysis" title="Analysis" bodyClassName="pt-1">
            {activeRun.analysis ? (
              <RunAnalysisView analysis={activeRun.analysis} record={activeRun.record} />
            ) : (
              <p className="rounded-card border border-dashed border-gray-300 bg-gray-50 px-2.5 py-3 text-sm leading-relaxed text-gray-500">
                This run has no analysis. Runs made before the tool wrote one, or by a service
                that has not been republished, do not include it.
              </p>
            )}
          </CollapsibleSection>
        </div>
      )}
    </aside>
  );
}
