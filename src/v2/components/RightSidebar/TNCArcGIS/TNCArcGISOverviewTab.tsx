import { useMemo } from 'react';
import { useCatalog } from '../../../context/CatalogContext';
import { useLayers } from '../../../context/LayerContext';

interface TNCArcGISOverviewTabProps {
  loading: boolean;
  onBrowseClick: () => void;
}

function normalizeDescription(value: string | undefined): string {
  return (value ?? '').trim().replace(/\s+/g, ' ').toLowerCase();
}

export function TNCArcGISOverviewTab({ loading, onBrowseClick }: TNCArcGISOverviewTabProps) {
  const {
    activeLayer,
    isLayerPinned,
    pinLayer,
  } = useLayers();
  const { layerMap } = useCatalog();
  const activeCatalogLayer = activeLayer ? layerMap.get(activeLayer.layerId) : undefined;

  const siblingLayers = useMemo(
    () => activeCatalogLayer?.catalogMeta?.siblingLayers ?? [],
    [activeCatalogLayer],
  );
  const isServiceOverview = !!(activeLayer?.isService && siblingLayers.length > 0);

  const description = activeCatalogLayer?.catalogMeta?.description || 'No description available yet.';
  const normalizedServiceDescription = normalizeDescription(activeCatalogLayer?.catalogMeta?.description);
  const servicePath = activeCatalogLayer?.catalogMeta?.servicePath || 'Unknown service path';
  const serverBaseUrl = activeCatalogLayer?.catalogMeta?.serverBaseUrl || 'Unknown host';
  const sourceLabel = `${serverBaseUrl}/${servicePath}`;
  const activeLayerPinned = activeLayer ? isLayerPinned(activeLayer.layerId) : false;
  const activeLayerCanPin = !!activeLayer && !activeLayer.isService;

  const formatLayerLabel = (layerName: string, layerIdInService?: number) => (
    typeof layerIdInService === 'number'
      ? `${layerName} (Layer ${layerIdInService})`
      : layerName
  );

  const handlePinActiveLayer = () => {
    if (!activeLayer) return;
    pinLayer(activeLayer.layerId);
  };

  return (
    <div id="tnc-arcgis-overview-tab" className="space-y-5">
      {isServiceOverview ? (
        <>
          <div id="tnc-arcgis-overview-description-block" className="space-y-2">
            <h3 id="tnc-arcgis-overview-title" className="text-sm font-semibold text-gray-900">
              TNC ArcGIS Service
            </h3>
            <p id="tnc-arcgis-overview-description" className="text-sm text-gray-600 leading-relaxed">
              {description}
            </p>
          </div>

          <div id="tnc-arcgis-service-overview-layer-list-block" className="space-y-2">
            <h4 id="tnc-arcgis-service-overview-layer-list-title" className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Available Layers
            </h4>
            <p id="tnc-arcgis-service-overview-layer-list-help" className="text-xs text-gray-600">
              Select a child layer in the left sidebar to activate, browse, and pin.
            </p>
            <ul id="tnc-arcgis-service-overview-layer-list" className="space-y-2">
              {siblingLayers.map(layer => {
                const layerDescription = layer.catalogMeta?.description;
                const hasDistinctLayerDescription = !!(
                  normalizeDescription(layerDescription)
                  && normalizeDescription(layerDescription) !== normalizedServiceDescription
                );

                return (
                  <li id={`tnc-arcgis-service-overview-layer-${layer.id}`} key={layer.id} className="rounded-lg border border-gray-200 bg-white p-3">
                    <p
                      id={`tnc-arcgis-service-overview-layer-name-${layer.id}`}
                      className="text-sm font-medium text-gray-900"
                    >
                      {formatLayerLabel(layer.name, layer.catalogMeta?.layerIdInService)}
                    </p>
                    {hasDistinctLayerDescription && (
                      <p
                        id={`tnc-arcgis-service-overview-layer-description-${layer.id}`}
                        className="mt-1 text-xs text-gray-600 leading-relaxed"
                      >
                        {layerDescription}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          <div id="tnc-arcgis-overview-metadata" className="bg-slate-50 rounded-lg p-4">
            <dl id="tnc-arcgis-overview-metadata-list" className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
              <dt id="tnc-arcgis-overview-source-label" className="text-gray-500">Source</dt>
              <dd id="tnc-arcgis-overview-source-value" className="text-gray-900 font-medium text-right truncate" title={sourceLabel}>
                {sourceLabel}
              </dd>
              <dt id="tnc-arcgis-overview-type-label" className="text-gray-500">Status</dt>
              <dd id="tnc-arcgis-overview-type-value" className="text-gray-900 font-medium text-right">
                {loading ? 'Loading metadata...' : 'Ready'}
              </dd>
            </dl>
          </div>

          <div id="tnc-arcgis-service-overview-actions" className="grid grid-cols-2 gap-3">
            <div
              id="tnc-arcgis-service-overview-select-layer-cta"
              className="col-span-2 w-full py-3 rounded-lg border border-gray-300 bg-gray-50 text-gray-700 text-sm font-medium text-center min-h-[44px] flex items-center justify-center"
            >
              Select a layer from the left sidebar
            </div>
          </div>
        </>
      ) : (
        <>
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
            {loading ? 'Loading metadata...' : 'Ready'}
          </dd>
        </dl>
      </div>

          <div id="tnc-arcgis-overview-actions" className="grid grid-cols-2 gap-3">
            <button
              id="tnc-arcgis-overview-browse-cta"
              onClick={onBrowseClick}
              className="w-full py-3 bg-[#2e7d32] text-white font-medium rounded-lg
                         hover:bg-[#256d29] transition-colors text-sm min-h-[44px]"
            >
              Browse Features &rarr;
            </button>

            {activeLayerPinned ? (
              <div
                id="tnc-arcgis-overview-pinned-badge"
                className="w-full py-3 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 text-sm font-medium text-center min-h-[44px] flex items-center justify-center"
              >
                Pinned ✓
              </div>
            ) : !activeLayerCanPin ? (
              <div
                id="tnc-arcgis-overview-service-badge"
                className="w-full py-3 rounded-lg border border-gray-300 bg-gray-50 text-gray-700 text-sm font-medium text-center min-h-[44px] flex items-center justify-center"
              >
                Service selected
              </div>
            ) : (
              <button
                id="tnc-arcgis-overview-pin-cta"
                onClick={handlePinActiveLayer}
                className="w-full py-3 border border-blue-200 text-blue-700 font-medium rounded-lg hover:bg-blue-50 transition-colors text-sm min-h-[44px]"
              >
                Pin Layer
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
