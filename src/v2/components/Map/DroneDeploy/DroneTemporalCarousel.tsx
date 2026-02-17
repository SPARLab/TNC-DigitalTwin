import { ChevronLeft, ChevronRight, MapPinned } from 'lucide-react';
import { useLayers } from '../../../context/LayerContext';
import { useDroneDeploy } from '../../../context/DroneDeployContext';

export function DroneTemporalCarousel() {
  const { activeLayer, activateLayer } = useLayers();
  const {
    selectedFlightId,
    loadedFlightIds,
    projects,
    getFlightById,
    getProjectByFlightId,
    setSelectedFlightId,
    requestFlyToFlight,
  } = useDroneDeploy();

  if (activeLayer?.layerId !== 'dataset-193') return null;
  const fallbackFlightId = projects[0]?.imageryLayers[0]?.id ?? null;
  const effectiveFlightId = selectedFlightId ?? fallbackFlightId;
  if (effectiveFlightId == null) return null;

  const selectedFlight = getFlightById(effectiveFlightId);
  if (!selectedFlight) return null;

  const selectedProject = getProjectByFlightId(effectiveFlightId);
  if (!selectedProject || selectedProject.imageryLayers.length <= 1) return null;

  const currentIndex = selectedProject.imageryLayers.findIndex((flight) => flight.id === effectiveFlightId);
  if (currentIndex < 0) return null;

  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < selectedProject.imageryLayers.length - 1;

  const handleSelectIndex = (index: number) => {
    const nextFlight = selectedProject.imageryLayers[index];
    if (!nextFlight) return;
    setSelectedFlightId(nextFlight.id);
    requestFlyToFlight(nextFlight.id);
    activateLayer('dataset-193', undefined, nextFlight.id);
  };

  return (
    <div id="drone-temporal-carousel-root" className="pointer-events-none absolute inset-0 z-[45]">
      <div id="drone-temporal-carousel-prev-wrap" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
        <button
          id="drone-temporal-carousel-prev-button"
          type="button"
          disabled={!hasPrevious}
          onClick={() => handleSelectIndex(currentIndex - 1)}
          className={`pointer-events-auto bg-white/95 backdrop-blur-sm rounded-full shadow-lg p-3 transition-all ${
            hasPrevious
              ? 'hover:bg-gray-100 hover:scale-105 text-gray-700'
              : 'opacity-40 cursor-not-allowed text-gray-400'
          }`}
          aria-label="Select previous flight"
          title="Previous flight"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      </div>

      <div id="drone-temporal-carousel-next-wrap" className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">
        <button
          id="drone-temporal-carousel-next-button"
          type="button"
          disabled={!hasNext}
          onClick={() => handleSelectIndex(currentIndex + 1)}
          className={`pointer-events-auto bg-white/95 backdrop-blur-sm rounded-full shadow-lg p-3 transition-all ${
            hasNext
              ? 'hover:bg-gray-100 hover:scale-105 text-gray-700'
              : 'opacity-40 cursor-not-allowed text-gray-400'
          }`}
          aria-label="Select next flight"
          title="Next flight"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      <div
        id="drone-temporal-carousel-dots-wrap"
        className="pointer-events-none absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <div
          id="drone-temporal-carousel-dots"
          className="pointer-events-auto flex max-w-[70vw] flex-wrap items-center justify-center gap-2 rounded-full bg-white/90 px-3 py-1.5 shadow-lg backdrop-blur-sm"
        >
          {selectedProject.imageryLayers.map((flight, index) => {
            const dotActive = index === currentIndex;
            const dotPinned = loadedFlightIds.includes(flight.id);
            return (
              <button
                key={flight.id}
                id={`drone-temporal-carousel-dot-${flight.id}`}
                type="button"
                onClick={() => handleSelectIndex(index)}
                className={`relative h-2.5 w-2.5 rounded-full transition-colors ${
                  dotActive ? 'bg-blue-600' : dotPinned ? 'bg-emerald-500' : 'bg-gray-300 hover:bg-gray-400'
                }`}
                title={`${selectedProject.projectName} (${index + 1}/${selectedProject.imageryLayers.length})`}
                aria-label={`Select flight ${index + 1}`}
              >
                {dotPinned && (
                  <MapPinned id={`drone-temporal-carousel-dot-pin-${flight.id}`} className="absolute -right-1.5 -top-2 h-3 w-3 text-emerald-700" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
