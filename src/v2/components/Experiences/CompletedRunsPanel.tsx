// ============================================================================
// CompletedRunsPanel — finished geoprocessing jobs beside the map.
//
// Pinned at the top: pick a run. Picking it puts it on the map and shows its
// downloads. Below, scrolling: a recap of the settings it was made with, then
// the analysis of what it chose.
// ============================================================================

import { useState } from 'react';
import { Download, Eye, EyeOff, Trash2 } from 'lucide-react';
import { CollapsibleSection } from './CollapsibleSection';
import { RunAnalysisView } from './suitability/RunAnalysisView';
import { RunSettingsView } from './suitability/RunSettingsView';
import { buildResultsPackage, hasResults, saveBlob } from './suitability/resultsPackage';
import type { CompletedRun } from './types';

interface CompletedRunsPanelProps {
  runs: CompletedRun[];
  /** The run being viewed. Falls back to the newest run. */
  activeRunId: string | null;
  onSelectRun: (jobId: string) => void;
  onToggleVisible: (jobId: string) => void;
  onRemove: (jobId: string) => void;
}

function formatRunTime(addedAt: number): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(addedAt);
}

const ACTION =
  'inline-flex items-center gap-1 rounded px-1.5 py-1 text-xs font-medium hover:bg-gray-100';

export function CompletedRunsPanel({
  runs,
  activeRunId,
  onSelectRun,
  onToggleVisible,
  onRemove,
}: CompletedRunsPanelProps) {
  const [packagingId, setPackagingId] = useState<string | null>(null);
  const [downloadNote, setDownloadNote] = useState<string | null>(null);
  const activeRun = runs.find((run) => run.jobId === activeRunId) ?? runs[0] ?? null;

  return (
    <aside
      id="completed-runs-panel"
      className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden bg-white"
    >
      <section id="completed-runs-picker" className="shrink-0 border-b border-gray-200 px-3 py-3">
        <label
          htmlFor="completed-runs-select"
          className="block text-[10px] font-semibold uppercase tracking-wide text-gray-500"
        >
          Habitat Suitability Runs{runs.length > 0 ? ` (${runs.length})` : ''}
        </label>

        {!activeRun ? (
          <p className="mt-1.5 text-sm leading-relaxed text-gray-500">
            Finished analyses stay here. Pick one to see it on the map, its settings and its
            analysis.
          </p>
        ) : (
          <>
            <select
              id="completed-runs-select"
              value={activeRun.jobId}
              onChange={(event) => {
                setDownloadNote(null);
                onSelectRun(event.target.value);
              }}
              className="mt-1.5 w-full min-w-0 rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {runs.map((run) => (
                <option key={run.jobId} value={run.jobId}>
                  {run.title} · {formatRunTime(run.addedAt)}
                </option>
              ))}
            </select>

            {activeRun.summary && (
              <p className="mt-1.5 break-words text-xs text-gray-500">{activeRun.summary}</p>
            )}

            <div className="mt-2 flex flex-wrap items-center gap-1">
              <button
                type="button"
                onClick={() => onToggleVisible(activeRun.jobId)}
                aria-pressed={activeRun.visible}
                className={`${ACTION} text-gray-700`}
              >
                {activeRun.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                {activeRun.visible ? 'On map' : 'Hidden'}
              </button>
              {hasResults(activeRun) && (
                <button
                  type="button"
                  disabled={packagingId === activeRun.jobId}
                  onClick={() => {
                    const run = activeRun;
                    setPackagingId(run.jobId);
                    setDownloadNote(null);
                    buildResultsPackage(run)
                      .then((result) => {
                        if (!result) return;
                        saveBlob(result.blob, result.filename);
                        if (result.missing.length > 0) {
                          setDownloadNote(
                            'Some files could not be fetched and are listed in missing-files.txt in the zip.',
                          );
                        }
                      })
                      .catch((error: unknown) => {
                        const reason = error instanceof Error ? error.message : String(error);
                        console.error('Results package failed', error);
                        setDownloadNote(`The results package could not be built (${reason}).`);
                      })
                      .finally(() => setPackagingId(null));
                  }}
                  title="Download the TIFF, map image, layers and weights, and distribution chart as one zip"
                  className={`${ACTION} text-emerald-700 disabled:opacity-60`}
                >
                  <Download className="h-3.5 w-3.5" />
                  {packagingId === activeRun.jobId ? 'Preparing…' : 'Results'}
                </button>
              )}
              <button
                type="button"
                onClick={() => onRemove(activeRun.jobId)}
                className={`${ACTION} ml-auto text-gray-500 hover:text-red-700`}
                aria-label={`Remove ${activeRun.title}`}
                title="Remove this run"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            {downloadNote && <p className="mt-1.5 text-xs text-amber-700">{downloadNote}</p>}
          </>
        )}
      </section>

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
