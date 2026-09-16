// ============================================================================
// MonitoringPage — sensor tree / map / statistics.
//
// The tree is built from the Data Catalog's `live_tag` column, so which sensors
// appear here, their section and their order are all tagging decisions rather
// than code. Each tagged dataset is matched to a renderer by service path;
// tagged datasets with no renderer yet appear disabled.
// ============================================================================

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type MapView from '@arcgis/core/views/MapView';
import type SceneView from '@arcgis/core/views/SceneView';
import Extent from '@arcgis/core/geometry/Extent';
import Point from '@arcgis/core/geometry/Point';
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
  Waves,
  Wind,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { MonitoringMap } from '../components/Monitoring/MonitoringMap';
import { MonitoringScene, SCENE_CAMERA_TILT } from '../components/Monitoring/MonitoringScene';
import { ViewModeToggle } from '../components/Monitoring/ViewModeToggle';
import { WindDetailPanel } from '../components/Monitoring/WindDetailPanel';
import { ScalarDetailPanel } from '../components/Monitoring/ScalarDetailPanel';
import { CameraDetailPanel } from '../components/Monitoring/CameraDetailPanel';
import {
  useWindVisualization,
  WIND_MODES_2D_ONLY,
} from '../components/Monitoring/internal/useWindVisualization';
import type { WindVizMode } from '../components/Monitoring/internal/useWindVisualization';
import { useScalarVisualization } from '../components/Monitoring/internal/useScalarVisualization';
import type { ScalarVizMode } from '../components/Monitoring/internal/useScalarVisualization';
import { useWellColumnVisualization } from '../components/Monitoring/internal/useWellColumnVisualization';
import { useCameraVisualization } from '../components/Monitoring/internal/useCameraVisualization';
import { getWindStatistics } from '../components/Monitoring/internal/windStatistics';
import { getStationsExtent } from '../components/Monitoring/internal/windField';
import {
  buildStationAlertLookup,
  formatStationAlertPopupHtml,
  lookupStationAlert,
} from '../components/Monitoring/internal/alertMarkerLayer';
import { formatScalarStationPopupContent } from '../components/Monitoring/internal/scalarGraphicsLayers';
import { formatWindStationPopupContent } from '../components/Monitoring/internal/windGraphicsLayers';
import { useWindData, WIND_REFRESH_INTERVAL_MS } from '../hooks/useWindData';
import { useSensorData, SENSOR_REFRESH_INTERVAL_MS } from '../hooks/useSensorData';
import { useCameraData, CAMERA_REFRESH_INTERVAL_MS } from '../hooks/useCameraData';
import { useConditionsSummary, type SummaryMetricId } from '../hooks/useConditionsSummary';
import { useLiveAlerts } from '../hooks/useLiveAlerts';
import { usePreserveBoundary } from '../hooks/usePreserveBoundary';
import { useMonitoringSections } from '../hooks/useMonitoringSections';
import type { MonitoringSection, MonitoringSensor } from '../hooks/useMonitoringSections';
import { ResizablePanel } from '../components/shared/ResizablePanel';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { createPreserveOutlineLayer } from '../components/Monitoring/internal/boundaryOutlineLayer';
import { formatObservedAt } from '../components/Monitoring/internal/formatObservedAt';
import { AlertsPanel } from '../components/Monitoring/AlertsPanel';
import { allowsInterpolation, SENSOR_VARIABLES } from '../services/sensorService';
import type { SensorVariableId } from '../services/sensorService';
import { buildLatestLayerUrl, type LiveAlert } from '../services/liveAlertService';
import { WIND_SERVICE_PATH } from '../services/windService';

const WIND_SENSOR_ID = 'wind';
const CAMERA_SENSOR_ID = 'cameras';

/**
 * Scalar variables render as full-extent surfaces, so showing two at once would
 * just stack translucent rectangles. Selecting one replaces the other, while
 * wind stays independent — wind arrows over a temperature surface is useful.
 */
const SCALAR_SENSOR_IDS = new Set<string>(Object.keys(SENSOR_VARIABLES));

function isScalarSensor(sensorId: string): sensorId is SensorVariableId {
  return SCALAR_SENSOR_IDS.has(sensorId);
}

/**
 * Each tile is a maximum across the reporting stations, which the panel states
 * once above them rather than every label carrying a "Max" prefix. The air and
 * creek temperatures are both named, since "Temperature" alone would be
 * ambiguous once there are two of them.
 */
const SUMMARY_TILES: { id: SummaryMetricId; label: string; icon: LucideIcon }[] = [
  { id: 'temp', label: 'Air Temp', icon: Thermometer },
  { id: 'wind', label: 'Wind Speed', icon: Wind },
  { id: 'humidity', label: 'Humidity', icon: Droplets },
  { id: 'pressure', label: 'Pressure', icon: Gauge },
  { id: 'gaugeHeight', label: 'Creek Height', icon: Waves },
  { id: 'waterTemp', label: 'Creek Temp', icon: Thermometer },
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
  sensor: MonitoringSensor;
  isActive: boolean;
  isLoading: boolean;
  onToggle: (sensor: MonitoringSensor) => void;
}

function SensorRow({ sensor, isActive, isLoading, onToggle }: SensorRowProps) {
  // A tagged dataset with no renderer is listed but cannot be drawn yet.
  const isConnected = sensor.renderer !== null;

  return (
    <button
      type="button"
      disabled={!isConnected}
      aria-pressed={isConnected ? isActive : undefined}
      onClick={() => onToggle(sensor)}
      title={
        isConnected
          ? `Toggle ${sensor.name} on the map`
          : `${sensor.name} is tagged for this page but has no visualization yet`
      }
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
      ) : isConnected ? (
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
          isConnected ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
        }`}
      >
        {isConnected ? 'Live' : 'Soon'}
      </span>
    </button>
  );
}

interface SensorSectionGroupProps {
  section: MonitoringSection;
  activeSensorIds: Set<string>;
  loadingSensorIds: Set<string>;
  onToggle: (sensor: MonitoringSensor) => void;
}

function SensorSectionGroup({
  section,
  activeSensorIds,
  loadingSensorIds,
  onToggle,
}: SensorSectionGroupProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const SectionIcon = section.icon;

  return (
    <div id={`monitoring-category-${section.id}`} className="border-b border-gray-100">
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
        <SectionIcon className="h-3.5 w-3.5 flex-shrink-0 text-gray-500" />
        <span className="flex-1 truncate text-xs font-semibold text-gray-800">
          {section.name}
        </span>
        <span className="text-[10px] font-medium text-gray-400">
          {section.sensors.length}
        </span>
      </button>

      {isExpanded && (
        <ul className="pb-1">
          {section.sensors.map((sensor) => (
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
  /*
   * The tree is single-select: exactly one layer draws at a time. Holding one
   * selection rather than a flag per renderer is what enforces that, since two
   * layers being on at once is then not a state the page can represent. Keeping
   * them independent is what previously let wind stay on underneath whatever was
   * toggled next, stacking its arrows and panel on top of the new layer's.
   */
  const [activeSensor, setActiveSensor] = useState<{
    id: string;
    renderer: MonitoringSensor['renderer'];
  } | null>(null);
  const [selectedCameraId, setSelectedCameraId] = useState<number | null>(null);
  const [vizMode, setVizMode] = useState<WindVizMode>('arrows');
  const [scalarMode, setScalarMode] = useState<ScalarVizMode>('surface');
  const [view, setView] = useState<MapView | SceneView | null>(null);
  const [viewMode, setViewMode] = useLocalStorage<'2d' | '3d'>(
    'v2-monitoring-view-mode',
    '2d',
  );

  const isWindActive = activeSensor?.renderer === 'wind-vector-field';
  const isCamerasActive = activeSensor?.renderer === 'camera-feed';
  const activeScalarId = useMemo<SensorVariableId | null>(() => {
    if (activeSensor?.renderer !== 'scalar-surface') return null;
    return isScalarSensor(activeSensor.id) ? activeSensor.id : null;
  }, [activeSensor]);

  const { snapshot, isLoading, error, fetchedAt, refresh } = useWindData(isWindActive);
  const scalar = useSensorData(activeScalarId);
  const cameras = useCameraData(isCamerasActive);
  const {
    sections,
    isLoading: isSectionsLoading,
    error: sectionsError,
  } = useMonitoringSections();

  const scalarConfig = activeScalarId ? SENSOR_VARIABLES[activeScalarId] : null;
  const is3D = viewMode === '3d';

  /**
   * Alerts publish the Latest FeatureServer URL they evaluated. Matching that URL
   * (or the service path inside it) is what keeps Wind alerts off the Air Temp
   * panel and still lets a multi-stream fire-weather alert appear under either
   * of its sources.
   */
  const activeAlertSource = useMemo(() => {
    if (isWindActive) {
      return {
        url: buildLatestLayerUrl(WIND_SERVICE_PATH, 0),
        servicePath: WIND_SERVICE_PATH,
      };
    }
    if (scalarConfig) {
      return {
        url: buildLatestLayerUrl(scalarConfig.servicePath, scalarConfig.layerId ?? 0),
        servicePath: scalarConfig.servicePath,
      };
    }
    return null;
  }, [isWindActive, scalarConfig]);

  const liveAlerts = useLiveAlerts(activeAlertSource);
  const alertsLayerLabel = isWindActive
    ? 'Wind'
    : scalarConfig?.label ?? null;

  // Well columns need a perspective camera, so they only ever see the scene view.
  const sceneView = view?.type === '3d' ? (view as SceneView) : null;

  /**
   * Variables that offer no interpolated surface have labels as their only mode,
   * so a mode carried over from the previous variable has to give way.
   */
  useEffect(() => {
    if (scalarConfig && !allowsInterpolation(scalarConfig) && scalarMode !== 'labels') {
      setScalarMode('labels');
    }
  }, [scalarConfig, scalarMode]);

  /**
   * Flow has no 3D equivalent, so entering 3D on that mode would show nothing at
   * all. Arrows carry the same reading, minus the animation.
   */
  useEffect(() => {
    if (is3D && WIND_MODES_2D_ONLY.includes(vizMode)) setVizMode('arrows');
  }, [is3D, vizMode]);

  useWindVisualization({
    view,
    readings: snapshot?.readings ?? null,
    mode: vizMode,
    isEnabled: isWindActive,
    alerts: liveAlerts.alerts,
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
    alerts: liveAlerts.alerts,
  });

  useWellColumnVisualization({
    view: sceneView,
    snapshot: scalar.snapshot,
    config: scalarConfig,
  });

  useCameraVisualization({
    view,
    cameras: cameras.snapshot?.cameras ?? null,
    viewsheds: cameras.snapshot?.viewsheds ?? null,
    selectedObjectId: selectedCameraId,
    onSelect: setSelectedCameraId,
    isEnabled: isCamerasActive,
    imageCacheKey: cameras.fetchedAt ?? 0,
  });

  useEffect(() => {
    if (!isCamerasActive) setSelectedCameraId(null);
  }, [isCamerasActive]);

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

  // Still a set, rather than the one id it now ever holds, so that the tree keeps
  // an interface that survives multi-select coming back.
  const activeSensorIds = useMemo(
    () => new Set<string>(activeSensor ? [activeSensor.id] : []),
    [activeSensor],
  );

  const handleViewReady = useCallback((readyView: MapView | SceneView) => {
    setView(readyView);
    if (import.meta.env.DEV) {
      (window as unknown as { __monitoringView?: MapView | SceneView }).__monitoringView =
        readyView;
    }
  }, []);

  const handleViewDestroy = useCallback(() => {
    setView(null);
    if (import.meta.env.DEV) {
      delete (window as unknown as { __monitoringView?: MapView | SceneView }).__monitoringView;
    }
  }, []);

  const handleToggle = useCallback((sensor: MonitoringSensor) => {
    // A binding whose variable key has drifted away from SENSOR_VARIABLES cannot
    // load, so refuse the selection rather than lighting up a row that will never
    // draw anything and clearing the layer that was working.
    if (sensor.renderer === 'scalar-surface' && !isScalarSensor(sensor.id)) return;

    setActiveSensor((current) =>
      current?.id === sensor.id ? null : { id: sensor.id, renderer: sensor.renderer },
    );
  }, []);

  // Weather stations win for framing when they are on; cameras are a tight pair
  // at one site and would otherwise zoom the map into a postage stamp.
  const stationPoints =
    snapshot?.readings ?? scalar.snapshot?.readings ?? cameras.snapshot?.cameras ?? null;

  // Headline numbers stay warm in the background so turning every layer off does
  // not wait on a refetch — the panel just remounts over data that is already here.
  const summary = useConditionsSummary();

  const frameStations = useCallback(() => {
    if (!view || view.destroyed || !stationPoints?.length) return;
    const extent = getStationsExtent(stationPoints);
    const target = new Extent({
      xmin: extent.xmin,
      ymin: extent.ymin,
      xmax: extent.xmax,
      ymax: extent.ymax,
      spatialReference: { wkid: 4326 },
    });

    void view
      .goTo(
        // Handing a SceneView a bare extent flattens the camera to straight down,
        // which is the one angle from which vertical columns are invisible.
        view.type === '3d' ? { target, tilt: SCENE_CAMERA_TILT } : target,
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

  /** Zoom to an alerted station and open the same reading popup the map uses. */
  const focusAlertStation = useCallback(
    (alert: LiveAlert) => {
      if (!view || view.destroyed) return;

      const normalizeName = (name: string) =>
        name.trim().replace(/^Dangermond[_ ]/i, '').toLowerCase();
      const matchesStation = (row: { stationId: number; stationName: string }) =>
        alert.stationId != null
          ? row.stationId === alert.stationId
          : normalizeName(row.stationName) === normalizeName(alert.stationName);

      const alertLookup = buildStationAlertLookup(liveAlerts.alerts);
      const conditionLabel = alertsLayerLabel ?? 'this condition';
      let title = alert.stationName;
      let content = '';
      let longitude = alert.longitude;
      let latitude = alert.latitude;

      if (isWindActive && snapshot?.readings) {
        const reading = snapshot.readings.find(matchesStation) ?? null;
        if (reading) {
          longitude = reading.longitude;
          latitude = reading.latitude;
          title = reading.stationName;
          content = formatWindStationPopupContent(
            reading,
            lookupStationAlert(alertLookup, reading),
          );
        }
      } else if (scalarConfig && scalar.snapshot?.readings) {
        const reading = scalar.snapshot.readings.find(matchesStation) ?? null;
        if (reading) {
          longitude = reading.longitude;
          latitude = reading.latitude;
          title = reading.stationName;
          content = formatScalarStationPopupContent(
            reading,
            scalarConfig,
            lookupStationAlert(alertLookup, reading),
          );
        }
      }

      if (
        longitude == null ||
        latitude == null ||
        !Number.isFinite(longitude) ||
        !Number.isFinite(latitude)
      ) {
        return;
      }

      if (!content) {
        const cluster =
          lookupStationAlert(alertLookup, {
            stationId: alert.stationId ?? -1,
            stationName: alert.stationName,
          }) ?? {
            stationId: alert.stationId,
            stationName: alert.stationName,
            longitude,
            latitude,
            primary: alert,
            alerts: [alert],
          };
        content = `
          <p style="margin:0 0 2px;font-size:14px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:0.04em">
            ${conditionLabel}
          </p>
          <p style="margin:0 0 8px;color:#6b7280;font-size:12px">Reading not loaded yet.</p>
          ${formatStationAlertPopupHtml(cluster, conditionLabel)}
        `;
      }

      const location = new Point({ longitude, latitude });
      const targetZoom = view.type === '2d' ? Math.max(view.zoom, 12) : undefined;

      void view
        .goTo(
          view.type === '3d'
            ? { target: location, tilt: SCENE_CAMERA_TILT, scale: 20000 }
            : { center: location, zoom: targetZoom },
          { duration: 650 },
        )
        .then(() => {
          if (view.destroyed) return;
          view.openPopup({ title, content, location });
        })
        .catch((caught: unknown) => {
          const name = caught instanceof Error ? caught.name : '';
          if (name === 'AbortError') return;
          console.warn('[MonitoringPage] Could not focus alert station:', caught);
          if (!view.destroyed) {
            view.openPopup({ title, content, location });
          }
        });
    },
    [
      view,
      liveAlerts.alerts,
      alertsLayerLabel,
      isWindActive,
      snapshot?.readings,
      scalarConfig,
      scalar.snapshot?.readings,
    ],
  );

  /**
   * Frame the stations the first time any data arrives. Without this the default
   * extent leaves the network as a small band of mostly ocean, which makes the
   * flow particles too sparse to read and wastes most of the surface.
   *
   * Tracked per view instance rather than as a flag, so switching to 3D — which
   * builds a new view — reframes instead of leaving the fresh camera untouched.
   */
  const framedForViewRef = useRef<MapView | SceneView | null>(null);
  const hasAnySensorActive = activeSensor !== null;

  useEffect(() => {
    if (!hasAnySensorActive) {
      framedForViewRef.current = null;
      return;
    }
    if (!view || !stationPoints?.length || framedForViewRef.current === view) return;
    framedForViewRef.current = view;
    frameStations();
  }, [hasAnySensorActive, view, stationPoints, frameStations]);

  /*
   * This line named wind and its period outright, from when wind was the only
   * layer, so it went stale the moment there were others to turn on — cameras in
   * particular poll at less than half that. Reading the period from the hooks'
   * own constants means it tracks them rather than restating them.
   */
  const refreshNotice = useMemo(() => {
    // Past participle so that a plural label like Cameras reads correctly without
    // the line having to know whether its subject is singular.
    const describe = (label: string, intervalMs: number) => {
      const minutes = Math.round(intervalMs / 60_000);
      return `${label} refreshed every ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
    };

    if (isWindActive) return describe('Wind', WIND_REFRESH_INTERVAL_MS);
    if (isCamerasActive) return describe('Cameras', CAMERA_REFRESH_INTERVAL_MS);
    if (scalarConfig) return describe(scalarConfig.label, SENSOR_REFRESH_INTERVAL_MS);
    return 'Readings refresh on their own while a sensor is on';
  }, [isWindActive, isCamerasActive, scalarConfig]);

  const loadingSensorIds = useMemo(() => {
    const ids = new Set<string>();
    if (isLoading) ids.add(WIND_SENSOR_ID);
    if (cameras.isLoading && isCamerasActive) ids.add(CAMERA_SENSOR_ID);
    if (scalar.isLoading && activeScalarId) ids.add(activeScalarId);
    return ids;
  }, [isLoading, cameras.isLoading, isCamerasActive, scalar.isLoading, activeScalarId]);

  return (
    <div id="monitoring-page" className="flex h-full w-full overflow-hidden bg-gray-50">
      <ResizablePanel
        side="left"
        storageKey="v2-monitoring-sidebar-panel"
        defaultWidth={280}
        minWidth={220}
        maxWidth={460}
        label="sensor streams"
      >
        <div id="monitoring-sidebar" className="flex h-full flex-col">
        <div className="flex-shrink-0 border-b border-gray-200 px-3 py-3">
          <h2 className="text-sm font-semibold text-gray-900">Live Monitoring</h2>
          <p className="mt-0.5 text-[11px] text-gray-500">
            Continuously updating preserve conditions
          </p>
        </div>

        <div id="monitoring-sensor-tree" className="flex-1 overflow-y-auto">
          {isSectionsLoading && (
            <div className="flex items-center gap-2 px-3 py-3">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-400" />
              <span className="text-[11px] text-gray-500">Loading sensor list…</span>
            </div>
          )}

          {sectionsError && (
            <div role="alert" className="m-3 rounded-card border border-red-200 bg-red-50 px-3 py-2">
              <p className="text-xs font-medium text-red-800">Could not load the sensor list</p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-red-700">{sectionsError}</p>
            </div>
          )}

          {!isSectionsLoading && !sectionsError && sections.length === 0 && (
            <p className="px-3 py-3 text-[11px] leading-relaxed text-gray-500">
              No datasets are tagged for live monitoring yet. Add a <code>live_tag</code> to a
              dataset in the catalog and it will appear here.
            </p>
          )}

          {sections.map((section) => (
            <SensorSectionGroup
              key={section.id}
              section={section}
              activeSensorIds={activeSensorIds}
              loadingSensorIds={loadingSensorIds}
              onToggle={handleToggle}
            />
          ))}
        </div>

        <div className="flex flex-shrink-0 items-center gap-2 border-t border-gray-200 px-3 py-2">
          <Signal className="h-3 w-3 flex-shrink-0 text-emerald-600" />
          <span className="text-[10px] leading-relaxed text-gray-500">{refreshNotice}</span>
        </div>
        </div>
      </ResizablePanel>

      <div className="relative flex min-w-0 flex-1">
        {is3D ? (
          <MonitoringScene onViewReady={handleViewReady} onViewDestroy={handleViewDestroy} />
        ) : (
          <MonitoringMap onViewReady={handleViewReady} onViewDestroy={handleViewDestroy} />
        )}
        <ViewModeToggle
          is3D={is3D}
          onToggle={() => setViewMode(is3D ? '2d' : '3d')}
        />
      </div>

      <ResizablePanel
        side="right"
        storageKey="v2-monitoring-detail-panel"
        defaultWidth={400}
        minWidth={320}
        maxWidth={620}
        label="current conditions"
      >
        <div
          id="monitoring-detail-panel"
          className="flex h-full flex-col gap-4 overflow-y-auto p-4"
        >
        <SensorError label="wind" message={error} onRetry={refresh} />
        <SensorError
          label={scalarConfig?.label.toLowerCase() ?? 'sensor'}
          message={scalar.error}
          onRetry={scalar.refresh}
        />
        <SensorError label="cameras" message={cameras.error} onRetry={cameras.refresh} />

        {scalarConfig && scalar.snapshot && (
          <ScalarDetailPanel
            config={scalarConfig}
            snapshot={scalar.snapshot}
            mode={scalarMode}
            onModeChange={setScalarMode}
            is3D={is3D}
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
            is3D={is3D}
            isLoading={isLoading}
            fetchedAt={fetchedAt}
            onRefresh={refresh}
          />
        )}

        {isCamerasActive && cameras.snapshot && (
          <CameraDetailPanel
            snapshot={cameras.snapshot}
            selectedObjectId={selectedCameraId}
            onSelect={setSelectedCameraId}
            isLoading={cameras.isLoading}
            fetchedAt={cameras.fetchedAt}
            onRefresh={cameras.refresh}
          />
        )}

        {alertsLayerLabel && (
          <AlertsPanel
            layerLabel={alertsLayerLabel}
            alerts={liveAlerts.alerts}
            isLoading={liveAlerts.isLoading}
            error={liveAlerts.error}
            onRefresh={liveAlerts.refresh}
            onSelectAlert={focusAlertStation}
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
        ) : hasAnySensorActive ? (
          <p className="text-[11px] leading-relaxed text-gray-500">Loading the latest readings…</p>
        ) : (
          <section>
            <div className="flex items-center gap-2">
              <Activity className="h-3.5 w-3.5 text-gray-500" />
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                Current Conditions
              </h3>
            </div>

            <p className="mt-2 text-[11px] leading-relaxed text-gray-500">
              Latest readings, taking the highest where several stations report. Turn on a
              sensor in the list to map it.
            </p>

            <div className="mt-3 grid grid-cols-2 gap-2">
              {SUMMARY_TILES.map((tile) => {
                const TileIcon = tile.icon;
                const reading = summary.readings[tile.id];
                return (
                  <div
                    key={tile.id}
                    // The station is the one piece of provenance there is no room
                    // for on a tile this size.
                    title={reading ? `Highest at ${reading.stationName}` : undefined}
                    className="flex flex-col items-center gap-1 rounded-card border border-gray-200 bg-gray-50 px-3 py-4"
                  >
                    <TileIcon className="h-4 w-4 text-gray-400" />
                    <div className="flex items-baseline gap-0.5">
                      <span
                        className={`text-lg font-semibold ${
                          reading ? 'text-gray-900' : 'text-gray-400'
                        }`}
                      >
                        {reading ? reading.value.toFixed(reading.decimals) : '--'}
                      </span>
                      {reading && (
                        <span className="text-[10px] font-medium text-gray-500">
                          {reading.unit}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-medium text-gray-500">{tile.label}</span>
                  </div>
                );
              })}
            </div>

            {summary.observedAt !== null && (
              <p className="mt-2 text-[10px] text-gray-400">
                Observed {formatObservedAt(summary.observedAt)}
                {summary.failedCount > 0 &&
                  ` · ${summary.failedCount} of ${SUMMARY_TILES.length} unavailable`}
              </p>
            )}
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
        </div>
      </ResizablePanel>
    </div>
  );
}
