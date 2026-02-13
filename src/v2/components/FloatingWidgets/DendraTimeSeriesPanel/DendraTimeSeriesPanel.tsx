// ============================================================================
// DendraTimeSeriesPanel — Floating time series chart overlaying the map.
//
// Positioned at the bottom of the map area. Shows an ECharts line chart
// with teal theming, dataZoom slider, stats sidebar, and minimize/close.
// Reads chart state from DendraContext.
// ============================================================================

import { useEffect, useRef, useMemo, useCallback } from 'react';
import * as echarts from 'echarts';
import {
  Minus, X, ChevronUp, Activity,
  TrendingDown, TrendingUp, Loader2,
  Download, BarChart3,
} from 'lucide-react';
import { useDendra } from '../../../context/DendraContext';
import { formatValue, formatTimestamp } from '../../../services/dendraStationService';

export function DendraTimeSeriesPanel() {
  const { chart } = useDendra();

  if (!chart.open) return null;

  return chart.minimized
    ? <MinimizedBar />
    : <ExpandedPanel />;
}

// ── Minimized bar ────────────────────────────────────────────────────────────

function MinimizedBar() {
  const { chart, toggleMinimizeChart, closeChart } = useDendra();
  const displayName = chart.station?.station_name?.replace(/^Dangermond_/, '').replace(/_/g, ' ') ?? '';

  return (
    <div
      id="dendra-chart-minimized"
      className="absolute bottom-4 right-4 rounded-xl z-30
                 bg-white/55 backdrop-blur-2xl backdrop-saturate-150 border border-white/50
                 cursor-pointer hover:shadow-xl transition-shadow"
      style={{
        boxShadow: '0 8px 32px -8px rgba(0,0,0,0.22), 0 0 0 1px rgba(255,255,255,0.35)',
        backdropFilter: 'blur(18px) saturate(160%)',
        WebkitBackdropFilter: 'blur(18px) saturate(160%)',
      }}
      onClick={toggleMinimizeChart}
    >
      <div className="flex items-center gap-3 px-4 py-2">
        <div className="w-7 h-7 bg-gradient-to-br from-teal-400 to-teal-600 rounded-lg flex items-center justify-center">
          <BarChart3 className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-700">{displayName}</p>
          <p className="text-[10px] text-slate-500">Click to expand chart</p>
        </div>
        <div className="ml-4 flex items-center gap-3 text-[10px]">
          <span className="text-teal-600 font-semibold">
            {chart.summary?.datastream_name}
          </span>
          <span className="text-slate-400">|</span>
          <span className="text-slate-500">
            {chart.data.length.toLocaleString()} points
          </span>
        </div>
        <button
          id="dendra-chart-minimized-close"
          className="ml-4 p-1 hover:bg-red-100 rounded transition-colors"
          onClick={e => { e.stopPropagation(); closeChart(); }}
          title="Close"
        >
          <X className="w-4 h-4 text-slate-400 hover:text-red-500" />
        </button>
      </div>
    </div>
  );
}

// ── Expanded panel ───────────────────────────────────────────────────────────

function ExpandedPanel() {
  const { chart, closeChart, toggleMinimizeChart } = useDendra();
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);

  const displayName = chart.station?.station_name?.replace(/^Dangermond_/, '').replace(/_/g, ' ') ?? '';
  const summary = chart.summary;
  const data = chart.data;
  const chartLabel = summary?.datastream_name ?? '';

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
    if (!chartRef.current || data.length === 0) return;

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
  }, [data, summary, stats]);

  // Resize handler
  useEffect(() => {
    const handleResize = () => chartInstanceRef.current?.resize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      chartInstanceRef.current?.dispose();
      chartInstanceRef.current = null;
    };
  }, []);

  return (
    <div
      id="dendra-time-series-panel"
      className="absolute bottom-8 right-4 w-[56rem] max-w-[calc(100%-2rem)] rounded-xl z-30
                 bg-white/65 backdrop-blur-2xl backdrop-saturate-150 border border-white/60
                 flex flex-col"
      style={{
        boxShadow: '0 8px 32px -8px rgba(0,0,0,0.22), 0 0 0 1px rgba(255,255,255,0.35)',
        backdropFilter: 'blur(18px) saturate(160%)',
        WebkitBackdropFilter: 'blur(18px) saturate(160%)',
        height: '50%',
        minHeight: '320px',
      }}
    >
      {/* Header */}
      <div
        id="dendra-chart-header"
        className="flex items-center justify-between px-4 py-2.5 border-b border-teal-300/70
                   bg-gradient-to-r from-teal-100/85 to-cyan-100/75 rounded-t-xl"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-teal-400 to-teal-600 rounded-lg flex items-center justify-center shadow-sm">
            <BarChart3 className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              {chartLabel || displayName}
            </h3>
            <p className="text-[10px] text-slate-700">
              {chartLabel || 'Measurement'} • {displayName}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            id="dendra-chart-minimize"
            onClick={toggleMinimizeChart}
            className="p-1.5 hover:bg-teal-100 rounded-lg transition-colors"
            title="Minimize"
          >
            <Minus className="w-4 h-4 text-slate-500" />
          </button>
          <button
            id="dendra-chart-close"
            onClick={closeChart}
            className="p-1.5 hover:bg-red-100 rounded-lg transition-colors"
            title="Close"
          >
            <X className="w-4 h-4 text-slate-500 hover:text-red-500" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div id="dendra-chart-content" className="flex-1 min-h-0 p-4 bg-white/45">
        {/* Loading */}
        {chart.loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-teal-500 mr-2" />
            <span className="text-sm text-slate-500">Loading time series data...</span>
          </div>
        )}

        {/* Error */}
        {chart.error && !chart.loading && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            <Activity className="w-4 h-4 flex-shrink-0" />
            {chart.error}
          </div>
        )}

        {/* No data */}
        {!chart.loading && !chart.error && data.length === 0 && (
          <div className="text-center py-12">
            <Activity className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-400">No time series data available.</p>
          </div>
        )}

        {/* Chart + Stats */}
        {!chart.loading && data.length > 0 && (
          <div className="flex gap-4 h-full">
            {/* Chart area */}
            <div className="flex-1 min-w-0 h-full">
              <div
                id="dendra-echarts"
                ref={chartRef}
                className="w-full h-full rounded-lg border border-slate-300/80 bg-white/70"
              />
            </div>

            {/* Stats sidebar */}
            {stats && summary && (
              <div id="dendra-chart-stats" className="w-32 flex flex-col gap-1.5 shrink-0">
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
                    id="dendra-chart-export-csv"
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
        id="dendra-chart-footer"
        className="px-4 py-1.5 border-t border-slate-200/60 bg-slate-50/55 rounded-b-xl
                   flex items-center justify-between"
      >
        <span className="text-[10px] text-slate-700">
          Data from Dendra •{' '}
          {summary ? `${formatTimestamp(summary.first_reading_time)} — ${formatTimestamp(summary.last_reading_time)}` : ''}
        </span>
        <button
          id="dendra-chart-expand"
          onClick={toggleMinimizeChart}
          className="text-[10px] text-teal-600 hover:text-teal-700 font-medium
                     flex items-center gap-0.5"
        >
          <ChevronUp className="w-3 h-3" />
          Minimize
        </button>
      </div>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────

function StatBox({
  label, value, icon, highlight,
}: {
  label: string; value: string; icon: React.ReactNode; highlight?: boolean;
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
