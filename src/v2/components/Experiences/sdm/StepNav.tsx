// ============================================================================
// StepNav — Back and Continue buttons at the foot of a wizard step.
// ============================================================================

import { ArrowLeft, ArrowRight } from 'lucide-react';
import { experienceUi } from '../experienceUi';

interface StepNavProps {
  onBack: () => void;
  onContinue: () => void;
  continueLabel: string;
  /** Why Continue is unavailable, shown as its tooltip. */
  continueDisabledReason?: string;
}

export function StepNav({ onBack, onContinue, continueLabel, continueDisabledReason }: StepNavProps) {
  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={onBack}
        className="flex flex-1 items-center justify-center gap-1.5 rounded-button border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>
      <button
        type="button"
        onClick={onContinue}
        disabled={continueDisabledReason != null}
        title={continueDisabledReason}
        className={`flex-[1.4] ${experienceUi.runBtn}`}
      >
        {continueLabel}
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}
