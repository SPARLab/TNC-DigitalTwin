// ============================================================================
// AnimlOverviewTab — Metadata grid + "Browse Features →" button (DFT-027)
// Shows dataset description, key stats, and a prominent CTA to start browsing.
// ============================================================================

interface AnimlOverviewTabProps {
  totalDeployments: number;
  totalImageCount: number;
  loading: boolean;
  onBrowseClick: () => void;
}

export function AnimlOverviewTab({
  totalDeployments,
  totalImageCount,
  loading,
  onBrowseClick,
}: AnimlOverviewTabProps) {
  const deploymentDisplay = loading ? '...' : totalDeployments.toLocaleString();
  const imageDisplay = loading ? '...' : totalImageCount.toLocaleString();

  return (
    <div id="animl-overview-tab" className="space-y-5">
      {/* Description */}
      <p className="text-sm text-gray-600 leading-relaxed">
        Camera trap imagery from the Dangermond Preserve collected through the ANiML
        wildlife monitoring platform. Includes AI-tagged species detections with
        timestamps, deployment locations, and image thumbnails.
      </p>

      {/* Metadata grid */}
      <div id="animl-overview-metadata" className="bg-slate-50 rounded-lg p-4">
        <dl className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
          <MetaRow label="Camera deployments" value={deploymentDisplay} />
          <MetaRow label="Tagged images" value={imageDisplay} />
          <MetaRow label="Coverage" value="Dangermond Preserve" />
          <MetaRow label="Source" value="ANiML MapServer" />
          <MetaRow label="Detection method" value="AI + human review" />
          <MetaRow label="Update frequency" value="Continuous" />
        </dl>
      </div>

      {/* Browse Features CTA (DFT-027) */}
      <button
        id="animl-browse-cta"
        onClick={onBrowseClick}
        className="w-full py-3 bg-[#2e7d32] text-white font-medium rounded-lg
                   hover:bg-[#256d29] hover:scale-[1.02] active:scale-100
                   focus:outline-none focus:ring-2 focus:ring-[#2e7d32] focus:ring-offset-2
                   transition-all duration-150 ease-out text-sm min-h-[44px]"
      >
        Browse Features &rarr;
      </button>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-gray-500">{label}</dt>
      <dd className="text-gray-900 font-medium text-right">{value}</dd>
    </>
  );
}
