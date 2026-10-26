// The species model wizard: step order, map previews of climate variables, and
// the jobs a run submits (one training job, then one prediction per climate).

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GP_SERVICES, SDM_TRAINING_MOSAIC_URL } from '../../config/geoprocessing';
import { SDMPanel } from './SDMPanel';
import type { PreviewAction } from './types';

const submitGpJob = vi.fn();
const fetchGpResultValue = vi.fn();

vi.mock('../../services/geoprocessingService', () => ({
  submitGpJob: (...args: unknown[]) => submitGpJob(...args),
  fetchGpResultValue: (...args: unknown[]) => fetchGpResultValue(...args),
}));

// Every job finishes as soon as it is shown, which is what lets the next one start.
vi.mock('./GpJobStatus', async () => {
  const { useEffect } = await import('react');
  return {
    GpJobStatus: ({
      job,
      task,
      onStatusChange,
    }: {
      job: { id: string };
      task: string;
      onStatusChange?: (status: string) => void;
    }) => {
      useEffect(() => {
        onStatusChange?.('esriJobSucceeded');
      }, [onStatusChange]);
      return <div data-testid="job-status">{`${task}:${job.id}`}</div>;
    },
  };
});

vi.mock('./OccurrenceInfo', () => ({
  OccurrenceInfo: () => <div data-testid="occurrence-info" />,
}));

vi.mock('./SpeciesSelect', () => ({
  SpeciesSelect: ({ onChange }: { onChange: (species: string, commonName?: string) => void }) => (
    <button type="button" onClick={() => onChange('Lynx rufus', 'Bobcat')}>
      choose bobcat
    </button>
  ),
}));

let nextJob = 0;

beforeEach(() => {
  submitGpJob.mockReset();
  fetchGpResultValue.mockReset();
  nextJob = 0;
  submitGpJob.mockImplementation(async () => `job${(nextJob += 1)}`);
  fetchGpResultValue.mockResolvedValue('model-1');
});

const click = (name: RegExp) => fireEvent.click(screen.getByRole('button', { name }));
const tick = (name: RegExp) => fireEvent.click(screen.getByRole('checkbox', { name }));

function renderPanel() {
  const previews: PreviewAction[] = [];
  render(<SDMPanel token={null} onPreviewLayer={(action) => previews.push(action)} />);
  return previews;
}

function toScenarioStep() {
  click(/start species model/i);
  click(/choose bobcat/i);
  click(/continue to scenario/i);
}

const tasks = () => submitGpJob.mock.calls.map((call) => call[1]);

describe('SDMPanel wizard', () => {
  it('opens on an overview of the tool', () => {
    renderPanel();
    expect(screen.getByRole('heading', { name: /species distribution model/i })).toBeTruthy();
    expect(screen.getByText(/how a run works/i)).toBeTruthy();
  });

  it('does not continue past the species step until one is chosen', () => {
    renderPanel();
    click(/start species model/i);
    const next = screen.getByRole('button', { name: /continue to scenario/i }) as HTMLButtonElement;
    expect(next.disabled).toBe(true);
    click(/choose bobcat/i);
    expect(next.disabled).toBe(false);
  });

  it('starts with the current climate chosen and needs at least one', () => {
    renderPanel();
    toScenarioStep();
    expect((screen.getByRole('checkbox', { name: /current \(1981/i }) as HTMLInputElement).checked).toBe(
      true,
    );
    tick(/current \(1981/i);
    const next = screen.getByRole('button', { name: /continue to output/i }) as HTMLButtonElement;
    expect(next.disabled).toBe(true);
  });

  it('adds and removes a climate variable on the map', () => {
    const previews = renderPanel();
    toScenarioStep();

    click(/add mean annual air temperature to the map/i);
    expect(previews).toHaveLength(1);
    expect(previews[0]).toMatchObject({ action: 'add', mosaicTag: 'bio01' });
    expect(previews[0].url).toMatch(/ImageServer$/);

    click(/remove mean annual air temperature from the map/i);
    expect(previews[1]).toEqual({ action: 'remove', rasterId: previews[0].rasterId });
  });

  it('moves every previewed variable to another climate', () => {
    const previews = renderPanel();
    toScenarioStep();
    click(/add mean annual air temperature to the map/i);
    click(/add isothermality to the map/i);
    previews.length = 0;

    fireEvent.change(screen.getByLabelText(/preview climate variables/i), {
      target: { value: 'ssp585|2071–2100' },
    });

    expect(previews.map((preview) => preview.action)).toEqual(['remove', 'add', 'remove', 'add']);
    const added = previews.filter((preview) => preview.action === 'add');
    expect(added.map((preview) => preview.mosaicTag)).toEqual(['bio01', 'bio03']);
    expect(added[0].url).toMatch(/ssp585_2071_2100/i);
  });

  it('trains once, then predicts each chosen climate', async () => {
    renderPanel();
    toScenarioStep();
    tick(/ssp5-8\.5 \(2071/i);
    tick(/ssp1-2\.6 \(2041/i);
    click(/continue to output/i);
    fireEvent.click(screen.getByRole('radio', { name: /binary/i }));
    click(/run model for 3 climates/i);

    await waitFor(() => expect(submitGpJob).toHaveBeenCalledTimes(4));
    const service = GP_SERVICES.sdmRandomForest;
    expect(tasks()).toEqual([
      service.trainTask,
      service.predictTask,
      service.predictTask,
      service.predictTask,
    ]);

    const [, , trainParams] = submitGpJob.mock.calls[0];
    expect(trainParams).toMatchObject({ species: 'Lynx rufus', predictors: SDM_TRAINING_MOSAIC_URL });
    expect(trainParams).not.toHaveProperty('output_type');

    const predictions = submitGpJob.mock.calls.slice(1).map((call) => call[2]);
    for (const params of predictions) {
      expect(params).toMatchObject({ model_id: 'model-1', output_type: 'Binary' });
    }
    // The baseline is the training climate, so it needs no projection mosaic.
    expect(predictions[0]).not.toHaveProperty('projection_predictors');
    expect(predictions[1].projection_predictors).toMatch(/ssp126_2041_2070/i);
    expect(predictions[2].projection_predictors).toMatch(/ssp585_2071_2100/i);
  });

  it('reuses the trained model for the next run of the same species', async () => {
    renderPanel();
    toScenarioStep();
    click(/continue to output/i);
    click(/^run model$/i);
    await waitFor(() => expect(submitGpJob).toHaveBeenCalledTimes(2));
    await waitFor(() =>
      expect((screen.getByRole('button', { name: /^run model$/i }) as HTMLButtonElement).disabled).toBe(
        false,
      ),
    );

    expect(screen.getByText(/reusing the model trained at/i)).toBeTruthy();
    fireEvent.click(screen.getByRole('radio', { name: /binary/i }));
    click(/^run model$/i);

    await waitFor(() => expect(submitGpJob).toHaveBeenCalledTimes(3));
    expect(tasks()).toEqual([
      GP_SERVICES.sdmRandomForest.trainTask,
      GP_SERVICES.sdmRandomForest.predictTask,
      GP_SERVICES.sdmRandomForest.predictTask,
    ]);
  });

  it('trains again when asked to', async () => {
    renderPanel();
    toScenarioStep();
    click(/continue to output/i);
    click(/^run model$/i);
    await waitFor(() => expect(submitGpJob).toHaveBeenCalledTimes(2));
    await waitFor(() =>
      expect((screen.getByRole('button', { name: /^run model$/i }) as HTMLButtonElement).disabled).toBe(
        false,
      ),
    );

    fireEvent.click(screen.getByRole('checkbox', { name: /train a new model/i }));
    click(/^run model$/i);
    await waitFor(() => expect(submitGpJob).toHaveBeenCalledTimes(4));
    expect(tasks().slice(2)).toEqual([
      GP_SERVICES.sdmRandomForest.trainTask,
      GP_SERVICES.sdmRandomForest.predictTask,
    ]);
  });
});
