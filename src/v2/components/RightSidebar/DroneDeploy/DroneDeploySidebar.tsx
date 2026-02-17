import { useMemo, useState } from 'react';
import type { DroneImageryMetadata } from '../../../../types/droneImagery';
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
    setDateFilter,
    setSortMode,
    setFlightLoaded,
    setFlightOpacity,
    requestFlyToFlight,
  } = useDroneDeploy();
  const { activeLayer, activateLayer } = useLayers();
  const activeFlightId = typeof activeLayer?.featureId === 'number' ? activeLayer.featureId : undefined;
  const [detailFlight, setDetailFlight] = useState<DroneImageryMetadata | null>(null);

  const activeFlightFromContext = useMemo(() => {
    if (activeFlightId == null) return null;
    for (const project of projects) {
      const match = project.imageryLayers.find((flight) => flight.id === activeFlightId);
      if (match) return match;
    }
    return null;
  }, [projects, activeFlightId]);

  const currentFlight = detailFlight ?? activeFlightFromContext;
  const currentProject = useMemo(() => {
    if (!currentFlight) return null;
    return projects.find((project) =>
      project.imageryLayers.some((flight) => flight.id === currentFlight.id)
    ) ?? null;
  }, [projects, currentFlight]);

  const handleOpenDetail = (flight: DroneImageryMetadata) => {
    setDetailFlight(flight);
    activateLayer('dataset-193', undefined, flight.id);
  };

  const handleToggleLoaded = (flight: DroneImageryMetadata) => {
    const isLoaded = loadedFlightIds.includes(flight.id);
    setFlightLoaded(flight.id, !isLoaded);
    if (!isLoaded) {
      requestFlyToFlight(flight.id);
      activateLayer('dataset-193', undefined, flight.id);
    }
  };

  return (
    <div id="drone-deploy-sidebar-shell">
      {currentFlight && currentProject ? (
        <FlightDetailView
          project={currentProject}
          flight={currentFlight}
          isLoaded={loadedFlightIds.includes(currentFlight.id)}
          opacity={opacityByFlightId[currentFlight.id] ?? 0.8}
          onBack={() => {
            setDetailFlight(null);
            activateLayer('dataset-193');
          }}
          onToggleLoaded={() => handleToggleLoaded(currentFlight)}
          onFlyTo={() => requestFlyToFlight(currentFlight.id)}
          onOpacityChange={(next) => setFlightOpacity(currentFlight.id, next)}
        />
      ) : (
        <ProjectListView
          projects={projects}
          dateFilter={dateFilter}
          sortMode={sortMode}
          loadedFlightIds={loadedFlightIds}
          selectedFlightId={activeFlightId}
          onDateFilterChange={setDateFilter}
          onSortModeChange={setSortMode}
          onOpenDetail={handleOpenDetail}
          onToggleLoaded={handleToggleLoaded}
        />
      )}
    </div>
  );
}
