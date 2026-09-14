import type FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import type { CatalogLayer } from '../../../types';
import type { ArcGISLayerLegend } from '../../../services/tncArcgisService';

export const NHDPLUS_FLOWLINE_WIDTH = 1.5;
const NODATA_COLOR = [90, 120, 130, 180] as const;

/**
 * Midpoint elevation in meters from NHD cm fields.
 * Stops cover the Dangermond range (~sea level to ~600 m).
 */
export const ELEVATION_COLOR_STOPS = [
  { value: 0, label: '0 m', color: [36, 255, 130, 230] as [number, number, number, number] },
  { value: 40, label: '40 m', color: [0, 255, 190, 230] as [number, number, number, number] },
  { value: 100, label: '100 m', color: [0, 210, 255, 230] as [number, number, number, number] },
  { value: 180, label: '180 m', color: [40, 150, 255, 230] as [number, number, number, number] },
  { value: 280, label: '280 m', color: [90, 80, 255, 230] as [number, number, number, number] },
  { value: 420, label: '420 m', color: [170, 50, 255, 230] as [number, number, number, number] },
  { value: 560, label: '560 m+', color: [220, 40, 255, 230] as [number, number, number, number] },
] as const;

/** Sentinel nodata on NHDPlus elevation fields is typically -9998. */
export const NHDPLUS_MISSING_ELEVATION_WHERE = [
  '(minelevraw IS NULL OR minelevraw <= -9000)',
  '(maxelevraw IS NULL OR maxelevraw <= -9000)',
  '(minelevsmo IS NULL OR minelevsmo <= -9000)',
  '(maxelevsmo IS NULL OR maxelevsmo <= -9000)',
].join(' AND ');

function compactArcade(expression: string): string {
  return expression.trim().replace(/\s+/g, ' ');
}

function sampledElevationArcade(sampledMetersByObjectId: Record<string, number>): string {
  const entries = Object.entries(sampledMetersByObjectId)
    .filter(([, meters]) => Number.isFinite(meters))
    .slice(0, 200);
  if (entries.length === 0) return '';
  const args = entries
    .map(([objectId, meters]) => `'${objectId}', ${Number(meters.toFixed(2))}`)
    .join(', ');
  return `
    var sampled = Dictionary(${args});
    var oid = Text($feature.objectid);
    if (HasKey(sampled, oid)) { return sampled[oid]; }
  `;
}

/**
 * Prefer a raw min/max pair, then smoothed, then any valid combination.
 * Optional 3D DTM samples fill reaches that have no NHD elevation at all.
 */
export function buildNhdPlusElevationValueExpression(
  sampledMetersByObjectId: Record<string, number> = {},
): string {
  return compactArcade(`
    function valid(v) { return v != null && v > -9000; }
    var loRaw = $feature.minelevraw;
    var hiRaw = $feature.maxelevraw;
    var loSmo = $feature.minelevsmo;
    var hiSmo = $feature.maxelevsmo;
    if (valid(loRaw) && valid(hiRaw)) { return (loRaw + hiRaw) / 200; }
    if (valid(loSmo) && valid(hiSmo)) { return (loSmo + hiSmo) / 200; }
    var vals = [];
    if (valid(loRaw)) { vals.push(loRaw); }
    if (valid(hiRaw)) { vals.push(hiRaw); }
    if (valid(loSmo)) { vals.push(loSmo); }
    if (valid(hiSmo)) { vals.push(hiSmo); }
    if (Count(vals) > 0) { return Average(vals) / 100; }
    ${sampledElevationArcade(sampledMetersByObjectId)}
    var g = Geometry($feature);
    if (g != null && g.paths != null && Count(g.paths) > 0) {
      var zVals = [];
      for (var p in g.paths) {
        var path = g.paths[p];
        for (var i in path) {
          var pt = path[i];
          if (Count(pt) > 2 && valid(pt[2])) { zVals.push(pt[2]); }
        }
      }
      if (Count(zVals) > 0) { return Average(zVals); }
    }
    return null;
  `);
}

function toCssRgba(color: readonly number[]): string {
  const [r, g, b, a = 255] = color;
  return `rgba(${r}, ${g}, ${b}, ${a / 255})`;
}

export function getNhdPlusFlowlineGradientCss(): string {
  const stops = ELEVATION_COLOR_STOPS.map((stop, index) => {
    const pct = (index / (ELEVATION_COLOR_STOPS.length - 1)) * 100;
    return `${toCssRgba(stop.color)} ${pct}%`;
  });
  return `linear-gradient(90deg, ${stops.join(', ')})`;
}

export function isNhdPlusFlowlinesLayer(layer: Pick<CatalogLayer, 'name' | 'catalogMeta'>): boolean {
  const path = layer.catalogMeta?.servicePath?.toLowerCase() ?? '';
  if (!path.includes('nhdplus_high_resolution')) return false;
  const name = layer.name.toLowerCase();
  if (name.includes('flowline')) return true;
  const layerId = layer.catalogMeta?.layerIdInService;
  return layerId === 0 || layerId == null;
}

export function createNhdPlusFlowlineRenderer(
  viewMode: '2d' | '3d' = '2d',
  sampledMetersByObjectId: Record<string, number> = {},
): FeatureLayer['renderer'] {
  // Screen-space lines in both modes. Path tubes tessellate over terrain and
  // leave gaps; LineSymbol3DLayer / SimpleLineSymbol stay continuous.
  const symbol = viewMode === '3d'
    ? {
        type: 'line-3d' as const,
        symbolLayers: [{
          type: 'line' as const,
          size: NHDPLUS_FLOWLINE_WIDTH,
          cap: 'round' as const,
          join: 'round' as const,
          material: { color: NODATA_COLOR },
        }],
      }
    : {
        type: 'simple-line' as const,
        style: 'solid' as const,
        color: NODATA_COLOR,
        width: NHDPLUS_FLOWLINE_WIDTH,
        cap: 'round' as const,
        join: 'round' as const,
      };

  return {
    type: 'simple',
    symbol,
    visualVariables: [{
      type: 'color',
      valueExpression: buildNhdPlusElevationValueExpression(sampledMetersByObjectId),
      valueExpressionTitle: 'Midpoint elevation',
      legendOptions: { title: 'Elevation' },
      stops: ELEVATION_COLOR_STOPS.map((stop) => ({
        value: stop.value,
        color: stop.color,
        label: stop.label,
      })),
    }],
  } as FeatureLayer['renderer'];
}

export function getNhdPlusFlowlineLegend(): ArcGISLayerLegend {
  return {
    layerId: 0,
    layerName: 'Flowlines',
    rendererType: 'continuous',
    gradientCss: getNhdPlusFlowlineGradientCss(),
    rampTitle: 'Elevation',
    rampLowLabel: 'Low',
    rampHighLabel: 'High',
    items: [
      { label: 'Low elevation', swatchColor: toCssRgba(ELEVATION_COLOR_STOPS[0].color) },
      { label: 'High elevation', swatchColor: toCssRgba(ELEVATION_COLOR_STOPS[ELEVATION_COLOR_STOPS.length - 1].color) },
      { label: 'No elevation data', swatchColor: toCssRgba(NODATA_COLOR) },
    ],
  };
}
