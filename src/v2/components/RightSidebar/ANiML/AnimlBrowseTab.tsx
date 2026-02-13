// ============================================================================
// AnimlBrowseTab — Entry point for camera trap browsing
// Two sequential flows (DFT-003c, DFT-042):
//   Animal-first: animal list → click animal → AnimalDetailView (cameras + images)
//   Camera-first: camera list → click camera → CameraDetailView (animals + images)
// Mode preference stored in localStorage.
// ============================================================================

import { useState, useCallback, useMemo } from 'react';
import { Camera, PawPrint, ArrowLeftRight, Loader2, AlertCircle } from 'lucide-react';
import { useAnimlFilter } from '../../../context/AnimlFilterContext';
import { CameraListView } from './CameraListView';
import { CameraDetailView } from './CameraDetailView';
import { AnimalListView } from './AnimalListView';
import { AnimalDetailView } from './AnimalDetailView';

type BrowseMode = 'camera-first' | 'animal-first';

const STORAGE_KEY = 'animl-browse-mode';

function getStoredMode(): BrowseMode | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'camera-first' || stored === 'animal-first') return stored;
  } catch { /* localStorage unavailable */ }
  return null;
}

export function AnimlBrowseTab() {
  const {
    deployments, animalTags, loading, error, dataLoaded,
    getFilteredCountForDeployment, matchingDeploymentIds,
    hasFilter, selectAll,
  } = useAnimlFilter();

  const [mode, setMode] = useState<BrowseMode | null>(getStoredMode);
  const [selectedCameraId, setSelectedCameraId] = useState<number | null>(null);
  const [selectedAnimalLabel, setSelectedAnimalLabel] = useState<string | null>(null);

  // Mode selection handler
  const handleSelectMode = useCallback((newMode: BrowseMode) => {
    setMode(newMode);
    try { localStorage.setItem(STORAGE_KEY, newMode); } catch { /* noop */ }
  }, []);

  // Mode switch (DFT-042)
  const handleSwitchMode = useCallback(() => {
    if (hasFilter) {
      const confirmed = window.confirm(
        'Switching modes will clear your current filters. Continue?',
      );
      if (!confirmed) return;
      selectAll();
    }
    const newMode = mode === 'camera-first' ? 'animal-first' : 'camera-first';
    handleSelectMode(newMode);
    setSelectedCameraId(null);
    setSelectedAnimalLabel(null);
  }, [mode, hasFilter, selectAll, handleSelectMode]);

  // Find selected deployment for camera detail view
  const selectedDeployment = useMemo(
    () => deployments.find(d => d.id === selectedCameraId) ?? null,
    [deployments, selectedCameraId],
  );

  // ── Loading / Error ────────────────────────────────────────────────────

  if (loading || !dataLoaded) {
    return (
      <div id="animl-browse-loading" className="flex items-center justify-center py-12 text-gray-400">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        <span className="text-sm">Loading camera trap data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div id="animl-browse-error" className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
        <AlertCircle className="w-4 h-4 flex-shrink-0" />
        {error}
      </div>
    );
  }

  // ── Landing cards (no mode chosen yet) ────────────────────────────────

  if (!mode) {
    return (
      <div id="animl-browse-landing" className="space-y-4">
        <p className="text-sm text-gray-600">
          Choose how you'd like to explore camera trap data:
        </p>

        <button
          id="animl-mode-animal-first"
          onClick={() => handleSelectMode('animal-first')}
          className="w-full text-left p-4 bg-slate-50 rounded-lg border border-gray-200
                     hover:border-emerald-300 hover:bg-emerald-50 transition-all group"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg group-hover:bg-emerald-200 transition-colors">
              <PawPrint className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Browse by Animal</h3>
              <p className="text-xs text-gray-500 mt-1">
                Pick a species, then see which cameras detected it.
              </p>
            </div>
          </div>
        </button>

        <button
          id="animl-mode-camera-first"
          onClick={() => handleSelectMode('camera-first')}
          className="w-full text-left p-4 bg-slate-50 rounded-lg border border-gray-200
                     hover:border-emerald-300 hover:bg-emerald-50 transition-all group"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg group-hover:bg-emerald-200 transition-colors">
              <Camera className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Browse by Camera</h3>
              <p className="text-xs text-gray-500 mt-1">
                Pick a camera location, then filter by species.
              </p>
            </div>
          </div>
        </button>
      </div>
    );
  }

  // ── Detail views (item selected) ──────────────────────────────────────

  // Camera-first → camera detail
  if (mode === 'camera-first' && selectedDeployment) {
    return (
      <CameraDetailView
        deployment={selectedDeployment}
        onBack={() => setSelectedCameraId(null)}
      />
    );
  }

  // Animal-first → animal detail
  if (mode === 'animal-first' && selectedAnimalLabel) {
    return (
      <AnimalDetailView
        animalLabel={selectedAnimalLabel}
        onBack={() => setSelectedAnimalLabel(null)}
      />
    );
  }

  // ── List views (mode chosen, no item selected) ────────────────────────

  const otherModeLabel = mode === 'camera-first' ? 'Browse by Animal' : 'Browse by Camera';

  return (
    <div id="animl-browse-tab" className="space-y-3">
      {/* Mode switch link (DFT-042) */}
      <button
        id="animl-mode-switch"
        onClick={handleSwitchMode}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-emerald-600 transition-colors"
        aria-label={`Switch to ${otherModeLabel}`}
      >
        <ArrowLeftRight className="w-3.5 h-3.5" />
        <span>Switch to {otherModeLabel}</span>
      </button>

      {/* Camera-first: show camera list */}
      {mode === 'camera-first' && (
        <CameraListView
          deployments={deployments}
          matchingDeploymentIds={matchingDeploymentIds}
          getFilteredCount={getFilteredCountForDeployment}
          hasFilter={hasFilter}
          onSelectCamera={setSelectedCameraId}
        />
      )}

      {/* Animal-first: show animal list */}
      {mode === 'animal-first' && (
        <AnimalListView
          animalTags={animalTags}
          onSelectAnimal={setSelectedAnimalLabel}
        />
      )}
    </div>
  );
}
