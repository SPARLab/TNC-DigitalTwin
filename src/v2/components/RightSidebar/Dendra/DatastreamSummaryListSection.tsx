import { Activity, BarChart3, Calendar, Pin, TrendingDown, TrendingUp } from 'lucide-react';
import type { DendraSummary } from '../../../services/dendraStationService';
import { formatTimestamp, formatValue } from '../../../services/dendraStationService';

interface DatastreamSummaryListSectionProps {
  filteredSummaries: DendraSummary[];
  totalSummaries: number;
  normalizedStreamNameFilter: string;
  selectedDatastreamId: number | null;
  pinnedDatastreamIds: Set<number>;
  onViewChart: (summary: DendraSummary) => void;
  onTogglePin: (summary: DendraSummary) => void;
}

export function DatastreamSummaryListSection({
  filteredSummaries,
  totalSummaries,
  normalizedStreamNameFilter,
  selectedDatastreamId,
  pinnedDatastreamIds,
  onViewChart,
  onTogglePin,
}: DatastreamSummaryListSectionProps) {
  return (
    <div id="dendra-datastream-summaries">
      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
        Datastreams ({filteredSummaries.length}{normalizedStreamNameFilter ? ` of ${totalSummaries}` : ''})
      </h4>

      {filteredSummaries.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">
          {normalizedStreamNameFilter
            ? 'No datastreams match this stream name filter.'
            : 'No datastream summaries available.'}
        </p>
      ) : (
        <div className="space-y-2">
          {filteredSummaries.map((summary) => (
            <DatastreamSummaryCard
              key={summary.datastream_id}
              summary={summary}
              isSelected={selectedDatastreamId === summary.datastream_id}
              isPinned={pinnedDatastreamIds.has(summary.datastream_id)}
              onViewChart={() => onViewChart(summary)}
              onTogglePin={() => onTogglePin(summary)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function DatastreamSummaryCard({
  summary,
  onViewChart,
  onTogglePin,
  isSelected,
  isPinned,
}: {
  summary: DendraSummary;
  onViewChart: () => void;
  onTogglePin: () => void;
  isSelected: boolean;
  isPinned: boolean;
}) {
  return (
    <div
      id={`dendra-ds-${summary.datastream_id}`}
      className={`w-full text-left bg-white border rounded-md p-3 transition-colors cursor-pointer group ${
        isSelected
          ? 'border-teal-400 bg-teal-50/40'
          : 'border-gray-100 hover:border-teal-300 hover:bg-teal-50/30'
      }`}
      role="button"
      tabIndex={0}
      onClick={onViewChart}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onViewChart();
        }
      }}
    >
      <div className="flex items-center justify-between mb-1.5">
        <h5 className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
          <BarChart3 className="w-3.5 h-3.5 text-teal-400 group-hover:text-teal-600 transition-colors shrink-0" />
          {summary.datastream_name}
        </h5>
        <div id={`dendra-ds-${summary.datastream_id}-meta-actions`} className="flex items-center gap-1.5">
          {summary.unit && (
            <span className="text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded shrink-0">
              {summary.unit}
            </span>
          )}
          <button
            id={`dendra-ds-pin-toggle-${summary.datastream_id}`}
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onTogglePin();
            }}
            className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold transition-colors ${
              isPinned
                ? 'border-blue-300 bg-blue-100 text-blue-800 hover:bg-blue-200'
                : 'border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100'
            }`}
            title={isPinned ? 'Unpin datastream chart' : 'Pin datastream chart'}
            aria-label={isPinned ? 'Unpin datastream chart' : 'Pin datastream chart'}
          >
            <Pin className="w-3 h-3 fill-current" />
            {isPinned ? 'Pinned' : 'Pin'}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 text-xs text-gray-500 mb-1.5">
        <span className="flex items-center gap-0.5">
          <TrendingDown className="w-3 h-3 text-blue-400" />
          {formatValue(summary.min_value)}
        </span>
        <span className="flex items-center gap-0.5">
          <Activity className="w-3 h-3 text-amber-500" />
          {formatValue(summary.avg_value)}
        </span>
        <span className="flex items-center gap-0.5">
          <TrendingUp className="w-3 h-3 text-red-400" />
          {formatValue(summary.max_value)}
        </span>
        <span className="ml-auto text-gray-400">
          {summary.total_records?.toLocaleString() ?? '—'} pts
        </span>
      </div>

      <div className="flex items-center gap-1 text-[10px] text-gray-400">
        <Calendar className="w-3 h-3" />
        {formatTimestamp(summary.first_reading_time)} — {formatTimestamp(summary.last_reading_time)}
      </div>
    </div>
  );
}
