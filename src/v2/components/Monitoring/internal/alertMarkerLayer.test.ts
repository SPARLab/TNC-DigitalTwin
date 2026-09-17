import { describe, expect, it } from 'vitest';
import {
  buildStationAlertLookup,
  clusterAlertsByStation,
  formatSeverityLabel,
  lookupStationAlert,
  severityMarkerColor,
} from './alertMarkerLayer';
import type { LiveAlert } from '../../../services/liveAlertService';

function makeAlert(overrides: Partial<LiveAlert> & Pick<LiveAlert, 'id' | 'severity'>): LiveAlert {
  return {
    kind: 'single',
    ruleId: 'rule',
    category: 'Weather',
    alertType: 'Elevated Wind',
    stationId: 1,
    stationName: 'Dangermond_Cistern',
    triggeredValue: 'wind_speed_avg > 6.7',
    triggeredNumeric: 10,
    message: 'test',
    sourceUrls: ['https://example.com/Wind/FeatureServer/0'],
    sourceService: 'Dangermond_Wind_Datastreams',
    sourceField: 'wind_speed_avg',
    latitude: 34.5,
    longitude: -120.4,
    observationTime: 1,
    triggeredAt: 2,
    refreshedAt: 3,
    expiresAt: 4,
    ...overrides,
  };
}

describe('clusterAlertsByStation', () => {
  it('includes smoke-test severities', () => {
    const clusters = clusterAlertsByStation([
      makeAlert({ id: 't1', severity: 'test', stationId: 1 }),
      makeAlert({ id: 't2', severity: 'test', stationId: 2, stationName: 'Dangermond_Oaks' }),
    ]);
    expect(clusters).toHaveLength(2);
  });

  it('keeps the highest severity when a station has several open alerts', () => {
    const clusters = clusterAlertsByStation([
      makeAlert({ id: 'a', severity: 'test', alertType: 'Wind Reading Present' }),
      makeAlert({ id: 'b', severity: 'elevated', alertType: 'Elevated Wind' }),
      makeAlert({ id: 'c', severity: 'severe', alertType: 'Severe Wind' }),
      makeAlert({ id: 'd', severity: 'high', alertType: 'High Wind' }),
    ]);

    expect(clusters).toHaveLength(1);
    expect(clusters[0].primary.severity).toBe('severe');
    expect(clusters[0].alerts).toHaveLength(4);
  });
});

describe('buildStationAlertLookup', () => {
  it('resolves a reading by station id or normalized name', () => {
    const lookup = buildStationAlertLookup([
      makeAlert({ id: 'a', severity: 'high', stationId: 68, stationName: 'Dangermond_Sutter' }),
    ]);

    expect(lookupStationAlert(lookup, { stationId: 68, stationName: 'other' })?.primary.severity).toBe(
      'high',
    );
    expect(
      lookupStationAlert(lookup, { stationId: 999, stationName: 'Dangermond_Sutter' })?.primary
        .severity,
    ).toBe('high');
    expect(lookupStationAlert(lookup, { stationId: 999, stationName: 'Sutter' })?.primary.severity).toBe(
      'high',
    );
  });
});

describe('formatSeverityLabel', () => {
  it('title-cases the published severity', () => {
    expect(formatSeverityLabel('elevated')).toBe('Elevated');
    expect(formatSeverityLabel('HIGH')).toBe('High');
    expect(formatSeverityLabel('test')).toBe('Test');
  });
});

describe('severityMarkerColor', () => {
  it('returns distinct colours up the severity ladder', () => {
    expect(severityMarkerColor('test')[0]).toBe(100);
    expect(severityMarkerColor('elevated')[0]).toBeGreaterThan(200);
    expect(severityMarkerColor('severe')[0]).toBe(220);
    expect(severityMarkerColor('critical')[0]).toBeLessThan(severityMarkerColor('severe')[0]);
  });
});
