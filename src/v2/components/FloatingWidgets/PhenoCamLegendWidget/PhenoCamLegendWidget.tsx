// ============================================================================
// PhenoCamLegendWidget — Floating map key for circled camera markers.
// ============================================================================

export function PhenoCamLegendWidget() {
  return (
    <div
      id="phenocam-legend-widget"
      className="absolute bottom-6 right-6 z-30 w-72 rounded-lg border border-gray-300 bg-white shadow-lg"
      aria-label="PhenoCam map legend"
    >
      <div
        id="phenocam-legend-header"
        className="rounded-t-lg border-b border-gray-200 bg-gray-50 px-4 py-3"
      >
        <h3 id="phenocam-legend-title" className="text-sm font-semibold text-gray-900">
          PhenoCam Sites
        </h3>
      </div>

      <div id="phenocam-legend-content" className="rounded-b-lg p-3">
        <div
          id="phenocam-legend-item-camera"
          className="flex items-center gap-3 rounded border border-gray-200 bg-gray-50 px-3 py-2"
        >
          <span
            id="phenocam-legend-item-camera-icon"
            className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-gray-800 bg-white text-gray-800 shadow-sm"
            aria-hidden="true"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
              <rect x="4" y="6" width="16" height="12" rx="2" ry="2" stroke="currentColor" strokeWidth="2" />
              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
              <line x1="8" y1="18" x2="6" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <line x1="12" y1="18" x2="12" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <line x1="16" y1="18" x2="18" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <rect x="15" y="7" width="3" height="2" rx="0.5" stroke="currentColor" strokeWidth="2" />
            </svg>
          </span>
          <span id="phenocam-legend-item-camera-label" className="text-sm font-medium text-gray-800">
            PhenoCam camera
          </span>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-gray-500">
          Click a site to browse its timestamped archive images.
        </p>
      </div>
    </div>
  );
}
