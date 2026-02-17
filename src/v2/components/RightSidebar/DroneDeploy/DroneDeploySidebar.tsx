import { useEffect, useMemo, useState } from 'react';
import type { DroneImageryMetadata, DroneImageryProject } from '../../../../types/droneImagery';
import { useLayers } from '../../../context/LayerContext';
import { useDroneDeploy } from '../../../context/DroneDeployContext';
import { InlineLoadingRow } from '../../shared/loading/LoadingPrimitives';
import { FlightDetailView } from './FlightDetailView';
import { ProjectListView } from './ProjectListView';

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

  useEffect(() => {
    if (activeLayer?.layerId !== 'dataset-193') return;
    if (activeFlightId != null) {
      setShowDetailView(true);
      return;
    }
    setShowDetailView(false);
  }, [activeLayer?.layerId, activeFlightId]);

  const handleOpenProjectDetail = (project: DroneImageryProject) => {
    const nextFlight = project.imageryLayers[0];
    if (!nextFlight) return;
    setShowDetailView(true);
    setSelectedFlightId(nextFlight.id);
    activateLayer('dataset-193', undefined, nextFlight.id);
  };

  const handleTogglePinned = (flight: DroneImageryMetadata) => {
    const isLoaded = loadedFlightIds.includes(flight.id);
    if (!isLoaded) {
      if (!isLayerPinned('dataset-193')) {
        pinLayer('dataset-193');
      }
      const viewId = createOrUpdateDroneView('dataset-193', flight);
      setFlightLoaded(flight.id, true);
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
    setFlightLoaded(flight.id, true);
    setSelectedFlightId(flight.id);
    requestFlyToFlight(flight.id);
    activateLayer('dataset-193', viewId, flight.id);
  };

  const handleSelectFlight = (flight: DroneImageryMetadata) => {
    const pinned = getPinnedByLayerId('dataset-193');
    const matchingView = pinned?.views?.find((view) => view.droneView?.flightId === flight.id);
    const currentlyVisibleView = pinned?.views?.find((view) => view.isVisible);
    if (pinned && currentlyVisibleView && currentlyVisibleView.droneView?.flightId !== flight.id) {
      toggleChildVisibility(pinned.id, currentlyVisibleView.id);
    }
    if (pinned && matchingView && !matchingView.isVisible) {
      toggleChildVisibility(pinned.id, matchingView.id);
    }
    setSelectedFlightId(flight.id);
    requestFlyToFlight(flight.id);
    activateLayer('dataset-193', matchingView?.id, flight.id);
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
          selectedFlightId={currentFlight.id}
          onBack={() => {
            setShowDetailView(false);
            activateLayer('dataset-193');
          }}
          onSelectFlight={handleSelectFlight}
          onTogglePinned={() => handleTogglePinned(currentFlight)}
          onSaveView={() => handleSaveAsView(currentFlight)}
          onFlyTo={() => requestFlyToFlight(currentFlight.id)}
          onOpacityChange={(next) => setFlightOpacity(currentFlight.id, next)}
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
