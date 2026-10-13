// ============================================================================
// RunSettingsView — a recap of the settings a suitability run was made with.
//
// Extent, resolution and score scale up top, then each input layer with its
// share of the overall weight. Opening a layer shows its within-layer scoring:
// the score each category or value range was given.
// ============================================================================

import { CollapsibleSection } from '../CollapsibleSection';
import type { SuitabilityRunInput, SuitabilityRunRecord } from '../types';
import { PercentBar, formatNumber, formatPercent, scoreColor } from './RunAnalysisView';

interface RunSettingsViewProps {
  record: SuitabilityRunRecord;
  /** Output cell size from the run analysis, when the run has one. */
  cellSize?: number | null;
}

/** Each layer's percentage of the total weight. */
export function relativeWeights(layers: SuitabilityRunInput[]): number[] {
  const total = layers.reduce((sum, layer) => sum + (Number.isFinite(layer.weight) ? layer.weight : 0), 0);
  if (total <= 0) return layers.map(() => 0);
  return layers.map((layer) => (Math.max(layer.weight, 0) / total) * 100);
}

/** Cell size is metres for projected services and degrees for geographic ones. */
export function formatCellSize(value: number | null | undefined): string | null {
  if (value == null || !Number.isFinite(value) || value <= 0) return null;
  return value >= 1 ? `${formatNumber(value)} m` : `${formatNumber(value)}°`;
}

function ScoreChip({ score, scaleMax }: { score: number; scaleMax: number }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 text-xs tabular-nums text-gray-700">
      <span
        className="inline-block h-2.5 w-2.5 rounded-sm border border-black/10"
        style={{ background: scoreColor(score, scaleMax) }}
      />
      {formatNumber(score)}
    </span>
  );
}

function ScoringRows({
  rows,
  scaleMax,
}: {
  rows: { key: string; label: string; score: number }[];
  scaleMax: number;
}) {
  if (rows.length === 0) {
    return <p className="text-xs text-gray-500">No scoring was recorded for this layer.</p>;
  }
  return (
    <ul className="flex flex-col divide-y divide-gray-100">
      {rows.map((row) => (
        <li key={row.key} className="flex items-center justify-between gap-2 py-1 text-xs text-gray-700">
          <span className="min-w-0 break-words">{row.label}</span>
          <ScoreChip score={row.score} scaleMax={scaleMax} />
        </li>
      ))}
    </ul>
  );
}

function LayerScoring({ layer, scaleMax }: { layer: SuitabilityRunInput; scaleMax: number }) {
  if (layer.type === 'categorical') {
    const rows = Object.entries(layer.categories ?? {})
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([value, score]) => {
        const name = layer.categoryLabels?.[value];
        return { key: value, label: name ? `${name} (${value})` : `Value ${value}`, score };
      });
    return (
      <>
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
          Score per category
        </p>
        <ScoringRows rows={rows} scaleMax={scaleMax} />
      </>
    );
  }

  if (layer.type === 'rescale') {
    const low = formatNumber(layer.rescaleMin);
    const high = formatNumber(layer.rescaleMax);
    return (
      <p className="text-xs leading-relaxed text-gray-600">
        Values {low} to {high} are rescaled linearly to scores 1 to {scaleMax}
        {layer.invert ? ', inverted so high values score low' : ''}.
      </p>
    );
  }

  const rows = (layer.bins ?? []).map((bin, index) => ({
    key: `${index}-${bin.min}-${bin.max}`,
    label: `${formatNumber(bin.min)} – ${formatNumber(bin.max)}`,
    score: bin.score,
  }));
  return (
    <>
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
        Score per value range
      </p>
      <ScoringRows rows={rows} scaleMax={scaleMax} />
    </>
  );
}

export function RunSettingsView({ record, cellSize }: RunSettingsViewProps) {
  const shares = relativeWeights(record.layers);
  const totalWeight = record.layers.reduce((sum, layer) => sum + layer.weight, 0);
  const resolution = formatCellSize(cellSize);
  const facts: { label: string; value: string }[] = [
    { label: 'Extent', value: record.extentLabel },
    ...(resolution ? [{ label: 'Resolution', value: resolution }] : []),
    { label: 'Score scale', value: `1 – ${record.scaleMax}` },
    { label: 'Layers', value: String(record.layers.length) },
  ];

  return (
    <div className="flex flex-col gap-3">
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
        {facts.map((fact) => (
          <div key={fact.label} className="contents">
            <dt className="text-gray-500">{fact.label}</dt>
            <dd className="min-w-0 break-words font-medium text-gray-900">{fact.value}</dd>
          </div>
        ))}
      </dl>

      <div>
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
          Layers and relative weights
        </p>
        <ul className="flex flex-col gap-2">
          {record.layers.map((layer, index) => (
            <li key={`${layer.url}-${index}`}>
              <CollapsibleSection
                variant="card"
                title={layer.title}
                hint={formatPercent(shares[index])}
                defaultOpen={false}
                keepMounted
              >
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <PercentBar percent={shares[index]} color="#059669" />
                  <span className="shrink-0 tabular-nums">
                    weight {formatNumber(layer.weight)} of {formatNumber(totalWeight)}
                  </span>
                </div>
                <div className="mt-2">
                  <LayerScoring layer={layer} scaleMax={record.scaleMax} />
                </div>
              </CollapsibleSection>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
