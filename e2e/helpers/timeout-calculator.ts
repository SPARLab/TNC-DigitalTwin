/**
 * Calculate timeout for ArcGIS layer tests
 * 
 * Formula: BASE_TIMEOUT + (sublayerCount * TIME_PER_SUBLAYER)
 * - BASE_TIMEOUT: 90 seconds (1.5 minutes)
 * - TIME_PER_SUBLAYER: 30 seconds per sublayer
 * 
 * Examples:
 * - 1 sublayer: 90s + (1 * 30s) = 120s (2 minutes)
 * - 5 sublayers: 90s + (5 * 30s) = 240s (4 minutes)
 * - 20 sublayers: 90s + (20 * 30s) = 690s (11.5 minutes)
 */

const BASE_TIMEOUT = 90000; // 90 seconds (1.5 minutes)
const TIME_PER_SUBLAYER = 30000; // 30 seconds per sublayer

export function calculateTestTimeout(sublayerCount: number): number {
  return BASE_TIMEOUT + (sublayerCount * TIME_PER_SUBLAYER);
}

export function getTimeoutInfo(sublayerCount: number): string {
  const timeout = calculateTestTimeout(sublayerCount);
  const minutes = Math.round(timeout / 60000 * 10) / 10;
  return `${minutes}min (${sublayerCount} sublayer${sublayerCount === 1 ? '' : 's'})`;
}

