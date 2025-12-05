import React, { useState, useEffect } from 'react';
import { Plane, Calendar, ChevronDown, ChevronRight, Loader2, Package, MapPin, Eye, EyeOff } from 'lucide-react';
import DataTypeBackHeader from '../DataTypeBackHeader';
import { fetchDroneImageryByProject, type DroneImageryProject } from '../../services/droneImageryService';

interface DroneImageryViewProps {
  hasSearched?: boolean;
  onBack?: () => void;
  activeLayerIds?: string[];
  loadingLayerIds?: string[];
  onLayerToggle?: (wmtsItemId: string) => void;
}

const DroneImageryView: React.FC<DroneImageryViewProps> = ({ 
  hasSearched = false, 
  onBack,
  activeLayerIds = [],
  loadingLayerIds = [],
  onLayerToggle
}) => {
  const [projects, setProjects] = useState<DroneImageryProject[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());

  // Fetch data when hasSearched becomes true
  useEffect(() => {
    if (hasSearched && projects.length === 0) {
      const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
          const data = await fetchDroneImageryByProject();
          setProjects(data);
          // Auto-expand projects with multiple layers
          const multiLayerProjects = data
            .filter(p => p.layerCount > 1)
            .map(p => p.projectName);
          setExpandedProjects(new Set(multiLayerProjects));
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to load drone imagery');
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [hasSearched, projects.length]);

  const toggleProject = (projectName: string) => {
    setExpandedProjects(prev => {
      const next = new Set(prev);
      if (next.has(projectName)) {
        next.delete(projectName);
      } else {
        next.add(projectName);
      }
      return next;
    });
  };

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
    <div id="drone-imagery-view" className="w-96 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Back to Data Types */}
      {onBack && <DataTypeBackHeader onBack={onBack} />}

      {/* Header */}
      <div id="drone-imagery-header" className="p-4 border-b border-gray-200">
        <div id="drone-imagery-title" className="flex items-center space-x-2">
          <Plane className="w-5 h-5 text-blue-600" />
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
            <Plane className="w-12 h-12 text-gray-400 mb-4" />
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
              const isExpanded = expandedProjects.has(project.projectName);
              const hasMultipleLayers = project.layerCount > 1;

              return (
                <div
                  key={project.projectName}
                  id={`project-${project.projectName.replace(/\s+/g, '-').toLowerCase()}`}
                  className="border border-gray-200 rounded-lg overflow-hidden"
                >
                  {/* Project Header */}
                  <button
                    onClick={() => hasMultipleLayers && toggleProject(project.projectName)}
                    className={`w-full flex items-start p-3 text-left ${
                      hasMultipleLayers 
                        ? 'hover:bg-gray-50 cursor-pointer' 
                        : 'cursor-default'
                    }`}
                  >
                    {/* Expand/Collapse Icon */}
                    <div className="mt-0.5 mr-2 text-gray-400">
                      {hasMultipleLayers ? (
                        isExpanded ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )
                      ) : (
                        <div className="w-4 h-4" /> // Spacer
                      )}
                    </div>

                    {/* Project Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {project.projectName}
                        </h3>
                        {project.hasImageCollections && (
                          <span title="Has Image Collection">
                            <Package className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDateRange(project)}
                        </span>
                        {hasMultipleLayers && (
                          <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded">
                            {project.layerCount} layers
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Single layer - show toggle button directly */}
                    {!hasMultipleLayers && (() => {
                      const layer = project.imageryLayers[0];
                      const isActive = activeLayerIds.includes(layer.wmts.itemId);
                      const isLoading = loadingLayerIds.includes(layer.wmts.itemId);
                      
                      return (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onLayerToggle?.(layer.wmts.itemId);
                          }}
                          disabled={isLoading}
                          className={`ml-2 px-3 py-1.5 text-xs font-medium rounded transition-colors flex items-center gap-1.5 flex-shrink-0 ${
                            isActive
                              ? 'bg-blue-600 text-white hover:bg-blue-700'
                              : 'text-blue-600 border border-blue-600 hover:bg-blue-50'
                          } ${isLoading ? 'opacity-50 cursor-wait' : ''}`}
                        >
                          {isLoading ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : isActive ? (
                            <Eye className="w-3 h-3" />
                          ) : (
                            <EyeOff className="w-3 h-3" />
                          )}
                          {isActive ? 'On' : 'Off'}
                        </button>
                      );
                    })()}
                  </button>

                  {/* Expanded Layers List */}
                  {hasMultipleLayers && isExpanded && (
                    <div className="border-t border-gray-100 bg-gray-50">
                      {project.imageryLayers.map((layer, idx) => {
                        const isActive = activeLayerIds.includes(layer.wmts.itemId);
                        const isLoading = loadingLayerIds.includes(layer.wmts.itemId);
                        
                        return (
                          <div
                            key={layer.id}
                            className={`flex items-center justify-between px-4 py-2 ${
                              idx > 0 ? 'border-t border-gray-100' : ''
                            } ${isActive ? 'bg-blue-50' : ''}`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {layer.imageCollection && (
                                <span title="Has Image Collection">
                                  <Package className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                                </span>
                              )}
                              <span className={`text-sm truncate ${isActive ? 'text-blue-700 font-medium' : 'text-gray-700'}`}>
                                {layer.planName}
                              </span>
                              <span className="text-xs text-gray-500">
                                {formatDate(layer.dateCaptured)}
                              </span>
                            </div>
                            <button
                              onClick={() => onLayerToggle?.(layer.wmts.itemId)}
                              disabled={isLoading}
                              className={`ml-2 px-2.5 py-1 text-xs font-medium rounded transition-colors flex items-center gap-1 flex-shrink-0 ${
                                isActive
                                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                                  : 'text-blue-600 border border-blue-600 hover:bg-blue-50'
                              } ${isLoading ? 'opacity-50 cursor-wait' : ''}`}
                            >
                              {isLoading ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : isActive ? (
                                <Eye className="w-3 h-3" />
                              ) : (
                                <EyeOff className="w-3 h-3" />
                              )}
                              {isActive ? 'On' : 'Off'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
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
              <MapPin className="w-3 h-3 text-gray-400" />
              <span>Extent data coming soon - metadata enrichment in progress</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DroneImageryView;
