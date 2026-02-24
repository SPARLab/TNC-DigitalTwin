interface CalFloraOverviewTabProps {
  totalCount: number;
  loading: boolean;
  onBrowseClick: () => void;
}

export function CalFloraOverviewTab({ totalCount, loading, onBrowseClick }: CalFloraOverviewTabProps) {
  const countDisplay = loading ? '...' : totalCount.toLocaleString();

  return (
    <div id="calflora-overview-tab" className="space-y-5">
      <p id="calflora-overview-description" className="text-sm text-gray-600 leading-relaxed">
        CalFlora plant observations from the Dangermond Preserve footprint. Records include
        taxonomy text, observer metadata, and optional photos for selected observations.
      </p>

      <div id="calflora-overview-metadata" className="bg-slate-50 rounded-lg p-4">
        <dl id="calflora-overview-metadata-list" className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
          <MetaRow label="Total observations" value={countDisplay} />
          <MetaRow label="Coverage" value="Dangermond Preserve" />
          <MetaRow label="Geometry" value="Point observations" />
          <MetaRow label="Source" value="CalFlora Hosted FS" />
          <MetaRow label="Photos" value="Available for subset" />
          <MetaRow label="Taxonomy field" value="plant (text)" />
        </dl>
      </div>

      <button
        id="calflora-browse-cta"
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
