import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DatasetListView } from './DatasetListView';
import type { DataOneDataset } from '../../../../types/dataone';

function createDataset(overrides: Partial<DataOneDataset> = {}): DataOneDataset {
  return {
    id: 101,
    dataoneId: 'doi:10.1234/example',
    title: 'Kelp Forest Dynamics',
    datasetUrl: 'https://example.org/dataset',
    tncCategory: 'Species',
    tncCategories: ['Species'],
    tncConfidence: 0.9,
    dateUploaded: new Date('2025-01-10T00:00:00.000Z'),
    temporalCoverage: {
      beginDate: new Date('2018-01-01T00:00:00.000Z'),
      endDate: new Date('2024-12-31T00:00:00.000Z'),
    },
    centerLat: 34.5,
    centerLon: -120.4,
    repository: 'DataONE',
    geometry: { type: 'Point', coordinates: [-120.4, 34.5] },
    seriesId: 'series-101',
    isLatestVersion: true,
    versionCount: 1,
    filesSummary: { total: 2, byExtension: { csv: 1, tif: 1 }, sizeBytes: 2500 },
    authors: ['Ada Lovelace', 'Grace Hopper'],
    externalUrl: null,
    abstract: 'This study summarizes kelp canopy change and coastal habitat trends across seasonal surveys.',
    isMetadataOnly: false,
    ...overrides,
  };
}

describe('DatasetListView', () => {
  it('highlights a matching abstract phrase when search is active', () => {
    const dataset = createDataset({
      abstract: 'Remote sensing captures kelp canopy variability near the preserve shoreline.',
    });

    render(
      <DatasetListView
        datasets={[dataset]}
        loading={false}
        savedDataoneIds={new Set<string>()}
        searchTerm="kelp canopy"
        onViewDetail={vi.fn()}
      />,
    );

    const highlight = screen.getByText('kelp canopy');
    expect(highlight.tagName).toBe('MARK');
  });

  it('matches search text case-insensitively in abstract highlights', () => {
    const dataset = createDataset({
      abstract: 'Ocean monitoring tracks KELP CANOPY persistence and disturbance.',
    });

    render(
      <DatasetListView
        datasets={[dataset]}
        loading={false}
        savedDataoneIds={new Set<string>()}
        searchTerm="kelp canopy"
        onViewDetail={vi.fn()}
      />,
    );

    const highlight = screen.getByText('KELP CANOPY');
    expect(highlight.tagName).toBe('MARK');
  });

  it('shows fallback text when no abstract is available', () => {
    const dataset = createDataset({ abstract: null, tncCategory: 'Freshwater', repository: 'PISCO' });

    render(
      <DatasetListView
        datasets={[dataset]}
        loading={false}
        savedDataoneIds={new Set<string>()}
        searchTerm="freshwater"
        onViewDetail={vi.fn()}
      />,
    );

    expect(
      screen.getByText('Dataset metadata for freshwater studies from PISCO. Open details to view full abstract and coverage.'),
    ).toBeInTheDocument();
  });

  it('does not render highlight marks when search term is empty', () => {
    const dataset = createDataset({
      abstract: 'Habitat observations include kelp canopy density metrics and long-term anomalies.',
    });

    const { container } = render(
      <DatasetListView
        datasets={[dataset]}
        loading={false}
        savedDataoneIds={new Set<string>()}
        searchTerm=""
        onViewDetail={vi.fn()}
      />,
    );

    expect(container.querySelector('mark')).toBeNull();
  });
});
