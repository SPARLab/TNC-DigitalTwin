import { useEffect, useMemo, useRef, useState } from 'react';
import Extent from '@arcgis/core/geometry/Extent';
import type Point from '@arcgis/core/geometry/Point';
import type FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import type MapView from '@arcgis/core/views/MapView';
import type SceneView from '@arcgis/core/views/SceneView';
import {
  dataOneService,
  type DataOneDataset,
  type DataOneDatasetDetail,
  type DataOneVersionEntry,
} from '../../../../services/dataOneService';
import { useMap } from '../../../context/MapContext';
import { goToMarkerWithSmartZoom } from '../../../utils/mapMarkerNavigation';

const MAP_LAYER_ID = 'v2-dataone-datasets';

/**
 * Query the DataONE map layer for a feature matching `dataoneId` and open the
 * ArcGIS popup on it so the native light-blue selection highlight appears.
 */
async function openPopupForDataoneFeature(
  view: MapView | SceneView,
  dataoneId: string,
): Promise<void> {
  const mapLayer = view.map?.findLayerById(MAP_LAYER_ID) as FeatureLayer | undefined;
  if (!mapLayer) return;

  const escapedId = dataoneId.replace(/'/g, "''");
  const result = await mapLayer.queryFeatures({
    where: `dataoneId = '${escapedId}'`,
    outFields: ['*'],
    returnGeometry: true,
    num: 1,
  });

  const feature = result.features[0];
  if (!feature) return;

  view.openPopup({
    features: [feature],
    location: feature.geometry?.type === 'point' ? (feature.geometry as Point) : undefined,
  });
}

function extractDoi(dataoneId: string): string | null {
  const trimmed = dataoneId.trim();
  if (!trimmed) return null;
  return trimmed.toLowerCase().startsWith('doi:') ? trimmed.slice(4) : null;
}

function buildDataOneUrl(dataset: DataOneDataset, details: DataOneDatasetDetail | null): string | null {
  return dataset.datasetUrl || details?.dataUrl || null;
}

function buildCitation(dataset: DataOneDataset, details: DataOneDatasetDetail | null): string {
  const authors = details?.authors?.length
    ? details.authors.join(', ')
    : (dataset.authors?.join(', ') || 'Unknown author');
  const year = dataset.dateUploaded?.getFullYear() ?? 'n.d.';
  const doi = extractDoi(dataset.dataoneId);
  const dataOneUrl = buildDataOneUrl(dataset, details);
  const doiOrUrl = doi ? `https://doi.org/${doi}` : (dataOneUrl || dataset.dataoneId);
  return `${authors} (${year}). ${dataset.title}. DataONE. ${doiOrUrl}`;
}

interface UseDatasetDetailOrchestratorArgs {
  dataset: DataOneDataset;
  isDatasetSaved?: boolean;
  // eslint-disable-next-line no-unused-vars
  onSaveDatasetView?: (dataset: DataOneDataset) => string | void;
  onUnsaveDatasetView?: () => void;
  // eslint-disable-next-line no-unused-vars
  onVersionSelect?: (dataset: DataOneDataset) => void;
}

export function useDatasetDetailOrchestrator({
  dataset,
  isDatasetSaved,
  onSaveDatasetView,
  onUnsaveDatasetView,
  onVersionSelect,
}: UseDatasetDetailOrchestratorArgs) {
  const [details, setDetails] = useState<DataOneDatasetDetail | null>(null);
  const [fileInfoError, setFileInfoError] = useState<string | null>(null);
  const [remoteFileTypes, setRemoteFileTypes] = useState<string[]>([]);
  const [remoteFileCount, setRemoteFileCount] = useState<number | null>(null);
  const [remoteTotalSize, setRemoteTotalSize] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedState, setCopiedState] = useState<'idle' | 'doi' | 'cite'>('idle');
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
  const [versionHistoryOpen, setVersionHistoryOpen] = useState(false);
  const [versionHistoryLoading, setVersionHistoryLoading] = useState(false);
  const [versionHistoryError, setVersionHistoryError] = useState<string | null>(null);
  const [versionEntries, setVersionEntries] = useState<DataOneVersionEntry[]>([]);
  const [loadingVersionId, setLoadingVersionId] = useState<string | null>(null);

  const { viewRef, showToast, openDataOnePreview } = useMap();
  const lastPannedDatasetIdRef = useRef<string | null>(null);

  // Auto-pan/zoom when opening dataset detail (CON-DONE-02)
  // After camera settles, open popup on the map feature for native ArcGIS highlight.
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    if (lastPannedDatasetIdRef.current === dataset.dataoneId) return;

    let cancelled = false;

    const centerLon = dataset.centerLon;
    const centerLat = dataset.centerLat;
    if (Number.isFinite(centerLon) && Number.isFinite(centerLat)) {
      lastPannedDatasetIdRef.current = dataset.dataoneId;
      void goToMarkerWithSmartZoom({
        view,
        longitude: centerLon as number,
        latitude: centerLat as number,
        duration: 800,
        defaultZoomLevel: 16,
      })
        .then(() => {
          if (!cancelled) return openPopupForDataoneFeature(view, dataset.dataoneId);
          return undefined;
        })
        .catch(() => {});
      return;
    }

    const bounds = details?.spatialCoverage;
    if (bounds && bounds.west != null && bounds.south != null && bounds.east != null && bounds.north != null) {
      lastPannedDatasetIdRef.current = dataset.dataoneId;
      const extent = new Extent({
        xmin: bounds.west,
        ymin: bounds.south,
        xmax: bounds.east,
        ymax: bounds.north,
        spatialReference: { wkid: 4326 },
      });
      void view
        .goTo(extent.expand(1.2), { duration: 800 })
        .then(() => {
          if (!cancelled) return openPopupForDataoneFeature(view, dataset.dataoneId);
          return undefined;
        })
        .catch(() => {});
    }

    return () => {
      cancelled = true;
    };
  }, [dataset.dataoneId, dataset.centerLon, dataset.centerLat, details, viewRef]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setFileInfoError(null);
    setRemoteFileTypes([]);
    setRemoteFileCount(null);
    setRemoteTotalSize(null);
    setSaveFeedback(null);

    void dataOneService
      .getDatasetDetails(dataset.dataoneId)
      .then((value) => {
        if (!cancelled) setDetails(value);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load dataset details');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    void dataOneService
      .getFileInfo(dataset.dataoneId)
      .then((fileInfo) => {
        if (cancelled) return;
        if (fileInfo.error) {
          setFileInfoError(fileInfo.error);
          return;
        }
        setRemoteFileTypes(fileInfo.fileTypes);
        setRemoteFileCount(fileInfo.fileCount);
        setRemoteTotalSize(fileInfo.totalSize);
      })
      .catch((err) => {
        if (!cancelled) {
          setFileInfoError(err instanceof Error ? err.message : 'Unable to load file types');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [dataset.dataoneId]);

  useEffect(() => {
    setVersionHistoryOpen(false);
    setVersionHistoryLoading(false);
    setVersionHistoryError(null);
    setVersionEntries([]);
    setLoadingVersionId(null);
  }, [dataset.dataoneId]);

  useEffect(() => {
    if (copiedState === 'idle') return;
    const timer = window.setTimeout(() => setCopiedState('idle'), 2000);
    return () => window.clearTimeout(timer);
  }, [copiedState]);

  useEffect(() => {
    if (!saveFeedback) return;
    const timer = window.setTimeout(() => setSaveFeedback(null), 3000);
    return () => window.clearTimeout(timer);
  }, [saveFeedback]);

  const openDataOneUrl = useMemo(() => buildDataOneUrl(dataset, details), [dataset, details]);
  const doi = useMemo(() => extractDoi(dataset.dataoneId), [dataset.dataoneId]);
  const citationText = useMemo(() => buildCitation(dataset, details), [dataset, details]);

  const handleSaveOrUnsave = () => {
    if (isDatasetSaved) {
      onUnsaveDatasetView?.();
      setSaveFeedback('Unsaved. Showing all results for current filters.');
    } else {
      const feedback = onSaveDatasetView?.(dataset);
      setSaveFeedback(feedback || 'Saved view in Map Layers.');
    }
  };

  const handleCopyDoi = async () => {
    const text = doi || dataset.dataoneId;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedState('doi');
    } catch {
      showToast('Unable to copy DOI', 'warning');
    }
  };

  const handleCopyCitation = async () => {
    try {
      await navigator.clipboard.writeText(citationText);
      setCopiedState('cite');
    } catch {
      showToast('Unable to copy citation', 'warning');
    }
  };

  const handleOpenInNewTab = () => {
    if (!openDataOneUrl) return;
    window.open(openDataOneUrl, '_blank', 'noopener,noreferrer');
  };

  const handleOpenInApp = () => {
    if (!openDataOneUrl) return;
    openDataOnePreview(openDataOneUrl, dataset.title);
  };

  const handleRecenter = async () => {
    const view = viewRef.current;
    if (!view) return;

    const centerLon = dataset.centerLon;
    const centerLat = dataset.centerLat;

    if (Number.isFinite(centerLon) && Number.isFinite(centerLat)) {
      try {
        await goToMarkerWithSmartZoom({
          view,
          longitude: centerLon as number,
          latitude: centerLat as number,
          duration: 800,
          defaultZoomLevel: 16,
        });
        await openPopupForDataoneFeature(view, dataset.dataoneId);
        showToast('Centered map on dataset location', 'info');
      } catch {
        showToast('Could not focus map on dataset', 'warning');
      }
      return;
    }

    const bounds = details?.spatialCoverage;
    if (bounds && bounds.west != null && bounds.south != null && bounds.east != null && bounds.north != null) {
      try {
        const extent = new Extent({
          xmin: bounds.west,
          ymin: bounds.south,
          xmax: bounds.east,
          ymax: bounds.north,
          spatialReference: { wkid: 4326 },
        });
        await view.goTo(extent.expand(1.2), { duration: 800 });
        await openPopupForDataoneFeature(view, dataset.dataoneId);
        showToast('Centered map on dataset spatial extent', 'info');
      } catch {
        showToast('Could not focus map on dataset extent', 'warning');
      }
      return;
    }

    showToast('No spatial coordinates available for this dataset', 'warning');
  };

  const toggleVersionHistory = async () => {
    if (versionHistoryOpen) {
      setVersionHistoryOpen(false);
      return;
    }

    setVersionHistoryOpen(true);
    if (versionEntries.length > 0 || versionHistoryLoading) return;

    try {
      setVersionHistoryLoading(true);
      setVersionHistoryError(null);
      const versions = await dataOneService.queryVersionHistory(dataset.seriesId);
      setVersionEntries(versions);
    } catch (err) {
      setVersionHistoryError(err instanceof Error ? err.message : 'Failed to load version history');
    } finally {
      setVersionHistoryLoading(false);
    }
  };

  const handleSelectVersion = async (version: DataOneVersionEntry) => {
    if (version.dataoneId === dataset.dataoneId) return;
    try {
      setLoadingVersionId(version.dataoneId);
      const nextVersion = await dataOneService.getVersionDetails(version.dataoneId);
      if (nextVersion) {
        onVersionSelect?.(nextVersion);
      }
    } finally {
      setLoadingVersionId(null);
    }
  };

  return {
    citationText,
    copiedState,
    details,
    doi,
    error,
    fileInfoError,
    handleCopyCitation,
    handleCopyDoi,
    handleOpenInApp,
    handleOpenInNewTab,
    handleRecenter,
    handleSaveOrUnsave,
    handleSelectVersion,
    loading,
    loadingVersionId,
    openDataOneUrl,
    remoteFileCount,
    remoteFileTypes,
    remoteTotalSize,
    saveFeedback,
    toggleVersionHistory,
    versionEntries,
    versionHistoryError,
    versionHistoryLoading,
    versionHistoryOpen,
  };
}
