import type { DataSource } from '../../types';

export interface ExportFormatOption {
  id: string;
  label: string;
}

interface LayerExportSectionProps {
  layerId: string;
  layerName: string;
  dataSource: DataSource;
  querySummary?: string;
  filteredResultCount?: number;
  formatOptions: ExportFormatOption[];
  selectedFormatIds: string[];
  onToggleFormat: (formatId: string) => void;
}

function getSectionAccentClass(dataSource: DataSource): string {
  switch (dataSource) {
    case 'inaturalist':
      return 'border-l-4 border-l-emerald-500';
    case 'animl':
      return 'border-l-4 border-l-purple-500';
    case 'dendra':
      return 'border-l-4 border-l-teal-500';
    case 'dataone':
      return 'border-l-4 border-l-indigo-500';
    default:
      return 'border-l-4 border-l-slate-400';
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
  querySummary,
  filteredResultCount,
  formatOptions,
  selectedFormatIds,
  onToggleFormat,
}: LayerExportSectionProps) {
  return (
    <section
      id={`export-builder-layer-section-${layerId}`}
      className={`rounded-xl border border-slate-200 bg-white p-5 ${getSectionAccentClass(dataSource)}`}
    >
      <div id={`export-builder-layer-section-header-${layerId}`} className="mb-4">
        <h3 id={`export-builder-layer-title-${layerId}`} className="text-sm font-bold text-slate-800">
          {layerName}
        </h3>
        <p id={`export-builder-layer-query-${layerId}`} className="mt-1 text-xs text-slate-600">
          {querySummary || 'No active query filter applied.'}
        </p>
      </div>

      <div
        id={`export-builder-layer-filtered-summary-${layerId}`}
        className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2"
      >
        <span id={`export-builder-layer-filtered-badge-${layerId}`} className="text-xs font-semibold text-blue-700">
          Filtered export
        </span>
        {filteredResultCount != null ? (
          <span id={`export-builder-layer-filtered-count-${layerId}`} className="text-xs text-blue-700">
            {formatCount(filteredResultCount)} matching results
          </span>
        ) : (
          <span id={`export-builder-layer-filtered-count-${layerId}`} className="text-xs text-blue-700">
            Result count available after query execution
          </span>
        )}
      </div>

      <div id={`export-builder-layer-format-section-${layerId}`} className="mt-4 rounded-lg bg-slate-50 p-3">
        <p id={`export-builder-layer-format-title-${layerId}`} className="mb-2 text-xs text-slate-500">
          Include
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
                  className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span id={`export-builder-format-copy-${layerId}-${format.id}`} className="text-xs text-slate-700">
                  {format.label}
                </span>
              </label>
            );
          })}
        </div>
      </div>
    </section>
  );
}
