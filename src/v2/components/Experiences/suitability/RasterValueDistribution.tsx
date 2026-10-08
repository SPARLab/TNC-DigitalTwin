// ============================================================================
// Collapsible pixel-value histogram for one suitability layer.
// ============================================================================

import { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';
import { BarChart3, Loader2 } from 'lucide-react';
import {
  fetchRasterHistogram,
  formatHistogramValue,
  type HistogramBin,
  type HistogramExtent,
  type PixelHistogram,
} from '../../../services/rasterHistogram';
import type { CatalogRaster, RasterScope } from '../types';
import { experienceUi } from '../experienceUi';
import { EXTENT_GUIDE } from './wizardCopy';

interface RasterValueDistributionProps {
  raster: CatalogRaster;
  analysisScope: RasterScope;
  token: string | null;
  classLabels?: Record<string, string>;
}

function classCode(bin: HistogramBin): string | null {
  if (bin.min === bin.max && Number.isFinite(bin.min)) {
    const rounded = Math.round(bin.min);
    if (Math.abs(bin.min - rounded) < 1e-6) return String(rounded);
  }
  return null;
}

function binText(bin: HistogramBin, classLabels: Record<string, string>): string {
  const code = classCode(bin);
  if (!code) return bin.label;
  return classLabels[code] || bin.label;
}

function labelsAreNamed(bins: HistogramBin[], classLabels: Record<string, string>): boolean {
  return bins.some((bin) => binText(bin, classLabels) !== bin.label);
}

export function RasterValueDistribution({
  raster,
  analysisScope,
  token,
  classLabels = {},
}: RasterValueDistributionProps) {
  const chartRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [extent, setExtent] = useState<HistogramExtent>('analysis');
  const [histogram, setHistogram] = useState<PixelHistogram | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categorical = raster.units.toLowerCase() === 'category';
  const extentLabel = EXTENT_GUIDE[analysisScope].label;

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setHistogram(null);

    fetchRasterHistogram({
      url: raster.url,
      extent,
      scope: analysisScope,
      resolutionMeters: raster.resolution,
      categorical,
      mosaicTag: raster.mosaicTag,
      token,
      signal: controller.signal,
    })
      .then((next) => {
        if (!controller.signal.aborted) setHistogram(next);
      })
      .catch((caught: unknown) => {
        if (controller.signal.aborted) return;
        setError(caught instanceof Error ? caught.message : String(caught));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [open, extent, raster.url, raster.resolution, raster.mosaicTag, analysisScope, categorical, token]);

  useEffect(() => {
    const element = chartRef.current;
    if (!element || !histogram || histogram.bins.length === 0) return;

    const chart = echarts.init(element);
    const labels = histogram.bins.map((bin) => binText(bin, classLabels));
    const named = labels.some((label, index) => label !== histogram.bins[index].label);
    const many = histogram.bins.length > 16;
    const option: echarts.EChartsOption = named
      ? {
          animation: false,
          grid: { left: 8, right: 16, top: 8, bottom: 24, containLabel: true },
          tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            formatter: (params: unknown) => {
              const row = (params as { dataIndex: number; value: number }[])[0];
              if (!row) return '';
              const bin = histogram.bins[row.dataIndex];
              const code = classCode(bin);
              const name = labels[row.dataIndex];
              const title = code && name !== code ? `${name} (${code})` : name;
              return `${title}<br/>${row.value.toLocaleString('en-US')} pixels`;
            },
          },
          xAxis: {
            type: 'value',
            axisLabel: { fontSize: 10, color: '#64748b' },
            splitLine: { lineStyle: { color: '#f1f5f9' } },
          },
          yAxis: {
            type: 'category',
            data: labels,
            inverse: true,
            axisLabel: { fontSize: 11, color: '#334155', width: 140, overflow: 'truncate' },
            axisTick: { show: false },
            axisLine: { lineStyle: { color: '#e2e8f0' } },
          },
          series: [
            {
              type: 'bar',
              data: histogram.bins.map((bin) => bin.count),
              itemStyle: { color: '#059669' },
              barCategoryGap: '28%',
            },
          ],
        }
      : {
          animation: false,
          grid: { left: 44, right: 8, top: 12, bottom: many ? 36 : 28 },
          tooltip: {
            trigger: 'item',
            formatter: (params: unknown) => {
              const data = (params as { data?: number[] }).data;
              if (!data) return '';
              return `${formatHistogramValue(data[0])}–${formatHistogramValue(data[1])}<br/>${Math.round(data[2]).toLocaleString('en-US')} pixels`;
            },
          },
          xAxis: {
            type: 'value',
            min: histogram.bins[0].min,
            max: histogram.bins[histogram.bins.length - 1].max,
            axisLabel: {
              fontSize: 10,
              color: '#64748b',
              hideOverlap: true,
              formatter: (value: number) => formatHistogramValue(value),
            },
            axisLine: { lineStyle: { color: '#e2e8f0' } },
            splitLine: { show: false },
          },
          yAxis: {
            type: 'value',
            axisLabel: { fontSize: 10, color: '#64748b' },
            splitLine: { lineStyle: { color: '#f1f5f9' } },
          },
          series: [
            {
              type: 'custom',
              renderItem: (params, api) => {
                const start = api.coord([api.value(0), api.value(2)]);
                const end = api.coord([api.value(1), 0]);
                const width = end[0] - start[0];
                if (!start || !end || width === 0) return;
                return {
                  type: 'rect',
                  shape: {
                    x: start[0],
                    y: start[1],
                    width: Math.max(width - (many ? 0 : 1), 1),
                    height: Math.max(end[1] - start[1], 0),
                  },
                  style: { fill: '#059669' },
                };
              },
              encode: { x: [0, 1], y: 2 },
              data: histogram.bins.map((bin) => [bin.min, bin.max, bin.count]),
            },
          ],
        };
    chart.setOption(option);
    const onResize = () => chart.resize();
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      chart.dispose();
    };
  }, [histogram, classLabels]);

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 hover:text-emerald-800"
      >
        <BarChart3 className="h-4 w-4" />
        {open ? 'Hide distribution' : 'View distribution'}
      </button>

      {open && (
        <div className="rounded-card border border-gray-200 bg-gray-50 px-2.5 py-2.5">
          <div role="group" aria-label="Histogram extent" className={experienceUi.toggleGroup}>
            {(
              [
                ['analysis', 'Analysis extent'],
                ['full', 'Full extent'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setExtent(value)}
                className={`${experienceUi.toggleBtn} ${
                  extent === value ? experienceUi.toggleBtnActive : ''
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-gray-500">
            {extent === 'analysis'
              ? `Pixel counts inside ${extentLabel}.`
              : 'Pixel counts across the full raster.'}
            {histogram?.approximate ? ' Approximate sample of the grid.' : ''}
            {histogram && histogram.bandCount > 1
              ? ` Showing band 1 of ${histogram.bandCount}.`
              : ''}
          </p>

          {loading && (
            <div className="flex items-center gap-2 py-6 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Computing histogram…
            </div>
          )}

          {error && <p className="mt-2 text-sm leading-relaxed text-red-700">{error}</p>}

          {histogram && histogram.bins.length > 0 && (
            <>
              <div
                ref={chartRef}
                className="mt-1 w-full"
                style={{
                  height: labelsAreNamed(histogram.bins, classLabels)
                    ? Math.min(360, 28 + histogram.bins.length * 26)
                    : 160,
                }}
              />
              <p className="text-xs text-gray-500">
                {histogram.total.toLocaleString('en-US')} pixels
                {raster.units ? ` · ${raster.units}` : ''}
              </p>
            </>
          )}

          {histogram && histogram.bins.length === 0 && !loading && !error && (
            <p className="py-4 text-sm text-gray-500">No pixel values in this extent.</p>
          )}
        </div>
      )}
    </div>
  );
}
