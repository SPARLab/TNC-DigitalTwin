// ============================================================================
// DendraOverviewTab — Metadata grid + "Browse Stations →" CTA.
// Shows sensor type description, station count, and key dataset stats.
// ============================================================================

import { useEffect, useState } from 'react';
import { useCatalog } from '../../../context/CatalogContext';
import { useLayers } from '../../../context/LayerContext';
import { fetchServiceDescription } from '../../../services/tncArcgisService';

interface DendraOverviewTabProps {
  stationCount: number;
  loading: boolean;
  layerTitle: string | null;
  onBrowseClick: () => void;
}

export function DendraOverviewTab({
  stationCount, loading, layerTitle, onBrowseClick,
}: DendraOverviewTabProps) {
  const countDisplay = loading ? '...' : stationCount.toLocaleString();
  const { activeLayer } = useLayers();
  const { layerMap } = useCatalog();
  const activeCatalogLayer = activeLayer?.dataSource === 'dendra'
    ? layerMap.get(activeLayer.layerId)
    : undefined;
  const catalogDescription = activeCatalogLayer?.catalogMeta?.description?.trim() || '';
  const [resolvedDescription, setResolvedDescription] = useState(catalogDescription);

  useEffect(() => {
    let cancelled = false;
    setResolvedDescription(catalogDescription);

    const serviceMeta = activeCatalogLayer?.catalogMeta;
    if (!serviceMeta?.hasFeatureServer) return () => { cancelled = true; };

    fetchServiceDescription(serviceMeta)
      .then((serviceDescription) => {
        if (cancelled || !serviceDescription) return;
        setResolvedDescription(serviceDescription);
      })
      .catch(() => {
        // Keep catalog/fallback description when metadata fetch fails.
      });

    return () => {
      cancelled = true;
    };
  }, [activeCatalogLayer, catalogDescription]);

  return (
    <div id="dendra-overview-tab" className="space-y-5">
      {/* Description */}
      <p id="dendra-overview-description" className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
        {resolvedDescription || (
          <>
            Real-time and historical sensor data from the Dangermond Preserve.
            {layerTitle && (
              <> This layer shows <strong>{layerTitle}</strong> with
              station locations and associated datastream measurements.</>
            )}
          </>
        )}
      </p>

      {/* Metadata grid */}
      <div id="dendra-overview-metadata" className="bg-slate-50 rounded-lg p-4">
        <dl className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
          <MetaRow label="Stations" value={countDisplay} />
          <MetaRow label="Sensor Type" value={layerTitle ?? '—'} />
          <MetaRow label="Source" value="Dendra / ArcGIS FeatureServer" />
          <MetaRow label="Coverage" value="Dangermond Preserve" />
          <MetaRow label="Schema" value="Locations + Summaries + Data" />
          <MetaRow label="Update frequency" value="Continuous" />
        </dl>
      </div>

      {/* Browse CTA */}
      <button
        id="dendra-browse-cta"
        onClick={onBrowseClick}
        className="w-full py-3 bg-[#2e7d32] text-white font-medium rounded-lg
                   hover:bg-[#256d29] hover:scale-[1.02] active:scale-100
                   focus:outline-none focus:ring-2 focus:ring-[#2e7d32] focus:ring-offset-2
                   transition-all duration-150 ease-out text-sm min-h-[44px]"
      >
        Browse Stations &rarr;
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
