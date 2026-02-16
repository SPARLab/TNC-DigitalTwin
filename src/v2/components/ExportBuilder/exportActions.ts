import JSZip from 'jszip';
import type { ExportActionLayer } from './types';

export interface ExportManifest {
  version: 'v2-export-builder';
  generatedAt: string;
  sourceUrl: string;
  totalLayers: number;
  totalViews: number;
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
  const totalViews = layers.reduce((sum, layer) => sum + layer.selectedViews.length, 0);
  return {
    version: 'v2-export-builder',
    generatedAt: new Date().toISOString(),
    sourceUrl: window.location.href,
    totalLayers: layers.length,
    totalViews,
    layers,
  };
}

function buildLayerShareLink(sourceUrl: string, layer: ExportActionLayer): string {
  const url = new URL(sourceUrl);
  const layerPayload = {
    layerId: layer.layerId,
    pinnedLayerId: layer.pinnedLayerId,
    dataSource: layer.dataSource,
    formats: layer.selectedFormatIds,
    includeQueryDefinition: layer.includeQueryDefinition,
    views: layer.selectedViews.map((view) => ({
      viewId: view.viewId,
      viewName: view.viewName,
      querySummary: view.querySummary,
      filteredResultCount: view.filteredResultCount,
      queryDefinition: view.queryDefinition,
    })),
  };
  url.searchParams.set('v2ExportLayer', encodeBase64Url(JSON.stringify(layerPayload)));
  return url.toString();
}

function buildViewShareLink(sourceUrl: string, layer: ExportActionLayer, viewId: string): string {
  const url = new URL(sourceUrl);
  const selectedView = layer.selectedViews.find((view) => view.viewId === viewId);
  if (!selectedView) {
    return url.toString();
  }

  const viewPayload = {
    layerId: layer.layerId,
    pinnedLayerId: layer.pinnedLayerId,
    dataSource: layer.dataSource,
    formats: layer.selectedFormatIds,
    includeQueryDefinition: layer.includeQueryDefinition,
    view: {
      viewId: selectedView.viewId,
      viewName: selectedView.viewName,
      querySummary: selectedView.querySummary,
      filteredResultCount: selectedView.filteredResultCount,
      queryDefinition: selectedView.queryDefinition,
    },
  };
  url.searchParams.set('v2ExportView', encodeBase64Url(JSON.stringify(viewPayload)));
  return url.toString();
}

export function generateShareableLinks(layers: ExportActionLayer[]): GeneratedLinksResult {
  const manifest = buildManifest(layers);
  const globalPayload = {
    generatedAt: manifest.generatedAt,
    layers,
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
    layer.selectedViews.forEach((view) => {
      lines.push(`  - ${view.viewName}: ${buildViewShareLink(window.location.href, layer, view.viewId)}`);
    });
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
      '- layers/<layer>/layer-selection.json: Layer-level output settings',
      '- layers/<layer>/views/<view>/selection.json: View-level query summaries and counts',
      '- layers/<layer>/views/<view>/query-definition.json: Optional query payloads',
      '- links/export-links.txt: Shareable links for export context',
      '',
      'Note: This v1 export action packages metadata and links. Server-side data extraction can be wired in later phases.',
    ].join('\n'),
  );

  zip.file('export-manifest.json', JSON.stringify(manifest, null, 2));
  zip.file('links/export-links.txt', linksText);

  for (const layer of layers) {
    const layerFolder = `layers/${sanitizeFilename(layer.layerName)}-${layer.pinnedLayerId}`;
    zip.file(
      `${layerFolder}/layer-selection.json`,
      JSON.stringify({
        pinnedLayerId: layer.pinnedLayerId,
        layerId: layer.layerId,
        layerName: layer.layerName,
        dataSource: layer.dataSource,
        selectedFormatIds: layer.selectedFormatIds,
        selectedFormatLabels: layer.selectedFormatLabels,
        includeQueryDefinition: layer.includeQueryDefinition,
        selectedViewCount: layer.selectedViews.length,
        estimatedBytes: layer.estimatedBytes,
      }, null, 2),
    );

    layer.selectedViews.forEach((view, index) => {
      const viewFolder = `${layerFolder}/views/${String(index + 1).padStart(2, '0')}-${sanitizeFilename(view.viewName)}`;
      zip.file(
        `${viewFolder}/selection.json`,
        JSON.stringify({
          viewId: view.viewId,
          viewName: view.viewName,
          isActive: view.isActive,
          querySummary: view.querySummary,
          filteredResultCount: view.filteredResultCount,
          estimatedBytes: view.estimatedBytes,
        }, null, 2),
      );

      if (layer.includeQueryDefinition && view.queryDefinition) {
        zip.file(`${viewFolder}/query-definition.json`, JSON.stringify(view.queryDefinition, null, 2));
      }
    });
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
