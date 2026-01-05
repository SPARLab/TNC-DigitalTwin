import React, { useState, useEffect } from 'react';
import {
  X,
  ExternalLink,
  Calendar,
  MapPin,
  Users,
  Download,
  Tag,
  FileText,
  Loader2,
  Eye,
  Database,
  Building2,
  HardDrive,
  ShoppingCart,
} from 'lucide-react';
import {
  dataOneService,
  DataOneDataset,
  DataOneDatasetDetail,
  DataOneFileInfo,
} from '../services/dataOneService';

interface DataONEDetailsSidebarProps {
  dataset: DataOneDataset;
  onClose: () => void;
  onPreview?: () => void;
  onAddToCart?: () => void;
}

const DataONEDetailsSidebar: React.FC<DataONEDetailsSidebarProps> = ({
  dataset,
  onClose,
  onPreview,
  onAddToCart,
}) => {
  const [details, setDetails] = useState<DataOneDatasetDetail | null>(null);
  const [fileInfo, setFileInfo] = useState<DataOneFileInfo | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [loadingFiles, setLoadingFiles] = useState(false);

  // Fetch full details on mount
  useEffect(() => {
    const fetchDetails = async () => {
      setLoadingDetails(true);
      try {
        const detailData = await dataOneService.getDatasetDetails(dataset.dataoneId);
        setDetails(detailData);
      } catch (error) {
        console.error('Failed to fetch dataset details:', error);
      } finally {
        setLoadingDetails(false);
      }
    };
    fetchDetails();
  }, [dataset.dataoneId]);

  // Fetch file info on-demand
  const handleLoadFileInfo = async () => {
    if (fileInfo || loadingFiles) return;
    setLoadingFiles(true);
    try {
      const info = await dataOneService.getFileInfo(dataset.dataoneId);
      setFileInfo(info);
    } catch (error) {
      console.error('Failed to fetch file info:', error);
      setFileInfo({ fileCount: 0, fileTypes: [], totalSize: 0, error: 'Failed to load' });
    } finally {
      setLoadingFiles(false);
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (bytes === null || bytes === 0) return 'Unknown';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let unitIndex = 0;
    let size = bytes;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Unknown';
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDateRange = (begin: Date | null, end: Date | null) => {
    if (!begin && !end) return 'Not specified';
    if (begin && end) {
      return `${formatDate(begin)} – ${formatDate(end)}`;
    }
    return begin ? `From ${formatDate(begin)}` : `Until ${formatDate(end)}`;
  };

  const formatBoundingBox = (spatial: DataOneDatasetDetail['spatialCoverage']) => {
    if (!spatial) return 'Not specified';
    const { north, south, east, west } = spatial;
    if (north === null || south === null || east === null || west === null) {
      return 'Not specified';
    }
    return `${south.toFixed(2)}°N to ${north.toFixed(2)}°N, ${west.toFixed(2)}°W to ${east.toFixed(2)}°W`;
  };

  const formatCoordinate = (lat: number | null, lon: number | null) => {
    if (lat === null || lon === null) return 'Not specified';
    return `${lat.toFixed(4)}°N, ${lon.toFixed(4)}°W`;
  };

  // Build DataONE URL
  const dataoneUrl = `https://search.dataone.org/view/${encodeURIComponent(dataset.dataoneId)}`;

  const handleDownload = () => {
    // Open DataONE page in new tab
    window.open(dataoneUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      id="dataone-details-sidebar"
      className="w-96 bg-white border-l border-gray-200 flex flex-col h-full shadow-lg"
    >
      {/* Header */}
      <div id="dataone-details-header" className="p-4 border-b border-gray-200 bg-emerald-50">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Database className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span className="text-sm font-medium text-emerald-700">Dataset Details</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
            aria-label="Close details"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div id="dataone-details-content" className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-5">
          {/* Title */}
          <div>
            <h2 id="dataone-details-title" className="text-lg font-semibold text-gray-900 leading-tight">
              {dataset.title}
            </h2>
            {dataset.repository && (
              <span className="inline-block mt-2 px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-800 rounded">
                {dataset.repository}
              </span>
            )}
          </div>

          {/* Loading Details Indicator */}
          {loadingDetails && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading full details...
            </div>
          )}

          {/* Abstract (from details layer) */}
          {details?.abstract && (
            <div id="dataone-details-abstract">
              <h3 className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                <FileText className="w-4 h-4" />
                Abstract
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">{details.abstract}</p>
            </div>
          )}

          {/* Keywords (from details layer) */}
          {details?.keywords && details.keywords.length > 0 && (
            <div id="dataone-details-keywords">
              <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                <Tag className="w-4 h-4" />
                Keywords
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {details.keywords.map((keyword, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded-full"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* TNC Categories (from catalog layer) */}
          {dataset.tncCategories.length > 0 && (
            <div id="dataone-details-categories">
              <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                <Tag className="w-4 h-4" />
                Categories
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {dataset.tncCategories.map((category, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 text-xs bg-emerald-100 text-emerald-700 rounded-full"
                  >
                    {category}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Authors (from details layer) */}
          {details?.authors && details.authors.length > 0 && (
            <div id="dataone-details-authors">
              <h3 className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                Authors
              </h3>
              <ul className="text-sm text-gray-600 space-y-0.5">
                {details.authors.slice(0, 5).map((author, i) => (
                  <li key={i}>{author}</li>
                ))}
                {details.authors.length > 5 && (
                  <li className="text-gray-400">+{details.authors.length - 5} more</li>
                )}
              </ul>
            </div>
          )}

          {/* Project/Site (from details layer) */}
          {(details?.project || details?.site) && (
            <div id="dataone-details-project">
              <h3 className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                <Building2 className="w-4 h-4" />
                Project / Site
              </h3>
              <p className="text-sm text-gray-600">
                {details.project || details.site}
              </p>
            </div>
          )}

          {/* Temporal Coverage */}
          <div id="dataone-details-temporal">
            <h3 className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              Temporal Coverage
            </h3>
            <p className="text-sm text-gray-600">
              {formatDateRange(
                dataset.temporalCoverage.beginDate,
                dataset.temporalCoverage.endDate
              )}
            </p>
          </div>

          {/* Spatial Coverage */}
          <div id="dataone-details-spatial">
            <h3 className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              Location
            </h3>
            <p className="text-sm text-gray-600">
              {details?.spatialCoverage 
                ? formatBoundingBox(details.spatialCoverage)
                : formatCoordinate(dataset.centerLat, dataset.centerLon)}
            </p>
          </div>

          {/* Size & Dates */}
          <div id="dataone-details-metadata" className="flex gap-6">
            {details?.sizeBytes && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                  <HardDrive className="w-4 h-4" />
                  Size
                </h3>
                <p className="text-sm text-gray-600">{formatFileSize(details.sizeBytes)}</p>
              </div>
            )}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-1">Date Uploaded</h3>
              <p className="text-sm text-gray-600">
                {formatDate(details?.dateModified || dataset.dateUploaded)}
              </p>
            </div>
          </div>

          {/* File Information (loaded on-demand) */}
          <div id="dataone-details-files">
            <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
              <FileText className="w-4 h-4" />
              File Information
            </h3>
            {fileInfo ? (
              fileInfo.error ? (
                <p className="text-sm text-gray-500">{fileInfo.error}</p>
              ) : (
                <div className="text-sm text-gray-600 space-y-1">
                  <p>
                    <span className="font-medium">{fileInfo.fileCount}</span> files
                  </p>
                  {fileInfo.fileTypes.length > 0 && (
                    <p>
                      Types: {fileInfo.fileTypes.slice(0, 5).join(', ')}
                      {fileInfo.fileTypes.length > 5 && '...'}
                    </p>
                  )}
                  {fileInfo.totalSize > 0 && (
                    <p>Total: {formatFileSize(fileInfo.totalSize)}</p>
                  )}
                </div>
              )
            ) : loadingFiles ? (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading file info...
              </div>
            ) : (
              <button
                onClick={handleLoadFileInfo}
                className="text-sm text-emerald-600 hover:underline"
              >
                Load file details →
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div id="dataone-details-actions" className="p-4 border-t border-gray-200 bg-gray-50 space-y-2">
        {/* View on DataONE */}
        <a
          href={dataoneUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          View on DataONE
        </a>

        {/* Preview Button */}
        {onPreview && (
          <button
            onClick={onPreview}
            className="flex items-center justify-center gap-2 w-full px-4 py-2 text-sm font-medium text-emerald-700 bg-white border border-emerald-300 rounded-lg hover:bg-emerald-50 transition-colors"
          >
            <Eye className="w-4 h-4" />
            Preview
          </button>
        )}

        {/* Download & Cart Row */}
        <div className="flex gap-2">
          <button
            onClick={handleDownload}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            Download
          </button>
          {onAddToCart && (
            <button
              onClick={onAddToCart}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ShoppingCart className="w-4 h-4" />
              Add to Cart
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DataONEDetailsSidebar;
