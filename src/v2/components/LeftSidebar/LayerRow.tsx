// ============================================================================
// LayerRow — A single layer in the left sidebar with pin/eye interactions
// States: default, active, pinned-visible, pinned-hidden, active+pinned
// ============================================================================

import { useEffect, useMemo, useState, type MouseEvent as ReactMouseEvent } from 'react';
import { ChevronDown, ChevronRight, Eye, EyeOff, Pin } from 'lucide-react';
import { useLayers } from '../../context/LayerContext';
import { useCatalog } from '../../context/CatalogContext';
import { useDroneDeploy } from '../../context/DroneDeployContext';
import { fetchDroneImageryByProject, type DroneImageryProject } from '../../../services/droneImageryService';

interface LayerRowProps {
  layerId: string;
  name: string;
  ariaLevel?: number;
  controlsOnly?: boolean;
  indented?: boolean;
}

function toDomSafeId(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function pickProjectDefaultFlight(project: DroneImageryProject) {
  for (const flight of project.imageryLayers) {
    if (flight.wmts.itemId.trim().length > 0) return flight;
  }
  return project.imageryLayers[0] ?? project.imageryLayers[project.imageryLayers.length - 1];
}

export function LayerRow({
  layerId,
  name,
  ariaLevel = 2,
  controlsOnly = false,
  indented = false,
}: LayerRowProps) {
  const [isProjectsExpanded, setIsProjectsExpanded] = useState(false);
  const [projects, setProjects] = useState<DroneImageryProject[] | null>(null);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectsError, setProjectsError] = useState<string | null>(null);
  const [projectsRequestNonce, setProjectsRequestNonce] = useState(0);

  const {
    activeLayer,
    activateLayer,
    isLayerPinned,
    isLayerVisible,
    pinLayer,
    unpinLayer,
    toggleVisibility,
    getPinnedByLayerId,
  } = useLayers();
  const { layerMap } = useCatalog();
  const { setFlightLoaded, setSelectedFlightId, requestFlyToFlight } = useDroneDeploy();

  const catalogLayer = layerMap.get(layerId);
  const isServiceContainer = !!(
    catalogLayer?.catalogMeta?.isMultiLayerService
    && !catalogLayer.catalogMeta?.parentServiceId
    && catalogLayer.catalogMeta?.siblingLayers
    && catalogLayer.catalogMeta.siblingLayers.length > 0
  );
  const isDroneDeployOrthomosaicsLayer = catalogLayer?.catalogMeta?.datasetId === 193;

  const isSelectedServiceChild = !controlsOnly
    && !!activeLayer?.isService
    && activeLayer.selectedSubLayerId === layerId;
  const isActive = !controlsOnly && (activeLayer?.layerId === layerId || isSelectedServiceChild);
  const isPinned = isLayerPinned(layerId);
  const isVisible = isLayerVisible(layerId);
  const pinned = getPinnedByLayerId(layerId);
  const activeDroneFlightId = typeof activeLayer?.featureId === 'number'
    ? activeLayer.featureId
    : undefined;

  const handleClick = () => {
    if (controlsOnly) return;
    activateLayer(layerId);
    if (isDroneDeployOrthomosaicsLayer) setIsProjectsExpanded(true);
  };

  const flightCount = useMemo(
    () => projects?.reduce((sum, project) => sum + project.imageryLayers.length, 0) ?? 0,
    [projects]
  );
  const projectCount = projects?.length ?? 0;
  const activeProjectName = useMemo(() => {
    if (!projects || activeDroneFlightId == null) return undefined;
    const activeProject = projects.find(project =>
      project.imageryLayers.some(flight => flight.id === activeDroneFlightId)
    );
    return activeProject?.projectName;
  }, [projects, activeDroneFlightId]);

  const handlePinClick = (e: ReactMouseEvent) => {
    e.stopPropagation();
    if (isPinned && pinned) {
      unpinLayer(pinned.id);
    } else {
      pinLayer(layerId);
    }
  };

  const handleEyeClick = (e: ReactMouseEvent) => {
    e.stopPropagation();
    if (pinned) toggleVisibility(pinned.id);
  };

  const handleProjectsExpandToggle = (e: ReactMouseEvent) => {
    e.stopPropagation();
    activateLayer(layerId);
    setIsProjectsExpanded(prev => !prev);
  };

  const handleProjectSelect = (e: ReactMouseEvent, project: DroneImageryProject) => {
    e.stopPropagation();
    const defaultFlight = pickProjectDefaultFlight(project);
    if (defaultFlight) {
      setSelectedFlightId(defaultFlight.id);
      setFlightLoaded(defaultFlight.id, true);
      requestFlyToFlight(defaultFlight.id);
      activateLayer(layerId, undefined, defaultFlight.id);
      return;
    }
    activateLayer(layerId);
  };

  const handleProjectsRetry = (e: ReactMouseEvent) => {
    e.stopPropagation();
    setProjects(null);
    setProjectsError(null);
    setProjectsRequestNonce(prev => prev + 1);
  };

  useEffect(() => {
    if (!isDroneDeployOrthomosaicsLayer || !isProjectsExpanded || projects) return;

    let cancelled = false;
    setProjectsLoading(true);
    setProjectsError(null);

    fetchDroneImageryByProject()
      .then(fetchedProjects => {
        if (cancelled) return;
        setProjects(fetchedProjects);
      })
      .catch(err => {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : 'Failed to fetch DroneDeploy projects.';
        setProjectsError(message);
      })
      .finally(() => {
        if (cancelled) return;
        setProjectsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isDroneDeployOrthomosaicsLayer, isProjectsExpanded, projects, projectsRequestNonce]);

  const activeClasses = controlsOnly
    ? 'bg-white border border-gray-200 hover:border-gray-300 hover:shadow-sm'
    : isActive
      ? 'bg-amber-50 border border-amber-300 font-semibold text-gray-900 shadow-sm'
      : 'bg-white border border-gray-200 hover:border-gray-300 hover:shadow-sm';

  const textColor = isPinned && !isVisible && !isActive
    ? 'text-gray-400'
    : isActive
      ? 'text-gray-900'
      : 'text-gray-700';

  return (
    <div id={`layer-row-wrapper-${layerId}`} className="space-y-1">
      <div
        id={`layer-row-${layerId}`}
        role="treeitem"
        aria-level={ariaLevel}
        aria-current={isActive ? 'true' : undefined}
        tabIndex={controlsOnly ? -1 : 0}
        onClick={handleClick}
        onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && handleClick()}
        className={`group min-w-0 flex items-center gap-1.5 py-2 px-3 cursor-pointer
                    text-sm rounded-lg transition-all duration-200 ${indented ? 'ml-4 mr-0' : 'ml-1 mr-1'} ${activeClasses}
                    ${controlsOnly ? 'cursor-default' : 'cursor-pointer'}`}
      >
        {isPinned && (
          <button
            id={`layer-eye-${layerId}`}
            onClick={handleEyeClick}
            title={isVisible ? 'Hide on map' : 'Show on map'}
            className="flex-shrink-0 p-0.5 rounded hover:bg-gray-100 transition-colors"
          >
            {isVisible ? (
              <Eye className="w-4 h-4 text-gray-700" />
            ) : (
              <EyeOff className="w-4 h-4 text-gray-300" />
            )}
          </button>
        )}

        <span className={`truncate min-w-0 flex-1 ${textColor} ${isActive ? 'font-semibold' : ''}`}>
          {name}
        </span>

        {catalogLayer?.catalogMeta?.parentServiceId && (
          <span
            id={`layer-row-kind-${layerId}`}
            className="text-[10px] uppercase tracking-wide text-gray-500 rounded border border-gray-200 bg-white px-1.5 py-0.5 flex-shrink-0"
            title="Feature service layer"
          >
            Layer
          </span>
        )}

        {isDroneDeployOrthomosaicsLayer && (
          <button
            id={`drone-parent-expand-toggle-${layerId}`}
            onClick={handleProjectsExpandToggle}
            title={isProjectsExpanded ? 'Collapse DroneDeploy projects' : 'Expand DroneDeploy projects'}
            className="flex-shrink-0 p-0.5 rounded hover:bg-gray-100 transition-colors"
            aria-expanded={isProjectsExpanded}
          >
            {isProjectsExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-600" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-600" />
            )}
          </button>
        )}

        {!isServiceContainer && isPinned ? (
          <button
            id={`layer-unpin-${layerId}`}
            onClick={handlePinClick}
            title="Unpin layer"
            className="flex-shrink-0 p-0.5 rounded transition-colors"
          >
            <Pin className="w-4 h-4 text-blue-500 fill-blue-500 hover:text-blue-600 hover:fill-blue-600" />
          </button>
        ) : !isServiceContainer ? (
          <button
            id={`layer-pin-${layerId}`}
            onClick={handlePinClick}
            title="Pin layer"
            className="flex-shrink-0 p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Pin className="w-4 h-4 text-gray-300 hover:text-gray-500" />
          </button>
        ) : (
          <span
            id={`layer-service-container-hint-${layerId}`}
            className="text-[10px] text-gray-500 uppercase tracking-wide"
            title="Service container; select a child layer to pin"
          >
            Service
          </span>
        )}
      </div>

      {isDroneDeployOrthomosaicsLayer && (
        <div
          id={`drone-projects-panel-${layerId}`}
          className={`ml-2 mr-0 border border-slate-200 rounded-lg bg-slate-50/50 overflow-hidden transition-all duration-300 ease-in-out ${
            isProjectsExpanded
              ? 'max-h-[600px] opacity-100 mb-2'
              : 'max-h-0 opacity-0 mb-0 border-transparent'
          }`}
        >
          {projectsLoading && (
            <div id={`drone-projects-loading-${layerId}`} className="px-3 py-2 text-xs text-gray-600">
              Loading DroneDeploy projects...
            </div>
          )}

          {!projectsLoading && projectsError && (
            <div id={`drone-projects-error-${layerId}`} className="px-3 py-2 text-xs text-red-600 space-y-2">
              <p>Failed to load DroneDeploy projects: {projectsError}</p>
              <button
                id={`drone-projects-retry-${layerId}`}
                onClick={handleProjectsRetry}
                className="text-[11px] px-2 py-1 rounded border border-red-200 bg-red-50 hover:bg-red-100 transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {!projectsLoading && !projectsError && projects && projects.length === 0 && (
            <div id={`drone-projects-empty-${layerId}`} className="px-3 py-2 text-xs text-gray-600">
              No DroneDeploy projects found.
            </div>
          )}

          {!projectsLoading && !projectsError && projects && projects.length > 0 && (
            <>
              <div
                id={`drone-projects-summary-${layerId}`}
                className="px-3 pt-2 pb-1 text-[11px] text-gray-600 border-b border-slate-200"
              >
                {projectCount} projects, {flightCount} orthomosaics
              </div>
              <div id={`drone-projects-list-${layerId}`} className="py-1">
                {projects.map(project => {
                  const projectId = toDomSafeId(project.projectName);
                  const isSelectedProject = project.projectName === activeProjectName;
                  return (
                    <div key={project.projectName} id={`drone-project-group-${projectId}`}>
                      <button
                        id={`drone-project-select-${projectId}`}
                        onClick={e => handleProjectSelect(e, project)}
                        className={`w-full flex items-center gap-1.5 px-2 py-1.5 text-left transition-colors
                          ${isSelectedProject ? 'bg-amber-100 text-gray-900' : 'hover:bg-slate-100 text-gray-800'}`}
                      >
                        <span className="text-xs text-gray-800 truncate flex-1">
                          {project.projectName}
                        </span>
                        <span className="text-[10px] text-gray-600 rounded-full bg-white px-1.5 py-0.5 border border-gray-200">
                          {project.imageryLayers.length}
                        </span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
