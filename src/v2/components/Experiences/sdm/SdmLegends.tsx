// ============================================================================
// SdmLegends — map legends for comparison and common-areas results.
//
// The result map service only knows each display raster as a color table, so
// these draw the same colors from the tool's JSON instead.
// ============================================================================

import { formatNumber } from '../suitability/RunAnalysisView';
import type { CompletedRun, SdmCountClass } from '../types';
import { differenceGradient, rgbCss } from './sdmColors';

const BAR = 'h-28 w-4 flex-shrink-0 rounded-sm border border-black/10';
const SWATCH = 'inline-block h-4 w-6 flex-shrink-0 rounded-sm border border-black/10';

function Swatches({ entries }: { entries: { key: string; label: string; background: string }[] }) {
  return (
    <ul className="flex flex-col gap-1">
      {entries.map((entry) => (
        <li key={entry.key} className="flex items-center gap-2">
          <span className={SWATCH} style={{ background: entry.background }} />
          <span className="break-words text-sm text-gray-700">{entry.label}</span>
        </li>
      ))}
    </ul>
  );
}

function ComparisonLegend({ run }: { run: CompletedRun }) {
  const comparison = run.comparison;
  if (!comparison) return <p className="text-sm text-gray-500">Loading legend…</p>;

  if (run.view === 'threshold-change') {
    return (
      <Swatches
        entries={comparison.classes.map((entry) => ({
          key: String(entry.value),
          label: entry.label,
          background: rgbCss(entry.color),
        }))}
      />
    );
  }

  const isBinary = comparison.output_type === 'Binary';
  const limit = comparison.difference.display_limit ?? 1;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-stretch gap-2">
        <div className={BAR} style={{ background: differenceGradient() }} />
        <div className="flex flex-col justify-between py-0.5 text-xs text-gray-600">
          <span>
            {isBinary ? 'Gained (suitable in B only)' : `+${formatNumber(limit)} (higher in B)`}
          </span>
          <span>No change</span>
          <span>
            {isBinary ? 'Lost (suitable in A only)' : `−${formatNumber(limit)} (higher in A)`}
          </span>
        </div>
      </div>
      {!isBinary && comparison.change.min_change != null && (
        <p className="text-xs text-gray-500">
          Changes under {formatNumber(comparison.change.min_change)} are drawn grey.
        </p>
      )}
    </div>
  );
}

/** Few runs list every count; many runs collapse the in-between counts into a ramp. */
function CommonLegend({ run }: { run: CompletedRun }) {
  const common = run.common;
  if (!common) return <p className="text-sm text-gray-500">Loading legend…</p>;

  const classes: SdmCountClass[] = common.by_count;
  if (classes.length <= 7) {
    return (
      <Swatches
        entries={classes.map((entry) => ({
          key: String(entry.runs_suitable),
          label: entry.label,
          background: rgbCss(entry.color),
        }))}
      />
    );
  }

  const first = classes[0];
  const last = classes[classes.length - 1];
  const partial = classes.slice(1, -1);
  const ramp = partial.map((entry) => rgbCss(entry.color)).join(', ');
  return (
    <ul className="flex flex-col gap-1">
      <li className="flex items-center gap-2">
        <span className={SWATCH} style={{ background: rgbCss(first.color) }} />
        <span className="text-sm text-gray-700">{first.label}</span>
      </li>
      <li className="flex items-center gap-2">
        <span className={SWATCH} style={{ background: `linear-gradient(to right, ${ramp})` }} />
        <span className="text-sm text-gray-700">
          Suitable in 1 to {partial.length} of {common.run_count} runs
        </span>
      </li>
      <li className="flex items-center gap-2">
        <span className={SWATCH} style={{ background: rgbCss(last.color) }} />
        <span className="text-sm text-gray-700">{last.label}</span>
      </li>
    </ul>
  );
}

export function SdmDerivedLegend({ run, kind }: { run: CompletedRun; kind: 'comparison' | 'common' }) {
  return kind === 'comparison' ? <ComparisonLegend run={run} /> : <CommonLegend run={run} />;
}
