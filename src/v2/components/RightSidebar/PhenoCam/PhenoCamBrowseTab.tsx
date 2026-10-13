// ============================================================================
// PhenoCamBrowseTab — Select a camera + date range, then browse archive images.
// ============================================================================

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Camera, ImageIcon, Loader2 } from 'lucide-react';
import { usePhenoCam } from '../../../context/PhenoCamContext';
import { useLayers } from '../../../context/LayerContext';
import {
  countPhenoImages,
  fetchPhenoImages,
  formatPhenoTimestamp,
  type PhenoImage,
} from '../../../services/phenocamService';
import { DateFilterSection } from '../ANiML/DateFilterSection';

const PAGE_SIZE = 24;

export function PhenoCamBrowseTab() {
  const {
    cameras,
    dataLoaded,
    loading: cacheLoading,
    warmCache,
    serviceUrl,
    selectedCameraId,
    setSelectedCameraId,
    startDate,
    endDate,
    setDateRange,
    clearDateRange,
  } = usePhenoCam();
  const { activeLayer } = useLayers();

  const [images, setImages] = useState<PhenoImage[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [imgLoading, setImgLoading] = useState(false);
  const [imgError, setImgError] = useState<string | null>(null);
  const [expandedUrl, setExpandedUrl] = useState<string | null>(null);

  useEffect(() => {
    warmCache();
  }, [warmCache]);

  // Map click / activateLayer(featureId) hydrates the selected camera once.
  useEffect(() => {
    if (activeLayer?.dataSource !== 'phenocam') return;
    if (activeLayer.featureId == null) return;
    const cameraId = Number(activeLayer.featureId);
    if (!Number.isFinite(cameraId)) return;
    setSelectedCameraId(cameraId);
  }, [activeLayer?.dataSource, activeLayer?.featureId, setSelectedCameraId]);

  const selectedCamera = useMemo(
    () => cameras.find((camera) => camera.id === selectedCameraId) ?? null,
    [cameras, selectedCameraId],
  );

  const loadImages = useCallback(async (nextPage: number) => {
    if (!selectedCameraId) {
      setImages([]);
      setTotalCount(0);
      return;
    }

    setImgLoading(true);
    setImgError(null);
    try {
      const query = {
        cameraId: selectedCameraId,
        startDate,
        endDate,
        resultOffset: nextPage * PAGE_SIZE,
        resultRecordCount: PAGE_SIZE,
      };
      const [rows, count] = await Promise.all([
        fetchPhenoImages(serviceUrl, query),
        countPhenoImages(serviceUrl, query),
      ]);
      setImages(rows);
      setTotalCount(count);
      setPage(nextPage);
    } catch (error) {
      setImgError(error instanceof Error ? error.message : 'Failed to load images');
      setImages([]);
      setTotalCount(0);
    } finally {
      setImgLoading(false);
    }
  }, [selectedCameraId, startDate, endDate, serviceUrl]);

  useEffect(() => {
    if (!dataLoaded) return;
    void loadImages(0);
  }, [dataLoaded, loadImages]);

  const pageCount = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const canPrev = page > 0;
  const canNext = page + 1 < pageCount;

  return (
    <div id="phenocam-browse-tab" className="space-y-4">
      <div className="rounded-lg border border-gray-200 bg-slate-50 p-3">
        <label htmlFor="phenocam-camera-select" className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
          <Camera className="h-3.5 w-3.5" aria-hidden="true" />
          Camera
        </label>
        <select
          id="phenocam-camera-select"
          value={selectedCameraId ?? ''}
          onChange={(event) => {
            const value = event.target.value;
            setSelectedCameraId(value ? Number(value) : null);
          }}
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        >
          <option value="">Select a camera…</option>
          {cameras.map((camera) => (
            <option key={camera.id} value={camera.id}>
              {camera.siteLabel}
              {camera.imageCount ? ` (${camera.imageCount.toLocaleString()} images)` : ''}
            </option>
          ))}
        </select>
        {(cacheLoading || !dataLoaded) && (
          <p className="mt-2 text-[11px] text-gray-500">Loading cameras…</p>
        )}
      </div>

      <DateFilterSection
        id="phenocam-date-filter"
        startDate={startDate}
        endDate={endDate}
        onDateChange={setDateRange}
        onClear={clearDateRange}
        defaultExpanded
      />

      {!selectedCameraId && (
        <p className="rounded-lg border border-dashed border-gray-300 bg-white px-3 py-6 text-center text-sm text-gray-500">
          Choose a camera to browse its timestamped PhenoCam archive.
        </p>
      )}

      {selectedCameraId && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-gray-900">
              {selectedCamera?.siteLabel ?? 'Camera'}
            </p>
            <p className="text-xs text-gray-500">
              {imgLoading ? 'Loading…' : `${totalCount.toLocaleString()} images`}
            </p>
          </div>

          {imgError && (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {imgError}
            </p>
          )}

          {imgLoading && images.length === 0 && (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Loading images…
            </div>
          )}

          {!imgLoading && !imgError && images.length === 0 && (
            <p className="rounded-lg border border-dashed border-gray-300 bg-white px-3 py-6 text-center text-sm text-gray-500">
              No images for this camera
              {startDate || endDate ? ' in the selected date range' : ''}.
            </p>
          )}

          <ul id="phenocam-image-grid" className="grid grid-cols-2 gap-2">
            {images.map((image) => (
              <li key={image.id}>
                <button
                  type="button"
                  id={`phenocam-image-${image.id}`}
                  onClick={() => setExpandedUrl(image.imageUrl)}
                  className="group w-full overflow-hidden rounded-md border border-gray-200 bg-white text-left transition hover:border-emerald-400"
                >
                  <img
                    src={image.imageUrl}
                    alt={`PhenoCam image from ${image.siteLabel} at ${formatPhenoTimestamp(image.timestampLocal ?? image.timestampUtc)}`}
                    className="h-24 w-full object-cover bg-gray-100"
                    loading="lazy"
                  />
                  <span className="block truncate px-2 py-1.5 text-[10px] text-gray-600 group-hover:text-gray-900">
                    {formatPhenoTimestamp(image.timestampLocal ?? image.timestampUtc)}
                  </span>
                </button>
              </li>
            ))}
          </ul>

          {totalCount > PAGE_SIZE && (
            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                type="button"
                disabled={!canPrev || imgLoading}
                onClick={() => void loadImages(page - 1)}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-[11px] text-gray-500">
                Page {page + 1} of {pageCount}
              </span>
              <button
                type="button"
                disabled={!canNext || imgLoading}
                onClick={() => void loadImages(page + 1)}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {expandedUrl && (
        <div
          id="phenocam-expanded-image"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Expanded PhenoCam image"
          onClick={() => setExpandedUrl(null)}
        >
          <button
            type="button"
            className="absolute right-4 top-4 rounded-md bg-white/90 px-3 py-1.5 text-sm font-medium text-gray-900"
            onClick={() => setExpandedUrl(null)}
          >
            Close
          </button>
          <img
            src={expandedUrl}
            alt="Expanded PhenoCam image"
            className="max-h-[85vh] max-w-[95vw] rounded-lg object-contain shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}

      {selectedCameraId && !imgLoading && images.length > 0 && (
        <p className="flex items-center gap-1.5 text-[11px] text-gray-500">
          <ImageIcon className="h-3.5 w-3.5" aria-hidden="true" />
          Click an image to expand. Imagery © PhenoCam Network (CC BY 4.0).
        </p>
      )}
    </div>
  );
}
