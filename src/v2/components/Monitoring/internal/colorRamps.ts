// ============================================================================
// Colour ramps for the sensor renderers.
//
// Each variable gets a ramp that matches its conventional cartography, so a
// temperature surface reads as warm/cool rather than borrowing the wind ramp.
// ============================================================================

import type { Rgb } from './windField';

export interface ColorRamp {
  /** Ordered stops from t=0 to t=1, interpolated linearly in RGB. */
  stops: Rgb[];
}

function rgb(r: number, g: number, b: number): Rgb {
  return { r, g, b };
}

/** Cool blue through yellow to deep red — the usual temperature convention. */
export const TEMPERATURE_RAMP: ColorRamp = {
  stops: [
    rgb(49, 84, 173),
    rgb(84, 160, 208),
    rgb(158, 210, 196),
    rgb(247, 226, 130),
    rgb(232, 145, 62),
    rgb(191, 47, 44),
  ],
};

/** Dry tan through green to saturated blue. */
export const HUMIDITY_RAMP: ColorRamp = {
  stops: [
    rgb(166, 124, 82),
    rgb(206, 187, 133),
    rgb(168, 202, 150),
    rgb(92, 168, 176),
    rgb(38, 100, 170),
  ],
};

/**
 * Diverging purple-to-orange, since pressure reads as low versus high.
 *
 * Deliberately no near-white midpoint: the surface is drawn semi-transparent
 * over satellite imagery, and a white centre covers the basemap in pale haze
 * across the middle of the range, which is most of the map on a normal day.
 */
export const PRESSURE_RAMP: ColorRamp = {
  stops: [
    rgb(84, 48, 148),
    rgb(126, 118, 196),
    rgb(132, 176, 174),
    rgb(214, 168, 88),
    rgb(179, 88, 6),
  ],
};

/** White through blue to violet, following precipitation convention. */
export const RAINFALL_RAMP: ColorRamp = {
  stops: [
    rgb(232, 240, 246),
    rgb(160, 205, 232),
    rgb(72, 150, 204),
    rgb(34, 94, 168),
    rgb(94, 47, 143),
  ],
};

/**
 * Sequential aubergine through teal to olive for water-table elevation.
 *
 * Saturated at both ends on purpose: head is drawn over satellite imagery, and
 * a pale stop at either extreme would wash out the basemap across whichever end
 * of the preserve happens to sit there.
 */
export const GROUNDWATER_RAMP: ColorRamp = {
  stops: [
    rgb(64, 34, 84),
    rgb(48, 88, 140),
    rgb(38, 140, 150),
    rgb(94, 186, 136),
    rgb(178, 214, 116),
  ],
};

/**
 * Night-blue through ember to bright solar yellow, following the usual
 * insolation convention. Stops short of pure white so the brightest cells stay
 * distinguishable from the map's white UI chrome.
 */
export const SOLAR_RAMP: ColorRamp = {
  stops: [
    rgb(31, 42, 92),
    rgb(94, 63, 137),
    rgb(191, 90, 96),
    rgb(240, 152, 58),
    rgb(252, 217, 96),
  ],
};

/**
 * Dry earth through olive to wet blue. Same dry-to-wet reading as humidity,
 * shifted browner so soil moisture does not look like air humidity.
 */
export const SOIL_MOISTURE_RAMP: ColorRamp = {
  stops: [
    rgb(166, 124, 82),
    rgb(186, 168, 96),
    rgb(120, 168, 108),
    rgb(56, 140, 150),
    rgb(32, 78, 148),
  ],
};

/**
 * Pale sand through teal to deep violet for electrical conductivity.
 *
 * Distinct from the moisture ramp on purpose. Conductivity tracks moisture
 * closely enough that sharing a palette would invite reading one as the other,
 * when what it actually measures is dissolved ions.
 */
export const CONDUCTIVITY_RAMP: ColorRamp = {
  stops: [
    rgb(226, 214, 180),
    rgb(160, 196, 176),
    rgb(76, 158, 166),
    rgb(66, 100, 156),
    rgb(72, 46, 122),
  ],
};

/**
 * Parched tan through green to deep blue for streamflow.
 *
 * Runs from dry to wet rather than low to high so the bottom of the scale reads
 * as "the creek has stopped", which for a coastal California creek is the normal
 * state for much of the year rather than an error.
 */
export const DISCHARGE_RAMP: ColorRamp = {
  stops: [
    rgb(198, 174, 132),
    rgb(150, 176, 128),
    rgb(72, 156, 158),
    rgb(38, 104, 176),
    rgb(24, 54, 128),
  ],
};

/** The original wind ramp: deep purple through magenta to yellow. */
export const WIND_RAMP: ColorRamp = {
  stops: [
    rgb(100, 20, 180),
    rgb(178, 138, 105),
    rgb(255, 255, 30),
  ],
};

export function sampleRamp(ramp: ColorRamp, t: number): Rgb {
  const stops = ramp.stops;
  const clamped = Math.max(0, Math.min(1, t));

  if (stops.length === 1) return stops[0];

  const scaled = clamped * (stops.length - 1);
  const index = Math.min(stops.length - 2, Math.floor(scaled));
  const fraction = scaled - index;

  const from = stops[index];
  const to = stops[index + 1];

  return {
    r: Math.round(from.r + (to.r - from.r) * fraction),
    g: Math.round(from.g + (to.g - from.g) * fraction),
    b: Math.round(from.b + (to.b - from.b) * fraction),
  };
}

export function rampToCssGradient(ramp: ColorRamp, steps = 6): string {
  const parts: string[] = [];
  for (let index = 0; index < steps; index++) {
    const { r, g, b } = sampleRamp(ramp, index / (steps - 1));
    parts.push(`rgb(${r}, ${g}, ${b})`);
  }
  return `linear-gradient(to right, ${parts.join(', ')})`;
}
