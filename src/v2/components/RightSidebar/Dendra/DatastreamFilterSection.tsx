import { Save } from 'lucide-react';
import type { DendraSummary } from '../../../services/dendraStationService';

interface DatastreamFilterSectionProps {
  selectedSummary: DendraSummary;
  startDate: string;
  endDate: string;
  aggregation: 'hourly' | 'daily' | 'weekly';
  chartMinDate?: string;
  chartMaxDate?: string;
  chartMatchesSelectedDatastream: boolean;
  chartLoading: boolean;
  dataPointCount: number;
  saveMessage: string | null;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onAggregationChange: (value: 'hourly' | 'daily' | 'weekly') => void;
  onSaveCurrentView: () => void;
  onSaveAsNewView: () => void;
}

export function DatastreamFilterSection({
  selectedSummary,
  startDate,
  endDate,
  aggregation,
  chartMinDate,
  chartMaxDate,
  chartMatchesSelectedDatastream,
  chartLoading,
  dataPointCount,
  saveMessage,
  onStartDateChange,
  onEndDateChange,
  onAggregationChange,
  onSaveCurrentView,
  onSaveAsNewView,
}: DatastreamFilterSectionProps) {
  const disableInputs = !chartMatchesSelectedDatastream || chartLoading;

  return (
    <div id="dendra-datastream-filter-section" className="bg-slate-50 rounded-lg p-3 space-y-3">
      <div id="dendra-datastream-filter-header" className="flex items-center justify-between gap-2">
        <h4 id="dendra-datastream-filter-title" className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
          Filter Datastream
        </h4>
        <span id="dendra-datastream-filter-name" className="text-xs text-gray-500 truncate">
          {selectedSummary.datastream_name}
        </span>
      </div>

      <div id="dendra-datastream-filter-grid" className="grid grid-cols-2 gap-2">
        <label id="dendra-filter-start-label" className="text-xs text-gray-600">
          From
          <input
            id="dendra-filter-start-date"
            type="date"
            value={startDate}
            min={chartMinDate}
            max={chartMaxDate}
            disabled={disableInputs}
            onChange={(event) => onStartDateChange(event.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm
                       focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500
                       disabled:bg-gray-100 disabled:text-gray-400"
          />
        </label>

        <label id="dendra-filter-end-label" className="text-xs text-gray-600">
          To
          <input
            id="dendra-filter-end-date"
            type="date"
            value={endDate}
            min={chartMinDate}
            max={chartMaxDate}
            disabled={disableInputs}
            onChange={(event) => onEndDateChange(event.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm
                       focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500
                       disabled:bg-gray-100 disabled:text-gray-400"
          />
        </label>

        <label id="dendra-filter-aggregation-label" className="text-xs text-gray-600 col-span-2">
          Aggregation
          <select
            id="dendra-filter-aggregation-select"
            value={aggregation}
            disabled={disableInputs}
            onChange={(event) => onAggregationChange(event.target.value as 'hourly' | 'daily' | 'weekly')}
            className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm bg-white
                       focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500
                       disabled:bg-gray-100 disabled:text-gray-400"
          >
            <option id="dendra-filter-aggregation-hourly" value="hourly">Hourly</option>
            <option id="dendra-filter-aggregation-daily" value="daily">Daily</option>
            <option id="dendra-filter-aggregation-weekly" value="weekly">Weekly</option>
          </select>
        </label>
      </div>

      <div id="dendra-filter-summary-row" className="flex items-center justify-between text-xs">
        <span id="dendra-filter-point-count" className="text-gray-600">
          {chartMatchesSelectedDatastream
            ? `${dataPointCount.toLocaleString()} data points`
            : 'Open chart to load points'}
        </span>
        {chartLoading && (
          <span id="dendra-filter-loading-indicator" className="text-gray-400">Updating...</span>
        )}
      </div>

      <div id="dendra-save-view-actions" className="grid grid-cols-2 gap-2">
        <button
          id="dendra-save-view"
          type="button"
          onClick={onSaveCurrentView}
          className="rounded-md border border-gray-300 bg-white text-gray-700 text-sm font-medium py-2
                     hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5"
        >
          <Save className="w-3.5 h-3.5" />
          Update View
        </button>
        <button
          id="dendra-save-with-filters"
          type="button"
          onClick={onSaveAsNewView}
          disabled={disableInputs}
          className="rounded-md bg-emerald-600 text-white text-sm font-medium py-2
                     hover:bg-emerald-700 transition-colors disabled:bg-emerald-300
                     flex items-center justify-center gap-1.5"
        >
          <Save className="w-3.5 h-3.5" />
          Save as New View
        </button>
      </div>

      {saveMessage && (
        <p id="dendra-save-view-feedback" className="text-xs text-emerald-700">
          {saveMessage}
        </p>
      )}
    </div>
  );
}
