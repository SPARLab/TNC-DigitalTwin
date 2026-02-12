// ============================================================================
// AnimlBrowseTab — Entry point for camera trap browsing
// Shows landing cards (Animal-First vs Camera-First) on first visit (DFT-003c).
// Once a mode is chosen, renders filters + camera list or animal list.
// Mode preference stored in localStorage (DFT-042).
// ============================================================================

import { useState, useCallback, useMemo } from 'react';
import { Camera, PawPrint, ArrowLeftRight, Loader2, AlertCircle } from 'lucide-react';
import { useAnimlFilter } from '../../../context/AnimlFilterContext';
import { CameraListView } from './CameraListView';
import { CameraDetailView } from './CameraDetailView';

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
    selectedAnimals, hasFilter, toggleAnimal, selectAll,
  } = useAnimlFilter();

  const [mode, setMode] = useState<BrowseMode | null>(getStoredMode);
  const [selectedCameraId, setSelectedCameraId] = useState<number | null>(null);

  // Mode selection handler
  const handleSelectMode = useCallback((newMode: BrowseMode) => {
    setMode(newMode);
    try { localStorage.setItem(STORAGE_KEY, newMode); } catch { /* noop */ }
  }, []);

  // Mode switch (DFT-042)
  const handleSwitchMode = useCallback(() => {
    if (hasFilter) {
      // Confirm if filters are active
      const confirmed = window.confirm(
        'Switching modes will clear your current filters. Continue?',
      );
      if (!confirmed) return;
      selectAll(); // clear filters
    }
    const newMode = mode === 'camera-first' ? 'animal-first' : 'camera-first';
    handleSelectMode(newMode);
    setSelectedCameraId(null);
  }, [mode, hasFilter, selectAll, handleSelectMode]);

  // Find selected deployment for detail view
  const selectedDeployment = useMemo(
    () => deployments.find(d => d.id === selectedCameraId) ?? null,
    [deployments, selectedCameraId],
  );

  // ── Loading state ──────────────────────────────────────────────────────

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

  // ── Landing cards (no mode selected yet) ──────────────────────────────

  if (!mode) {
    return (
      <div id="animl-browse-landing" className="space-y-4">
        <p className="text-sm text-gray-600">
          Choose how you'd like to explore camera trap data:
        </p>

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
                Explore camera locations and filter by species, date, and deployment.
              </p>
            </div>
          </div>
        </button>

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
                Start from a species and see which cameras detected it.
              </p>
            </div>
          </div>
        </button>
      </div>
    );
  }

  // ── Detail view (camera selected) ─────────────────────────────────────

  if (selectedDeployment) {
    return (
      <CameraDetailView
        deployment={selectedDeployment}
        onBack={() => setSelectedCameraId(null)}
      />
    );
  }

  // ── Camera/animal list (mode selected) ────────────────────────────────

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

      {/* Animal filter section (both modes use it) */}
      <div id="animl-filter-section" className="bg-slate-50 rounded-lg p-3 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Filter by Species
          </span>
          {hasFilter && (
            <button
              id="animl-filter-show-all"
              onClick={selectAll}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
            >
              Show All
            </button>
          )}
        </div>

        <div className="space-y-1 max-h-48 overflow-y-auto">
          {animalTags.map(tag => {
            const isSelected = !hasFilter || selectedAnimals.has(tag.label);
            return (
              <label
                key={tag.label}
                className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-emerald-50 hover:bg-emerald-100'
                    : 'bg-gray-50 hover:bg-gray-100 opacity-60'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleAnimal(tag.label)}
                  className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                />
                <span className={`text-sm flex-1 ${isSelected ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                  {tag.label}
                </span>
                <span className="text-xs text-gray-400">
                  {tag.totalObservations.toLocaleString()}
                </span>
              </label>
            );
          })}
        </div>

        <p className="text-xs text-gray-500 italic">
          Tip: You can also filter using the legend widget on the map
        </p>
      </div>

      {/* Camera list */}
      <CameraListView
        deployments={deployments}
        animalTags={animalTags}
        selectedAnimals={selectedAnimals}
        onSelectCamera={setSelectedCameraId}
      />
    </div>
  );
}
