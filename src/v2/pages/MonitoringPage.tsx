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
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CloudRain,
  Droplets,
  Gauge,
  History as HistoryIcon,
  Loader2,
  Pin,
  Radio,
  RefreshCw,
  Signal,
  Sun,
  Thermometer,
  Waves,
  Wind,
  Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { CatalogLayer } from '../types';
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
import {
  CONDITIONS_SUMMARY_METRIC_COUNT,
  useConditionsSummary,
  type SummaryMetricId,
} from '../hooks/useConditionsSummary';
import { usePreserveBoundary } from '../hooks/usePreserveBoundary';
import { useMonitoringSections } from '../hooks/useMonitoringSections';
import type { MonitoringSection, MonitoringSensor } from '../hooks/useMonitoringSections';
import { ResizablePanel } from '../components/shared/ResizablePanel';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { createPreserveOutlineLayer } from '../components/Monitoring/internal/boundaryOutlineLayer';
import { formatObservedAt } from '../components/Monitoring/internal/formatObservedAt';
import { AlertsPanel } from '../components/Monitoring/AlertsPanel';
import { BetaNoticeBanner } from '../components/shared/BetaNoticeBanner';
import { allowsInterpolation, SENSOR_VARIABLES } from '../services/sensorService';
import type { SensorVariableId } from '../services/sensorService';
import {
  alertMatchesActiveSource,
  buildLatestLayerUrl,
  type LiveAlert,
} from '../services/liveAlertService';
import { WIND_SERVICE_PATH } from '../services/windService';
import { useLayers } from '../context/LayerContext';
import { useCatalog } from '../context/CatalogContext';
import { useLiveAlertsContext } from '../context/LiveAlertsContext';
import { resolveHistoricalCatalogLayer } from '../utils/resolveCatalogLayer';
import {
  clearMonitoringAlertFocus,
  getLatestMonitoringAlertFocus,
  MONITORING_ALERT_FOCUS_EVENT,
  type MonitoringAlertFocusIntent,
} from '../alerts/monitoringAlertIntent';
import {
  clearMonitoringSensorFocus,
  getLatestMonitoringSensorFocus,
  MONITORING_SENSOR_FOCUS_EVENT,
  type MonitoringSensorFocusIntent,
} from '../alerts/monitoringSensorIntent';

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

/** Match an open alert to the monitoring sensor whose service it was evaluated on. */
function normalizeMonitoringServicePath(path: string): string {
  return path
    .trim()
    .replace(/^\/+|\/+$/g, '')
    .replace(/^hosted\//i, '')
    .replace(/\/featureserver(?:\/\d+)?$/i, '')
    .toLowerCase();
}

function resolveSensorFromAlert(
  alert: LiveAlert,
  sections: MonitoringSection[],
): MonitoringSensor | null {
  const candidates = [
    ...(alert.sourceService ? [normalizeMonitoringServicePath(alert.sourceService)] : []),
    ...alert.sourceUrls.map((url) => {
      const match = url.match(/\/services\/([^/?#]+)/i);
      return match ? normalizeMonitoringServicePath(match[1]) : '';
    }),
  ].filter(Boolean);

  if (candidates.length === 0) return null;

  for (const section of sections) {
    for (const sensor of section.sensors) {
      if (!sensor.renderer) continue;
      const sensorPath = normalizeMonitoringServicePath(sensor.servicePath);
      if (
        candidates.some(
          (candidate) =>
            candidate === sensorPath
            || candidate.includes(sensorPath)
            || sensorPath.includes(candidate),
        )
      ) {
        return sensor;
      }
    }
  }

  return null;
}

/**
 * Each tile is a maximum across the reporting stations, which the panel states
 * once above them rather than every label carrying a "Max" prefix. The air and
 * creek temperatures are both named, since "Temperature" alone would be
 * ambiguous once there are two of them.
 *
 * Primary tiles stay visible; the rest open behind "Show more". Cameras are
 * omitted — they have no single headline reading.
 */
const SUMMARY_TILES: { id: SummaryMetricId; label: string; icon: LucideIcon }[] = [
  { id: 'temp', label: 'Air Temp', icon: Thermometer },
  { id: 'wind', label: 'Wind Speed', icon: Wind },
  { id: 'humidity', label: 'Humidity', icon: Droplets },
  { id: 'pressure', label: 'Pressure', icon: Gauge },
  { id: 'gaugeHeight', label: 'Creek Height', icon: Waves },
  { id: 'waterTemp', label: 'Creek Temp', icon: Thermometer },
  { id: 'precip', label: 'Rainfall', icon: CloudRain },
  { id: 'solar', label: 'Solar', icon: Sun },
  { id: 'soilTemp', label: 'Soil Temp', icon: Thermometer },
  { id: 'soilMoisture', label: 'Soil Moisture', icon: Droplets },
  { id: 'groundwater', label: 'Groundwater', icon: Droplets },
  { id: 'streamLevel', label: 'Stream Level', icon: Waves },
  { id: 'discharge', label: 'Discharge', icon: Waves },
  { id: 'conductivity', label: 'Conductivity', icon: Zap },
];

const PRIMARY_SUMMARY_TILE_COUNT = 6;

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

function isServiceContainerLayer(layer: CatalogLayer): boolean {
  return !!(
    layer.catalogMeta?.isMultiLayerService
    && !layer.catalogMeta.parentServiceId
    && layer.catalogMeta.siblingLayers
    && layer.catalogMeta.siblingLayers.length > 0
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
  const navigate = useNavigate();
  const { activateLayer, pinLayer, unpinLayer, isLayerPinned, getPinnedByLayerId, requestBrowseTab } =
    useLayers();
  const { layerMap, loading: catalogLoading } = useCatalog();
  const [activeSensor, setActiveSensor] = useState<{
    id: string;
    renderer: MonitoringSensor['renderer'];
  } | null>(null);
  /** Right panel: overview = Current Conditions home; detail = selected stream. */
  const [detailPanelView, setDetailPanelView] = useState<'overview' | 'detail'>('overview');
  const [summaryExpanded, setSummaryExpanded] = useState(false);
  const [selectedCameraId, setSelectedCameraId] = useState<number | null>(null);
  const [vizMode, setVizMode] = useState<WindVizMode>('arrows');
  const [scalarMode, setScalarMode] = useState<ScalarVizMode>('surface');
  const [view, setView] = useState<MapView | SceneView | null>(null);
  const [viewMode, setViewMode] = useLocalStorage<'2d' | '3d'>(
    'v2-monitoring-view-mode',
    '2d',
  );
  const pendingCatalogAlertFocusRef = useRef<LiveAlert | null>(null);
  const deferredFocusAlertRef = useRef<LiveAlert | null>(null);
  const pendingSensorFocusRef = useRef<MonitoringSensorFocusIntent | null>(null);
  const [pendingFocusVersion, setPendingFocusVersion] = useState(0);
  const [pendingSensorFocusVersion, setPendingSensorFocusVersion] = useState(0);

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

  const sharedLiveAlerts = useLiveAlertsContext();
  const filteredAlerts = useMemo(() => {
    if (!activeAlertSource) return [];
    return sharedLiveAlerts.allAlerts.filter((alert) =>
      alertMatchesActiveSource(alert, activeAlertSource),
    );
  }, [sharedLiveAlerts.allAlerts, activeAlertSource]);
  const liveAlerts = useMemo(
    () => ({
      alerts: filteredAlerts,
      allAlerts: sharedLiveAlerts.allAlerts,
      isLoading: sharedLiveAlerts.isLoading,
      error: sharedLiveAlerts.error,
      fetchedAt: sharedLiveAlerts.fetchedAt,
      refresh: sharedLiveAlerts.refresh,
    }),
    [filteredAlerts, sharedLiveAlerts],
  );
  const alertsLayerLabel = isWindActive
    ? 'Wind'
    : scalarConfig?.label ?? null;

  /** Catalog dataset behind the active monitoring sensor, if any. */
  const activeMonitoringSensor = useMemo(() => {
    if (!activeSensor) return null;
    for (const section of sections) {
      const match = section.sensors.find((sensor) => sensor.id === activeSensor.id);
      if (match) return match;
    }
    return null;
  }, [activeSensor, sections]);

  const historicalCatalogLayer = useMemo(() => {
    if (!activeMonitoringSensor) return null;
    return resolveHistoricalCatalogLayer(
      layerMap,
      activeMonitoringSensor.datasetId,
      activeMonitoringSensor.layerId,
    );
  }, [activeMonitoringSensor, layerMap]);

  const historicalTargetLayerId = historicalCatalogLayer?.id ?? null;

  const isHistoricalLayerPinned = historicalTargetLayerId
    ? isLayerPinned(historicalTargetLayerId)
    : false;

  const [catalogActionError, setCatalogActionError] = useState<string | null>(null);
  const [pinFeedback, setPinFeedback] = useState<string | null>(null);

  useEffect(() => {
    setCatalogActionError(null);
    setPinFeedback(null);
  }, [activeMonitoringSensor?.datasetId]);

  const resolveHistoricalTarget = useCallback((): {
    layerId: string;
    layerName: string;
  } | null => {
    if (!activeMonitoringSensor) {
      setCatalogActionError('Select a live sensor first.');
      return null;
    }

    if (catalogLoading && layerMap.size === 0) {
      setCatalogActionError('Data Catalog is still loading. Try again in a moment.');
      return null;
    }

    const layer = resolveHistoricalCatalogLayer(
      layerMap,
      activeMonitoringSensor.datasetId,
      activeMonitoringSensor.layerId,
    );

    if (!layer) {
      setCatalogActionError(
        `Could not find "${activeMonitoringSensor.name}" in the Data Catalog map layers.`,
      );
      return null;
    }

    // Prefer a concrete child over a service container so pinLayer succeeds.
    // Match Locations by name first — creek gauges publish Locations at id 0,
    // while classic `_Datastreams` services put Locations at id 1.
    const targetLayerId = isServiceContainerLayer(layer)
      ? (
          layer.catalogMeta?.siblingLayers?.find(
            (sibling) => /location|station/i.test(sibling.name),
          )?.id
          ?? layer.catalogMeta?.siblingLayers?.find(
            (sibling) =>
              sibling.catalogMeta?.layerIdInService === 1
              && !/latest/i.test(sibling.name),
          )?.id
          ?? layer.catalogMeta?.siblingLayers?.[0]?.id
          ?? layer.id
        )
      : layer.id;

    if (!layerMap.get(targetLayerId)) {
      setCatalogActionError('Could not resolve a map layer for this sensor.');
      return null;
    }

    return {
      layerId: targetLayerId,
      layerName: layerMap.get(targetLayerId)?.name ?? layer.name,
    };
  }, [activeMonitoringSensor, catalogLoading, layerMap]);

  const viewHistoricalData = useCallback(() => {
    setCatalogActionError(null);
    setPinFeedback(null);
    const target = resolveHistoricalTarget();
    if (!target) return;

    activateLayer(target.layerId);
    pinLayer(target.layerId);
    requestBrowseTab();
    navigate('/catalog');
  }, [
    resolveHistoricalTarget,
    activateLayer,
    pinLayer,
    requestBrowseTab,
    navigate,
  ]);

  const pinHistoricalDataset = useCallback(() => {
    setCatalogActionError(null);
    const target = resolveHistoricalTarget();
    if (!target) return;

    const existing = getPinnedByLayerId(target.layerId);
    if (existing) {
      unpinLayer(existing.id);
      setPinFeedback(`Removed "${target.layerName}" from Map Layers.`);
      return;
    }

    pinLayer(target.layerId);
    setPinFeedback(`Pinned "${target.layerName}" to Map Layers.`);
  }, [resolveHistoricalTarget, getPinnedByLayerId, unpinLayer, pinLayer]);

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

    const turningOff = activeSensor?.id === sensor.id;
    if (turningOff) {
      setActiveSensor(null);
      setDetailPanelView('overview');
      return;
    }

    setActiveSensor({ id: sensor.id, renderer: sensor.renderer });
    setDetailPanelView('detail');
  }, [activeSensor?.id]);

  /** Click a Current Conditions tile to put that stream on the map (or clear it). */
  const handleSummaryTileClick = useCallback(
    (metricId: SummaryMetricId) => {
      if (metricId === 'wind') {
        if (activeSensor?.id === WIND_SENSOR_ID) {
          setActiveSensor(null);
          return;
        }
        setActiveSensor({ id: WIND_SENSOR_ID, renderer: 'wind-vector-field' });
        return;
      }

      if (!isScalarSensor(metricId)) return;

      if (activeSensor?.id === metricId) {
        setActiveSensor(null);
        return;
      }

      setActiveSensor({ id: metricId, renderer: 'scalar-surface' });
    },
    [activeSensor?.id],
  );

  const isSummaryTileActive = useCallback(
    (metricId: SummaryMetricId) => {
      if (metricId === 'wind') return activeSensor?.id === WIND_SENSOR_ID;
      return activeSensor?.id === metricId;
    },
    [activeSensor?.id],
  );

  const visibleSummaryTiles = summaryExpanded
    ? SUMMARY_TILES
    : SUMMARY_TILES.slice(0, PRIMARY_SUMMARY_TILE_COUNT);
  const hiddenSummaryCount = SUMMARY_TILES.length - PRIMARY_SUMMARY_TILE_COUNT;

  const activeStreamLabel = useMemo(() => {
    if (!activeSensor) return null;
    return (
      activeMonitoringSensor?.name
      ?? (isWindActive ? 'Wind' : null)
      ?? (isCamerasActive ? 'Cameras' : null)
      ?? scalarConfig?.label
      ?? alertsLayerLabel
      ?? 'Selected stream'
    );
  }, [
    activeSensor,
    activeMonitoringSensor?.name,
    isWindActive,
    isCamerasActive,
    scalarConfig?.label,
    alertsLayerLabel,
  ]);

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

      const alertLookup = buildStationAlertLookup(liveAlerts.allAlerts);
      const conditionLabel = alertsLayerLabel ?? (alert.category.trim() || 'Alert');
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
      liveAlerts.allAlerts,
      alertsLayerLabel,
      isWindActive,
      snapshot?.readings,
      scalarConfig,
      scalar.snapshot?.readings,
    ],
  );

  /**
   * Overview alerts span every stream — activate the matching datastream first so
   * the map has something under the station popup.
   */
  const handleOverviewAlertSelect = useCallback(
    (alert: LiveAlert) => {
      const sensor = resolveSensorFromAlert(alert, sections);
      if (sensor?.renderer) {
        if (sensor.renderer === 'scalar-surface' && !isScalarSensor(sensor.id)) {
          console.warn('[MonitoringPage] Alert matched an unimplemented scalar sensor:', sensor.id);
        } else {
          setActiveSensor({ id: sensor.id, renderer: sensor.renderer });
          setDetailPanelView('detail');
        }
      } else if (import.meta.env.DEV) {
        console.warn('[MonitoringPage] No monitoring sensor matched alert sources', {
          sourceService: alert.sourceService,
          sourceUrls: alert.sourceUrls,
          sectionCount: sections.length,
        });
      }
      // Defer focus so the newly selected layer's visualization can mount; the
      // popup still opens from alert coordinates if readings are not ready yet.
      if (!view || view.destroyed) {
        deferredFocusAlertRef.current = alert;
      } else {
        window.setTimeout(() => {
          focusAlertStation(alert);
        }, 450);
      }
    },
    [sections, focusAlertStation, view],
  );

  // Catalog bell → Live Monitoring handoff.
  // Queue the alert and wait for the sensor tree before activating a layer —
  // first visit otherwise resolves against empty sections and draws nothing.
  useEffect(() => {
    const queueFocus = (intent: MonitoringAlertFocusIntent | null) => {
      if (!intent) return;
      clearMonitoringAlertFocus();
      pendingCatalogAlertFocusRef.current = intent.alert;
      setPendingFocusVersion((version) => version + 1);
    };

    queueFocus(getLatestMonitoringAlertFocus());

    const onFocusEvent = (event: Event) => {
      const custom = event as CustomEvent<MonitoringAlertFocusIntent>;
      queueFocus(custom.detail ?? getLatestMonitoringAlertFocus());
    };

    window.addEventListener(MONITORING_ALERT_FOCUS_EVENT, onFocusEvent);
    return () => window.removeEventListener(MONITORING_ALERT_FOCUS_EVENT, onFocusEvent);
  }, []);

  // Apply a pending catalog-bell alert once monitoring sections are ready.
  useEffect(() => {
    if (pendingFocusVersion === 0) return;
    const pending = pendingCatalogAlertFocusRef.current;
    if (!pending) return;
    if (isSectionsLoading || sections.length === 0) return;

    pendingCatalogAlertFocusRef.current = null;
    handleOverviewAlertSelect(pending);
  }, [pendingFocusVersion, isSectionsLoading, sections, handleOverviewAlertSelect]);

  // Catalog Overview → Live Monitoring: open the matching dataset/sensor.
  useEffect(() => {
    const queueSensor = (intent: MonitoringSensorFocusIntent | null) => {
      if (!intent) return;
      clearMonitoringSensorFocus();
      pendingSensorFocusRef.current = intent;
      setPendingSensorFocusVersion((version) => version + 1);
    };

    queueSensor(getLatestMonitoringSensorFocus());

    const onFocusEvent = (event: Event) => {
      const custom = event as CustomEvent<MonitoringSensorFocusIntent>;
      queueSensor(custom.detail ?? getLatestMonitoringSensorFocus());
    };

    window.addEventListener(MONITORING_SENSOR_FOCUS_EVENT, onFocusEvent);
    return () => window.removeEventListener(MONITORING_SENSOR_FOCUS_EVENT, onFocusEvent);
  }, []);

  useEffect(() => {
    if (pendingSensorFocusVersion === 0) return;
    const pending = pendingSensorFocusRef.current;
    if (!pending) return;
    if (isSectionsLoading || sections.length === 0) return;

    pendingSensorFocusRef.current = null;

    const normalizedPath = pending.servicePath
      ? normalizeMonitoringServicePath(pending.servicePath)
      : '';

    let match: MonitoringSensor | undefined;
    for (const section of sections) {
      match = section.sensors.find((sensor) => {
        if (pending.sensorId && sensor.id === pending.sensorId) return true;
        if (pending.datasetId != null && sensor.datasetId === pending.datasetId) return true;
        if (normalizedPath && normalizeMonitoringServicePath(sensor.servicePath) === normalizedPath) {
          return true;
        }
        return false;
      });
      if (match) break;
    }

    if (!match?.renderer) {
      if (import.meta.env.DEV) {
        console.warn('[MonitoringPage] No monitoring sensor matched catalog focus', pending);
      }
      return;
    }

    if (match.renderer === 'scalar-surface' && !isScalarSensor(match.id)) {
      console.warn('[MonitoringPage] Catalog focus matched unimplemented scalar:', match.id);
      return;
    }

    setActiveSensor({ id: match.id, renderer: match.renderer });
    setDetailPanelView('detail');
  }, [pendingSensorFocusVersion, isSectionsLoading, sections]);

  // If the map view wasn't ready on the first focus attempt, retry once it is.
  useEffect(() => {
    if (!view || view.destroyed) return;
    const deferred = deferredFocusAlertRef.current;
    if (!deferred) return;
    deferredFocusAlertRef.current = null;
    const timer = window.setTimeout(() => focusAlertStation(deferred), 400);
    return () => window.clearTimeout(timer);
  }, [view, focusAlertStation]);

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
    <div className="flex h-full w-full flex-col overflow-hidden">
      <BetaNoticeBanner />
    <div id="monitoring-page" className="flex min-h-0 flex-1 overflow-hidden bg-gray-50">
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
            <div role="alert" className="m-3 rounded-card border border-amber-200 bg-amber-50 px-3 py-2">
              <p className="text-[11px] leading-relaxed text-amber-950">{sectionsError}</p>
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
          className="flex h-full flex-col overflow-hidden p-4"
        >
        {detailPanelView === 'overview' ? (
          <>
            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
            <section>
              <div className="flex items-center gap-2">
                <Activity className="h-3.5 w-3.5 text-gray-500" />
                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                  Current Conditions
                </h3>
              </div>

              <p className="mt-2 text-[11px] leading-relaxed text-gray-500">
                Highest reading across reporting stations. Click a card to map that
                stream.
              </p>

              <div className="mt-3 flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-2">
                  {visibleSummaryTiles.map((tile) => {
                    const TileIcon = tile.icon;
                    const metric = summary.metrics[tile.id];
                    const reading = metric?.reading ?? null;
                    const status = metric?.status ?? 'loading';
                    const isActive = isSummaryTileActive(tile.id);
                    return (
                      <div
                        key={tile.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => handleSummaryTileClick(tile.id)}
                        onKeyDown={(event) => {
                          if (event.key !== 'Enter' && event.key !== ' ') return;
                          event.preventDefault();
                          handleSummaryTileClick(tile.id);
                        }}
                        title={
                          reading
                            ? `Map ${tile.label} · highest at ${reading.stationName}`
                            : status === 'error'
                              ? `${tile.label} failed to load`
                              : `Map ${tile.label}`
                        }
                        aria-pressed={isActive}
                        className={`flex cursor-pointer flex-col items-center gap-1 rounded-card border px-3 py-4 text-center transition-colors ${
                          isActive
                            ? 'border-emerald-400 bg-emerald-50 ring-2 ring-emerald-200'
                            : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-white'
                        }`}
                      >
                        <TileIcon
                          className={`h-4 w-4 ${
                            isActive ? 'text-emerald-700' : 'text-gray-400'
                          }`}
                        />
                        <span
                          className={`text-[10px] font-medium ${
                            isActive ? 'text-emerald-800' : 'text-gray-500'
                          }`}
                        >
                          {tile.label}
                        </span>

                        {status === 'loading' && (
                          <div className="flex h-8 items-center justify-center">
                            <Loader2
                              className={`h-4 w-4 animate-spin ${
                                isActive ? 'text-emerald-600' : 'text-gray-400'
                              }`}
                              aria-label={`Loading ${tile.label}`}
                            />
                          </div>
                        )}

                        {status === 'ready' && reading && (
                          <div className="flex h-8 items-baseline gap-0.5">
                            <span
                              className={`text-lg font-semibold ${
                                isActive ? 'text-emerald-950' : 'text-gray-900'
                              }`}
                            >
                              {reading.value.toFixed(reading.decimals)}
                            </span>
                            <span
                              className={`text-[10px] font-medium ${
                                isActive ? 'text-emerald-800/80' : 'text-gray-500'
                              }`}
                            >
                              {reading.unit}
                            </span>
                          </div>
                        )}

                        {status === 'error' && (
                          <div className="flex h-8 flex-col items-center justify-center gap-0.5">
                            <span className="text-[10px] text-red-600">Unavailable</span>
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                summary.refreshMetric(tile.id);
                              }}
                              className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-gray-600 underline hover:text-gray-900"
                              title={metric?.error ?? `Retry ${tile.label}`}
                            >
                              <RefreshCw className="h-2.5 w-2.5" />
                              Retry
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {hiddenSummaryCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setSummaryExpanded((current) => !current)}
                    className="flex w-full items-center justify-center gap-1 rounded-md py-1.5 text-[11px] font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
                    aria-expanded={summaryExpanded}
                  >
                    {summaryExpanded ? (
                      <>
                        <ChevronDown className="h-3.5 w-3.5" />
                        Show fewer
                      </>
                    ) : (
                      <>
                        <ChevronRight className="h-3.5 w-3.5" />
                        Show {hiddenSummaryCount} more
                      </>
                    )}
                  </button>
                )}
              </div>

              {(summary.observedAt !== null || summary.failedCount > 0) && (
                <p className="mt-2 text-[10px] text-gray-400">
                  {summary.observedAt !== null && (
                    <>Observed {formatObservedAt(summary.observedAt)}</>
                  )}
                  {summary.failedCount > 0 && (
                    <>
                      {summary.observedAt !== null ? ' · ' : ''}
                      {summary.failedCount} of {CONDITIONS_SUMMARY_METRIC_COUNT} unavailable
                    </>
                  )}
                </p>
              )}
            </section>

            <AlertsPanel
              layerLabel="all streams"
              alerts={liveAlerts.allAlerts}
              isLoading={liveAlerts.isLoading}
              error={liveAlerts.error}
              onRefresh={liveAlerts.refresh}
              onSelectAlert={handleOverviewAlertSelect}
            />
            </div>

            {activeStreamLabel && (
              <div className="flex-shrink-0 border-t border-gray-200 bg-white pt-3">
                <button
                  type="button"
                  onClick={() => setDetailPanelView('detail')}
                  title={`Open the detailed ${activeStreamLabel} panel`}
                  className="flex w-full items-center justify-center gap-2 rounded-card bg-emerald-600 px-3 py-3 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
                >
                  View {activeStreamLabel} conditions
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => setDetailPanelView('overview')}
                title="Back to all conditions"
                aria-label="Back to all conditions"
                className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
              >
                <ChevronLeft className="h-4 w-4 flex-shrink-0" />
                All Conditions
              </button>
            </div>

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

            {stationPoints?.length ? (
              <button
                type="button"
                onClick={frameStations}
                title="Zoom the map to fit every station currently reporting for this sensor"
                className="rounded-card border border-gray-200 bg-white px-3 py-2 text-[11px] font-medium text-gray-600 transition-colors hover:bg-gray-50"
              >
                Zoom to reporting stations
              </button>
            ) : hasAnySensorActive ? (
              <p className="text-[11px] leading-relaxed text-gray-500">
                Loading the latest readings…
              </p>
            ) : (
              <p className="text-[11px] leading-relaxed text-gray-500">
                Select a sensor in the list to see its detailed conditions.
              </p>
            )}

            <div className="flex flex-col gap-1.5">
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={viewHistoricalData}
                  disabled={!activeMonitoringSensor}
                  title={
                    !activeMonitoringSensor
                      ? 'Select a live sensor first. Opens this dataset on the Data Catalog map and reveals it in the left sidebar.'
                      : `Open ${historicalCatalogLayer?.name ?? 'this dataset'} on the Data Catalog map (Stations/Locations view for sensor datastreams), pin it to Map Layers, and show its place in the left sidebar.`
                  }
                  className={`flex items-center justify-center gap-1.5 rounded-card border px-2 py-2 text-[11px] font-medium transition-colors ${
                    activeMonitoringSensor
                      ? 'border-emerald-200 bg-white text-emerald-800 hover:bg-emerald-50'
                      : 'cursor-not-allowed border-gray-200 bg-white text-gray-400'
                  }`}
                >
                  <HistoryIcon className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="leading-tight">View Historical Data</span>
                </button>
                <button
                  type="button"
                  onClick={pinHistoricalDataset}
                  disabled={!activeMonitoringSensor}
                  title={
                    !activeMonitoringSensor
                      ? 'Select a live sensor first. Saves the Stations/Locations layer to Map Layers (favorites) without leaving Live Monitoring.'
                      : isHistoricalLayerPinned
                        ? `Remove ${historicalCatalogLayer?.name ?? 'this dataset'} from Map Layers / favorites.`
                        : `Save ${historicalCatalogLayer?.name ?? 'this dataset'} (Stations view) to Map Layers so it appears in favorites without leaving Live Monitoring.`
                  }
                  className={`flex items-center justify-center gap-1.5 rounded-card border px-2 py-2 text-[11px] font-medium transition-colors ${
                    !activeMonitoringSensor
                      ? 'cursor-not-allowed border-gray-200 bg-white text-gray-400'
                      : isHistoricalLayerPinned
                        ? 'border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100'
                        : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {isHistoricalLayerPinned ? (
                    <Check className="h-3.5 w-3.5 flex-shrink-0" />
                  ) : (
                    <Pin className="h-3.5 w-3.5 flex-shrink-0" />
                  )}
                  <span className="leading-tight">
                    {isHistoricalLayerPinned ? 'Unpin Dataset' : 'Pin Dataset'}
                  </span>
                </button>
              </div>
              {catalogActionError && (
                <p role="alert" className="text-[10px] leading-relaxed text-red-600">
                  {catalogActionError}
                </p>
              )}
              {!catalogActionError && pinFeedback && (
                <p className="text-[10px] leading-relaxed text-emerald-700">{pinFeedback}</p>
              )}
            </div>

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
          </div>
        )}
        </div>
      </ResizablePanel>
    </div>
    </div>
  );
}
