// ============================================================================
// SdmScenarioStep — pick the climates the model is applied to (one or several),
// and optionally put any climate variable on the map.
// ============================================================================

import { Eye, EyeOff } from 'lucide-react';
import { CLIMATE_SCENARIOS, SDM_PREDICTOR_VARIABLES } from '../../../config/geoprocessing';
import { experienceUi } from '../experienceUi';
import { SCENARIO_CHOICES, scenarioKey, scenarioStackLabel } from './climatePreview';
import { SDM_SCENARIO_STEP } from './sdmCopy';
import { StepNav } from './StepNav';

interface SdmScenarioStepProps {
  /** Keys (see `scenarioKey`) of the climates to map. */
  selected: ReadonlySet<string>;
  onToggleScenario: (key: string) => void;
  /** Key of the climate whose variables the Show buttons draw. */
  previewKey: string;
  onPreviewKeyChange: (key: string) => void;
  /** Tags of the variables currently drawn on the map. */
  previewedTags: ReadonlySet<string>;
  onTogglePreview: (tag: string) => void;
  /** Link to the mosaic the previewed variables are read from. */
  previewMosaicUrl: string;
  onBack: () => void;
  onContinue: () => void;
}

export function SdmScenarioStep({
  selected,
  onToggleScenario,
  previewKey,
  onPreviewKeyChange,
  previewedTags,
  onTogglePreview,
  previewMosaicUrl,
  onBack,
  onContinue,
}: SdmScenarioStepProps) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h3 className={experienceUi.heading}>{SDM_SCENARIO_STEP.title}</h3>
        <p className={`mt-1.5 ${experienceUi.description}`}>{SDM_SCENARIO_STEP.body}</p>
      </div>

      <fieldset className={experienceUi.section}>
        <legend className={experienceUi.label}>
          Climates to map ({selected.size} chosen)
        </legend>
        <p className={experienceUi.hint}>{SDM_SCENARIO_STEP.multiple}</p>
        <div className="flex flex-col divide-y divide-gray-100 rounded-card border border-gray-200">
          {CLIMATE_SCENARIOS.map((scenario) => (
            <div key={scenario.id} className="flex flex-col gap-1.5 px-3 py-2.5">
              <div>
                <span className="text-sm font-semibold text-gray-900">{scenario.label}</span>
                <span className="block text-xs text-gray-500">{scenario.hint}</span>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {scenario.periods.map((period) => {
                  const key = scenarioKey(scenario.id, period);
                  const name = scenarioStackLabel(scenario, period);
                  return (
                    <label
                      key={key}
                      className="flex cursor-pointer items-center gap-1.5 text-sm text-gray-700"
                    >
                      <input
                        type="checkbox"
                        checked={selected.has(key)}
                        onChange={() => onToggleScenario(key)}
                        aria-label={name}
                        className="h-4 w-4 accent-emerald-600"
                      />
                      {period}
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <p className={experienceUi.hint}>{SDM_SCENARIO_STEP.scenarios}</p>
      </fieldset>

      <div className={experienceUi.section}>
        <label className={experienceUi.label} htmlFor="sdm-preview-climate">
          Preview Climate Variables
        </label>
        <p className={experienceUi.hint}>
          CHELSA V2.1 bioclimatic variables (
          <a
            href={previewMosaicUrl}
            target="_blank"
            rel="noreferrer"
            className="text-emerald-700 underline"
          >
            source mosaic
          </a>
          ). {SDM_SCENARIO_STEP.preview}
        </p>
        <select
          id="sdm-preview-climate"
          value={previewKey}
          onChange={(event) => onPreviewKeyChange(event.target.value)}
          className={experienceUi.input}
        >
          {SCENARIO_CHOICES.map((choice) => (
            <option key={choice.key} value={choice.key}>
              {choice.label}
            </option>
          ))}
        </select>
        <ul className="flex flex-col divide-y divide-gray-100 rounded-card border border-gray-200">
          {SDM_PREDICTOR_VARIABLES.map((variable) => {
            const shown = previewedTags.has(variable.tag);
            return (
              <li key={variable.tag} className="flex items-center gap-2 px-2.5 py-1.5">
                <span className="min-w-0 flex-1 text-sm leading-snug text-gray-700">
                  <span className="mr-1.5 font-mono text-xs text-gray-500">{variable.tag}</span>
                  {variable.label}
                  {variable.units ? ` (${variable.units})` : ''}
                </span>
                <button
                  type="button"
                  onClick={() => onTogglePreview(variable.tag)}
                  aria-pressed={shown}
                  aria-label={`${shown ? 'Remove' : 'Add'} ${variable.label} ${shown ? 'from' : 'to'} the map`}
                  className={`inline-flex flex-shrink-0 items-center gap-1 rounded-button border px-2 py-1 text-[11px] font-medium transition-colors ${
                    shown
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {shown ? (
                    <>
                      <EyeOff className="h-3 w-3" /> Remove
                    </>
                  ) : (
                    <>
                      <Eye className="h-3 w-3" /> Show
                    </>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <StepNav
        onBack={onBack}
        onContinue={onContinue}
        continueLabel="Continue to Output"
        continueDisabledReason={selected.size === 0 ? 'Choose at least one climate' : undefined}
      />
    </div>
  );
}
