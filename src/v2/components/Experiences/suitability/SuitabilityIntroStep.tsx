// ============================================================================
// SuitabilityIntroStep — title, use cases, data overview, start CTA.
// ============================================================================

import { ArrowRight, Layers, Map, Scale } from 'lucide-react';
import { experienceUi } from '../experienceUi';
import { SUITABILITY_INTRO } from './wizardCopy';

interface SuitabilityIntroStepProps {
  onStart: () => void;
}

export function SuitabilityIntroStep({ onStart }: SuitabilityIntroStepProps) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h3 className={experienceUi.heading}>{SUITABILITY_INTRO.headline}</h3>
        <p className={`mt-2 ${experienceUi.description}`}>{SUITABILITY_INTRO.summary}</p>
      </div>

      <section className="flex flex-col gap-2">
        <h4 className={experienceUi.label}>Example use cases</h4>
        <ul className="flex flex-col gap-2">
          {SUITABILITY_INTRO.useCases.map((useCase) => (
            <li
              key={useCase.title}
              className="rounded-card border border-gray-200 bg-gray-50 px-3 py-2.5"
            >
              <p className="text-sm font-semibold text-gray-900">{useCase.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-gray-600">{useCase.detail}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h4 className={experienceUi.label}>What data can you use?</h4>
        <p className={experienceUi.description}>{SUITABILITY_INTRO.dataOverview}</p>
      </section>

      <section className="flex flex-col gap-2">
        <h4 className={experienceUi.label}>How a run works</h4>
        <ol className="flex flex-col gap-2.5">
          {SUITABILITY_INTRO.howItWorks.map((step, index) => {
            const Icon = index === 0 ? Map : index === 1 ? Layers : Scale;
            return (
              <li key={step} className="flex items-start gap-2.5 text-sm leading-relaxed text-gray-700">
                <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <span>
                  <span className="font-semibold text-gray-900">{index + 1}. </span>
                  {step}
                </span>
              </li>
            );
          })}
        </ol>
      </section>

      <button type="button" onClick={onStart} className={experienceUi.runBtn}>
        Start Suitability Analysis
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}
