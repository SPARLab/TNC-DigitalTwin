// ============================================================================
// RunPicker — choose one finished run from a list, put it on the map, and
// reach its downloads. Shared by every panel that lists runs.
// ============================================================================

import { useState } from 'react';
import { Download, Eye, EyeOff, Trash2 } from 'lucide-react';
import { runKind } from './sdmRuns';
import { buildResultsPackage, hasResults, saveBlob } from './suitability/resultsPackage';
import type { CompletedRun } from './types';

interface RunPickerProps {
  /** The runs offered, newest first. */
  runs: CompletedRun[];
  activeRun: CompletedRun | null;
  /** Heading above the list, such as "Runs" or "Model runs". */
  label: string;
  /** Shown when there is nothing to pick yet. */
  emptyMessage: string;
  /** Id of the select, unique per picker on a page. */
  selectId?: string;
  /** How a run is named in the list. Defaults to its full title. */
  titleOf?: (run: CompletedRun) => string;
  /** Leave out the download buttons, for panels that have a download tab of their own. */
  hideDownloads?: boolean;
  /** Opens a download dialog for this run. Shown when the buttons above are hidden. */
  onDownload?: (jobId: string) => void;
  onSelectRun: (jobId: string) => void;
  onToggleVisible: (jobId: string) => void;
  onRemove: (jobId: string) => void;
}

const ACTION =
  'inline-flex items-center gap-1 rounded px-1.5 py-1 text-xs font-medium hover:bg-gray-100';

function formatRunTime(addedAt: number): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(addedAt);
}

export function RunPicker({
  runs,
  activeRun,
  label,
  emptyMessage,
  selectId = 'completed-runs-select',
  titleOf = (run) => run.title,
  hideDownloads = false,
  onDownload,
  onSelectRun,
  onToggleVisible,
  onRemove,
}: RunPickerProps) {
  const [packagingId, setPackagingId] = useState<string | null>(null);
  const [downloadNote, setDownloadNote] = useState<string | null>(null);
  const kind = activeRun ? runKind(activeRun) : null;
  // A comparison or common-areas result publishes several GeoTIFFs, so each one
  // gets its own link instead of the single-raster results package.
  const isDerived = kind === 'comparison' || kind === 'common';

  return (
    <section id="completed-runs-picker" className="shrink-0 border-b border-gray-200 px-3 py-3">
      <label
        htmlFor={selectId}
        className="block text-[10px] font-semibold uppercase tracking-wide text-gray-500"
      >
        {label}
        {runs.length > 0 ? ` (${runs.length})` : ''}
      </label>

      {!activeRun ? (
        <p className="mt-1.5 text-sm leading-relaxed text-gray-500">{emptyMessage}</p>
      ) : (
        <>
          <select
            id={selectId}
            value={activeRun.jobId}
            onChange={(event) => {
              setDownloadNote(null);
              onSelectRun(event.target.value);
            }}
            className="mt-1.5 w-full min-w-0 rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            {runs.map((run) => (
              <option key={run.jobId} value={run.jobId}>
                {titleOf(run)} · {formatRunTime(run.addedAt)}
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
            {onDownload && (
              <button
                type="button"
                onClick={() => onDownload(activeRun.jobId)}
                title="Choose what to save, and download it as one zip"
                className={`${ACTION} text-emerald-700`}
              >
                <Download className="h-3.5 w-3.5" />
                Download
              </button>
            )}
            {!hideDownloads && !isDerived && hasResults(activeRun) && (
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
          {!hideDownloads && isDerived && activeRun.downloads && activeRun.downloads.length > 0 && (
            <ul className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
              {activeRun.downloads.map((download) => (
                <li key={download.url}>
                  <a
                    href={download.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:text-emerald-800"
                  >
                    <Download className="h-3.5 w-3.5" />
                    {download.label} TIFF
                  </a>
                </li>
              ))}
            </ul>
          )}
          {downloadNote && <p className="mt-1.5 text-xs text-amber-700">{downloadNote}</p>}
        </>
      )}
    </section>
  );
}
