// ============================================================================
// ViewModeToggle — 2D/3D switch for the monitoring map, matching the button in
// the catalog's map control rail.
//
// Rendered by the page rather than by either view, so it survives the swap
// between MapView and SceneView instead of unmounting with the one being left.
// ============================================================================

interface ViewModeToggleProps {
  is3D: boolean;
  onToggle: () => void;
}

export function ViewModeToggle({ is3D, onToggle }: ViewModeToggleProps) {
  const label = is3D ? 'Switch to 2D view' : 'Switch to 3D view';

  return (
    <button
      id="monitoring-view-mode-toggle"
      type="button"
      onClick={onToggle}
      aria-label={label}
      title={label}
      className="absolute right-4 top-4 z-40 flex h-8 w-8 items-center justify-center rounded border border-gray-300 bg-white text-[11px] font-bold tracking-wide text-gray-700 shadow-sm transition-colors hover:bg-gray-50 active:bg-gray-100"
    >
      {is3D ? '2D' : '3D'}
    </button>
  );
}
