// The two forms that submit analysis jobs: what they send to the service.

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SdmCommonForm } from './SdmCommonForm';
import { SdmCompareForm } from './SdmCompareForm';
import type { CompletedRun, SdmOutputType, SdmSummary } from './types';

const submitGpJob = vi.fn();

vi.mock('../../services/geoprocessingService', () => ({
  submitGpJob: (...args: unknown[]) => submitGpJob(...args),
}));

// Polling and downloads are not under test here.
vi.mock('./GpJobStatus', () => ({
  GpJobStatus: () => <div data-testid="job-status" />,
}));

function run(
  jobId: string,
  scenario: string,
  threshold: number | null = null,
  outputType: SdmOutputType = 'Probability',
): CompletedRun {
  return {
    jobId,
    mapServerUrl: 'https://example.test/MapServer',
    title: `Bobcat · ${scenario}`,
    summary: 'Bobcat',
    record: null,
    analysis: null,
    visible: true,
    selected: false,
    pngUrl: null,
    tifUrl: null,
    addedAt: 1,
    outputType,
    kind: 'model',
    species: 'Lynx rufus',
    scenario,
    sdmSummary:
      threshold == null
        ? null
        : ({ model: { optimal_threshold: threshold } } as unknown as SdmSummary),
  };
}

// Newest first, as the workspace keeps them.
const RUNS = [run('jNew', 'SSP5-8.5', 0.58), run('jOld', 'Current', 0.65)];

beforeEach(() => {
  submitGpJob.mockReset();
  submitGpJob.mockResolvedValue('jobCompare');
});

describe('SdmCompareForm', () => {
  it('asks for more runs when fewer than two exist', () => {
    render(<SdmCompareForm token={null} runs={[RUNS[0]]} />);
    expect(screen.getByText(/at least twice/i)).toBeTruthy();
    expect(screen.queryByRole('button', { name: /compare runs/i })).toBeNull();
  });

  it('compares the older run (A) with the newest (B) by default, with the threshold', async () => {
    render(<SdmCompareForm token="tok" runs={RUNS} />);
    fireEvent.click(screen.getByRole('button', { name: /compare runs/i }));

    await waitFor(() => expect(submitGpJob).toHaveBeenCalledTimes(1));
    const [url, task, payload, token] = submitGpJob.mock.calls[0];
    expect(String(url)).toContain('SDM_Random_Forest/GPServer');
    expect(task).toBe('Compare SDM Runs');
    expect(payload).toMatchObject({
      run_a: 'jOld',
      run_b: 'jNew',
      threshold: '0.5',
      min_change: '0.05',
    });
    expect(payload.output_raster).toMatch(/^sdm_difference_/);
    expect(payload.preserve_boundary).toContain('preserve_boundary');
    expect(token).toBe('tok');
    expect(await screen.findByTestId('job-status')).toBeTruthy();
  });

  it("fills the threshold from a run's own model threshold", async () => {
    render(<SdmCompareForm token={null} runs={RUNS} />);
    fireEvent.click(screen.getByRole('button', { name: /run a's model threshold \(0\.65\)/i }));
    fireEvent.click(screen.getByRole('button', { name: /compare runs/i }));
    await waitFor(() => expect(submitGpJob).toHaveBeenCalled());
    expect(submitGpJob.mock.calls[0][2].threshold).toBe('0.65');
  });

  it('blocks the same run twice and an out-of-range threshold', () => {
    render(<SdmCompareForm token={null} runs={RUNS} />);
    const button = screen.getByRole('button', { name: /compare runs/i }) as HTMLButtonElement;

    fireEvent.change(screen.getByLabelText(/run b/i), { target: { value: 'jOld' } });
    expect(screen.getByText(/two different runs/i)).toBeTruthy();
    expect(button.disabled).toBe(true);

    fireEvent.change(screen.getByLabelText(/run b/i), { target: { value: 'jNew' } });
    expect(button.disabled).toBe(false);
    fireEvent.change(screen.getByLabelText('Suitability Threshold'), { target: { value: '1.5' } });
    expect(button.disabled).toBe(true);
  });

  it('blocks runs of different output types and sends no threshold for binary runs', async () => {
    const mixed = [run('jNew', 'SSP5-8.5', 0.58, 'Binary'), run('jOld', 'Current', 0.65)];
    const { unmount } = render(<SdmCompareForm token={null} runs={mixed} />);
    expect(screen.getByText(/same output type/i)).toBeTruthy();
    unmount();

    const binary = [run('jNew', 'SSP5-8.5', 0.58, 'Binary'), run('jOld', 'Current', 0.65, 'Binary')];
    render(<SdmCompareForm token={null} runs={binary} />);
    expect(screen.queryByLabelText('Suitability Threshold')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /compare runs/i }));
    await waitFor(() => expect(submitGpJob).toHaveBeenCalled());
    expect(submitGpJob.mock.calls[0][2]).not.toHaveProperty('threshold');
  });
});

describe('SdmCommonForm', () => {
  const tick = (name: RegExp) => fireEvent.click(screen.getByRole('checkbox', { name }));

  it('needs two runs before it can run', () => {
    render(<SdmCommonForm token={null} runs={RUNS} />);
    const button = screen.getByRole('button', { name: /find common areas/i }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    tick(/current/i);
    expect(button.disabled).toBe(true);
    tick(/ssp5/i);
    expect(button.disabled).toBe(false);
  });

  it('sends the runs as a JSON array with one threshold', async () => {
    render(<SdmCommonForm token={null} runs={RUNS} />);
    tick(/current/i);
    tick(/ssp5/i);
    fireEvent.change(screen.getByLabelText('Suitability threshold'), { target: { value: '0.6' } });
    fireEvent.click(screen.getByRole('button', { name: /find common areas/i }));

    await waitFor(() => expect(submitGpJob).toHaveBeenCalledTimes(1));
    const [, task, payload] = submitGpJob.mock.calls[0];
    expect(task).toBe('Find Common Suitable Areas');
    // List order (newest first) is the order the thresholds are matched to.
    expect(JSON.parse(payload.runs)).toEqual(['jNew', 'jOld']);
    expect(payload.threshold).toBe('0.6');
    expect(payload).not.toHaveProperty('run_thresholds');
  });

  it("can use each run's own model threshold, in the runs' order", async () => {
    render(<SdmCommonForm token={null} runs={RUNS} />);
    tick(/current/i);
    tick(/ssp5/i);
    fireEvent.click(screen.getByRole('button', { name: /each run's own/i }));
    fireEvent.click(screen.getByRole('button', { name: /find common areas/i }));

    await waitFor(() => expect(submitGpJob).toHaveBeenCalledTimes(1));
    const payload = submitGpJob.mock.calls[0][2];
    expect(payload.run_thresholds).toBe('0.58, 0.65');
    expect(payload).not.toHaveProperty('threshold');
  });

  it('falls back to one threshold when a run has no stored model threshold', async () => {
    const runs = [run('jNew', 'SSP5-8.5', null), run('jOld', 'Current', 0.65)];
    render(<SdmCommonForm token={null} runs={runs} />);
    tick(/current/i);
    tick(/ssp5/i);
    fireEvent.click(screen.getByRole('button', { name: /each run's own/i }));
    expect(screen.getByText(/no stored model threshold/i)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /find common areas/i }));

    await waitFor(() => expect(submitGpJob).toHaveBeenCalledTimes(1));
    expect(submitGpJob.mock.calls[0][2]).toHaveProperty('threshold');
    expect(submitGpJob.mock.calls[0][2]).not.toHaveProperty('run_thresholds');
  });

  it('disables runs of the other output type once one is chosen', () => {
    const runs = [run('jBin', 'Binary scenario', null, 'Binary'), ...RUNS];
    render(<SdmCommonForm token={null} runs={runs} />);
    tick(/current/i);
    expect((screen.getByRole('checkbox', { name: /binary scenario/i }) as HTMLInputElement).disabled).toBe(
      true,
    );
  });
});

describe('SdmCommonForm distribution chart', () => {
  const histogram = {
    bin_edges: [0, 0.5, 1],
    counts: [3, 1],
    percent: [75, 25],
    area_km2: [null, null],
  };
  const withHistogram = (item: CompletedRun): CompletedRun => ({
    ...item,
    sdmSummary: { ...(item.sdmSummary as object), histogram } as unknown as SdmSummary,
  });
  const runs = RUNS.map(withHistogram);
  const tick = (name: RegExp) => fireEvent.click(screen.getByRole('checkbox', { name }));
  const lines = () => Array.from(document.querySelectorAll('[data-testid="threshold-line"]'));

  it('draws the chosen runs with the threshold as a vertical line that follows the input', () => {
    render(<SdmCommonForm token={null} runs={runs} />);
    expect(document.getElementById('sdm-distribution-chart')).toBeNull();
    tick(/current/i);
    tick(/ssp5/i);
    expect(document.getElementById('sdm-distribution-chart')).toBeTruthy();

    fireEvent.change(screen.getByLabelText('Suitability threshold'), { target: { value: '0.25' } });
    const before = lines()[0].getAttribute('x1');
    fireEvent.change(screen.getByLabelText('Suitability threshold'), { target: { value: '0.75' } });
    expect(lines()).toHaveLength(1);
    expect(Number(lines()[0].getAttribute('x1'))).toBeGreaterThan(Number(before));
  });

  it("draws a line for each run's own threshold in that mode", () => {
    render(<SdmCommonForm token={null} runs={runs} />);
    tick(/current/i);
    tick(/ssp5/i);
    fireEvent.click(screen.getByRole('button', { name: /each run's own/i }));
    expect(lines()).toHaveLength(2);
  });

  it('leaves the chart out when no run has a stored distribution', () => {
    render(<SdmCommonForm token={null} runs={RUNS} />);
    tick(/current/i);
    tick(/ssp5/i);
    expect(document.getElementById('sdm-distribution-chart')).toBeNull();
    expect(screen.getByText(/no stored distribution/i)).toBeTruthy();
  });
});
