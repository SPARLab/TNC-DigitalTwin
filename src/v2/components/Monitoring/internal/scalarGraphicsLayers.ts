// ============================================================================
// Station badges for the scalar sensor variables.
// ============================================================================

import Graphic from '@arcgis/core/Graphic';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import Point from '@arcgis/core/geometry/Point';
import SimpleMarkerSymbol from '@arcgis/core/symbols/SimpleMarkerSymbol';
import TextSymbol from '@arcgis/core/symbols/TextSymbol';
import Font from '@arcgis/core/symbols/Font';
import { createValueBadgeLayer, type BadgePoint } from './valueBadgeLayer';
import { sampleRamp } from './colorRamps';
import { normalize } from './scalarField';
import type {
  ScalarReading,
  ScalarSnapshot,
  SensorVariableConfig,
} from '../../../services/sensorService';

function formatObservedAt(epochMs: number): string {
  if (!epochMs) return 'Unknown';
  return new Date(epochMs).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** Explain any correction applied, so a surprising number can be traced. */
function describeDerivation(
  reading: ScalarReading,
  config: SensorVariableConfig,
): string {
  const notes: string[] = [];

  if (reading.derivation === 'midpoint' || reading.derivation === 'midpoint+sea-level') {
    notes.push(
      `This station reports only interval minimum and maximum, so the value is their midpoint (from <code>${reading.sourceField}</code>).`,
    );
  }

  if (reading.derivation === 'sea-level' || reading.derivation === 'midpoint+sea-level') {
    notes.push(
      `Reduced to mean sea level from ${reading.rawValue.toFixed(1)} ${config.unit} measured at ${
        reading.elevationMetres?.toFixed(0) ?? '?'
      } m elevation, so stations are comparable.`,
    );
  }

  if (notes.length === 0) {
    notes.push(`Reported directly as <code>${reading.sourceField}</code>.`);
  }

  return notes.map((note) => `<p>${note}</p>`).join('');
}

/** Build the popup shown for a station in either graphics mode. */
function buildPopupTemplate(reading: ScalarReading, config: SensorVariableConfig) {
  return {
    title: reading.stationName,
    content: [
      {
        type: 'text' as const,
        text: `
          <p><b>${config.label}:</b> ${reading.value.toFixed(config.decimals)} ${config.unit}</p>
          <p><b>Observed:</b> ${formatObservedAt(reading.observedAt)}</p>
          ${describeDerivation(reading, config)}
        `,
      },
    ],
  };
}

/**
 * Measured values as text over the interpolated surface.
 *
 * The surface only shows where a value sits on the ramp; these anchor it to the
 * readings it was built from, so the estimate can be checked against the
 * measurements at the points where they were actually taken. Deliberately just a
 * dot and a number — the badge mode is the heavier treatment.
 */
export function createScalarValueLabelLayer(
  snapshot: ScalarSnapshot,
  config: SensorVariableConfig,
): GraphicsLayer {
  const layer = new GraphicsLayer({ title: `${config.label} — Station Values` });

  for (const reading of snapshot.readings) {
    const geometry = new Point({
      longitude: reading.longitude,
      latitude: reading.latitude,
    });

    layer.add(
      new Graphic({
        geometry,
        symbol: new SimpleMarkerSymbol({
          style: 'circle',
          size: 5.5,
          color: [255, 255, 255, 245],
          outline: { color: [25, 30, 40, 210], width: 1 },
        }),
        popupTemplate: buildPopupTemplate(reading, config),
      }),
    );

    layer.add(
      new Graphic({
        geometry,
        symbol: new TextSymbol({
          text: reading.value.toFixed(config.decimals),
          color: [255, 255, 255, 255],
          // Halo carries the legibility over both the surface and the basemap.
          haloColor: [15, 20, 30, 210],
          haloSize: 1.8,
          font: new Font({ size: 11, family: 'sans-serif', weight: 'bold' }),
          horizontalAlignment: 'center',
          verticalAlignment: 'bottom',
          // Clear the dot so the number never sits on top of it.
          yoffset: 6,
        }),
      }),
    );
  }

  return layer;
}

export function createScalarBadgeLayer(
  snapshot: ScalarSnapshot,
  config: SensorVariableConfig,
): GraphicsLayer {
  const points: BadgePoint[] = snapshot.readings.map((reading) => ({
    longitude: reading.longitude,
    latitude: reading.latitude,
    t: normalize(reading.value, snapshot.min, snapshot.max),
    text: reading.value.toFixed(config.decimals),
    caption: reading.stationName.replace(/^Dangermond[_ ]/, ''),
    popupTitle: reading.stationName,
    popupContent: `
      <p><b>${config.label}:</b> ${reading.value.toFixed(config.decimals)} ${config.unit}</p>
      <p><b>Observed:</b> ${formatObservedAt(reading.observedAt)}</p>
      ${describeDerivation(reading, config)}
    `,
  }));

  return createValueBadgeLayer(points, {
    title: `${config.label} — Station Readings`,
    colorFor: (t) => sampleRamp(config.ramp, t),
    // Pressure needs room for four digits.
    size: config.decimals > 0 && snapshot.max >= 1000 ? 42 : 36,
  });
}
