import { useEffect, useMemo, useState } from 'react';
import type { DroneImageryMetadata, DroneImageryProject } from '../../../../types/droneImagery';
import { useLayers } from '../../../context/LayerContext';
import { useDroneDeploy } from '../../../context/DroneDeployContext';
import { InlineLoadingRow } from '../../shared/loading/LoadingPrimitives';
import { FlightDetailView } from './FlightDetailView';
import { ProjectListView } from './ProjectListView';

function pickProjectDefaultFlight(project: DroneImageryProject): DroneImageryMetadata | undefined {
  for (const flight of project.imageryLayers) {
    if (flight.wmts.itemId.trim().length > 0) return flight;
  }
  return project.imageryLayers[0] ?? project.imageryLayers[project.imageryLayers.length - 1];
}

export function DroneDeploySidebar() {
  const {
    projects,
    dateFilter,
    sortMode,
    loading,
    metadataLoading,
    dataLoaded,
    error,
    loadedFlightIds,
    isFlightLoading,
    opacityByFlightId,
    selectedFlightId,
    setDateFilter,
    setSortMode,
    setFlightLoaded,
    setFlightOpacity,
    reorderLoadedFlights,
    setSelectedFlightId,
    requestFlyToFlight,
  } = useDroneDeploy();
  const {
    activeLayer,
    activateLayer,
    pinLayer,
    isLayerPinned,
    getPinnedByLayerId,
    toggleChildVisibility,
    createOrUpdateDroneView,
  } = useLayers();
  const activeFlightId = typeof activeLayer?.featureId === 'number' ? activeLayer.featureId : undefined;
  const [showDetailView, setShowDetailView] = useState(false);

  const activeFlightFromContext = useMemo(() => {
    if (activeFlightId == null) return null;
    for (const project of projects) {
      const match = project.imageryLayers.find((flight) => flight.id === activeFlightId);
      if (match) return match;
    }
    return null;
  }, [projects, activeFlightId]);

  const selectedFlightFromContext = useMemo(() => {
    if (selectedFlightId == null) return null;
    for (const project of projects) {
      const match = project.imageryLayers.find((flight) => flight.id === selectedFlightId);
      if (match) return match;
    }
    return null;
  }, [projects, selectedFlightId]);

  const currentFlight = activeFlightFromContext ?? selectedFlightFromContext;
  const currentProject = useMemo(() => {
    if (!currentFlight) return null;
    return projects.find((project) =>
      project.imageryLayers.some((flight) => flight.id === currentFlight.id)
    ) ?? null;
  }, [projects, currentFlight]);

  const currentProjectLoadedFlightIds = useMemo(() => {
    if (!currentProject) return [];
    const projectFlightIds = new Set(currentProject.imageryLayers.map((flight) => flight.id));
    return loadedFlightIds.filter((flightId) => projectFlightIds.has(flightId));
  }, [currentProject, loadedFlightIds]);

  const findFlightById = (flightId: number): DroneImageryMetadata | null => {
    for (const project of projects) {
      const match = project.imageryLayers.find((flight) => flight.id === flightId);
      if (match) return match;
    }
    return null;
  };

  const setSingleLoadedFlight = (nextFlightId: number) => {
    for (const flightId of loadedFlightIds) {
      if (flightId !== nextFlightId) {
        setFlightLoaded(flightId, false);
      }
    }
    setFlightLoaded(nextFlightId, true);
  };

  useEffect(() => {
    if (activeLayer?.layerId !== 'dataset-193') return;
    if (activeFlightId != null) {
      setShowDetailView(true);
      return;
    }
    setShowDetailView(false);
  }, [activeLayer?.layerId, activeFlightId]);

  const handleOpenProjectDetail = (project: DroneImageryProject) => {
    const nextFlight = pickProjectDefaultFlight(project);
    if (!nextFlight) return;
    const viewId = createOrUpdateDroneView('dataset-193', nextFlight);
    setShowDetailView(true);
    setSelectedFlightId(nextFlight.id);
    setSingleLoadedFlight(nextFlight.id);
    requestFlyToFlight(nextFlight.id);
    activateLayer('dataset-193', viewId, nextFlight.id);
  };

  const handleTogglePinned = (flight: DroneImageryMetadata) => {
    const isLoaded = loadedFlightIds.includes(flight.id);
    if (!isLoaded) {
      if (!isLayerPinned('dataset-193')) {
        pinLayer('dataset-193');
      }
      const viewId = createOrUpdateDroneView('dataset-193', flight);
      setSingleLoadedFlight(flight.id);
      setSelectedFlightId(flight.id);
      requestFlyToFlight(flight.id);
      activateLayer('dataset-193', viewId, flight.id);
      return;
    }
    const pinned = getPinnedByLayerId('dataset-193');
    const matchingView = pinned?.views?.find((view) => view.droneView?.flightId === flight.id);
    if (pinned && matchingView?.isVisible) {
      toggleChildVisibility(pinned.id, matchingView.id);
    }
    setFlightLoaded(flight.id, false);
    if (selectedFlightId === flight.id) {
      setSelectedFlightId(null);
    }
    activateLayer('dataset-193', matchingView?.id);
  };

  const handleSaveAsView = (flight: DroneImageryMetadata) => {
    if (!isLayerPinned('dataset-193')) {
      pinLayer('dataset-193');
    }
    const viewId = createOrUpdateDroneView('dataset-193', flight);
    setSingleLoadedFlight(flight.id);
    setSelectedFlightId(flight.id);
    requestFlyToFlight(flight.id);
    activateLayer('dataset-193', viewId, flight.id);
  };

  const handleSelectFlight = (flight: DroneImageryMetadata) => {
    const viewId = createOrUpdateDroneView('dataset-193', flight);
    setSelectedFlightId(flight.id);
    setSingleLoadedFlight(flight.id);
    requestFlyToFlight(flight.id);
    activateLayer('dataset-193', viewId, flight.id);
  };

  const handleToggleFlightVisibility = (flightId: number) => {
    const currentlyLoaded = loadedFlightIds.includes(flightId);
    const pinned = getPinnedByLayerId('dataset-193');
    const matchingView = pinned?.views?.find((view) => view.droneView?.flightId === flightId);

    if (currentlyLoaded) {
      if (pinned && matchingView?.isVisible) {
        toggleChildVisibility(pinned.id, matchingView.id);
      }
      setFlightLoaded(flightId, false);
      if (selectedFlightId === flightId) {
        const nextVisibleFlightId = currentProjectLoadedFlightIds.find((id) => id !== flightId) ?? null;
        setSelectedFlightId(nextVisibleFlightId);
        if (nextVisibleFlightId != null) {
          const nextVisibleView = pinned?.views?.find((view) => view.droneView?.flightId === nextVisibleFlightId);
          activateLayer('dataset-193', nextVisibleView?.id, nextVisibleFlightId);
        } else {
          activateLayer('dataset-193');
        }
      }
      return;
    }

    const nextFlight = findFlightById(flightId);
    if (!nextFlight) return;
    if (!isLayerPinned('dataset-193')) {
      pinLayer('dataset-193');
    }
    const viewId = createOrUpdateDroneView('dataset-193', nextFlight);
    setSelectedFlightId(flightId);
    setSingleLoadedFlight(flightId);
    requestFlyToFlight(flightId);
    activateLayer('dataset-193', viewId, flightId);
  };

  return (
    <div id="drone-deploy-sidebar-shell">
      {metadataLoading && !dataLoaded && (
        <InlineLoadingRow
          id="drone-sidebar-metadata-loading"
          message="Loading DroneDeploy metadata..."
          containerClassName="mb-3 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600"
        />
      )}
      {error && !loading && (
        <div
          id="drone-sidebar-error"
          className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
        >
          {error}
        </div>
      )}
      {showDetailView && currentFlight && currentProject ? (
        <FlightDetailView
          project={currentProject}
          flight={currentFlight}
          isLoaded={loadedFlightIds.includes(currentFlight.id)}
          isLoading={isFlightLoading(currentFlight.id)}
          opacity={opacityByFlightId[currentFlight.id] ?? 0.8}
          loadedFlightIds={currentProjectLoadedFlightIds}
          selectedFlightId={selectedFlightId ?? currentFlight.id}
          onBack={() => {
            setShowDetailView(false);
            activateLayer('dataset-193');
          }}
          onSelectFlight={handleSelectFlight}
          onTogglePinned={() => handleTogglePinned(currentFlight)}
          onSaveView={() => handleSaveAsView(currentFlight)}
          onFlyTo={() => requestFlyToFlight(currentFlight.id)}
          onOpacityChange={(next) => setFlightOpacity(currentFlight.id, next)}
          onToggleFlightVisibility={handleToggleFlightVisibility}
          onReorderFlight={(flightId, direction) => reorderLoadedFlights(flightId, direction)}
        />
      ) : (
        <ProjectListView
          projects={projects}
          dateFilter={dateFilter}
          sortMode={sortMode}
          onDateFilterChange={setDateFilter}
          onSortModeChange={setSortMode}
          onOpenProjectDetail={handleOpenProjectDetail}
        />
      )}
    </div>
  );
}
