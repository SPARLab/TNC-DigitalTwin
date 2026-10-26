// Which runs the download tab lists, the files in the zip, and how they are filed.

import JSZip from 'jszip';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SdmDownloadDialog } from '../SdmDownloadDialog';
import type { CompletedRun, SdmHistogram, SdmSummary } from '../types';
import { downloadGroups } from './downloadGroups';
import {
  buildSdmPackage,
  figuresCsv,
  flattenFigures,
  histogramCsv,
  runFolderName,
  safeSegment,
  speciesFolderOf,
} from './sdmPackage';

const histogram: SdmHistogram = {
  bin_edges: [0, 0.5, 1],
  counts: [3, 1],
  percent: [75, 25],
  area_km2: [30, 10],
};

function run(jobId: string, patch: Partial<CompletedRun> = {}): CompletedRun {
  return {
    jobId,
    mapServerUrl: 'https://example.test/MapServer',
    title: `title ${jobId}`,
    summary: '',
    record: null,
    analysis: null,
    visible: true,
    selected: false,
    pngUrl: `https://example.test/${jobId}.png`,
    tifUrl: `https://example.test/${jobId}.tif`,
    addedAt: 1_700_000_000_000,
    outputType: 'Probability',
    kind: 'model',
    species: 'Bobcat (Lynx rufus)',
    speciesKey: 'Lynx rufus',
    scenario: `scenario ${jobId}`,
    sdmSummary: {
      type: 'sdm_summary',
      output_type: 'Probability',
      histogram,
      model: { optimal_threshold: 0.4, auc: 0.9 },
    } as unknown as SdmSummary,
    ...patch,
  };
}

const fox = (jobId: string) =>
  run(jobId, { species: 'Gray fox', speciesKey: 'Urocyon cinereoargenteus' });

const mixedCommon = run('jMixed', {
  kind: 'common',
  species: undefined,
  speciesKey: undefined,
  scenario: undefined,
  sdmSummary: null,
  common: { type: 'sdm_common_suitability', run_count: 2 } as unknown as CompletedRun['common'],
  downloads: [{ label: 'Count', url: 'https://example.test/count.tif' }],
  inputRuns: [
    { jobId: 'a', title: 'a', species: 'Bobcat (Lynx rufus)', speciesKey: 'Lynx rufus' },
    { jobId: 'f', title: 'f', species: 'Gray fox', speciesKey: 'Urocyon cinereoargenteus' },
  ],
});

afterEach(() => vi.unstubAllGlobals());

describe('downloadGroups', () => {
  it('lists each species once with its runs by kind, and a shared analysis under each', () => {
    const groups = downloadGroups([mixedCommon, fox('f1'), run('b1'), run('cmp', { kind: 'comparison' })]);
    expect(groups.map((group) => group.key)).toEqual([
      'Lynx rufus',
      'Urocyon cinereoargenteus',
    ]);
    const bobcat = groups.find((group) => group.key === 'Lynx rufus')!;
    expect(bobcat.runs.model.map((item) => item.jobId)).toEqual(['b1']);
    expect(bobcat.runs.comparison.map((item) => item.jobId)).toEqual(['cmp']);
    expect(bobcat.runs.common.map((item) => item.jobId)).toEqual(['jMixed']);
    expect(groups[1].runs.common.map((item) => item.jobId)).toEqual(['jMixed']);
  });
});

describe('figures as CSV', () => {
  it('flattens nested figures into one row per value', () => {
    expect(flattenFigures({ a: { b: 1 }, list: [1, 2, null], rows: [{ x: 'y' }] })).toEqual([
      ['a.b', '1'],
      ['list', '1; 2; '],
      ['rows[0].x', 'y'],
    ]);
    expect(figuresCsv({ model: { auc: 0.9 } })).toBe('metric,value\r\nmodel.auc,0.9\r\n');
  });

  it('writes the histogram a row per bin', () => {
    expect(histogramCsv(histogram).split('\r\n')[1]).toBe('0,0.5,3,75,30');
  });
});

describe('filing', () => {
  it('files a run under its species, and a mixed result on its own', () => {
    expect(speciesFolderOf(run('a'))).toBe('Bobcat (Lynx rufus)');
    expect(speciesFolderOf(mixedCommon)).toBe('Several species');
    expect(runFolderName(run('jabcdef123456'))).toMatch(/^scenario jabcdef123456 - Probability-123456$/);
  });

  it('keeps every path segment short and free of trailing dots or spaces', () => {
    expect(safeSegment('a'.repeat(100)).length).toBeLessThanOrEqual(44);
    expect(safeSegment('SSP5-8.5. ')).toBe('SSP5-8.5');
    const long = run('jabcdef123456', { scenario: `${'Very long scenario name '.repeat(8)}` });
    expect(runFolderName(long).length).toBeLessThanOrEqual(47);
  });
});

describe('buildSdmPackage', () => {
  it('saves maps, figures and a manifest for every chosen run', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) =>
        url.includes('bad')
          ? { ok: false, status: 404 }
          : { ok: true, arrayBuffer: async () => new ArrayBuffer(url.length) },
      ),
    );
    const result = await buildSdmPackage([run('b1'), mixedCommon, run('bad1', { pngUrl: 'https://example.test/bad.png' })]);
    expect(result).not.toBeNull();
    const zip = await JSZip.loadAsync(result!.blob);
    const names = Object.keys(zip.files).filter((name) => !name.endsWith('/'));

    const modelFolder = 'Bobcat (Lynx rufus)/Model runs/';
    const inFolder = (folder: string, file: RegExp) =>
      names.some((n) => n.startsWith(folder) && file.test(n.slice(n.lastIndexOf('/') + 1)));
    expect(inFolder(modelFolder, /^map\.tif$/)).toBe(true);
    expect(inFolder(modelFolder, /^map\.png$/)).toBe(true);
    expect(inFolder(modelFolder, /^summary\.json$/)).toBe(true);
    expect(inFolder(modelFolder, /^summary\.csv$/)).toBe(true);
    expect(inFolder(modelFolder, /^distribution\.csv$/)).toBe(true);
    expect(inFolder(modelFolder, /^distribution\.(png|svg)$/)).toBe(true);
    expect(inFolder('Several species/Common areas/', /^Count\.tif$/)).toBe(true);
    // Short names inside a run's folder keep paths short enough for Windows.
    expect(Math.max(...names.map((n) => n.length))).toBeLessThan(120);
    expect(names).toContain('manifest.csv');
    expect(names).toContain('missing-files.txt');
    expect(result!.missing.join(' ')).toContain('bad.png');
    expect(result!.missing.join(' ')).toMatch(/answered 404|not allowed/);
  });

  it('exports the map image again instead of trusting the temporary link', async () => {
    const png = new Uint8Array(new ArrayBuffer(8));
    png.set([0x89, 0x50, 0x4e, 0x47]);
    const fetched: string[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        fetched.push(url);
        if (url.includes('/export?')) return { ok: true, arrayBuffer: async () => png.buffer };
        return url.endsWith('.png') ? { ok: false, status: 400 } : { ok: true, arrayBuffer: async () => new ArrayBuffer(4) };
      }),
    );
    const extent = { xmin: 1, ymin: 2, xmax: 3, ymax: 4, spatialReference: { wkid: 32611 } };
    const result = await buildSdmPackage([run('b1', { mapExtent: extent })]);
    const zip = await JSZip.loadAsync(result!.blob);
    expect(Object.keys(zip.files).some((n) => n.endsWith('/map.png'))).toBe(true);
    expect(result!.missing).toEqual([]);
    expect(fetched.some((url) => url.includes('/jobs/b1/export?') && url.includes('f=image'))).toBe(true);
    expect(fetched.some((url) => url.endsWith('b1.png'))).toBe(false);
  });

  it('falls back to the saved link, and says so when both fail', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 400 })));
    const extent = { xmin: 1, ymin: 2, xmax: 3, ymax: 4 };
    const result = await buildSdmPackage([run('b1', { mapExtent: extent })]);
    expect(result!.missing.join(' ')).toMatch(/map\.png: the server answered 400/);
  });

  it('returns nothing when no run has files', async () => {
    expect(await buildSdmPackage([])).toBeNull();
  });
});

describe('SdmDownloadDialog', () => {
  it('lists runs by species and counts the ones ticked', () => {
    render(<SdmDownloadDialog onClose={() => {}} runs={[fox('f1'), run('b1'), run('b2')]} />);
    expect(screen.getByRole('group', { name: 'Bobcat (Lynx rufus)' })).toBeTruthy();
    expect(screen.getByRole('group', { name: 'Gray fox' })).toBeTruthy();
    const button = screen.getByRole('button', { name: /^download( \d+ runs?)?$/i }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);

    fireEvent.click(screen.getAllByRole('checkbox')[0]);
    expect(screen.getByText(/1 chosen/)).toBeTruthy();
    expect(button.disabled).toBe(false);
  });

  it("ticks every run of a species with that species' Select all", () => {
    render(<SdmDownloadDialog onClose={() => {}} runs={[run('b1'), run('b2'), fox('f1')]} />);
    const group = screen.getByRole('group', { name: 'Bobcat (Lynx rufus)' });
    fireEvent.click(group.querySelector('button') as HTMLButtonElement);
    expect(screen.getByText(/2 chosen/)).toBeTruthy();
  });

  it('ticks a shared analysis everywhere it is listed', () => {
    render(<SdmDownloadDialog onClose={() => {}} runs={[mixedCommon]} />);
    const boxes = screen.getAllByRole('checkbox') as HTMLInputElement[];
    expect(boxes).toHaveLength(2);
    fireEvent.click(boxes[0]);
    expect(boxes.every((box) => box.checked)).toBe(true);
    expect(screen.getByText(/1 chosen/)).toBeTruthy();
  });

  it('opens with the requested runs ticked and closes on Escape', () => {
    const onClose = vi.fn();
    render(<SdmDownloadDialog runs={[run('b1'), run('b2')]} initialRunIds={['b2']} onClose={onClose} />);
    expect(screen.getByText(/1 chosen/)).toBeTruthy();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('says what it is for when there are no runs', async () => {
    render(<SdmDownloadDialog onClose={() => {}} runs={[]} />);
    await waitFor(() => expect(screen.getByText(/finished model runs and analyses/i)).toBeTruthy());
  });
});


