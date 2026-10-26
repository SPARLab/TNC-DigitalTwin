// ============================================================================
// SDMPanel — the Random Forest habitat model as a four-step wizard:
//   1. Overview   what the model is and how a run works
//   2. Species    choose a species, optionally map its records
//   3. Scenario   choose one or more climates, optionally map their variables
//   4. Output     probability or binary, then run
//
// A run trains the species' model once (or reuses the one already trained this
// session), then predicts it onto each chosen climate one after another.
// Finished runs are analyzed from the right-hand panel (SdmRunsPanel).
// ============================================================================

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  DEFAULT_SDM_INPUTS,
  GP_SERVICES,
  SDM_PREDICTOR_VARIABLES,
  SDM_TRAINING_MOSAIC_URL,
  climateMosaicUrl,
} from '../../config/geoprocessing';
import { fetchGpResultValue, submitGpJob } from '../../services/geoprocessingService';
import { formatSpeciesLabel } from '../../../services/speciesNamesService';
import { experienceUi } from './experienceUi';
import { GpJobStatus } from './GpJobStatus';
import { SdmIntroStep } from './sdm/SdmIntroStep';
import { SdmOutputStep } from './sdm/SdmOutputStep';
import { SdmScenarioStep } from './sdm/SdmScenarioStep';
import { SdmSpeciesStep } from './sdm/SdmSpeciesStep';
import {
  DEFAULT_SCENARIO_KEY,
  SCENARIO_CHOICES,
  climatePreviewAction,
  findScenarioChoice,
  type ScenarioChoice,
} from './sdm/climatePreview';
import type {
  GpJobRecord,
  PointsAction,
  PreviewAction,
  ResultLayerInfo,
  SdmOutputType,
} from './types';
import { WizardStepIndicator } from './WizardStepIndicator';

type SdmStep = 'intro' | 'species' | 'scenario' | 'output';

const STEP_META: Array<{ id: SdmStep; label: string }> = [
  { id: 'intro', label: 'Overview' },
  { id: 'species', label: 'Species' },
  { id: 'scenario', label: 'Scenario' },
  { id: 'output', label: 'Output' },
];

const TERMINAL_STATUSES = new Set([
  'esriJobSucceeded',
  'esriJobFailed',
  'esriJobCancelled',
  'esriJobTimedOut',
]);

/** One job in a run: the model fit, or the prediction onto one climate. */
interface QueuedJob {
  key: string;
  kind: 'train' | 'predict';
  label: string;
  /** Null until the job is submitted. */
  record: GpJobRecord | null;
  skipped?: boolean;
}

/** A model trained this session, kept so the next run does not fit it again. */
interface TrainedModel {
  species: string;
  modelId: string;
  trainedAt: number;
}

interface SDMPanelProps {
  token: string | null;
  onLayerAdded?: (info: ResultLayerInfo) => void;
  onTogglePoints?: (action: PointsAction) => void;
  /** Species whose records are on the map. */
  pointsOnMap?: string[];
  /** Draws (or removes) a climate variable on the map. */
  onPreviewLayer?: (action: PreviewAction) => void;
}

function sanitizeOutputName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_\- ]/g, '').trim().replace(/\s+/g, '_');
}

function formatTime(value: number): string {
  return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(value);
}

export function SDMPanel({
  token,
  onLayerAdded,
  onTogglePoints,
  pointsOnMap,
  onPreviewLayer,
}: SDMPanelProps) {
  const service = GP_SERVICES.sdmRandomForest;
  const [step, setStep] = useState<SdmStep>('intro');
  const [species, setSpecies] = useState('');
  const [commonName, setCommonName] = useState<string | null>(null);
  const [selectedKeys, setSelectedKeys] = useState<ReadonlySet<string>>(
    new Set([DEFAULT_SCENARIO_KEY]),
  );
  const [previewKey, setPreviewKey] = useState(DEFAULT_SCENARIO_KEY);
  const [outputType, setOutputType] = useState<SdmOutputType>('Probability');
  const [previewedTags, setPreviewedTags] = useState<ReadonlySet<string>>(new Set());
  const [trained, setTrained] = useState<TrainedModel | null>(null);
  const [retrain, setRetrain] = useState(false);
  const [queue, setQueue] = useState<QueuedJob[]>([]);
  const [progress, setProgress] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stopRef = useRef(false);
  const waitersRef = useRef(new Map<string, (status: string) => void>());
  useEffect(
    () => () => {
      // Leaving the panel stops a run from starting more jobs.
      stopRef.current = true;
    },
    [],
  );

  const speciesLabel = species ? formatSpeciesLabel(species, commonName) : '';
  // In display order, not the order they were ticked.
  const choices = useMemo(
    () => SCENARIO_CHOICES.filter((choice) => selectedKeys.has(choice.key)),
    [selectedKeys],
  );
  const reusableModel = trained && trained.species === species ? trained : null;
  const preview = findScenarioChoice(previewKey);

  const variableOptions = useCallback(
    (tag: string, choice: ScenarioChoice) => ({
      tag,
      label: SDM_PREDICTOR_VARIABLES.find((variable) => variable.tag === tag)?.label ?? tag,
      scenario: choice.scenario,
      period: choice.period,
    }),
    [],
  );

  const handlePreviewKeyChange = (nextKey: string) => {
    if (onPreviewLayer && previewedTags.size > 0) {
      const next = findScenarioChoice(nextKey);
      // Move the variables already on the map over to the other climate.
      for (const tag of previewedTags) {
        onPreviewLayer(climatePreviewAction('remove', variableOptions(tag, preview)));
        onPreviewLayer(climatePreviewAction('add', variableOptions(tag, next)));
      }
    }
    setPreviewKey(nextKey);
  };

  const handleTogglePreview = (tag: string) => {
    const shown = previewedTags.has(tag);
    onPreviewLayer?.(climatePreviewAction(shown ? 'remove' : 'add', variableOptions(tag, preview)));
    setPreviewedTags((current) => {
      const next = new Set(current);
      if (shown) next.delete(tag);
      else next.add(tag);
      return next;
    });
  };

  const handleToggleScenario = (key: string) => {
    setSelectedKeys((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  /** Resolves when a job reaches its final state. Register before it can finish. */
  const waitForJob = (jobId: string) =>
    new Promise<string>((resolve) => {
      waitersRef.current.set(jobId, resolve);
    });

  const handleJobStatus = useCallback((jobId: string, status: string) => {
    if (!TERMINAL_STATUSES.has(status)) return;
    waitersRef.current.get(jobId)?.(status);
    waitersRef.current.delete(jobId);
  }, []);

  const attachRecord = (key: string, record: GpJobRecord) =>
    setQueue((current) => current.map((job) => (job.key === key ? { ...job, record } : job)));

  const handleRun = async () => {
    if (!species || choices.length === 0 || isRunning) return;
    setIsRunning(true);
    setError(null);
    stopRef.current = false;

    const plan: QueuedJob[] = [];
    const reuse = reusableModel && !retrain ? reusableModel : null;
    if (!reuse) {
      plan.push({
        key: 'train',
        kind: 'train',
        label: `${speciesLabel} · training the model`,
        record: null,
      });
    }
    for (const choice of choices) {
      plan.push({ key: choice.key, kind: 'predict', label: choice.label, record: null });
    }
    setQueue(plan);

    try {
      let modelId = reuse?.modelId ?? null;

      if (!modelId) {
        setProgress('Training the model…');
        const trainJobId = await submitGpJob(
          service.url,
          service.trainTask,
          {
            occurrences: DEFAULT_SDM_INPUTS.occurrences,
            species,
            // Always the current climate; a future scenario is only predicted onto.
            predictors: SDM_TRAINING_MOSAIC_URL,
            background_points: DEFAULT_SDM_INPUTS.backgroundPoints,
          },
          token,
          'species model training',
        );
        const trainDone = waitForJob(trainJobId);
        attachRecord('train', {
          id: trainJobId,
          status: 'esriJobSubmitted',
          summary: speciesLabel,
          scenario: 'training the model',
          defaultFilename: 'model.txt',
          jobsDirectory: service.jobsDirectory,
          filenamePattern: 'raster-written',
          result: {
            jobId: trainJobId,
            mapServerUrl: service.mapServer,
            groupTitle: speciesLabel,
            title: `${speciesLabel} model`,
          },
        });
        const trainStatus = await trainDone;
        if (trainStatus !== 'esriJobSucceeded') {
          throw new Error('The model could not be trained. See the messages above.');
        }
        const reported = await fetchGpResultValue(
          service.url,
          service.trainTask,
          trainJobId,
          'model_id',
          token,
        ).catch(() => null);
        // On the server a model's id is the id of the job that trained it.
        modelId = typeof reported === 'string' && reported ? reported : trainJobId;
        setTrained({ species, modelId, trainedAt: Date.now() });
        setRetrain(false);
      }

      for (let index = 0; index < choices.length; index += 1) {
        const choice = choices[index];
        if (stopRef.current) {
          const remaining = new Set(choices.slice(index).map((item) => item.key));
          setQueue((current) =>
            current.map((job) =>
              job.kind === 'predict' && remaining.has(job.key) ? { ...job, skipped: true } : job,
            ),
          );
          break;
        }
        setProgress(`Mapping ${index + 1} of ${choices.length}…`);

        const stackUrl = climateMosaicUrl(choice.scenario, choice.period);
        const jobId = await submitGpJob(
          service.url,
          service.predictTask,
          {
            model_id: modelId,
            ...(stackUrl !== SDM_TRAINING_MOSAIC_URL ? { projection_predictors: stackUrl } : {}),
            preserve_boundary: DEFAULT_SDM_INPUTS.preserveBoundary,
            output_type: outputType,
            output_raster: sanitizeOutputName(species),
          },
          token,
          'species distribution',
        );
        const done = waitForJob(jobId);
        attachRecord(choice.key, {
          id: jobId,
          status: 'esriJobSubmitted',
          summary: speciesLabel,
          scenario: choice.label,
          defaultFilename: 'Habitat_Suitability.tif',
          jobsDirectory: service.jobsDirectory,
          filenamePattern: 'raster-written',
          result: {
            jobId,
            mapServerUrl: service.mapServer,
            groupTitle: speciesLabel,
            title: `${speciesLabel} · ${choice.label}`,
            outputType,
            kind: 'model',
            species: speciesLabel,
            speciesKey: species,
            scenario: choice.label,
          },
        });
        // One at a time: the service runs only a couple of jobs at once.
        await done;
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setProgress(null);
      setIsRunning(false);
    }
  };

  const speciesChosen = species.length > 0;
  const stepEnabled = useMemo(
    () => (id: SdmStep) => id === 'species' || speciesChosen,
    [speciesChosen],
  );

  return (
    <div id="sdm-panel" className={experienceUi.panel}>
      <WizardStepIndicator
        steps={STEP_META}
        step={step}
        onStepChange={setStep}
        label="Species model steps"
        locked={isRunning}
        isStepEnabled={stepEnabled}
      />

      {step === 'intro' && <SdmIntroStep onStart={() => setStep('species')} />}

      {step === 'species' && (
        <SdmSpeciesStep
          species={species}
          onChange={(nextSpecies, nextCommonName) => {
            setSpecies(nextSpecies);
            setCommonName(nextCommonName ?? null);
          }}
          onTogglePoints={onTogglePoints}
          pointsOnMap={pointsOnMap}
          onBack={() => setStep('intro')}
          onContinue={() => setStep('scenario')}
        />
      )}

      {step === 'scenario' && (
        <SdmScenarioStep
          selected={selectedKeys}
          onToggleScenario={handleToggleScenario}
          previewKey={previewKey}
          onPreviewKeyChange={handlePreviewKeyChange}
          previewedTags={previewedTags}
          onTogglePreview={handleTogglePreview}
          previewMosaicUrl={climateMosaicUrl(preview.scenario, preview.period)}
          onBack={() => setStep('species')}
          onContinue={() => setStep('output')}
        />
      )}

      {step === 'output' && (
        <>
          <SdmOutputStep
            outputType={outputType}
            onOutputChange={setOutputType}
            speciesLabel={speciesLabel}
            scenarioLabels={choices.map((choice) => choice.label)}
            reusableModel={reusableModel ? { trainedAt: formatTime(reusableModel.trainedAt) } : null}
            retrain={retrain}
            onRetrainChange={setRetrain}
            isRunning={isRunning}
            progress={progress}
            error={error}
            onBack={() => setStep('scenario')}
            onRun={handleRun}
            onStop={() => {
              stopRef.current = true;
            }}
          />
          {queue.length > 0 && (
            <ul className="flex flex-col gap-2" aria-label="Jobs">
              {queue.map((job) =>
                job.record ? (
                  <li key={job.key}>
                    <GpJobStatus
                      job={job.record}
                      showDownloads={false}
                      serviceUrl={service.url}
                      task={job.kind === 'train' ? service.trainTask : service.predictTask}
                      token={token}
                      onLayerAdded={job.kind === 'predict' ? onLayerAdded : undefined}
                      onStatusChange={(status) => handleJobStatus(job.record!.id, status)}
                    />
                  </li>
                ) : (
                  <li
                    key={job.key}
                    className="rounded-card border border-dashed border-gray-300 px-3 py-2 text-xs text-gray-500"
                  >
                    {job.skipped ? 'Skipped' : 'Waiting'} · {job.label}
                  </li>
                ),
              )}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
