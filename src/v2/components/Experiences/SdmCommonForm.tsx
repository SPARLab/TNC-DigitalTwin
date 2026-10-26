// ============================================================================
// SdmCommonForm — find where several model runs are all suitable at once
// (Find Common Suitable Areas tool).
//
// Typical use: one species across climate scenarios or time periods, to see the
// habitat that stays suitable in every one of them. The runs are ticked from
// the model runs kept beside the map.
// ============================================================================

import { useCallback, useState } from 'react';
import { Layers, Loader2 } from 'lucide-react';
import { DEFAULT_SDM_INPUTS, GP_SERVICES, SDM_COMPARE_DEFAULTS } from '../../config/geoprocessing';
import { submitGpJob } from '../../services/geoprocessingService';
import { experienceUi } from './experienceUi';
import { GpJobStatus } from './GpJobStatus';
import { SpeciesSwatch } from './sdm/SpeciesSwatch';
import { SERIES_COLORS, SdmDistributionChart, type DistributionSeries } from './sdm/SdmDistributionChart';
import {
  commonProblem,
  commonTitle,
  formatThresholdValue,
  inputRunOf,
  isValidThreshold,
  modelRuns,
  modelThreshold,
  modelThresholdList,
  outputName,
  runScenario,
  runSpeciesKey,
  runSpeciesLabel,
  sharedSpecies,
  spansSpecies,
} from './sdmRuns';
import type { CompletedRun, GpJobRecord, ResultLayerInfo } from './types';

interface SdmCommonFormProps {
  token: string | null;
  runs: CompletedRun[];
  onLayerAdded?: (info: ResultLayerInfo) => void;
  /** Each species' color on the map, by scientific name. */
  speciesColors?: Record<string, string>;
}

type ThresholdMode = 'single' | 'model';

interface SpeciesGroup {
  key: string;
  label: string;
  runs: CompletedRun[];
}

/** The runs under one heading per species, keeping the newest-first order. */
function groupBySpecies(runs: CompletedRun[]): SpeciesGroup[] {
  const groups = new Map<string, SpeciesGroup>();
  for (const run of runs) {
    const key = runSpeciesKey(run) ?? '';
    const group = groups.get(key) ?? { key, label: runSpeciesLabel(run) ?? 'Other runs', runs: [] };
    group.runs.push(run);
    groups.set(key, group);
  }
  return [...groups.values()];
}

export function SdmCommonForm({ token, runs, onLayerAdded, speciesColors = {} }: SdmCommonFormProps) {
  const options = modelRuns(runs);
  const [chosenIds, setChosenIds] = useState<string[]>([]);
  const [mode, setMode] = useState<ThresholdMode>('single');
  const [threshold, setThreshold] = useState(String(SDM_COMPARE_DEFAULTS.threshold));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [job, setJob] = useState<GpJobRecord | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Keep the list's order (newest first) so thresholds line up with the runs.
  const chosen = options.filter((run) => chosenIds.includes(run.jobId));
  // The checklist is grouped under a heading for each species.
  const groups = groupBySpecies(options);
  const chosenType = chosen[0]?.outputType ?? null;
  const problem = chosen.length > 0 ? commonProblem(chosen) : null;
  const isProbability = chosenType === 'Probability';
  const ownThresholds = isProbability ? modelThresholdList(chosen) : null;
  const useModelThresholds = isProbability && mode === 'model' && ownThresholds != null;
  const showModelList = useModelThresholds;
  const thresholdValue = Number(threshold);
  const thresholdOk = !isProbability || useModelThresholds || isValidThreshold(thresholdValue);
  const canRun = chosen.length >= 2 && !problem && thresholdOk && !isSubmitting;

  // One line per chosen run showing how its probabilities are spread, so the
  // threshold can be judged against them.
  const mixedSpecies = spansSpecies(chosen.map(inputRunOf));
  const series: DistributionSeries[] = isProbability
    ? chosen.flatMap((run, index) => {
        const histogram = run.sdmSummary?.histogram;
        if (!histogram) return [];
        const species = runSpeciesLabel(run);
        return [
          {
            id: run.jobId,
            label: mixedSpecies && species ? `${species} · ${runScenario(run)}` : runScenario(run),
            color: SERIES_COLORS[index % SERIES_COLORS.length],
            histogram,
            threshold: useModelThresholds ? modelThreshold(run) : undefined,
          },
        ];
      })
    : [];

  const toggle = (jobId: string) =>
    setChosenIds((current) =>
      current.includes(jobId) ? current.filter((id) => id !== jobId) : [...current, jobId],
    );

  const handleRun = useCallback(async () => {
    if (chosen.length < 2 || commonProblem(chosen)) return;
    setIsSubmitting(true);
    setError(null);
    setJob(null);

    const title = commonTitle(chosen);
    const shared = sharedSpecies(chosen);

    try {
      const jobId = await submitGpJob(
        GP_SERVICES.sdmRandomForest.url,
        GP_SERVICES.sdmRandomForest.commonTask,
        {
          // A multi-value input is a JSON array of strings.
          runs: JSON.stringify(chosen.map((run) => run.jobId)),
          output_raster: outputName('sdm_common'),
          preserve_boundary: DEFAULT_SDM_INPUTS.preserveBoundary,
          // Binary runs are already suitable or not, so the tool ignores these.
          ...(isProbability
            ? useModelThresholds && ownThresholds
              ? { run_thresholds: ownThresholds }
              : { threshold: String(thresholdValue) }
            : {}),
        },
        token,
        'common areas',
      );

      setJob({
        id: jobId,
        status: 'esriJobSubmitted',
        summary: title,
        defaultFilename: 'SDM_Common_Areas.tif',
        jobsDirectory: GP_SERVICES.sdmRandomForest.jobsDirectory,
        filenamePattern: 'raster-written',
        result: {
          jobId,
          mapServerUrl: GP_SERVICES.sdmRandomForest.mapServer,
          groupTitle: title,
          title,
          kind: 'common',
          outputType: chosen[0].outputType,
          species: shared?.species,
          speciesKey: shared?.speciesKey,
          inputRuns: chosen.map(inputRunOf),
        },
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setIsSubmitting(false);
    }
  }, [chosen, isProbability, ownThresholds, thresholdValue, token, useModelThresholds]);

  const status = job && (
    <GpJobStatus
      job={job}
      showDownloads={false}
      serviceUrl={GP_SERVICES.sdmRandomForest.url}
      task={GP_SERVICES.sdmRandomForest.commonTask}
      token={token}
      onLayerAdded={onLayerAdded}
    />
  );

  if (options.length < 2) {
    return (
      <div className={experienceUi.panel}>
        <p className="rounded-card border border-dashed border-gray-300 bg-gray-50 px-3 py-3 text-sm leading-relaxed text-gray-500">
          Run the model at least twice first, using the steps on the left. Finished runs can then
          be chosen here.
        </p>
        {status}
      </div>
    );
  }

  return (
    <div id="sdm-common-form" className={experienceUi.panel}>
      <fieldset className={experienceUi.section}>
        <legend className="mb-1 text-sm font-semibold text-gray-900">
          Runs <span className="font-normal text-gray-500">({chosen.length} chosen)</span>
        </legend>
        <div className="flex flex-col gap-3">
          {groups.map((group) => (
            <div key={group.key} role="group" aria-label={group.label}>
              <div className="mb-1.5 flex items-center gap-2 break-words rounded bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-800">
                <SpeciesSwatch color={speciesColors[group.key]} />
                <span className="min-w-0">{group.label}</span>
              </div>
              <ul className="flex flex-col gap-1.5">
                {group.runs.map((run) => {
                  const checked = chosenIds.includes(run.jobId);
                  // Once a run is chosen, only runs of the same output type can join it.
                  const mismatched =
                    chosenType != null && run.outputType !== chosenType && !checked;
                  return (
                    <li key={run.jobId}>
                      <label
                        className={`flex items-start gap-2 text-sm ${
                          mismatched ? 'text-gray-400' : 'text-gray-800'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={mismatched}
                          onChange={() => toggle(run.jobId)}
                          className="mt-0.5 h-4 w-4 flex-shrink-0 accent-emerald-600"
                        />
                        <span className="min-w-0 break-words">
                          {runScenario(run)}{' '}
                          <span className="text-xs text-gray-500">({run.outputType})</span>
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
        <p className={experienceUi.hint}>
          Every run must have the same output type, Probability or Binary.
        </p>
      </fieldset>

      {isProbability && (
        <div className={experienceUi.section}>
          <span className={experienceUi.label}>Suitability Threshold</span>
          <div role="group" aria-label="Threshold source" className={experienceUi.toggleGroup}>
            {(
              [
                ['single', 'One for all runs'],
                ['model', "Each run's own"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setMode(value)}
                className={`${experienceUi.toggleBtn} ${
                  mode === value ? experienceUi.toggleBtnActive : ''
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {showModelList && ownThresholds && (
            <ul className={experienceUi.hint}>
              {chosen.map((run) => (
                <li key={run.jobId} className="flex justify-between gap-3">
                  <span className="min-w-0 truncate">{run.scenario || run.title}</span>
                  <span className="tabular-nums">
                    {formatThresholdValue(modelThreshold(run) as number)}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {mode === 'model' && !ownThresholds && chosen.length > 0 && (
            <p className="text-sm leading-relaxed text-amber-700">
              Some of these runs have no stored model threshold, so the single threshold below is
              used for all of them.
            </p>
          )}

          {!showModelList && (
            <>
              <input
                id="sdm-common-threshold"
                type="number"
                inputMode="decimal"
                aria-label="Suitability threshold"
                min={0.01}
                max={1}
                step={0.05}
                value={threshold}
                onChange={(event) => setThreshold(event.target.value)}
                aria-invalid={!thresholdOk}
                className={experienceUi.input}
              />
              {!thresholdOk && (
                <p className="text-sm text-red-700">Enter a number above 0 and up to 1.</p>
              )}
              <p className={experienceUi.hint}>
                A cell counts as suitable in a run at or above this probability.
              </p>
            </>
          )}

          {series.length > 0 && (
            <SdmDistributionChart
              series={series}
              threshold={useModelThresholds || !thresholdOk ? null : thresholdValue}
            />
          )}
          {isProbability && series.length < chosen.length && (
            <p className={experienceUi.hint}>
              Some chosen runs have no stored distribution, so they are left off the chart.
            </p>
          )}
        </div>
      )}

      {problem && <div className={experienceUi.error}>{problem}</div>}
      {error && <div className={experienceUi.error}>{error}</div>}

      <button type="button" onClick={handleRun} disabled={!canRun} className={experienceUi.runBtn}>
        {isSubmitting ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Submitting…
          </>
        ) : (
          <>
            <Layers className="h-3.5 w-3.5" /> Find Common Areas
          </>
        )}
      </button>

      {status}
    </div>
  );
}
