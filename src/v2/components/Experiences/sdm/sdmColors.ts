// ============================================================================
// Colors the SDM tools paint on their display rasters, for charts and legends
// that should match the map.
//
// Keep in sync with DIFF_RAMP and the count colors in
// twin_models/sdms/scripts/arcgis/sdm_rf_tool.pyt. Probability uses the same
// ramp as the suitability tool (suitabilityRamp.ts).
// ============================================================================

import { scoreColor } from '../suitability/RunAnalysisView';

type Rgb = readonly [number, number, number];

/** Decrease (run A higher), no change, increase (run B higher). */
export const SDM_DIFF_RAMP: readonly [Rgb, Rgb, Rgb] = [
  [215, 96, 39],
  [243, 244, 246],
  [33, 113, 181],
];

export function rgbCss(color: readonly number[]): string {
  return `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
}

/** Ramp color for a probability from 0 to 1. */
export function probabilityColor(probability: number): string {
  return scoreColor(1 + Math.min(Math.max(probability, 0), 1), 2);
}

/** Color of a difference expressed as a share of the display range, -1 to 1. */
export function differenceColor(position: number): string {
  const t = (Math.min(Math.max(position, -1), 1) + 1) / 2;
  const scaled = t * (SDM_DIFF_RAMP.length - 1);
  const lower = Math.floor(scaled);
  const upper = Math.min(lower + 1, SDM_DIFF_RAMP.length - 1);
  const mix = scaled - lower;
  const channel = (index: 0 | 1 | 2) =>
    Math.round(SDM_DIFF_RAMP[lower][index] * (1 - mix) + SDM_DIFF_RAMP[upper][index] * mix);
  return `rgb(${channel(0)}, ${channel(1)}, ${channel(2)})`;
}

/** CSS gradient, bottom (decrease) to top (increase), for a legend bar. */
export function differenceGradient(): string {
  return `linear-gradient(to top, ${SDM_DIFF_RAMP.map(rgbCss).join(', ')})`;
}
