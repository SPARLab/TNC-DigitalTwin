import type { AlertEvent } from './types';

/**
 * Phase 12.1 seed payloads for UI development and behavior testing.
 */
export const MOCK_ALERTS: AlertEvent[] = [
  {
    id: 'alert-camera-ramajal-east-20260224-001',
    type: 'camera_novelty',
    severity: 'warning',
    title: 'New camera-trap species detected: Gray Fox',
    description:
      'Ramajal East camera reported Gray Fox as a first detection in the last 90 days.',
    source: 'ANiML',
    sourceEntityId: 'camera-ramajal-east',
    detectedAt: '2026-02-24T18:32:00.000Z',
    status: 'unread',
    locationLabel: 'Ramajal East',
    metrics: {
      confidence: 0.92,
    },
  },
  {
    id: 'alert-water-san-antonio-20260225-002',
    type: 'water_threshold',
    severity: 'critical',
    title: 'Water level high at San Antonio Creek sensor',
    description:
      'Observed water level is 2.3 m, exceeding expected range of 0.8-1.6 m.',
    source: 'Water Sensor',
    sourceEntityId: 'station-san-antonio-creek',
    detectedAt: '2026-02-25T08:10:00.000Z',
    status: 'unread',
    locationLabel: 'San Antonio Creek',
    metrics: {
      observedValue: 2.3,
      expectedRange: {
        min: 0.8,
        max: 1.6,
        unit: 'm',
      },
    },
  },
  {
    id: 'alert-inat-dry-zone-20260223-003',
    type: 'inat_range_anomaly',
    severity: 'info',
    title: 'Out-of-range iNaturalist observation flagged',
    description:
      'California newt observation appears outside the species expected range envelope.',
    source: 'iNaturalist',
    sourceEntityId: 'inat-obs-9923411',
    detectedAt: '2026-02-23T14:05:00.000Z',
    status: 'read',
    locationLabel: 'Dry-Zone Sector C',
    metrics: {
      confidence: 0.68,
    },
  },
];
