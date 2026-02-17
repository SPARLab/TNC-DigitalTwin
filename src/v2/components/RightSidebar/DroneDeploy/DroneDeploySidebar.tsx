import { useEffect, useMemo, useState } from 'react';
import type { DroneImageryMetadata, DroneImageryProject } from '../../../../types/droneImagery';
import { useLayers } from '../../../context/LayerContext';
import { useDroneDeploy } from '../../../context/DroneDeployContext';
import { FlightDetailView } from './FlightDetailView';
import { ProjectListView } from './ProjectListView';

export function DroneDeploySidebar() {
  const {
    projects,
    dateFilter,
    sortMode,
    loadedFlightIds,
    opacityByFlightId,
    selectedFlightId,
    setDateFilter,
    setSortMode,
    setFlightLoaded,
    setFlightOpacity,
    setSelectedFlightId,
    requestFlyToFlight,
  } = useDroneDeploy();
  const { activeLayer, activateLayer } = useLayers();
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
    setFlightLoaded(flight.id, !isLoaded);
    if (isLoaded) return;
    setSelectedFlightId(flight.id);
    requestFlyToFlight(flight.id);
    activateLayer('dataset-193', undefined, flight.id);
  };

  const handleSelectFlight = (flight: DroneImageryMetadata) => {
    setSelectedFlightId(flight.id);
    requestFlyToFlight(flight.id);
    activateLayer('dataset-193', undefined, flight.id);
  };

  return (
    <div id="drone-deploy-sidebar-shell">
      {showDetailView && currentFlight && currentProject ? (
        <FlightDetailView
          project={currentProject}
          flight={currentFlight}
          isLoaded={loadedFlightIds.includes(currentFlight.id)}
          opacity={opacityByFlightId[currentFlight.id] ?? 0.8}
          selectedFlightId={currentFlight.id}
          onBack={() => {
            setShowDetailView(false);
            activateLayer('dataset-193');
          }}
          onSelectFlight={handleSelectFlight}
          onTogglePinned={() => handleTogglePinned(currentFlight)}
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
