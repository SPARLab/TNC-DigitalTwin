// ============================================================================
// Climate previews — show one bioclimatic variable of a scenario's mosaic on
// the map, so the user can see the climate the model will be applied to.
// ============================================================================

import { climateMosaicUrl, CLIMATE_SCENARIOS } from '../../../config/geoprocessing';
import type { PreviewAction } from '../types';

export type ClimateScenario = (typeof CLIMATE_SCENARIOS)[number];

/** One scenario and one of its periods: the unit the model is predicted onto. */
export interface ScenarioChoice {
  key: string;
  scenario: ClimateScenario;
  period: string;
  /** "Current (1981?2010)" or "SSP5-8.5 (2071?2100)". */
  label: string;
}

export function scenarioKey(scenarioId: string, period: string): string {
  return `${scenarioId}|${period}`;
}

/** Every scenario and period combination, in display order. */
export const SCENARIO_CHOICES: ReadonlyArray<ScenarioChoice> = CLIMATE_SCENARIOS.flatMap(
  (scenario) =>
    (scenario.periods as readonly string[]).map((period) => ({
      key: scenarioKey(scenario.id, period),
      scenario,
      period,
      label: scenarioStackLabel(scenario, period),
    })),
);

export const DEFAULT_SCENARIO_KEY = SCENARIO_CHOICES[0].key;

export function findScenarioChoice(key: string): ScenarioChoice {
  return SCENARIO_CHOICES.find((choice) => choice.key === key) ?? SCENARIO_CHOICES[0];
}

/** "Current (1981–2010)" or "SSP5-8.5 (2071–2100)". */
export function scenarioStackLabel(scenario: ClimateScenario, period: string): string {
  return scenario.id === 'current'
    ? `Current (${period})`
    : `${scenario.label.split(' (')[0]} (${period})`;
}

/** The scenario's period when it offers it, otherwise its first. */
export function resolvePeriod(scenario: ClimateScenario, period: string): string {
  const periods: readonly string[] = scenario.periods;
  return periods.includes(period) ? period : periods[0];
}

/**
 * A stable id for one variable of one mosaic. The map keys previews by number,
 * so the same variable of two scenarios must not collide.
 */
export function climatePreviewId(url: string, tag: string): number {
  let hash = 5381;
  for (const char of `${url}|${tag}`) {
    hash = ((hash << 5) + hash + char.charCodeAt(0)) | 0;
  }
  // Far above the catalog's raster ids, which are small positive integers.
  return 1_000_000_000 + (Math.abs(hash) % 1_000_000_000);
}

export function climatePreviewAction(
  action: 'add' | 'remove',
  options: { tag: string; label: string; scenario: ClimateScenario; period: string },
): PreviewAction {
  const url = climateMosaicUrl(options.scenario, options.period);
  const rasterId = climatePreviewId(url, options.tag);
  if (action === 'remove') return { action: 'remove', rasterId };
  return {
    action: 'add',
    rasterId,
    url,
    title: `${options.label} · ${scenarioStackLabel(options.scenario, options.period)}`,
    datasetId: null,
    mosaicTag: options.tag,
  };
}
