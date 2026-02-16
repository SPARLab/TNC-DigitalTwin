import { Plus, Trash2 } from 'lucide-react';

export interface ArcGISFieldOption {
  name: string;
  label: string;
  type?: string;
}

export interface TNCFilterRow {
  id: string;
  field: string;
  operator: string;
  value: string;
}

export interface OperatorOption {
  value: string;
  label: string;
  requiresValue: boolean;
}

export const TNC_OPERATOR_OPTIONS: OperatorOption[] = [
  { value: '=', label: '=', requiresValue: true },
  { value: '!=', label: '!=', requiresValue: true },
  { value: '>', label: '>', requiresValue: true },
  { value: '<', label: '<', requiresValue: true },
  { value: '>=', label: '>=', requiresValue: true },
  { value: '<=', label: '<=', requiresValue: true },
  { value: 'contains', label: 'contains', requiresValue: true },
  { value: 'starts with', label: 'starts with', requiresValue: true },
  { value: 'ends with', label: 'ends with', requiresValue: true },
  { value: 'in', label: 'in (comma-separated)', requiresValue: true },
  { value: 'is null', label: 'is null', requiresValue: false },
  { value: 'is not null', label: 'is not null', requiresValue: false },
];

export interface PreviewState {
  status: 'idle' | 'loading' | 'success' | 'error';
  message?: string;
}

interface GenericFilterUIProps {
  layerLabel: string;
  fields: ArcGISFieldOption[];
  rows: TNCFilterRow[];
  whereClause: string;
  previewState: PreviewState;
  onAddRow: () => void;
  onClearAll: () => void;
  onRemoveRow: (rowId: string) => void;
  onChangeRow: (rowId: string, patch: Partial<Omit<TNCFilterRow, 'id'>>) => void;
  onPreviewResults: () => void;
}

function getOperatorMeta(operatorValue: string): OperatorOption | undefined {
  return TNC_OPERATOR_OPTIONS.find(option => option.value === operatorValue);
}

export function createEmptyFilterRow(defaultField?: string): TNCFilterRow {
  return {
    id: crypto.randomUUID(),
    field: defaultField ?? '',
    operator: '=',
    value: '',
  };
}

export function GenericFilterUI({
  layerLabel,
  fields,
  rows,
  whereClause,
  previewState,
  onAddRow,
  onClearAll,
  onRemoveRow,
  onChangeRow,
  onPreviewResults,
}: GenericFilterUIProps) {
  return (
    <div id="tnc-generic-filter-ui-root" className="space-y-4">
      <div id="tnc-generic-filter-ui-header" className="space-y-1">
        <h3 id="tnc-generic-filter-ui-title" className="text-sm font-semibold text-gray-900">
          Filter {layerLabel}
        </h3>
        <p id="tnc-generic-filter-ui-subtitle" className="text-xs text-gray-500">
          Build SQL-style filters with field, operator, and value rows.
        </p>
      </div>

      <div id="tnc-generic-filter-ui-rows" className="space-y-2">
        {rows.map((row, index) => {
          const operatorMeta = getOperatorMeta(row.operator);
          const needsValue = operatorMeta?.requiresValue ?? true;
          return (
            <div
              id={`tnc-generic-filter-row-${row.id}`}
              key={row.id}
              className="grid grid-cols-[1.3fr_1fr_1.2fr_auto] items-center gap-2 rounded-lg border border-gray-200 bg-white p-2"
            >
              <div id={`tnc-generic-filter-row-field-wrap-${row.id}`} className="space-y-1">
                <label
                  id={`tnc-generic-filter-row-field-label-${row.id}`}
                  htmlFor={`tnc-generic-filter-row-field-${row.id}`}
                  className="text-[11px] font-semibold uppercase tracking-wide text-gray-500"
                >
                  Field
                </label>
                <select
                  id={`tnc-generic-filter-row-field-${row.id}`}
                  value={row.field}
                  onChange={event => onChangeRow(row.id, { field: event.target.value })}
                  className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 focus:border-[#2e7d32] focus:outline-none focus:ring-2 focus:ring-[#2e7d32]/20"
                >
                  <option id={`tnc-generic-filter-row-field-option-empty-${row.id}`} value="">
                    Select field
                  </option>
                  {fields.map(field => (
                    <option
                      id={`tnc-generic-filter-row-field-option-${row.id}-${field.name}`}
                      key={field.name}
                      value={field.name}
                      title={field.type || 'Unknown field type'}
                    >
                      {field.label}
                    </option>
                  ))}
                </select>
              </div>

              <div id={`tnc-generic-filter-row-operator-wrap-${row.id}`} className="space-y-1">
                <label
                  id={`tnc-generic-filter-row-operator-label-${row.id}`}
                  htmlFor={`tnc-generic-filter-row-operator-${row.id}`}
                  className="text-[11px] font-semibold uppercase tracking-wide text-gray-500"
                >
                  Operator
                </label>
                <select
                  id={`tnc-generic-filter-row-operator-${row.id}`}
                  value={row.operator}
                  onChange={event => onChangeRow(row.id, { operator: event.target.value })}
                  className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 focus:border-[#2e7d32] focus:outline-none focus:ring-2 focus:ring-[#2e7d32]/20"
                >
                  {TNC_OPERATOR_OPTIONS.map(option => (
                    <option
                      id={`tnc-generic-filter-row-operator-option-${row.id}-${option.value.replace(/\s+/g, '-')}`}
                      key={option.value}
                      value={option.value}
                    >
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div id={`tnc-generic-filter-row-value-wrap-${row.id}`} className="space-y-1">
                <label
                  id={`tnc-generic-filter-row-value-label-${row.id}`}
                  htmlFor={`tnc-generic-filter-row-value-${row.id}`}
                  className="text-[11px] font-semibold uppercase tracking-wide text-gray-500"
                >
                  Value
                </label>
                <input
                  id={`tnc-generic-filter-row-value-${row.id}`}
                  type="text"
                  value={row.value}
                  onChange={event => onChangeRow(row.id, { value: event.target.value })}
                  disabled={!needsValue}
                  placeholder={needsValue ? 'Enter value' : 'Not needed'}
                  className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 focus:border-[#2e7d32] focus:outline-none focus:ring-2 focus:ring-[#2e7d32]/20"
                />
              </div>

              <div id={`tnc-generic-filter-row-delete-wrap-${row.id}`} className="pt-5">
                <button
                  id={`tnc-generic-filter-row-delete-${row.id}`}
                  type="button"
                  onClick={() => onRemoveRow(row.id)}
                  disabled={rows.length === 1 && index === 0}
                  className="rounded-md border border-gray-200 p-2 text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Remove filter row"
                  title="Remove filter row"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div id="tnc-generic-filter-ui-actions" className="flex items-center gap-2">
        <button
          id="tnc-generic-filter-add-button"
          type="button"
          onClick={onAddRow}
          className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-50"
        >
          <Plus className="h-4 w-4" />
          Add Filter
        </button>
        <button
          id="tnc-generic-filter-clear-all-button"
          type="button"
          onClick={onClearAll}
          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-50"
        >
          Clear All
        </button>
      </div>

      <div id="tnc-generic-filter-where-preview-wrap" className="space-y-2 rounded-lg bg-slate-50 p-3">
        <p id="tnc-generic-filter-where-preview-label" className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          WHERE clause
        </p>
        <code
          id="tnc-generic-filter-where-preview-value"
          className="block rounded border border-slate-200 bg-white px-2 py-2 text-xs text-gray-700"
        >
          {whereClause}
        </code>
      </div>

      <div id="tnc-generic-filter-preview-actions" className="space-y-2">
        <button
          id="tnc-generic-filter-preview-results-button"
          type="button"
          onClick={onPreviewResults}
          disabled={previewState.status === 'loading'}
          className="w-full rounded-lg bg-[#2e7d32] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#256d29] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {previewState.status === 'loading' ? 'Previewing...' : 'Preview Results'}
        </button>
        {previewState.message && (
          <p
            id="tnc-generic-filter-preview-message"
            className={`text-sm ${
              previewState.status === 'error' ? 'text-red-700' : 'text-emerald-700'
            }`}
          >
            {previewState.message}
          </p>
        )}
      </div>
    </div>
  );
}
