// ============================================================================
// Value badges — one filled disc per station with its reading inside.
//
// Stations with an open alert keep the same disc and gain a severity-coloured
// warning flag overlapping the top of it, so the reading stays comparable to
// its neighbours.
// ============================================================================

import Graphic from '@arcgis/core/Graphic';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import Point from '@arcgis/core/geometry/Point';
import SimpleMarkerSymbol from '@arcgis/core/symbols/SimpleMarkerSymbol';
import PictureMarkerSymbol from '@arcgis/core/symbols/PictureMarkerSymbol';
import TextSymbol from '@arcgis/core/symbols/TextSymbol';
import Font from '@arcgis/core/symbols/Font';
import { getSpeedColorArray, type Rgb } from './windField';
import { severityMarkerColor } from './alertMarkerLayer';

export interface BadgePoint {
  longitude: number;
  latitude: number;
  /** Value normalized 0-1, driving the fill colour. */
  t: number;
  /** Reading shown inside the disc, e.g. "4.1". */
  text: string;
  /** Unit appended on the same line as the reading, e.g. "m/s". */
  unit?: string;
  /** Station name rendered beneath the disc. */
  caption?: string;
  /**
   * When set, a severity-coloured warning flag is drawn overlapping the top of
   * the disc. Fill still follows the value ramp so alerted stations stay
   * comparable.
   */
  severity?: string;
  stationId?: number;
  stationName?: string;
  popupTitle: string;
  /** Popup HTML. */
  popupContent: string;
}

export interface ValueBadgeLayerOptions {
  title: string;
  /** Override the default speed ramp, e.g. a temperature ramp. */
  colorFor?: (t: number) => Rgb;
  /** Diameter of the disc in points. */
  size?: number;
}

const DEFAULT_SIZE = 34;
export const ALERT_FLAG_SIZE_PT = 34;

/** Cache one SVG data-URL per severity so every station reuses the same image. */
const alertFlagUrlBySeverity = new Map<string, string>();

/**
 * A real filled circle with a centred "!", as an SVG. Font glyphs cannot colour
 * or centre reliably the way a drawn shape can.
 */
function alertFlagDataUrl(severity: string): string {
  const key = `${severity.toLowerCase()}:circle-sm-v1`;
  const cached = alertFlagUrlBySeverity.get(key);
  if (cached) return cached;

  const [r, g, b] = severityMarkerColor(severity);
  const fill = `rgb(${r},${g},${b})`;
  // viewBox 0 0 50 50; smaller disc, same "!" size as before.
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 50 50">
  <circle cx="25" cy="25" r="15" fill="${fill}" stroke="#ffffff" stroke-width="2.25"/>
  <text x="25" y="31" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="700" fill="#ffffff">!</text>
</svg>`.trim();

  const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  alertFlagUrlBySeverity.set(key, url);
  return url;
}

/** Severity warning flag used by both Labels discs and Surface value markers. */
export function createAlertFlagSymbol(severity: string, yoffset: number): PictureMarkerSymbol {
  return new PictureMarkerSymbol({
    url: alertFlagDataUrl(severity),
    width: ALERT_FLAG_SIZE_PT,
    height: ALERT_FLAG_SIZE_PT,
    yoffset,
  });
}

/**
 * Perceived brightness, used to flip the label between dark and light so the
 * reading stays legible across the whole colour ramp.
 */
function isLightFill({ r, g, b }: Rgb): boolean {
  return (r * 299 + g * 587 + b * 114) / 1000 > 145;
}

export function createValueBadgeLayer(
  points: BadgePoint[],
  { title, colorFor, size = DEFAULT_SIZE }: ValueBadgeLayerOptions,
): GraphicsLayer {
  // Ids are left to the SDK: these layers are held by reference and swapped
  // often, and a reused id collides with the outgoing layer, which fails
  // layerview creation.
  const layer = new GraphicsLayer({ title });

  for (const point of points) {
    const geometry = new Point({
      longitude: point.longitude,
      latitude: point.latitude,
    });

    const [r, g, b] = getSpeedColorArray(point.t);
    const fill: Rgb = colorFor ? colorFor(point.t) : { r, g, b };
    const textColor = isLightFill(fill) ? [30, 25, 40, 255] : [255, 255, 255, 255];

    layer.add(
      new Graphic({
        geometry,
        attributes: {
          stationId: point.stationId ?? null,
          stationName: point.stationName ?? point.caption ?? null,
        },
        symbol: new SimpleMarkerSymbol({
          style: 'circle',
          size,
          color: [fill.r, fill.g, fill.b, 235],
          outline: { color: [255, 255, 255, 235], width: 1.75 },
        }),
        popupTemplate: {
          title: point.popupTitle,
          content: [{ type: 'text', text: point.popupContent }],
        },
      }),
    );

    // Long readings (e.g. discharge "0.028 m³/s") spill past the disc on one
    // line — stack value over unit so both stay inside the circle.
    const singleLine = point.unit ? `${point.text} ${point.unit}` : point.text;
    const wrapLabel = Boolean(point.unit) && singleLine.length > 7;
    const label = wrapLabel ? `${point.text}\n${point.unit}` : singleLine;
    const fontSize = wrapLabel ? 9 : singleLine.length > 8 ? 9.5 : 11;

    layer.add(
      new Graphic({
        geometry,
        symbol: new TextSymbol({
          text: label,
          color: textColor,
          // Sits on top of the disc, so a halo would muddy it.
          font: new Font({
            size: fontSize,
            family: 'sans-serif',
            weight: 'bold',
          }),
          horizontalAlignment: 'center',
          verticalAlignment: 'middle',
          ...(wrapLabel ? { lineHeight: 0.95 } : {}),
        }),
      }),
    );

    if (point.severity) {
      layer.add(
        new Graphic({
          geometry,
          symbol: createAlertFlagSymbol(point.severity, size / 2 + 4),
        }),
      );
    }

    if (point.caption) {
      layer.add(
        new Graphic({
          geometry,
          symbol: new TextSymbol({
            text: point.caption,
            color: [255, 255, 255, 240],
            haloColor: [0, 0, 0, 190],
            haloSize: 1.6,
            font: new Font({ size: 9, family: 'sans-serif' }),
            horizontalAlignment: 'center',
            verticalAlignment: 'top',
            // Clear the disc so the caption never overlaps the reading.
            yoffset: -(size / 2 + 4),
          }),
        }),
      );
    }
  }

  return layer;
}
