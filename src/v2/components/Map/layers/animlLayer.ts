// ============================================================================
// ANiML Map Layer — GraphicsLayer populated from locally-cached deployments.
// Camera icon PictureMarkerSymbols. Badges show filtered image counts when
// filters are active (DFT-029). Zero-result cameras grayed out (DFT-028).
// Data comes from AnimlFilterContext; filtering toggles graphic visibility.
// ============================================================================

import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import Graphic from '@arcgis/core/Graphic';
import Point from '@arcgis/core/geometry/Point';
import PictureMarkerSymbol from '@arcgis/core/symbols/PictureMarkerSymbol';
import type { AnimlDeployment } from '../../../../services/animlService';
import { emojiToDataUri } from './taxonConfig';

const CAMERA_EMOJI = '📷';

/** Create an empty GraphicsLayer for ANiML camera traps */
export function createAnimlLayer(options: {
  id?: string;
  visible?: boolean;
} = {}): GraphicsLayer {
  return new GraphicsLayer({
    id: options.id ?? 'v2-animl-camera-traps',
    visible: options.visible ?? true,
  });
}

/** Populate the GraphicsLayer from deployment data (called once when data loads) */
export function populateAnimlLayer(
  layer: GraphicsLayer,
  deployments: AnimlDeployment[],
): void {
  layer.removeAll();

  const graphics = deployments
    .filter(dep => dep.geometry?.coordinates)
    .map(dep => new Graphic({
      geometry: new Point({
        longitude: dep.geometry!.coordinates[0],
        latitude: dep.geometry!.coordinates[1],
      }),
      symbol: new PictureMarkerSymbol({
        url: emojiToDataUri(CAMERA_EMOJI),
        width: '28px',
        height: '28px',
      }),
      attributes: {
        id: dep.id,
        animl_dp_id: dep.animl_dp_id,
        name: dep.name,
      },
      popupTemplate: {
        title: '{name}',
        content: [
          {
            type: 'fields',
            fieldInfos: [
              { fieldName: 'animl_dp_id', label: 'Deployment ID' },
              { fieldName: 'name', label: 'Camera Name' },
            ],
          },
        ],
      } as __esri.PopupTemplateProperties,
    }));

  layer.addMany(graphics);
}

/** Toggle visibility of camera graphics based on selected animal filter */
export function filterAnimlLayer(
  layer: GraphicsLayer,
  selectedAnimals: Set<string>,
  _deploymentRelevance?: Set<number> | null,
): void {
  // If we have deployment relevance data (from animal tags → deployment mapping),
  // use it to gray out irrelevant cameras. For now, show all when no filter.
  if (selectedAnimals.size === 0) {
    for (const graphic of layer.graphics.toArray()) {
      graphic.visible = true;
    }
    return;
  }

  // When filters are active but we don't have per-deployment relevance yet,
  // keep all visible (the sidebar handles greying logic via props)
  for (const graphic of layer.graphics.toArray()) {
    if (_deploymentRelevance) {
      graphic.visible = _deploymentRelevance.has(graphic.attributes?.id);
    } else {
      graphic.visible = true;
    }
  }
}

/** Find camera graphic by deployment id (shared by highlight/badge features). */
export function getAnimlCameraGraphicByDeploymentId(
  layer: GraphicsLayer,
  deploymentId: number,
): Graphic | null {
  return layer.graphics.toArray().find(
    graphic => Number(graphic.attributes?.id) === deploymentId,
  ) ?? null;
}
