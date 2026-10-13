// ============================================================================
// LayerConfig — weight, reclassification type, and bins/categories for one
// raster in a suitability overlay.
// ============================================================================

import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Eye, EyeOff, Info, Plus, Trash2, X } from 'lucide-react';
import {
  fetchRasterHistogram,
  formatHistogramValue,
  type PixelHistogram,
} from '../../services/rasterHistogram';
import { RasterValueDistribution } from './suitability/RasterValueDistribution';
import {
  distributeReclassBins,
  equalIntervalBins,
  histogramValueRange,
  isUntouchedDefaultBins,
  suggestedInterval,
  type BinScheme,
} from './suitability/reclassBins';
import { CONFIGURE_GUIDE } from './suitability/wizardCopy';
import { experienceUi } from './experienceUi';
import type { CatalogRaster, LayerReclassConfig, RasterScope, ReclassBin } from './types';

interface LayerConfigProps {
  raster: CatalogRaster;
  config: LayerReclassConfig;
  scaleMax: number;
  isPreviewed: boolean;
  analysisScope: RasterScope;
  token: string | null;
  onConfigChange: (config: LayerReclassConfig) => void;
  onRemove: () => void;
  onTogglePreview: () => void;
}

function scoreOptions(scaleMax: number): number[] {
  return Array.from({ length: scaleMax }, (_, index) => index + 1);
}

function ReclassInfoTip() {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const tipId = useId();
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const popRef = useRef<HTMLDivElement | null>(null);
  const guide = CONFIGURE_GUIDE.reclass;

  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const button = buttonRef.current;
      const pop = popRef.current;
      if (!button || !pop) return;
      const anchor = button.getBoundingClientRect();
      const margin = 12;
      let left = anchor.left;
      if (left + pop.offsetWidth > window.innerWidth - margin) {
        left = Math.max(margin, window.innerWidth - pop.offsetWidth - margin);
      }
      let top = anchor.bottom + 8;
      if (top + pop.offsetHeight > window.innerHeight - margin) {
        top = Math.max(margin, anchor.top - pop.offsetHeight - 8);
      }
      setPosition({ top, left });
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target) || popRef.current?.contains(target)) return;
      setOpen(false);
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
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={tipId}
        title="About reclassification"
        onClick={() => setOpen((value) => !value)}
        className="rounded p-0.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-emerald-700"
      >
        <Info className="h-3.5 w-3.5" />
        <span className="sr-only">About reclassification</span>
      </button>
      {open && createPortal(
        <div
          ref={popRef}
          id={tipId}
          role="tooltip"
          style={{
            position: 'fixed',
            top: position?.top ?? 0,
            left: position?.left ?? 0,
            width: '20rem',
            zIndex: 200,
            visibility: position ? 'visible' : 'hidden',
          }}
          className="rounded-card border border-gray-200 bg-white p-3 text-sm leading-relaxed text-gray-600 shadow-lg"
        >
          <p>{guide.body}</p>
          <ul className="mt-2 flex flex-col gap-2">
            {guide.modes.map((mode) => (
              <li key={mode.name}>
                <span className="font-semibold text-gray-800">{mode.name}: </span>
                {mode.detail}
              </li>
            ))}
          </ul>
        </div>,
        document.body,
      )}
    </>
  );
}

function trustedCatalogRange(raster: CatalogRaster): { min: number; max: number } | null {
  const min = raster.valueMin;
  const max = raster.valueMax;
  if (min == null || max == null || !(max > min)) return null;
  if (min === 0 && max === 100) return null;
  return { min, max };
}

export function initLayerConfig(raster: CatalogRaster): LayerReclassConfig {
  const isCategorical = raster.units.toLowerCase() === 'category';
  const catalogRange = trustedCatalogRange(raster);
  const valueMin = catalogRange?.min ?? raster.valueMin ?? 0;
  const valueMax = catalogRange?.max ?? raster.valueMax ?? 100;

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

  const bins: ReclassBin[] = catalogRange
    ? equalIntervalBins(catalogRange.min, catalogRange.max, 3, 5)
    : [];

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
  analysisScope,
  token,
  onConfigChange,
  onRemove,
  onTogglePreview,
}: LayerConfigProps) {
  const scores = scoreOptions(scaleMax);
  const [scheme, setScheme] = useState<BinScheme>('equal-interval');
  const [binCount, setBinCount] = useState(3);
  const [intervalText, setIntervalText] = useState('');
  const [rangeHistogram, setRangeHistogram] = useState<PixelHistogram | null>(null);
  const [rangeError, setRangeError] = useState<string | null>(null);
  const [breakNotice, setBreakNotice] = useState<string | null>(null);
  const configRef = useRef(config);
  const seededRange = useRef(false);
  configRef.current = config;

  const valueRange = rangeHistogram ? histogramValueRange(rangeHistogram) : null;

  useEffect(() => {
    if (raster.units.toLowerCase() === 'category') return;
    const controller = new AbortController();
    setRangeHistogram(null);
    setRangeError(null);
    const request = (extent: 'full' | 'analysis') => fetchRasterHistogram({
      url: raster.url,
      extent,
      scope: analysisScope,
      resolutionMeters: raster.resolution,
      categorical: false,
      mosaicTag: raster.mosaicTag,
      token,
      signal: controller.signal,
    });
    request('full')
      .catch(() => request('analysis'))
      .then((histogram) => {
        if (!controller.signal.aborted) setRangeHistogram(histogram);
      })
      .catch((caught: unknown) => {
        if (controller.signal.aborted) return;
        setRangeError(caught instanceof Error ? caught.message : 'Could not read the layer range.');
      });
    return () => controller.abort();
  }, [analysisScope, raster.mosaicTag, raster.resolution, raster.units, raster.url, token]);

  useEffect(() => {
    if (!rangeHistogram || seededRange.current) return;
    const range = histogramValueRange(rangeHistogram);
    if (!range) return;
    const current = configRef.current;
    const next = { ...current };
    let changed = false;
    if (isUntouchedDefaultBins(current.bins)) {
      const result = distributeReclassBins({
        scheme: 'equal-interval',
        histogram: rangeHistogram,
        binCount: 3,
        interval: suggestedInterval(range.min, range.max),
        scaleMax,
      });
      if (result.ok) {
        next.bins = result.bins;
        changed = true;
      }
    }
    if (
      current.rescaleMin === 0
      && current.rescaleMax === 100
      && (range.min !== 0 || range.max !== 100)
    ) {
      next.rescaleMin = range.min;
      next.rescaleMax = range.max;
      changed = true;
    }
    seededRange.current = true;
    setIntervalText((current) => current || String(suggestedInterval(range.min, range.max)));
    if (changed) onConfigChange(next);
  }, [onConfigChange, rangeHistogram, scaleMax]);

  const applyDistribution = (nextScheme: BinScheme = scheme) => {
    if (!rangeHistogram || !valueRange) {
      setBreakNotice('The layer range is still loading.');
      return;
    }
    const parsedInterval = Number.parseFloat(intervalText);
    const interval = parsedInterval > 0
      ? parsedInterval
      : suggestedInterval(valueRange.min, valueRange.max);
    const result = distributeReclassBins({
      scheme: nextScheme,
      histogram: rangeHistogram,
      binCount,
      interval,
      scaleMax,
    });
    seededRange.current = true;
    if (!result.ok) {
      setBreakNotice(result.message);
      return;
    }
    setBreakNotice(null);
    onConfigChange({ ...config, bins: result.bins });
  };

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
    <div className="min-w-0 overflow-hidden rounded-card border border-gray-200 bg-white">
      <div className="flex items-start gap-2 border-b border-gray-100 px-3 py-2">
        <div className="min-w-0 flex-1">
          <p className="break-words text-sm font-semibold whitespace-normal text-gray-900">
            {raster.title}
          </p>
          <p className="text-xs text-gray-500">
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
        <RasterValueDistribution
          raster={raster}
          analysisScope={analysisScope}
          token={token}
          classLabels={config.categoryLabels}
        />
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
            <span className="w-4 text-right text-sm font-semibold tabular-nums text-gray-800">
              {config.weight}
            </span>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-1">
            <span className={experienceUi.labelSm}>Reclassification</span>
            <ReclassInfoTip />
          </div>
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
            <div className="flex min-w-0 items-end gap-1.5">
              <label className="flex min-w-0 flex-1 flex-col gap-1">
                <span className={experienceUi.labelSm}>Breaks</span>
                <select
                  value={scheme}
                  onChange={(event) => {
                    const next = event.target.value as BinScheme;
                    setScheme(next);
                    applyDistribution(next);
                  }}
                  className={`${experienceUi.input} py-1.5`}
                >
                  <option value="equal-interval">Equal interval</option>
                  <option value="quantile">Quantile</option>
                  <option value="defined-interval">Defined interval</option>
                </select>
              </label>
              <label className="flex w-[4.5rem] flex-col gap-1">
                <span className={experienceUi.labelSm}>
                  {scheme === 'defined-interval' ? 'Interval' : 'Bins'}
                </span>
                {scheme === 'defined-interval' ? (
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={intervalText}
                    onChange={(event) => setIntervalText(event.target.value)}
                    onBlur={() => applyDistribution()}
                    className={`${experienceUi.input} py-1.5`}
                  />
                ) : (
                  <input
                    type="number"
                    min={2}
                    max={12}
                    step={1}
                    value={binCount}
                    onChange={(event) => {
                      const next = Number.parseInt(event.target.value, 10);
                      if (!Number.isFinite(next)) return;
                      setBinCount(Math.min(12, Math.max(2, next)));
                    }}
                    onBlur={() => applyDistribution()}
                    className={`${experienceUi.input} py-1.5`}
                  />
                )}
              </label>
              <button
                type="button"
                onClick={() => applyDistribution()}
                disabled={!valueRange}
                className="rounded-button bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
              >
                Apply
              </button>
            </div>
            {valueRange && (
              <p className="text-[11px] leading-relaxed text-gray-500">
                Layer range {formatHistogramValue(valueRange.min)}–{formatHistogramValue(valueRange.max)}
              </p>
            )}
            {rangeHistogram && !valueRange && (
              <p className="text-[11px] leading-relaxed text-gray-500">This layer has no numeric range to split.</p>
            )}
            {!rangeHistogram && !rangeError && (
              <p className="text-[11px] leading-relaxed text-gray-500">Reading this layer’s value range…</p>
            )}
            {rangeError && (
              <p className="text-[11px] leading-relaxed text-red-700">{rangeError}</p>
            )}
            {breakNotice && (
              <p className="text-[11px] leading-relaxed text-red-700">{breakNotice}</p>
            )}
            {config.bins.length > 0 && (
            <div className="grid w-full min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)_3.5rem_1.25rem] gap-1 text-[10px] font-medium uppercase tracking-wide text-gray-400">
              <span>Min</span>
              <span>Max</span>
              <span>Score</span>
              <span />
            </div>
            )}
            {config.bins.map((bin, index) => (
              <div key={index} className="grid w-full min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)_3.5rem_1.25rem] items-center gap-1">
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
                const last = config.bins[config.bins.length - 1];
                const lastMax = last?.max ?? valueRange?.max ?? 0;
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
            <div className="grid w-full min-w-0 grid-cols-[4rem_minmax(0,1fr)_3.5rem_1.25rem] gap-1 text-[10px] font-medium uppercase tracking-wide text-gray-400">
              <span>Value</span>
              <span>Class</span>
              <span>Score</span>
              <span />
            </div>
            {Object.entries(config.categories).map(([value, score]) => (
              <div
                key={value}
                className="grid w-full min-w-0 grid-cols-[4rem_minmax(0,1fr)_3.5rem_1.25rem] items-center gap-1"
              >
                {config.categoryLabels[value] ? (
                  <span className="px-1 text-sm tabular-nums text-gray-800">{value}</span>
                ) : (
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
                )}
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
