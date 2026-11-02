// ============================================================================
// SdmDownloadDialog — tick the model runs and analyses to save, then download
// them together as one zip. Runs are listed by species.
// ============================================================================

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Download, Loader2, X } from 'lucide-react';
import { experienceUi } from './experienceUi';
import { DOWNLOAD_KINDS, downloadGroups } from './sdm/downloadGroups';
import { buildSdmPackage, hasSdmFiles } from './sdm/sdmPackage';
import { SpeciesSwatch } from './sdm/SpeciesSwatch';
import { saveBlob } from './suitability/resultsPackage';
import { runDisplayTitle, runKind } from './sdmRuns';
import type { CompletedRun, SdmRunKind } from './types';

const KIND_HEADINGS: Record<SdmRunKind, string> = {
  model: 'Model runs',
  comparison: 'Comparisons',
  common: 'Common areas',
};

interface SdmDownloadDialogProps {
  runs: CompletedRun[];
  /** Each species' color on the map, by scientific name. */
  speciesColors?: Record<string, string>;
  /** Runs already ticked when the dialog opens. */
  initialRunIds?: string[];
  onClose: () => void;
}

function formatRunTime(addedAt: number): string {
  return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(addedAt);
}

export function SdmDownloadDialog({
  runs,
  speciesColors = {},
  initialRunIds = [],
  onClose,
}: SdmDownloadDialogProps) {
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const [checked, setChecked] = useState<Set<string>>(() => new Set(initialRunIds));
  const [isBuilding, setIsBuilding] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [missing, setMissing] = useState<string[]>([]);

  useEffect(() => {
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const groups = useMemo(() => downloadGroups(runs), [runs]);
  const available = useMemo(() => runs.filter((run) => runKind(run) && hasSdmFiles(run)), [runs]);
  // Runs removed since they were ticked drop out of the count.
  const selected = available.filter((run) => checked.has(run.jobId));

  const toggle = (jobId: string) =>
    setChecked((current) => {
      const next = new Set(current);
      if (next.has(jobId)) next.delete(jobId);
      else next.add(jobId);
      return next;
    });

  const setMany = (jobIds: string[], on: boolean) =>
    setChecked((current) => {
      const next = new Set(current);
      for (const jobId of jobIds) {
        if (on) next.add(jobId);
        else next.delete(jobId);
      }
      return next;
    });

  const handleDownload = async () => {
    setIsBuilding(true);
    setNote(null);
    setMissing([]);
    try {
      const result = await buildSdmPackage(selected);
      if (!result) {
        setNote('None of the chosen runs has files to save.');
        return;
      }
      saveBlob(result.blob, result.filename);
      if (result.missing.length > 0) {
        setMissing(result.missing);
        setNote(
          `${result.missing.length} file${result.missing.length === 1 ? '' : 's'} could not be fetched, so ${
            result.missing.length === 1 ? 'it is' : 'they are'
          } not in the zip. They are listed in missing-files.txt with their links.`,
        );
      }
    } catch (caught) {
      const reason = caught instanceof Error ? caught.message : String(caught);
      console.error('SDM results package failed', caught);
      setNote(`The download could not be built (${reason}).`);
    } finally {
      setIsBuilding(false);
    }
  };

  const emptyMessage = (
    <p className="rounded-card border border-dashed border-gray-300 bg-gray-50 px-3 py-3 text-sm leading-relaxed text-gray-500">
      Finished model runs and analyses are listed here, by species, so you can save them together.
    </p>
  );

  // Portaled to the body so the sidebar's scaling and clipping do not affect it.
  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/55 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sdm-download-title"
      onClick={onClose}
    >
      <div
        id="sdm-download-dialog"
        className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-3 border-b border-gray-200 px-4 py-3">
          <div className="min-w-0">
            <h2 id="sdm-download-title" className="text-sm font-semibold text-gray-900">
              Download results
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-gray-500">
              Pick the model runs and analyses to save. They download together as one zip.
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
            aria-label="Close download"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        {groups.length === 0 ? (
          <div className="px-4 py-4">{emptyMessage}</div>
        ) : (
          <>
            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-gray-900">
          Runs <span className="font-normal text-gray-500">({selected.length} chosen)</span>
        </span>
        <span className="flex gap-3 text-xs font-medium">
          <button
            type="button"
            className="text-emerald-700 hover:text-emerald-800"
            onClick={() => setMany(available.map((run) => run.jobId), true)}
          >
            Select all
          </button>
          <button
            type="button"
            className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
            disabled={selected.length === 0}
            onClick={() => setChecked(new Set())}
          >
            Clear
          </button>
        </span>
      </div>

      <div className="flex flex-col gap-4">
        {groups.map((group) => {
          const groupRuns = DOWNLOAD_KINDS.flatMap((kind) => group.runs[kind]).filter(hasSdmFiles);
          const allChosen = groupRuns.length > 0 && groupRuns.every((run) => checked.has(run.jobId));
          return (
            <div key={group.key} role="group" aria-label={group.label}>
              <div className="mb-1.5 flex items-center gap-2 rounded bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-800">
                <SpeciesSwatch color={speciesColors[group.key]} />
                <span className="min-w-0 flex-1 break-words">{group.label}</span>
                <button
                  type="button"
                  className="shrink-0 text-emerald-700 hover:text-emerald-900"
                  onClick={() => setMany(groupRuns.map((run) => run.jobId), !allChosen)}
                >
                  {allChosen ? 'Clear' : 'Select all'}
                </button>
              </div>

              {DOWNLOAD_KINDS.map((kind) => {
                const items = group.runs[kind];
                if (items.length === 0) return null;
                return (
                  <div key={kind} className="mb-2 last:mb-0">
                    <p className="mb-1 pl-1 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                      {KIND_HEADINGS[kind]}
                    </p>
                    <ul className="flex flex-col gap-1.5">
                      {items.map((run) => {
                        const ready = hasSdmFiles(run);
                        return (
                          <li key={run.jobId}>
                            <label
                              className={`flex items-start gap-2 text-sm ${
                                ready ? 'text-gray-800' : 'text-gray-400'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={checked.has(run.jobId)}
                                disabled={!ready}
                                onChange={() => toggle(run.jobId)}
                                className="mt-0.5 h-4 w-4 flex-shrink-0 accent-emerald-600"
                              />
                              <span className="min-w-0 break-words">
                                {runDisplayTitle(run)}{' '}
                                <span className="text-xs text-gray-500">
                                  · {formatRunTime(run.addedAt)}
                                </span>
                              </span>
                            </label>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

            </div>

            <footer className="flex flex-col gap-3 border-t border-gray-200 px-4 py-3">
      <p className={experienceUi.hint}>
        Each run is saved with its maps (GeoTIFF and image), its figures as JSON and CSV, and, for
        probability runs, its distribution as a CSV and a chart. Runs are filed by species. A
        result that combines species is saved once, under "Several species".
      </p>

      {note && (
        <div className={experienceUi.error}>
          <p>{note}</p>
          {missing.length > 0 && (
            <ul className="mt-1 list-disc pl-4 text-xs">
              {missing.slice(0, 5).map((entry) => (
                <li key={entry} className="break-words">
                  {entry.split('\r\n')[0]}
                </li>
              ))}
              {missing.length > 5 && <li>and {missing.length - 5} more</li>}
            </ul>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={handleDownload}
        disabled={selected.length === 0 || isBuilding}
        className={experienceUi.runBtn}
      >
        {isBuilding ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Preparing…
          </>
        ) : (
          <>
            <Download className="h-3.5 w-3.5" />{' '}
            {selected.length === 0
              ? 'Download'
              : `Download ${selected.length} ${selected.length === 1 ? 'run' : 'runs'}`}
          </>
        )}
      </button>
            </footer>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
