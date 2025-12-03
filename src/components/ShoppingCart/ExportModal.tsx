import React, { useState } from 'react';
import toast from 'react-hot-toast';
import JSZip from 'jszip';
import { Download, X, FileArchive } from 'lucide-react';
import { CartItem } from '../../types';
import { exportData } from '../../utils/exportUtils';
import { executeCartQuery } from '../../services/cartQueryExecutor';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onExportComplete?: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  cartItems,
  onExportComplete
}) => {
  // Store format selection for each cart item (by item ID)
  const [itemFormats, setItemFormats] = useState<Record<string, 'csv' | 'json' | 'geojson'>>(() => {
    // Initialize all items to CSV by default
    return cartItems.reduce((acc, item) => ({ ...acc, [item.id]: 'csv' }), {});
  });
  const [exportMode, setExportMode] = useState<'separate' | 'zip'>('zip');
  const [isExporting, setIsExporting] = useState(false);

  // Update formats when cart items change
  React.useEffect(() => {
    setItemFormats(prev => {
      const updated = { ...prev };
      cartItems.forEach(item => {
        if (!updated[item.id]) {
          updated[item.id] = 'csv';
        }
      });
      return updated;
    });
  }, [cartItems]);

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      const timestamp = Date.now();
      
      if (exportMode === 'zip') {
        // Create ZIP file with all queries
        const zip = new JSZip();
        
        for (let i = 0; i < cartItems.length; i++) {
          const item = cartItems[i];
          const format = itemFormats[item.id] || 'csv';
          console.log(`Adding to ZIP: ${i + 1}/${cartItems.length}: ${item.title} (${format.toUpperCase()})`);
          
          const data = await executeCartQuery(item);
          const filename = `${item.dataSource}-${timestamp}-${i + 1}`;
          
          if (data.length > 0) {
            // Add file in selected format
            if (format === 'csv') {
              const csvContent = dataToCSV(data);
              zip.file(`${filename}.csv`, csvContent);
            } else if (format === 'json') {
              const jsonContent = JSON.stringify(data, null, 2);
              zip.file(`${filename}.json`, jsonContent);
            } else if (format === 'geojson') {
              const geoJsonContent = dataToGeoJSON(data);
              zip.file(`${filename}.geojson`, JSON.stringify(geoJsonContent, null, 2));
            }
          }
        }
        
        // Generate and download ZIP file
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(zipBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `tnc-export-${timestamp}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
      } else {
        // Download each query separately (individual downloads)
        for (let i = 0; i < cartItems.length; i++) {
          const item = cartItems[i];
          const format = itemFormats[item.id] || 'csv';
          console.log(`Exporting: ${i + 1}/${cartItems.length}: ${item.title} (${format.toUpperCase()})`);
          
          const data = await executeCartQuery(item);
          const filename = `${item.dataSource}-${timestamp}-${i + 1}`;
          exportData(data, format, filename);
        }
      }
      
      toast.success(`Successfully exported ${cartItems.length} ${cartItems.length === 1 ? 'query' : 'queries'}!`, {
        duration: 3000,
        position: 'bottom-right',
      });
      onExportComplete?.();
      onClose();
      
    } catch (error: any) {
      console.error('Error exporting data:', error);
      toast.error(`Failed to export data: ${error.message}`, {
        duration: 5000,
        position: 'bottom-right',
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Helper functions for data conversion
  const flattenObject = (obj: any, prefix = ''): Record<string, any> => {
    const flattened: Record<string, any> = {};
    
    for (const key in obj) {
      if (!obj.hasOwnProperty(key)) continue;
      
      const value = obj[key];
      const newKey = prefix ? `${prefix}.${key}` : key;
      
      if (value === null || value === undefined) {
        flattened[newKey] = '';
      } else if (Array.isArray(value)) {
        // Special case: coordinate arrays [lng, lat] or [lon, lat]
        if ((key === 'coordinates' || key === 'coords') && value.length === 2 && typeof value[0] === 'number' && typeof value[1] === 'number') {
          const coordPrefix = prefix || 'location';
          flattened[`${coordPrefix}.longitude`] = value[0];
          flattened[`${coordPrefix}.latitude`] = value[1];
        } else {
          // Other arrays: serialize as JSON
          flattened[newKey] = JSON.stringify(value);
        }
      } else if (typeof value === 'object' && value.constructor === Object) {
        // Recursively flatten nested objects
        Object.assign(flattened, flattenObject(value, newKey));
      } else {
        flattened[newKey] = value;
      }
    }
    
    return flattened;
  };

  const formatColumnHeader = (fieldName: string): string => {
    return fieldName
      .split(/[._]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
      .replace(/\bId\b/g, 'ID')
      .replace(/\bUrl\b/g, 'URL')
      .replace(/\bUri\b/g, 'URI')
      .replace(/\bApi\b/g, 'API')
      .replace(/\bGps\b/g, 'GPS');
  };

  const dataToCSV = (data: any[]): string => {
    if (data.length === 0) return '';
    
    // Flatten all objects first
    const flattenedData = data.map(item => flattenObject(item));
    
    // Get all unique keys
    const allKeys = new Set<string>();
    flattenedData.forEach(item => {
      Object.keys(item).forEach(key => allKeys.add(key));
    });
    
    const headers = Array.from(allKeys);
    const readableHeaders = headers.map(formatColumnHeader);
    
    const escapeCSVValue = (value: any): string => {
      if (value === null || value === undefined || value === '') return '';
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };
    
    const csvRows = [
      readableHeaders.join(','),
      ...flattenedData.map(row => 
        headers.map(header => escapeCSVValue(row[header])).join(',')
      )
    ];
    return csvRows.join('\n');
  };

  const dataToGeoJSON = (data: any[]): any => {
    return {
      type: 'FeatureCollection',
      features: data.map(item => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: item.coordinates || [item.longitude, item.latitude]
        },
        properties: Object.fromEntries(
          Object.entries(item).filter(([key]) => 
            key !== 'coordinates' && key !== 'latitude' && key !== 'longitude'
          )
        )
      }))
    };
  };

  if (!isOpen) return null;

  return (
    <div 
      id="export-modal-overlay"
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        id="export-modal-content"
        className="bg-white rounded-lg max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Export Data</h2>
          <button 
            id="export-modal-close"
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            aria-label="Close export modal"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Summary */}
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-900">
            <span className="font-medium">{cartItems.length}</span> {cartItems.length === 1 ? 'query' : 'queries'}
            {cartItems.length > 0 && (
              <>
                {' • '}
                <span className="font-medium">
                  {cartItems.reduce((sum, item) => sum + (item.estimatedCount || 0), 0).toLocaleString()}
                </span> estimated records
              </>
            )}
          </p>
        </div>

        {/* Query List with Format Selectors */}
        <div className="mb-4 max-h-64 overflow-y-auto">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Export Formats
          </label>
          <div className="space-y-2">
            {cartItems.map((item, index) => (
              <div key={item.id} className="p-3 border border-gray-200 rounded-lg bg-gray-50">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {index + 1}. {item.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      {item.estimatedCount?.toLocaleString() || 0} records
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setItemFormats(prev => ({ ...prev, [item.id]: 'csv' }))}
                      className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                        itemFormats[item.id] === 'csv'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                      }`}
                      title="Export as CSV"
                    >
                      CSV
                    </button>
                    <button
                      onClick={() => setItemFormats(prev => ({ ...prev, [item.id]: 'json' }))}
                      className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                        itemFormats[item.id] === 'json'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                      }`}
                      title="Export as JSON"
                    >
                      JSON
                    </button>
                    <button
                      onClick={() => setItemFormats(prev => ({ ...prev, [item.id]: 'geojson' }))}
                      className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                        itemFormats[item.id] === 'geojson'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                      }`}
                      title="Export as GeoJSON"
                    >
                      GeoJSON
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Export Mode */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Export Mode
          </label>
          <div className="space-y-2">
            <label className="flex items-center cursor-pointer">
              <input
                id="export-mode-zip"
                type="radio"
                checked={exportMode === 'zip'}
                onChange={() => setExportMode('zip')}
                className="mr-2 cursor-pointer"
              />
              <span className="text-sm text-gray-700">
                <FileArchive className="w-4 h-4 inline mr-1" />
                ZIP archive (recommended)
              </span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                id="export-mode-separate"
                type="radio"
                checked={exportMode === 'separate'}
                onChange={() => setExportMode('separate')}
                className="mr-2 cursor-pointer"
              />
              <span className="text-sm text-gray-700">
                Separate downloads ({cartItems.length} {cartItems.length === 1 ? 'file' : 'files'})
              </span>
            </label>
          </div>
          {exportMode === 'separate' && cartItems.length > 1 && (
            <p className="mt-2 text-xs text-yellow-700 bg-yellow-50 p-2 rounded">
              ⚠️ Browser may block multiple downloads. Consider using ZIP archive.
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            id="export-cancel-button"
            onClick={onClose}
            disabled={isExporting}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            id="export-confirm-button"
            onClick={handleExport}
            disabled={isExporting || cartItems.length === 0}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Export
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

