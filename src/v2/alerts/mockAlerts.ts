import type { AlertEvent, AlertSeverity } from './types';

interface CameraNoveltyScenario {
  id: string;
  cameraId: string;
  cameraLabel: string;
  locationLabel: string;
  speciesName: string;
  detectedAt: string;
  confidence: number;
  lastSeenDaysAgo?: number;
  deploymentId?: number;
  longitude?: number;
  latitude?: number;
  severity?: AlertSeverity;
  status?: AlertEvent['status'];
}

const formatConfidencePercent = (confidence: number): string => {
  return `${Math.round(confidence * 100)}%`;
};

const getLastSeenContextText = (lastSeenDaysAgo?: number): string => {
  if (typeof lastSeenDaysAgo === 'number') {
    return `first detection in ${lastSeenDaysAgo} days`;
  }
  return 'no prior detection in site profile';
};

export const buildCameraNoveltyAlert = ({
  id,
  cameraId,
  cameraLabel,
  locationLabel,
  speciesName,
  detectedAt,
  confidence,
  lastSeenDaysAgo,
  deploymentId,
  longitude,
  latitude,
  severity = 'warning',
  status = 'unread',
}: CameraNoveltyScenario): AlertEvent => {
  const lastSeenContext = getLastSeenContextText(lastSeenDaysAgo);
  const confidenceText = formatConfidencePercent(confidence);

  return {
    id,
    type: 'camera_novelty',
    severity,
    title: `New camera-trap species detected at ${locationLabel}: ${speciesName}`,
    description: `${cameraLabel} flagged ${speciesName} with ${confidenceText} model confidence (${lastSeenContext}).`,
    source: 'ANiML',
    sourceEntityId: cameraId,
    detectedAt,
    status,
    locationLabel,
    metrics: {
      confidence,
      speciesName,
      cameraLabel,
      lastSeenDaysAgo,
      navigationTarget: {
        layerId: 'animl-camera-traps',
        featureId: deploymentId,
        longitude: longitude ?? -120.1272,
        latitude: latitude ?? 34.7017,
      },
    },
  };
};

export const CAMERA_NOVELTY_ALERTS: AlertEvent[] = [
  buildCameraNoveltyAlert({
    id: 'alert-camera-mesa-ridge-20260225-004',
    cameraId: '63487c5f938eb167e7ebe55c',
    cameraLabel: 'TNC_Ridgetec_Governments_Bluff',
    locationLabel: 'Governments Bluff',
    speciesName: 'Long-tailed Weasel',
    detectedAt: '2026-02-25T05:48:00.000Z',
    confidence: 0.84,
    deploymentId: 4,
    longitude: -120.45180368381465,
    latitude: 34.44243012831281,
  }),
];

/**
 * Phase 12.1 seed payloads for UI development and behavior testing.
 */
export const MOCK_ALERTS: AlertEvent[] = [
  ...CAMERA_NOVELTY_ALERTS,
  {
    id: 'alert-water-wood-canyon-20260225-002',
    type: 'water_threshold',
    severity: 'critical',
    title: 'Water monitor anomaly at Dangermond Wood Canyon',
    description:
      'Ranchbot Well Water Temperature recorded 9.41 (range observed: -6 to 140) in the latest datastream summary.',
    source: 'Water Sensor',
    sourceEntityId: 'station-54',
    detectedAt: '2026-02-25T00:54:49.000Z',
    status: 'unread',
    locationLabel: 'Dangermond Wood Canyon',
    metrics: {
      observedValue: 9.409934640522875,
      expectedRange: {
        min: -6,
        max: 140,
        unit: 'reported range',
      },
      navigationTarget: {
        layerId: 'dataset-186',
        longitude: -120.43884731689691,
        latitude: 34.48332855715733,
        featureId: 54,
        datastreamNameHint: 'Ranchbot Well Water Temperature',
      },
    },
  },
  {
    id: 'alert-inat-ash-throated-flycatcher-20260225-003',
    type: 'inat_range_anomaly',
    severity: 'warning',
    title: 'Out-of-range iNaturalist observation: Ash-throated Flycatcher',
    description:
      'Myiarchus cinerascens observation from iNaturalist appears outside the expected preserve range envelope.',
    source: 'iNaturalist',
    sourceEntityId: 'db97e94f-6bdd-40ff-8bef-735ad1aa29a7',
    detectedAt: '2026-02-25T11:10:00.000Z',
    status: 'unread',
    locationLabel: 'Dangermond Preserve (expanded extent)',
    metrics: {
      confidence: 0.74,
      navigationTarget: {
        layerId: 'inaturalist-obs',
        longitude: -120.43910333299999,
        latitude: 34.57427500000006,
      },
    },
  },
];
