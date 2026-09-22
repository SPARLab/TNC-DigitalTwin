// ============================================================================
// Well column layer — one vertical cylinder per well, hanging from the ground
// surface down to the water table.
//
// Length encodes depth to water and colour encodes the water-table elevation, so
// the two stay separable: a long column low on the ramp is a deep well in low
// country, a short column high on the ramp is a shallow well in the uplands.
// Interpolating between wells is left to the 2D surface — columns deliberately
// show only what was measured.
// ============================================================================

import Graphic from '@arcgis/core/Graphic';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import Point from '@arcgis/core/geometry/Point';
import ObjectSymbol3DLayer from '@arcgis/core/symbols/ObjectSymbol3DLayer';
import PointSymbol3D from '@arcgis/core/symbols/PointSymbol3D';
import { sampleRamp } from './colorRamps';
import { normalize } from './scalarField';
import type { ScalarSnapshot, SensorVariableConfig } from '../../../services/sensorService';
import { formatObservedAt } from './formatObservedAt';
import { formatStationDisplayName } from '../../../services/dendraStationService';

/**
 * Cylinder diameter in metres. The well network spans roughly 10 km, so this is
 * a compromise: wide enough to pick out at full extent, narrow enough that
 * neighbouring wells in the Tinta cluster stay distinct.
 */
const COLUMN_DIAMETER_METRES = 45;

/** Columns shorter than this would render as invisible slivers. */
const MINIMUM_COLUMN_HEIGHT_METRES = 4;

/** Close enough to count as the same pad, well inside the column's own width. */
const COLOCATION_TOLERANCE_DEGREES = 1e-5;

const METRES_PER_DEGREE_LATITUDE = 111_320;

/**
 * Nudge wells that share a pad onto a small ring around it.
 *
 * Nested wells are real and common — Tinta 5 and 5B are logged at identical
 * coordinates — and drawn faithfully the shallower column sits entirely inside
 * the deeper one and simply disappears. A nudge of under one column width keeps
 * both readable at the cost of a position error smaller than the symbol.
 */
function ringOffset(
  index: number,
  count: number,
  latitude: number,
): { deltaLongitude: number; deltaLatitude: number } {
  if (count < 2) return { deltaLongitude: 0, deltaLatitude: 0 };

  const angle = (2 * Math.PI * index) / count;
  const radiusMetres = COLUMN_DIAMETER_METRES * 0.75;
  const metresPerDegreeLongitude =
    METRES_PER_DEGREE_LATITUDE * Math.cos((latitude * Math.PI) / 180);

  return {
    deltaLongitude: (radiusMetres * Math.cos(angle)) / metresPerDegreeLongitude,
    deltaLatitude: (radiusMetres * Math.sin(angle)) / METRES_PER_DEGREE_LATITUDE,
  };
}


/**
 * Build the column layer for a derived-head snapshot.
 *
 * Depth is recovered as ground elevation minus water-table elevation rather than
 * re-read from the raw field, which keeps the unit and sign corrections applied
 * upstream from having to be repeated here.
 */
export function createWellColumnLayer(
  snapshot: ScalarSnapshot,
  config: SensorVariableConfig,
): GraphicsLayer {
  const drawable = snapshot.readings.flatMap((reading) => {
    if (reading.elevationMetres === null) return [];
    const depthMetres = reading.elevationMetres - reading.value;
    if (!Number.isFinite(depthMetres) || depthMetres <= 0) return [];
    return [{ reading, depthMetres, groundMetres: reading.elevationMetres }];
  });

  // Group by pad so nested wells can be fanned apart.
  const pads = new Map<string, typeof drawable>();
  for (const entry of drawable) {
    const key = [
      Math.round(entry.reading.longitude / COLOCATION_TOLERANCE_DEGREES),
      Math.round(entry.reading.latitude / COLOCATION_TOLERANCE_DEGREES),
    ].join(',');
    const pad = pads.get(key);
    if (pad) pad.push(entry);
    else pads.set(key, [entry]);
  }

  const graphics: Graphic[] = [];

  for (const pad of pads.values()) {
    // Deepest first, so a fanned pad reads outward from its longest column.
    pad.sort((a, b) => b.depthMetres - a.depthMetres);

    pad.forEach(({ reading, depthMetres, groundMetres }, index) => {
      const { r, g, b } = sampleRamp(
        config.ramp,
        normalize(reading.value, snapshot.min, snapshot.max),
      );

      const { deltaLongitude, deltaLatitude } = ringOffset(
        index,
        pad.length,
        reading.latitude,
      );

      graphics.push(
        new Graphic({
          geometry: new Point({
            longitude: reading.longitude + deltaLongitude,
            latitude: reading.latitude + deltaLatitude,
            spatialReference: { wkid: 4326 },
          }),
          symbol: new PointSymbol3D({
            symbolLayers: [
              new ObjectSymbol3DLayer({
                resource: { primitive: 'cylinder' },
                width: COLUMN_DIAMETER_METRES,
                depth: COLUMN_DIAMETER_METRES,
                height: Math.max(depthMetres, MINIMUM_COLUMN_HEIGHT_METRES),
                // Anchoring the top at the point makes the column hang downward
                // from the terrain rather than standing on top of it.
                anchor: 'top',
                material: { color: [r, g, b, 0.92] },
              }),
            ],
          }),
          attributes: {
            stationName: formatStationDisplayName(reading.stationName),
            depth: depthMetres.toFixed(1),
            head: reading.value.toFixed(config.decimals),
            ground: groundMetres.toFixed(1),
            observed: formatObservedAt(reading.observedAt),
            sharedPad:
              pad.length > 1
                ? `Drawn slightly offset: ${pad.length} wells share this location.`
                : '',
          },
          popupTemplate: {
            title: '{stationName}',
            content: `
              <p><b>Depth to water:</b> {depth} m below ground</p>
              <p><b>Water table:</b> {head} ${config.unit} above sea level</p>
              <p><b>Ground elevation:</b> {ground} m</p>
              <p><b>Observed:</b> {observed}</p>
              <p><i>{sharedPad}</i></p>
            `,
          },
        }),
      );
    });
  }

  return new GraphicsLayer({
    title: `${config.label} — Well Columns`,
    graphics,
    // Each column starts at the terrain surface whatever elevation source the
    // scene is using, so the drawn length always reads as depth below ground.
    elevationInfo: { mode: 'relative-to-ground', offset: 0 },
  });
}
