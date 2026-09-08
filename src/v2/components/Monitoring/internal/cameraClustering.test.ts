import { describe, expect, it } from 'vitest';
import { groupCamerasByProximity } from './cameraClustering';
import type { CameraStation } from '../../../services/cameraService';

function makeCamera(overrides: Partial<CameraStation> = {}): CameraStation {
  return {
    objectId: 1,
    cameraName: 'Dangermond 1',
    siteId: 'dangermond',
    isOnline: true,
    isActive: true,
    longitude: -120.4544,
    latitude: 34.4994,
    pan: 64,
    viewTime: null,
    viewedAt: null,
    capturedAt: null,
    imageUrl: null,
    cameraUrl: null,
    ...overrides,
  };
}

describe('groupCamerasByProximity', () => {
  it('clusters cameras whose display positions fall within the pixel threshold', () => {
    const cameras = [
      makeCamera({ objectId: 1, cameraName: 'Dangermond 1', pan: 64 }),
      makeCamera({ objectId: 2, cameraName: 'Dangermond 2', pan: 315 }),
    ];

    const clusters = groupCamerasByProximity(cameras, () => ({ x: 100, y: 100 }), 40);

    expect(clusters).toHaveLength(1);
    expect(clusters[0].cameras.map((camera) => camera.objectId)).toEqual([1, 2]);
    expect(clusters[0].longitude).toBe(-120.4544);
  });

  it('keeps cameras as individuals once they are far enough apart on screen', () => {
    const cameras = [
      makeCamera({ objectId: 1, pan: 64 }),
      makeCamera({ objectId: 2, pan: 315 }),
    ];

    const clusters = groupCamerasByProximity(
      cameras,
      (point) => ({ x: point.longitude * -1, y: 0 }),
      0.00001,
    );

    expect(clusters).toHaveLength(2);
    expect(clusters.every((cluster) => cluster.cameras.length === 1)).toBe(true);
  });
});
