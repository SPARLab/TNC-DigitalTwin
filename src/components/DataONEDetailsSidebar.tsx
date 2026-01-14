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
  History,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  dataOneService,
  DataOneDataset,
  DataOneDatasetDetail,
  DataOneVersionEntry,
  FilesSummary,
} from '../services/dataOneService';

interface DataONEDetailsSidebarProps {
  dataset: DataOneDataset;
  onClose: () => void;
  onPreview?: () => void;
  onAddToCart?: () => void;
  onVersionSelect?: (dataset: DataOneDataset) => void;
}

/**
 * Format file size in human-readable format
 */
function formatFileSize(bytes: number | null): string {
  if (bytes === null || bytes === 0) return 'Unknown';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let unitIndex = 0;
  let size = bytes;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

/**
 * Format files summary for display (e.g., "2 CSV, 1 PDF • 22 KB")
 */
function formatFilesSummary(summary: FilesSummary | null): string | null {
  if (!summary || summary.total === 0) return null;
  
  const extParts = Object.entries(summary.byExtension)
    .sort(([, a], [, b]) => b - a)
    .map(([ext, count]) => `${count} ${ext.toUpperCase()}`);
  
  const extStr = extParts.join(', ');
  const sizeStr = summary.sizeBytes > 0 ? formatFileSize(summary.sizeBytes) : null;
  
  return sizeStr ? `${extStr} • ${sizeStr}` : extStr;
}

/**
 * Strip "urn:node:" prefix from repository/datasource names
 */
function formatRepository(repo: string | null): string | null {
  if (!repo) return null;
  return repo.replace(/^urn:node:/i, '');
}

/**
 * Extract a readable name from an external URL
 * e.g., "https://doi.pangaea.de/..." -> "PANGAEA"
 */
function getExternalSourceName(url: string | null): string | null {
  if (!url) return null;
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    // Map common hostnames to readable names
    if (hostname.includes('pangaea')) return 'PANGAEA';
    if (hostname.includes('hydroshare')) return 'HydroShare';
    if (hostname.includes('bco-dmo') || hostname.includes('bcodmo')) return 'BCO-DMO';
    if (hostname.includes('griidc')) return 'GRIIDC';
    if (hostname.includes('earthchem')) return 'EarthChem';
    if (hostname.includes('opentopo')) return 'OpenTopography';
    if (hostname.includes('ncei') || hostname.includes('noaa')) return 'NCEI';
    if (hostname.includes('obis')) return 'OBIS';
    if (hostname.includes('lter')) return 'LTER';
    if (hostname.includes('r2r')) return 'R2R';
    // Fallback: extract domain name
    const parts = hostname.split('.');
    if (parts.length >= 2) {
      return parts[parts.length - 2].toUpperCase();
    }
    return hostname;
  } catch {
    return null;
  }
}

const DataONEDetailsSidebar: React.FC<DataONEDetailsSidebarProps> = ({
  dataset,
  onClose,
  onPreview,
  onAddToCart,
  onVersionSelect,
}) => {
  const [details, setDetails] = useState<DataOneDatasetDetail | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(true);
  
  // Version history state
  const [versionHistoryOpen, setVersionHistoryOpen] = useState(false);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [versions, setVersions] = useState<DataOneVersionEntry[]>([]);
  const [versionsError, setVersionsError] = useState<string | null>(null);

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
    
    // Reset version history when dataset changes
    setVersions([]);
    setVersionHistoryOpen(false);
    setVersionsError(null);
  }, [dataset.dataoneId]);

  // Fetch version history on-demand
  const handleToggleVersionHistory = async () => {
    if (versionHistoryOpen) {
      setVersionHistoryOpen(false);
      return;
    }
    
    setVersionHistoryOpen(true);
    
    // Only fetch if not already loaded
    if (versions.length === 0 && !loadingVersions) {
      setLoadingVersions(true);
      setVersionsError(null);
      try {
        const versionData = await dataOneService.queryVersionHistory(dataset.seriesId);
        setVersions(versionData);
      } catch (error) {
        console.error('Failed to fetch version history:', error);
        setVersionsError(error instanceof Error ? error.message : 'Failed to load versions');
      } finally {
        setLoadingVersions(false);
      }
    }
  };

  // Handle clicking a version to view it
  const handleVersionClick = async (version: DataOneVersionEntry) => {
    if (version.dataoneId === dataset.dataoneId) return; // Already viewing this version
    
    try {
      const versionDetails = await dataOneService.getVersionDetails(version.dataoneId);
      if (versionDetails && onVersionSelect) {
        onVersionSelect(versionDetails);
      }
    } catch (error) {
      console.error('Failed to load version details:', error);
    }
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

  const hasMultipleVersions = dataset.versionCount > 1;

  return (
    <div
      id="dataone-details-sidebar"
      className="w-sidebar-right-lg xl:w-sidebar-right-xl 2xl:w-sidebar-right-2xl bg-white border-l border-gray-200 flex flex-col h-full shadow-lg"
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
              <div className="flex flex-wrap gap-2 mt-2">
                {dataset.repository && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-800 rounded">
                    {formatRepository(dataset.repository)}
                  </span>
                )}
                {/* Metadata-only badge */}
                {dataset.isMetadataOnly && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-800 rounded">
                    Metadata Only
                  </span>
                )}
                {/* Version badge */}
                {dataset.versionCount > 0 && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                    {dataset.versionCount} version{dataset.versionCount !== 1 ? 's' : ''}
                  </span>
                )}
                {/* Files summary badge */}
                {dataset.filesSummary && !dataset.isMetadataOnly && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-800 rounded">
                    {formatFilesSummary(dataset.filesSummary)}
                  </span>
                )}
              </div>
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

          {/* Version History Section (collapsible) */}
          {hasMultipleVersions && (
            <div id="dataone-details-versions" className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={handleToggleVersionHistory}
                className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700">
                    Version History
                  </span>
                  <span className="text-xs text-gray-500">
                    ({dataset.versionCount} versions)
                  </span>
                </div>
                {versionHistoryOpen ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </button>
              
              {versionHistoryOpen && (
                <div className="p-3 bg-white border-t border-gray-200">
                  {loadingVersions ? (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading versions...
                    </div>
                  ) : versionsError ? (
                    <div className="text-sm text-red-600">{versionsError}</div>
                  ) : versions.length > 0 ? (
                    <div className="space-y-2">
                      {versions.map((version, index) => {
                        const isLatest = index === 0;
                        const isCurrent = version.dataoneId === dataset.dataoneId;
                        const versionNumber = versions.length - index;
                        const versionFilesSummary = formatFilesSummary(version.filesSummary);
                        
                        // Check if file info differs from current version
                        const currentFilesSummary = dataset.filesSummary;
                        const hasDifferentFiles = 
                          currentFilesSummary && 
                          version.filesSummary && 
                          (currentFilesSummary.total !== version.filesSummary.total ||
                           currentFilesSummary.sizeBytes !== version.filesSummary.sizeBytes);

                        return (
                          <div
                            key={version.dataoneId}
                            className={`p-2 rounded-lg border ${
                              isCurrent
                                ? 'bg-emerald-50 border-emerald-200'
                                : 'bg-white border-gray-100 hover:border-gray-200'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <span className={`text-sm font-medium ${
                                  isCurrent ? 'text-emerald-700' : 'text-gray-700'
                                }`}>
                                  v{versionNumber}
                                </span>
                                {isLatest && (
                                  <span className="px-1.5 py-0.5 text-xs bg-emerald-100 text-emerald-700 rounded">
                                    latest
                                  </span>
                                )}
                                {isCurrent && (
                                  <span className="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                                    current
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-gray-500">
                                {formatDate(version.dateUploaded)}
                              </span>
                            </div>
                            
                            {/* File info with diff highlight */}
                            {versionFilesSummary && (
                              <div className={`text-xs ${
                                hasDifferentFiles 
                                  ? 'text-amber-600 font-medium' 
                                  : 'text-gray-500'
                              }`}>
                                {versionFilesSummary}
                                {hasDifferentFiles && ' ←'}
                              </div>
                            )}
                            
                            {/* View this version button */}
                            {!isCurrent && (
                              <button
                                onClick={() => handleVersionClick(version)}
                                className="mt-2 text-xs text-emerald-600 hover:underline"
                              >
                                View this version →
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">No version history available</div>
                  )}
                </div>
              )}
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
                    className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded"
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
                    className="px-2 py-0.5 text-xs bg-emerald-100 text-emerald-700 rounded"
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

          {/* File Information / Data Availability */}
          <div id="dataone-details-files">
            <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
              <FileText className="w-4 h-4" />
              {dataset.isMetadataOnly ? 'Data Availability' : 'File Information'}
            </h3>
            {dataset.isMetadataOnly ? (
              <div className="text-sm space-y-3">
                {/* Explanation */}
                <div className="bg-purple-50 border border-purple-100 px-3 py-2.5 rounded-lg space-y-2">
                  <p className="text-purple-800 font-medium">Metadata-Only Record</p>
                  <p className="text-purple-700 text-xs leading-relaxed">
                    DataONE stores only the metadata description for this dataset. 
                    The actual data files are hosted externally
                    {dataset.externalUrl && getExternalSourceName(dataset.externalUrl) 
                      ? <> on <span className="font-semibold">{getExternalSourceName(dataset.externalUrl)}</span></>
                      : null
                    }.
                  </p>
                </div>
                
                {/* What's available where */}
                <div className="space-y-2 text-xs text-gray-600">
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-600 font-medium">📄 DataONE:</span>
                    <span>View the metadata record describing this dataset</span>
                  </div>
                  {dataset.externalUrl && getExternalSourceName(dataset.externalUrl) && (
                    <div className="flex items-start gap-2">
                      <span className="text-purple-600 font-medium">📦 {getExternalSourceName(dataset.externalUrl)}:</span>
                      <span>Access the actual data files</span>
                    </div>
                  )}
                </div>
              </div>
            ) : dataset.filesSummary ? (
              <div className="text-sm text-gray-600 space-y-1">
                <p>
                  <span className="font-medium">{dataset.filesSummary.total}</span> file{dataset.filesSummary.total !== 1 ? 's' : ''}
                </p>
                {Object.keys(dataset.filesSummary.byExtension).length > 0 && (
                  <p>
                    Types: {Object.entries(dataset.filesSummary.byExtension)
                      .sort(([, a], [, b]) => b - a)
                      .map(([ext, count]) => `${count} ${ext.toUpperCase()}`)
                      .join(', ')}
                  </p>
                )}
                {dataset.filesSummary.sizeBytes > 0 && (
                  <p>Total size: {formatFileSize(dataset.filesSummary.sizeBytes)}</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No file information available</p>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div id="dataone-details-actions" className="p-4 border-t border-gray-200 bg-gray-50 space-y-3">
        {/* For metadata-only datasets: show organized sections */}
        {dataset.isMetadataOnly ? (
          <>
            {/* External Data Source Section (primary for metadata-only) */}
            {dataset.externalUrl && getExternalSourceName(dataset.externalUrl) && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-purple-700 uppercase tracking-wide">
                  📦 Data Files on {getExternalSourceName(dataset.externalUrl)}
                </p>
                <a
                  href={dataset.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open {getExternalSourceName(dataset.externalUrl)} in New Tab
                </a>
              </div>
            )}

            {/* DataONE Metadata Section */}
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-emerald-700 uppercase tracking-wide">
                📄 Metadata on DataONE
              </p>
              <div className="flex gap-2">
                {onPreview && (
                  <button
                    onClick={onPreview}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-emerald-700 bg-white border border-emerald-300 rounded-lg hover:bg-emerald-50 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    Preview
                  </button>
                )}
                <a
                  href={dataoneUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-emerald-700 bg-white border border-emerald-300 rounded-lg hover:bg-emerald-50 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  New Tab
                </a>
              </div>
            </div>
          </>
        ) : (
          /* For regular datasets with files */
          <>
            {/* Primary action: View on DataONE */}
            <a
              href={dataoneUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              View on DataONE
            </a>

            {/* Preview in iframe */}
            {onPreview && (
              <button
                onClick={onPreview}
                className="flex items-center justify-center gap-2 w-full px-4 py-2 text-sm font-medium text-emerald-700 bg-white border border-emerald-300 rounded-lg hover:bg-emerald-50 transition-colors"
              >
                <Eye className="w-4 h-4" />
                Preview Dataset in DataONE
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
          </>
        )}
      </div>
    </div>
  );
};

export default DataONEDetailsSidebar;
