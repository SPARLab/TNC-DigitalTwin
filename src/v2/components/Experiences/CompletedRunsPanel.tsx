// ============================================================================
// CompletedRunsPanel — keep finished geoprocessing jobs beside the map.
//
// Visibility, removal, and download work now. The lower section is only a
// place to choose which runs a later comparison would use.
// ============================================================================

import { useState } from 'react';
import { Download, Eye, EyeOff, Trash2 } from 'lucide-react';
import JSZip from 'jszip';
import { CollapsibleSection } from './CollapsibleSection';
import { RunAnalysisView } from './suitability/RunAnalysisView';
import type { CompletedRun } from './types';

interface CompletedRunsPanelProps {
  runs: CompletedRun[];
  onToggleVisible: (jobId: string) => void;
  onToggleSelected: (jobId: string) => void;
  onRemove: (jobId: string) => void;
}

function packageStem(name: string): string {
  const cleaned = name.replace(/[<>:"/\\|?*\u0000-\u001f]/g, '').trim();
  return cleaned || 'suitability-run';
}

async function downloadRunPackage(run: CompletedRun): Promise<boolean> {
  if (!run.record) return false;
  const stem = packageStem(run.record.name);
  const zip = new JSZip();
  zip.file(`${stem}.json`, JSON.stringify(run.record, null, 2));
  if (run.tifUrl) {
    try {
      const response = await fetch(run.tifUrl);
      if (response.ok) {
        zip.file(`${stem}.tif`, await response.arrayBuffer());
      }
    } catch {
      // The TIFF link on the card stays available when this fetch is blocked.
    }
  }
  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${stem}.zip`;
  anchor.click();
  URL.revokeObjectURL(url);
  return true;
}

function formatRunTime(addedAt: number): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(addedAt);
}

export function CompletedRunsPanel({
  runs,
  onToggleVisible,
  onToggleSelected,
  onRemove,
}: CompletedRunsPanelProps) {
  const [packagingId, setPackagingId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const selected = runs.filter((run) => run.selected);
  // Until a run is picked, show the newest suitability run.
  const activeRun =
    runs.find((run) => run.jobId === activeId) ?? runs.find((run) => run.record) ?? null;

  return (
    <aside
      id="completed-runs-panel"
      className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden bg-white"
    >
      <header className="flex shrink-0 items-center border-b border-gray-200 px-3 py-2.5">
        <h2 className="text-sm font-semibold text-gray-900">Completed runs</h2>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
      <CollapsibleSection
        id="completed-runs-list"
        title="Runs"
        hint={runs.length > 0 ? `${runs.length}` : undefined}
        bodyClassName="pt-1"
        className="border-t-0"
      >
        {runs.length === 0 ? (
          <p className="text-sm leading-relaxed text-gray-500">
            Finished analyses stay here. You can show or hide each one on the map without removing it.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {runs.map((run) => (
              <li
                key={run.jobId}
                onClick={() => setActiveId(run.jobId)}
                className={`cursor-pointer rounded-card border px-2.5 py-2 ${
                  run.jobId === activeRun?.jobId && run.record
                    ? 'border-emerald-500 bg-emerald-50/50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={run.selected}
                    onChange={() => {
                      if (!run.selected) setActiveId(run.jobId);
                      onToggleSelected(run.jobId);
                    }}
                    aria-label={`Include ${run.title} in a later comparison`}
                    className="mt-1 accent-emerald-600"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="break-words text-sm font-medium text-gray-900">{run.title}</p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {run.summary ? `${run.summary} · ` : ''}
                      {formatRunTime(run.addedAt)}
                    </p>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onToggleVisible(run.jobId)}
                    className="inline-flex items-center gap-1 rounded px-1.5 py-1 text-xs font-medium text-gray-700 hover:bg-white"
                    aria-pressed={run.visible}
                  >
                    {run.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                    {run.visible ? 'On map' : 'Hidden'}
                  </button>
                  {run.pngUrl && (
                    <a
                      href={run.pngUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded px-1.5 py-1 text-xs font-medium text-emerald-700 hover:bg-white"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download PNG
                    </a>
                  )}
                  {run.tifUrl && (
                    <a
                      href={run.tifUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded px-1.5 py-1 text-xs font-medium text-emerald-700 hover:bg-white"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download TIFF
                    </a>
                  )}
                  {run.record && (
                    <button
                      type="button"
                      disabled={packagingId === run.jobId}
                      onClick={() => {
                        setPackagingId(run.jobId);
                        downloadRunPackage(run).finally(() => setPackagingId(null));
                      }}
                      className="inline-flex items-center gap-1 rounded px-1.5 py-1 text-xs font-medium text-emerald-700 hover:bg-white disabled:opacity-60"
                    >
                      <Download className="h-3.5 w-3.5" />
                      {packagingId === run.jobId ? 'Preparing package…' : 'Download package'}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onRemove(run.jobId)}
                    className="ml-auto inline-flex items-center gap-1 rounded px-1.5 py-1 text-xs font-medium text-gray-500 hover:bg-white hover:text-red-700"
                    aria-label={`Remove ${run.title}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CollapsibleSection>

      {activeRun?.record && (
        <CollapsibleSection
          id="run-analysis"
          title="Run analysis"
          hint={activeRun.title}
          bodyClassName="pt-1"
        >
          {activeRun.analysis ? (
            <RunAnalysisView analysis={activeRun.analysis} record={activeRun.record} />
          ) : (
            <p className="rounded-card border border-dashed border-gray-300 bg-gray-50 px-2.5 py-3 text-sm leading-relaxed text-gray-500">
              This run has no analysis. Runs made before the tool wrote one, or by a service
              that has not been republished, do not include it.
            </p>
          )}
        </CollapsibleSection>
      )}

      <CollapsibleSection
        id="post-hoc-analysis"
        title="Post-hoc analysis"
        hint={selected.length > 0 ? `${selected.length} selected` : undefined}
        bodyClassName="pt-1"
      >
        <p className="text-sm leading-relaxed text-gray-600">
          Check runs above to mark them for a comparison. The tools themselves are not built yet.
        </p>
        <div className="mt-2 rounded-card border border-dashed border-gray-300 bg-gray-50 px-2.5 py-3">
          {selected.length === 0 ? (
            <p className="text-sm text-gray-500">No runs selected.</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {selected.map((run) => (
                <li key={run.jobId} className="truncate text-sm text-gray-800">
                  {run.title}
                </li>
              ))}
            </ul>
          )}
        </div>
      </CollapsibleSection>
      </div>
    </aside>
  );
}
