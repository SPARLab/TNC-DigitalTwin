// ============================================================================
// useMonitoringSections — builds the Live Monitoring sensor tree from the Data
// Catalog's `live_tag` column, pairing each tagged dataset with its renderer.
//
// Sections, ordering, labels and membership all come from the catalog, so adding
// a sensor to the page is a tagging change rather than a code change. Sensors
// whose renderer is not implemented yet come back with `renderer: null` and are
// rendered disabled.
// ============================================================================

import { useEffect, useMemo, useRef, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  fetchLiveTaggedDatasets,
  type LiveTaggedDataset,
} from '../services/monitoringCatalogService';
import {
  listBoundServicePaths,
  resolveRendererBinding,
  sectionIcon,
  type MonitoringRenderer,
} from '../config/monitoringRenderers';

export interface MonitoringSensor {
  /** Stable id for active/loading state — the renderer's variable key when one exists. */
  id: string;
  name: string;
  unit: string;
  /** Null when this dataset is tagged but has no renderer yet. */
  renderer: MonitoringRenderer | null;
  datasetId: number;
  servicePath: string;
  /** FeatureServer sublayer used for live readings (usually Latest = 0). */
  layerId: number;
}

export interface MonitoringSection {
  id: string;
  /** Section heading, verbatim from `live_tag`. */
  name: string;
  icon: LucideIcon;
  sensors: MonitoringSensor[];
}

export interface UseMonitoringSectionsResult {
  sections: MonitoringSection[];
  isLoading: boolean;
  error: string | null;
}

function toSlug(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function buildSections(datasets: LiveTaggedDataset[]): MonitoringSection[] {
  const byTag = new Map<string, MonitoringSection>();

  for (const dataset of datasets) {
    const binding = resolveRendererBinding(dataset.servicePath);

    const section = byTag.get(dataset.liveTag) ?? {
      id: toSlug(dataset.liveTag),
      name: dataset.liveTag,
      icon: sectionIcon(dataset.liveTag),
      sensors: [],
    };

    section.sensors.push({
      // Falling back to the dataset id keeps unimplemented rows uniquely
      // keyable without inventing a variable name for them.
      id: binding?.variableKey ?? `dataset-${dataset.datasetId}`,
      name: dataset.displayTitle,
      unit: binding?.unit ?? '',
      renderer: binding?.renderer ?? null,
      datasetId: dataset.datasetId,
      servicePath: dataset.servicePath,
      layerId: dataset.layerId,
    });

    byTag.set(dataset.liveTag, section);
  }

  return [...byTag.values()];
}

/**
 * Surface tagging gaps in both directions once per load. Both are data-entry
 * mistakes rather than code bugs, and both are otherwise invisible: an untagged
 * dataset silently vanishes from the page.
 */
function warnAboutTaggingGaps(datasets: LiveTaggedDataset[]): void {
  if (!import.meta.env.DEV) return;

  const taggedPaths = new Set(datasets.map((dataset) => dataset.servicePath));

  const unimplemented = datasets
    .filter((dataset) => !resolveRendererBinding(dataset.servicePath))
    .map((dataset) => dataset.displayTitle);
  if (unimplemented.length > 0) {
    console.info(
      `[MonitoringSections] Tagged but not implemented yet (shown disabled): ${unimplemented.join(', ')}`,
    );
  }

  const untagged = listBoundServicePaths().filter((path) => !taggedPaths.has(path));
  if (untagged.length > 0) {
    console.warn(
      '[MonitoringSections] These have renderers but no live_tag, so they will not appear. '
        + `Add a live_tag in the management app: ${untagged.join(', ')}`,
    );
  }
}

export function useMonitoringSections(): UseMonitoringSectionsResult {
  const [datasets, setDatasets] = useState<LiveTaggedDataset[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // StrictMode mounts effects twice; without this the warnings log twice too.
  const hasWarnedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const result = await fetchLiveTaggedDatasets();
        if (cancelled) return;

        if (!hasWarnedRef.current) {
          hasWarnedRef.current = true;
          warnAboutTaggingGaps(result);
        }

        setDatasets(result);
        setError(null);
      } catch (caught) {
        if (cancelled) return;
        const message = caught instanceof Error ? caught.message : 'Failed to load sensor list.';
        console.error('[MonitoringSections] Could not load the tagged dataset list:', caught);
        setError(message);
        setDatasets(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const sections = useMemo(() => (datasets ? buildSections(datasets) : []), [datasets]);

  return { sections, isLoading, error };
}
