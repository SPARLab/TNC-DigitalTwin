// ============================================================================
// SuitabilityDataModal — which datasets a suitability run can use, and the
// areas and cell sizes they come in. Opened from the overview step.
// ============================================================================

import { InfoModal } from '../InfoModal';
import { RASTER_SCOPE_OPTIONS } from '../types';
import { EXTENT_GUIDE, SUITABILITY_DATA_EXPLAINER } from './wizardCopy';

interface SuitabilityDataModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SuitabilityDataModal({ isOpen, onClose }: SuitabilityDataModalProps) {
  const copy = SUITABILITY_DATA_EXPLAINER;

  return (
    <InfoModal isOpen={isOpen} onClose={onClose} title={copy.title} intro={copy.intro}>
      <div className="flex flex-col gap-5">
        <section>
          <h3 className="text-sm font-semibold text-gray-900">{copy.categoriesTitle}</h3>
          <p className="mt-0.5 text-sm leading-relaxed text-gray-600">{copy.categoriesBody}</p>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {copy.categories.map((category) => (
              <li
                key={category}
                className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800"
              >
                {category}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h3 className="text-sm font-semibold text-gray-900">{copy.extentsTitle}</h3>
          <p className="mt-0.5 text-sm leading-relaxed text-gray-600">{copy.extentsBody}</p>
          <dl className="mt-2 flex flex-col gap-1.5">
            {RASTER_SCOPE_OPTIONS.map((option) => (
              <div
                key={option.value}
                className="rounded-card border border-gray-200 bg-gray-50 px-2.5 py-2"
              >
                <dt className="text-xs font-semibold text-gray-900">
                  {EXTENT_GUIDE[option.value].label}
                </dt>
                <dd className="mt-0.5 text-xs leading-relaxed text-gray-600">
                  Cell sizes: {EXTENT_GUIDE[option.value].resolutionsLabel}
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">{copy.extentsNote}</p>
        </section>
      </div>
    </InfoModal>
  );
}
