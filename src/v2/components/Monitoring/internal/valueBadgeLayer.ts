// ============================================================================
// Circular value badges.
//
// One filled disc per station with its reading inside and the station name
// underneath. Written generically because every sensor variable — wind speed,
// temperature, humidity, pressure, rainfall — wants the same treatment.
// ============================================================================

import Graphic from '@arcgis/core/Graphic';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import Point from '@arcgis/core/geometry/Point';
import SimpleMarkerSymbol from '@arcgis/core/symbols/SimpleMarkerSymbol';
import TextSymbol from '@arcgis/core/symbols/TextSymbol';
import Font from '@arcgis/core/symbols/Font';
import { getSpeedColorArray, type Rgb } from './windField';

export interface BadgePoint {
  longitude: number;
  latitude: number;
  /** Value normalized 0-1, driving the fill colour. */
  t: number;
  /** Short reading shown inside the disc, e.g. "4.1". Keep to ~4 characters. */
  text: string;
  /** Station name rendered beneath the disc. */
  caption?: string;
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

    layer.add(
      new Graphic({
        geometry,
        symbol: new TextSymbol({
          text: point.text,
          color: textColor,
          // Sits on top of the disc, so a halo would muddy it.
          font: new Font({ size: 11, family: 'sans-serif', weight: 'bold' }),
          horizontalAlignment: 'center',
          verticalAlignment: 'middle',
        }),
      }),
    );

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
