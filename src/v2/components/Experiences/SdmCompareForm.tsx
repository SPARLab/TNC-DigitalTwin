// ============================================================================
// SdmCompareForm — compare two finished model runs (Compare SDM Runs tool).
//
// Shows where suitability rose or fell between run A and run B, and which
// cells crossed a suitability threshold. The runs are picked from the model
// runs kept beside the map, so nothing has to be typed or pasted.
// ============================================================================

import { useCallback, useState } from 'react';
import { GitCompareArrows, Loader2 } from 'lucide-react';
import { DEFAULT_SDM_INPUTS, GP_SERVICES, SDM_COMPARE_DEFAULTS } from '../../config/geoprocessing';
import { submitGpJob } from '../../services/geoprocessingService';
import { experienceUi } from './experienceUi';
import { GpJobStatus } from './GpJobStatus';
import {
  compareProblem,
  compareTitle,
  formatThresholdValue,
  inputRunOf,
  isValidThreshold,
  modelRuns,
  modelThreshold,
  outputName,
  runScenario,
  sharedSpecies,
} from './sdmRuns';
import type { CompletedRun, GpJobRecord, ResultLayerInfo } from './types';

interface SdmCompareFormProps {
  token: string | null;
  runs: CompletedRun[];
  onLayerAdded?: (info: ResultLayerInfo) => void;
}

function runOption(run: CompletedRun): string {
  return `${runScenario(run)} (${run.outputType})`;
}

export function SdmCompareForm({ token, runs, onLayerAdded }: SdmCompareFormProps) {
  const options = modelRuns(runs);
  const [runAId, setRunAId] = useState('');
  const [runBId, setRunBId] = useState('');
  const [threshold, setThreshold] = useState(String(SDM_COMPARE_DEFAULTS.threshold));
  const [minChange, setMinChange] = useState(String(SDM_COMPARE_DEFAULTS.minChange));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [job, setJob] = useState<GpJobRecord | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Runs are listed newest first. Until the user chooses, compare the newest
  // run (B) with the one before it (A).
  const runA = options.find((run) => run.jobId === runAId) ?? options[1];
  const runB = options.find((run) => run.jobId === runBId) ?? options[0];
  const problem = compareProblem(runA, runB);
  const isProbability = runA?.outputType === 'Probability';
  const modelA = runA?.sdmSummary?.model?.model_id;
  const sharedModel = Boolean(modelA) && modelA === runB?.sdmSummary?.model?.model_id;

  const thresholdValue = Number(threshold);
  const minChangeValue = Number(minChange);
  const thresholdOk = !isProbability || isValidThreshold(thresholdValue);
  const minChangeOk = !isProbability || isValidThreshold(minChangeValue);
  const canRun = !problem && thresholdOk && minChangeOk && !isSubmitting;

  const handleRun = useCallback(async () => {
    if (!runA || !runB || problem) return;
    setIsSubmitting(true);
    setError(null);
    setJob(null);

    const title = compareTitle(runA, runB);
    const shared = sharedSpecies([runA, runB]);

    try {
      const jobId = await submitGpJob(
        GP_SERVICES.sdmRandomForest.url,
        GP_SERVICES.sdmRandomForest.compareTask,
        {
          run_a: runA.jobId,
          run_b: runB.jobId,
          output_raster: outputName('sdm_difference'),
          preserve_boundary: DEFAULT_SDM_INPUTS.preserveBoundary,
          // Binary runs are already suitable or not, so the tool ignores both.
          ...(isProbability
            ? { threshold: String(thresholdValue), min_change: String(minChangeValue) }
            : {}),
        },
        token,
        'run comparison',
      );

      setJob({
        id: jobId,
        status: 'esriJobSubmitted',
        summary: title,
        defaultFilename: 'SDM_Difference.tif',
        jobsDirectory: GP_SERVICES.sdmRandomForest.jobsDirectory,
        filenamePattern: 'raster-written',
        result: {
          jobId,
          mapServerUrl: GP_SERVICES.sdmRandomForest.mapServer,
          groupTitle: title,
          title,
          kind: 'comparison',
          outputType: runA.outputType,
          species: shared?.species,
          speciesKey: shared?.speciesKey,
          scenario: `${runScenario(runA)} → ${runScenario(runB)}`,
          inputRuns: [inputRunOf(runA), inputRunOf(runB)],
        },
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setIsSubmitting(false);
    }
  }, [isProbability, minChangeValue, problem, runA, runB, thresholdValue, token]);

  const status = job && (
    <GpJobStatus
      job={job}
      showDownloads={false}
      serviceUrl={GP_SERVICES.sdmRandomForest.url}
      task={GP_SERVICES.sdmRandomForest.compareTask}
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
    <div id="sdm-compare-form" className={experienceUi.panel}>
      <div className={experienceUi.section}>
        <label className={experienceUi.label} htmlFor="sdm-compare-run-a">
          Run A (before)
        </label>
        <select
          id="sdm-compare-run-a"
          value={runA?.jobId ?? ''}
          onChange={(event) => setRunAId(event.target.value)}
          className={experienceUi.input}
        >
          {options.map((run) => (
            <option key={run.jobId} value={run.jobId}>
              {runOption(run)}
            </option>
          ))}
        </select>
      </div>

      <div className={experienceUi.section}>
        <label className={experienceUi.label} htmlFor="sdm-compare-run-b">
          Run B (after)
        </label>
        <select
          id="sdm-compare-run-b"
          value={runB?.jobId ?? ''}
          onChange={(event) => setRunBId(event.target.value)}
          className={experienceUi.input}
        >
          {options.map((run) => (
            <option key={run.jobId} value={run.jobId}>
              {runOption(run)}
            </option>
          ))}
        </select>
        <p className={experienceUi.hint}>Differences are B minus A: blue means more suitable in B.</p>
        {sharedModel && (
          <p className={experienceUi.hint}>
            Both runs use the same trained model, so every difference comes from the climate.
          </p>
        )}
      </div>

      {isProbability && runA && runB && (
        <>
          <div className={experienceUi.section}>
            <label className={experienceUi.label} htmlFor="sdm-compare-threshold">
              Suitability Threshold
            </label>
            <input
              id="sdm-compare-threshold"
              type="number"
              inputMode="decimal"
              min={0.01}
              max={1}
              step={0.05}
              value={threshold}
              onChange={(event) => setThreshold(event.target.value)}
              aria-invalid={!thresholdOk}
              className={experienceUi.input}
            />
            <p className={experienceUi.hint}>
              A cell counts as suitable at or above this probability, in both runs. This only
              decides which cells gained or lost suitability; the difference map does not use it.
            </p>
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm">
              {([['A', runA], ['B', runB]] as const).map(([label, run]) => {
                const own = modelThreshold(run);
                if (own == null) return null;
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setThreshold(formatThresholdValue(own))}
                    className="font-medium text-emerald-700 hover:text-emerald-800"
                  >
                    Use run {label}&apos;s model threshold ({formatThresholdValue(own)})
                  </button>
                );
              })}
            </div>
            {!thresholdOk && (
              <p className="text-sm text-red-700">Enter a number above 0 and up to 1.</p>
            )}
          </div>

          <div className={experienceUi.section}>
            <label className={experienceUi.label} htmlFor="sdm-compare-min-change">
              Minimum Change
            </label>
            <input
              id="sdm-compare-min-change"
              type="number"
              inputMode="decimal"
              min={0.01}
              max={1}
              step={0.01}
              value={minChange}
              onChange={(event) => setMinChange(event.target.value)}
              aria-invalid={!minChangeOk}
              className={experienceUi.input}
            />
            <p className={experienceUi.hint}>
              A cell counts as increased or decreased only if its probability moved by at least this
              much. Smaller shifts are drawn neutral.
            </p>
            {!minChangeOk && (
              <p className="text-sm text-red-700">Enter a number above 0 and up to 1.</p>
            )}
          </div>
        </>
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
            <GitCompareArrows className="h-3.5 w-3.5" /> Compare Runs
          </>
        )}
      </button>

      {status}
    </div>
  );
}
