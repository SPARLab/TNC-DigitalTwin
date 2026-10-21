// ============================================================================
// Value range of one mosaic variable (e.g. CHELSA bio12).
//
// The ImageServer's own statistics and default renderer describe the mosaic's
// first item (Bio01), so every other variable has to be stretched to its own
// min/max. The map layer and the legend both read the range from here, which
// keeps their colors in step and shares one request per variable.
// ============================================================================

import { fetchRasterHistogram, type HistogramBin } from './rasterHistogram';

export interface MosaicValueRange {
  min: number;
  max: number;
}

const rangeCache = new Map<string, Promise<MosaicValueRange | null>>();

/** Lowest and highest populated bin edges. Null when nothing is populated or the range is flat. */
export function rangeFromHistogramBins(bins: HistogramBin[]): MosaicValueRange | null {
  const occupied = bins.filter((bin) => bin.count > 0);
  if (occupied.length === 0) return null;
  const min = occupied[0].min;
  const max = occupied[occupied.length - 1].max;
  if (!Number.isFinite(min) || !Number.isFinite(max) || !(max > min)) return null;
  return { min, max };
}

/**
 * Full-extent min/max for the mosaic item tagged `tag`. Resolves to null when
 * the service can't be read; failures are not cached so a later call retries.
 */
export function fetchMosaicVariableRange(options: {
  url: string;
  tag: string;
  token?: string | null;
}): Promise<MosaicValueRange | null> {
  const token = options.token ?? null;
  const key = `${options.url}|${options.tag}|${token ?? ''}`;
  const cached = rangeCache.get(key);
  if (cached) return cached;

  const request = fetchRasterHistogram({
    url: options.url,
    extent: 'full',
    scope: 'preserve',
    resolutionMeters: null,
    categorical: false,
    mosaicTag: options.tag,
    token,
  })
    .then((histogram) => rangeFromHistogramBins(histogram.bins))
    .catch((error) => {
      if (import.meta.env.DEV) {
        console.debug('[MosaicRange] Could not read value range', { ...options, error });
      }
      return null;
    })
    .then((range) => {
      if (!range) rangeCache.delete(key);
      return range;
    });

  rangeCache.set(key, request);
  return request;
}
