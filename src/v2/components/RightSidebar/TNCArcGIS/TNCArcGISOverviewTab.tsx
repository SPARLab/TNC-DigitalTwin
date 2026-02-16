import { useCatalog } from '../../../context/CatalogContext';
import { useLayers } from '../../../context/LayerContext';

interface TNCArcGISOverviewTabProps {
  loading: boolean;
  onBrowseClick: () => void;
}

export function TNCArcGISOverviewTab({ loading, onBrowseClick }: TNCArcGISOverviewTabProps) {
  const { activeLayer } = useLayers();
  const { layerMap } = useCatalog();
  const activeCatalogLayer = activeLayer ? layerMap.get(activeLayer.layerId) : undefined;

  const description = activeCatalogLayer?.catalogMeta?.description || 'No description available yet.';
  const servicePath = activeCatalogLayer?.catalogMeta?.servicePath || 'Unknown service path';
  const serverBaseUrl = activeCatalogLayer?.catalogMeta?.serverBaseUrl || 'Unknown host';
  const sourceLabel = `${serverBaseUrl}/${servicePath}`;

  return (
    <div id="tnc-arcgis-overview-tab" className="space-y-5">
      <div id="tnc-arcgis-overview-description-block" className="space-y-2">
        <h3 id="tnc-arcgis-overview-title" className="text-sm font-semibold text-gray-900">
          TNC ArcGIS Service
        </h3>
        <p id="tnc-arcgis-overview-description" className="text-sm text-gray-600 leading-relaxed">
          {description}
        </p>
      </div>

      <div id="tnc-arcgis-overview-metadata" className="bg-slate-50 rounded-lg p-4">
        <dl id="tnc-arcgis-overview-metadata-list" className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
          <dt id="tnc-arcgis-overview-source-label" className="text-gray-500">Source</dt>
          <dd id="tnc-arcgis-overview-source-value" className="text-gray-900 font-medium text-right truncate" title={sourceLabel}>
            {sourceLabel}
          </dd>
          <dt id="tnc-arcgis-overview-type-label" className="text-gray-500">Status</dt>
          <dd id="tnc-arcgis-overview-type-value" className="text-gray-900 font-medium text-right">
            {loading ? 'Loading schema...' : 'Schema cached'}
          </dd>
        </dl>
      </div>

      <button
        id="tnc-arcgis-overview-browse-cta"
        onClick={onBrowseClick}
        className="w-full py-3 bg-[#2e7d32] text-white font-medium rounded-lg
                   hover:bg-[#256d29] transition-colors text-sm min-h-[44px]"
      >
        Browse Features &rarr;
      </button>
    </div>
  );
}
