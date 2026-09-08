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
// ============================================================================

import { Activity, Camera, Droplets, Gauge, Thermometer, Waves } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { CAMERA_SERVICE_PATH } from '../services/cameraService';
import { SENSOR_VARIABLES } from '../services/sensorService';
import { WIND_SERVICE_PATH } from '../services/windService';

/** Each value corresponds to a renderer implemented under components/Monitoring. */
export type MonitoringRenderer = 'wind-vector-field' | 'scalar-surface' | 'camera-feed';

export interface RendererBinding {
  renderer: MonitoringRenderer;
  /** Stable key for UI state; for scalars this is the SENSOR_VARIABLES key. */
  variableKey: string;
  unit: string;
}

// Wind combines three fields into a vector field, so it gets its own renderer.
// Everything else is a single interpolated value and shares the scalar surface.
const BINDINGS = new Map<string, RendererBinding>([
  [WIND_SERVICE_PATH, { renderer: 'wind-vector-field', variableKey: 'wind', unit: 'm/s' }],
  [CAMERA_SERVICE_PATH, { renderer: 'camera-feed', variableKey: 'cameras', unit: '' }],
]);

for (const config of Object.values(SENSOR_VARIABLES)) {
  BINDINGS.set(config.servicePath, {
    renderer: 'scalar-surface',
    variableKey: config.id,
    unit: config.unit,
  });
}

export function resolveRendererBinding(servicePath: string): RendererBinding | null {
  return BINDINGS.get(servicePath) ?? null;
}

/** Every service path this app can currently draw, for tagging-gap diagnostics. */
export function listBoundServicePaths(): string[] {
  return [...BINDINGS.keys()];
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
