// ============================================================================
// Summary statistics for the current wind snapshot.
// ============================================================================

import type { WindReading } from '../../../services/windService';

export interface WindStatistics {
  /** Mean of the per-station average speeds, m/s. */
  averageSpeed: number;
  /** Strongest gust reported by any station, m/s. */
  peakGust: number;
  peakGustStationName: string;
  /**
   * Speed-weighted resultant bearing the wind blows FROM. Null when the
   * stations oppose each other closely enough that no direction dominates.
   */
  prevailingFromBearing: number | null;
  stationCount: number;
}

/**
 * Bearings are circular, so they cannot be averaged arithmetically — 350° and
 * 10° must resolve to 0°, not 180°. We sum the readings as vectors weighted by
 * speed (the meteorological convention for prevailing direction) and take the
 * bearing of the resultant.
 */
export function getPrevailingFromBearing(readings: WindReading[]): number | null {
  let u = 0;
  let v = 0;
  let speedSum = 0;

  for (const reading of readings) {
    const radians = (reading.windDirectionAvg * Math.PI) / 180;
    const speed = reading.windSpeedAvg;
    u += speed * Math.sin(radians);
    v += speed * Math.cos(radians);
    speedSum += speed;
  }

  if (speedSum === 0) return null;

  // A resultant this short means the directions cancel out and any single
  // bearing would misrepresent the field.
  const magnitude = Math.sqrt(u * u + v * v);
  if (magnitude / speedSum < 0.01) return null;

  return ((Math.atan2(u, v) * 180) / Math.PI + 360) % 360;
}

export function getWindStatistics(readings: WindReading[]): WindStatistics | null {
  if (readings.length === 0) return null;

  const speedSum = readings.reduce((total, reading) => total + reading.windSpeedAvg, 0);

  let gustiest = readings[0];
  for (const reading of readings) {
    if (reading.windSpeedMax > gustiest.windSpeedMax) gustiest = reading;
  }

  return {
    averageSpeed: speedSum / readings.length,
    peakGust: gustiest.windSpeedMax,
    peakGustStationName: gustiest.stationName,
    prevailingFromBearing: getPrevailingFromBearing(readings),
    stationCount: readings.length,
  };
}
