// ============================================================================
// SuitabilityConfigureStep — scale, weights, and reclassification with guidance.
// ============================================================================

import { ArrowLeft, ArrowRight, Info } from 'lucide-react';
import { experienceUi } from '../experienceUi';
import { LayerConfigCard } from '../LayerConfig';
import type { CatalogRaster, LayerReclassConfig, RasterScope } from '../types';
import { CONFIGURE_GUIDE } from './wizardCopy';

interface SuitabilityConfigureStepProps {
  selectedLayers: CatalogRaster[];
  configs: Record<number, LayerReclassConfig>;
  scaleMax: number;
  analysisScope: RasterScope;
  token: string | null;
  previewedIds: Set<number>;
  onScaleMaxChange: (value: number) => void;
  onConfigChange: (rasterId: number, config: LayerReclassConfig) => void;
  onRemoveLayer: (id: number) => void;
  onTogglePreview: (raster: CatalogRaster) => void;
  onBack: () => void;
  onContinue: () => void;
}

export function SuitabilityConfigureStep({
  selectedLayers,
  configs,
  scaleMax,
  analysisScope,
  token,
  previewedIds,
  onScaleMaxChange,
  onConfigChange,
  onRemoveLayer,
  onTogglePreview,
  onBack,
  onContinue,
}: SuitabilityConfigureStepProps) {
  return (
    <div className="flex min-w-0 flex-col gap-5">
      <div>
        <h3 className={experienceUi.heading}>Weights & reclassification</h3>
        <p className={`mt-1.5 ${experienceUi.description}`}>
          Tell the model how important each layer is and how raw values become
          suitability scores on a shared scale.
        </p>
      </div>

      <section className="rounded-card border border-gray-200 bg-gray-50 px-3 py-3">
        <h4 className="text-sm font-semibold text-gray-900">{CONFIGURE_GUIDE.scale.title}</h4>
        <p className="mt-1 text-sm leading-relaxed text-gray-600">
          {CONFIGURE_GUIDE.scale.body}
        </p>
        <label className="mt-2.5 flex items-center gap-2 text-sm text-gray-700">
          Output scale
          <select
            value={scaleMax}
            onChange={(event) => onScaleMaxChange(Number(event.target.value))}
            className="rounded-button border border-gray-200 bg-white px-2 py-1.5 text-sm focus:border-emerald-500 focus:outline-none"
          >
            {[3, 5, 7, 10].map((value) => (
              <option key={value} value={value}>
                1–{value}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="rounded-card border border-gray-200 bg-gray-50 px-3 py-3">
        <h4 className="text-sm font-semibold text-gray-900">{CONFIGURE_GUIDE.weight.title}</h4>
        <p className="mt-1 text-sm leading-relaxed text-gray-600">
          {CONFIGURE_GUIDE.weight.body}
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <span className={experienceUi.label}>
          Selected layers ({selectedLayers.length})
        </span>
        {selectedLayers.map((raster) => {
          const config = configs[raster.id];
          if (!config) return null;
          return (
            <LayerConfigCard
              key={raster.id}
              raster={raster}
              config={config}
              scaleMax={scaleMax}
              analysisScope={analysisScope}
              token={token}
              isPreviewed={previewedIds.has(raster.id)}
              onConfigChange={(next) => onConfigChange(raster.id, next)}
              onRemove={() => onRemoveLayer(raster.id)}
              onTogglePreview={() => onTogglePreview(raster)}
            />
          );
        })}
        <p className="flex items-start gap-1.5 text-sm leading-relaxed text-gray-500">
          <Info className="mt-0.5 h-4 w-4 flex-shrink-0" />
          {CONFIGURE_GUIDE.formula}
        </p>
      </section>

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
          disabled={selectedLayers.length === 0}
          className={`flex-[1.4] ${experienceUi.runBtn}`}
        >
          Continue to Run
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
