// ============================================================================
// SdmCommonView — where several SDM runs are suitable at once.
//
// Numbers come from the Find Common Suitable Areas "summary_json": the area
// suitable in every run, how many runs agree in each cell, and each run's own
// figures.
// ============================================================================

import { useState } from 'react';
import { CollapsibleSection } from '../CollapsibleSection';
import {
  PercentBar,
  formatArea,
  formatCount,
  formatNumber,
  formatPercent,
} from '../suitability/RunAnalysisView';
import type { SdmCommonAreas, SdmCountClass, SdmInputRun } from '../types';
import { inputRunLabel, spansSpecies } from '../sdmRuns';
import { RegionToggle, type SdmRegion } from './RegionToggle';
import { rgbCss } from './sdmColors';

const HEADING = 'text-xs font-semibold uppercase tracking-wide text-gray-500';
const MAX_PAIRS_SHOWN = 15;

function areaText(value: number | null | undefined): string {
  return formatArea(value) ?? '–';
}

/** The run's title when the tool's run name starts with its job id. */
function titleFor(name: string, inputRuns: SdmInputRun[] | undefined): string {
  const input = inputRuns?.find((run) => name.startsWith(run.jobId));
  return input ? inputRunLabel(input, spansSpecies(inputRuns)) : name;
}

function CountRows({ classes }: { classes: SdmCountClass[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {classes.map((entry) => (
        <li key={entry.runs_suitable}>
          <div className="flex items-center gap-2 text-xs text-gray-700">
            <span
              className="h-3 w-3 shrink-0 rounded-sm border border-black/10"
              style={{ background: rgbCss(entry.color) }}
            />
            <span className="min-w-0 flex-1 truncate" title={entry.label}>
              {entry.label}
            </span>
            <PercentBar percent={entry.percent} color={rgbCss(entry.color)} />
            <span className="w-12 shrink-0 text-right tabular-nums">
              {formatPercent(entry.percent)}
            </span>
          </div>
          <p className="ml-5 text-[11px] text-gray-500">
            {formatCount(entry.cells)} cells · {areaText(entry.area_km2)}
          </p>
        </li>
      ))}
    </ul>
  );
}

export function SdmCommonView({
  common,
  inputRuns,
}: {
  common: SdmCommonAreas;
  inputRuns?: SdmInputRun[];
}) {
  const [region, setRegion] = useState<SdmRegion>('all');
  const { preserve } = common;
  const inPreserve = region === 'preserve' && preserve != null;
  const everyRun = inPreserve ? preserve.common : common.common;
  const byCount = inPreserve ? preserve.by_count : common.by_count;
  const mappedCells = inPreserve
    ? preserve.cells.mapped_in_all_runs
    : common.cells.mapped_in_all_runs;
  const isBinary = common.output_type === 'Binary';

  return (
    <div className="flex flex-col gap-4">
      {preserve && <RegionToggle value={region} onChange={setRegion} note={preserve.note} />}

      <div className="rounded-card border border-emerald-200 bg-emerald-50 px-3 py-2.5">
        <p className="text-xs text-emerald-900">Suitable in all {common.run_count} runs</p>
        <p className="text-lg font-semibold tabular-nums text-emerald-900">
          {areaText(everyRun.area_km2)}
        </p>
        <p className="text-xs text-emerald-900">
          {formatCount(everyRun.cells)} cells · {formatPercent(everyRun.percent_of_mapped)} of{' '}
          {formatCount(mappedCells)} mapped cells
          {inPreserve ? ' in the Preserve' : ''}
        </p>
      </div>

      {!inPreserve && common.any.cells > 0 && (
        <p className="text-xs leading-relaxed text-gray-600">
          {areaText(common.any.area_km2)} is suitable in at least one run;{' '}
          {formatPercent(
            common.any.jaccard_all == null ? null : common.any.jaccard_all * 100,
          )}{' '}
          of that is suitable in every run.
        </p>
      )}

      <section>
        <h4 className={HEADING}>How many runs agree</h4>
        <div className="mt-1.5">
          <CountRows classes={byCount} />
        </div>
      </section>

      <section>
        <h4 className={HEADING}>Each run</h4>
        <ul className="mt-1.5 flex flex-col gap-2">
          {common.runs.map((run, index) => {
            const inside = inPreserve
              ? preserve.runs.find((item) => item.run === run.run)
              : null;
            const cells = inside ? inside.suitable_cells : run.suitable_cells;
            const area = inside ? inside.suitable_area_km2 : run.suitable_area_km2;
            return (
              <li key={`${run.run}-${index}`} className="text-xs text-gray-700">
                <p className="break-words font-medium text-gray-900">
                  {titleFor(run.run, inputRuns)}
                </p>
                <p className="text-[11px] text-gray-500">
                  {areaText(area)} suitable · {formatCount(cells)} cells
                  {!isBinary && run.threshold != null
                    ? ` · threshold ${formatNumber(run.threshold)}`
                    : ''}
                  {!inPreserve && run.percent_also_suitable_in_all != null
                    ? ` · ${formatPercent(run.percent_also_suitable_in_all * 100)} also suitable in all`
                    : ''}
                </p>
              </li>
            );
          })}
        </ul>
      </section>

      {!inPreserve && common.pairs.length > 0 && common.run_count > 2 && (
        <CollapsibleSection
          variant="card"
          title="Overlap between pairs of runs"
          hint={`${common.pairs.length} pairs`}
          defaultOpen={false}
        >
          <ul className="flex flex-col gap-1.5">
            {common.pairs.slice(0, MAX_PAIRS_SHOWN).map((pair) => (
              <li key={`${pair.run_a}-${pair.run_b}`} className="text-xs text-gray-700">
                <p className="break-words">
                  {titleFor(pair.run_a, inputRuns)} and {titleFor(pair.run_b, inputRuns)}
                </p>
                <p className="text-[11px] text-gray-500">
                  {areaText(pair.area_km2_both)} in common · overlap{' '}
                  {formatNumber(pair.jaccard)}
                </p>
              </li>
            ))}
          </ul>
          {common.pairs.length > MAX_PAIRS_SHOWN && (
            <p className="mt-1.5 text-[11px] text-gray-500">
              Showing {MAX_PAIRS_SHOWN} of {common.pairs.length} pairs.
            </p>
          )}
        </CollapsibleSection>
      )}
    </div>
  );
}
