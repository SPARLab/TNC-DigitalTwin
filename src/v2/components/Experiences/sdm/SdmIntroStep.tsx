// ============================================================================
// SdmIntroStep — what the species distribution model is, what it uses, and how
// a run works, before the user picks anything.
// ============================================================================

import { ArrowRight, Play, Search, SlidersHorizontal, Thermometer } from 'lucide-react';
import { experienceUi } from '../experienceUi';
import { SDM_INTRO } from './sdmCopy';

const STEP_ICONS = [Search, Thermometer, SlidersHorizontal, Play] as const;

export function SdmIntroStep({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h3 className={experienceUi.heading}>{SDM_INTRO.headline}</h3>
        <p className={`mt-2 ${experienceUi.description}`}>
          {SDM_INTRO.summary} {SDM_INTRO.examples}
        </p>
      </div>

      <section className="flex flex-col gap-2">
        <h4 className={experienceUi.label}>What data does it use?</h4>
        <p className={experienceUi.description}>{SDM_INTRO.dataOverview}</p>
      </section>

      <section className="flex flex-col gap-2">
        <h4 className={experienceUi.label}>How a run works</h4>
        <ol className="flex flex-col gap-2.5">
          {SDM_INTRO.howItWorks.map((step, index) => {
            const Icon = STEP_ICONS[index] ?? Play;
            return (
              <li
                key={step}
                className="flex items-start gap-2.5 text-sm leading-relaxed text-gray-700"
              >
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
        Start Species Model
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}
