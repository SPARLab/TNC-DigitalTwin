// ============================================================================
// MonitoringPage — sensor tree / map / statistics.
//
// Wind is the first live stream: toggling it queries the wind datastreams
// service and renders arrows, animated flow, or an interpolated grid. The
// remaining sensors stay disabled until their services are wired up.
// ============================================================================

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type MapView from '@arcgis/core/views/MapView';
import Extent from '@arcgis/core/geometry/Extent';
import {
  Activity,
  AlertTriangle,
  ChevronRight,
  Droplets,
  Gauge,
  History as HistoryIcon,
  Loader2,
  Radio,
  Signal,
  Thermometer,
  Wind,
} from 'lucide-react';
import { SENSOR_CATEGORIES } from '../config/sensorCategories';
import type { SensorCategory, SensorDefinition, SensorStatus } from '../config/sensorCategories';
import { MonitoringMap } from '../components/Monitoring/MonitoringMap';
import { WindDetailPanel } from '../components/Monitoring/WindDetailPanel';
import { ScalarDetailPanel } from '../components/Monitoring/ScalarDetailPanel';
import { useWindVisualization } from '../components/Monitoring/internal/useWindVisualization';
import type { WindVizMode } from '../components/Monitoring/internal/useWindVisualization';
import { useScalarVisualization } from '../components/Monitoring/internal/useScalarVisualization';
import type { ScalarVizMode } from '../components/Monitoring/internal/useScalarVisualization';
import { getWindStatistics } from '../components/Monitoring/internal/windStatistics';
import { getStationsExtent } from '../components/Monitoring/internal/windField';
import { useWindData } from '../hooks/useWindData';
import { useSensorData } from '../hooks/useSensorData';
import { usePreserveBoundary } from '../hooks/usePreserveBoundary';
import { createPreserveOutlineLayer } from '../components/Monitoring/internal/boundaryOutlineLayer';
import { SENSOR_VARIABLES } from '../services/sensorService';
import type { SensorVariableId } from '../services/sensorService';

const WIND_SENSOR_ID = 'wind';

/**
 * Scalar variables render as full-extent surfaces, so showing two at once would
 * just stack translucent rectangles. Selecting one replaces the other, while
 * wind stays independent — wind arrows over a temperature surface is useful.
 */
const SCALAR_SENSOR_IDS = new Set<string>(Object.keys(SENSOR_VARIABLES));

function isScalarSensor(sensorId: string): sensorId is SensorVariableId {
  return SCALAR_SENSOR_IDS.has(sensorId);
}

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

interface SensorErrorProps {
  label: string;
  message: string | null;
  onRetry: () => void;
}

function SensorError({ label, message, onRetry }: SensorErrorProps) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-card border border-red-200 bg-red-50 px-3 py-2"
    >
      <AlertTriangle className="mt-px h-3.5 w-3.5 flex-shrink-0 text-red-600" />
      <div className="min-w-0">
        <p className="text-xs font-medium text-red-800">Could not load {label} data</p>
        <p className="mt-0.5 text-[11px] leading-relaxed text-red-700">{message}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-1.5 text-[11px] font-semibold text-red-800 underline hover:no-underline"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

interface SensorRowProps {
  sensor: SensorDefinition;
  isActive: boolean;
  isLoading: boolean;
  onToggle: (sensorId: string) => void;
}

function SensorRow({ sensor, isActive, isLoading, onToggle }: SensorRowProps) {
  const isConnected = sensor.isConnected === true;

  return (
    <button
      type="button"
      disabled={!isConnected}
      aria-pressed={isConnected ? isActive : undefined}
      onClick={() => onToggle(sensor.id)}
      title={isConnected ? `Toggle ${sensor.name} on the map` : 'This stream is not wired up yet'}
      className={`flex w-full items-center gap-2 py-1.5 pl-9 pr-3 text-left transition-colors ${
        isConnected
          ? isActive
            ? 'bg-emerald-50 hover:bg-emerald-100'
            : 'hover:bg-gray-50'
          : 'cursor-not-allowed opacity-60'
      }`}
    >
      {isLoading ? (
        <Loader2 className="h-3 w-3 flex-shrink-0 animate-spin text-emerald-600" />
      ) : sensor.status === 'live' ? (
        <Signal
          className={`h-3 w-3 flex-shrink-0 ${isActive ? 'text-emerald-700' : 'text-emerald-600'}`}
        />
      ) : (
        <Radio className="h-3 w-3 flex-shrink-0 text-gray-400" />
      )}

      <span
        className={`flex-1 truncate text-xs ${
          isActive ? 'font-semibold text-emerald-900' : 'text-gray-700'
        }`}
      >
        {sensor.name}
      </span>
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
  );
}

interface SensorCategoryGroupProps {
  category: SensorCategory;
  activeSensorIds: Set<string>;
  loadingSensorIds: Set<string>;
  onToggle: (sensorId: string) => void;
}

function SensorCategoryGroup({
  category,
  activeSensorIds,
  loadingSensorIds,
  onToggle,
}: SensorCategoryGroupProps) {
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
              <SensorRow
                sensor={sensor}
                isActive={activeSensorIds.has(sensor.id)}
                isLoading={loadingSensorIds.has(sensor.id)}
                onToggle={onToggle}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function MonitoringPage() {
  const [isWindActive, setIsWindActive] = useState(false);
  const [activeScalarId, setActiveScalarId] = useState<SensorVariableId | null>(null);
  const [vizMode, setVizMode] = useState<WindVizMode>('arrows');
  const [scalarMode, setScalarMode] = useState<ScalarVizMode>('surface');
  const [view, setView] = useState<MapView | null>(null);

  const { snapshot, isLoading, error, fetchedAt, refresh } = useWindData(isWindActive);
  const scalar = useSensorData(activeScalarId);

  const scalarConfig = activeScalarId ? SENSOR_VARIABLES[activeScalarId] : null;

  useWindVisualization({
    view,
    readings: snapshot?.readings ?? null,
    mode: vizMode,
    isEnabled: isWindActive,
  });

  const boundary = usePreserveBoundary();

  const scalarClip = useMemo(
    () => (boundary ? { rings: boundary.clipRings, extent: boundary.clipExtent } : null),
    [boundary],
  );

  useScalarVisualization({
    view,
    snapshot: scalar.snapshot,
    config: scalarConfig,
    mode: scalarMode,
    clip: scalarClip,
  });

  // The outline stays on the map for the whole session, above the surfaces so it
  // reads as an edge rather than being covered by them.
  useEffect(() => {
    if (!view || view.destroyed) return;

    const layer = createPreserveOutlineLayer();
    view.map?.add(layer);

    return () => {
      if (!view.destroyed) view.map?.remove(layer);
    };
  }, [view]);

  const statistics = useMemo(
    () => (snapshot ? getWindStatistics(snapshot.readings) : null),
    [snapshot],
  );

  const activeSensorIds = useMemo(() => {
    const ids = new Set<string>();
    if (isWindActive) ids.add(WIND_SENSOR_ID);
    if (activeScalarId) ids.add(activeScalarId);
    return ids;
  }, [isWindActive, activeScalarId]);

  const handleViewReady = useCallback((readyView: MapView) => {
    setView(readyView);
  }, []);

  const handleViewDestroy = useCallback(() => {
    setView(null);
  }, []);

  const handleToggle = useCallback((sensorId: string) => {
    if (sensorId === WIND_SENSOR_ID) {
      setIsWindActive((current) => !current);
      return;
    }

    if (isScalarSensor(sensorId)) {
      setActiveScalarId((current) => (current === sensorId ? null : sensorId));
    }
  }, []);

  // Either source can supply the station footprint; wind wins when both are on.
  const stationPoints = snapshot?.readings ?? scalar.snapshot?.readings ?? null;

  const frameStations = useCallback(() => {
    if (!view || view.destroyed || !stationPoints?.length) return;
    const extent = getStationsExtent(stationPoints);
    void view
      .goTo(
        new Extent({
          xmin: extent.xmin,
          ymin: extent.ymin,
          xmax: extent.xmax,
          ymax: extent.ymax,
          spatialReference: { wkid: 4326 },
        }),
        { duration: 800 },
      )
      .catch((caught: unknown) => {
        // Interrupting the animation rejects with an abort, which is expected.
        const name = caught instanceof Error ? caught.name : '';
        if (name !== 'AbortError') {
          console.warn('[MonitoringPage] Could not frame stations:', caught);
        }
      });
  }, [view, stationPoints]);

  /**
   * Frame the stations the first time any data arrives. Without this the default
   * extent leaves the network as a small band of mostly ocean, which makes the
   * flow particles too sparse to read and wastes most of the surface.
   */
  const hasFramedRef = useRef(false);
  const hasAnySensorActive = isWindActive || activeScalarId !== null;

  useEffect(() => {
    if (!hasAnySensorActive) {
      hasFramedRef.current = false;
      return;
    }
    if (hasFramedRef.current || !view || !stationPoints?.length) return;
    hasFramedRef.current = true;
    frameStations();
  }, [hasAnySensorActive, view, stationPoints, frameStations]);

  const loadingSensorIds = useMemo(() => {
    const ids = new Set<string>();
    if (isLoading) ids.add(WIND_SENSOR_ID);
    if (scalar.isLoading && activeScalarId) ids.add(activeScalarId);
    return ids;
  }, [isLoading, scalar.isLoading, activeScalarId]);

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
            <SensorCategoryGroup
              key={category.id}
              category={category}
              activeSensorIds={activeSensorIds}
              loadingSensorIds={loadingSensorIds}
              onToggle={handleToggle}
            />
          ))}
        </div>

        <div className="flex flex-shrink-0 items-center gap-2 border-t border-gray-200 px-3 py-2">
          <Signal className="h-3 w-3 text-emerald-600" />
          <span className="text-[10px] text-gray-500">
            Wind refreshes every 5 minutes
          </span>
        </div>
      </aside>

      <MonitoringMap onViewReady={handleViewReady} onViewDestroy={handleViewDestroy} />

      <aside
        id="monitoring-detail-panel"
        aria-label="Current conditions"
        className="flex w-[400px] flex-shrink-0 flex-col gap-4 overflow-y-auto border-l border-gray-200 bg-white p-4"
      >
        <SensorError label="wind" message={error} onRetry={refresh} />
        <SensorError
          label={scalarConfig?.label.toLowerCase() ?? 'sensor'}
          message={scalar.error}
          onRetry={scalar.refresh}
        />

        {scalarConfig && scalar.snapshot && (
          <ScalarDetailPanel
            config={scalarConfig}
            snapshot={scalar.snapshot}
            mode={scalarMode}
            onModeChange={setScalarMode}
            isLoading={scalar.isLoading}
            onRefresh={scalar.refresh}
          />
        )}

        {isWindActive && snapshot && statistics && (
          <WindDetailPanel
            snapshot={snapshot}
            statistics={statistics}
            mode={vizMode}
            onModeChange={setVizMode}
            isLoading={isLoading}
            fetchedAt={fetchedAt}
            onRefresh={refresh}
          />
        )}

        {stationPoints?.length ? (
          <button
            type="button"
            onClick={frameStations}
            className="rounded-card border border-gray-200 bg-white px-3 py-2 text-[11px] font-medium text-gray-600 transition-colors hover:bg-gray-50"
          >
            Zoom to reporting stations
          </button>
        ) : (
          <section>
            <div className="flex items-center gap-2">
              <Activity className="h-3.5 w-3.5 text-gray-500" />
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                Current Conditions
              </h3>
            </div>

            <p className="mt-2 text-[11px] leading-relaxed text-gray-500">
              {hasAnySensorActive
                ? 'Loading the latest readings…'
                : 'Turn on a weather sensor in the list to see live readings on the map.'}
            </p>

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
        )}

        <button
          type="button"
          disabled
          title="Not wired up yet"
          className="flex items-center justify-center gap-2 rounded-card border border-gray-200 bg-white px-3 py-2 text-[11px] font-medium text-gray-400 cursor-not-allowed"
        >
          <HistoryIcon className="h-3.5 w-3.5" />
          View Historical Data
        </button>
      </aside>
    </div>
  );
}
