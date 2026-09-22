import { describe, expect, it } from 'vitest';

// Pure date-window planning without network — mirror clamp/split logic.
function toDateUtc(epochMs: number): string {
  return new Date(epochMs).toISOString().slice(0, 10);
}

function parseDateUtc(date: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  return Date.parse(`${date}T00:00:00.000Z`);
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function planFromExtent(
  requested: { startDate: string; endDate: string },
  extent: { minTs: number; maxTs: number } | null,
  initialDays = 30,
) {
  if (!extent) return { window: null, initial: null, backfill: null };
  const extentStart = toDateUtc(extent.minTs);
  const extentEnd = toDateUtc(extent.maxTs);
  const startDate = requested.startDate > extentStart ? requested.startDate : extentStart;
  const endDate = requested.endDate < extentEnd ? requested.endDate : extentEnd;
  if (startDate > endDate) return { window: null, initial: null, backfill: null };
  const startMs = parseDateUtc(startDate)!;
  const endMs = parseDateUtc(endDate)!;
  const initialStartMs = Math.max(startMs, endMs - (initialDays - 1) * MS_PER_DAY);
  return {
    window: { startDate, endDate },
    initial: { startDate: toDateUtc(initialStartMs), endDate },
    backfill: initialStartMs > startMs
      ? { startDate, endDate: toDateUtc(initialStartMs - MS_PER_DAY) }
      : null,
  };
}

describe('progressive time series window planning', () => {
  it('clamps a 10-year request onto sparse historical data', () => {
    const plan = planFromExtent(
      { startDate: '2016-01-01', endDate: '2026-03-21' },
      {
        minTs: Date.parse('2010-05-01T00:00:00.000Z'),
        maxTs: Date.parse('2023-06-26T07:58:16.000Z'),
      },
    );
    expect(plan.window).toEqual({ startDate: '2016-01-01', endDate: '2023-06-26' });
    expect(plan.initial?.endDate).toBe('2023-06-26');
    expect(plan.backfill?.startDate).toBe('2016-01-01');
    expect(plan.backfill?.endDate).toBeTruthy();
  });

  it('skips fetches when extent is empty', () => {
    expect(planFromExtent(
      { startDate: '2016-01-01', endDate: '2026-03-21' },
      null,
    )).toEqual({ window: null, initial: null, backfill: null });
  });

  it('omits backfill when clamped range fits in the initial window', () => {
    const plan = planFromExtent(
      { startDate: '2023-06-01', endDate: '2023-06-20' },
      {
        minTs: Date.parse('2023-06-01T00:00:00.000Z'),
        maxTs: Date.parse('2023-06-20T00:00:00.000Z'),
      },
    );
    expect(plan.backfill).toBeNull();
    expect(plan.initial).toEqual({ startDate: '2023-06-01', endDate: '2023-06-20' });
  });
});
