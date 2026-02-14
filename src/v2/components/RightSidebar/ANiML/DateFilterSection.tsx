// ============================================================================
// DateFilterSection — Collapsible date range filter section
// Matches FilterSection visual style. Contains start/end date pickers and
// quick-select presets (Last 30d, Last 6mo, This Year, Last Year, All Time).
// Auto-applies on change per DFT-039. Placed above Species and Cameras.
// ============================================================================

import { useState, useCallback } from 'react';
import { ChevronRight, ChevronDown, Calendar, X } from 'lucide-react';

interface DateFilterSectionProps {
  id: string;
  startDate: string | null;
  endDate: string | null;
  onDateChange: (start: string | null, end: string | null) => void;
  onClear: () => void;
  defaultExpanded?: boolean;
}

/** Quick-select presets generating YYYY-MM-DD strings. */
const PRESETS = [
  { label: 'Last 30 days', getRange: () => daysAgo(30) },
  { label: 'Last 6 months', getRange: () => monthsAgo(6) },
  { label: 'This Year', getRange: () => thisYear() },
  { label: 'Last Year', getRange: () => lastYear() },
] as const;

function toYMD(d: Date): string {
  return d.toISOString().slice(0, 10);
}
function daysAgo(n: number): [string, string] {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - n);
  return [toYMD(start), toYMD(end)];
}
function monthsAgo(n: number): [string, string] {
  const end = new Date();
  const start = new Date();
  start.setMonth(start.getMonth() - n);
  return [toYMD(start), toYMD(end)];
}
function thisYear(): [string, string] {
  const now = new Date();
  return [`${now.getFullYear()}-01-01`, toYMD(now)];
}
function lastYear(): [string, string] {
  const yr = new Date().getFullYear() - 1;
  return [`${yr}-01-01`, `${yr}-12-31`];
}

/** Format a YYYY-MM-DD string for display (e.g. "Jan 15, 2024"). */
function formatDateShort(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function DateFilterSection({
  id,
  startDate,
  endDate,
  onDateChange,
  onClear,
  defaultExpanded = false,
}: DateFilterSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const hasFilter = startDate !== null && endDate !== null;

  const handleStartChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value || null;
      onDateChange(val, endDate);
    },
    [endDate, onDateChange],
  );

  const handleEndChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value || null;
      onDateChange(startDate, val);
    },
    [startDate, onDateChange],
  );

  const handlePreset = useCallback(
    (getRange: () => [string, string]) => {
      const [s, e] = getRange();
      onDateChange(s, e);
    },
    [onDateChange],
  );

  // Badge text when collapsed
  const badgeText = hasFilter
    ? `${formatDateShort(startDate!)} – ${formatDateShort(endDate!)}`
    : null;

  return (
    <div id={id} className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Header — matches FilterSection style */}
      <button
        id={`${id}-header`}
        onClick={() => setExpanded(prev => !prev)}
        className="w-full flex items-center gap-2 px-3 py-2.5 bg-slate-50
                   hover:bg-slate-100 transition-colors text-left"
      >
        {expanded
          ? <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
          : <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />}

        <span className="flex-shrink-0 text-gray-500">
          <Calendar className="w-4 h-4" />
        </span>

        <span className="text-sm font-medium text-gray-700 flex-1">Date Range</span>

        {/* Badge: date range summary or "All Time" */}
        {hasFilter ? (
          <span
            id={`${id}-badge`}
            className="bg-emerald-100 text-emerald-700 text-xs font-semibold
                       px-1.5 py-0.5 rounded-full truncate max-w-[160px]"
          >
            {badgeText}
          </span>
        ) : (
          <span className="text-xs text-gray-400">All Time</span>
        )}
      </button>

      {/* Body — animated expand/collapse */}
      <div
        id={`${id}-body`}
        className="grid transition-[grid-template-rows] duration-200 ease-out"
        style={{ gridTemplateRows: expanded ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          <div className="px-3 py-2 space-y-3 border-t border-gray-100">
            {/* Clear action — top right */}
            {hasFilter && (
              <div id={`${id}-actions`} className="flex justify-end">
                <button
                  id={`${id}-clear`}
                  onClick={(e) => { e.stopPropagation(); onClear(); }}
                  className="flex items-center gap-1 text-xs text-gray-500
                             hover:text-red-600 transition-colors font-medium"
                >
                  <X className="w-3 h-3" />
                  Clear
                </button>
              </div>
            )}

            {/* Date inputs — side by side */}
            <div id={`${id}-inputs`} className="flex gap-2">
              <div className="flex-1">
                <label
                  htmlFor={`${id}-start`}
                  className="block text-xs text-gray-500 mb-1"
                >
                  From
                </label>
                <input
                  id={`${id}-start`}
                  type="date"
                  value={startDate ?? ''}
                  onChange={handleStartChange}
                  max={endDate ?? undefined}
                  className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-md
                             bg-white focus:outline-none focus:ring-2
                             focus:ring-emerald-500/30 focus:border-emerald-400"
                />
              </div>
              <div className="flex-1">
                <label
                  htmlFor={`${id}-end`}
                  className="block text-xs text-gray-500 mb-1"
                >
                  To
                </label>
                <input
                  id={`${id}-end`}
                  type="date"
                  value={endDate ?? ''}
                  onChange={handleEndChange}
                  min={startDate ?? undefined}
                  className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-md
                             bg-white focus:outline-none focus:ring-2
                             focus:ring-emerald-500/30 focus:border-emerald-400"
                />
              </div>
            </div>

            {/* Preset quick-select buttons */}
            <div id={`${id}-presets`} className="flex flex-wrap gap-1.5">
              {PRESETS.map(preset => {
                // Highlight active preset
                const [ps, pe] = preset.getRange();
                const isActive = startDate === ps && endDate === pe;

                return (
                  <button
                    key={preset.label}
                    id={`${id}-preset-${preset.label.toLowerCase().replace(/\s+/g, '-')}`}
                    onClick={(e) => { e.stopPropagation(); handlePreset(preset.getRange); }}
                    className={`px-2 py-1 text-xs rounded-md border transition-colors ${
                      isActive
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-700 font-medium'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
