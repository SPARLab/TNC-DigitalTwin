import { useEffect, useRef, useMemo, useState } from 'react';
import * as echarts from 'echarts';
import type { DendraStation, DendraDatastream, DendraDatapoint } from '../types';

interface DendraDetailsSidebarProps {
  station: DendraStation | null;
  selectedDatastream: DendraDatastream | null;
  availableDatastreams: DendraDatastream[];
  datapoints: DendraDatapoint[];
  isLoadingDatapoints: boolean;
  isLoadingHistorical?: boolean;
  onDatastreamChange: (datastreamId: number) => void;
  loadProgress?: {
    current: number;
    total: number;
  };
}

export default function DendraDetailsSidebar({
  station,
  selectedDatastream,
  availableDatastreams,
  datapoints,
  isLoadingDatapoints,
  isLoadingHistorical = false,
  onDatastreamChange,
  loadProgress,
}: DendraDetailsSidebarProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);
  const isInitializingRef = useRef(false);
  const lastUpdateRef = useRef<number>(0);
  const [chartReady, setChartReady] = useState(false);
  
  // Memoize min/max calculations to avoid expensive operations on every render
  const { minValue, maxValue } = useMemo(() => {
    if (datapoints.length === 0) return { minValue: 0, maxValue: 0 };
    let min = Infinity;
    let max = -Infinity;
    for (const dp of datapoints) {
      // Skip null/undefined values
      if (dp.value != null && !isNaN(dp.value)) {
        if (dp.value < min) min = dp.value;
        if (dp.value > max) max = dp.value;
      }
    }
    // If no valid values found, return 0
    if (min === Infinity || max === -Infinity) {
      return { minValue: 0, maxValue: 0 };
    }
    return { minValue: min, maxValue: max };
  }, [datapoints]);

  // Effect to initialize chart when container becomes available
  useEffect(() => {
    if (!selectedDatastream || datapoints.length === 0) {
      return;
    }

    // Don't re-initialize if already initialized
    if (chartInstanceRef.current) {
      return;
    }

    // Don't start multiple initialization attempts
    if (isInitializingRef.current) {
      return;
    }

    if (!chartRef.current) {
      return;
    }

    isInitializingRef.current = true;

    // Initialize immediately when we have data - no delay!
    const initChart = () => {
      if (!chartRef.current) {
        isInitializingRef.current = false;
        return;
      }

      // Check if container has dimensions
      const rect = chartRef.current.getBoundingClientRect();
      
      if (rect.width === 0 || rect.height === 0) {
        console.warn('Chart container has no dimensions, retrying...');
        // Retry after a brief moment
        setTimeout(initChart, 50);
        return;
      }

      // Initialize chart
      try {
        chartInstanceRef.current = echarts.init(chartRef.current);
        isInitializingRef.current = false;
        // Trigger an immediate update by setting chartReady
        lastUpdateRef.current = 0;
        setChartReady(true);
      } catch (error) {
        console.error('Error initializing chart:', error);
        isInitializingRef.current = false;
      }
    };

    // Start initialization immediately
    initChart();

    return () => {
      isInitializingRef.current = false;
      setChartReady(false);
    };
  }, [selectedDatastream, datapoints.length]); // Only re-run if datastream changes or datapoints go from 0 to >0

  // Effect to update chart when datapoints change
  useEffect(() => {
    // If no data or chart not ready, nothing to render
    if (!selectedDatastream || datapoints.length === 0 || !chartReady || !chartInstanceRef.current) {
      return;
    }

    // Throttle updates only during historical loading to avoid excessive re-renders
    // Always update when initial load completes or historical load completes
    if (isLoadingHistorical && !isLoadingDatapoints) {
      // During historical loading, throttle updates to every 5 seconds
      const now = Date.now();
      const timeSinceLastUpdate = now - lastUpdateRef.current;
      if (timeSinceLastUpdate < 5000 && lastUpdateRef.current !== 0) {
        return; // Skip this update, too soon
      }
      lastUpdateRef.current = now;
    }

    try {
      const timestamps = datapoints.map(dp => new Date(dp.timestamp_utc));
      const values = datapoints.map(dp => dp.value);

      // Use memoized min/max values
      const range = maxValue - minValue;
      const yAxisMin = minValue - (range * 0.05); // 5% padding below
      const yAxisMax = maxValue + (range * 0.05); // 5% padding above

      const option: echarts.EChartsOption = {
        animation: false,
        title: {
          text: selectedDatastream.name,
          left: 'center',
          textStyle: {
            fontSize: 14,
            fontWeight: 'bold',
          },
        },
        tooltip: {
          trigger: 'axis',
          formatter: (params: any) => {
            if (!params || params.length === 0) return '';
            const param = params[0];
            const date = new Date(param.name);
            const formattedDate = date.toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            });
            const roundedValue = typeof param.value === 'number' ? param.value.toFixed(1) : param.value;
            return `${formattedDate}<br/>${selectedDatastream.variable}: ${roundedValue}${selectedDatastream.unit ? ' ' + selectedDatastream.unit : ''}`;
          },
        },
        grid: {
          left: '15%',
          right: '5%',
          top: '15%',
          bottom: '15%',
        },
        xAxis: {
          type: 'category',
          data: timestamps.map(t => t.toISOString()),
          axisLabel: {
            formatter: (value: string) => {
              const date = new Date(value);
              return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            },
            rotate: 45,
            fontSize: 10,
          },
        },
        yAxis: {
          type: 'value',
          name: selectedDatastream.variable + (selectedDatastream.unit ? ` (${selectedDatastream.unit})` : ''),
          nameLocation: 'middle',
          nameGap: 40,
          min: yAxisMin,
          max: yAxisMax,
          axisLabel: {
            fontSize: 10,
            formatter: (value: number) => {
              return value.toFixed(1);
            },
          },
        },
        series: [
          {
            data: values,
            type: 'line',
            smooth: false,
            symbol: 'none',
            lineStyle: {
              color: '#3b82f6',
              width: 2,
            },
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
                { offset: 1, color: 'rgba(59, 130, 246, 0.05)' },
              ]),
            },
          },
        ],
      };

      chartInstanceRef.current.setOption(option, { notMerge: true });
      chartInstanceRef.current.resize();
    } catch (error) {
      console.error('Error updating chart:', error);
    }
  }, [datapoints, selectedDatastream, isLoadingDatapoints, isLoadingHistorical, minValue, maxValue, chartReady]);

  // Cleanup chart when datastream changes or unmount
  useEffect(() => {
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.dispose();
        chartInstanceRef.current = null;
      }
      isInitializingRef.current = false;
    };
  }, [selectedDatastream?.id]); // Cleanup and reinitialize when datastream changes

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      chartInstanceRef.current?.resize();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // No selection state
  if (!station && !selectedDatastream) {
    return (
      <div
        id="dendra-details-empty-state"
        className="h-full flex items-center justify-center bg-gray-50 p-8 w-96"
      >
        <div className="text-center max-w-md">
          <svg
            className="w-16 h-16 mx-auto mb-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Select a Station or Datastream
          </h3>
          <p className="text-sm text-gray-600">
            Choose a station from the "By Station" tab or a datastream from the "By Datastream" tab
            to view time series data.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div id="dendra-details-sidebar" className="h-full flex flex-col bg-white overflow-y-auto w-96">
      {/* Station Info Section (when station is selected) */}
      {station && (
        <div id="station-info-section" className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-2">{station.name}</h2>
          {station.description && station.description.trim() !== '' && (
            <p className="text-sm text-gray-600 mb-4">{station.description}</p>
          )}
          
          <div className="grid grid-cols-2 gap-3 text-sm mb-4">
            <div>
              <span className="text-gray-500">Type:</span>
              <span className="ml-2 font-medium text-gray-900">{station.station_type}</span>
            </div>
            <div>
              <span className="text-gray-500">Timezone:</span>
              <span className="ml-2 font-medium text-gray-900">{station.time_zone}</span>
            </div>
            <div>
              <span className="text-gray-500">Latitude:</span>
              <span className="ml-2 font-medium text-gray-900">{station.latitude.toFixed(4)}</span>
            </div>
            <div>
              <span className="text-gray-500">Longitude:</span>
              <span className="ml-2 font-medium text-gray-900">{station.longitude.toFixed(4)}</span>
            </div>
          </div>

          {/* Datastream Dropdown */}
          <div>
            <label htmlFor="datastream-select" className="block text-sm font-medium text-gray-700 mb-2">
              Select Datastream
            </label>
            <select
              id="datastream-select"
              value={selectedDatastream?.id || ''}
              onChange={(e) => onDatastreamChange(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Choose a datastream --</option>
              {availableDatastreams.map(ds => (
                <option key={ds.id} value={ds.id}>
                  {ds.name} ({ds.variable} - {ds.medium})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Datastream Info Section (when datastream is selected directly) */}
      {selectedDatastream && !station && (
        <div id="datastream-info-section" className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-2">{selectedDatastream.name}</h2>
          {selectedDatastream.description && (
            <p className="text-sm text-gray-600 mb-4">{selectedDatastream.description}</p>
          )}
          
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
              {selectedDatastream.variable}
            </span>
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
              {selectedDatastream.medium}
            </span>
            {selectedDatastream.unit && (
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                {selectedDatastream.unit}
              </span>
            )}
          </div>

          <div className="text-sm text-gray-600">
            <div className="mb-1">
              <span className="font-medium">Source Type:</span> {selectedDatastream.source_type}
            </div>
            <div>
              <span className="font-medium">State:</span> {selectedDatastream.state}
            </div>
          </div>
        </div>
      )}

      {/* Chart Section */}
      {selectedDatastream && (
        <div id="chart-section" className="flex-1 flex flex-col p-6 min-h-0">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Time Series Data {loadProgress ? `(Loading: ${loadProgress.current} points)` : ''}
          </h3>
          
          {/* Loading State */}
          {isLoadingDatapoints && datapoints.length === 0 && (
            <div id="chart-loading-state" className="flex-1 flex flex-col items-center justify-center">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-sm text-gray-600">Loading initial data...</p>
            </div>
          )}

          {/* Chart */}
          {datapoints.length > 0 && (
            <>
              <div className="relative">
                <div
                  id="dendra-chart"
                  ref={chartRef}
                  className="w-full bg-white border border-gray-200 rounded"
                  style={{ height: '400px', minHeight: '400px', width: '100%' }}
                />
                {/* Background Loading Indicator - Positioned above chart */}
                {isLoadingHistorical && (
                  <div 
                    id="historical-loading-badge"
                    className="absolute -top-9 right-0 flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg shadow-sm"
                  >
                    <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-xs text-blue-700 font-medium">Loading historical data...</span>
                  </div>
                )}
              </div>
              <div id="chart-stats" className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                  <div>
                    <span className="text-gray-500">Data Points:</span>
                    <div className="font-semibold text-gray-900">{datapoints.length.toLocaleString()}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Min Value:</span>
                    <div className="font-semibold text-gray-900">
                      {minValue != null && isFinite(minValue)
                        ? minValue.toLocaleString(undefined, { maximumFractionDigits: 2 })
                        : 'N/A'}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Max Value:</span>
                    <div className="font-semibold text-gray-900">
                      {maxValue != null && isFinite(maxValue)
                        ? maxValue.toLocaleString(undefined, { maximumFractionDigits: 2 })
                        : 'N/A'}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">First Record:</span>
                    <div className="font-semibold text-gray-900 text-xs">
                      {isLoadingHistorical ? (
                        <span className="text-blue-600 italic">Loading...</span>
                      ) : datapoints.length > 0 ? (
                        new Date(datapoints[0].timestamp_utc).toLocaleString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit'
                        })
                      ) : (
                        'N/A'
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Last Record:</span>
                    <div className="font-semibold text-gray-900 text-xs">
                      {isLoadingHistorical ? (
                        <span className="text-blue-600 italic">Loading...</span>
                      ) : datapoints.length > 0 ? (
                        new Date(datapoints[datapoints.length - 1].timestamp_utc).toLocaleString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit'
                        })
                      ) : (
                        'N/A'
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* No Data State */}
          {!isLoadingDatapoints && datapoints.length === 0 && selectedDatastream && (
            <div id="no-data-state" className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <svg
                  className="w-12 h-12 mx-auto mb-3 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                <p className="text-sm text-gray-600">No data available</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
