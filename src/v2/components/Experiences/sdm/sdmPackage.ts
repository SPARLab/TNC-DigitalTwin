// ============================================================================
// sdmPackage — the model runs and analyses a user ticks, as one zip.
//
//   <Species>/
//     Model runs/<run>/            map.tif, map.png, summary.json, summary.csv and,
//                                  for probability runs, distribution.csv and
//                                  distribution.png
//     Comparisons/<run>/           one TIFF per output, map.png, the summaries
//     Common areas/<run>/          one TIFF per output, map.png, the summaries
//   Several species/Common areas/  results that combine species
//
// Names inside a run's folder are short on purpose: the folder says which run it
// is, and long paths are what make Windows refuse to unzip a folder.
//   manifest.csv                   every run in the zip and what was saved
//   missing-files.txt              only when a remote file was blocked
// ============================================================================

import JSZip from 'jszip';
import { gpJobExportUrl } from '../../../services/geoprocessingService';
import { CHART_HEIGHT, CHART_WIDTH, csvCell, packageStem, svgToPngBlob } from '../suitability/resultsPackage';
import { formatNumber } from '../suitability/RunAnalysisView';
import {
  runDisplayTitle,
  runKind,
  runScenario,
  runSpeciesKey,
  runSpeciesLabel,
  spansSpecies,
} from '../sdmRuns';
import type { CompletedRun, SdmHistogram, SdmRunKind } from '../types';
import { probabilityColor } from './sdmColors';

const KIND_FOLDERS: Record<SdmRunKind, string> = {
  model: 'Model runs',
  comparison: 'Comparisons',
  common: 'Common areas',
};

export const SEVERAL_SPECIES_FOLDER = 'Several species';
const OTHER_FOLDER = 'Other runs';

/** A path segment Windows accepts: no trailing dots or spaces, and not too long. */
export function safeSegment(name: string, max = 44): string {
  const clipped = name.length > max ? name.slice(0, max) : name;
  return clipped.replace(/[. ]+$/, '').trim() || 'run';
}

/** The species a run is packed under. A common-areas result of several is on its own. */
export function speciesFolderOf(run: CompletedRun): string {
  if (runKind(run) === 'common' && !runSpeciesKey(run) && spansSpecies(run.inputRuns)) {
    return SEVERAL_SPECIES_FOLDER;
  }
  const label = runSpeciesLabel(run);
  return label ? safeSegment(packageStem(label)) : OTHER_FOLDER;
}

/** A folder name for the run: what sets it apart, with the end of its job id to keep it unique. */
export function runFolderName(run: CompletedRun): string {
  return `${safeSegment(packageStem(runDisplayTitle(run)), 40)}-${run.jobId.slice(-6)}`;
}

/** A flat list of "path, value" rows for everything in a figures object. */
export function flattenFigures(value: unknown, path = ''): [string, string][] {
  if (value == null) return [];
  if (typeof value !== 'object') return path ? [[path, String(value)]] : [];
  if (Array.isArray(value)) {
    if (value.every((item) => item == null || typeof item !== 'object')) {
      return path ? [[path, value.map((item) => (item == null ? '' : String(item))).join('; ')]] : [];
    }
    return value.flatMap((item, index) => flattenFigures(item, `${path}[${index}]`));
  }
  return Object.entries(value).flatMap(([key, inner]) =>
    flattenFigures(inner, path ? `${path}.${key}` : key),
  );
}

export function figuresCsv(figures: unknown): string {
  const rows = [['metric', 'value'], ...flattenFigures(figures)];
  return `${rows.map((row) => row.map(csvCell).join(',')).join('\r\n')}\r\n`;
}

export function histogramCsv(histogram: SdmHistogram): string {
  const rows: (string | number)[][] = [['bin_low', 'bin_high', 'cells', 'percent', 'area_km2']];
  histogram.counts.forEach((count, index) => {
    rows.push([
      histogram.bin_edges[index] ?? '',
      histogram.bin_edges[index + 1] ?? '',
      count,
      histogram.percent[index] ?? '',
      histogram.area_km2[index] ?? '',
    ]);
  });
  return `${rows.map((row) => row.map(csvCell).join(',')).join('\r\n')}\r\n`;
}

function escapeXml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** The probability distribution as a standalone SVG, with the threshold marked. */
export function buildProbabilitySvg(
  histogram: SdmHistogram,
  title: string,
  threshold: number | null,
): string {
  const left = 24;
  const right = CHART_WIDTH - 24;
  const top = 92;
  const bottom = 262;
  const count = Math.max(histogram.counts.length, 1);
  const barWidth = (right - left) / count;
  const max = Math.max(...histogram.percent.map((value) => value ?? 0), 1);
  const x = (probability: number) => left + Math.min(Math.max(probability, 0), 1) * (right - left);

  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${CHART_WIDTH}" height="${CHART_HEIGHT}" viewBox="0 0 ${CHART_WIDTH} ${CHART_HEIGHT}" font-family="Arial, Helvetica, sans-serif">`,
    `<rect width="${CHART_WIDTH}" height="${CHART_HEIGHT}" fill="#ffffff"/>`,
    `<text x="${left}" y="30" font-size="16" font-weight="700" fill="#111827">Suitability probability</text>`,
    `<text x="${left}" y="50" font-size="12" fill="#4b5563">${escapeXml(title)}</text>`,
    `<text x="${left}" y="68" font-size="12" fill="#4b5563">Share of mapped cells at each probability</text>`,
  ];
  histogram.counts.forEach((_, index) => {
    const low = histogram.bin_edges[index] ?? 0;
    const high = histogram.bin_edges[index + 1] ?? low;
    const percent = histogram.percent[index] ?? 0;
    const height = percent > 0 ? Math.max((percent / max) * (bottom - top) * 0.9, 2) : 2;
    parts.push(
      `<rect x="${(left + index * barWidth).toFixed(2)}" y="${(bottom - height).toFixed(2)}" width="${barWidth.toFixed(2)}" height="${height.toFixed(2)}" fill="${percent > 0 ? probabilityColor((low + high) / 2) : '#e5e7eb'}" stroke="#ffffff" stroke-width="0.5"/>`,
    );
  });
  parts.push(`<line x1="${left}" y1="${bottom}" x2="${right}" y2="${bottom}" stroke="#9ca3af"/>`);
  for (const tick of [0, 0.25, 0.5, 0.75, 1]) {
    parts.push(
      `<text x="${x(tick).toFixed(2)}" y="${bottom + 18}" font-size="12" text-anchor="${tick === 0 ? 'start' : tick === 1 ? 'end' : 'middle'}" fill="#374151">${tick}</text>`,
    );
  }
  if (threshold != null && Number.isFinite(threshold)) {
    parts.push(
      `<line x1="${x(threshold).toFixed(2)}" y1="${top - 8}" x2="${x(threshold).toFixed(2)}" y2="${bottom}" stroke="#111827" stroke-width="1.5" stroke-dasharray="5 4"/>`,
      `<text x="${x(threshold).toFixed(2)}" y="${top - 12}" font-size="12" font-weight="700" text-anchor="${threshold > 0.85 ? 'end' : 'middle'}" fill="#111827">threshold ${escapeXml(formatNumber(threshold))}</text>`,
    );
  }
  parts.push('</svg>');
  return parts.join('\n');
}

function metadata(run: CompletedRun) {
  return {
    title: run.title,
    kind: runKind(run),
    species: run.species ?? null,
    species_scientific_name: run.speciesKey ?? null,
    scenario: run.scenario ?? null,
    output_type: run.outputType ?? null,
    job_id: run.jobId,
    made_at: new Date(run.addedAt).toISOString(),
    input_runs: (run.inputRuns ?? []).map((input) => ({
      job_id: input.jobId,
      species: input.species ?? null,
      scenario: input.scenario ?? null,
      title: input.title,
    })),
  };
}

function figuresOf(run: CompletedRun): unknown {
  return run.sdmSummary ?? run.comparison ?? run.common ?? null;
}

export interface SdmPackage {
  blob: Blob;
  filename: string;
  /** Remote files that could not be fetched, each with the reason, so were left out of the zip. */
  missing: string[];
}

export function hasSdmFiles(run: CompletedRun): boolean {
  return Boolean(run.tifUrl || run.pngUrl || run.downloads?.length || figuresOf(run));
}

/** A file's bytes, or why it could not be had. A blocked request has no reason to give. */
async function fetchWithReason(url: string): Promise<{ bytes: ArrayBuffer } | { reason: string }> {
  try {
    const response = await fetch(url);
    if (!response.ok) return { reason: `the server answered ${response.status}` };
    return { bytes: await response.arrayBuffer() };
  } catch {
    return { reason: 'the browser was not allowed to read it (blocked by the server or network)' };
  }
}

/** PNG or JPEG signature, so an error page the server answered with is not saved as a picture. */
function looksLikeImage(bytes: ArrayBuffer): boolean {
  const head = new Uint8Array(bytes.slice(0, 4));
  return (head[0] === 0x89 && head[1] === 0x50) || (head[0] === 0xff && head[1] === 0xd8);
}

/** Everything to save for a run, as [file name, content] pairs. */
async function filesFor(
  run: CompletedRun,
  missing: string[],
): Promise<[string, ArrayBuffer | string | Blob][]> {
  const files: [string, ArrayBuffer | string | Blob][] = [];
  const taken = new Set<string>();
  const unique = (name: string) => {
    let candidate = name;
    for (let count = 2; taken.has(candidate.toLowerCase()); count += 1) {
      candidate = name.replace(/(\.[^.]+)$/, `-${count}$1`);
    }
    taken.add(candidate.toLowerCase());
    return candidate;
  };

  const remote: [string, string][] = [];
  const published = run.downloads ?? [];
  if (published.length > 0) {
    for (const download of published) {
      remote.push([unique(`${safeSegment(packageStem(download.label), 40)}.tif`), download.url]);
    }
  } else if (run.tifUrl) {
    remote.push([unique('map.tif'), run.tifUrl]);
  }
  // The link saved with the run points at a temporary file the server may have cleaned
  // up, so ask the map service for the image again when the run knows its extent.
  const pngName = run.pngUrl || run.mapExtent ? unique('map.png') : null;
  if (pngName) {
    let result: Awaited<ReturnType<typeof fetchWithReason>> = { reason: 'there is no link to it' };
    let url = run.pngUrl ?? '';
    if (run.mapExtent) {
      url = gpJobExportUrl(run.mapServerUrl, run.jobId, run.mapExtent, 'image');
      result = await fetchWithReason(url);
      if ('bytes' in result && !looksLikeImage(result.bytes)) {
        result = { reason: 'the server did not send an image' };
      }
    }
    if (!('bytes' in result) && run.pngUrl) {
      url = run.pngUrl;
      result = await fetchWithReason(url);
    }
    if ('bytes' in result) files.push([pngName, result.bytes]);
    else missing.push(`${runDisplayTitle(run)} / ${pngName}: ${result.reason}\r\n    ${url}`);
  }
  await Promise.all(
    remote.map(async ([name, url]) => {
      const result = await fetchWithReason(url);
      if ('bytes' in result) files.push([name, result.bytes]);
      else missing.push(`${runDisplayTitle(run)} / ${name}: ${result.reason}\r\n    ${url}`);
    }),
  );

  const figures = figuresOf(run);
  files.push([
    unique('summary.json'),
    JSON.stringify({ run: metadata(run), figures }, null, 2),
  ]);
  if (figures) files.push([unique('summary.csv'), figuresCsv({ run: metadata(run), figures })]);

  const histogram = run.sdmSummary?.histogram;
  if (histogram && run.sdmSummary?.output_type === 'Probability') {
    files.push([unique('distribution.csv'), histogramCsv(histogram)]);
    const svg = buildProbabilitySvg(
      histogram,
      `${run.species ?? ''} ${runScenario(run)}`.trim(),
      run.sdmSummary.model?.optimal_threshold ?? null,
    );
    const png = await svgToPngBlob(svg);
    files.push(png ? [unique('distribution.png'), png] : [unique('distribution.svg'), svg]);
  }
  return files;
}

export async function buildSdmPackage(runs: CompletedRun[]): Promise<SdmPackage | null> {
  const chosen = runs.filter((run) => runKind(run) && hasSdmFiles(run));
  if (chosen.length === 0) return null;

  const zip = new JSZip();
  const missing: string[] = [];
  const manifest: string[][] = [
    ['folder', 'species', 'kind', 'title', 'scenario', 'output_type', 'job_id', 'files'],
  ];

  for (const run of chosen) {
    const kind = runKind(run) as SdmRunKind;
    const folder = `${speciesFolderOf(run)}/${KIND_FOLDERS[kind]}/${runFolderName(run)}`;
    const files = await filesFor(run, missing);
    for (const [name, content] of files) zip.file(`${folder}/${name}`, content);
    manifest.push([
      folder,
      run.species ?? '',
      kind,
      run.title,
      run.scenario ?? '',
      run.outputType ?? '',
      run.jobId,
      files.map(([name]) => name).sort().join('; '),
    ]);
  }

  zip.file('manifest.csv', `${manifest.map((row) => row.map(csvCell).join(',')).join('\r\n')}\r\n`);
  if (missing.length > 0) {
    zip.file(
      'missing-files.txt',
      `These files could not be fetched by the browser, so they are not in this zip.\r\nOpen the links directly to download them.\r\n\r\n${missing.join('\r\n')}\r\n`,
    );
  }

  const stamp = new Date().toISOString().slice(0, 10);
  return {
    // Compressed like any ordinary zip, which every extractor reads.
    blob: await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } }),
    filename: `sdm-results-${stamp}.zip`,
    missing,
  };
}
