import { ArrowLeft, Calendar, ExternalLink, Layers, MapPinned, Package, SlidersHorizontal } from 'lucide-react';
import type { DroneImageryMetadata, DroneImageryProject } from '../../../../types/droneImagery';

interface FlightDetailViewProps {
  project: DroneImageryProject;
  flight: DroneImageryMetadata;
  isLoaded: boolean;
  opacity: number;
  onBack: () => void;
  onToggleLoaded: () => void;
  onFlyTo: () => void;
  onOpacityChange: (_value: number) => void;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export function FlightDetailView({
  project,
  flight,
  isLoaded,
  opacity,
  onBack,
  onToggleLoaded,
  onFlyTo,
  onOpacityChange,
}: FlightDetailViewProps) {
  const wmtsPortalLink = `https://dangermondpreserve-spatial.com/portal/home/item.html?id=${flight.wmts.itemId}`;

  return (
    <div id="drone-flight-detail-view" className="space-y-4">
      <button
        id="drone-flight-detail-back"
        onClick={onBack}
        className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Projects
      </button>

      <section id="drone-flight-detail-main" className="rounded-lg border border-gray-200 p-3 space-y-3">
        <div id="drone-flight-title-block">
          <p className="text-xs uppercase tracking-wide text-gray-500">Project</p>
          <p className="text-sm font-semibold text-gray-900">{project.projectName}</p>
          <p className="text-xs text-gray-600 mt-1">{flight.planName}</p>
        </div>

        <div id="drone-flight-meta-row" className="grid grid-cols-1 gap-2 text-sm">
          <div id="drone-flight-capture-date" className="flex items-center gap-2 text-gray-700">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span>Captured {formatDate(flight.dateCaptured)}</span>
          </div>
          <div id="drone-flight-layer-status" className="flex items-center gap-2 text-gray-700">
            <Layers className="w-4 h-4 text-gray-500" />
            <span>{isLoaded ? 'WMTS loaded on map' : 'WMTS not loaded'}</span>
          </div>
        </div>

        <div id="drone-flight-action-row" className="grid grid-cols-1 gap-2">
          <button
            id={`drone-flight-toggle-map-detail-${flight.id}`}
            onClick={onToggleLoaded}
            className={`w-full px-3 py-2 rounded text-sm font-medium border transition-colors ${
              isLoaded
                ? 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            {isLoaded ? 'Remove from Map' : 'Load on Map'}
          </button>
          <button
            id={`drone-flight-fly-to-${flight.id}`}
            onClick={onFlyTo}
            className="w-full px-3 py-2 rounded text-sm font-medium border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
          >
            Fly to Extent
          </button>
        </div>
      </section>

      {isLoaded && (
        <section id="drone-flight-opacity-section" className="rounded-lg border border-gray-200 p-3 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
            <SlidersHorizontal className="w-4 h-4" />
            <span>Layer Opacity</span>
          </div>
          <input
            id={`drone-flight-opacity-slider-${flight.id}`}
            type="range"
            min={0}
            max={100}
            step={5}
            value={Math.round(opacity * 100)}
            onChange={(event) => onOpacityChange(Number(event.target.value) / 100)}
            className="w-full"
          />
          <p className="text-xs text-gray-600">{Math.round(opacity * 100)}%</p>
        </section>
      )}

      <section id="drone-flight-links-section" className="rounded-lg border border-gray-200 p-3 space-y-2">
        <h3 className="text-sm font-semibold text-gray-900">Links & Downloads</h3>
        <a
          id={`drone-flight-open-portal-${flight.id}`}
          href={flight.wmts.link || wmtsPortalLink}
          target="_blank"
          rel="noreferrer"
          className="w-full inline-flex items-center justify-between gap-2 px-3 py-2 rounded border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <span className="inline-flex items-center gap-2">
            <ExternalLink className="w-4 h-4" />
            Open in Portal
          </span>
        </a>
        {flight.imageCollection && (
          <a
            id={`drone-flight-open-collection-${flight.id}`}
            href={flight.imageCollection.link}
            target="_blank"
            rel="noreferrer"
            className="w-full inline-flex items-center justify-between gap-2 px-3 py-2 rounded border border-purple-200 text-sm text-purple-700 bg-purple-50 hover:bg-purple-100 transition-colors"
          >
            <span className="inline-flex items-center gap-2">
              <Package className="w-4 h-4" />
              Open Image Collection
            </span>
          </a>
        )}
        {flight.tifUrl && (
          <a
            id={`drone-flight-download-tif-${flight.id}`}
            href={flight.tifUrl}
            target="_blank"
            rel="noreferrer"
            className="w-full inline-flex items-center justify-between gap-2 px-3 py-2 rounded border border-emerald-200 text-sm text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
          >
            <span className="inline-flex items-center gap-2">
              <MapPinned className="w-4 h-4" />
              Download Raw TIF
            </span>
          </a>
        )}
      </section>

      <section id="drone-flight-tech-section" className="rounded-lg border border-gray-200 p-3">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Metadata</h3>
        <dl id="drone-flight-tech-list" className="space-y-1.5 text-xs">
          <div id="drone-flight-meta-plan-id" className="flex items-start justify-between gap-2">
            <dt className="text-gray-500">Plan ID</dt>
            <dd className="text-gray-900 font-mono">{flight.planId}</dd>
          </div>
          <div id="drone-flight-meta-item-id" className="flex items-start justify-between gap-2">
            <dt className="text-gray-500">WMTS Item ID</dt>
            <dd className="text-gray-900 font-mono">{flight.wmts.itemId}</dd>
          </div>
          <div id="drone-flight-meta-last-updated" className="flex items-start justify-between gap-2">
            <dt className="text-gray-500">Last Updated</dt>
            <dd className="text-gray-900">{formatDate(flight.lastUpdated)}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
