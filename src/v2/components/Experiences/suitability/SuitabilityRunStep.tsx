// ============================================================================
// SuitabilityRunStep — name the run, review what goes into it, and submit.
// ============================================================================

import { useEffect, useId, useRef, useState } from 'react';
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2, Play } from 'lucide-react';
import { experienceUi } from '../experienceUi';
import {
  RASTER_SCOPE_OPTIONS,
  type CatalogRaster,
  type LayerReclassConfig,
  type RasterScope,
} from '../types';
import { formatResolutionLabel } from './wizardCopy';
import { validateRunName } from './runName';

const RECLASS_LABEL: Record<LayerReclassConfig['type'], string> = {
  continuous: 'Continuous bins',
  categorical: 'Categorical',
  rescale: 'Rescale',
};

function describeReclass(config: LayerReclassConfig): string {
  if (config.type === 'continuous') {
    return `${RECLASS_LABEL.continuous} (${config.bins.length} bins)`;
  }
  if (config.type === 'categorical') {
    return `${RECLASS_LABEL.categorical} (${Object.keys(config.categories).length} classes)`;
  }
  return `${RECLASS_LABEL.rescale}${config.invert ? ', inverted' : ''}`;
}

interface SuitabilityRunStepProps {
  selectedLayers: CatalogRaster[];
  configs: Record<number, LayerReclassConfig>;
  scaleMax: number;
  scope: RasterScope;
  resolution: number | null;
  runName: string;
  /** Names of runs already on the map. A new run cannot reuse one. */
  existingRunNames: string[];
  /** True while submitting or while the submitted job is still running. */
  isRunning: boolean;
  /** True only during the submit request, before a job id exists. */
  isSubmitting: boolean;
  error: string | null;
  onRunNameChange: (value: string) => void;
  onBack: () => void;
  onRun: () => void;
}

export function SuitabilityRunStep({
  selectedLayers,
  configs,
  scaleMax,
  scope,
  resolution,
  runName,
  existingRunNames,
  isRunning,
  isSubmitting,
  error,
  onRunNameChange,
  onBack,
  onRun,
}: SuitabilityRunStepProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const messageId = useId();
  const [touched, setTouched] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  const scopeLabel = RASTER_SCOPE_OPTIONS.find((option) => option.value === scope)?.label ?? scope;
  const layers = selectedLayers.filter((raster) => configs[raster.id]);
  const totalWeight = layers.reduce((sum, raster) => sum + configs[raster.id].weight, 0);

  const nameProblem = validateRunName(runName, existingRunNames);
  const isEmpty = runName.trim().length === 0;
  // A duplicate is flagged as soon as it is typed. An empty name is only an
  // error once the user has left the field or tried to run.
  const showError = nameProblem != null && (touched || !isEmpty);
  const isNameValid = nameProblem == null;

  // Draw the user's eye to the name when they arrive with nothing entered.
  useEffect(() => {
    if (runName.trim().length === 0) inputRef.current?.focus();
    // Only on arrival at this step.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRun = () => {
    if (nameProblem) {
      setTouched(true);
      setIsShaking(true);
      inputRef.current?.focus();
      return;
    }
    onRun();
  };

  const inputTone = showError
    ? 'border-red-400 bg-red-50 focus:border-red-500'
    : isNameValid
      ? 'border-emerald-400 focus:border-emerald-500'
      : 'border-amber-400 bg-amber-50/60 focus:border-emerald-500';

  return (
    <div className="flex min-w-0 flex-col gap-5">
      <div>
        <h3 className={experienceUi.heading}>Run</h3>
        <p className={`mt-1.5 ${experienceUi.description}`}>
          Name this analysis, check what goes into it, then run it. The result
          is added to the map and listed under completed runs.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${messageId}-name`} className="flex items-center gap-1.5 text-sm font-medium text-gray-800">
          Run name
          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
            Required
          </span>
        </label>
        <div
          className={isShaking ? 'animate-run-name-shake' : undefined}
          onAnimationEnd={() => setIsShaking(false)}
        >
          <input
            ref={inputRef}
            id={`${messageId}-name`}
            type="text"
            value={runName}
            onChange={(event) => onRunNameChange(event.target.value)}
            onBlur={() => setTouched(true)}
            placeholder="e.g. Grazing suitability – county, 1 km"
            disabled={isRunning}
            maxLength={80}
            aria-required="true"
            aria-invalid={showError}
            aria-describedby={`${messageId}-message`}
            className={`min-w-0 w-full rounded-button border px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 ${inputTone}`}
          />
        </div>
        <p
          id={`${messageId}-message`}
          role={showError ? 'alert' : undefined}
          className={`flex items-start gap-1.5 text-sm leading-relaxed ${
            showError ? 'text-red-700' : isNameValid ? 'text-emerald-700' : 'text-amber-800'
          }`}
        >
          {showError ? (
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          ) : isNameValid ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />
          ) : (
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          )}
          <span>
            {showError
              ? nameProblem
              : isNameValid
                ? 'Name is available.'
                : 'Give this run a name so you can find it on the map and compare it later.'}
          </span>
        </p>
      </div>

      <section className="rounded-card border border-gray-200 bg-gray-50 px-3 py-3">
        <h4 className="text-sm font-semibold text-gray-900">Summary</h4>
        <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
          <dt className="text-gray-500">Extent</dt>
          <dd className="text-gray-800">{scopeLabel}</dd>
          <dt className="text-gray-500">Resolution</dt>
          <dd className="text-gray-800">
            {resolution != null ? formatResolutionLabel(resolution) : 'Not set'}
          </dd>
          <dt className="text-gray-500">Output scale</dt>
          <dd className="text-gray-800">1–{scaleMax}</dd>
          <dt className="text-gray-500">Layers</dt>
          <dd className="text-gray-800">{layers.length}</dd>
        </dl>

        {layers.length > 0 && (
          <ul className="mt-3 flex flex-col divide-y divide-gray-200 border-t border-gray-200">
            {layers.map((raster) => {
              const config = configs[raster.id];
              const share = totalWeight > 0 ? Math.round((config.weight / totalWeight) * 100) : 0;
              return (
                <li key={raster.id} className="py-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="min-w-0 break-words text-sm font-medium text-gray-900">
                      {raster.title}
                    </span>
                    <span className="flex-shrink-0 text-xs font-semibold text-emerald-700">
                      weight {config.weight} · {share}%
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-gray-500">{describeReclass(config)}</p>
                </li>
              );
            })}
          </ul>
        )}
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
          onClick={handleRun}
          disabled={layers.length === 0 || isRunning}
          aria-busy={isRunning}
          className={`flex-[1.4] ${experienceUi.runBtn}`}
        >
          {isRunning ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {isSubmitting ? 'Submitting…' : 'Running…'}
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              Run Suitability Analysis
            </>
          )}
        </button>
      </div>
    </div>
  );
}
