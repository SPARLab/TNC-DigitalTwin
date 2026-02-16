import { useEffect, useMemo, useState } from 'react';
import { useLayers } from '../../context/LayerContext';
import { useCatalog } from '../../context/CatalogContext';
import type { DataSource, PinnedLayer, PinnedLayerView } from '../../types';
import { ExportBuilderHeader } from './ExportBuilderHeader';
import { ExportBuilderFooter } from './ExportBuilderFooter';
import { LayerExportSection } from './LayerExportSection';
import { ExportSummary } from './ExportSummary';
import {
  createAndDownloadExportZip,
  downloadLinksTextFile,
  generateShareableLinks,
} from './exportActions';
import type {
  ExportActionLayer,
  ExportFormatOption,
  ExportQueryDefinition,
} from './types';
import {
  LARGE_EXPORT_WARNING_THRESHOLD_BYTES,
  estimateBytesForSelection,
} from './utils/sizeEstimator';

interface ExportBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface LayerExportState {
  selectedFormatIds: string[];
  selectedViewIds: string[];
  includeQueryDefinition: boolean;
}

interface ExportFeedback {
  type: 'success' | 'error';
  message: string;
}

function getFormatOptionsByDataSource(dataSource: DataSource): ExportFormatOption[] {
  switch (dataSource) {
    case 'inaturalist':
      return [
        { id: 'csv', label: 'CSV' },
        { id: 'geojson', label: 'GeoJSON' },
      ];
    case 'animl':
      return [
        { id: 'metadata', label: 'Metadata' },
        { id: 'images', label: 'Images' },
        { id: 'thumbnails', label: 'Thumbnails only' },
      ];
    case 'dendra':
      return [
        { id: 'metadata', label: 'Metadata' },
        { id: 'datastream-csv', label: 'Datastream CSV' },
      ];
    case 'dataone':
      return [
        { id: 'metadata', label: 'Metadata' },
        { id: 'links', label: 'File links' },
        { id: 'files', label: 'Download files' },
      ];
    default:
      return [{ id: 'metadata', label: 'Metadata' }];
  }
}

function getDefaultSelectedFormatIds(dataSource: DataSource): string[] {
  switch (dataSource) {
    case 'inaturalist':
      return ['csv'];
    case 'animl':
      return ['metadata', 'images'];
    case 'dendra':
      return ['metadata', 'datastream-csv'];
    case 'dataone':
      return ['metadata', 'links'];
    default:
      return ['metadata'];
  }
}

interface LayerViewExportModel {
  viewId: string;
  viewName: string;
  isActive: boolean;
  querySummary?: string;
  filteredResultCount?: number;
  queryDefinition?: ExportQueryDefinition;
}

function getViewDisplayName(view: PinnedLayerView, index: number): string {
  const nextName = view.name?.trim();
  if (nextName) {
    return nextName;
  }
  return `Filtered View ${index + 1}`;
}

function buildQueryDefinition(
  dataSource: DataSource,
  source: {
    filterSummary?: string;
    inaturalistFilters?: PinnedLayer['inaturalistFilters'];
    animlFilters?: PinnedLayer['animlFilters'];
    dendraFilters?: PinnedLayer['dendraFilters'];
  },
): ExportQueryDefinition | undefined {
  const queryDefinition: ExportQueryDefinition = {
    dataSource,
    filterSummary: source.filterSummary,
  };

  if (source.inaturalistFilters) {
    queryDefinition.inaturalistFilters = source.inaturalistFilters;
  }
  if (source.animlFilters) {
    queryDefinition.animlFilters = source.animlFilters;
  }
  if (source.dendraFilters) {
    queryDefinition.dendraFilters = source.dendraFilters;
  }

  if (
    !queryDefinition.filterSummary &&
    !queryDefinition.inaturalistFilters &&
    !queryDefinition.animlFilters &&
    !queryDefinition.dendraFilters
  ) {
    return undefined;
  }

  return queryDefinition;
}

function getLayerViewModels(layer: PinnedLayer, dataSource: DataSource): LayerViewExportModel[] {
  if (layer.views && layer.views.length > 0) {
    const hasVisibleView = layer.views.some((view) => view.isVisible);
    return layer.views.map((view, index) => ({
      viewId: view.id,
      viewName: getViewDisplayName(view, index),
      isActive: view.isVisible || (!hasVisibleView && index === 0),
      querySummary: view.filterSummary,
      filteredResultCount: view.resultCount,
      queryDefinition: buildQueryDefinition(dataSource, {
        filterSummary: view.filterSummary,
        inaturalistFilters: view.inaturalistFilters,
        animlFilters: view.animlFilters,
        dendraFilters: view.dendraFilters,
      }),
    }));
  }

  return [{
    viewId: `layer-${layer.id}`,
    viewName: 'Active View',
    isActive: true,
    querySummary: layer.filterSummary,
    filteredResultCount: layer.resultCount,
    queryDefinition: buildQueryDefinition(dataSource, {
      filterSummary: layer.filterSummary,
      inaturalistFilters: layer.inaturalistFilters,
      animlFilters: layer.animlFilters,
      dendraFilters: layer.dendraFilters,
    }),
  }];
}

export function ExportBuilderModal({ isOpen, onClose }: ExportBuilderModalProps) {
  const { pinnedLayers } = useLayers();
  const { layerMap } = useCatalog();
  const [layerExportState, setLayerExportState] = useState<Record<string, LayerExportState>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingAction, setProcessingAction] = useState<'zip' | 'links' | null>(null);
  const [feedback, setFeedback] = useState<ExportFeedback | null>(null);

  const pinnedLayerCount = pinnedLayers.length;
  const layerDataSourceById = useMemo<Record<string, DataSource>>(
    () =>
      pinnedLayers.reduce<Record<string, DataSource>>((acc, layer) => {
        const layerMetadata = layerMap.get(layer.layerId);
        acc[layer.id] = layerMetadata?.dataSource || 'tnc-arcgis';
        return acc;
      }, {}),
    [layerMap, pinnedLayers],
  );

  useEffect(() => {
    setLayerExportState((previous) => {
      const next: Record<string, LayerExportState> = {};

      for (const layer of pinnedLayers) {
        const dataSource = layerDataSourceById[layer.id] || 'tnc-arcgis';
        const views = getLayerViewModels(layer, dataSource);
        const validViewIds = new Set(views.map((view) => view.viewId));
        const activeViewId = views.find((view) => view.isActive)?.viewId ?? views[0]?.viewId;
        const existing = previous[layer.id];

        const existingViewIds = existing?.selectedViewIds?.filter((viewId) => validViewIds.has(viewId)) || [];
        const selectedViewIds = existingViewIds.length > 0
          ? existingViewIds
          : (activeViewId ? [activeViewId] : []);

        next[layer.id] = {
          selectedFormatIds: existing?.selectedFormatIds || getDefaultSelectedFormatIds(dataSource),
          selectedViewIds,
          includeQueryDefinition: existing?.includeQueryDefinition ?? false,
        };
      }

      return next;
    });
  }, [layerDataSourceById, pinnedLayers]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setFeedback(null);
      setIsProcessing(false);
      setProcessingAction(null);
    }
  }, [isOpen]);

  const exportActionLayers = useMemo<ExportActionLayer[]>(
    () =>
      pinnedLayers.map((layer) => {
        const dataSource = layerDataSourceById[layer.id] || 'tnc-arcgis';
        const formatOptions = getFormatOptionsByDataSource(dataSource);
        const state = layerExportState[layer.id];
        const selectedFormatIds = state?.selectedFormatIds || [];
        const selectedFormatLabels = formatOptions
          .filter((format) => selectedFormatIds.includes(format.id))
          .map((format) => format.label);
        const views = getLayerViewModels(layer, dataSource);
        const selectedViewIds = state?.selectedViewIds || [];
        const selectedViews = views.filter((view) => selectedViewIds.includes(view.viewId)).map((view) => ({
          viewId: view.viewId,
          viewName: view.viewName,
          isActive: view.isActive,
          querySummary: view.querySummary,
          filteredResultCount: view.filteredResultCount,
          queryDefinition: state?.includeQueryDefinition ? view.queryDefinition : undefined,
        }));
        const viewEstimates = selectedViews.map((view) => estimateBytesForSelection(
          dataSource,
          selectedFormatIds,
          view.filteredResultCount,
        ));
        const hasUnavailableEstimate = viewEstimates.some((estimate) => estimate.isUnavailable);
        const estimatedBytes = hasUnavailableEstimate
          ? undefined
          : viewEstimates.reduce((sum, estimate) => sum + (estimate.bytes || 0), 0);

        return {
          pinnedLayerId: layer.id,
          layerId: layer.layerId,
          layerName: layer.name,
          dataSource,
          selectedFormatIds,
          selectedFormatLabels,
          includeQueryDefinition: state?.includeQueryDefinition ?? false,
          selectedViews,
          estimatedBytes,
        };
      }),
    [layerDataSourceById, layerExportState, pinnedLayers],
  );

  const hasSelections = useMemo(
    () => exportActionLayers.some((layer) => (
      layer.selectedFormatIds.length > 0 && layer.selectedViews.length > 0
    )),
    [exportActionLayers],
  );

  const selectedLayers = useMemo(
    () => exportActionLayers.filter((layer) => (
      layer.selectedFormatIds.length > 0 && layer.selectedViews.length > 0
    )),
    [exportActionLayers],
  );

  const handleGenerateLinks = async () => {
    if (selectedLayers.length === 0) {
      setFeedback({ type: 'error', message: 'Select at least one export format before generating links.' });
      return;
    }

    setIsProcessing(true);
    setProcessingAction('links');
    setFeedback(null);

    try {
      const { linksText, manifest } = generateShareableLinks(selectedLayers);
      let clipboardCopied = false;

      if (navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(linksText);
          clipboardCopied = true;
        } catch {
          clipboardCopied = false;
        }
      }

      downloadLinksTextFile(linksText);
      setFeedback({
        type: 'success',
        message: clipboardCopied
          ? `Generated ${manifest.totalLayers} layer link set(s). Links copied and text file downloaded.`
          : `Generated ${manifest.totalLayers} layer link set(s). Links text file downloaded.`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setFeedback({ type: 'error', message: `Could not generate links: ${message}` });
    } finally {
      setIsProcessing(false);
      setProcessingAction(null);
    }
  };

  const handleExportZip = async () => {
    if (selectedLayers.length === 0) {
      setFeedback({ type: 'error', message: 'Select at least one export format before exporting ZIP.' });
      return;
    }

    setIsProcessing(true);
    setProcessingAction('zip');
    setFeedback(null);

    try {
      const generatedAt = await createAndDownloadExportZip(selectedLayers);
      setFeedback({
        type: 'success',
        message: `ZIP package created (${selectedLayers.length} layers, ${generatedAt}).`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setFeedback({ type: 'error', message: `Could not create ZIP export: ${message}` });
    } finally {
      setIsProcessing(false);
      setProcessingAction(null);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      id="export-builder-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-builder-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        id="export-builder-modal"
        className="flex h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <ExportBuilderHeader
          pinnedLayerCount={pinnedLayerCount}
          onClose={onClose}
        />

        <div id="export-builder-content-scroll-area" className="flex-1 overflow-y-auto px-6 py-5">
          {feedback ? (
            <div
              id="export-builder-feedback-banner"
              className={`mb-4 rounded-lg border px-4 py-3 text-sm ${
                feedback.type === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  : 'border-red-200 bg-red-50 text-red-700'
              }`}
              role="status"
              aria-live="polite"
            >
              {feedback.message}
            </div>
          ) : null}

          <div id="export-builder-context-strip" className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div id="export-builder-context-strip-row" className="flex flex-wrap items-center gap-2">
              <span
                id="export-builder-context-strip-chip-views"
                className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700"
              >
                1. Select filtered views
              </span>
              <span
                id="export-builder-context-strip-arrow-1"
                className="text-base font-bold text-slate-500"
                aria-hidden="true"
              >
                &gt;
              </span>
              <span
                id="export-builder-context-strip-chip-outputs"
                className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700"
              >
                2. Choose outputs
              </span>
              <span
                id="export-builder-context-strip-arrow-2"
                className="text-base font-bold text-slate-500"
                aria-hidden="true"
              >
                &gt;
              </span>
              <span
                id="export-builder-context-strip-chip-export"
                className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700"
              >
                3. Generate links or ZIP
              </span>
            </div>
          </div>

          <div id="export-builder-layer-list-heading-wrap" className="mt-4">
            <h3 id="export-builder-layer-list-heading" className="text-sm font-semibold text-slate-800">
              Layer exports
            </h3>
          </div>

          <div id="export-builder-layer-sections" className="mt-4 space-y-4">
            {pinnedLayers.length === 0 ? (
              <div id="export-builder-empty-layer-sections" className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
                <p id="export-builder-empty-layer-sections-copy" className="text-sm text-slate-600">
                  No pinned layers yet. Pin a layer to start building an export package.
                </p>
              </div>
            ) : (
              <div id="export-builder-layer-sections-list" className="space-y-4">
                {pinnedLayers.map((layer) => {
                  const dataSource = layerDataSourceById[layer.id] || 'tnc-arcgis';
                  const formatOptions = getFormatOptionsByDataSource(dataSource);
                  const current = layerExportState[layer.id];
                  const selectedFormatIds = current?.selectedFormatIds || [];
                  const views = getLayerViewModels(layer, dataSource);
                  const selectedViewIds = current?.selectedViewIds || [];
                  const viewItems = views.map((view) => {
                    const estimate = estimateBytesForSelection(dataSource, selectedFormatIds, view.filteredResultCount);
                    return {
                      viewId: view.viewId,
                      viewName: view.viewName,
                      isActive: view.isActive,
                      isSelected: selectedViewIds.includes(view.viewId),
                      querySummary: view.querySummary,
                      filteredResultCount: view.filteredResultCount,
                      estimatedBytes: estimate.bytes,
                      isEstimateUnavailable: estimate.isUnavailable,
                    };
                  });
                  const selectedViewItems = viewItems.filter((view) => view.isSelected);
                  const isLayerEstimateUnavailable = selectedViewItems.some((view) => view.isEstimateUnavailable);
                  const layerEstimatedBytes = isLayerEstimateUnavailable
                    ? undefined
                    : selectedViewItems.reduce((sum, view) => sum + (view.estimatedBytes || 0), 0);
                  const showLargeExportWarning = selectedViewItems.length > 1
                    && !isLayerEstimateUnavailable
                    && (layerEstimatedBytes || 0) >= LARGE_EXPORT_WARNING_THRESHOLD_BYTES;

                  return (
                    <LayerExportSection
                      key={layer.id}
                      layerId={layer.id}
                      layerName={layer.name}
                      dataSource={dataSource}
                      views={viewItems}
                      formatOptions={formatOptions}
                      selectedFormatIds={selectedFormatIds}
                      includeQueryDefinition={current?.includeQueryDefinition ?? false}
                      layerEstimatedBytes={layerEstimatedBytes}
                      isLayerEstimateUnavailable={isLayerEstimateUnavailable}
                      showLargeExportWarning={showLargeExportWarning}
                      onToggleView={(viewId) => {
                        setLayerExportState((previous) => {
                          const fallbackViews = getLayerViewModels(layer, dataSource);
                          const fallbackActiveViewId = fallbackViews.find((view) => view.isActive)?.viewId
                            ?? fallbackViews[0]?.viewId;
                          const existing = previous[layer.id] || {
                            selectedFormatIds: getDefaultSelectedFormatIds(dataSource),
                            selectedViewIds: fallbackActiveViewId ? [fallbackActiveViewId] : [],
                            includeQueryDefinition: false,
                          };
                          const isSelected = existing.selectedViewIds.includes(viewId);

                          return {
                            ...previous,
                            [layer.id]: {
                              ...existing,
                              selectedViewIds: isSelected
                                ? existing.selectedViewIds.filter((id) => id !== viewId)
                                : [...existing.selectedViewIds, viewId],
                            },
                          };
                        });
                      }}
                      onToggleFormat={(formatId) => {
                        setLayerExportState((previous) => {
                          const fallbackViews = getLayerViewModels(layer, dataSource);
                          const fallbackActiveViewId = fallbackViews.find((view) => view.isActive)?.viewId
                            ?? fallbackViews[0]?.viewId;
                          const existing = previous[layer.id] || {
                            selectedFormatIds: getDefaultSelectedFormatIds(dataSource),
                            selectedViewIds: fallbackActiveViewId ? [fallbackActiveViewId] : [],
                            includeQueryDefinition: false,
                          };
                          const isSelected = existing.selectedFormatIds.includes(formatId);
                          return {
                            ...previous,
                            [layer.id]: {
                              ...existing,
                              selectedFormatIds: isSelected
                                ? existing.selectedFormatIds.filter((id) => id !== formatId)
                                : [...existing.selectedFormatIds, formatId],
                            },
                          };
                        });
                      }}
                      onToggleIncludeQueryDefinition={() => {
                        setLayerExportState((previous) => {
                          const fallbackViews = getLayerViewModels(layer, dataSource);
                          const fallbackActiveViewId = fallbackViews.find((view) => view.isActive)?.viewId
                            ?? fallbackViews[0]?.viewId;
                          const existing = previous[layer.id] || {
                            selectedFormatIds: getDefaultSelectedFormatIds(dataSource),
                            selectedViewIds: fallbackActiveViewId ? [fallbackActiveViewId] : [],
                            includeQueryDefinition: false,
                          };
                          return {
                            ...previous,
                            [layer.id]: {
                              ...existing,
                              includeQueryDefinition: !existing.includeQueryDefinition,
                            },
                          };
                        });
                      }}
                    />
                  );
                })}
              </div>
            )}
          </div>

          <div id="export-builder-summary-container" className="mt-4">
            <ExportSummary layers={exportActionLayers} />
          </div>
        </div>

        <ExportBuilderFooter
          onCancel={onClose}
          onGenerateLinks={() => {
            void handleGenerateLinks();
          }}
          onExportZip={() => {
            void handleExportZip();
          }}
          isProcessing={isProcessing}
          processingAction={processingAction}
          hasSelections={hasSelections}
        />
      </div>
    </div>
  );
}
