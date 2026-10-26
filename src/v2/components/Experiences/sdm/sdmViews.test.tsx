// Views of the three SDM result types, rendered from JSON the live service
// returned (see __fixtures__), so a change to the tool's output shows up here.

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import commonJson from './__fixtures__/common.json';
import comparisonJson from './__fixtures__/comparison.json';
import modelJson from './__fixtures__/model.json';
import { SdmCommonView } from './SdmCommonView';
import { SdmComparisonView } from './SdmComparisonView';
import { SdmDerivedLegend } from './SdmLegends';
import { SdmRunView } from './SdmRunView';
import type { CompletedRun, SdmCommonAreas, SdmComparison, SdmSummary } from '../types';

const summary = modelJson as unknown as SdmSummary;
const comparison = comparisonJson as unknown as SdmComparison;
const common = commonJson as unknown as SdmCommonAreas;

function run(patch: Partial<CompletedRun>): CompletedRun {
  return {
    jobId: 'j1',
    mapServerUrl: 'https://example.test/MapServer',
    title: 'Run',
    summary: '',
    record: null,
    analysis: null,
    visible: true,
    selected: false,
    pngUrl: null,
    tifUrl: null,
    addedAt: 1,
    ...patch,
  };
}

describe('SdmRunView', () => {
  it('shows the model fit, its threshold and the area at that threshold', () => {
    const { container } = render(<SdmRunView summary={summary} />);
    const text = container.textContent ?? '';
    expect(text).toContain('Model fit (AUC)');
    expect(text).toContain('0.983');
    expect(text).toContain('Model threshold');
    expect(text).toContain('0.651');
    expect(text).toContain('At or above 0.651');
  });

  it('switches the figures to the Preserve when the run has them', () => {
    expect(summary.preserve).toBeTruthy();
    render(<SdmRunView summary={summary} />);
    fireEvent.click(screen.getByRole('button', { name: 'Dangermond Preserve' }));
    expect(screen.getByText(/in the Preserve/)).toBeTruthy();
  });

  it('draws a binary run as suitable and unsuitable area', () => {
    const binary: SdmSummary = {
      ...summary,
      output_type: 'Binary',
      stats: undefined,
      histogram: undefined,
      suitable: { cells: 10, percent: 25, area_km2: 10 },
      unsuitable: { cells: 30, percent: 75, area_km2: 30 },
      preserve: null,
    };
    const { container } = render(<SdmRunView summary={binary} />);
    expect(container.textContent).toContain('Suitable');
    expect(container.textContent).toContain('Unsuitable');
    expect(container.textContent).toContain('25%');
    expect(container.textContent).toContain('This run has no Preserve figures');
  });
});

describe('SdmComparisonView', () => {
  it('shows increases, decreases and the unchanged cells for the difference view', () => {
    const { container } = render(
      <SdmComparisonView
        comparison={comparison}
        view="difference"
        onChangeView={vi.fn()}
        inputRuns={[
          { jobId: 'a', title: 'Run A title' },
          { jobId: 'b', title: 'Run B title' },
        ]}
      />,
    );
    const text = container.textContent ?? '';
    expect(text).toContain('Increased');
    expect(text).toContain('Decreased');
    expect(text).toContain('Unchanged');
    expect(text).toContain('Run A title');
    expect(text).toContain('Run B title');
  });

  it('asks the workspace to switch the map layer', () => {
    const onChangeView = vi.fn();
    render(
      <SdmComparisonView comparison={comparison} view="difference" onChangeView={onChangeView} />,
    );
    fireEvent.click(screen.getByRole('tab', { name: 'Threshold change' }));
    expect(onChangeView).toHaveBeenCalledWith('threshold-change');
  });

  it('lists the threshold-change classes in that view', () => {
    const { container } = render(
      <SdmComparisonView comparison={comparison} view="threshold-change" onChangeView={vi.fn()} />,
    );
    for (const entry of comparison.classes) {
      expect(container.textContent).toContain(entry.label);
    }
  });
});

describe('SdmCommonView', () => {
  it('headlines the area suitable in every run', () => {
    const { container } = render(<SdmCommonView common={common} />);
    expect(container.textContent).toContain(`Suitable in all ${common.run_count} runs`);
    for (const entry of common.by_count) {
      expect(container.textContent).toContain(entry.label);
    }
  });

  it('names each run by its title when the tool reports the job id', () => {
    const { container } = render(
      <SdmCommonView
        common={common}
        inputRuns={common.runs.map((item, index) => ({
          jobId: item.run,
          title: `Chosen run ${index + 1}`,
        }))}
      />,
    );
    expect(container.textContent).toContain('Chosen run 1');
    expect(container.textContent).toContain('Chosen run 2');
  });
});

describe('SdmDerivedLegend', () => {
  it('draws the difference ramp with the stretched range', () => {
    const { container } = render(
      <SdmDerivedLegend run={run({ kind: 'comparison', view: 'difference', comparison })} kind="comparison" />,
    );
    expect(container.textContent).toContain('higher in B');
    expect(container.textContent).toContain('higher in A');
  });

  it('draws the transition classes for the threshold-change view', () => {
    const { container } = render(
      <SdmDerivedLegend
        run={run({ kind: 'comparison', view: 'threshold-change', comparison })}
        kind="comparison"
      />,
    );
    expect(container.textContent).toContain('Stayed suitable');
  });

  it('lists every count for few runs and collapses the middle for many', () => {
    const few = render(<SdmDerivedLegend run={run({ kind: 'common', common })} kind="common" />);
    expect(few.container.querySelectorAll('li')).toHaveLength(common.by_count.length);

    const classes = Array.from({ length: 9 }, (_, index) => ({
      ...common.by_count[0],
      runs_suitable: index,
      label: `${index} runs`,
    }));
    const many = render(
      <SdmDerivedLegend
        run={run({ kind: 'common', common: { ...common, run_count: 8, by_count: classes } })}
        kind="common"
      />,
    );
    expect(many.container.querySelectorAll('li')).toHaveLength(3);
    expect(many.container.textContent).toContain('Suitable in 1 to 7 of 8 runs');
  });
});
