// ============================================================================
// RegionToggle — switch SDM figures between the whole mapped area and the
// Dangermond Preserve alone.
// ============================================================================

import { experienceUi } from '../experienceUi';

export type SdmRegion = 'all' | 'preserve';

interface RegionToggleProps {
  value: SdmRegion;
  onChange: (region: SdmRegion) => void;
  /** Explains how Preserve cells were counted. Shown while the Preserve is chosen. */
  note?: string;
}

export function RegionToggle({ value, onChange, note }: RegionToggleProps) {
  return (
    <div>
      <div role="group" aria-label="Region" className={experienceUi.toggleGroup}>
        {(
          [
            ['all', 'Whole region'],
            ['preserve', 'Dangermond Preserve'],
          ] as const
        ).map(([region, label]) => (
          <button
            key={region}
            type="button"
            onClick={() => onChange(region)}
            aria-pressed={value === region}
            className={`${experienceUi.toggleBtn} ${
              value === region ? experienceUi.toggleBtnActive : ''
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      {value === 'preserve' && note && (
        <p className="mt-1.5 text-xs leading-relaxed text-gray-500">{note}</p>
      )}
    </div>
  );
}
