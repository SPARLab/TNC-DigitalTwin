import type { ExportActionLayer } from '../types';
import { mapCodegenRequest } from './mappers';
import { renderPythonSnippet } from './pythonTemplates';
import { renderRSnippet } from './rTemplates';
import type {
  CodegenBundleResult,
  ExportCodeLanguage,
  ExportCodegenRequest,
  ExportCodegenResult,
} from './types';

function sanitizeFileToken(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'selection';
}

function languageFileExtension(language: ExportCodeLanguage): 'py' | 'R' {
  return language === 'python' ? 'py' : 'R';
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

export function generateExportCode(request: ExportCodegenRequest): ExportCodegenResult {
  const mapped = mapCodegenRequest(request);
  if ('reason' in mapped) {
    return {
      ok: false,
      language: request.language,
      reason: mapped.reason,
      message: mapped.message,
      metadata: {
        dataSource: request.layer.dataSource,
        layerId: request.layer.layerId,
        viewId: request.view.viewId,
      },
    };
  }

  const snippet = request.language === 'python'
    ? renderPythonSnippet(mapped)
    : renderRSnippet(mapped);
  const extension = languageFileExtension(request.language);

  return {
    ok: true,
    language: request.language,
    fileExtension: extension,
    fileName: `${sanitizeFileToken(request.layer.layerName)}-${sanitizeFileToken(request.view.viewName)}.${extension}`,
    title: `${request.layer.layerName} - ${request.view.viewName}`,
    snippet,
    warnings: [],
    metadata: {
      dataSource: request.layer.dataSource,
      layerId: request.layer.layerId,
      viewId: request.view.viewId,
    },
  };
}

export function generateCodeBundle(
  language: ExportCodeLanguage,
  layers: ExportActionLayer[],
  sourceUrl: string,
): CodegenBundleResult {
  const generatedAtIso = new Date().toISOString();
  const successes: ExportCodegenResult[] = [];
  const skippedMessages: string[] = [];

  for (const layer of layers) {
    for (const view of layer.selectedViews) {
      const result = generateExportCode({
        language,
        layer,
        view,
        generatedAtIso,
        sourceUrl,
      });
      successes.push(result);
      if (!result.ok) {
        skippedMessages.push(`${layer.layerName} / ${view.viewName}: ${result.message}`);
      }
    }
  }

  const snippets = successes
    .filter((result): result is Extract<ExportCodegenResult, { ok: true }> => result.ok)
    .map((result) => [
      language === 'python'
        ? '# ------------------------------------------------------------'
        : '# ------------------------------------------------------------',
      `# ${result.title}`,
      result.snippet,
    ].join('\n'));

  const extension = languageFileExtension(language);
  const snippet = snippets.length > 0
    ? [
      language === 'python'
        ? '# V2 Export Builder code bundle'
        : '# V2 Export Builder code bundle',
      `# Generated at: ${generatedAtIso}`,
      `# Source URL: ${sourceUrl}`,
      '',
      snippets.join('\n\n'),
    ].join('\n')
    : language === 'python'
      ? '# No supported selections found for Python code generation.'
      : '# No supported selections found for R code generation.';

  return {
    language,
    fileExtension: extension,
    fileName: `v2-export-code-${generatedAtIso.replace(/[:.]/g, '-')}.${extension}`,
    snippet,
    generatedAtIso,
    generatedCount: snippets.length,
    skippedCount: skippedMessages.length,
    skippedReasons: skippedMessages,
  };
}

export async function copyCodeToClipboard(code: string): Promise<boolean> {
  if (!navigator.clipboard?.writeText) {
    return false;
  }

  try {
    await navigator.clipboard.writeText(code);
    return true;
  } catch {
    return false;
  }
}

export function downloadCodeTextFile(fileName: string, code: string): void {
  const blob = new Blob([code], { type: 'text/plain;charset=utf-8;' });
  downloadBlob(blob, fileName);
}

