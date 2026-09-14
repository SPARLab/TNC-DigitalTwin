import { describe, expect, it } from 'vitest';
import {
  buildNhdPlusElevationValueExpression,
  createNhdPlusFlowlineRenderer,
  getNhdPlusFlowlineLegend,
  isNhdPlusFlowlinesLayer,
  NHDPLUS_FLOWLINE_WIDTH,
  NHDPLUS_MISSING_ELEVATION_WHERE,
} from './nhdPlusFlowlinesStyle';

describe('isNhdPlusFlowlinesLayer', () => {
  it('matches the Living Atlas NHDPlus HR flowlines layer', () => {
    expect(isNhdPlusFlowlinesLayer({
      name: 'Flowlines',
      catalogMeta: {
        datasetId: 143,
        serverBaseUrl: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis',
        servicePath: 'NHDPlus_High_Resolution_9March2023_view',
        hasFeatureServer: true,
        hasMapServer: false,
        hasImageServer: false,
        layerIdInService: 0,
      },
    })).toBe(true);
  });

  it('ignores other hydro layers', () => {
    expect(isNhdPlusFlowlinesLayer({
      name: 'Jalama Watershed Flowlines',
      catalogMeta: {
        datasetId: 119,
        serverBaseUrl: 'https://services.arcgis.com/F7DSX1DSNSiWmOqh/arcgis',
        servicePath: 'Jalama Watershed Flowlines',
        hasFeatureServer: true,
        hasMapServer: false,
        hasImageServer: false,
      },
    })).toBe(false);
  });
});

describe('NHDPlus flowline style', () => {
  it('builds a continuous midpoint-elevation color ramp and matching legend', () => {
    const renderer = createNhdPlusFlowlineRenderer() as {
      type: string;
      visualVariables: Array<{
        type: string;
        valueExpression?: string;
        stops: Array<{ value: number; color: number[] }>;
      }>;
    };
    expect(renderer.type).toBe('simple');
    expect(renderer.visualVariables[0]?.type).toBe('color');
    expect(renderer.visualVariables[0]?.valueExpression).toContain('minelevraw');
    expect(renderer.visualVariables[0]?.valueExpression).toContain('maxelevraw');
    expect(renderer.visualVariables[0]?.valueExpression).toContain('minelevsmo');
    expect(renderer.visualVariables[0]?.valueExpression).toContain('maxelevsmo');
    expect(renderer.visualVariables[0]?.stops[0]?.value).toBe(0);
    expect(renderer.visualVariables[0]?.stops[0]?.color).toEqual([36, 255, 130, 230]);
    expect(NHDPLUS_MISSING_ELEVATION_WHERE).toContain('minelevsmo');
    expect(buildNhdPlusElevationValueExpression({ '99': 12.5 })).toContain("Dictionary('99', 12.5)");

    const renderer3d = createNhdPlusFlowlineRenderer('3d') as {
      symbol: { type: string; symbolLayers: Array<{ type: string }> };
    };
    expect(renderer3d.symbol.type).toBe('line-3d');
    expect(renderer3d.symbol.symbolLayers[0]?.type).toBe('line');

    const legend = getNhdPlusFlowlineLegend();
    expect(legend.rendererType).toBe('continuous');
    expect(legend.rampTitle).toBe('Elevation');
    expect(legend.gradientCss).toContain('linear-gradient');
    expect(NHDPLUS_FLOWLINE_WIDTH).toBe(1.5);
  });
});
