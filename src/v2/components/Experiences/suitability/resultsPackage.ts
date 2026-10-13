// ============================================================================
// resultsPackage — everything a finished suitability run can export, as one zip.
//
//   <name>.tif                              the GeoTIFF
//   <name>.png                              the rendered map image
//   <name>-layers-and-weights.csv           each layer, its weight and scoring
//   <name>-settings.json                    the run's settings, with weight shares
//   <name>-suitability-distribution.png     the distribution chart (SVG if the
//                                           browser cannot rasterize it)
//   missing-files.txt                       only when a remote file was blocked
// ============================================================================

import JSZip from 'jszip';
import type { CompletedRun, SuitabilityRunAnalysis, SuitabilityRunInput, SuitabilityRunRecord } from '../types';
import {
  distributionBins,
  formatArea,
  formatCount,
  formatNumber,
  formatPercent,
  scoreColor,
} from './RunAnalysisView';
import { relativeWeights } from './RunSettingsView';

export const CHART_WIDTH = 560;
export const CHART_HEIGHT = 320;

export function packageStem(name: string): string {
  const cleaned = name.replace(/[<>:"/\\|?*\u0000-\u001f]/g, '').trim();
  return cleaned || 'suitability-run';
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** The suitability distribution chart as a standalone SVG document. */
export function buildDistributionSvg(analysis: SuitabilityRunAnalysis, title: string): string {
  const bins = distributionBins(analysis);
  const scaleMax = analysis.scale_max;
  const left = 24;
  const right = CHART_WIDTH - 24;
  const top = 92;
  const bottom = 262;
  const plotHeight = bottom - top;
  const barWidth = (right - left) / Math.max(bins.length, 1);
  const max = Math.max(...bins.map((bin) => bin.count), 1);
  const area = formatArea(analysis.area_km2.scored);
  const subtitle =
    `${formatCount(analysis.cells.scored)} scored cells${area ? ` (${area})` : ''}` +
    ` · mean ${formatNumber(analysis.stats.mean)} · median ${formatNumber(analysis.stats.median)}`;

  const parts: string[] = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${CHART_WIDTH}" height="${CHART_HEIGHT}" viewBox="0 0 ${CHART_WIDTH} ${CHART_HEIGHT}" font-family="Arial, Helvetica, sans-serif">`,
    `<rect width="${CHART_WIDTH}" height="${CHART_HEIGHT}" fill="#ffffff"/>`,
    `<text x="${left}" y="30" font-size="16" font-weight="700" fill="#111827">Suitability distribution</text>`,
    `<text x="${left}" y="50" font-size="12" fill="#4b5563">${escapeXml(title)}</text>`,
    `<text x="${left}" y="68" font-size="12" fill="#4b5563">${escapeXml(subtitle)}</text>`,
  ];

  bins.forEach((bin, index) => {
    const x = left + index * barWidth;
    const height = bin.count > 0 ? Math.max((bin.count / max) * plotHeight * 0.86, 2) : 2;
    const fill = bin.count > 0 ? scoreColor((bin.low + bin.high) / 2, scaleMax) : '#e5e7eb';
    parts.push(
      `<rect x="${x.toFixed(2)}" y="${(bottom - height).toFixed(2)}" width="${barWidth.toFixed(2)}" height="${height.toFixed(2)}" fill="${fill}" stroke="#ffffff" stroke-width="1"/>`,
    );
    if (bin.count > 0) {
      parts.push(
        `<text x="${(x + barWidth / 2).toFixed(2)}" y="${(bottom - height - 6).toFixed(2)}" font-size="12" text-anchor="middle" fill="#374151">${escapeXml(formatPercent(bin.percent))}</text>`,
      );
    }
    parts.push(
      `<text x="${(x + barWidth / 2).toFixed(2)}" y="${bottom + 18}" font-size="12" text-anchor="middle" fill="#374151">${escapeXml(`${formatNumber(bin.low)}–${formatNumber(bin.high)}`)}</text>`,
    );
  });

  parts.push(
    `<line x1="${left}" y1="${bottom}" x2="${right}" y2="${bottom}" stroke="#9ca3af" stroke-width="1"/>`,
    `<text x="${left}" y="${bottom + 42}" font-size="11" fill="#6b7280">Low suitability</text>`,
    `<text x="${right}" y="${bottom + 42}" font-size="11" text-anchor="end" fill="#6b7280">High suitability</text>`,
    '</svg>',
  );
  return parts.join('\n');
}

async function svgToPngBlob(svg: string): Promise<Blob | null> {
  if (typeof document === 'undefined') return null;
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('Could not load chart SVG'));
      image.src = url;
    });
    const scale = 2;
    const canvas = document.createElement('canvas');
    canvas.width = CHART_WIDTH * scale;
    canvas.height = CHART_HEIGHT * scale;
    const context = canvas.getContext('2d');
    if (!context) return null;
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function csvCell(value: string | number): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** One line describing how a layer's values were turned into scores. */
export function scoringSummary(layer: SuitabilityRunInput, scaleMax: number): string {
  if (layer.type === 'categorical') {
    return Object.entries(layer.categories ?? {})
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([value, score]) => {
        const name = layer.categoryLabels?.[value];
        return `${name ? `${name} (${value})` : value} = ${formatNumber(score)}`;
      })
      .join('; ');
  }
  if (layer.type === 'rescale') {
    return (
      `${formatNumber(layer.rescaleMin)} to ${formatNumber(layer.rescaleMax)} rescaled to 1 to ${scaleMax}` +
      (layer.invert ? ' (inverted)' : '')
    );
  }
  return (layer.bins ?? [])
    .map((bin) => `${formatNumber(bin.min)}-${formatNumber(bin.max)} = ${formatNumber(bin.score)}`)
    .join('; ');
}

export function buildLayersCsv(record: SuitabilityRunRecord): string {
  const shares = relativeWeights(record.layers);
  const rows = [['layer', 'weight', 'relative_weight_percent', 'scoring_type', 'scoring']];
  record.layers.forEach((layer, index) => {
    rows.push([
      layer.title,
      String(layer.weight),
      shares[index].toFixed(1),
      layer.type,
      scoringSummary(layer, record.scaleMax),
    ]);
  });
  return `${rows.map((row) => row.map(csvCell).join(',')).join('\r\n')}\r\n`;
}

export function buildSettingsJson(record: SuitabilityRunRecord, cellSize: number | null | undefined): string {
  const shares = relativeWeights(record.layers);
  return JSON.stringify(
    {
      name: record.name,
      extent: record.extent,
      extent_label: record.extentLabel,
      cell_size: cellSize ?? null,
      scale_max: record.scaleMax,
      layers: record.layers.map((layer, index) => ({
        ...layer,
        relative_weight_percent: Number(shares[index].toFixed(2)),
      })),
    },
    null,
    2,
  );
}

async function fetchBytes(url: string): Promise<ArrayBuffer | null> {
  try {
    const response = await fetch(url);
    return response.ok ? await response.arrayBuffer() : null;
  } catch {
    return null;
  }
}

export interface ResultsPackage {
  blob: Blob;
  filename: string;
  /** Remote files that could not be fetched, so were left out of the zip. */
  missing: string[];
}

/** True when a run has anything to export. */
export function hasResults(run: CompletedRun): boolean {
  return Boolean(run.tifUrl || run.pngUrl || run.record);
}

export async function buildResultsPackage(run: CompletedRun): Promise<ResultsPackage | null> {
  if (!hasResults(run)) return null;
  const stem = packageStem(run.record?.name ?? run.title);
  const zip = new JSZip();
  const missing: string[] = [];

  const remote: [string, string | null][] = [
    [`${stem}.tif`, run.tifUrl],
    [`${stem}.png`, run.pngUrl],
  ];
  await Promise.all(
    remote.map(async ([name, url]) => {
      if (!url) return;
      const bytes = await fetchBytes(url);
      if (bytes) zip.file(name, bytes);
      else missing.push(`${name}: ${url}`);
    }),
  );

  if (run.record) {
    zip.file(`${stem}-layers-and-weights.csv`, buildLayersCsv(run.record));
    zip.file(`${stem}-settings.json`, buildSettingsJson(run.record, run.analysis?.cell_size));
  }

  if (run.analysis) {
    const svg = buildDistributionSvg(run.analysis, run.title);
    const png = await svgToPngBlob(svg);
    if (png) zip.file(`${stem}-suitability-distribution.png`, png);
    else zip.file(`${stem}-suitability-distribution.svg`, svg);
  }

  if (missing.length > 0) {
    zip.file(
      'missing-files.txt',
      `These files could not be fetched by the browser, so they are not in this zip.\r\nOpen the links directly to download them.\r\n\r\n${missing.join('\r\n')}\r\n`,
    );
  }

  return { blob: await zip.generateAsync({ type: 'blob' }), filename: `${stem}-results.zip`, missing };
}

export function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
