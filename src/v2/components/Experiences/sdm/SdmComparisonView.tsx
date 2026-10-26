// ============================================================================
// SdmComparisonView — what changed between two SDM runs.
//
// Two views of the same comparison, matching the two map layers: the
// difference (how much suitability rose or fell, whatever the threshold) and
// the threshold change (which cells became suitable, stopped being suitable, or
// did not change). Numbers come from the Compare SDM Runs "summary_json".
// ============================================================================

import { useMemo, useState } from 'react';
import {
  ColumnChart,
  PercentBar,
  formatArea,
  formatCount,
  formatNumber,
  formatPercent,
  mergeBins,
} from '../suitability/RunAnalysisView';
import type {
  SdmChangeCounts,
  SdmComparison,
  SdmComparisonRegion,
  SdmComparisonView as ComparisonView,
  SdmInputRun,
} from '../types';
import { inputRunLabel } from '../sdmRuns';
import { RegionToggle, type SdmRegion } from './RegionToggle';
import { SDM_DIFF_RAMP, differenceColor, rgbCss } from './sdmColors';

interface SdmComparisonViewProps {
  comparison: SdmComparison;
  inputRuns?: SdmInputRun[];
  /** Which map layer is showing. Selecting a figure group switches the map to it. */
  view: ComparisonView;
  onChangeView: (view: ComparisonView) => void;
}

const HEADING = 'text-xs font-semibold uppercase tracking-wide text-gray-500';

function areaText(value: number | null | undefined): string {
  return formatArea(value) ?? '–';
}

function signedArea(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '–';
  const text = formatArea(Math.abs(value));
  if (!text) return '–';
  return value > 0 ? `+${text}` : value < 0 ? `−${text}` : text;
}

function ChangeRow({
  label,
  counts,
  color,
}: {
  label: string;
  counts: SdmChangeCounts;
  color: string;
}) {
  return (
    <li>
      <div className="flex items-center gap-2 text-xs text-gray-700">
        <span className="w-24 shrink-0">{label}</span>
        <PercentBar percent={counts.percent} color={color} />
        <span className="w-12 shrink-0 text-right tabular-nums">{formatPercent(counts.percent)}</span>
      </div>
      <p className="ml-[104px] text-[11px] text-gray-500">
        {formatCount(counts.cells)} cells · {areaText(counts.area_km2)}
      </p>
    </li>
  );
}

function ViewTabs({
  view,
  onChange,
}: {
  view: ComparisonView;
  onChange: (view: ComparisonView) => void;
}) {
  return (
    <div role="tablist" aria-label="Map layer" className="flex overflow-hidden rounded-button border border-gray-200">
      {(
        [
          ['difference', 'Difference'],
          ['threshold-change', 'Threshold change'],
        ] as const
      ).map(([value, label]) => (
        <button
          key={value}
          type="button"
          role="tab"
          aria-selected={view === value}
          onClick={() => onChange(value)}
          className={`flex-1 px-2 py-1.5 text-xs font-medium transition-colors hover:bg-gray-50 ${
            view === value ? 'bg-emerald-50 font-semibold text-emerald-800' : 'text-gray-600'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function Difference({
  region,
  comparison,
  isBinary,
}: {
  region: SdmComparisonRegion;
  comparison: SdmComparison;
  isBinary: boolean;
}) {
  const { change } = region;
  const { histogram, display_limit: limit } = comparison.difference;
  const bins = useMemo(
    () =>
      isBinary
        ? mergeBins(histogram.bin_edges, histogram.counts, histogram.percent, 3)
        : mergeBins(histogram.bin_edges, histogram.counts, histogram.percent, 20),
    [histogram, isBinary],
  );
  const net = change.net_area_km2;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs leading-relaxed text-gray-600">
        {isBinary
          ? 'Cells that switched between suitable and unsuitable.'
          : `Cells whose probability moved by at least ${formatNumber(change.min_change)}. Smaller shifts count as unchanged.`}
      </p>
      <ul className="flex flex-col gap-2">
        <ChangeRow label="Increased" counts={change.increased} color={rgbCss(SDM_DIFF_RAMP[2])} />
        <ChangeRow label="Decreased" counts={change.decreased} color={rgbCss(SDM_DIFF_RAMP[0])} />
        <ChangeRow label="Unchanged" counts={change.unchanged} color="#9ca3af" />
      </ul>
      <p className="text-xs text-gray-600">
        Net change: {signedArea(net)}
        {change.increased.mean_change != null && !isBinary
          ? ` · increases averaged +${formatNumber(change.increased.mean_change)}`
          : ''}
        {change.decreased.mean_change != null && !isBinary
          ? `, decreases ${formatNumber(change.decreased.mean_change)}`
          : ''}
      </p>
      {histogram && (
        <div>
          <p className="mb-1 text-xs leading-relaxed text-gray-600">
            Share of cells at each size of change (B minus A).
          </p>
          <ColumnChart
            bins={bins}
            colors={bins.map((bin) => differenceColor((bin.low + bin.high) / 2))}
            startLabel={isBinary ? 'Lost' : '−1 (A higher)'}
            endLabel={isBinary ? 'Gained' : '+1 (B higher)'}
            height={96}
          />
          {limit != null && !isBinary && (
            <p className="mt-1 text-[11px] text-gray-500">
              The map colors are stretched to ±{formatNumber(limit)} so smaller changes stay
              visible.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function ThresholdChange({
  region,
  comparison,
  isBinary,
}: {
  region: SdmComparisonRegion;
  comparison: SdmComparison;
  isBinary: boolean;
}) {
  const cells = region.suitable_cells;
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs leading-relaxed text-gray-600">
        {isBinary
          ? 'Suitable means 1 in the run.'
          : `Suitable means a probability of ${formatNumber(comparison.threshold.value)} or more.`}{' '}
        Run A is suitable on {areaText(cells.area_km2_a)}, run B on {areaText(cells.area_km2_b)}.
      </p>
      <ul className="flex flex-col gap-2">
        {region.classes.map((entry) => (
          <li key={entry.value}>
            <div className="flex items-center gap-2 text-xs text-gray-700">
              <span
                className="h-3 w-3 shrink-0 rounded-sm border border-black/10"
                style={{ background: rgbCss(entry.color) }}
              />
              <span className="min-w-0 flex-1 truncate" title={entry.label}>
                {entry.label}
              </span>
              <span className="w-12 shrink-0 text-right tabular-nums">
                {formatPercent(entry.percent)}
              </span>
            </div>
            <p className="ml-5 text-[11px] text-gray-500">
              {formatCount(entry.count)} cells · {areaText(entry.area_km2)}
            </p>
          </li>
        ))}
      </ul>
      <p className="text-xs leading-relaxed text-gray-600">
        Net change in suitable area: {signedArea(cells.net_area_km2)}
        {cells.percent_of_a_lost != null
          ? ` · ${formatPercent(cells.percent_of_a_lost)} of run A's suitable area is lost`
          : ''}
        {cells.percent_of_b_gained != null
          ? ` · ${formatPercent(cells.percent_of_b_gained)} of run B's suitable area is new`
          : ''}
        .
      </p>
    </div>
  );
}

function Agreement({ region }: { region: SdmComparisonRegion }) {
  const { agreement } = region;
  const rows: [string, string][] = [
    ['Overlap of suitable areas (Jaccard)', formatNumber(agreement.jaccard)],
    ['Cells that agree', formatPercent(agreement.percent_agreement)],
  ];
  if (agreement.value_correlation != null) {
    rows.push(['Correlation of probabilities', formatNumber(agreement.value_correlation)]);
  }
  if (agreement.mean_difference != null) {
    rows.push(['Mean change (B − A)', formatNumber(agreement.mean_difference)]);
  }
  return (
    <dl className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 text-xs text-gray-700">
      {rows.map(([label, value]) => (
        <div key={label} className="contents">
          <dt>{label}</dt>
          <dd className="text-right font-medium tabular-nums text-gray-900">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function SdmComparisonView({
  comparison,
  inputRuns,
  view,
  onChangeView,
}: SdmComparisonViewProps) {
  const [region, setRegion] = useState<SdmRegion>('all');
  const { preserve } = comparison;
  const shown: SdmComparisonRegion = region === 'preserve' && preserve ? preserve : comparison;
  const isBinary = comparison.output_type === 'Binary';
  const compared =
    region === 'preserve' && preserve ? preserve.cells.compared : comparison.cells.compared;
  const onlyOne = comparison.cells.mapped_in_a_only + comparison.cells.mapped_in_b_only;

  return (
    <div className="flex flex-col gap-4">
      {inputRuns && inputRuns.length === 2 && (
        <dl className="flex flex-col gap-1 text-xs text-gray-600">
          <div>
            <dt className={`${HEADING} inline`}>A </dt>
            <dd className="inline break-words">{inputRunLabel(inputRuns[0])}</dd>
          </div>
          <div>
            <dt className={`${HEADING} inline`}>B </dt>
            <dd className="inline break-words">{inputRunLabel(inputRuns[1])}</dd>
          </div>
        </dl>
      )}

      <ViewTabs view={view} onChange={onChangeView} />

      {preserve && <RegionToggle value={region} onChange={setRegion} note={preserve.note} />}

      <p className="text-xs text-gray-600">
        {formatCount(compared)} cells compared
        {region === 'all' && onlyOne > 0
          ? ` · ${formatCount(onlyOne)} mapped in only one run were left out`
          : ''}
      </p>

      {view === 'difference' ? (
        <Difference region={shown} comparison={comparison} isBinary={isBinary} />
      ) : (
        <ThresholdChange region={shown} comparison={comparison} isBinary={isBinary} />
      )}

      <section>
        <h4 className={HEADING}>How alike the runs are</h4>
        <div className="mt-1.5">
          <Agreement region={shown} />
        </div>
      </section>
    </div>
  );
}
