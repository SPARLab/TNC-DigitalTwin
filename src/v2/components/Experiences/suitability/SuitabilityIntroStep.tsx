// ============================================================================
// SuitabilityIntroStep - intro and examples, data overview, how a run works
// (with a "?" that opens the weighted overlay explainer), start CTA.
// ============================================================================

import { useState } from 'react';
import { ArrowRight, CircleHelp, Layers, Map, Scale } from 'lucide-react';
import { experienceUi } from '../experienceUi';
import { SuitabilityDataModal } from './SuitabilityDataModal';
import { WeightedOverlayInfoModal } from './WeightedOverlayInfoModal';
import { SUITABILITY_INTRO } from './wizardCopy';

interface SuitabilityIntroStepProps {
  onStart: () => void;
}

export function SuitabilityIntroStep({ onStart }: SuitabilityIntroStepProps) {
  const [explainerOpen, setExplainerOpen] = useState(false);
  const [dataOpen, setDataOpen] = useState(false);

  return (
    <div className="flex flex-col gap-5">
      <WeightedOverlayInfoModal isOpen={explainerOpen} onClose={() => setExplainerOpen(false)} />
      <SuitabilityDataModal isOpen={dataOpen} onClose={() => setDataOpen(false)} />
      <div>
        <h3 className={experienceUi.heading}>{SUITABILITY_INTRO.headline}</h3>
        <p className={`mt-2 ${experienceUi.description}`}>{SUITABILITY_INTRO.summary}</p>
        <p className={`mt-2 ${experienceUi.description}`}>{SUITABILITY_INTRO.examplesLead}</p>
        <ul className={`mt-1 list-disc space-y-1 pl-5 ${experienceUi.description}`}>
          {SUITABILITY_INTRO.examples.map((example) => (
            <li key={example}>{example}</li>
          ))}
        </ul>
      </div>

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
                  {index === SUITABILITY_INTRO.howItWorks.length - 1 && (
                    <button
                      type="button"
                      onClick={() => setExplainerOpen(true)}
                      aria-label="How the weighted overlay works"
                      title="How the weighted overlay works"
                      className="ml-1 inline-flex translate-y-0.5 rounded-full text-gray-400 transition-colors hover:text-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                    >
                      <CircleHelp className="h-4 w-4" />
                    </button>
                  )}
                </span>
              </li>
            );
          })}
        </ol>
        <button
          type="button"
          onClick={() => setDataOpen(true)}
          className="inline-flex items-center gap-1.5 self-start text-sm font-medium text-emerald-700 hover:text-emerald-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
        >
          <CircleHelp className="h-4 w-4" />
          {SUITABILITY_INTRO.dataLink}
        </button>
      </section>

      <button type="button" onClick={onStart} className={experienceUi.runBtn}>
        Start Suitability Analysis
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}
