// ============================================================================
// SdmOutputStep — choose probability or binary, review the choices, and run
// the model for every chosen climate.
// ============================================================================

import { ArrowLeft, Loader2, Play } from 'lucide-react';
import { experienceUi } from '../experienceUi';
import type { SdmOutputType } from '../types';
import { SDM_OUTPUT_STEP } from './sdmCopy';

const OPTIONS: ReadonlyArray<{ value: SdmOutputType; label: string; description: string }> = [
  { value: 'Probability', label: 'Probability', description: SDM_OUTPUT_STEP.probability },
  { value: 'Binary', label: 'Binary', description: SDM_OUTPUT_STEP.binary },
];

export interface ReusableModel {
  /** When it was trained, as a time of day. */
  trainedAt: string;
}

interface SdmOutputStepProps {
  outputType: SdmOutputType;
  onOutputChange: (outputType: SdmOutputType) => void;
  /** "Bobcat (Lynx rufus)", or '' before one is chosen. */
  speciesLabel: string;
  scenarioLabels: string[];
  /** A model already trained for this species, which a run reuses. */
  reusableModel: ReusableModel | null;
  retrain: boolean;
  onRetrainChange: (retrain: boolean) => void;
  isRunning: boolean;
  /** "Mapping 2 of 4", while a run is going. */
  progress: string | null;
  error: string | null;
  onBack: () => void;
  onRun: () => void;
  onStop: () => void;
}

export function SdmOutputStep({
  outputType,
  onOutputChange,
  speciesLabel,
  scenarioLabels,
  reusableModel,
  retrain,
  onRetrainChange,
  isRunning,
  progress,
  error,
  onBack,
  onRun,
  onStop,
}: SdmOutputStepProps) {
  const willTrain = !reusableModel || retrain;
  const count = scenarioLabels.length;
  const runLabel = count > 1 ? `Run Model for ${count} Climates` : 'Run Model';

  return (
    <div className="flex min-w-0 flex-col gap-5">
      <div>
        <h3 className={experienceUi.heading}>{SDM_OUTPUT_STEP.title}</h3>
        <p className={`mt-1.5 ${experienceUi.description}`}>{SDM_OUTPUT_STEP.body}</p>
      </div>

      <div role="radiogroup" aria-label="Output type" className="flex flex-col gap-2">
        {OPTIONS.map((option) => {
          const active = outputType === option.value;
          return (
            <label
              key={option.value}
              className={`flex cursor-pointer items-start gap-2.5 rounded-card border px-3 py-2.5 transition-colors ${
                active
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-gray-200 bg-white hover:bg-gray-50'
              } ${isRunning ? 'cursor-not-allowed opacity-60' : ''}`}
            >
              <input
                type="radio"
                name="sdm-output-type"
                value={option.value}
                checked={active}
                disabled={isRunning}
                onChange={() => onOutputChange(option.value)}
                className="mt-1 h-4 w-4 flex-shrink-0 accent-emerald-600"
              />
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-gray-900">{option.label}</span>
                <span className="block text-sm leading-relaxed text-gray-600">
                  {option.description}
                </span>
              </span>
            </label>
          );
        })}
        <p className={experienceUi.hint}>{SDM_OUTPUT_STEP.comparison}</p>
      </div>

      <section className="rounded-card border border-gray-200 bg-gray-50 px-3 py-3">
        <h4 className="text-sm font-semibold text-gray-900">Summary</h4>
        <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
          <dt className="text-gray-500">Species</dt>
          <dd className="break-words text-gray-800">{speciesLabel || 'Not chosen'}</dd>
          <dt className="text-gray-500">{count === 1 ? 'Climate' : 'Climates'}</dt>
          <dd className="text-gray-800">
            {count === 0 ? 'None chosen' : scenarioLabels.join(', ')}
          </dd>
          <dt className="text-gray-500">Output</dt>
          <dd className="text-gray-800">{outputType}</dd>
          <dt className="text-gray-500">Model</dt>
          <dd className="text-gray-800">
            {willTrain
              ? 'A new model is trained first'
              : `Reusing the model trained at ${reusableModel?.trainedAt}`}
          </dd>
        </dl>
        {reusableModel && (
          <label className="mt-2.5 flex cursor-pointer items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={retrain}
              disabled={isRunning}
              onChange={(event) => onRetrainChange(event.target.checked)}
              className="h-4 w-4 accent-emerald-600"
            />
            Train a new model
          </label>
        )}
        <p className={`mt-2 ${experienceUi.hint}`}>{SDM_OUTPUT_STEP.model}</p>
      </section>

      {error && <div className={experienceUi.error}>{error}</div>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onBack}
          disabled={isRunning}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-button border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <button
          type="button"
          onClick={onRun}
          disabled={!speciesLabel || count === 0 || isRunning}
          aria-busy={isRunning}
          className={`flex-[1.4] ${experienceUi.runBtn}`}
        >
          {isRunning ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {progress ?? 'Running…'}
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              {runLabel}
            </>
          )}
        </button>
      </div>
      {isRunning && (
        <button
          type="button"
          onClick={onStop}
          className="self-start text-sm font-medium text-gray-600 underline hover:text-gray-900"
        >
          Stop after the current job
        </button>
      )}
    </div>
  );
}
