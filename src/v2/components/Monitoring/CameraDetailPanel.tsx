// ============================================================================
// CameraDetailPanel — latest-frame preview for the selected ALERTCalifornia
// camera, plus a list of the other cameras currently on the map.
// ============================================================================

import { useEffect, useState } from 'react';
import { Camera, ExternalLink, RefreshCw, Signal } from 'lucide-react';
import {
  describeCameraTime,
  withImageCacheBust,
  type CameraSnapshot,
} from '../../services/cameraService';
import { formatStationDisplayName } from '../../services/dendraStationService';

function formatRelativeTime(epochMs: number): string {
  const seconds = Math.round((Date.now() - epochMs) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
}

interface CameraDetailPanelProps {
  snapshot: CameraSnapshot;
  selectedObjectId: number | null;
  onSelect: (objectId: number) => void;
  isLoading: boolean;
  fetchedAt: number | null;
  onRefresh: () => void;
}

export function CameraDetailPanel({
  snapshot,
  selectedObjectId,
  onSelect,
  isLoading,
  fetchedAt,
  onRefresh,
}: CameraDetailPanelProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const selected = snapshot.cameras.find((camera) => camera.objectId === selectedObjectId) ?? null;
  const onlineCount = snapshot.cameras.filter((camera) => camera.isOnline).length;
  const cacheKey = fetchedAt ?? 0;
  const imageUrl = selected?.imageUrl ? withImageCacheBust(selected.imageUrl, cacheKey) : null;

  useEffect(() => {
    setImageFailed(false);
  }, [selectedObjectId, cacheKey]);

  return (
    <section id="monitoring-camera-panel" className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Camera className="h-3.5 w-3.5 text-gray-500" />
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-600">
              Live Cameras
            </h3>
          </div>
          <p className="mt-1 text-[11px] text-gray-500">
            {onlineCount} of {snapshot.cameras.length} online
            {fetchedAt !== null && ` · checked ${formatRelativeTime(fetchedAt)}`}
          </p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          aria-label="Refresh camera frames"
          className="flex-shrink-0 rounded p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {selected && (
        <div className="overflow-hidden rounded-card border border-gray-200 bg-gray-900">
          {imageUrl && !imageFailed ? (
            <img
              key={imageUrl}
              src={imageUrl}
              alt={`Latest frame from ${formatStationDisplayName(selected.cameraName)}`}
              className="max-h-56 w-full object-cover"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <div className="flex h-36 items-center justify-center px-4 text-center text-[11px] text-gray-400">
              {imageFailed ? 'Could not load this frame.' : 'No latest frame is published for this camera.'}
            </div>
          )}

          <div className="border-t border-gray-800 bg-gray-950 px-3 py-2">
            <p className="truncate text-xs font-semibold text-white">
              {formatStationDisplayName(selected.cameraName)}
            </p>
            <p className="mt-0.5 text-[11px] text-gray-400">
              {selected.isOnline ? 'Online' : 'Offline'} · {describeCameraTime(selected)}
            </p>
            {selected.cameraUrl && (
              <a
                href={selected.cameraUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 hover:text-emerald-300"
              >
                Open on ALERTCalifornia
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
      )}

      {!selected && (
        <p className="text-[11px] leading-relaxed text-gray-500">
          Click a camera on the map to preview its latest frame.
        </p>
      )}

      <ul className="flex flex-col gap-1">
        {snapshot.cameras.map((camera) => {
          const isActive = camera.objectId === selectedObjectId;
          return (
            <li key={camera.objectId}>
              <button
                type="button"
                onClick={() => onSelect(camera.objectId)}
                aria-pressed={isActive}
                className={`flex w-full items-center gap-2 rounded-card border px-2.5 py-2 text-left transition-colors ${
                  isActive
                    ? 'border-emerald-300 bg-emerald-50'
                    : 'border-gray-200 bg-white hover:bg-gray-50'
                }`}
              >
                <Signal
                  className={`h-3 w-3 flex-shrink-0 ${
                    camera.isOnline ? 'text-emerald-600' : 'text-gray-400'
                  }`}
                />
                <span className="min-w-0 flex-1">
                  <span
                    className={`block truncate text-xs ${
                      isActive ? 'font-semibold text-emerald-900' : 'font-medium text-gray-800'
                    }`}
                  >
                    {formatStationDisplayName(camera.cameraName)}
                  </span>
                  <span className="block truncate text-[10px] text-gray-500">
                    {describeCameraTime(camera)}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
