// ============================================================================
// DendraLegendWidget — Floating map key for Stations (active/inactive) and
// Latest value badges (monitoring-style ramp when a renderer binding exists).
// ============================================================================

import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useLayers } from '../../../context/LayerContext';
import { useCatalog } from '../../../context/CatalogContext';
import { useDendra } from '../../../context/DendraContext';
import {
  isDendraLatestCatalogLayer,
  isDendraStationsCatalogLayer,
  resolveDendraServiceTitle,
} from '../../../utils/resolveDendraServiceTitle';
import { getConcreteActiveLayerId } from '../../Map/mapLayers/internal/mapLayerSyncHelpers';
import { resolveRendererBinding } from '../../../config/monitoringRenderers';
import { SENSOR_VARIABLES, type SensorVariableId } from '../../../services/sensorService';
import { rampToCssGradient, WIND_RAMP, type ColorRamp } from '../../Monitoring/internal/colorRamps';
import { prettifyLatestField } from '../../../services/dendraStationService';

function isSensorVariableId(id: string): id is SensorVariableId {
  return Object.prototype.hasOwnProperty.call(SENSOR_VARIABLES, id);
}

function SwatchCircle({
  id,
  color,
  size = 14,
}: {
  id: string;
  color: string;
  size?: number;
}) {
  return (
    <span
      id={id}
      className="inline-block shrink-0 rounded-full border border-white shadow"
      style={{ width: size, height: size, backgroundColor: color }}
      aria-hidden="true"
    />
  );
}

function SwatchBadge({ id, label }: { id: string; label: string }) {
  return (
    <span
      id={id}
      className="inline-flex h-5 min-w-[2.25rem] items-center justify-center rounded-md border border-teal-200 bg-teal-50 px-1.5 text-[10px] font-semibold text-teal-800 shadow-sm"
      aria-hidden="true"
    >
      {label}
    </span>
  );
}

export function DendraLegendWidget() {
  const [isExpanded, setIsExpanded] = useState(true);
  const { activeLayer } = useLayers();
  const { layerMap } = useCatalog();
  const { showActiveOnly } = useDendra();

  // Service parents select a child measure/stations row — use the concrete map layer.
  const concreteLayerId = activeLayer?.dataSource === 'dendra'
    ? (getConcreteActiveLayerId(activeLayer, layerMap) ?? activeLayer.layerId)
    : null;
  const catalogLayer = concreteLayerId ? layerMap.get(concreteLayerId) : undefined;

  const isLatest = isDendraLatestCatalogLayer(catalogLayer);
  const isStations = isDendraStationsCatalogLayer(catalogLayer);
  const isInactiveMeasure = !!catalogLayer?.catalogMeta?.isInactive;
  const serviceTitle = activeLayer
    ? resolveDendraServiceTitle(layerMap, activeLayer.layerId) ?? activeLayer.name
    : 'Dendra';
  const measureLabel = catalogLayer?.catalogMeta?.valueField
    ? (catalogLayer.name || prettifyLatestField(catalogLayer.catalogMeta.valueField))
    : (isLatest ? catalogLayer?.name ?? null : null);

  const latestLegend = useMemo(() => {
    if (!isLatest || !catalogLayer) return null;
    const servicePath = catalogLayer.catalogMeta?.servicePath?.trim();
    if (!servicePath) {
      return { kind: 'generic' as const, unit: '', ramp: null as ColorRamp | null, label: measureLabel ?? 'Latest reading' };
    }
    const binding = resolveRendererBinding(servicePath);
    if (!binding) {
      return { kind: 'generic' as const, unit: '', ramp: null as ColorRamp | null, label: measureLabel ?? 'Latest reading' };
    }
    if (binding.renderer === 'wind-vector-field') {
      return { kind: 'ramp' as const, unit: binding.unit, ramp: WIND_RAMP, label: 'Wind speed' };
    }
    if (binding.renderer === 'scalar-surface' && isSensorVariableId(binding.variableKey)) {
      const config = SENSOR_VARIABLES[binding.variableKey];
      return {
        kind: 'ramp' as const,
        unit: config.unit,
        ramp: config.ramp,
        label: measureLabel ?? config.label,
      };
    }
    return { kind: 'generic' as const, unit: binding.unit, ramp: null as ColorRamp | null, label: measureLabel ?? 'Latest reading' };
  }, [catalogLayer, isLatest, measureLabel]);

  if (!activeLayer || activeLayer.dataSource !== 'dendra' || !catalogLayer) return null;

  const toggleExpanded = () => setIsExpanded((previous) => !previous);
  const title = isLatest
    ? `${serviceTitle} — ${measureLabel ?? 'Latest'}`
    : isStations
      ? `${serviceTitle} — Stations`
      : serviceTitle;

  return (
    <div
      id="dendra-legend-widget"
      className="absolute bottom-6 right-6 z-30 w-72 rounded-lg border border-gray-300 bg-white shadow-lg"
      aria-label="Dendra map legend"
    >
      <div
        id="dendra-legend-widget-header"
        role="button"
        tabIndex={0}
        onClick={toggleExpanded}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            toggleExpanded();
          }
        }}
        className={`flex cursor-pointer items-center justify-between bg-gray-50 px-4 py-3 transition-colors hover:bg-gray-100 ${
          isExpanded ? 'rounded-t-lg border-b border-gray-200' : 'rounded-lg'
        }`}
        aria-expanded={isExpanded}
      >
        <h3 id="dendra-legend-widget-title" className="truncate text-sm font-semibold text-gray-900">
          {title}
        </h3>
        <button
          id="dendra-legend-widget-expand-toggle"
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            toggleExpanded();
          }}
          className="rounded p-0.5 transition-colors hover:bg-gray-200"
          aria-label={isExpanded ? 'Collapse Dendra legend' : 'Expand Dendra legend'}
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-gray-600" />
          ) : (
            <ChevronRight className="h-4 w-4 text-gray-600" />
          )}
        </button>
      </div>

      {isExpanded && (
        <div id="dendra-legend-widget-content" className="space-y-3 px-4 py-3 text-xs text-gray-700">
          {isLatest && isInactiveMeasure && (
            <>
              <div id="dendra-legend-item-historical" className="flex items-center gap-2">
                <SwatchCircle id="dendra-legend-swatch-historical" color="rgba(100, 116, 139, 0.85)" size={12} />
                <span>Historical station (no readings in last 7 days)</span>
              </div>
              <p id="dendra-legend-note-inactive" className="text-[11px] leading-relaxed text-gray-500">
                This measure has no recent Latest values, so the map shows stations that
                have recorded it historically — without live badges.
              </p>
            </>
          )}

          {isLatest && !isInactiveMeasure && latestLegend && (
            <>
              <div id="dendra-legend-item-badge" className="flex items-center gap-2">
                <SwatchBadge id="dendra-legend-swatch-badge" label={latestLegend.unit || '…'} />
                <span>{latestLegend.label} — current reading</span>
              </div>

              {latestLegend.kind === 'ramp' && latestLegend.ramp && (
                <div id="dendra-legend-ramp" className="space-y-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                    Value scale
                  </p>
                  <div
                    id="dendra-legend-ramp-gradient"
                    className="h-2 w-full rounded-full"
                    style={{ background: rampToCssGradient(latestLegend.ramp) }}
                    role="presentation"
                  />
                  <p className="text-[11px] leading-relaxed text-gray-500">
                    Badge color follows the same ramp as Live Monitoring
                    {latestLegend.unit ? ` (${latestLegend.unit})` : ''}.
                  </p>
                </div>
              )}

              {latestLegend.kind === 'generic' && (
                <p id="dendra-legend-note-generic" className="text-[11px] leading-relaxed text-gray-500">
                  Stations with a reading in the last 7 days show a value badge at their location.
                </p>
              )}
            </>
          )}

          {isStations && (
            <>
              <div id="dendra-legend-item-active" className="flex items-center gap-2">
                <SwatchCircle id="dendra-legend-swatch-active" color="rgba(34, 139, 34, 0.9)" size={16} />
                <span>Active station</span>
              </div>
              {!showActiveOnly && (
                <div id="dendra-legend-item-inactive" className="flex items-center gap-2">
                  <SwatchCircle id="dendra-legend-swatch-inactive" color="rgba(156, 163, 175, 0.8)" size={14} />
                  <span>Inactive station</span>
                </div>
              )}
              <p id="dendra-legend-note-stations" className="text-[11px] leading-relaxed text-gray-500">
                {showActiveOnly
                  ? 'Showing active stations only. Turn off “Active only” in Browse to include inactive sites.'
                  : 'Overlapping stations cluster when zoomed out. Zoom in to see labeled dots — green is active; gray is inactive or stale.'}
              </p>
            </>
          )}

          {!isLatest && !isStations && (
            <p id="dendra-legend-note-unknown" className="text-[11px] leading-relaxed text-gray-500">
              Select Stations or a datastream under this service to see the map legend.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
