// ============================================================================
// LayerConfig — weight, reclassification type, and bins/categories for one
// raster in a suitability overlay.
// ============================================================================

import { Eye, EyeOff, Plus, Trash2, X } from 'lucide-react';
import { experienceUi } from './experienceUi';
import type { CatalogRaster, LayerReclassConfig, ReclassBin } from './types';

interface LayerConfigProps {
  raster: CatalogRaster;
  config: LayerReclassConfig;
  scaleMax: number;
  isPreviewed: boolean;
  onConfigChange: (config: LayerReclassConfig) => void;
  onRemove: () => void;
  onTogglePreview: () => void;
}

function scoreOptions(scaleMax: number): number[] {
  return Array.from({ length: scaleMax }, (_, index) => index + 1);
}

export function initLayerConfig(raster: CatalogRaster): LayerReclassConfig {
  const isCategorical = raster.units.toLowerCase() === 'category';
  const valueMin = raster.valueMin ?? 0;
  const valueMax = raster.valueMax ?? 100;

  if (isCategorical) {
    const categories: Record<string, number> = {};
    const low = Math.floor(valueMin);
    const high = Math.ceil(valueMax);
    const count = high - low + 1;
    if (count > 0 && count <= 30) {
      for (let value = low; value <= high; value++) categories[String(value)] = 0;
    }
    return {
      weight: 3,
      type: 'categorical',
      bins: [],
      categories,
      categoryLabels: {},
      rescaleMin: valueMin,
      rescaleMax: valueMax,
      invert: false,
    };
  }

  const range = valueMax - valueMin || 1;
  const step = range / 3;
  const bins: ReclassBin[] = [
    { min: Number(valueMin.toFixed(4)), max: Number((valueMin + step).toFixed(4)), score: 1 },
    { min: Number((valueMin + step).toFixed(4)), max: Number((valueMin + 2 * step).toFixed(4)), score: 3 },
    { min: Number((valueMin + 2 * step).toFixed(4)), max: Number(valueMax.toFixed(4)), score: 5 },
  ];

  return {
    weight: 3,
    type: 'continuous',
    bins,
    categories: {},
    categoryLabels: {},
    rescaleMin: valueMin,
    rescaleMax: valueMax,
    invert: false,
  };
}

export function LayerConfigCard({
  raster,
  config,
  scaleMax,
  isPreviewed,
  onConfigChange,
  onRemove,
  onTogglePreview,
}: LayerConfigProps) {
  const scores = scoreOptions(scaleMax);

  const updateBins = (index: number, field: keyof ReclassBin, raw: string) => {
    const next = config.bins.map((bin, binIndex) =>
      binIndex === index
        ? {
            ...bin,
            [field]: field === 'score' ? Number(raw) : Number.parseFloat(raw) || 0,
          }
        : bin,
    );
    onConfigChange({ ...config, bins: next });
  };

  return (
    <div className="rounded-card border border-gray-200 bg-white">
      <div className="flex items-start gap-2 border-b border-gray-100 px-3 py-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-gray-900">{raster.title}</p>
          <p className="text-[10px] text-gray-500">
            {raster.resolution ?? '—'}m · {raster.thematicCategory}
          </p>
        </div>
        <button
          type="button"
          onClick={onTogglePreview}
          title={isPreviewed ? 'Hide from map' : 'Preview on map'}
          aria-label={isPreviewed ? 'Hide from map' : 'Preview on map'}
          className={`${experienceUi.iconBtn} ${
            isPreviewed ? 'text-emerald-700' : ''
          }`}
        >
          {isPreviewed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        </button>
        <button
          type="button"
          onClick={onRemove}
          title="Remove layer"
          aria-label={`Remove ${raster.title}`}
          className={experienceUi.iconBtn}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex flex-col gap-3 px-3 py-3">
        <div>
          <label className={experienceUi.labelSm}>Weight</label>
          <div className="mt-1 flex items-center gap-2">
            <input
              type="range"
              min={1}
              max={5}
              step={1}
              value={config.weight}
              onChange={(event) =>
                onConfigChange({ ...config, weight: Number(event.target.value) })
              }
              className="h-1.5 flex-1 accent-emerald-600"
            />
            <span className="w-4 text-right text-xs font-semibold tabular-nums text-gray-800">
              {config.weight}
            </span>
          </div>
        </div>

        <div>
          <span className={experienceUi.labelSm}>Reclassification</span>
          <div role="group" aria-label="Reclassification" className={`mt-1 ${experienceUi.toggleGroup}`}>
            {(
              [
                ['continuous', 'Bins'],
                ['categorical', 'Categories'],
                ['rescale', 'Rescale'],
              ] as const
            ).map(([type, label]) => (
              <button
                key={type}
                type="button"
                onClick={() => onConfigChange({ ...config, type })}
                className={`${experienceUi.toggleBtn} ${
                  config.type === type ? experienceUi.toggleBtnActive : ''
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {config.type === 'continuous' && (
          <div className="flex flex-col gap-1.5">
            <div className="grid grid-cols-[1fr_1fr_3.5rem_1.25rem] gap-1 text-[10px] font-medium uppercase tracking-wide text-gray-400">
              <span>Min</span>
              <span>Max</span>
              <span>Score</span>
              <span />
            </div>
            {config.bins.map((bin, index) => (
              <div key={index} className="grid grid-cols-[1fr_1fr_3.5rem_1.25rem] items-center gap-1">
                <input
                  type="number"
                  value={bin.min}
                  onChange={(event) => updateBins(index, 'min', event.target.value)}
                  step="any"
                  className={experienceUi.input}
                />
                <input
                  type="number"
                  value={bin.max}
                  onChange={(event) => updateBins(index, 'max', event.target.value)}
                  step="any"
                  className={experienceUi.input}
                />
                <select
                  value={bin.score}
                  onChange={(event) => updateBins(index, 'score', event.target.value)}
                  className={experienceUi.input}
                >
                  {scores.map((score) => (
                    <option key={score} value={score}>
                      {score}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() =>
                    onConfigChange({
                      ...config,
                      bins: config.bins.filter((_, binIndex) => binIndex !== index),
                    })
                  }
                  className={experienceUi.iconBtn}
                  aria-label="Remove bin"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                const lastMax = config.bins.at(-1)?.max ?? 0;
                onConfigChange({
                  ...config,
                  bins: [...config.bins, { min: lastMax, max: lastMax + 10, score: 3 }],
                });
              }}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 hover:text-emerald-800"
            >
              <Plus className="h-3 w-3" /> Add Bin
            </button>
          </div>
        )}

        {config.type === 'categorical' && (
          <div className="flex flex-col gap-1.5">
            <div className="grid grid-cols-[4rem_1fr_3.5rem_1.25rem] gap-1 text-[10px] font-medium uppercase tracking-wide text-gray-400">
              <span>Value</span>
              <span>Class</span>
              <span>Score</span>
              <span />
            </div>
            {Object.entries(config.categories).map(([value, score]) => (
              <div
                key={value}
                className="grid grid-cols-[4rem_1fr_3.5rem_1.25rem] items-center gap-1"
              >
                <input
                  type="number"
                  value={value}
                  onChange={(event) => {
                    const next: Record<string, number> = {};
                    for (const [key, mapped] of Object.entries(config.categories)) {
                      next[key === value ? event.target.value : key] = mapped;
                    }
                    onConfigChange({ ...config, categories: next });
                  }}
                  className={experienceUi.input}
                />
                <span
                  className="truncate text-[11px] text-gray-500"
                  title={config.categoryLabels[value] || ''}
                >
                  {config.categoryLabels[value] || '—'}
                </span>
                <select
                  value={score}
                  onChange={(event) =>
                    onConfigChange({
                      ...config,
                      categories: { ...config.categories, [value]: Number(event.target.value) },
                    })
                  }
                  className={experienceUi.input}
                >
                  {scores.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    const next = { ...config.categories };
                    delete next[value];
                    onConfigChange({ ...config, categories: next });
                  }}
                  className={experienceUi.iconBtn}
                  aria-label="Remove category"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                const nextValue =
                  Object.keys(config.categories).length > 0
                    ? String(
                        Math.max(
                          ...Object.keys(config.categories).map((key) => Number(key) || 0),
                        ) + 1,
                      )
                    : '1';
                onConfigChange({
                  ...config,
                  categories: { ...config.categories, [nextValue]: 0 },
                });
              }}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 hover:text-emerald-800"
            >
              <Plus className="h-3 w-3" /> Add Category
            </button>
          </div>
        )}

        {config.type === 'rescale' && (
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-2 gap-2">
              <label className="flex flex-col gap-1">
                <span className={experienceUi.labelSm}>Input Min</span>
                <input
                  type="number"
                  value={config.rescaleMin}
                  onChange={(event) =>
                    onConfigChange({
                      ...config,
                      rescaleMin: Number.parseFloat(event.target.value) || 0,
                    })
                  }
                  step="any"
                  className={experienceUi.input}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className={experienceUi.labelSm}>Input Max</span>
                <input
                  type="number"
                  value={config.rescaleMax}
                  onChange={(event) =>
                    onConfigChange({
                      ...config,
                      rescaleMax: Number.parseFloat(event.target.value) || 0,
                    })
                  }
                  step="any"
                  className={experienceUi.input}
                />
              </label>
            </div>
            <label className="flex items-center gap-1.5 text-[11px] text-gray-700">
              <input
                type="checkbox"
                checked={config.invert}
                onChange={(event) =>
                  onConfigChange({ ...config, invert: event.target.checked })
                }
                className="h-3.5 w-3.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              Invert (high values → low suitability)
            </label>
            <p className={experienceUi.hint}>
              Linearly rescales [{config.rescaleMin}, {config.rescaleMax}] → [1, {scaleMax}]
              {config.invert ? ' (inverted)' : ''}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
