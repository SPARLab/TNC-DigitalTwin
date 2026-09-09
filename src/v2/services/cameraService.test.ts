import { describe, expect, it } from 'vitest';
import {
  describeCameraTime,
  extractAxisId,
  formatCameraTimestamp,
  parseViewTime,
  withImageCacheBust,
} from './cameraService';

describe('parseViewTime', () => {
  it('parses ALERTCalifornia viewTime strings as the given offset', () => {
    expect(parseViewTime('2026-09-04 00:20:50-07:00')).toBe(
      Date.parse('2026-09-04T00:20:50-07:00'),
    );
  });

  it('returns null for empty values', () => {
    expect(parseViewTime(null)).toBeNull();
    expect(parseViewTime('')).toBeNull();
    expect(parseViewTime('not-a-date')).toBeNull();
  });
});

describe('formatCameraTimestamp', () => {
  it('renders Pacific time with a zone abbreviation', () => {
    expect(formatCameraTimestamp(Date.parse('2026-09-04T20:07:20.000Z'))).toBe(
      'Sep 4, 1:07 PM PDT',
    );
  });
});

describe('describeCameraTime', () => {
  it('prefers JPEG capture time over PTZ viewTime', () => {
    expect(
      describeCameraTime({
        capturedAt: Date.parse('2026-09-04T20:07:20.000Z'),
        viewedAt: Date.parse('2026-09-04T07:20:50.000Z'),
        viewTime: '2026-09-04 00:20:50-07:00',
      }),
    ).toBe('captured Sep 4, 1:07 PM PDT');
  });

  it('falls back to viewTime when no frame timestamp is available', () => {
    expect(
      describeCameraTime({
        capturedAt: null,
        viewedAt: Date.parse('2026-09-04T07:20:50.000Z'),
        viewTime: '2026-09-04 00:20:50-07:00',
      }),
    ).toBe('view updated Sep 4, 12:20 AM PDT');
  });
});

describe('extractAxisId', () => {
  it('reads the id query param from the camera page URL', () => {
    expect(
      extractAxisId({
        cameraUrl: 'https://cameras.alertcalifornia.org/?id=Axis-Dangermond1',
        imageUrl: null,
      }),
    ).toBe('Axis-Dangermond1');
  });

  it('falls back to the latest-frame path', () => {
    expect(
      extractAxisId({
        cameraUrl: null,
        imageUrl:
          'https://cameras.alertcalifornia.org/public-camera-data/Axis-Dangermond1/latest-frame.jpg',
      }),
    ).toBe('Axis-Dangermond1');
  });
});

describe('withImageCacheBust', () => {
  it('appends a cache key to a bare latest-frame URL', () => {
    expect(
      withImageCacheBust(
        'https://cameras.alertcalifornia.org/public-camera-data/Axis-Dangermond1/latest-frame.jpg',
        123,
      ),
    ).toBe(
      'https://cameras.alertcalifornia.org/public-camera-data/Axis-Dangermond1/latest-frame.jpg?t=123',
    );
  });

  it('uses an ampersand when the URL already has a query string', () => {
    expect(withImageCacheBust('https://example.com/frame.jpg?x=1', 9)).toBe(
      'https://example.com/frame.jpg?x=1&t=9',
    );
  });
});
