// ============================================================================
// Animated wind particle overlay.
//
// Draws trailing particles on a canvas layered over the MapView surface. The
// particles advect through the interpolated wind field, so the animation shows
// where the air is going rather than just where stations sit.
// ============================================================================

import * as reactiveUtils from '@arcgis/core/core/reactiveUtils';
import type MapView from '@arcgis/core/views/MapView';
import {
  buildWindField,
  getSpeedColor,
  getStationsExtent,
  sampleField,
  type GeoExtent,
  type WindField,
} from './windField';
import type { WindReading } from '../../../services/windService';
import {
  createOverlayCanvas,
  getFrameTransform,
  latitudeToMercatorY,
  longitudeToMercatorX,
  mercatorXToLongitude,
  mercatorYToLatitude,
  syncCanvasSize,
  type FrameTransform,
} from './mercator';

/** Positions retained per particle to draw its tapering trail. */
const TRAIL_LENGTH = 14;

/**
 * Kept deliberately modest: each trail segment is its own stroke with a unique
 * colour and width, so cost scales with `PARTICLE_COUNT * TRAIL_LENGTH`.
 */
const PARTICLE_COUNT = 1200;

interface TrailPoint {
  /** Web Mercator metres, converted once on creation rather than per frame. */
  mx: number;
  my: number;
}

interface Particle {
  /** Longitude in degrees — the field is indexed geographically. */
  x: number;
  /** Latitude in degrees. */
  y: number;
  age: number;
  maxAge: number;
  trail: TrailPoint[];
}

function createParticle(extent: GeoExtent): Particle {
  return {
    x: extent.xmin + Math.random() * (extent.xmax - extent.xmin),
    y: extent.ymin + Math.random() * (extent.ymax - extent.ymin),
    age: Math.floor(Math.random() * 80),
    maxAge: 60 + Math.floor(Math.random() * 60),
    trail: [],
  };
}

/**
 * Respawn along the edge the wind is arriving from, so the field stays populated
 * instead of draining toward the downwind corner.
 */
function respawnUpwind(extent: GeoExtent, field: WindField): Particle {
  const centerX = (extent.xmin + extent.xmax) / 2;
  const centerY = (extent.ymin + extent.ymax) / 2;
  const sample = sampleField(field, centerX, centerY);

  if (!sample || (sample.u === 0 && sample.v === 0)) {
    return createParticle(extent);
  }

  const width = extent.xmax - extent.xmin;
  const height = extent.ymax - extent.ymin;

  const particle: Particle = {
    x: 0,
    y: 0,
    age: 0,
    maxAge: 50 + Math.floor(Math.random() * 70),
    trail: [],
  };

  // Scatter a minority across the whole extent so the interior never looks bare.
  if (Math.random() < 0.3) {
    particle.x = extent.xmin + Math.random() * width;
    particle.y = extent.ymin + Math.random() * height;
    return particle;
  }

  // u/v point where the wind comes FROM, so that edge is where particles enter.
  if (Math.abs(sample.u) > Math.abs(sample.v)) {
    particle.x = sample.u > 0
      ? extent.xmax - Math.random() * width * 0.1
      : extent.xmin + Math.random() * width * 0.1;
    particle.y = extent.ymin + Math.random() * height;
  } else {
    particle.x = extent.xmin + Math.random() * width;
    particle.y = sample.v > 0
      ? extent.ymax - Math.random() * height * 0.1
      : extent.ymin + Math.random() * height * 0.1;
  }

  return particle;
}

export interface WindParticleOverlayOptions {
  particleCount?: number;
}

export class WindParticleOverlay {
  private readonly view: MapView;
  private readonly readings: WindReading[];
  private readonly particleCount: number;

  private canvas: HTMLCanvasElement | null = null;
  private context: CanvasRenderingContext2D | null = null;
  private animationId: number | null = null;
  private handles: ReturnType<typeof reactiveUtils.watch>[] = [];
  private particles: Particle[] = [];
  private field: WindField | null = null;
  private spawnExtent: GeoExtent | null = null;
  private destroyed = false;

  constructor(view: MapView, readings: WindReading[], options: WindParticleOverlayOptions = {}) {
    this.view = view;
    this.readings = readings;
    this.particleCount = options.particleCount ?? PARTICLE_COUNT;
  }

  start(): void {
    if (this.destroyed || this.readings.length === 0) return;

    const fieldExtent = getStationsExtent(this.readings);
    this.field = buildWindField(this.readings, fieldExtent);
    this.updateSpawnExtent();

    const spawnExtent = this.spawnExtent ?? fieldExtent;
    this.particles = Array.from({ length: this.particleCount }, () => createParticle(spawnExtent));

    this.createCanvas();
    if (!this.canvas) return;

    this.handles.push(
      reactiveUtils.watch(
        () => this.view.extent,
        () => {
          this.syncCanvasSize();
          this.updateSpawnExtent();
        },
      ),
    );

    this.runAnimation();
  }

  destroy(): void {
    this.destroyed = true;

    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    for (const handle of this.handles) handle.remove();
    this.handles = [];

    this.canvas?.remove();
    this.canvas = null;
    this.context = null;
    this.particles = [];
    this.field = null;
  }

  /**
   * Confine spawning to the visible slice of the field so particles are not
   * created off-screen when the user zooms in.
   */
  private updateSpawnExtent(): void {
    const viewExtent = this.view.extent;
    const fieldExtent = this.field?.extent ?? null;

    if (!viewExtent || !fieldExtent) {
      this.spawnExtent = fieldExtent;
      return;
    }

    // Intersect in Mercator metres, which is what view.extent reports.
    const viewMercator = {
      xmin: Math.min(viewExtent.xmin, viewExtent.xmax),
      xmax: Math.max(viewExtent.xmin, viewExtent.xmax),
      ymin: Math.min(viewExtent.ymin, viewExtent.ymax),
      ymax: Math.max(viewExtent.ymin, viewExtent.ymax),
    };

    const fieldMercator = {
      xmin: longitudeToMercatorX(fieldExtent.xmin),
      xmax: longitudeToMercatorX(fieldExtent.xmax),
      ymin: latitudeToMercatorY(fieldExtent.ymin),
      ymax: latitudeToMercatorY(fieldExtent.ymax),
    };

    const overlap = {
      xmin: Math.max(viewMercator.xmin, fieldMercator.xmin),
      xmax: Math.min(viewMercator.xmax, fieldMercator.xmax),
      ymin: Math.max(viewMercator.ymin, fieldMercator.ymin),
      ymax: Math.min(viewMercator.ymax, fieldMercator.ymax),
    };

    // No overlap means the field is off-screen; keep seeding the whole field.
    if (overlap.xmin >= overlap.xmax || overlap.ymin >= overlap.ymax) {
      this.spawnExtent = fieldExtent;
      return;
    }

    this.spawnExtent = {
      xmin: mercatorXToLongitude(overlap.xmin),
      xmax: mercatorXToLongitude(overlap.xmax),
      ymin: mercatorYToLatitude(overlap.ymin),
      ymax: mercatorYToLatitude(overlap.ymax),
    };
  }

  private createCanvas(): void {
    const canvas = createOverlayCanvas(this.view);
    if (!canvas) return;

    this.canvas = canvas;
    this.context = canvas.getContext('2d');
    this.syncCanvasSize();
  }

  private syncCanvasSize(): void {
    if (!this.canvas) return;
    syncCanvasSize(this.canvas, this.view);
  }

  private runAnimation(): void {
    const loop = () => {
      if (this.destroyed) return;
      this.animationId = requestAnimationFrame(loop);
      this.drawFrame();
    };
    loop();
  }

  private drawFrame(): void {
    const context = this.context;
    const field = this.field;
    const canvas = this.canvas;
    if (!context || !field || !canvas) return;

    // Derived once per frame instead of projecting every trail vertex.
    const transform = getFrameTransform(this.view);
    if (!transform) return;

    const dpr = window.devicePixelRatio || 1;
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Convert metres-per-second into degrees-per-frame at the current zoom so
    // the apparent speed stays believable as the user zooms.
    const speedScale = 0.000015 * Math.pow(2, Math.max(0, this.view.zoom - 10));
    const spawnExtent = this.spawnExtent ?? field.extent;

    for (const particle of this.particles) {
      const sample = sampleField(field, particle.x, particle.y);

      if (!sample) {
        Object.assign(particle, respawnUpwind(spawnExtent, field));
        continue;
      }

      // Subtract because u/v describe the FROM direction.
      particle.x -= sample.u * speedScale;
      particle.y -= sample.v * speedScale;
      particle.age++;

      particle.trail.push({
        mx: longitudeToMercatorX(particle.x),
        my: latitudeToMercatorY(particle.y),
      });
      if (particle.trail.length > TRAIL_LENGTH) particle.trail.shift();

      if (particle.trail.length >= 2) {
        this.drawTrail(context, particle, sample.t, transform, dpr);
      }

      if (particle.age >= particle.maxAge) {
        Object.assign(particle, respawnUpwind(spawnExtent, field));
      }
    }
  }

  private drawTrail(
    context: CanvasRenderingContext2D,
    particle: Particle,
    t: number,
    transform: FrameTransform,
    dpr: number,
  ): void {
    const { r, g, b } = getSpeedColor(t);
    const trail = particle.trail;

    let previousX = (trail[0].mx - transform.xmin) * transform.scaleX;
    let previousY = (transform.ymax - trail[0].my) * transform.scaleY;

    for (let index = 1; index < trail.length; index++) {
      const currentX = (trail[index].mx - transform.xmin) * transform.scaleX;
      const currentY = (transform.ymax - trail[index].my) * transform.scaleY;

      // Fade and thin toward the tail so the head reads as the leading edge.
      const fraction = index / trail.length;

      context.beginPath();
      context.moveTo(previousX, previousY);
      context.lineTo(currentX, currentY);
      context.strokeStyle = `rgba(${r}, ${g}, ${b}, ${fraction})`;
      context.lineWidth = 2 * dpr * fraction;
      context.stroke();

      previousX = currentX;
      previousY = currentY;
    }
  }
}
