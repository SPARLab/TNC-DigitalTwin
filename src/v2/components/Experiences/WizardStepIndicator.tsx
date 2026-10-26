// ============================================================================
// WizardStepIndicator — numbered step bar shared by the experience wizards.
// ============================================================================

export interface WizardStepMeta<Id extends string> {
  id: Id;
  label: string;
}

interface WizardStepIndicatorProps<Id extends string> {
  steps: ReadonlyArray<WizardStepMeta<Id>>;
  step: Id;
  onStepChange: (step: Id) => void;
  /** Accessible name of the step list. */
  label: string;
  /** Blocks every step while an analysis is running. */
  locked?: boolean;
  /**
   * Steps the user may open besides those already reached. Used when a step's
   * choices are all optional or already made.
   */
  isStepEnabled?: (step: Id, index: number) => boolean;
}

export function WizardStepIndicator<Id extends string>({
  steps,
  step,
  onStepChange,
  label,
  locked = false,
  isStepEnabled,
}: WizardStepIndicatorProps<Id>) {
  const activeIndex = steps.findIndex((entry) => entry.id === step);

  return (
    <nav aria-label={label} className="flex items-center gap-1">
      {steps.map((entry, index) => {
        const isActive = entry.id === step;
        const isComplete = index < activeIndex;
        const canOpen =
          !locked && (index <= activeIndex || (isStepEnabled?.(entry.id, index) ?? false));
        return (
          <div key={entry.id} className="flex min-w-0 flex-1 items-center gap-1">
            <button
              type="button"
              disabled={!canOpen}
              onClick={() => onStepChange(entry.id)}
              aria-current={isActive ? 'step' : undefined}
              title={locked ? 'Unavailable while the analysis is running' : undefined}
              className={`flex min-w-0 flex-1 flex-col items-center gap-1 ${
                isActive ? 'text-emerald-800' : isComplete ? 'text-emerald-600' : 'text-gray-400'
              } ${locked ? 'cursor-not-allowed opacity-50' : canOpen ? 'cursor-pointer' : 'cursor-default'}`}
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                  isActive
                    ? 'bg-emerald-600 text-white'
                    : isComplete
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-gray-100 text-gray-500'
                }`}
              >
                {index + 1}
              </span>
              <span className="truncate text-xs font-medium">{entry.label}</span>
            </button>
            {index < steps.length - 1 && (
              <div
                className={`mb-5 h-px w-2 flex-shrink-0 ${
                  index < activeIndex ? 'bg-emerald-300' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        );
      })}
    </nav>
  );
}
