import React, { useState } from 'react';
import { Download, X, FileText, Braces, Map } from 'lucide-react';
import { CartItem } from '../../types';
import { exportData } from '../../utils/exportUtils';

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
  const [selectedFormat, setSelectedFormat] = useState<'csv' | 'json' | 'geojson'>('csv');
  const [exportMode, setExportMode] = useState<'combined' | 'separate'>('combined');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = () => {
    setIsExporting(true);
    
    try {
      if (exportMode === 'combined') {
        // Combine all cart items into single file
        const allData = cartItems.flatMap(item => item.previewData || []);
        const timestamp = Date.now();
        exportData(allData, selectedFormat, `tnc-data-export-${timestamp}`);
      } else {
        // Create separate files for each data source
        cartItems.forEach((item, index) => {
          const timestamp = Date.now();
          const filename = `${item.dataSource}-${timestamp}-${index + 1}`;
          exportData(item.previewData || [], selectedFormat, filename);
        });
      }
      
      onExportComplete?.();
      onClose();
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
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
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Summary */}
        <div className="mb-6 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-900">
            <span className="font-medium">{cartItems.length}</span> {cartItems.length === 1 ? 'query' : 'queries'} • 
            <span className="font-medium ml-1">
              {cartItems.reduce((sum, item) => sum + item.itemCount, 0).toLocaleString()}
            </span> total records
          </p>
        </div>

        {/* Format Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Export Format
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              id="format-csv-button"
              onClick={() => setSelectedFormat('csv')}
              className={`p-3 border rounded-lg flex flex-col items-center gap-1 transition-colors ${
                selectedFormat === 'csv'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <FileText className="w-5 h-5" />
              <span className="text-xs font-medium">CSV</span>
            </button>
            <button
              id="format-json-button"
              onClick={() => setSelectedFormat('json')}
              className={`p-3 border rounded-lg flex flex-col items-center gap-1 transition-colors ${
                selectedFormat === 'json'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <Braces className="w-5 h-5" />
              <span className="text-xs font-medium">JSON</span>
            </button>
            <button
              id="format-geojson-button"
              onClick={() => setSelectedFormat('geojson')}
              className={`p-3 border rounded-lg flex flex-col items-center gap-1 transition-colors ${
                selectedFormat === 'geojson'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <Map className="w-5 h-5" />
              <span className="text-xs font-medium">GeoJSON</span>
            </button>
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
                id="export-mode-combined"
                type="radio"
                checked={exportMode === 'combined'}
                onChange={() => setExportMode('combined')}
                className="mr-2 cursor-pointer"
              />
              <span className="text-sm text-gray-700">
                Single combined file
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
                Separate files per query ({cartItems.length} files)
              </span>
            </label>
          </div>
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

