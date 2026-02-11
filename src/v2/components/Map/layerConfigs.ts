// ============================================================================
// Layer Configs — Maps catalog layer IDs to ArcGIS layer definitions
// Only layers with real data sources are configured here.
// Returns null for unimplemented layers (triggers "not implemented" toast).
// ============================================================================

export interface ArcGISLayerConfig {
  type: 'feature' | 'geojson';
  url: string;
  renderer?: __esri.RendererProperties;
  popupEnabled?: boolean;
  popupTemplate?: __esri.PopupTemplateProperties;
  minScale?: number;
  maxScale?: number;
  opacity?: number;
}

/** Taxon category colors matching iNaturalist iconic taxa */
const TAXON_COLORS: Record<string, [number, number, number, number]> = {
  Actinopterygii: [31, 119, 180, 0.85],  // Blue (Fish)
  Amphibia: [255, 127, 14, 0.85],        // Orange
  Arachnida: [44, 160, 44, 0.85],        // Green
  Aves: [214, 39, 40, 0.85],             // Red (Birds)
  Fungi: [148, 103, 189, 0.85],          // Purple
  Insecta: [140, 86, 75, 0.85],          // Brown
  Mammalia: [227, 119, 194, 0.85],       // Pink
  Mollusca: [127, 127, 127, 0.85],       // Gray
  Plantae: [188, 189, 34, 0.85],         // Olive
  Protozoa: [23, 190, 207, 0.85],        // Cyan
  Reptilia: [255, 152, 150, 0.85],       // Light Red
};

/** Build unique-value infos for iNaturalist taxon categories */
function buildTaxonUniqueValues(): __esri.UniqueValueInfoProperties[] {
  return Object.entries(TAXON_COLORS).map(([value, color]) => ({
    value,
    symbol: {
      type: 'simple-marker' as const,
      size: 6,
      color,
      outline: { color: [255, 255, 255, 0.7], width: 0.5 },
    },
  }));
}

/**
 * Get the ArcGIS layer config for a catalog layer ID.
 * Returns null if the layer has no real data source yet.
 */
export function getLayerConfig(layerId: string): ArcGISLayerConfig | null {
  switch (layerId) {
    case 'inaturalist-obs':
      return {
        type: 'feature',
        url: 'https://services9.arcgis.com/RHVPKKiFTONKtxq3/arcgis/rest/services/iNat_PreUC_View/FeatureServer/0',
        renderer: {
          type: 'unique-value',
          field: 'taxon_category_name',
          defaultSymbol: {
            type: 'simple-marker',
            size: 5,
            color: [150, 150, 150, 0.7],
            outline: { color: [255, 255, 255, 0.5], width: 0.5 },
          },
          uniqueValueInfos: buildTaxonUniqueValues(),
        } as __esri.UniqueValueRendererProperties,
        popupEnabled: true,
        popupTemplate: {
          title: '{common_name}',
          content: [
            {
              type: 'fields',
              fieldInfos: [
                { fieldName: 'scientific_name', label: 'Scientific Name' },
                { fieldName: 'taxon_category_name', label: 'Taxon Category' },
                { fieldName: 'observed_on', label: 'Observed On' },
                { fieldName: 'user_name', label: 'Observer' },
              ],
            },
          ],
        } as __esri.PopupTemplateProperties,
      };

    case 'preserve-boundary':
      return {
        type: 'geojson',
        url: '/dangermond-preserve-boundary.geojson',
        renderer: {
          type: 'simple',
          symbol: {
            type: 'simple-fill',
            color: [34, 197, 94, 0.08],
            outline: { color: [34, 197, 94, 0.6], width: 2 },
          },
        } as __esri.SimpleRendererProperties,
        popupEnabled: false,
      };

    default:
      return null;
  }
}

/** Set of layer IDs that have real ArcGIS data */
export const IMPLEMENTED_LAYERS = new Set(['inaturalist-obs', 'preserve-boundary']);
