// ============================================================================
// iNaturalist Map Layer — FeatureLayer config with emoji PictureMarkerSymbols
// Uses TNC's ArcGIS-hosted iNaturalist FeatureServer.
// Emoji markers colored by taxon category (Birds=🐦, Mammals=🦌, etc.)
// ============================================================================

import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import PictureMarkerSymbol from '@arcgis/core/symbols/PictureMarkerSymbol';
import UniqueValueRenderer from '@arcgis/core/renderers/UniqueValueRenderer';
import { TAXON_CONFIG, emojiToDataUri } from './taxonConfig';

const FEATURE_SERVER_URL =
  'https://services9.arcgis.com/RHVPKKiFTONKtxq3/arcgis/rest/services/iNat_PreUC_View/FeatureServer/0';

/** Build a UniqueValueRenderer that uses emoji PictureMarkerSymbols per taxon */
function buildEmojiRenderer(): UniqueValueRenderer {
  const defaultSymbol = new PictureMarkerSymbol({
    url: emojiToDataUri('🔍'),
    width: '24px',
    height: '24px',
  });

  const uniqueValueInfos = TAXON_CONFIG.map(taxon => ({
    value: taxon.value,
    symbol: new PictureMarkerSymbol({
      url: emojiToDataUri(taxon.emoji),
      width: '24px',
      height: '24px',
    }),
  }));

  return new UniqueValueRenderer({
    field: 'taxon_category_name',
    defaultSymbol,
    uniqueValueInfos,
  });
}

/** Create a fully-configured iNaturalist FeatureLayer ready to add to a map */
export function createINaturalistLayer(options: {
  id?: string;
  visible?: boolean;
} = {}): FeatureLayer {
  return new FeatureLayer({
    url: FEATURE_SERVER_URL,
    id: options.id ?? 'v2-inaturalist-obs',
    visible: options.visible ?? true,
    renderer: buildEmojiRenderer(),
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
  });
}
