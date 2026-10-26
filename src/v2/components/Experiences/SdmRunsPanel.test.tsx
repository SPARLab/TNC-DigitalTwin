// The right-hand analysis tabs: which one is open, and what each one lists.

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SdmRunsPanel } from './SdmRunsPanel';
import type { CompletedRun, SdmRunKind } from './types';

vi.mock('./SdmCompareForm', () => ({ SdmCompareForm: () => <div>compare form</div> }));
vi.mock('./SdmCommonForm', () => ({ SdmCommonForm: () => <div>common form</div> }));
vi.mock('./sdm/SdmRunView', () => ({ SdmRunView: () => <div>model figures</div> }));
vi.mock('./sdm/SdmComparisonView', () => ({ SdmComparisonView: () => <div>comparison figures</div> }));
vi.mock('./sdm/SdmCommonView', () => ({ SdmCommonView: () => <div>common figures</div> }));

function run(jobId: string, kind: SdmRunKind): CompletedRun {
  return {
    jobId,
    mapServerUrl: 'https://example.test/MapServer',
    title: `${kind} ${jobId}`,
    summary: '',
    record: null,
    analysis: null,
    visible: true,
    selected: false,
    pngUrl: null,
    tifUrl: null,
    addedAt: 1,
    outputType: 'Probability',
    kind,
    sdmSummary: kind === 'model' ? ({} as CompletedRun['sdmSummary']) : null,
    comparison: kind === 'comparison' ? ({} as CompletedRun['comparison']) : null,
    common: kind === 'common' ? ({} as CompletedRun['common']) : null,
  };
}

function renderPanel(runs: CompletedRun[]) {
  const props = {
    token: null,
    activeRunId: runs[0]?.jobId ?? null,
    onSelectRun: vi.fn(),
    onToggleVisible: vi.fn(),
    onRemove: vi.fn(),
    onChangeView: vi.fn(),
  };
  const view = render(<SdmRunsPanel runs={runs} {...props} />);
  return {
    ...view,
    rerenderWith: (next: CompletedRun[]) =>
      view.rerender(<SdmRunsPanel runs={next} {...props} activeRunId={next[0]?.jobId ?? null} />),
  };
}

const tab = (name: RegExp) => screen.getByRole('tab', { name });

describe('SdmRunsPanel', () => {
  it('has a tab each for the summary, comparison and common areas', () => {
    renderPanel([]);
    expect(tab(/run summary/i).getAttribute('aria-selected')).toBe('true');
    expect(tab(/compare/i)).toBeTruthy();
    expect(tab(/common areas/i)).toBeTruthy();
  });

  it('explains each tab and says when there is nothing to show yet', () => {
    renderPanel([]);
    expect(screen.getByText(/no model runs yet/i)).toBeTruthy();
    expect(screen.getByText(/every finished model run is listed here/i)).toBeTruthy();
    expect(screen.getByText(/compare two runs of the same output type/i)).toBeTruthy();
    expect(screen.getByText(/find where several runs agree/i)).toBeTruthy();
  });

  it('lists only the runs that belong on the open tab', () => {
    renderPanel([run('m1', 'model'), run('c1', 'comparison')]);
    const options = (id: string) =>
      Array.from((document.getElementById(id) as HTMLSelectElement).options).map((o) => o.text);
    expect(options('sdm-model-run-select')).toHaveLength(1);
    expect(options('sdm-model-run-select')[0]).toMatch(/model m1/);
    expect(options('sdm-comparison-run-select')[0]).toMatch(/comparison c1/);
    expect(screen.getByText('model figures')).toBeTruthy();
  });

  it('opens the tab of a run that finishes while it is open', () => {
    const { rerenderWith } = renderPanel([run('m1', 'model')]);
    expect(tab(/run summary/i).getAttribute('aria-selected')).toBe('true');

    rerenderWith([run('c1', 'comparison'), run('m1', 'model')]);
    expect(tab(/compare/i).getAttribute('aria-selected')).toBe('true');

    rerenderWith([run('x1', 'common'), run('c1', 'comparison'), run('m1', 'model')]);
    expect(tab(/common areas/i).getAttribute('aria-selected')).toBe('true');
  });

  it('does not change tab for runs it was opened with', () => {
    renderPanel([run('c1', 'comparison')]);
    expect(tab(/run summary/i).getAttribute('aria-selected')).toBe('true');
  });

  it('switches tabs by hand', () => {
    renderPanel([]);
    fireEvent.click(tab(/common areas/i));
    expect(tab(/common areas/i).getAttribute('aria-selected')).toBe('true');
  });
});

describe('SdmRunsPanel species filter', () => {
  const bobcat = (id: string, scenario: string): CompletedRun => ({
    ...run(id, 'model'),
    species: 'Bobcat (Lynx rufus)',
    speciesKey: 'Lynx rufus',
    scenario,
    title: `Bobcat (Lynx rufus) · ${scenario}`,
  });
  const fox = (id: string, scenario: string): CompletedRun => ({
    ...run(id, 'model'),
    species: 'Gray fox (Urocyon cinereoargenteus)',
    speciesKey: 'Urocyon cinereoargenteus',
    scenario,
    title: `Gray fox · ${scenario}`,
  });
  const optionTexts = (id: string) =>
    Array.from((document.getElementById(id) as HTMLSelectElement).options).map((o) => o.text);

  it('offers a species dropdown once two species have runs, and filters the runs by it', () => {
    renderPanel([fox('f1', 'Current'), bobcat('b1', 'SSP5 2050'), bobcat('b2', 'Current')]);
    const select = document.getElementById('sdm-species-select') as HTMLSelectElement;
    expect(select.tagName).toBe('SELECT');
    expect(Array.from(select.options).map((o) => o.text)).toEqual([
      'Gray fox (Urocyon cinereoargenteus)',
      'Bobcat (Lynx rufus)',
    ]);
    expect(optionTexts('sdm-model-run-select')).toHaveLength(1);

    fireEvent.change(select, { target: { value: 'Lynx rufus' } });
    expect(optionTexts('sdm-model-run-select')).toHaveLength(2);
  });

  it('names runs by scenario, without the species', () => {
    renderPanel([bobcat('b1', 'SSP5 2050')]);
    const [text] = optionTexts('sdm-model-run-select');
    expect(text).toMatch(/^SSP5 2050 · Probability/);
    expect(text).not.toMatch(/Bobcat/);
  });

  it('shows the species as plain text when only one has runs', () => {
    renderPanel([bobcat('b1', 'Current')]);
    expect(document.getElementById('sdm-species-select')?.tagName).toBe('P');
  });
});

describe('SdmRunsPanel analysis subtabs', () => {
  const sub = (name: RegExp) =>
    screen.getAllByRole('tab', { name }).find((el) => el.id.startsWith('sdm-subtab-comparison'))!;
  const panelHidden = (id: string) =>
    document.getElementById(id)!.className.split(' ').includes('hidden');

  it('opens Compare on Configure and keeps the form mounted behind Results', () => {
    renderPanel([run('m1', 'model')]);
    fireEvent.click(tab(/compare/i));
    expect(sub(/configure/i).getAttribute('aria-selected')).toBe('true');
    expect(panelHidden('sdm-subpanel-comparison-setup')).toBe(false);
    expect(panelHidden('sdm-subpanel-comparison-results')).toBe(true);

    fireEvent.click(sub(/results/i));
    expect(panelHidden('sdm-subpanel-comparison-setup')).toBe(true);
    expect(screen.getByText('compare form')).toBeTruthy();
  });

  it('switches to Results when a comparison finishes', () => {
    const { rerenderWith } = renderPanel([run('m1', 'model')]);
    rerenderWith([run('c1', 'comparison'), run('m1', 'model')]);
    expect(sub(/results/i).getAttribute('aria-selected')).toBe('true');
    expect(sub(/results \(1\)/i)).toBeTruthy();
  });
});

describe('SdmRunsPanel species colors', () => {
  it("shows the chosen species' map color beside the species", () => {
    const withSpecies: CompletedRun = {
      ...run('b1', 'model'),
      species: 'Bobcat (Lynx rufus)',
      speciesKey: 'Lynx rufus',
    };
    render(<SdmRunsPanel token={null} runs={[withSpecies]} activeRunId="b1" onSelectRun={vi.fn()}
      onToggleVisible={vi.fn()} onRemove={vi.fn()} onChangeView={vi.fn()}
      speciesColors={{ 'Lynx rufus': '#2563eb' }} />);
    const swatch = screen.getAllByTestId('species-swatch')[0] as HTMLElement;
    expect(swatch.style.background).toMatch(/rgb\(37, 99, 235\)|#2563eb/i);
  });
});

describe('SdmRunsPanel download dialog', () => {
  it('opens from a run\'s Download button with that run ticked', () => {
    renderPanel([run('m1', 'model'), run('m2', 'model')]);
    expect(screen.queryByRole('dialog')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /^download$/i }));
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(screen.getByText(/1 chosen/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /close download/i }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('has no download tab or header download button', () => {
    renderPanel([run('m1', 'model'), run('m2', 'model')]);
    expect(screen.queryByRole('tab', { name: /download/i })).toBeNull();
    // Only the single active run offers one.
    expect(screen.getAllByRole('button', { name: /^download$/i })).toHaveLength(1);
  });
});
