import { useState } from 'react';
import { AlertTriangle, Check, Code2, Copy, FileCode2, Loader2 } from 'lucide-react';
import type { DataSource } from '../../types';
import type { ExportFormatOption } from './types';
import { formatEstimatedSize } from './utils/sizeEstimator';

interface LayerExportSectionProps {
  layerId: string;
  layerName: string;
  dataSource: DataSource;
  views: LayerExportViewItem[];
  formatOptions: ExportFormatOption[];
  selectedFormatIds: string[];
  includeQueryDefinition: boolean;
  layerEstimatedBytes?: number;
  isLayerEstimateUnavailable: boolean;
  showLargeExportWarning: boolean;
  isCodegenSupported: boolean;
  canGenerateLayerCode: boolean;
  codegenUnsupportedMessage?: string;
  isCodegenProcessing: boolean;
  codegenProcessingLanguage: 'python' | 'r' | null;
  // eslint-disable-next-line no-unused-vars
  onGenerateLayerCode: (language: 'python' | 'r') => void;
  onCopyLayerCode: () => void;
  generatedLayerCode?: {
    language: 'python' | 'r';
    snippet: string;
    generatedCount: number;
  };
  // eslint-disable-next-line no-unused-vars
  onToggleFormat: (formatId: string) => void;
  // eslint-disable-next-line no-unused-vars
  onToggleView: (viewId: string) => void;
  onToggleIncludeQueryDefinition: () => void;
}

interface LayerExportViewItem {
  viewId: string;
  viewName: string;
  isActive: boolean;
  isSelected: boolean;
  querySummary?: string;
  filteredResultCount?: number;
  estimatedBytes?: number;
  isEstimateUnavailable: boolean;
}

function getDataSourceBadgeClass(dataSource: DataSource): string {
  switch (dataSource) {
    case 'inaturalist':
      return 'border border-emerald-200 bg-emerald-50 text-emerald-700';
    case 'animl':
      return 'border border-teal-200 bg-teal-50 text-teal-700';
    case 'dendra':
      return 'border border-cyan-200 bg-cyan-50 text-cyan-700';
    case 'dataone':
      return 'border border-indigo-200 bg-indigo-50 text-indigo-700';
    default:
      return 'border border-slate-200 bg-slate-100 text-slate-700';
  }
}

function formatCount(count?: number): string {
  if (typeof count !== 'number') return '';
  return `(${count.toLocaleString()})`;
}

export function LayerExportSection({
  layerId,
  layerName,
  dataSource,
  views,
  formatOptions,
  selectedFormatIds,
  includeQueryDefinition,
  layerEstimatedBytes,
  isLayerEstimateUnavailable,
  showLargeExportWarning,
  isCodegenSupported,
  canGenerateLayerCode,
  codegenUnsupportedMessage,
  isCodegenProcessing,
  codegenProcessingLanguage,
  onGenerateLayerCode,
  onCopyLayerCode,
  generatedLayerCode,
  onToggleFormat,
  onToggleView,
  onToggleIncludeQueryDefinition,
}: LayerExportSectionProps) {
  const selectedViewCount = views.filter((view) => view.isSelected).length;
  const [copied, setCopied] = useState(false);

  return (
    <section id={`export-builder-layer-section-${layerId}`} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div id={`export-builder-layer-section-header-${layerId}`} className="flex items-start justify-between gap-3">
        <div id={`export-builder-layer-section-title-wrap-${layerId}`} className="space-y-1">
          <h3 id={`export-builder-layer-title-${layerId}`} className="text-sm font-bold text-slate-800">
            {layerName}
          </h3>
          <p id={`export-builder-layer-meta-${layerId}`} className="text-xs text-slate-600">
            {selectedViewCount} selected {selectedViewCount === 1 ? 'view' : 'views'}
          </p>
        </div>
        <span
          id={`export-builder-layer-data-source-badge-${layerId}`}
          className={`rounded-md px-2 py-1 text-[11px] font-semibold uppercase tracking-wide ${getDataSourceBadgeClass(dataSource)}`}
        >
          {dataSource}
        </span>
      </div>

      <div id={`export-builder-layer-views-divider-${layerId}`} className="my-4 border-t border-slate-200" />

      <div
        id={`export-builder-layer-views-section-${layerId}`}
        className="rounded-lg border border-slate-200 bg-slate-50 p-3"
      >
        <p id={`export-builder-layer-views-title-${layerId}`} className="mb-2 text-xs font-semibold text-slate-700">
          Filtered views
        </p>
        <ul id={`export-builder-layer-views-list-${layerId}`} className="space-y-2">
          {views.map((view) => {
            const checkboxId = `export-builder-view-checkbox-${layerId}-${view.viewId}`;
            return (
              <li
                id={`export-builder-view-row-${layerId}-${view.viewId}`}
                key={view.viewId}
                className="rounded-md border border-slate-200 bg-white p-2"
              >
                <div
                  id={`export-builder-view-row-top-${layerId}-${view.viewId}`}
                  className="flex items-center justify-between gap-2"
                >
                  <label
                    id={`export-builder-view-label-${layerId}-${view.viewId}`}
                    htmlFor={checkboxId}
                    className="flex min-w-0 cursor-pointer items-center gap-2"
                  >
                    <input
                      id={checkboxId}
                      type="checkbox"
                      checked={view.isSelected}
                      onChange={() => onToggleView(view.viewId)}
                      className="h-3.5 w-3.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span
                      id={`export-builder-view-name-${layerId}-${view.viewId}`}
                      className="truncate text-xs font-semibold text-slate-800"
                    >
                      {view.viewName}
                    </span>
                    {view.isActive ? (
                      <span
                        id={`export-builder-view-active-badge-${layerId}-${view.viewId}`}
                        className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700"
                      >
                        Active
                      </span>
                    ) : null}
                  </label>

                  <span id={`export-builder-view-size-${layerId}-${view.viewId}`} className="text-[11px] font-medium text-slate-400">
                    {view.isEstimateUnavailable
                      ? '\u2014'
                      : `~${formatEstimatedSize(view.estimatedBytes || 0)}`}
                  </span>
                </div>

                <p id={`export-builder-view-query-${layerId}-${view.viewId}`} className="mt-1 text-[11px] text-slate-600">
                  {view.querySummary || 'No query filters'}
                </p>

                <p id={`export-builder-view-count-${layerId}-${view.viewId}`} className="mt-1 text-[11px] text-slate-600">
                  {view.filteredResultCount != null
                    ? `${formatCount(view.filteredResultCount)} matching results`
                    : 'Result count pending'}
                </p>
              </li>
            );
          })}
        </ul>
      </div>

      <div id={`export-builder-layer-format-section-${layerId}`} className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
        <p id={`export-builder-layer-format-title-${layerId}`} className="mb-2 text-xs font-semibold text-slate-700">
          Export outputs
        </p>
        <div id={`export-builder-layer-format-options-${layerId}`} className="flex flex-wrap items-center gap-4">
          {formatOptions.map((format) => {
            const checkboxId = `export-builder-format-checkbox-${layerId}-${format.id}`;
            return (
              <label
                id={`export-builder-format-label-${layerId}-${format.id}`}
                htmlFor={checkboxId}
                key={format.id}
                className="flex cursor-pointer items-center gap-1.5"
              >
                <input
                  id={checkboxId}
                  type="checkbox"
                  checked={selectedFormatIds.includes(format.id)}
                  onChange={() => onToggleFormat(format.id)}
                  className="h-3.5 w-3.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span id={`export-builder-format-copy-${layerId}-${format.id}`} className="text-xs text-slate-700">
                  {format.label}
                </span>
              </label>
            );
          })}
        </div>

        <div id={`export-builder-layer-query-definition-toggle-wrap-${layerId}`} className="mt-2">
          <label
            id={`export-builder-layer-query-definition-label-${layerId}`}
            className="flex cursor-pointer items-center gap-2"
          >
            <input
              id={`export-builder-layer-query-definition-checkbox-${layerId}`}
              type="checkbox"
              checked={includeQueryDefinition}
              onChange={onToggleIncludeQueryDefinition}
              className="h-3.5 w-3.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span id={`export-builder-layer-query-definition-copy-${layerId}`} className="text-xs text-slate-700">
              Include query definitions (JSON)
            </span>
          </label>
        </div>
      </div>

      <div
        id={`export-builder-layer-subtotal-row-${layerId}`}
        className="mt-3 flex items-center justify-between  pr-3 pt-2"
      >
        <span id={`export-builder-layer-subtotal-label-${layerId}`} className="text-sm font-semibold text-emerald-900">
          Layer estimate
        </span>
        <span id={`export-builder-layer-subtotal-value-${layerId}`} className="text-sm font-bold text-slate-700">
          {isLayerEstimateUnavailable ? 'Estimate pending' : `~${formatEstimatedSize(layerEstimatedBytes || 0)}`}
        </span>
      </div>

      {showLargeExportWarning ? (
        <div
          id={`export-builder-layer-large-warning-${layerId}`}
          className="mt-2 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2"
          role="status"
          aria-live="polite"
        >
          <AlertTriangle
            id={`export-builder-layer-large-warning-icon-${layerId}`}
            className="mt-0.5 h-4 w-4 text-amber-700"
          />
          <p id={`export-builder-layer-large-warning-copy-${layerId}`} className="text-xs text-amber-800">
            Large export selection detected for this layer. Consider narrowing views or outputs before generating ZIP.
          </p>
        </div>
      ) : null}

      <div id={`export-builder-layer-codegen-section-${layerId}`} className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3">
        <div id={`export-builder-layer-codegen-header-${layerId}`} className="flex items-center justify-between gap-2">
          <p id={`export-builder-layer-codegen-title-${layerId}`} className="text-xs font-semibold text-slate-700">
            Code generation
          </p>
          <div id={`export-builder-layer-codegen-actions-${layerId}`} className="flex items-center gap-2">
            <button
              id={`export-builder-layer-codegen-python-button-${layerId}`}
              type="button"
              disabled={!isCodegenSupported || !canGenerateLayerCode || isCodegenProcessing}
              onClick={() => onGenerateLayerCode('python')}
              className="flex items-center gap-1.5 rounded-md border border-emerald-300 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-800 transition-colors hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isCodegenProcessing && codegenProcessingLanguage === 'python' ? (
                <Loader2 id={`export-builder-layer-codegen-python-spinner-${layerId}`} className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Code2 id={`export-builder-layer-codegen-python-icon-${layerId}`} className="h-3.5 w-3.5" />
              )}
              Get Python Code
            </button>

            <button
              id={`export-builder-layer-codegen-r-button-${layerId}`}
              type="button"
              disabled={!isCodegenSupported || !canGenerateLayerCode || isCodegenProcessing}
              onClick={() => onGenerateLayerCode('r')}
              className="flex items-center gap-1.5 rounded-md border border-teal-300 bg-teal-50 px-2.5 py-1.5 text-xs font-semibold text-teal-800 transition-colors hover:bg-teal-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isCodegenProcessing && codegenProcessingLanguage === 'r' ? (
                <Loader2 id={`export-builder-layer-codegen-r-spinner-${layerId}`} className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <FileCode2 id={`export-builder-layer-codegen-r-icon-${layerId}`} className="h-3.5 w-3.5" />
              )}
              Get R Code
            </button>
          </div>
        </div>

        {!isCodegenSupported ? (
          <p id={`export-builder-layer-codegen-unsupported-${layerId}`} className="mt-2 text-[11px] text-slate-600">
            {codegenUnsupportedMessage || 'Code generation for this data source is coming soon.'}
          </p>
        ) : !canGenerateLayerCode ? (
          <p id={`export-builder-layer-codegen-no-views-${layerId}`} className="mt-2 text-[11px] text-slate-600">
            Select at least one view above to generate layer code.
          </p>
        ) : null}

        <div
          id={`export-builder-layer-codegen-preview-animator-${layerId}`}
          className={`grid transition-all duration-300 ease-out ${
            generatedLayerCode
              ? 'mt-3 grid-rows-[1fr] opacity-100'
              : 'mt-0 grid-rows-[0fr] opacity-0'
          }`}
          aria-hidden={!generatedLayerCode}
        >
          <div
            id={`export-builder-layer-codegen-preview-overflow-${layerId}`}
            className="min-h-0 overflow-hidden"
          >
            {generatedLayerCode ? (
              <div id={`export-builder-layer-codegen-preview-${layerId}`}>
                <div id={`export-builder-layer-codegen-preview-header-${layerId}`} className="mb-2 flex items-center justify-between gap-2">
                  <p id={`export-builder-layer-codegen-preview-title-${layerId}`} className="text-[11px] font-semibold text-slate-700">
                    {generatedLayerCode.language === 'python' ? 'Python' : 'R'} preview ({generatedLayerCode.generatedCount} view{generatedLayerCode.generatedCount === 1 ? '' : 's'})
                  </p>
                  <button
                    id={`export-builder-layer-codegen-copy-button-${layerId}`}
                    type="button"
                    onClick={() => {
                      onCopyLayerCode();
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className={`flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-semibold transition-colors ${
                      copied
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                        : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {copied ? (
                      <Check id={`export-builder-layer-codegen-copy-check-${layerId}`} className="h-3 w-3" />
                    ) : (
                      <Copy id={`export-builder-layer-codegen-copy-icon-${layerId}`} className="h-3 w-3" />
                    )}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <pre
                  id={`export-builder-layer-codegen-pre-${layerId}`}
                  className="max-h-64 overflow-auto rounded-md bg-slate-950 p-3 text-[11px] leading-5 text-emerald-100"
                >
                  <code id={`export-builder-layer-codegen-code-${layerId}`}>
                    {generatedLayerCode.snippet}
                  </code>
                </pre>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
