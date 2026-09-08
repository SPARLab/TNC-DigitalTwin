// ============================================================================
// Camera clustering — groups colocated / nearby cameras by screen distance so
// a pair like Dangermond 1 and 2 reads as "2" when zoomed out, then fans into
// individual pan wedges once they occupy enough pixels to tell apart.
// ============================================================================

import type { CameraStation } from '../../../services/cameraService';

export const CAMERA_CLUSTER_PIXEL_THRESHOLD = 40;

/** Metres to walk each colocated camera along its pan so the pair fans out. */
const COLOCATED_OFFSET_METRES = 80;

export function offsetCameraPoint(camera: CameraStation): { longitude: number; latitude: number } {
  if (camera.pan == null) {
    return { longitude: camera.longitude, latitude: camera.latitude };
  }

  const radians = (camera.pan * Math.PI) / 180;
  const northMetres = Math.cos(radians) * COLOCATED_OFFSET_METRES;
  const eastMetres = Math.sin(radians) * COLOCATED_OFFSET_METRES;
  const latitudeRadians = (camera.latitude * Math.PI) / 180;

  return {
    latitude: camera.latitude + northMetres / 111_320,
    longitude: camera.longitude + eastMetres / (111_320 * Math.cos(latitudeRadians)),
  };
}

export interface CameraCluster {
  cameras: CameraStation[];
  longitude: number;
  latitude: number;
}

export interface ScreenPoint {
  x: number;
  y: number;
}

/**
 * Greedy clustering in screen space. Display positions (pan-offset) are used
 * for distance so a zoomed-in pair can separate; the cluster anchor stays at
 * the shared site so the badge doesn't drift.
 */
export function groupCamerasByProximity(
  cameras: CameraStation[],
  screenOf: (point: { longitude: number; latitude: number }) => ScreenPoint | null,
  thresholdPx = CAMERA_CLUSTER_PIXEL_THRESHOLD,
): CameraCluster[] {
  const placed = cameras.map((camera) => ({
    camera,
    display: offsetCameraPoint(camera),
  }));

  const used = new Set<number>();
  const clusters: CameraCluster[] = [];

  for (let index = 0; index < placed.length; index++) {
    if (used.has(index)) continue;

    const seed = placed[index];
    const seedScreen = screenOf(seed.display);
    const members = [seed.camera];
    used.add(index);

    if (seedScreen) {
      for (let other = index + 1; other < placed.length; other++) {
        if (used.has(other)) continue;
        const otherScreen = screenOf(placed[other].display);
        if (!otherScreen) continue;
        const distance = Math.hypot(seedScreen.x - otherScreen.x, seedScreen.y - otherScreen.y);
        if (distance <= thresholdPx) {
          members.push(placed[other].camera);
          used.add(other);
        }
      }
    }

    const isCluster = members.length > 1;
    clusters.push({
      cameras: members,
      longitude: isCluster ? seed.camera.longitude : seed.display.longitude,
      latitude: isCluster ? seed.camera.latitude : seed.display.latitude,
    });
  }

  return clusters;
}
