interface MOTUSOverviewTabProps {
  onBrowseClick: () => void;
}

export function MOTUSOverviewTab({ onBrowseClick }: MOTUSOverviewTabProps) {
  return (
    <div id="motus-overview-tab" className="space-y-5">
      <div id="motus-overview-description" className="space-y-3">
        <p id="motus-overview-description-primary" className="text-sm text-gray-700 leading-relaxed">
          Explore Motus wildlife telemetry detections for tagged animals and receiver stations.
          This view focuses on movement context and detection timing.
        </p>
        <p id="motus-overview-description-secondary" className="text-sm text-gray-600 leading-relaxed">
          Path lines shown in later phases are inferred movement estimates, not exact flight
          trajectories, consistent with Motus guidance.
        </p>
      </div>

      <div id="motus-overview-metadata" className="bg-slate-50 rounded-lg p-4">
        <dl id="motus-overview-metadata-grid" className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <dt id="motus-overview-row-type-label" className="text-gray-500">Row type</dt>
          <dd id="motus-overview-row-type-value" className="text-right font-medium text-gray-900">
            Tagged animals
          </dd>

          <dt id="motus-overview-time-label" className="text-gray-500">Time model</dt>
          <dd id="motus-overview-time-value" className="text-right font-medium text-gray-900">
            Detection runs
          </dd>

          <dt id="motus-overview-source-label" className="text-gray-500">Source</dt>
          <dd id="motus-overview-source-value" className="text-right font-medium text-gray-900">
            Wildlife Telemetry FeatureServer
          </dd>
        </dl>
      </div>

      <button
        id="motus-overview-browse-cta"
        onClick={onBrowseClick}
        className="w-full py-3 bg-[#2e7d32] text-white font-medium rounded-lg
                   hover:bg-[#256d29] hover:scale-[1.02] active:scale-100
                   focus:outline-none focus:ring-2 focus:ring-[#2e7d32] focus:ring-offset-2
                   transition-all duration-150 ease-out text-sm min-h-[44px]"
      >
        Browse Species &amp; Tags &rarr;
      </button>
    </div>
  );
}
