import React, { useState, useEffect } from 'react';
import { Calendar, Loader2, Package, Eye } from 'lucide-react';
import DataTypeBackHeader from '../DataTypeBackHeader';
import DroneIcon from '../icons/DroneIcon';
import { fetchDroneImageryByProject, type DroneImageryProject } from '../../services/droneImageryService';

interface DroneImageryViewProps {
  hasSearched?: boolean;
  onBack?: () => void;
  activeLayerIds?: string[];
  loadingLayerIds?: string[];
  onLayerToggle?: (wmtsItemId: string) => void;
  /** Callback to open carousel for any project */
  onProjectCarouselOpen?: (project: DroneImageryProject) => void;
  /** Currently active project name (if carousel is open) */
  activeProjectName?: string;
}

const DroneImageryView: React.FC<DroneImageryViewProps> = ({ 
  hasSearched = false, 
  onBack,
  activeLayerIds: _activeLayerIds = [],
  loadingLayerIds = [],
  onLayerToggle: _onLayerToggle,
  onProjectCarouselOpen,
  activeProjectName
}) => {
  const [projects, setProjects] = useState<DroneImageryProject[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch data when hasSearched becomes true
  useEffect(() => {
    if (hasSearched && projects.length === 0) {
      const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
          const data = await fetchDroneImageryByProject();
          setProjects(data);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to load drone imagery');
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [hasSearched, projects.length]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const formatDateRange = (project: DroneImageryProject) => {
    if (project.layerCount === 1) {
      return formatDate(project.dateRangeStart);
    }
    return `${formatDate(project.dateRangeStart)} - ${formatDate(project.dateRangeEnd)}`;
  };

  const totalLayers = projects.reduce((sum, p) => sum + p.layerCount, 0);

  return (
    <div id="drone-imagery-view" className="w-64 md:w-80 lg:w-96 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Back to Data Types */}
      {onBack && <DataTypeBackHeader onBack={onBack} />}

      {/* Header */}
      <div id="drone-imagery-header" className="p-4 border-b border-gray-200">
        <div id="drone-imagery-title" className="flex items-center space-x-2">
          <DroneIcon className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">Drone Imagery</h2>
        </div>
        <p id="drone-imagery-subtitle" className="text-sm text-gray-600 mt-1">
          High-resolution aerial imagery from DroneDeploy
        </p>
      </div>

      {/* Summary Bar */}
      {hasSearched && !loading && projects.length > 0 && (
        <div id="drone-imagery-summary" className="px-4 py-2 bg-gray-50 border-b border-gray-200 text-sm text-gray-600">
          <span className="font-medium text-gray-900">{totalLayers}</span> layers across{' '}
          <span className="font-medium text-gray-900">{projects.length}</span> projects
        </div>
      )}

      {/* Content */}
      <div id="drone-imagery-content" className="flex-1 overflow-y-auto">
        {!hasSearched ? (
          // Pre-search state
          <div id="drone-imagery-search-prompt" className="flex flex-col items-center justify-center h-full text-center px-4">
            <DroneIcon className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Drone Imagery
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Browse high-resolution drone imagery from various projects across the preserve.
            </p>
            <p className="text-xs text-gray-500">
              Click the search button to load available imagery layers.
            </p>
          </div>
        ) : loading ? (
          // Loading state
          <div id="drone-imagery-loading" className="flex flex-col items-center justify-center h-full">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
            <p className="text-sm text-gray-600">Loading drone imagery...</p>
          </div>
        ) : error ? (
          // Error state
          <div id="drone-imagery-error" className="flex flex-col items-center justify-center h-full text-center px-4">
            <p className="text-red-600 mb-2">{error}</p>
            <button 
              onClick={() => setProjects([])} 
              className="text-sm text-blue-600 hover:underline"
            >
              Try again
            </button>
          </div>
        ) : (
          // Project list
          <div id="drone-imagery-projects" className="p-4 space-y-3">
            {projects.map((project) => {
              const isActive = activeProjectName === project.projectName;
              const isLoading = loadingLayerIds.length > 0 && isActive;

              return (
                <div
                  key={project.projectName}
                  id={`project-${project.projectName.replace(/\s+/g, '-').toLowerCase()}`}
                  className={`border rounded-lg overflow-hidden transition-colors ${
                    isActive ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}
                  >
                  {/* Project Card */}
                  <div className="p-3">
                    {/* Project Info */}
                    <div className="flex items-start gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                          <h3 className={`text-sm font-medium truncate ${
                            isActive ? 'text-blue-900' : 'text-gray-900'
                          }`}>
                          {project.projectName}
                        </h3>
                        {project.hasImageCollections && (
                          <span title="Has Image Collection">
                            <Package className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                          </span>
                        )}
                      </div>
                        <div className={`flex items-center gap-2 text-xs ${
                          isActive ? 'text-blue-700' : 'text-gray-500'
                        }`}>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDateRange(project)}
                        </span>
                          <span className={`px-1.5 py-0.5 rounded ${
                            isActive ? 'bg-blue-200 text-blue-800' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {project.layerCount} {project.layerCount === 1 ? 'capture' : 'captures'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Button - consistent for all projects */}
                        <button
                      id={`project-view-btn-${project.projectName.replace(/\s+/g, '-').toLowerCase()}`}
                      onClick={() => onProjectCarouselOpen?.(project)}
                          disabled={isLoading}
                      className={`w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                            isActive
                          ? 'bg-blue-600 text-white'
                          : 'text-blue-600 border border-blue-300 hover:bg-blue-50 hover:border-blue-400'
                      } ${isLoading ? 'opacity-70' : ''}`}
                        >
                          {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Eye className="w-4 h-4" />
                          )}
                      {isActive ? 'Viewing' : 'View Imagery'}
                            </button>
                          </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Info */}
      {hasSearched && !loading && projects.length > 0 && (
        <div id="drone-imagery-footer" className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="text-xs text-gray-500 space-y-1">
            <p className="flex items-center gap-1">
              <Package className="w-3 h-3 text-blue-500" />
              <span>= Has Image Collection (individual images available)</span>
            </p>
            <p className="flex items-center gap-1">
              <Eye className="w-3 h-3 text-blue-600" />
              <span>Use ← → to navigate between captures</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DroneImageryView;
