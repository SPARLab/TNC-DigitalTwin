// ============================================================================
// SdmSpeciesStep — pick the species, and optionally put its records on the map.
// ============================================================================

import { OccurrenceInfo } from '../OccurrenceInfo';
import { SpeciesSelect } from '../SpeciesSelect';
import { experienceUi } from '../experienceUi';
import type { PointsAction } from '../types';
import { SDM_SPECIES_STEP } from './sdmCopy';
import { StepNav } from './StepNav';

interface SdmSpeciesStepProps {
  species: string;
  onChange: (species: string, commonName?: string | null) => void;
  onTogglePoints?: (action: PointsAction) => void;
  /** Species whose records are on the map. */
  pointsOnMap?: string[];
  onBack: () => void;
  onContinue: () => void;
}

export function SdmSpeciesStep({
  species,
  onChange,
  onTogglePoints,
  pointsOnMap,
  onBack,
  onContinue,
}: SdmSpeciesStepProps) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h3 className={experienceUi.heading}>{SDM_SPECIES_STEP.title}</h3>
        <p className={`mt-1.5 ${experienceUi.description}`}>{SDM_SPECIES_STEP.body}</p>
      </div>

      <div className={experienceUi.section}>
        <label className={experienceUi.label}>Species Name</label>
        <SpeciesSelect value={species} onChange={onChange} />
      </div>

      <div className={experienceUi.section}>
        <OccurrenceInfo
          species={species}
          onTogglePoints={onTogglePoints}
          isOnMap={pointsOnMap ? pointsOnMap.includes(species) : undefined}
        />
        <p className={experienceUi.hint}>{SDM_SPECIES_STEP.occurrences}</p>
      </div>

      <StepNav
        onBack={onBack}
        onContinue={onContinue}
        continueLabel="Continue to Scenario"
        continueDisabledReason={species ? undefined : 'Choose a species first'}
      />
    </div>
  );
}
