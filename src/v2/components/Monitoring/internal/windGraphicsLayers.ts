// ============================================================================
// Static wind renderers: per-station arrows and the IDW-interpolated grid.
//
// Both draw the same CIM arrow marker so the two modes read as the same
// dataset at different resolutions.
// ============================================================================

import Graphic from '@arcgis/core/Graphic';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import Point from '@arcgis/core/geometry/Point';
import CIMSymbol from '@arcgis/core/symbols/CIMSymbol';
import {
  buildWindField,
  getSpeedColorArray,
  getStationsExtent,
} from './windField';
import {
  getCompassLabel,
  getGoingBearing,
  type WindReading,
} from '../../../services/windService';
import { createValueBadgeLayer, type BadgePoint } from './valueBadgeLayer';

const GRID_COLS = 20;
const GRID_ROWS = 15;

interface ArrowSymbolOptions {
  /** Speed normalized 0-1, driving both size and colour. */
  t: number;
  /** Compass bearing the arrow should point toward. */
  goingBearing: number;
  minSize: number;
  maxSize: number;
  fillAlpha: number;
  strokeAlpha: number;
  strokeWidth: number;
}

/**
 * The marker geometry is a chevron drawn in a 16x16 frame pointing up (north at
 * 0 rotation). CIM rotation runs counter-clockwise while compass bearings run
 * clockwise, hence the negation.
 */
function createArrowSymbol({
  t,
  goingBearing,
  minSize,
  maxSize,
  fillAlpha,
  strokeAlpha,
  strokeWidth,
}: ArrowSymbolOptions): CIMSymbol {
  const clamped = Math.max(0, Math.min(1, t));

  return new CIMSymbol({
    data: {
      type: 'CIMSymbolReference',
      symbol: {
        type: 'CIMPointSymbol',
        angleAlignment: 'Map',
        symbolLayers: [
          {
            type: 'CIMVectorMarker',
            enable: true,
            size: minSize + clamped * (maxSize - minSize),
            rotation: -goingBearing,
            anchorPoint: { x: 0, y: 0 },
            frame: { xmin: 0, ymin: 0, xmax: 16, ymax: 16 },
            markerGraphics: [
              {
                type: 'CIMMarkerGraphic',
                geometry: {
                  rings: [[[8, 16], [2, 0], [8, 5], [14, 0], [8, 16]]],
                },
                symbol: {
                  type: 'CIMPolygonSymbol',
                  symbolLayers: [
                    {
                      type: 'CIMSolidStroke',
                      enable: true,
                      color: [255, 255, 255, strokeAlpha],
                      width: strokeWidth,
                    },
                    {
                      type: 'CIMSolidFill',
                      enable: true,
                      color: getSpeedColorArray(clamped, fillAlpha),
                    },
                  ],
                },
              },
            ],
          },
        ],
      },
    } as unknown as CIMSymbol['data'],
  });
}

function formatObservedAt(epochMs: number): string {
  if (!epochMs) return 'Unknown';
  return new Date(epochMs).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** One arrow per reporting station, sized and coloured by its average speed. */
export function createWindArrowLayer(readings: WindReading[]): GraphicsLayer {
  const maxSpeed = Math.max(...readings.map((reading) => reading.windSpeedAvg), 1);

  const layer = new GraphicsLayer({
    title: 'Wind — Latest Hour',
  });

  for (const reading of readings) {
    const goingBearing = getGoingBearing(reading.windDirectionAvg);

    layer.add(
      new Graphic({
        geometry: new Point({
          longitude: reading.longitude,
          latitude: reading.latitude,
        }),
        symbol: createArrowSymbol({
          t: reading.windSpeedAvg / maxSpeed,
          goingBearing,
          minSize: 14,
          maxSize: 40,
          fillAlpha: 220,
          strokeAlpha: 180,
          strokeWidth: 0.8,
        }),
        attributes: { stationName: reading.stationName },
        popupTemplate: {
          title: reading.stationName,
          content: [
            {
              type: 'text',
              text: `
                <p><b>Average speed:</b> ${reading.windSpeedAvg.toFixed(2)} m/s</p>
                <p><b>Peak gust:</b> ${reading.windSpeedMax.toFixed(2)} m/s</p>
                <p><b>Blowing from:</b> ${reading.windDirectionAvg.toFixed(0)}°
                  (${getCompassLabel(reading.windDirectionAvg)})</p>
                <p><b>Blowing toward:</b> ${goingBearing.toFixed(0)}°
                  (${getCompassLabel(goingBearing)})</p>
                <p><b>Observed:</b> ${formatObservedAt(reading.observedAt)}</p>
              `,
            },
          ],
        },
      }),
    );
  }

  return layer;
}

/** Station discs showing each average speed, with the name underneath. */
export function createWindBadgeLayer(readings: WindReading[]): GraphicsLayer {
  const maxSpeed = Math.max(...readings.map((reading) => reading.windSpeedAvg), 1);

  const points: BadgePoint[] = readings.map((reading) => {
    const goingBearing = getGoingBearing(reading.windDirectionAvg);

    return {
      longitude: reading.longitude,
      latitude: reading.latitude,
      t: reading.windSpeedAvg / maxSpeed,
      text: reading.windSpeedAvg.toFixed(1),
      caption: reading.stationName.replace(/^Dangermond[_ ]/, ''),
      popupTitle: reading.stationName,
      popupContent: `
        <p><b>Average speed:</b> ${reading.windSpeedAvg.toFixed(2)} m/s</p>
        <p><b>Peak gust:</b> ${reading.windSpeedMax.toFixed(2)} m/s</p>
        <p><b>Blowing from:</b> ${reading.windDirectionAvg.toFixed(0)}°
          (${getCompassLabel(reading.windDirectionAvg)})</p>
        <p><b>Blowing toward:</b> ${goingBearing.toFixed(0)}°
          (${getCompassLabel(goingBearing)})</p>
        <p><b>Observed:</b> ${formatObservedAt(reading.observedAt)}</p>
      `,
    };
  });

  return createValueBadgeLayer(points, { title: 'Wind — Station Readings' });
}

/**
 * A regular lattice of arrows sampled from the interpolated field, showing the
 * modelled wind between stations rather than only at them.
 */
export function createWindGridLayer(readings: WindReading[]): GraphicsLayer {
  const extent = getStationsExtent(readings);
  const field = buildWindField(readings, extent, GRID_COLS, GRID_ROWS);

  const layer = new GraphicsLayer({
    title: 'Wind — Interpolated Grid',
  });

  const dxStep = (extent.xmax - extent.xmin) / GRID_COLS;
  const dyStep = (extent.ymax - extent.ymin) / GRID_ROWS;

  for (let row = 0; row < GRID_ROWS; row++) {
    const latitude = extent.ymax - (row + 0.5) * dyStep;

    for (let col = 0; col < GRID_COLS; col++) {
      const longitude = extent.xmin + (col + 0.5) * dxStep;
      const index = row * GRID_COLS + col;

      const u = field.u[index];
      const v = field.v[index];
      const speed = field.speeds[index];

      // atan2(u, v) recovers the FROM bearing the components were built from.
      const fromBearing = ((Math.atan2(u, v) * 180) / Math.PI + 360) % 360;
      const goingBearing = getGoingBearing(fromBearing);

      layer.add(
        new Graphic({
          geometry: new Point({ longitude, latitude }),
          symbol: createArrowSymbol({
            t: speed / field.maxSpeed,
            goingBearing,
            minSize: 10,
            maxSize: 34,
            fillAlpha: 200,
            strokeAlpha: 140,
            strokeWidth: 0.6,
          }),
          popupTemplate: {
            title: 'Interpolated wind',
            content: [
              {
                type: 'text',
                text: `
                  <p><b>Modelled speed:</b> ${speed.toFixed(2)} m/s</p>
                  <p><b>Blowing from:</b> ${fromBearing.toFixed(0)}°
                    (${getCompassLabel(fromBearing)})</p>
                  <p><b>Blowing toward:</b> ${goingBearing.toFixed(0)}°
                    (${getCompassLabel(goingBearing)})</p>
                  <p>Inverse-distance weighted from ${readings.length} stations.</p>
                `,
              },
            ],
          },
        }),
      );
    }
  }

  return layer;
}
