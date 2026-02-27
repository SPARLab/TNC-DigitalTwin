// ============================================================================
// AnimlLegendWidget — Floating map key for camera trap markers.
// Camera traps now use a single map symbol, so this stays intentionally minimal.
// ============================================================================

export function AnimlLegendWidget() {
  return (
    <div
      id="animl-legend-widget"
      className="absolute bottom-6 right-6 bg-white rounded-lg shadow-lg border border-gray-300 z-30 w-72"
      aria-label="Camera trap map legend"
    >
      <div
        id="animl-legend-header"
        className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200 rounded-t-lg"
      >
        <h3 id="animl-legend-title" className="text-sm font-semibold text-gray-900">
          Camera Traps
        </h3>
      </div>

      <div id="animl-legend-content" className="p-2 rounded-b-lg">
        <div
          id="animl-legend-item-camera"
          className="flex items-center gap-2 rounded border border-gray-200 bg-gray-50 px-3 py-2"
        >
          <span id="animl-legend-item-camera-icon" className="flex h-7 w-7 items-center justify-center text-gray-800">
            <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
              <rect x="4" y="6" width="16" height="12" rx="2" ry="2" stroke="currentColor" strokeWidth="2.2" />
              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2.2" />
              <line x1="8" y1="18" x2="6" y2="22" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
              <line x1="12" y1="18" x2="12" y2="22" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
              <line x1="16" y1="18" x2="18" y2="22" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
              <rect x="15" y="7" width="3" height="2" rx="0.5" stroke="currentColor" strokeWidth="2.2" />
            </svg>
          </span>
          <span id="animl-legend-item-camera-label" className="text-sm font-medium text-gray-800">
            Camera Trap Marker
          </span>
        </div>
      </div>
    </div>
  );
}
