interface GBIFOverviewTabProps {
  totalCount: number;
  loading: boolean;
  onBrowseClick: () => void;
}

export function GBIFOverviewTab({ totalCount, loading, onBrowseClick }: GBIFOverviewTabProps) {
  const countDisplay = loading ? '...' : totalCount.toLocaleString();

  return (
    <div id="gbif-overview-tab" className="space-y-5">
      <p id="gbif-overview-description" className="text-sm text-gray-600 leading-relaxed">
        GBIF species occurrence records from the Dangermond Preserve footprint and adjacent area.
        Includes observations and specimen records with taxonomy, collection context, and source attribution.
      </p>

      <div id="gbif-overview-metadata" className="bg-slate-50 rounded-lg p-4">
        <dl id="gbif-overview-metadata-list" className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
          <MetaRow label="Total occurrences" value={countDisplay} />
          <MetaRow label="Coverage" value="Dangermond region" />
          <MetaRow label="Source" value="TNC ArcGIS FeatureServer" />
          <MetaRow label="Record types" value="Observation + specimen" />
          <MetaRow label="Media" value="When available" />
          <MetaRow label="Taxonomy" value="Kingdom to species" />
        </dl>
      </div>

      <button
        id="gbif-browse-cta"
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
