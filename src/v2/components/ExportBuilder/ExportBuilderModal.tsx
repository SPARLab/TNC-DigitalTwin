import { useEffect, useMemo, useState } from 'react';
import { Info } from 'lucide-react';
import { useLayers } from '../../context/LayerContext';
import { useCatalog } from '../../context/CatalogContext';
import type { DataSource } from '../../types';
import { ExportBuilderHeader } from './ExportBuilderHeader';
import { ExportBuilderFooter } from './ExportBuilderFooter';
import {
  LayerExportSection,
  type ExportFormatOption,
} from './LayerExportSection';
import { ExportSummary } from './ExportSummary';
import {
  createAndDownloadExportZip,
  downloadLinksTextFile,
  generateShareableLinks,
  type ExportActionLayer,
} from './exportActions';

interface ExportBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface LayerExportState {
  selectedFormatIds: string[];
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

function getLayerQuerySummary(layer: {
  filterSummary?: string;
  views?: Array<{ isVisible: boolean; filterSummary?: string }>;
}): string | undefined {
  const visibleView = layer.views?.find(view => view.isVisible);
  return visibleView?.filterSummary || layer.filterSummary;
}

function getLayerResultCount(layer: {
  resultCount?: number;
  views?: Array<{ isVisible: boolean; resultCount?: number }>;
}): number | undefined {
  const visibleView = layer.views?.find(view => view.isVisible);
  return visibleView?.resultCount ?? layer.resultCount;
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
        const existing = previous[layer.id];

        next[layer.id] = {
          selectedFormatIds: existing?.selectedFormatIds || getDefaultSelectedFormatIds(dataSource),
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
        const selectedFormatIds = layerExportState[layer.id]?.selectedFormatIds || [];
        const selectedFormatLabels = formatOptions
          .filter((format) => selectedFormatIds.includes(format.id))
          .map((format) => format.label);

        return {
          pinnedLayerId: layer.id,
          layerId: layer.layerId,
          layerName: layer.name,
          dataSource,
          querySummary: getLayerQuerySummary(layer),
          selectedFormatIds,
          selectedFormatLabels,
          filteredResultCount: getLayerResultCount(layer),
        };
      }),
    [layerDataSourceById, layerExportState, pinnedLayers],
  );

  const hasSelections = useMemo(
    () => exportActionLayers.some((layer) => layer.selectedFormatIds.length > 0),
    [exportActionLayers],
  );

  const exportSummaryLayers = useMemo(
    () => exportActionLayers.map((layer) => ({
      layerId: layer.pinnedLayerId,
      layerName: layer.layerName,
      dataSource: layer.dataSource,
      selectedFormatLabels: layer.selectedFormatLabels,
      filteredResultCount: layer.filteredResultCount,
    })),
    [exportActionLayers],
  );

  const selectedLayers = useMemo(
    () => exportActionLayers.filter((layer) => layer.selectedFormatIds.length > 0),
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
          ? `Generated ${manifest.totalLayers} export link set(s). Links copied and text file downloaded.`
          : `Generated ${manifest.totalLayers} export link set(s). Links text file downloaded.`,
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
        message: `ZIP package created successfully (${selectedLayers.length} layer sections, ${generatedAt}).`,
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

          <div
            id="export-builder-layer-intro-card"
            className="rounded-xl border border-slate-200 bg-slate-50 p-4"
          >
            <div id="export-builder-layer-intro-header" className="flex items-start gap-3">
              <Info id="export-builder-layer-intro-icon" className="mt-0.5 h-4 w-4 text-slate-500" />
              <div id="export-builder-layer-intro-copy" className="space-y-2">
                <p id="export-builder-layer-intro-title" className="text-sm font-semibold text-slate-700">
                  Per-layer export options
                </p>
                <p id="export-builder-layer-intro-description" className="text-sm text-slate-600">
                  Each pinned layer exports using its active filter state. Review the query summary,
                  result count, and choose which formats to include.
                </p>
              </div>
            </div>
          </div>

          <div id="export-builder-layer-sections" className="mt-4 space-y-4">
            {pinnedLayers.length === 0 ? (
              <p id="export-builder-empty-layer-sections" className="text-sm text-slate-500">
                No pinned layers yet. Pin a layer in the left sidebar to include it in exports.
              </p>
            ) : (
              <div id="export-builder-layer-sections-list" className="space-y-4">
                {pinnedLayers.map((layer) => (
                  <LayerExportSection
                    key={layer.id}
                    layerId={layer.id}
                    layerName={layer.name}
                    dataSource={layerDataSourceById[layer.id] || 'tnc-arcgis'}
                    querySummary={getLayerQuerySummary(layer)}
                    filteredResultCount={getLayerResultCount(layer)}
                    formatOptions={getFormatOptionsByDataSource(layerDataSourceById[layer.id] || 'tnc-arcgis')}
                    selectedFormatIds={layerExportState[layer.id]?.selectedFormatIds || []}
                    onToggleFormat={(formatId) => {
                      setLayerExportState((previous) => {
                        const current = previous[layer.id] || {
                          selectedFormatIds: getDefaultSelectedFormatIds(layerDataSourceById[layer.id] || 'tnc-arcgis'),
                        };

                        const isSelected = current.selectedFormatIds.includes(formatId);
                        return {
                          ...previous,
                          [layer.id]: {
                            ...current,
                            selectedFormatIds: isSelected
                              ? current.selectedFormatIds.filter((id) => id !== formatId)
                              : [...current.selectedFormatIds, formatId],
                          },
                        };
                      });
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          <div id="export-builder-summary-container" className="mt-4">
            <ExportSummary layers={exportSummaryLayers} />
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
