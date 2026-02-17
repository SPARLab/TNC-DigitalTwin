import { ChevronLeft, ChevronRight, MapPinned, Pin, PinOff } from 'lucide-react';
import { useLayers } from '../../../context/LayerContext';
import { useDroneDeploy } from '../../../context/DroneDeployContext';

function formatDateLabel(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function DroneTemporalCarousel() {
  const { activeLayer, activateLayer } = useLayers();
  const {
    selectedFlightId,
    loadedFlightIds,
    projects,
    getFlightById,
    getProjectByFlightId,
    setSelectedFlightId,
    setFlightLoaded,
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
  const isPinned = loadedFlightIds.includes(effectiveFlightId);

  const handleSelectIndex = (index: number) => {
    const nextFlight = selectedProject.imageryLayers[index];
    if (!nextFlight) return;
    setSelectedFlightId(nextFlight.id);
    requestFlyToFlight(nextFlight.id);
    activateLayer('dataset-193', undefined, nextFlight.id);
  };

  return (
    <div id="drone-temporal-carousel-root" className="pointer-events-none absolute inset-x-0 bottom-6 z-[45] flex justify-center px-4">
      <div id="drone-temporal-carousel-shell" className="pointer-events-auto w-full max-w-3xl rounded-xl border border-gray-200 bg-white/95 px-4 py-3 shadow-lg backdrop-blur">
        <div id="drone-temporal-carousel-header" className="mb-3 flex items-center justify-between gap-3">
          <div id="drone-temporal-carousel-header-text" className="min-w-0">
            <p id="drone-temporal-carousel-project-name" className="truncate text-sm font-semibold text-gray-900">
              {selectedProject.projectName}
            </p>
            <p id="drone-temporal-carousel-flight-meta" className="truncate text-xs text-gray-600">
              {selectedFlight.planName} - {formatDateLabel(selectedFlight.dateCaptured)} - {currentIndex + 1} / {selectedProject.imageryLayers.length}
            </p>
          </div>
          <button
            id="drone-temporal-carousel-pin-toggle"
            type="button"
            onClick={() => setFlightLoaded(effectiveFlightId, !isPinned)}
            className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors ${
              isPinned
                ? 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            {isPinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
            {isPinned ? 'Unpin Flight' : 'Pin Flight'}
          </button>
        </div>

        <div id="drone-temporal-carousel-controls" className="flex items-center justify-between gap-3">
          <button
            id="drone-temporal-carousel-prev-button"
            type="button"
            disabled={!hasPrevious}
            onClick={() => handleSelectIndex(currentIndex - 1)}
            className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${
              hasPrevious
                ? 'border-gray-300 bg-white text-gray-700 hover:bg-gray-100'
                : 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400'
            }`}
            aria-label="Select previous flight"
            title="Previous flight"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div id="drone-temporal-carousel-dots" className="flex max-w-[70%] flex-wrap items-center justify-center gap-1.5">
            {selectedProject.imageryLayers.map((flight, index) => {
              const dotActive = index === currentIndex;
              const dotPinned = loadedFlightIds.includes(flight.id);
              return (
                <button
                  key={flight.id}
                  id={`drone-temporal-carousel-dot-${flight.id}`}
                  type="button"
                  onClick={() => handleSelectIndex(index)}
                    className={`relative h-3 w-3 rounded-full transition-colors ${dotActive ? 'bg-blue-600' : dotPinned ? 'bg-emerald-500' : 'bg-gray-300 hover:bg-gray-400'}`}
                  title={`${flight.planName} (${formatDateLabel(flight.dateCaptured)})`}
                  aria-label={`Select flight ${index + 1}`}
                >
                  {dotPinned && (
                    <MapPinned id={`drone-temporal-carousel-dot-pin-${flight.id}`} className="absolute -right-1.5 -top-2 h-3 w-3 text-emerald-700" />
                  )}
                </button>
              );
            })}
          </div>

          <button
            id="drone-temporal-carousel-next-button"
            type="button"
            disabled={!hasNext}
            onClick={() => handleSelectIndex(currentIndex + 1)}
            className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${
              hasNext
                ? 'border-gray-300 bg-white text-gray-700 hover:bg-gray-100'
                : 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400'
            }`}
            aria-label="Select next flight"
            title="Next flight"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
