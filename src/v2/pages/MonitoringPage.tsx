// ============================================================================
// MonitoringPage — Live Monitoring scaffold.
// Establishes the sensor tree / map / statistics 3-pane frame. Wind layers,
// live readings, and Velocity alerts arrive in a later phase.
// ============================================================================

import { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ChevronRight,
  Droplets,
  Gauge,
  Map as MapIcon,
  Radio,
  Signal,
  Thermometer,
  Wind,
} from 'lucide-react';
import { SENSOR_CATEGORIES } from '../config/sensorCategories';
import type { SensorCategory, SensorStatus } from '../config/sensorCategories';
import { ScaffoldNotice } from '../components/shared/ScaffoldNotice';

const STATUS_LABEL: Record<SensorStatus, string> = {
  live: 'Live',
  delayed: 'Delayed',
  planned: 'Planned',
};

const SUMMARY_TILES = [
  { id: 'temperature', label: 'Temperature', icon: Thermometer },
  { id: 'wind-speed', label: 'Wind Speed', icon: Wind },
  { id: 'humidity', label: 'Humidity', icon: Droplets },
  { id: 'soil-moisture', label: 'Soil Moisture', icon: Gauge },
];

function SensorCategoryGroup({ category }: { category: SensorCategory }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const CategoryIcon = category.icon;

  return (
    <div id={`monitoring-category-${category.id}`} className="border-b border-gray-100">
      <button
        type="button"
        onClick={() => setIsExpanded((current) => !current)}
        aria-expanded={isExpanded}
        className="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-gray-50"
      >
        <ChevronRight
          className={`h-3.5 w-3.5 flex-shrink-0 text-gray-400 transition-transform ${
            isExpanded ? 'rotate-90' : ''
          }`}
        />
        <CategoryIcon className="h-3.5 w-3.5 flex-shrink-0 text-gray-500" />
        <span className="flex-1 truncate text-xs font-semibold text-gray-800">
          {category.name}
        </span>
        <span className="text-[10px] font-medium text-gray-400">
          {category.sensors.length}
        </span>
      </button>

      {isExpanded && (
        <ul className="pb-1">
          {category.sensors.map((sensor) => (
            <li key={sensor.id}>
              <button
                type="button"
                disabled
                title="Sensor streams are not wired up yet"
                className="flex w-full cursor-not-allowed items-center gap-2 py-1.5 pl-9 pr-3 text-left opacity-60"
              >
                {sensor.status === 'live' ? (
                  <Signal className="h-3 w-3 flex-shrink-0 text-emerald-600" />
                ) : (
                  <Radio className="h-3 w-3 flex-shrink-0 text-gray-400" />
                )}
                <span className="flex-1 truncate text-xs text-gray-700">{sensor.name}</span>
                <span className="text-[10px] text-gray-400">{sensor.unit}</span>
                <span
                  className={`rounded px-1 py-px text-[9px] font-semibold uppercase tracking-wide ${
                    sensor.status === 'live'
                      ? 'bg-emerald-50 text-emerald-700'
                      : sensor.status === 'delayed'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {STATUS_LABEL[sensor.status]}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function MonitoringPage() {
  return (
    <div id="monitoring-page" className="flex h-full w-full overflow-hidden bg-gray-50">
      <aside
        id="monitoring-sidebar"
        aria-label="Sensor streams"
        className="flex w-[280px] flex-shrink-0 flex-col border-r border-gray-200 bg-white"
      >
        <div className="flex-shrink-0 border-b border-gray-200 px-3 py-3">
          <h2 className="text-sm font-semibold text-gray-900">Live Monitoring</h2>
          <p className="mt-0.5 text-[11px] text-gray-500">
            Continuously updating preserve conditions
          </p>
        </div>

        <div id="monitoring-sensor-tree" className="flex-1 overflow-y-auto">
          {SENSOR_CATEGORIES.map((category) => (
            <SensorCategoryGroup key={category.id} category={category} />
          ))}
        </div>
      </aside>

      <div
        id="monitoring-map-area"
        className="relative flex min-w-0 flex-1 items-center justify-center bg-gray-100"
      >
        <div className="flex flex-col items-center gap-2 text-gray-400">
          <MapIcon className="h-8 w-8" />
          <p className="text-xs font-medium">Map view</p>
        </div>
      </div>

      <aside
        id="monitoring-detail-panel"
        aria-label="Current conditions"
        className="flex w-[400px] flex-shrink-0 flex-col gap-4 overflow-y-auto border-l border-gray-200 bg-white p-4"
      >
        <ScaffoldNotice id="monitoring-scaffold-notice" title="Live data not connected yet">
          This page currently shows layout only. Wind, soil, and camera streams plus
          ArcGIS Velocity alerts land in a follow-up phase.
        </ScaffoldNotice>

        <section>
          <div className="flex items-center gap-2">
            <Activity className="h-3.5 w-3.5 text-gray-500" />
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-600">
              Current Conditions
            </h3>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            {SUMMARY_TILES.map((tile) => {
              const TileIcon = tile.icon;
              return (
                <div
                  key={tile.id}
                  className="flex flex-col items-center gap-1 rounded-card border border-gray-200 bg-gray-50 px-3 py-4"
                >
                  <TileIcon className="h-4 w-4 text-gray-400" />
                  <span className="text-lg font-semibold text-gray-400">--</span>
                  <span className="text-[10px] font-medium text-gray-500">{tile.label}</span>
                </div>
              );
            })}
          </div>
        </section>

        <section>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-3.5 w-3.5 text-gray-500" />
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-600">
              Alerts
            </h3>
          </div>
          <p className="mt-2 rounded-card border border-dashed border-gray-200 px-3 py-4 text-xs leading-relaxed text-gray-500">
            Stream layer alerts will surface here: species detections, instrument
            anomalies, and threshold exceedances.
          </p>
        </section>
      </aside>
    </div>
  );
}
