// ============================================================================
// SdmInfoModal — the detailed explanation of the species model, opened from
// the overview step.
// ============================================================================

import { InfoModal } from '../InfoModal';
import { SDM_EXPLAINER } from './sdmCopy';

interface SdmInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SdmInfoModal({ isOpen, onClose }: SdmInfoModalProps) {
  return (
    <InfoModal
      isOpen={isOpen}
      onClose={onClose}
      title={SDM_EXPLAINER.title}
      intro={SDM_EXPLAINER.intro}
    >
      <div className="flex flex-col gap-4">
        {SDM_EXPLAINER.sections.map((section) => (
          <section key={section.title}>
            <h3 className="text-sm font-semibold text-gray-900">{section.title}</h3>
            <p className="mt-0.5 text-sm leading-relaxed text-gray-600">{section.body}</p>
          </section>
        ))}
      </div>
    </InfoModal>
  );
}
