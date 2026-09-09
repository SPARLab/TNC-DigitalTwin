// ============================================================================
// SDMPanel — species, climate scenario, and output type for the Random Forest
// habitat model.
// ============================================================================

import { useCallback, useState } from 'react';
import { Loader2, Play } from 'lucide-react';
import {
  DEFAULT_SDM_INPUTS,
  GP_SERVICES,
  PREDICTOR_STACKS,
} from '../../config/geoprocessing';
import { submitGpJob } from '../../services/geoprocessingService';
import { experienceUi } from './experienceUi';
import { GpJobStatus } from './GpJobStatus';
import { OccurrenceInfo } from './OccurrenceInfo';
import { SpeciesSelect } from './SpeciesSelect';
import type { GpJobRecord, PointsAction, ResultLayerInfo } from './types';

interface SDMPanelProps {
  token: string | null;
  onLayerAdded?: (info: ResultLayerInfo) => void;
  onTogglePoints?: (action: PointsAction) => void;
}

function sanitizeOutputName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_\- ]/g, '').trim().replace(/\s+/g, '_');
}

export function SDMPanel({ token, onLayerAdded, onTogglePoints }: SDMPanelProps) {
  const [species, setSpecies] = useState('');
  const [stackId, setStackId] = useState<(typeof PREDICTOR_STACKS)[number]['id']>('current');
  const [outputType, setOutputType] = useState<'Probability' | 'Binary'>('Probability');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [job, setJob] = useState<GpJobRecord | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedStack = PREDICTOR_STACKS.find((stack) => stack.id === stackId) ?? PREDICTOR_STACKS[0];

  const handleRun = useCallback(async () => {
    if (!species || !selectedStack) return;
    setIsSubmitting(true);
    setError(null);
    setJob(null);

    try {
      const jobId = await submitGpJob(
        GP_SERVICES.sdmRandomForest.url,
        GP_SERVICES.sdmRandomForest.task,
        {
          occurrences: DEFAULT_SDM_INPUTS.occurrences,
          species,
          predictors: JSON.stringify({ url: selectedStack.url }),
          background_points: DEFAULT_SDM_INPUTS.backgroundPoints,
          output_type: outputType,
          output_raster: sanitizeOutputName(species),
        },
        token,
        'species distribution',
      );

      setJob({
        id: jobId,
        status: 'esriJobSubmitted',
        summary: species,
        scenario: selectedStack.label,
        defaultFilename: 'Habitat_Suitability.tif',
        jobsDirectory: GP_SERVICES.sdmRandomForest.jobsDirectory,
        filenamePattern: 'raster-written',
        result: {
          jobId,
          mapServerUrl: GP_SERVICES.sdmRandomForest.mapServer,
          groupTitle: species,
          title: `SDM — ${selectedStack.label}`,
        },
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setIsSubmitting(false);
    }
  }, [outputType, selectedStack, species, token]);

  return (
    <div id="sdm-panel" className={experienceUi.panel}>
      <p className={experienceUi.description}>
        Model habitat suitability for species under present or future climate
        scenarios.
      </p>

      <div className={experienceUi.section}>
        <label className={experienceUi.label}>Species Name</label>
        <SpeciesSelect value={species} onChange={setSpecies} />
      </div>

      <OccurrenceInfo species={species} onTogglePoints={onTogglePoints} />

      <div className={experienceUi.section}>
        <label className={experienceUi.label} htmlFor="sdm-climate-select">
          Climate Scenario
        </label>
        <select
          id="sdm-climate-select"
          value={stackId}
          onChange={(event) =>
            setStackId(event.target.value as (typeof PREDICTOR_STACKS)[number]['id'])
          }
          className={experienceUi.input}
        >
          {PREDICTOR_STACKS.map((stack) => (
            <option key={stack.id} value={stack.id}>
              {stack.label}
            </option>
          ))}
        </select>
        <p className={experienceUi.hint}>
          {stackId === 'current'
            ? 'Observed climate normals (1980–2010).'
            : `Projected climate under ${selectedStack.label.split(' ')[0]} for 2040–2070.`}
        </p>
      </div>

      <div className={experienceUi.section}>
        <span className={experienceUi.label}>Output Type</span>
        <div role="group" aria-label="Output type" className={experienceUi.toggleGroup}>
          {(['Probability', 'Binary'] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setOutputType(option)}
              className={`${experienceUi.toggleBtn} ${
                outputType === option ? experienceUi.toggleBtnActive : ''
              }`}
            >
              {option}
            </button>
          ))}
        </div>
        <p className={experienceUi.hint}>
          {outputType === 'Probability'
            ? 'Continuous suitability from 0 to 1.'
            : "Suitable (1) / unsuitable (0) using Youden's J threshold."}
        </p>
      </div>

      {error && <div className={experienceUi.error}>{error}</div>}

      <button
        type="button"
        onClick={handleRun}
        disabled={!species || isSubmitting}
        className={experienceUi.runBtn}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Submitting…
          </>
        ) : (
          <>
            <Play className="h-3.5 w-3.5" /> Run Model
          </>
        )}
      </button>

      {job && (
        <GpJobStatus
          job={job}
          serviceUrl={GP_SERVICES.sdmRandomForest.url}
          task={GP_SERVICES.sdmRandomForest.task}
          token={token}
          onLayerAdded={onLayerAdded}
        />
      )}
    </div>
  );
}
