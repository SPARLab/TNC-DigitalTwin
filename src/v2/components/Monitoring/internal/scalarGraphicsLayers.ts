// ============================================================================
// Station badges for the scalar sensor variables.
// ============================================================================

import Graphic from '@arcgis/core/Graphic';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import Point from '@arcgis/core/geometry/Point';
import SimpleMarkerSymbol from '@arcgis/core/symbols/SimpleMarkerSymbol';
import TextSymbol from '@arcgis/core/symbols/TextSymbol';
import Font from '@arcgis/core/symbols/Font';
import { createValueBadgeLayer, createAlertFlagSymbol, type BadgePoint } from './valueBadgeLayer';
import { sampleRamp } from './colorRamps';
import { normalize } from './scalarField';
import { formatObservedAt } from './formatObservedAt';
import {
  buildStationAlertLookup,
  formatMeasurementPopupHeader,
  formatStationAlertPopupHtml,
  lookupStationAlert,
  type StationAlertCluster,
} from './alertMarkerLayer';
import {
  getRampBounds,
  type ScalarReading,
  type ScalarSnapshot,
  type SensorVariableConfig,
} from '../../../services/sensorService';
import type { LiveAlert } from '../../../services/liveAlertService';

/** Same diameter as Labels discs — used as a near-invisible hit target on Surface. */
const SURFACE_HIT_TARGET_SIZE = 42;

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

  return notes.map((note) => `<p style="margin:4px 0 0;color:#6b7280;font-size:12px">${note}</p>`).join('');
}

/** Full station popup body for scalar readings (map click and panel focus). */
export function formatScalarStationPopupContent(
  reading: ScalarReading,
  config: SensorVariableConfig,
  cluster: StationAlertCluster | null,
): string {
  return `
    ${formatMeasurementPopupHeader(
      config.label,
      `${reading.value.toFixed(config.decimals)} ${config.unit}`,
    )}
    <p style="margin:0;color:#6b7280;font-size:12px"><b>Observed:</b> ${formatObservedAt(reading.observedAt)}</p>
    ${describeDerivation(reading, config)}
    ${formatStationAlertPopupHtml(cluster, config.label)}
  `;
}

/**
 * Measured values as text over the interpolated surface.
 *
 * Each station gets a Labels-sized, near-transparent disc as a hit target so the
 * surface colour stays readable while the popup is easy to open. Alert flags use
 * the same severity marker as Labels mode.
 */
export function createScalarValueLabelLayer(
  snapshot: ScalarSnapshot,
  config: SensorVariableConfig,
  alerts: LiveAlert[] = [],
): GraphicsLayer {
  const layer = new GraphicsLayer({ title: `${config.label} — Station Values` });
  const alertLookup = buildStationAlertLookup(alerts);

  for (const reading of snapshot.readings) {
    const geometry = new Point({
      longitude: reading.longitude,
      latitude: reading.latitude,
    });
    const cluster = lookupStationAlert(alertLookup, reading);
    const popupTemplate = {
      title: reading.stationName,
      content: [
        {
          type: 'text' as const,
          text: formatScalarStationPopupContent(reading, config, cluster),
        },
      ],
    };

    // Large, nearly transparent disc — same footprint as Labels badges so the
    // surface colour stays readable while giving a generous click target.
    layer.add(
      new Graphic({
        geometry,
        attributes: {
          stationId: reading.stationId,
          stationName: reading.stationName,
        },
        symbol: new SimpleMarkerSymbol({
          style: 'circle',
          size: SURFACE_HIT_TARGET_SIZE,
          // Fully clear fill so the interpolated surface shows through; a faint
          // ring keeps the clickable area discoverable without a white wash.
          color: [255, 255, 255, 0],
          outline: { color: [255, 255, 255, 55], width: 1.25 },
        }),
        popupTemplate,
      }),
    );

    layer.add(
      new Graphic({
        geometry,
        symbol: new TextSymbol({
          text: `${reading.value.toFixed(config.decimals)} ${config.unit}`,
          color: [255, 255, 255, 255],
          // Halo carries the legibility over both the surface and the basemap.
          haloColor: [15, 20, 30, 210],
          haloSize: 1.8,
          font: new Font({ size: 11, family: 'sans-serif', weight: 'bold' }),
          horizontalAlignment: 'center',
          verticalAlignment: 'middle',
        }),
      }),
    );

    if (cluster) {
      layer.add(
        new Graphic({
          geometry,
          symbol: createAlertFlagSymbol(
            cluster.primary.severity,
            SURFACE_HIT_TARGET_SIZE / 2 + 4,
          ),
        }),
      );
    }
  }

  return layer;
}

export function createScalarBadgeLayer(
  snapshot: ScalarSnapshot,
  config: SensorVariableConfig,
  alerts: LiveAlert[] = [],
): GraphicsLayer {
  const [rampLow, rampHigh] = getRampBounds(config, snapshot);
  const alertLookup = buildStationAlertLookup(alerts);

  const points: BadgePoint[] = snapshot.readings.map((reading) => {
    const cluster = lookupStationAlert(alertLookup, reading);

    return {
      longitude: reading.longitude,
      latitude: reading.latitude,
      t: normalize(reading.value, rampLow, rampHigh),
      text: reading.value.toFixed(config.decimals),
      unit: config.unit,
      caption: reading.stationName.replace(/^Dangermond[_ ]/, ''),
      severity: cluster?.primary.severity,
      stationId: reading.stationId,
      stationName: reading.stationName,
      popupTitle: reading.stationName,
      popupContent: formatScalarStationPopupContent(reading, config, cluster),
    };
  });

  return createValueBadgeLayer(points, {
    title: `${config.label} — Station Readings`,
    colorFor: (t) => sampleRamp(config.ramp, t),
    // Pressure needs room for four digits alongside its unit.
    size: snapshot.max >= 1000 ? 48 : 42,
  });
}
