import { useEffect, useRef, useMemo, useState } from 'react';
import * as echarts from 'echarts';
import { FileSpreadsheet, FileDown } from 'lucide-react';
import type { DendraStation, DendraDatastream, DendraDatapoint } from '../types';

// Props for Dendra details sidebar including blank state management
interface DendraDetailsSidebarProps {
  station: DendraStation | null;
  selectedDatastream: DendraDatastream | null;
  availableDatastreams: DendraDatastream[];
  datapoints: DendraDatapoint[];
  isLoadingDatapoints: boolean;
  isLoadingHistorical?: boolean;
  onDatastreamChange: (datastreamId: number) => void;
  onShowStationDashboard?: () => void;
  onShowStationDetails?: () => void;
  hasSearched?: boolean;
  isLoading?: boolean;
  loadProgress?: {
    current: number;
    total: number;
  };
  onExportCSV?: () => void;
  onExportExcel?: () => void;
}

export default function DendraDetailsSidebar({
  station,
  selectedDatastream,
  availableDatastreams,
  datapoints,
  isLoadingDatapoints,
  isLoadingHistorical = false,
  onDatastreamChange,
  onShowStationDashboard,
  onShowStationDetails,
  hasSearched = false,
  isLoading = false,
  loadProgress,
  onExportCSV,
  onExportExcel,
}: DendraDetailsSidebarProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);
  const isInitializingRef = useRef(false);
  const lastUpdateRef = useRef<number>(0);
  const [chartReady, setChartReady] = useState(false);
  
  // Time window state (in days, null = full dataset)
  const [timeWindowDays, setTimeWindowDays] = useState<number | null>(30); // Default to last 30 days
  
  // Zoom window state for displaying date range labels
  const [zoomStartDate, setZoomStartDate] = useState<string>('');
  const [zoomEndDate, setZoomEndDate] = useState<string>('');
  
  // Debounce timer for y-axis adjustment
  const zoomDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Reset to "Last Month" when datastream changes
  useEffect(() => {
    setTimeWindowDays(30);
  }, [selectedDatastream?.id]);
  
  // Calculate available data range to enable/disable buttons
  const dataTimeRangeDays = useMemo(() => {
    if (datapoints.length === 0) return 0;
    
    let oldestTimestamp = Infinity;
    let newestTimestamp = -Infinity;
    
    for (const dp of datapoints) {
      if (dp.timestamp_utc < oldestTimestamp) oldestTimestamp = dp.timestamp_utc;
      if (dp.timestamp_utc > newestTimestamp) newestTimestamp = dp.timestamp_utc;
    }
    
    if (oldestTimestamp === Infinity || newestTimestamp === -Infinity) return 0;
    
    const rangeDays = (newestTimestamp - oldestTimestamp) / (24 * 60 * 60 * 1000);
    
    return rangeDays;
  }, [datapoints]);
  
  // Handle time window change and update zoom
  const handleTimeWindowChange = (days: number | null) => {
    setTimeWindowDays(days);
    
    // Calculate the zoom range based on time window
    if (chartInstanceRef.current && datapoints.length > 0) {
      if (days === null) {
        // Show full dataset
        chartInstanceRef.current.dispatchAction({
          type: 'dataZoom',
          start: 0,
          end: 100
        });
      } else {
        // Get newest timestamp (datapoints are sorted, so last element is newest)
        const newestTimestamp = datapoints[datapoints.length - 1].timestamp_utc;
        const cutoffTimestamp = newestTimestamp - (days * 24 * 60 * 60 * 1000);
        
        // Find the index where data starts for this time window
        let startIndex = 0;
        for (let i = datapoints.length - 1; i >= 0; i--) {
          if (datapoints[i].timestamp_utc < cutoffTimestamp) {
            startIndex = i + 1;
            break;
          }
        }
        
        // Calculate percentage
        const startPercent = (startIndex / datapoints.length) * 100;
        
        chartInstanceRef.current.dispatchAction({
          type: 'dataZoom',
          start: startPercent,
          end: 100
        });
      }
    }
  };
  
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
          bottom: '20%', // More space for dataZoom slider with labels below
        },
        dataZoom: [
          {
            type: 'slider',
            show: true,
            xAxisIndex: [0],
            start: 0,
            end: 100,
            height: 30,
            bottom: 10, // More space for labels below
            borderColor: '#e5e7eb',
            fillerColor: 'rgba(59, 130, 246, 0.15)',
            handleStyle: {
              color: '#3b82f6',
              borderColor: '#3b82f6',
            },
            moveHandleStyle: {
              color: '#3b82f6',
            },
            showDetail: false, // Hide text labels to prevent overflow
            showDataShadow: 'auto', // Show miniature chart for context
          },
          {
            type: 'inside',
            xAxisIndex: [0],
            start: 0,
            end: 100,
          },
        ],
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
          nameTextStyle: {
            fontSize: 12,
          },
          axisLabel: {
            fontSize: 11,
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
      
      // Listen for dataZoom events to update date labels and y-axis
      chartInstanceRef.current.on('dataZoom', (params: any) => {
        // Handle both 'inside' (mouse wheel) and 'slider' zoom events
        // 'inside' zoom events come in a batch array, 'slider' events are direct
        let start, end;
        
        if (params.batch && params.batch.length > 0) {
          // Mouse wheel / inside zoom - use first item in batch
          start = params.batch[0].start;
          end = params.batch[0].end;
        } else {
          // Slider zoom - direct properties
          start = params.start;
          end = params.end;
        }
        
        const startIdx = Math.floor((start / 100) * timestamps.length);
        const endIdx = Math.floor((end / 100) * timestamps.length) - 1;
        
        const startDate = timestamps[Math.max(0, startIdx)];
        const endDate = timestamps[Math.min(timestamps.length - 1, endIdx)];
        
        if (startDate && endDate) {
          setZoomStartDate(startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }));
          setZoomEndDate(endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }));
        }
        
        // Debounce y-axis adjustment - wait 400ms after user stops zooming
        if (zoomDebounceTimerRef.current) {
          clearTimeout(zoomDebounceTimerRef.current);
        }
        
        zoomDebounceTimerRef.current = setTimeout(() => {
          if (!chartInstanceRef.current) return;
          
          // Calculate min/max for visible data range only
          const visibleStartIdx = Math.max(0, startIdx);
          const visibleEndIdx = Math.min(datapoints.length - 1, endIdx);
          
          let visibleMin = Infinity;
          let visibleMax = -Infinity;
          
          for (let i = visibleStartIdx; i <= visibleEndIdx; i++) {
            const value = datapoints[i].value;
            if (value != null && !isNaN(value)) {
              if (value < visibleMin) visibleMin = value;
              if (value > visibleMax) visibleMax = value;
            }
          }
          
          if (visibleMin !== Infinity && visibleMax !== -Infinity) {
            const visibleRange = visibleMax - visibleMin;
            const yMin = visibleMin - (visibleRange * 0.05); // 5% padding
            const yMax = visibleMax + (visibleRange * 0.05);
            
            chartInstanceRef.current.setOption({
              yAxis: {
                min: yMin,
                max: yMax
              }
            });
          }
        }, 400); // 400ms debounce
      });
      
      // Set initial date labels
      if (timestamps.length > 0) {
        setZoomStartDate(timestamps[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }));
        setZoomEndDate(timestamps[timestamps.length - 1].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }));
      }
      // After setting option, apply the time window zoom if not full dataset
      if (timeWindowDays !== null && datapoints.length > 0) {
        const newestTimestamp = datapoints[datapoints.length - 1].timestamp_utc;
        const cutoffTimestamp = newestTimestamp - (timeWindowDays * 24 * 60 * 60 * 1000);
        
        let startIndex = 0;
        for (let i = datapoints.length - 1; i >= 0; i--) {
          if (datapoints[i].timestamp_utc < cutoffTimestamp) {
            startIndex = i + 1;
            break;
          }
        }
        
        const startPercent = (startIndex / datapoints.length) * 100;
        
        chartInstanceRef.current.setOption({
          dataZoom: [{
            start: startPercent,
            end: 100
          }]
        });
      }
    } catch (error) {
      console.error('Error updating chart:', error);
    }
  }, [datapoints, selectedDatastream, isLoadingDatapoints, isLoadingHistorical, minValue, maxValue, chartReady, timeWindowDays]);

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

  // Different blank states based on search/loading status
  if (!station && !selectedDatastream) {
    // No search performed yet
    if (!hasSearched) {
      return (
        <div
          id="dendra-details-no-search"
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
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Search Yet
            </h3>
            <p className="text-sm text-gray-600">
              Search for a data item using the filters above to get started.
            </p>
          </div>
        </div>
      );
    }
    
    // Loading data
    if (isLoading) {
      return (
        <div
          id="dendra-details-loading"
          className="h-full flex items-center justify-center bg-gray-50 p-8 w-96"
        >
          <div className="text-center max-w-md">
            <div className="w-16 h-16 mx-auto mb-4 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Loading Data
            </h3>
            <p className="text-sm text-gray-600">
              Please select a data item once data finishes loading.
            </p>
          </div>
        </div>
      );
    }
    
    // Search complete, waiting for selection
    return (
      <div
        id="dendra-details-select-item"
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
            Select a Data Item
          </h3>
          <p className="text-sm text-gray-600">
            Click on a data item in the left sidebar to view details and options.
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

          {/* Dendra.science View Options */}
          {(onShowStationDashboard || onShowStationDetails) && (
            <div className="grid grid-cols-2 gap-2 mb-4">
              {/* Station Dashboard Button */}
              {onShowStationDashboard && (
                <button
                  id="dendra-station-dashboard-button"
                  onClick={onShowStationDashboard}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors"
                  title="View station status dashboard with live data"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Dendra Dashboard
                </button>
              )}
              
              {/* Station Details Button */}
              {onShowStationDetails && (
                <button
                  id="dendra-station-details-button"
                  onClick={onShowStationDetails}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-green-600 bg-green-50 hover:bg-green-100 border border-green-200 rounded-md transition-colors"
                  title="View complete station details and metadata"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Dendra Details
                </button>
              )}
            </div>
          )}

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
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Time Series Data {loadProgress ? `(Loading: ${loadProgress.current} points)` : ''}
            </h3>
            
            {/* Export Buttons */}
            {datapoints.length > 0 && (onExportCSV || onExportExcel) && (
              <div id="dendra-export-buttons" className="flex gap-2" role="group" aria-label="Data export options">
                {onExportCSV && (
                  <button
                    id="dendra-export-csv-btn"
                    onClick={onExportCSV}
                    aria-label={`Export ${datapoints.length} data points as CSV file`}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-green-50 text-green-700 rounded hover:bg-green-100 transition-colors border border-green-200"
                    title="Export data as CSV"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" aria-hidden="true" />
                    CSV
                  </button>
                )}
                {onExportExcel && (
                  <button
                    id="dendra-export-excel-btn"
                    onClick={onExportExcel}
                    aria-label={`Export ${datapoints.length} data points as Excel file`}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors border border-blue-200"
                    title="Export data as Excel (XLSX)"
                  >
                    <FileDown className="w-3.5 h-3.5" aria-hidden="true" />
                    Excel
                  </button>
                )}
              </div>
            )}
          </div>
          
          {/* Time Window Buttons */}
          {datapoints.length > 0 && (
            <div id="time-window-buttons" className="flex gap-2 mb-4 flex-wrap" role="group" aria-label="Time window selection">
              <button
                id="time-window-30-days"
                onClick={() => handleTimeWindowChange(30)}
                disabled={dataTimeRangeDays < 30 && !isLoadingHistorical}
                aria-pressed={timeWindowDays === 30}
                aria-label="Show last 30 days of data"
                className={`min-w-[3.75rem] px-1 py-1.5 text-xs font-medium rounded transition-colors ${
                  timeWindowDays === 30
                    ? 'bg-blue-600 text-white'
                    : dataTimeRangeDays < 30 && !isLoadingHistorical
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                title={dataTimeRangeDays < 30 && !isLoadingHistorical ? "Not enough data available" : "Show last 30 days"}
              >
                30 Days
              </button>
              <button
                id="time-window-3-months"
                onClick={() => handleTimeWindowChange(90)}
                disabled={isLoadingHistorical}
                aria-pressed={timeWindowDays === 90}
                aria-label="Show last 3 months of data"
                aria-disabled={isLoadingHistorical}
                className={`min-w-[3.75rem] px-1 py-1.5 text-xs font-medium rounded transition-colors ${
                  timeWindowDays === 90
                    ? 'bg-blue-600 text-white'
                    : isLoadingHistorical
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                title={isLoadingHistorical ? "Loading full dataset..." : "Show last 3 months"}
              >
                3 Months
              </button>
              <button
                id="time-window-6-months"
                onClick={() => handleTimeWindowChange(180)}
                disabled={isLoadingHistorical}
                aria-pressed={timeWindowDays === 180}
                aria-label="Show last 6 months of data"
                aria-disabled={isLoadingHistorical}
                className={`min-w-[3.75rem] px-1 py-1.5 text-xs font-medium rounded transition-colors ${
                  timeWindowDays === 180
                    ? 'bg-blue-600 text-white'
                    : isLoadingHistorical
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                title={isLoadingHistorical ? "Loading full dataset..." : "Show last 6 months"}
              >
                6 Months
              </button>
              <button
                id="time-window-1-year"
                onClick={() => handleTimeWindowChange(365)}
                disabled={isLoadingHistorical}
                aria-pressed={timeWindowDays === 365}
                aria-label="Show last year of data"
                aria-disabled={isLoadingHistorical}
                className={`min-w-[3.75rem] px-1 py-1.5 text-xs font-medium rounded transition-colors ${
                  timeWindowDays === 365
                    ? 'bg-blue-600 text-white'
                    : isLoadingHistorical
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                title={isLoadingHistorical ? "Loading full dataset..." : "Show last year"}
              >
                Year
              </button>
              <button
                id="time-window-full-dataset"
                onClick={() => handleTimeWindowChange(null)}
                disabled={isLoadingHistorical}
                aria-pressed={timeWindowDays === null}
                aria-label="Show full dataset"
                aria-disabled={isLoadingHistorical}
                className={`min-w-[3.75rem] px-1 py-1.5 text-xs font-medium rounded transition-colors ${
                  timeWindowDays === null
                    ? 'bg-blue-600 text-white'
                    : isLoadingHistorical
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                title={isLoadingHistorical ? "Loading full dataset..." : "Show all available data"}
              >
                Full
              </button>
            </div>
          )}
          
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
              <div className="relative border border-gray-200 rounded bg-white">
                <div
                  id="dendra-chart"
                  ref={chartRef}
                  className="w-full"
                  style={{ height: '350px', minHeight: '375px', width: '100%' }}
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
                
                {/* Date Range Labels Below Slider - Inside chart container */}
                {zoomStartDate && zoomEndDate && (
                  <div 
                    id="dendra-chart-date-range-labels" 
                    className="flex justify-between pl-14 pr-[0.5rem] pb-2 text-xs text-gray-500"
                    role="status"
                    aria-label={`Currently viewing data from ${zoomStartDate} to ${zoomEndDate}`}
                  >
                    <span id="dendra-chart-start-date" aria-label="Start date">{zoomStartDate}</span>
                    <span id="dendra-chart-end-date" aria-label="End date">{zoomEndDate}</span>
                  </div>
                )}
              </div>
              <div id="chart-stats" className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                  <div>
                    <span className="text-gray-500">Data Points:</span>
                    <div className="font-semibold text-gray-900">
                      {datapoints.length.toLocaleString()}
                    </div>
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
