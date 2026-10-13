// ============================================================================
// Continuous legend taken from the imagery stretch the map is actually drawing.
// ============================================================================

export interface StretchLegend {
  min: number;
  max: number;
  /** Colors from low values to high values. */
  colors: string[];
}

/** Light blue → purple. Low values are the first color. */
export const CONTINUOUS_PREVIEW_RAMP = {
  from: [219, 234, 254],
  to: [109, 40, 217],
} as const;

export function continuousLegend(min: number, max: number): StretchLegend {
  const [from, to] = [CONTINUOUS_PREVIEW_RAMP.from, CONTINUOUS_PREVIEW_RAMP.to];
  return {
    min,
    max,
    colors: [`rgb(${from.join(', ')})`, `rgb(${to.join(', ')})`],
  };
}

export function continuousStretchOptions(min: number, max: number) {
  const avg = (min + max) / 2;
  const stddev = Math.max((max - min) / 6, 1e-9);
  return {
    stretchType: 'min-max' as const,
    customStatistics: [{ min, max, avg, stddev }],
    colorRamp: {
      type: 'algorithmic' as const,
      algorithm: 'cie-lab' as const,
      fromColor: [...CONTINUOUS_PREVIEW_RAMP.from, 255],
      toColor: [...CONTINUOUS_PREVIEW_RAMP.to, 255],
    },
  };
}

interface ColorLike {
  r?: number;
  g?: number;
  b?: number;
}

interface RampLike {
  fromColor?: ColorLike | number[] | null;
  toColor?: ColorLike | number[] | null;
  colorRamps?: RampLike[] | null;
}

function cssColor(color: ColorLike | number[] | null | undefined): string | null {
  if (!color) return null;
  if (Array.isArray(color)) {
    if (color.length < 3) return null;
    return `rgb(${Math.round(Number(color[0]))}, ${Math.round(Number(color[1]))}, ${Math.round(Number(color[2]))})`;
  }
  if (color.r != null && color.g != null && color.b != null) {
    return `rgb(${Math.round(color.r)}, ${Math.round(color.g)}, ${Math.round(color.b)})`;
  }
  return null;
}

function colorsFromRamp(ramp: RampLike | null | undefined): string[] {
  if (!ramp) return [];
  const from = cssColor(ramp.fromColor);
  const to = cssColor(ramp.toColor);
  if (from && to) return [from, to];
  if (!ramp.colorRamps?.length) return [];
  const colors: string[] = [];
  for (const part of ramp.colorRamps) {
    const next = colorsFromRamp(part);
    if (colors.length > 0 && next[0] === colors[colors.length - 1]) {
      colors.push(...next.slice(1));
    } else {
      colors.push(...next);
    }
  }
  return colors;
}

function finiteRange(
  entry: { min?: number; max?: number } | null | undefined,
): { min: number; max: number } | null {
  if (entry?.min == null || entry.max == null) return null;
  if (!Number.isFinite(entry.min) || !Number.isFinite(entry.max) || entry.min === entry.max) return null;
  return { min: entry.min, max: entry.max };
}

/** Stretch ramp for a continuous imagery renderer. Classified renderers return null. */
export function stretchLegendFromRenderer(
  renderer: unknown,
  band?: { min?: number; max?: number } | null,
): StretchLegend | null {
  if (!renderer || typeof renderer !== 'object') return null;
  const stretch = renderer as {
    type?: string;
    statistics?: Array<{ min?: number; max?: number } | null> | null;
    customStatistics?: Array<{ min?: number; max?: number } | null> | null;
    colorRamp?: RampLike | null;
  };
  if (stretch.type !== 'raster-stretch') return null;
  const stats = stretch.customStatistics?.map((entry) => finiteRange(entry)).find((entry) => entry != null)
    ?? stretch.statistics?.map((entry) => finiteRange(entry)).find((entry) => entry != null)
    ?? finiteRange(band);
  const colors = colorsFromRamp(stretch.colorRamp);
  if (!stats || colors.length < 2) return null;
  return { min: stats.min, max: stats.max, colors };
}
