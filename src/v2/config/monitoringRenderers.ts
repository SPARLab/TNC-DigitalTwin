// ============================================================================
// Monitoring renderer bindings — maps a catalog dataset to the code that knows
// how to draw it.
//
// Division of responsibility: `live_tag` in the Data Catalog decides *whether* a
// dataset appears on Live Monitoring and *which section* it lands in. This file
// decides *how* it draws. A dataset that carries a tag but has no binding here
// still appears in the tree, greyed out, so tagging something ahead of its
// implementation is a safe thing to do.
//
// Matching is by service path rather than display title, because the title is
// editable in the management app and the service path is not.
//
// Multi-measure services (Creek Gauges, Groundwater) register several bindings
// on the same path — one per SENSOR_VARIABLES entry — so the monitoring tree can
// expose each datastream the way the catalog expands measure rows.
// ============================================================================

import { Activity, Camera, Droplets, Gauge, Thermometer, Waves } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { CAMERA_SERVICE_PATH } from '../services/cameraService';
import { SENSOR_VARIABLES, type SensorVariableId } from '../services/sensorService';
import { WIND_SERVICE_PATH } from '../services/windService';

/** Each value corresponds to a renderer implemented under components/Monitoring. */
export type MonitoringRenderer = 'wind-vector-field' | 'scalar-surface' | 'camera-feed';

export interface RendererBinding {
  renderer: MonitoringRenderer;
  /** Stable key for UI state; for scalars this is the SENSOR_VARIABLES key. */
  variableKey: string;
  unit: string;
  /** Primary Latest column this binding visualizes (multi-measure services). */
  valueField?: string;
  /** Human label for the monitoring tree when one service expands to many rows. */
  label?: string;
}

const BINDINGS_BY_PATH = new Map<string, RendererBinding[]>();

function addBinding(servicePath: string, binding: RendererBinding): void {
  const existing = BINDINGS_BY_PATH.get(servicePath) ?? [];
  existing.push(binding);
  BINDINGS_BY_PATH.set(servicePath, existing);
}

// Wind combines three fields into a vector field, so it gets its own renderer.
addBinding(WIND_SERVICE_PATH, {
  renderer: 'wind-vector-field',
  variableKey: 'wind',
  unit: 'm/s',
  label: 'Wind',
});
addBinding(CAMERA_SERVICE_PATH, {
  renderer: 'camera-feed',
  variableKey: 'cameras',
  unit: '',
  label: 'Cameras',
});

for (const config of Object.values(SENSOR_VARIABLES)) {
  addBinding(config.servicePath, {
    renderer: 'scalar-surface',
    variableKey: config.id,
    unit: config.unit,
    valueField: config.valueFields[0],
    label: config.label,
  });
}

/** Every renderer binding registered for a FeatureServer path (0–N measures). */
export function resolveRendererBindings(servicePath: string): RendererBinding[] {
  return BINDINGS_BY_PATH.get(servicePath) ?? [];
}

/**
 * Resolve a single binding for a service path.
 * When `valueField` is set, only return the measure that owns that Latest column
 * (no silent fallback to a sibling stream).
 */
export function resolveRendererBinding(
  servicePath: string,
  valueField?: string | null,
): RendererBinding | null {
  const bindings = resolveRendererBindings(servicePath);
  if (bindings.length === 0) return null;

  const preferred = valueField?.trim();
  if (preferred) {
    return bindings.find((binding) => {
      if (binding.valueField === preferred) return true;
      const config = SENSOR_VARIABLES[binding.variableKey as SensorVariableId];
      return config?.valueFields.includes(preferred) ?? false;
    }) ?? null;
  }

  return bindings[0] ?? null;
}

/** Every service path this app can currently draw, for tagging-gap diagnostics. */
export function listBoundServicePaths(): string[] {
  return [...BINDINGS_BY_PATH.keys()];
}

/** Icons for the section headings `live_tag` can produce. */
const SECTION_ICONS: Record<string, LucideIcon> = {
  'weather conditions': Thermometer,
  'weather stations': Thermometer,
  'soil monitoring': Droplets,
  'soil conditions': Droplets,
  'wildlife detection': Camera,
  cameras: Camera,
  'hydrological conditions': Waves,
  hydrology: Gauge,
};

export function sectionIcon(liveTag: string): LucideIcon {
  return SECTION_ICONS[liveTag.trim().toLowerCase()] ?? Activity;
}
