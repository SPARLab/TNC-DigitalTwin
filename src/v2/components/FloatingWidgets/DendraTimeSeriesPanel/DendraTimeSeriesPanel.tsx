// ============================================================================
// DendraTimeSeriesPanel — Floating time series chart overlaying the map.
//
// Positioned at the bottom of the map area. Shows an ECharts line chart
// with teal theming, dataZoom slider, stats sidebar, and minimize/close.
// Reads chart state from DendraContext.
// ============================================================================

import { useEffect, useRef, useMemo, useCallback, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import * as echarts from 'echarts';
import {
  Minus, X, ChevronUp, Activity, Maximize2,
  TrendingDown, TrendingUp, Loader2,
  Download, BarChart3,
} from 'lucide-react';
import { useDendra } from '../../../context/DendraContext';
import { useLayers } from '../../../context/LayerContext';
import { formatStationDisplayName, formatValue, formatTimestamp } from '../../../services/dendraStationService';

export function DendraTimeSeriesPanel() {
  const { chartPanels } = useDendra();
  const { activeLayer, getPinnedByLayerId } = useLayers();

  if (chartPanels.length === 0) return null;

  const visiblePanels = chartPanels.filter((panel) => {
    const pinned = getPinnedByLayerId(panel.sourceLayerId);
    if (pinned) {
      if (!pinned.isVisible) return false;
      if (pinned.views && pinned.views.length > 0) {
        const resolvedViewId = panel.sourceViewId ?? pinned.views[0].id;
        return Boolean(pinned.views.find((view) => view.id === resolvedViewId)?.isVisible);
      }
      return true;
    }
    return activeLayer?.layerId === panel.sourceLayerId;
  });

  if (visiblePanels.length === 0) return null;

  return (
    <>
      {visiblePanels
        .slice()
        .sort((a, b) => a.zIndex - b.zIndex)
        .map(panel => <ChartPanel key={panel.id} panelId={panel.id} />)}
    </>
  );
}

const MIN_PANEL_WIDTH = 420;
const MIN_PANEL_HEIGHT = 320;
const MINIMIZED_WIDTH = 420;
const MINIMIZED_HEIGHT = 58;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function getMapBounds() {
  const mapContainer = document.getElementById('map-container');
  const width = mapContainer?.clientWidth ?? window.innerWidth;
  const height = mapContainer?.clientHeight ?? window.innerHeight;
  return {
    width: Math.max(width, MIN_PANEL_WIDTH),
    height: Math.max(height, MIN_PANEL_HEIGHT),
  };
}

function ChartPanel({ panelId }: { panelId: string }) {
  const {
    chartPanels,
    closeChart,
    toggleMinimizeChart,
    setChartPanelRect,
    bringChartToFront,
  } = useDendra();
  const panel = chartPanels.find(candidate => candidate.id === panelId);
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);

  if (!panel) return null;

  const stopPanelControlEvent = (event: ReactPointerEvent<HTMLElement>) => {
    event.stopPropagation();
  };

  const displayName = formatStationDisplayName(panel.station?.station_name);
  const summary = panel.summary;
  const data = panel.data;
  const chartLabel = summary?.datastream_name ?? '';
  const categoryLabel = panel.sourceLayerName;
  const safePanelId = panel.id.replace(/[^a-zA-Z0-9-_]/g, '-');

  const handleDragStart = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest('button')) return;
    event.preventDefault();
    event.stopPropagation();
    bringChartToFront(panel.id);
    const startX = event.clientX;
    const startY = event.clientY;
    const originX = panel.x;
    const originY = panel.y;

    const handleMove = (moveEvent: PointerEvent) => {
      const bounds = getMapBounds();
      const panelWidth = panel.minimized ? MINIMIZED_WIDTH : panel.width;
      const panelHeight = panel.minimized ? MINIMIZED_HEIGHT : panel.height;
      const maxX = Math.max(0, bounds.width - panelWidth);
      const maxY = Math.max(0, bounds.height - panelHeight);
      const nextX = clamp(originX + (moveEvent.clientX - startX), 0, maxX);
      const nextY = clamp(originY + (moveEvent.clientY - startY), 0, maxY);
      setChartPanelRect(panel.id, { x: nextX, y: nextY });
    };

    const handleUp = () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
  }, [bringChartToFront, panel, setChartPanelRect]);

  const handleResizeStart = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    bringChartToFront(panel.id);
    const startX = event.clientX;
    const startY = event.clientY;
    const startWidth = panel.width;
    const startHeight = panel.height;

    const handleMove = (moveEvent: PointerEvent) => {
      const bounds = getMapBounds();
      const nextWidth = clamp(
        startWidth + (moveEvent.clientX - startX),
        MIN_PANEL_WIDTH,
        Math.max(MIN_PANEL_WIDTH, bounds.width - panel.x),
      );
      const nextHeight = clamp(
        startHeight + (moveEvent.clientY - startY),
        MIN_PANEL_HEIGHT,
        Math.max(MIN_PANEL_HEIGHT, bounds.height - panel.y),
      );
      setChartPanelRect(panel.id, { width: nextWidth, height: nextHeight });
    };

    const handleUp = () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
  }, [bringChartToFront, panel, setChartPanelRect]);

  // Computed stats from the actual time series data
  const stats = useMemo(() => {
    if (data.length === 0) return null;
    let min = Infinity, max = -Infinity, sum = 0, count = 0;
    for (const p of data) {
      if (p.value < min) min = p.value;
      if (p.value > max) max = p.value;
      sum += p.value;
      count++;
    }
    return {
      min, max,
      avg: count > 0 ? sum / count : 0,
      count,
    };
  }, [data]);

  // CSV export
  const handleExportCSV = useCallback(() => {
    if (!summary || data.length === 0) return;
    const header = 'timestamp_utc,value\n';
    const rows = data.map(p =>
      `${new Date(p.timestamp).toISOString()},${p.value}`,
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${displayName}_${summary.datastream_name.replace(/\s+/g, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [data, summary, displayName]);

  // ECharts init + update
  useEffect(() => {
    if (panel.minimized) return;
    if (!chartRef.current || data.length === 0) return;

    // If the container DOM changed (e.g., remounted during loading transition),
    // dispose the stale instance so we create a fresh one below.
    if (chartInstanceRef.current && chartInstanceRef.current.getDom() !== chartRef.current) {
      chartInstanceRef.current.dispose();
      chartInstanceRef.current = null;
    }

    // Initialize if needed
    if (!chartInstanceRef.current) {
      chartInstanceRef.current = echarts.init(chartRef.current);
    }

    const timestamps = data.map(p => new Date(p.timestamp).toISOString());
    const values = data.map(p => p.value);

    const valMin = stats?.min ?? 0;
    const valMax = stats?.max ?? 0;
    const range = valMax - valMin;

    const option: echarts.EChartsOption = {
      animation: false,
      tooltip: {
        trigger: 'axis',
        formatter: (params: unknown) => {
          const arr = params as { name: string; value: number }[];
          if (!arr?.length) return '';
          const p = arr[0];
          const date = new Date(p.name);
          const formatted = date.toLocaleString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
            hour: 'numeric', minute: '2-digit', hour12: true,
          });
          const val = typeof p.value === 'number' ? p.value.toFixed(2) : p.value;
          return `${formatted}<br/>${summary?.datastream_name}: ${val} ${summary?.unit ?? ''}`;
        },
      },
      grid: {
        left: '12%', right: '4%', top: '8%', bottom: '22%',
      },
      dataZoom: [
        {
          type: 'slider', show: true, xAxisIndex: [0],
          start: 0, end: 100, height: 30, bottom: 16,
          borderColor: '#99f6e4', fillerColor: 'rgba(20, 184, 166, 0.12)',
          handleStyle: { color: '#14b8a6', borderColor: '#14b8a6' },
          showDataShadow: true, showDetail: false,
        },
        { type: 'inside', xAxisIndex: [0], start: 0, end: 100 },
      ],
      xAxis: {
        type: 'category', data: timestamps,
        axisLine: { lineStyle: { color: '#94a3b8' } },
        axisLabel: {
          formatter: (v: string) => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          rotate: 0, fontSize: 11, color: '#475569',
        },
      },
      yAxis: {
        type: 'value',
        name: summary?.unit ?? '',
        nameLocation: 'middle', nameGap: 36,
        nameTextStyle: { fontSize: 11, color: '#475569' },
        min: valMin - range * 0.05,
        max: valMax + range * 0.05,
        axisLine: { lineStyle: { color: '#94a3b8' } },
        splitLine: { lineStyle: { color: '#cbd5e1' } },
        axisLabel: { fontSize: 11, color: '#475569', formatter: (v: number) => v.toFixed(1) },
      },
      series: [{
        data: values, type: 'line', smooth: false, symbol: 'none',
        lineStyle: { color: '#14b8a6', width: 2 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(20, 184, 166, 0.25)' },
            { offset: 1, color: 'rgba(20, 184, 166, 0.02)' },
          ]),
        },
      }],
    };

    chartInstanceRef.current.setOption(option, { notMerge: true });
    chartInstanceRef.current.resize();
  }, [data, summary, stats, panel.minimized]);

  // Resize handler
  useEffect(() => {
    const handleResize = () => chartInstanceRef.current?.resize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (panel.minimized) return;
    chartInstanceRef.current?.resize();
  }, [panel.width, panel.height, panel.minimized]);

  useEffect(() => {
    const bounds = getMapBounds();
    const panelWidth = panel.minimized ? MINIMIZED_WIDTH : panel.width;
    const panelHeight = panel.minimized ? MINIMIZED_HEIGHT : panel.height;
    const maxX = Math.max(0, bounds.width - panelWidth);
    const maxY = Math.max(0, bounds.height - panelHeight);
    const clampedX = clamp(panel.x, 0, maxX);
    const clampedY = clamp(panel.y, 0, maxY);
    const clampedWidth = clamp(panel.width, MIN_PANEL_WIDTH, Math.max(MIN_PANEL_WIDTH, bounds.width - clampedX));
    const clampedHeight = clamp(panel.height, MIN_PANEL_HEIGHT, Math.max(MIN_PANEL_HEIGHT, bounds.height - clampedY));
    if (
      clampedX !== panel.x
      || clampedY !== panel.y
      || clampedWidth !== panel.width
      || clampedHeight !== panel.height
    ) {
      setChartPanelRect(panel.id, {
        x: clampedX,
        y: clampedY,
        width: clampedWidth,
        height: clampedHeight,
      });
    }
  }, [panel, setChartPanelRect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      chartInstanceRef.current?.dispose();
      chartInstanceRef.current = null;
    };
  }, []);

  if (panel.minimized) {
    return (
      <div
        id={`dendra-chart-panel-minimized-${safePanelId}`}
        className="absolute rounded-xl z-30 bg-white/65 backdrop-blur-2xl backdrop-saturate-150 border border-white/60 flex items-center"
        style={{
          left: panel.x,
          top: panel.y,
          width: MINIMIZED_WIDTH,
          height: MINIMIZED_HEIGHT,
          zIndex: panel.zIndex,
          boxShadow: '0 8px 32px -8px rgba(0,0,0,0.22), 0 0 0 1px rgba(255,255,255,0.35)',
          backdropFilter: 'blur(18px) saturate(160%)',
          WebkitBackdropFilter: 'blur(18px) saturate(160%)',
        }}
        onMouseDown={() => bringChartToFront(panel.id)}
      >
        <div
          id={`dendra-chart-panel-minimized-drag-handle-${safePanelId}`}
          className="flex w-full h-full items-center gap-3 px-3 cursor-move"
          onPointerDown={handleDragStart}
        >
          <div id={`dendra-chart-panel-minimized-icon-${safePanelId}`} className="w-7 h-7 bg-gradient-to-br from-teal-400 to-teal-600 rounded-lg flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-white" />
          </div>
          <div id={`dendra-chart-panel-minimized-text-${safePanelId}`} className="min-w-0">
            <p className="text-xs font-semibold text-slate-700 truncate">{displayName}</p>
            <p className="text-xs font-normal text-slate-500 truncate">
              {chartLabel || 'Measurement'} | {displayName} | {categoryLabel}
            </p>
          </div>
          <div id={`dendra-chart-panel-minimized-actions-${safePanelId}`} className="ml-auto flex items-center gap-1">
            <button
              id={`dendra-chart-expand-${safePanelId}`}
              type="button"
              onPointerDown={stopPanelControlEvent}
              onClick={() => toggleMinimizeChart(panel.id)}
              className="p-1.5 hover:bg-teal-100 rounded-lg transition-colors"
              title="Expand"
            >
              <Maximize2 className="w-4 h-4 text-slate-500" />
            </button>
            <button
              id={`dendra-chart-close-${safePanelId}`}
              type="button"
              onPointerDown={stopPanelControlEvent}
              onClick={() => closeChart(panel.id)}
              className="p-1.5 hover:bg-red-100 rounded-lg transition-colors"
              title="Close"
            >
              <X className="w-4 h-4 text-slate-500 hover:text-red-500" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      id={`dendra-time-series-panel-${safePanelId}`}
      className="absolute rounded-xl z-30 bg-white/65 backdrop-blur-2xl backdrop-saturate-150 border border-white/60 flex flex-col overflow-hidden"
      style={{
        left: panel.x,
        top: panel.y,
        width: panel.width,
        height: panel.height,
        zIndex: panel.zIndex,
        boxShadow: '0 8px 32px -8px rgba(0,0,0,0.22), 0 0 0 1px rgba(255,255,255,0.35)',
        backdropFilter: 'blur(18px) saturate(160%)',
        WebkitBackdropFilter: 'blur(18px) saturate(160%)',
      }}
      onMouseDown={() => bringChartToFront(panel.id)}
    >
      {/* Header */}
      <div
        id={`dendra-chart-header-${safePanelId}`}
        className="flex items-center justify-between px-4 py-2.5 border-b border-teal-300/70
                   bg-gradient-to-r from-teal-100/85 to-cyan-100/75 rounded-t-xl cursor-move"
        onPointerDown={handleDragStart}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-teal-400 to-teal-600 rounded-lg flex items-center justify-center shadow-sm">
            <BarChart3 className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              {chartLabel || 'Measurement'}
            </h3>
            <p className="text-sm text-slate-700">
              <span className="font-normal">Station: </span>
              <span className="font-semibold">{displayName}</span>
              <span className="font-normal"> | Category: </span>
              <span className="font-semibold">{categoryLabel}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            id={`dendra-chart-minimize-${safePanelId}`}
            onPointerDown={stopPanelControlEvent}
            onClick={() => toggleMinimizeChart(panel.id)}
            className="p-1.5 hover:bg-teal-100 rounded-lg transition-colors"
            title="Minimize"
          >
            <Minus className="w-4 h-4 text-slate-500" />
          </button>
          <button
            id={`dendra-chart-close-${safePanelId}`}
            onPointerDown={stopPanelControlEvent}
            onClick={() => closeChart(panel.id)}
            className="p-1.5 hover:bg-red-100 rounded-lg transition-colors"
            title="Close"
          >
            <X className="w-4 h-4 text-slate-500 hover:text-red-500" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div id={`dendra-chart-content-${safePanelId}`} className="flex-1 min-h-0 p-4 bg-white/45">
        {/* Loading */}
        {panel.loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-teal-500 mr-2" />
            <span className="text-sm text-slate-500">Loading time series data...</span>
          </div>
        )}

        {/* Error */}
        {panel.error && !panel.loading && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            <Activity className="w-4 h-4 flex-shrink-0" />
            {panel.error}
          </div>
        )}

        {/* No data */}
        {!panel.loading && !panel.error && data.length === 0 && (
          <div className="text-center py-12">
            <Activity className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-400">No time series data available.</p>
          </div>
        )}

        {/* Chart + Stats */}
        {!panel.loading && data.length > 0 && (
          <div className="flex gap-4 h-full">
            {/* Chart area */}
            <div className="flex-1 min-w-0 h-full">
              <div
                id={`dendra-echarts-${safePanelId}`}
                ref={chartRef}
                className="w-full h-full rounded-lg border border-slate-300/80 bg-white/70"
              />
            </div>

            {/* Stats sidebar */}
            {stats && summary && (
              <div id={`dendra-chart-stats-${safePanelId}`} className="w-32 flex flex-col gap-1.5 shrink-0">
                <StatBox
                  label="Avg"
                  value={formatValue(stats.avg, summary.unit)}
                  icon={<Activity className="w-3 h-3 text-teal-500" />}
                  highlight
                />
                <StatBox
                  label="Min"
                  value={formatValue(stats.min, summary.unit)}
                  icon={<TrendingDown className="w-3 h-3 text-blue-400" />}
                />
                <StatBox
                  label="Max"
                  value={formatValue(stats.max, summary.unit)}
                  icon={<TrendingUp className="w-3 h-3 text-red-400" />}
                />
                <StatBox
                  label="Points"
                  value={stats.count.toLocaleString()}
                  icon={<BarChart3 className="w-3 h-3 text-slate-400" />}
                />

                {/* Actions */}
                <div className="mt-auto pt-1.5 space-y-1">
                  <button
                    id={`dendra-chart-export-csv-${safePanelId}`}
                    onClick={handleExportCSV}
                    className="w-full text-[10px] bg-white/90 hover:bg-white text-slate-700
                               border border-slate-300 font-medium py-1.5 px-2 rounded-lg
                               flex items-center justify-center gap-1 transition-colors"
                  >
                    <Download className="w-3 h-3" />
                    Export CSV
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        id={`dendra-chart-footer-${safePanelId}`}
        className="px-4 py-1.5 border-t border-slate-200/60 bg-slate-50/55 rounded-b-xl
                   flex items-center justify-between"
      >
        <span className="text-[10px] text-slate-700">
          Data from Dendra •{' '}
          {summary ? `${formatTimestamp(summary.first_reading_time)} — ${formatTimestamp(summary.last_reading_time)}` : ''}
        </span>
        <button
          id={`dendra-chart-minimize-footer-${safePanelId}`}
          onClick={() => toggleMinimizeChart(panel.id)}
          className="text-[10px] text-teal-600 hover:text-teal-700 font-medium
                     flex items-center gap-0.5"
        >
          <ChevronUp className="w-3 h-3" />
          Minimize
        </button>
      </div>

      <div
        id={`dendra-chart-resize-handle-${safePanelId}`}
        className="absolute bottom-0 right-0 h-8 w-8 cursor-se-resize rounded-tl-md bg-slate-200/85 text-slate-500 hover:bg-slate-300/90 hover:text-slate-700"
        style={{ zIndex: panel.zIndex + 1, touchAction: 'none' }}
        onPointerDown={handleResizeStart}
      >
        <svg id={`dendra-chart-resize-icon-${safePanelId}`} viewBox="0 0 16 16" className="h-full w-full p-1.5">
          <path d="M6 14L14 6M10 14L14 10M2 14L14 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────

function StatBox({
  label, value, icon, highlight,
}: {
  label: string; value: string; icon: ReactNode; highlight?: boolean;
}) {
  return (
    <div className={`text-center p-1.5 rounded-lg border ${
      highlight ? 'bg-teal-50/90 border-teal-200' : 'bg-slate-100/80 border-slate-200'
    }`}>
      <div className="flex items-center justify-center gap-1 mb-0.5">
        {icon}
        <span className="text-[9px] text-slate-600 uppercase tracking-wide">{label}</span>
      </div>
      <p className={`text-sm font-bold ${highlight ? 'text-teal-700' : 'text-slate-800'}`}>
        {value}
      </p>
    </div>
  );
}
