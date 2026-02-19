// ============================================================================
// iNaturalist Map Layer — GraphicsLayer populated from locally-cached observations
// Emoji PictureMarkerSymbols colored by taxon category (Birds=🐦, Mammals=🦌, etc.)
// Data comes from INaturalistFilterContext; filtering toggles graphic visibility.
// ============================================================================

import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import Graphic from '@arcgis/core/Graphic';
import Point from '@arcgis/core/geometry/Point';
import PictureMarkerSymbol from '@arcgis/core/symbols/PictureMarkerSymbol';
import { getTaxonEmoji, emojiToDataUri } from './taxonConfig';
import type { INatObservation } from '../../../context/INaturalistFilterContext';
import { isPointInsideSpatialPolygon, type SpatialPolygon } from '../../../utils/spatialQuery';

/** Create an empty GraphicsLayer for iNaturalist observations */
export function createINaturalistLayer(options: {
  id?: string;
  visible?: boolean;
} = {}): GraphicsLayer {
  return new GraphicsLayer({
    id: options.id ?? 'v2-inaturalist-obs',
    visible: options.visible ?? true,
  });
}

/** Populate the GraphicsLayer from observation data (called once when data loads) */
export function populateINaturalistLayer(
  layer: GraphicsLayer,
  observations: INatObservation[],
): void {
  layer.removeAll();

  const graphics = observations.map(obs => new Graphic({
    geometry: new Point({
      longitude: obs.coordinates[0],
      latitude: obs.coordinates[1],
    }),
    symbol: new PictureMarkerSymbol({
      url: emojiToDataUri(getTaxonEmoji(obs.taxonCategory)),
      width: '24px',
      height: '24px',
    }),
    attributes: {
      id: obs.id,
      uuid: obs.uuid,
      commonName: obs.commonName,
      scientificName: obs.scientificName,
      taxonCategory: obs.taxonCategory,
      observedOn: obs.observedOn,
      observer: obs.observer,
    },
    popupTemplate: {
      title: '{commonName}',
      content: [
        {
          type: 'fields',
          fieldInfos: [
            { fieldName: 'scientificName', label: 'Scientific Name' },
            { fieldName: 'taxonCategory', label: 'Taxon Category' },
            { fieldName: 'observedOn', label: 'Observed On' },
            { fieldName: 'observer', label: 'Observer' },
          ],
        },
      ],
    } as __esri.PopupTemplateProperties,
  }));

  layer.addMany(graphics);
}

/** Toggle visibility of individual graphics based on taxon filter (instant) */
export function filterINaturalistLayer(
  layer: GraphicsLayer,
  filters: {
    selectedTaxa: Set<string>;
    startDate?: string;
    endDate?: string;
    spatialPolygon?: SpatialPolygon | null;
  },
): void {
  const { selectedTaxa, startDate, endDate, spatialPolygon } = filters;
  const showAllTaxa = selectedTaxa.size === 0;

  for (const graphic of layer.graphics.toArray()) {
    const graphicTaxon = graphic.attributes?.taxonCategory as string | undefined;
    const graphicDate = graphic.attributes?.observedOn as string | undefined;
    const taxonMatches = showAllTaxa || (graphicTaxon ? selectedTaxa.has(graphicTaxon) : false);
    const afterStart = !startDate || !graphicDate || graphicDate >= startDate;
    const beforeEnd = !endDate || !graphicDate || graphicDate <= endDate;
    const geometry = graphic.geometry;
    const hasPointGeometry = geometry?.type === 'point';
    const lon = hasPointGeometry ? (geometry as Point).longitude : Number.NaN;
    const lat = hasPointGeometry ? (geometry as Point).latitude : Number.NaN;
    const spatialMatch = Number.isFinite(lon) && Number.isFinite(lat)
      ? isPointInsideSpatialPolygon(spatialPolygon, lon, lat)
      : true;

    graphic.visible = taxonMatches && afterStart && beforeEnd && spatialMatch;
  }
}

/**
 * Build a SQL definitionExpression for filtering by taxon categories.
 * Kept for backwards compatibility / potential future FeatureLayer use.
 */
export function buildTaxonFilterExpression(selectedTaxa: Set<string>): string {
  if (selectedTaxa.size === 0) return '1=1';
  const taxaArray = Array.from(selectedTaxa);
  if (taxaArray.length === 1) return `taxon_category_name = '${taxaArray[0]}'`;
  return `taxon_category_name IN (${taxaArray.map(t => `'${t}'`).join(', ')})`;
}
