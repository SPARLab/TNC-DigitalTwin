// ============================================================================
// DendraPinnedMultiSeriesPanel — Floating saved browse/overview charts on the map.
// Drag, resize, minimize/expand-to-modal, close. Renders DendraMultiSeriesChart snapshots.
// ============================================================================

import { useCallback, useEffect, type PointerEvent as ReactPointerEvent } from 'react';
import { ChevronDown, ChevronRight, Maximize2, Pin, X } from 'lucide-react';
import { useDendra } from '../../../context/DendraContext';
import { useLayers } from '../../../context/LayerContext';
import { DendraMultiSeriesChart } from '../../RightSidebar/Dendra/DendraMultiSeriesChart';

const MIN_PANEL_WIDTH = 420;
const MIN_PANEL_HEIGHT = 360;
const MINIMIZED_WIDTH = 360;
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

export function DendraPinnedMultiSeriesPanel() {
  const { pinnedMultiCharts } = useDendra();

  if (pinnedMultiCharts.length === 0) return null;

  return (
    <>
      {pinnedMultiCharts
        .slice()
        .sort((a, b) => a.zIndex - b.zIndex)
        .map((panel) => (
          <PinnedMultiChartPanel key={panel.id} panelId={panel.id} />
        ))}
    </>
  );
}

function PinnedMultiChartPanel({ panelId }: { panelId: string }) {
  const {
    pinnedMultiCharts,
    closePinnedMultiChart,
    toggleMinimizePinnedMultiChart,
    setPinnedMultiChartRect,
    bringPinnedMultiChartToFront,
    requestExpandPinnedMultiChart,
  } = useDendra();
  const { requestBrowseTab } = useLayers();
  const panel = pinnedMultiCharts.find((candidate) => candidate.id === panelId);
  if (!panel) return null;

  const safePanelId = panel.id.replace(/[^a-zA-Z0-9-_]/g, '-');
  const rangeLabel = panel.startDate && panel.endDate
    ? `${panel.startDate} — ${panel.endDate}`
    : null;

  const stopPanelControlEvent = (event: ReactPointerEvent<HTMLElement>) => {
    event.stopPropagation();
  };

  const handleExpandToModal = () => {
    requestExpandPinnedMultiChart(panel.id);
    if (panel.origin === 'browse') {
      requestBrowseTab();
    }
  };

  const handleDragStart = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest('button')) return;
    event.preventDefault();
    event.stopPropagation();
    bringPinnedMultiChartToFront(panel.id);
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
      setPinnedMultiChartRect(panel.id, { x: nextX, y: nextY });
    };

    const handleUp = () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
  }, [bringPinnedMultiChartToFront, panel, setPinnedMultiChartRect]);

  const handleResizeStart = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    bringPinnedMultiChartToFront(panel.id);
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
      setPinnedMultiChartRect(panel.id, { width: nextWidth, height: nextHeight });
    };

    const handleUp = () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
  }, [bringPinnedMultiChartToFront, panel, setPinnedMultiChartRect]);

  useEffect(() => {
    const bounds = getMapBounds();
    const panelWidth = panel.minimized ? MINIMIZED_WIDTH : panel.width;
    const panelHeight = panel.minimized ? MINIMIZED_HEIGHT : panel.height;
    const maxX = Math.max(0, bounds.width - panelWidth);
    const maxY = Math.max(0, bounds.height - panelHeight);
    const clampedX = clamp(panel.x, 0, maxX);
    const clampedY = clamp(panel.y, 0, maxY);
    if (clampedX !== panel.x || clampedY !== panel.y) {
      setPinnedMultiChartRect(panel.id, { x: clampedX, y: clampedY });
    }
  }, [panel, setPinnedMultiChartRect]);

  if (panel.minimized) {
    return (
      <div
        id={`dendra-pinned-multi-minimized-${safePanelId}`}
        className="absolute rounded-xl z-30 bg-white/65 backdrop-blur-2xl border border-white/60 flex items-center"
        style={{
          left: panel.x,
          top: panel.y,
          width: MINIMIZED_WIDTH,
          height: MINIMIZED_HEIGHT,
          zIndex: panel.zIndex,
          boxShadow: '0 8px 32px -8px rgba(0,0,0,0.22)',
        }}
        onMouseDown={() => bringPinnedMultiChartToFront(panel.id)}
      >
        <div
          className="flex h-full w-full cursor-move items-center gap-3 px-3"
          onPointerDown={handleDragStart}
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-teal-400 to-teal-600">
            <Pin className="h-3.5 w-3.5 fill-white text-white" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-slate-700">{panel.title}</p>
            <p className="truncate text-[11px] text-slate-500">
              {panel.series.length} series{rangeLabel ? ` · ${rangeLabel}` : ''}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              onPointerDown={stopPanelControlEvent}
              onClick={handleExpandToModal}
              className="rounded-lg px-2 py-1 text-[11px] font-medium text-teal-700 hover:bg-teal-100"
              title="Open in modal"
            >
              Expand
            </button>
            <button
              type="button"
              onPointerDown={stopPanelControlEvent}
              onClick={() => toggleMinimizePinnedMultiChart(panel.id)}
              className="rounded-lg p-1.5 hover:bg-teal-100"
              title="Restore panel"
            >
              <ChevronRight className="h-4 w-4 text-slate-500" />
            </button>
            <button
              type="button"
              onPointerDown={stopPanelControlEvent}
              onClick={() => closePinnedMultiChart(panel.id)}
              className="rounded-lg p-1.5 hover:bg-red-100"
              title="Close"
            >
              <X className="h-4 w-4 text-slate-500 hover:text-red-500" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      id={`dendra-pinned-multi-${safePanelId}`}
      className="absolute z-30 flex flex-col overflow-hidden rounded-xl border border-white/60 bg-white/70 backdrop-blur-2xl"
      style={{
        left: panel.x,
        top: panel.y,
        width: panel.width,
        height: panel.height,
        zIndex: panel.zIndex,
        boxShadow: '0 8px 32px -8px rgba(0,0,0,0.22)',
      }}
      onMouseDown={() => bringPinnedMultiChartToFront(panel.id)}
    >
      <div
        className="flex shrink-0 cursor-move items-center justify-between border-b border-teal-200/70 bg-gradient-to-r from-teal-100/85 to-cyan-100/75 px-3 py-2"
        onPointerDown={handleDragStart}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <Pin className="h-3.5 w-3.5 shrink-0 fill-teal-700 text-teal-700" />
            <h3 className="truncate text-sm font-bold text-slate-900">{panel.title}</h3>
          </div>
          <p className="truncate text-[11px] text-slate-600">
            {panel.subtitle || `${panel.series.length} series`}
            {rangeLabel ? ` · ${rangeLabel}` : ''}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onPointerDown={stopPanelControlEvent}
            onClick={handleExpandToModal}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-teal-800 hover:bg-teal-100"
            title="Open full chart editor"
          >
            <Maximize2 className="h-3.5 w-3.5" />
            Expand
          </button>
          <button
            type="button"
            onPointerDown={stopPanelControlEvent}
            onClick={() => toggleMinimizePinnedMultiChart(panel.id)}
            className="rounded-lg p-1.5 hover:bg-teal-100"
            title="Minimize"
          >
            <ChevronDown className="h-4 w-4 text-slate-500" />
          </button>
          <button
            type="button"
            onPointerDown={stopPanelControlEvent}
            onClick={() => closePinnedMultiChart(panel.id)}
            className="rounded-lg p-1.5 hover:bg-red-100"
            title="Close"
          >
            <X className="h-4 w-4 text-slate-500 hover:text-red-500" />
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white/50 p-3">
        {panel.series.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">No series in this saved chart.</p>
        ) : (
          <DendraMultiSeriesChart
            series={panel.series}
            unit={panel.unit}
            fillContainer
            showStats
            enableZoom
            showRawDataCaution
            className="h-full min-h-0"
          />
        )}
      </div>

      <div
        className="absolute bottom-0 right-0 h-8 w-8 cursor-se-resize rounded-tl-md bg-slate-200/85 text-slate-500 hover:bg-slate-300/90"
        style={{ zIndex: panel.zIndex + 1, touchAction: 'none' }}
        onPointerDown={handleResizeStart}
      >
        <svg viewBox="0 0 16 16" className="h-full w-full p-1.5">
          <path d="M6 14L14 6M10 14L14 10M2 14L14 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}
