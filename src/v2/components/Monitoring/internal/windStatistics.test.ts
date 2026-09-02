import { describe, expect, it } from 'vitest';
import { getPrevailingFromBearing, getWindStatistics } from './windStatistics';
import type { WindReading } from '../../../services/windService';

function makeReading(overrides: Partial<WindReading> = {}): WindReading {
  return {
    stationId: 1,
    stationName: 'Test Station',
    longitude: -120.45,
    latitude: 34.49,
    observedAt: 1_788_375_000_000,
    windDirectionAvg: 0,
    windSpeedAvg: 5,
    windSpeedMax: 8,
    ...overrides,
  };
}

describe('getPrevailingFromBearing', () => {
  it('averages bearings across the 0/360 wraparound', () => {
    // A naive arithmetic mean would report 180 (due south) instead of due north.
    const bearing = getPrevailingFromBearing([
      makeReading({ windDirectionAvg: 350 }),
      makeReading({ windDirectionAvg: 10 }),
    ]);

    expect(bearing).toBeCloseTo(0, 5);
  });

  it('weights the resultant by speed', () => {
    const bearing = getPrevailingFromBearing([
      makeReading({ windDirectionAvg: 90, windSpeedAvg: 10 }),
      makeReading({ windDirectionAvg: 180, windSpeedAvg: 0.001 }),
    ]);

    expect(bearing).toBeCloseTo(90, 1);
  });

  it('returns a single station bearing unchanged', () => {
    expect(getPrevailingFromBearing([makeReading({ windDirectionAvg: 266.5 })])).toBeCloseTo(
      266.5,
      4,
    );
  });

  it('reports no prevailing direction when stations directly oppose', () => {
    expect(
      getPrevailingFromBearing([
        makeReading({ windDirectionAvg: 0, windSpeedAvg: 5 }),
        makeReading({ windDirectionAvg: 180, windSpeedAvg: 5 }),
      ]),
    ).toBeNull();
  });

  it('reports no prevailing direction when every station is calm', () => {
    expect(getPrevailingFromBearing([makeReading({ windSpeedAvg: 0 })])).toBeNull();
  });
});

describe('getWindStatistics', () => {
  it('returns null without readings', () => {
    expect(getWindStatistics([])).toBeNull();
  });

  it('summarizes speed, gust, and station count', () => {
    const statistics = getWindStatistics([
      makeReading({ stationName: 'Army Camp', windSpeedAvg: 1, windSpeedMax: 3 }),
      makeReading({ stationName: 'Bunker Hill', windSpeedAvg: 4, windSpeedMax: 9 }),
      makeReading({ stationName: 'Cistern', windSpeedAvg: 4, windSpeedMax: 7 }),
    ]);

    expect(statistics).not.toBeNull();
    expect(statistics?.averageSpeed).toBeCloseTo(3, 5);
    expect(statistics?.stationCount).toBe(3);
    // Gust comes from wind_speed_max, not the max of the averages.
    expect(statistics?.peakGust).toBe(9);
    expect(statistics?.peakGustStationName).toBe('Bunker Hill');
  });
});
