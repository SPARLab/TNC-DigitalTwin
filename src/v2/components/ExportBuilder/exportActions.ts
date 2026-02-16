import JSZip from 'jszip';
import type { DataSource } from '../../types';

export interface ExportActionLayer {
  pinnedLayerId: string;
  layerId: string;
  layerName: string;
  dataSource: DataSource;
  querySummary?: string;
  filteredResultCount?: number;
  selectedFormatIds: string[];
  selectedFormatLabels: string[];
}

export interface ExportManifest {
  version: 'v2-export-builder';
  generatedAt: string;
  sourceUrl: string;
  totalLayers: number;
  layers: ExportActionLayer[];
}

export interface GeneratedLinksResult {
  linksText: string;
  manifest: ExportManifest;
}

function sanitizeFilename(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64) || 'layer';
}

function pad2(value: number): string {
  return value.toString().padStart(2, '0');
}

function getTimestampForFilename(date: Date): string {
  const year = date.getFullYear();
  const month = pad2(date.getMonth() + 1);
  const day = pad2(date.getDate());
  const hours = pad2(date.getHours());
  const minutes = pad2(date.getMinutes());
  const seconds = pad2(date.getSeconds());
  return `${year}${month}${day}-${hours}${minutes}${seconds}`;
}

function encodeBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function downloadBlob(blob: Blob, filename: string): void {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(objectUrl);
}

function buildManifest(layers: ExportActionLayer[]): ExportManifest {
  return {
    version: 'v2-export-builder',
    generatedAt: new Date().toISOString(),
    sourceUrl: window.location.href,
    totalLayers: layers.length,
    layers,
  };
}

function buildLayerShareLink(sourceUrl: string, layer: ExportActionLayer): string {
  const url = new URL(sourceUrl);
  const layerPayload = {
    layerId: layer.layerId,
    pinnedLayerId: layer.pinnedLayerId,
    dataSource: layer.dataSource,
    querySummary: layer.querySummary,
    filteredResultCount: layer.filteredResultCount,
    formats: layer.selectedFormatIds,
  };
  url.searchParams.set('v2ExportLayer', encodeBase64Url(JSON.stringify(layerPayload)));
  return url.toString();
}

export function generateShareableLinks(layers: ExportActionLayer[]): GeneratedLinksResult {
  const manifest = buildManifest(layers);
  const globalPayload = {
    generatedAt: manifest.generatedAt,
    layers: layers.map((layer) => ({
      layerId: layer.layerId,
      pinnedLayerId: layer.pinnedLayerId,
      formats: layer.selectedFormatIds,
      querySummary: layer.querySummary,
    })),
  };
  const globalUrl = new URL(window.location.href);
  globalUrl.searchParams.set('v2ExportBundle', encodeBase64Url(JSON.stringify(globalPayload)));

  const lines: string[] = [];
  lines.push('V2 Export Builder - Shareable Links');
  lines.push(`Generated: ${manifest.generatedAt}`);
  lines.push(`Global export link: ${globalUrl.toString()}`);
  lines.push('');
  lines.push('Per-layer links');

  layers.forEach((layer) => {
    lines.push(`- ${layer.layerName}: ${buildLayerShareLink(window.location.href, layer)}`);
  });

  return {
    linksText: lines.join('\n'),
    manifest,
  };
}

export async function createAndDownloadExportZip(layers: ExportActionLayer[]): Promise<string> {
  const manifest = buildManifest(layers);
  const { linksText } = generateShareableLinks(layers);
  const zip = new JSZip();

  zip.file(
    'README.txt',
    [
      'V2 Export Builder Package',
      '',
      'This package includes:',
      '- export-manifest.json: Complete export request metadata',
      '- layers/*.json: Per-layer selected formats and query summaries',
      '- links/export-links.txt: Shareable links for export context',
      '',
      'Note: This v1 export action packages metadata and links. Server-side data extraction can be wired in later phases.',
    ].join('\n'),
  );

  zip.file('export-manifest.json', JSON.stringify(manifest, null, 2));
  zip.file('links/export-links.txt', linksText);

  for (const layer of layers) {
    const filename = `layers/${sanitizeFilename(layer.layerName)}-${layer.pinnedLayerId}.json`;
    zip.file(filename, JSON.stringify(layer, null, 2));
  }

  const content = await zip.generateAsync({ type: 'blob' });
  const timestamp = getTimestampForFilename(new Date());
  downloadBlob(content, `v2-export-package-${timestamp}.zip`);
  return manifest.generatedAt;
}

export function downloadLinksTextFile(linksText: string): void {
  const timestamp = getTimestampForFilename(new Date());
  const blob = new Blob([linksText], { type: 'text/plain;charset=utf-8;' });
  downloadBlob(blob, `v2-export-links-${timestamp}.txt`);
}
