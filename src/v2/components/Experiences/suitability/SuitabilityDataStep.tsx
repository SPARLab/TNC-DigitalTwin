// ============================================================================
// SuitabilityDataStep — choose extent + resolution and pick analysis layers.
// ============================================================================

import { useEffect, useId, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Eye, EyeOff, Info } from 'lucide-react';
import { experienceUi } from '../experienceUi';
import type { CatalogRaster, RasterScope } from '../types';
import { RASTER_SCOPE_OPTIONS } from '../types';
import { RasterAvailabilityCatalog } from './RasterAvailabilityCatalog';
import {
  EXTENT_GUIDE,
  formatResolutionLabel,
  RESOLUTION_GUIDE,
} from './wizardCopy';

interface SuitabilityDataStepProps {
  catalog: CatalogRaster[];
  catalogLoading: boolean;
  catalogError: string | null;
  scope: RasterScope;
  resolution: number | null;
  availableResolutions: number[];
  selectedLayers: CatalogRaster[];
  previewedIds: Set<number>;
  onScopeChange: (scope: RasterScope) => void;
  onResolutionChange: (resolution: number) => void;
  onAddLayer: (raster: CatalogRaster) => void;
  onRemoveLayer: (id: number) => void;
  onTogglePreview: (raster: CatalogRaster) => void;
  onBack: () => void;
  onContinue: () => void;
}

function ResolutionInfoTip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const tipId = useId();
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative inline-flex">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={tipId}
        title="About grid resolution"
        onClick={() => setOpen((value) => !value)}
        className="rounded p-0.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-emerald-700"
      >
        <Info className="h-4 w-4" />
        <span className="sr-only">About grid resolution</span>
      </button>
      {open && (
        <div
          id={tipId}
          role="tooltip"
          className="absolute left-0 top-full z-20 mt-1.5 w-72 rounded-card border border-gray-200 bg-white p-3 text-sm leading-relaxed text-gray-600 shadow-lg"
        >
          {text}
        </div>
      )}
    </div>
  );
}

export function SuitabilityDataStep({
  catalog,
  catalogLoading,
  catalogError,
  scope,
  resolution,
  availableResolutions,
  selectedLayers,
  previewedIds,
  onScopeChange,
  onResolutionChange,
  onAddLayer,
  onRemoveLayer,
  onTogglePreview,
  onBack,
  onContinue,
}: SuitabilityDataStepProps) {
  const selectedIds = new Set(selectedLayers.map((raster) => raster.id));

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h3 className={experienceUi.heading}>Extent, resolution & layers</h3>
        <p className={`mt-1.5 ${experienceUi.description}`}>
          Pick the analysis mask and a shared cell size. Layers published for a
          wider extent stay available when they share that resolution, and are
          clipped to the mask when the model runs.
        </p>
      </div>

      <section className={experienceUi.section}>
        <label htmlFor="suitability-analysis-mask" className={experienceUi.label}>
          Analysis mask
        </label>
        <select
          id="suitability-analysis-mask"
          aria-label="Analysis mask"
          value={scope}
          onChange={(event) => onScopeChange(event.target.value as RasterScope)}
          className={experienceUi.input}
        >
          {RASTER_SCOPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {EXTENT_GUIDE[option.value].label}
            </option>
          ))}
        </select>
        <p className={experienceUi.hint}>
          Resolutions: {EXTENT_GUIDE[scope].resolutionsLabel}
        </p>
      </section>

      <section className={experienceUi.section}>
        <div className="flex items-center gap-1.5">
          <span className={experienceUi.label}>{RESOLUTION_GUIDE.title}</span>
          <ResolutionInfoTip text={RESOLUTION_GUIDE.body} />
        </div>
        <div className="flex flex-wrap gap-2">
          {availableResolutions.map((value) => {
            const active = resolution === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => onResolutionChange(value)}
                className={`rounded-button border px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? 'border-emerald-400 bg-emerald-600 text-white'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-emerald-300'
                }`}
              >
                {formatResolutionLabel(value)}
              </button>
            );
          })}
        </div>
      </section>

      <section className={experienceUi.section}>
        <div className="flex items-center justify-between gap-2">
          <span className={experienceUi.label}>Analysis layers</span>
          <span className="text-xs text-gray-500">
            {selectedLayers.length} selected
          </span>
        </div>
        <RasterAvailabilityCatalog
          rasters={catalog}
          isLoading={catalogLoading}
          error={catalogError}
          scope={scope}
          resolution={resolution}
          selectedIds={selectedIds}
          onAdd={onAddLayer}
          onRemove={onRemoveLayer}
        />
        {selectedLayers.length > 0 && (
          <ul className="flex flex-col gap-1.5">
            {selectedLayers.map((raster) => {
              const isPreviewed = previewedIds.has(raster.id);
              return (
                <li
                  key={raster.id}
                  className="flex items-start justify-between gap-2 rounded-button border border-emerald-100 bg-emerald-50/60 px-2.5 py-2"
                >
                  <span className="min-w-0 break-words text-sm font-medium text-emerald-900">
                    {raster.title}
                    <span className="font-normal text-emerald-700/80">
                      {' '}
                      · {formatResolutionLabel(raster.resolution ?? 0)}
                    </span>
                  </span>
                  <span className="flex flex-shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onTogglePreview(raster)}
                      title={isPreviewed ? 'Hide from map' : 'Preview on map'}
                      aria-label={isPreviewed ? 'Hide from map' : 'Preview on map'}
                      className={`${experienceUi.iconBtn} ${
                        isPreviewed ? 'text-emerald-700' : ''
                      }`}
                    >
                      {isPreviewed ? (
                        <EyeOff className="h-3.5 w-3.5" />
                      ) : (
                        <Eye className="h-3.5 w-3.5" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemoveLayer(raster.id)}
                      className="text-xs font-semibold text-emerald-800 hover:underline"
                    >
                      Remove
                    </button>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
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
          disabled={selectedLayers.length === 0 || resolution == null}
          className={`flex-[1.4] ${experienceUi.runBtn}`}
        >
          Continue to Weights
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
