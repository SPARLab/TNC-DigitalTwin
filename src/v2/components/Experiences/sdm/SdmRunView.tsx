// ============================================================================
// SdmRunView — what a finished SDM Random Forest run found.
//
// All numbers come from the "summary_json" output of the tool: how well the
// model fit, how suitable the region is, and the same for the Preserve alone.
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
import { SDM_BINARY_CLASSES } from '../suitabilityRamp';
import type { SdmRegionSummary, SdmSummary } from '../types';
import { RegionToggle, type SdmRegion } from './RegionToggle';
import { probabilityColor } from './sdmColors';

const STAT_LABEL = 'text-[10px] font-semibold uppercase tracking-wide text-gray-500';

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="min-w-0 rounded-card border border-gray-200 bg-gray-50 px-2.5 py-2" title={hint}>
      <p className={STAT_LABEL}>{label}</p>
      <p className="mt-0.5 break-words text-sm font-semibold tabular-nums text-gray-900">{value}</p>
    </div>
  );
}

function areaText(value: number | null | undefined): string {
  return formatArea(value) ?? '–';
}

function BinaryRegion({ region }: { region: SdmRegionSummary }) {
  const rows = [
    { label: 'Suitable', share: region.suitable, color: SDM_BINARY_CLASSES[0].color },
    { label: 'Unsuitable', share: region.unsuitable, color: SDM_BINARY_CLASSES[1].color },
  ];
  return (
    <ul className="flex flex-col gap-2">
      {rows.map(({ label, share, color }) => (
        <li key={label}>
          <div className="flex items-center gap-2 text-xs text-gray-700">
            <span className="w-20 shrink-0">{label}</span>
            <PercentBar percent={share?.percent ?? null} color={color} />
            <span className="w-12 shrink-0 text-right tabular-nums">
              {formatPercent(share?.percent)}
            </span>
          </div>
          <p className="ml-[88px] text-[11px] text-gray-500">
            {formatCount(share?.cells ?? 0)} cells · {areaText(share?.area_km2)}
          </p>
        </li>
      ))}
    </ul>
  );
}

function ProbabilityRegion({ region }: { region: SdmRegionSummary }) {
  const { stats, histogram, suitable } = region;
  const bins = useMemo(
    () =>
      histogram
        ? mergeBins(histogram.bin_edges, histogram.counts, histogram.percent, 10)
        : [],
    [histogram],
  );
  return (
    <div className="flex flex-col gap-3">
      {suitable && (
        <div className="rounded-card border border-emerald-200 bg-emerald-50 px-3 py-2.5">
          <p className="text-xs text-emerald-900">
            At or above {formatNumber(suitable.threshold)}
          </p>
          <p className="text-lg font-semibold tabular-nums text-emerald-900">
            {formatPercent(suitable.percent)}
          </p>
          <p className="text-xs text-emerald-900">
            {formatCount(suitable.cells)} cells · {areaText(suitable.area_km2)}
          </p>
        </div>
      )}
      {stats && (
        <div className="grid grid-cols-3 gap-2">
          <Stat label="Mean" value={formatNumber(stats.mean)} />
          <Stat label="Median" value={formatNumber(stats.median)} />
          <Stat
            label="Middle 90%"
            value={`${formatNumber(stats.percentiles.p5)}–${formatNumber(stats.percentiles.p95)}`}
            hint="5th to 95th percentile"
          />
        </div>
      )}
      {bins.length > 0 && (
        <div>
          <p className="mb-1 text-xs leading-relaxed text-gray-600">
            Share of cells at each suitability probability.
          </p>
          <ColumnChart
            bins={bins}
            colors={bins.map((bin) => probabilityColor((bin.low + bin.high) / 2))}
            showShare
            barLabels={bins.map((bin) => formatNumber(bin.low))}
            startLabel="0 (unsuitable)"
            endLabel="1 (suitable)"
          />
        </div>
      )}
    </div>
  );
}

export function SdmRunView({ summary }: { summary: SdmSummary }) {
  const [region, setRegion] = useState<SdmRegion>('all');
  const { model, preserve } = summary;
  const isBinary = summary.output_type === 'Binary';
  const shown: SdmRegionSummary = region === 'preserve' && preserve ? preserve : summary;
  const cells = region === 'preserve' && preserve ? preserve.cells.mapped : summary.cells.mapped;
  const area = region === 'preserve' && preserve ? preserve.area_km2.mapped : summary.area_km2.mapped;

  return (
    <div className="flex flex-col gap-4">
      {model && (
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-2">
            <Stat
              label="Model fit (AUC)"
              value={formatNumber(model.auc)}
              hint="Area under the ROC curve on the training data. 1 is a perfect fit, 0.5 is chance."
            />
            <Stat
              label="Model threshold"
              value={formatNumber(model.optimal_threshold)}
              hint="The probability that best separates presences from background (Youden's J). Binary output uses it."
            />
            <Stat
              label="Presence cells"
              value={formatCount(model.presence_cells)}
              hint={`${formatCount(model.records_found)} records, thinned to one per cell`}
            />
            <Stat label="Background points" value={formatCount(model.background_points)} />
          </div>
          {(model.trained_on || model.projected_onto) && (
            <p className="text-xs leading-relaxed text-gray-500">
              Trained on current climate
              {model.projected_onto && model.projected_onto !== model.trained_on
                ? ' and projected onto the selected scenario.'
                : '.'}
            </p>
          )}
        </div>
      )}

      {preserve && (
        <RegionToggle value={region} onChange={setRegion} note={preserve.note} />
      )}

      <p className="text-xs text-gray-600">
        {formatCount(cells)} mapped cells · {areaText(area)}
        {region === 'preserve' && preserve ? ' in the Preserve' : ''}
      </p>

      {isBinary ? <BinaryRegion region={shown} /> : <ProbabilityRegion region={shown} />}

      {!preserve && (
        <p className="text-xs leading-relaxed text-gray-500">
          This run has no Preserve figures. They are added when the tool is given the Preserve
          boundary and some mapped cells fall inside it.
        </p>
      )}
    </div>
  );
}
