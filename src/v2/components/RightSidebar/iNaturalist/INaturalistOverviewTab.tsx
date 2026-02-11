// ============================================================================
// INaturalistOverviewTab — Metadata grid + "Browse Features →" button (DFT-027)
// Shows dataset description, key stats, and a prominent CTA to start browsing.
// ============================================================================

interface INaturalistOverviewTabProps {
  totalCount: number;
  loading: boolean;
  onBrowseClick: () => void;
}

export function INaturalistOverviewTab({ totalCount, loading, onBrowseClick }: INaturalistOverviewTabProps) {
  const countDisplay = loading ? '...' : totalCount.toLocaleString();

  return (
    <div id="inat-overview-tab" className="space-y-5">
      {/* Description */}
      <p className="text-sm text-gray-600 leading-relaxed">
        Research-grade community science observations from the Dangermond Preserve region.
        Includes verified species sightings with photos, locations, and observer information
        via TNC's curated iNaturalist dataset.
      </p>

      {/* Metadata grid */}
      <div id="inat-overview-metadata" className="bg-slate-50 rounded-lg p-4">
        <dl className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
          <MetaRow label="Total observations" value={countDisplay} />
          <MetaRow label="Coverage" value="Dangermond Preserve" />
          <MetaRow label="Source" value="TNC ArcGIS FeatureServer" />
          <MetaRow label="Taxa groups" value="11 categories" />
          <MetaRow label="Includes photos" value="Yes (when available)" />
          <MetaRow label="Update frequency" value="Periodic sync" />
        </dl>
      </div>

      {/* Browse Features CTA (DFT-027) */}
      <button
        id="inat-browse-cta"
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
