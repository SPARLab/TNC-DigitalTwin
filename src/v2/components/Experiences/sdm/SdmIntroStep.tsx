// ============================================================================
// SdmIntroStep — a one-line description and how a run works. The longer
// explanation of the model is in a pop-up, opened from the link below the steps.
// ============================================================================

import { useState } from 'react';
import { ArrowRight, CircleHelp, Play, Search, SlidersHorizontal, Thermometer } from 'lucide-react';
import { BetaNotice } from '../BetaNotice';
import { experienceUi } from '../experienceUi';
import { SdmInfoModal } from './SdmInfoModal';
import { SDM_INTRO } from './sdmCopy';

const STEP_ICONS = [Search, Thermometer, SlidersHorizontal, Play] as const;

export function SdmIntroStep({ onStart }: { onStart: () => void }) {
  const [explainerOpen, setExplainerOpen] = useState(false);

  return (
    <div className="flex flex-col gap-5">
      <SdmInfoModal isOpen={explainerOpen} onClose={() => setExplainerOpen(false)} />

      <div>
        <h3 className={experienceUi.heading}>{SDM_INTRO.headline}</h3>
        <p className={`mt-2 ${experienceUi.description}`}>{SDM_INTRO.summary}</p>
      </div>

      <section className="flex flex-col gap-3">
        <h4 className={experienceUi.label}>How a run works</h4>
        <ol className="flex flex-col gap-3.5">
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
        <div className="mt-1 flex flex-col gap-3">
          <button
            type="button"
            onClick={() => setExplainerOpen(true)}
            className="inline-flex items-center gap-1.5 self-start text-sm font-medium text-emerald-700 hover:text-emerald-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <CircleHelp className="h-4 w-4" />
            {SDM_INTRO.learnMore}
          </button>
          <BetaNotice />
        </div>
      </section>

      <button type="button" onClick={onStart} className={experienceUi.runBtn}>
        Get Started
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}
