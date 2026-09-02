// ============================================================================
// Sensor catalog for the Live Monitoring page.
// Ported from the twin_models webapp mockup (MonitoringPage SENSOR_CATEGORIES).
// ============================================================================

import { Camera, Droplets, Gauge, Thermometer } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/**
 * `live` streams update continuously, `delayed` lag behind real time, and
 * `planned` are not yet instrumented.
 */
export type SensorStatus = 'live' | 'delayed' | 'planned';

export interface SensorDefinition {
  id: string;
  name: string;
  unit: string;
  status: SensorStatus;
  /**
   * Whether this stream is actually wired to a live service. `status` describes
   * the sensor in the field; this describes what the app can currently draw.
   */
  isConnected?: boolean;
}

export interface SensorCategory {
  id: string;
  name: string;
  icon: LucideIcon;
  sensors: SensorDefinition[];
}

export const SENSOR_CATEGORIES: SensorCategory[] = [
  {
    id: 'weather',
    name: 'Weather Stations',
    icon: Thermometer,
    sensors: [
      // Units match what the services actually store, so nothing is converted.
      { id: 'temp', name: 'Air Temperature', unit: '°C', status: 'live', isConnected: true },
      { id: 'humidity', name: 'Relative Humidity', unit: '%', status: 'live', isConnected: true },
      { id: 'wind', name: 'Wind Speed & Direction', unit: 'm/s', status: 'live', isConnected: true },
      { id: 'precip', name: 'Precipitation', unit: 'mm', status: 'live', isConnected: true },
      { id: 'pressure', name: 'Barometric Pressure', unit: 'hPa', status: 'live', isConnected: true },
    ],
  },
  {
    id: 'soil',
    name: 'Soil Monitoring',
    icon: Droplets,
    sensors: [
      { id: 'soil-moisture', name: 'Soil Moisture', unit: '%VWC', status: 'live' },
      { id: 'soil-temp', name: 'Soil Temperature', unit: '°F', status: 'live' },
      { id: 'heat-stress', name: 'Heat Stress Index', unit: 'index', status: 'delayed' },
    ],
  },
  {
    id: 'wildlife',
    name: 'Wildlife Detection',
    icon: Camera,
    sensors: [
      { id: 'camera-traps', name: 'Camera Traps', unit: 'detections', status: 'live' },
      { id: 'acoustic', name: 'Acoustic Monitors', unit: 'species', status: 'planned' },
    ],
  },
  {
    id: 'water',
    name: 'Hydrology',
    icon: Gauge,
    sensors: [
      { id: 'stream-flow', name: 'Stream Flow', unit: 'cfs', status: 'planned' },
      { id: 'water-level', name: 'Water Level', unit: 'ft', status: 'planned' },
      { id: 'water-quality', name: 'Water Quality', unit: 'NTU', status: 'planned' },
    ],
  },
];
