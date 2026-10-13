// ============================================================================
// Colors the suitability geoprocessing tool paints on its RGB display raster.
//
// The result map service only knows the display raster as three bands (Red,
// Green, Blue), so its own legend is not useful. The map draws this ramp
// instead, over the real 1..scale score range.
//
// Keep in sync with DISPLAY_RAMP in twin_models/suitability/suitability_modeler.pyt.
// ============================================================================

/** Low score to high score. */
export const SUITABILITY_RAMP: ReadonlyArray<readonly [number, number, number]> = [
  [215, 25, 28],
  [253, 174, 97],
  [255, 255, 191],
  [166, 217, 106],
  [26, 150, 65],
];

/**
 * The colored display raster is the output named "Display Raster (RGB)" in the
 * tool. It is matched by name because sublayer ids follow the output order the
 * server picks, which is not guaranteed.
 */
export const SUITABILITY_DISPLAY_SUBLAYER_TITLE = /display|rgb/i;

export function suitabilityRampColors(): string[] {
  return SUITABILITY_RAMP.map(([r, g, b]) => `rgb(${r}, ${g}, ${b})`);
}
