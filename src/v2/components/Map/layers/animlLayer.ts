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
const BADGE_FILL = '#10b981';
const BADGE_TEXT = '#ffffff';
const CAMERA_BASE_SYMBOL_URL = emojiToDataUri(CAMERA_EMOJI);
const CAMERA_BASE_SYMBOL_SIZE = '28px';
const CAMERA_BADGED_SYMBOL_SIZE = '64px';
const CAMERA_MUTED_SYMBOL_SIZE = '40px';
const MAX_BADGE_DISPLAY = 999;
const cameraBadgeSymbolCache = new Map<number, PictureMarkerSymbol>();
let mutedCameraSymbol: PictureMarkerSymbol | null = null;

function getBadgeText(count: number): string {
  if (count > MAX_BADGE_DISPLAY) return `${MAX_BADGE_DISPLAY}+`;
  return String(count);
}

function buildCameraBadgeSvg(count: number): string {
  const badgeText = getBadgeText(count);
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="84" height="84" viewBox="0 0 84 84">
      <text x="42" y="52" text-anchor="middle" font-size="44">📷</text>
      <circle cx="66" cy="18" r="18" fill="${BADGE_FILL}" />
      <text
        x="66"
        y="22"
        text-anchor="middle"
        font-size="17"
        font-family="Arial, Helvetica, sans-serif"
        font-weight="700"
        fill="${BADGE_TEXT}"
      >
        ${badgeText}
      </text>
    </svg>
  `.trim();
}

function getBaseCameraSymbol(): PictureMarkerSymbol {
  return new PictureMarkerSymbol({
    url: CAMERA_BASE_SYMBOL_URL,
    width: CAMERA_BASE_SYMBOL_SIZE,
    height: CAMERA_BASE_SYMBOL_SIZE,
  });
}

function getBadgedCameraSymbol(count: number): PictureMarkerSymbol {
  const cached = cameraBadgeSymbolCache.get(count);
  if (cached) return cached.clone();

  const svg = buildCameraBadgeSvg(count);
  const symbol = new PictureMarkerSymbol({
    url: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
    width: CAMERA_BADGED_SYMBOL_SIZE,
    height: CAMERA_BADGED_SYMBOL_SIZE,
  });
  cameraBadgeSymbolCache.set(count, symbol);
  return symbol.clone();
}

function buildMutedCameraSvg(): string {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="84" height="84" viewBox="0 0 84 84">
      <circle cx="42" cy="42" r="24" fill="#94a3b8" fill-opacity="0.25" />
      <text x="42" y="52" text-anchor="middle" font-size="40" opacity="0.4">📷</text>
    </svg>
  `.trim();
}

function getMutedCameraSymbol(): PictureMarkerSymbol {
  if (!mutedCameraSymbol) {
    const svg = buildMutedCameraSvg();
    mutedCameraSymbol = new PictureMarkerSymbol({
      url: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
      width: CAMERA_MUTED_SYMBOL_SIZE,
      height: CAMERA_MUTED_SYMBOL_SIZE,
    });
  }
  return mutedCameraSymbol.clone();
}

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
      symbol: getBaseCameraSymbol(),
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

/**
 * Update camera symbols with count badges while filters are active.
 * - No filters: plain camera icon.
 * - Filters active + count > 0: camera icon with numeric badge.
 * - Filters active + count <= 0: muted camera icon (no badge).
 */
export function updateAnimlCameraBadges(
  layer: GraphicsLayer,
  options: {
    hasActiveFilter: boolean;
    getCountForDeployment: (deploymentId: number) => number | null;
  },
): void {
  const { hasActiveFilter, getCountForDeployment } = options;

  for (const graphic of layer.graphics.toArray()) {
    const deploymentId = Number(graphic.attributes?.id);
    if (!Number.isFinite(deploymentId)) continue;

    if (!hasActiveFilter) {
      graphic.symbol = getBaseCameraSymbol();
      continue;
    }

    const count = getCountForDeployment(deploymentId) ?? 0;
    graphic.symbol = count > 0
      ? getBadgedCameraSymbol(count)
      : getMutedCameraSymbol();
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
