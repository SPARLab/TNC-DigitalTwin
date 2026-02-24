import { ArrowLeft, ExternalLink, MapPin, User } from 'lucide-react';
import type { CalFloraObservation } from '../../../../services/calfloraV2Service';

interface ObservationDetailViewProps {
  observation: CalFloraObservation;
  onBack: () => void;
  onViewOnMap: (_observation: CalFloraObservation) => void;
  onSaveView: (observation: CalFloraObservation) => string;
}

function externalLinkForObservation(observation: CalFloraObservation): string | null {
  if (!observation.calfloraId) return null;
  return `https://www.calflora.org/occ/entry/${encodeURIComponent(observation.calfloraId)}.html`;
}

export function ObservationDetailView({ observation, onBack, onViewOnMap, onSaveView }: ObservationDetailViewProps) {
  const externalLink = externalLinkForObservation(observation);

  return (
    <div id={`calflora-observation-detail-${observation.objectId}`} className="space-y-4">
      <button
        id="calflora-observation-back-button"
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 hover:text-emerald-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to observations
      </button>

      <div id="calflora-observation-detail-header" className="rounded-lg border border-gray-200 bg-white p-4">
        <h3 id="calflora-observation-detail-title" className="text-lg font-semibold text-gray-900">
          {observation.plant}
        </h3>
        <p id="calflora-observation-detail-subtitle" className="mt-1 text-sm text-gray-500">
          Observation #{observation.objectId}
        </p>

        <div id="calflora-observation-detail-actions" className="mt-3 flex flex-wrap items-center gap-2">
          <button
            id="calflora-observation-detail-save-view-button"
            type="button"
            onClick={() => onSaveView(observation)}
            className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            Save View
          </button>
          <button
            id="calflora-observation-detail-view-on-map-button"
            type="button"
            onClick={() => onViewOnMap(observation)}
            className="inline-flex items-center gap-1.5 rounded-md bg-emerald-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-800"
          >
            <MapPin className="h-3.5 w-3.5" />
            View on map
          </button>
          {externalLink && (
            <a
              id="calflora-observation-detail-external-link"
              href={externalLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open in CalFlora
            </a>
          )}
        </div>
      </div>

      {observation.photoUrl && (
        <div id="calflora-observation-photo-panel" className="rounded-lg border border-gray-200 bg-white p-3">
          <img
            id="calflora-observation-photo-image"
            src={observation.photoUrl}
            alt={observation.plant}
            className="w-full rounded-md"
            loading="lazy"
          />
        </div>
      )}

      <div id="calflora-observation-detail-metadata" className="rounded-lg border border-gray-200 bg-white p-4">
        <dl id="calflora-observation-detail-metadata-list" className="space-y-2 text-sm">
          <MetaRow label="County" value={observation.county || 'Unknown'} />
          <MetaRow label="Observation date" value={observation.observationDate || 'Unknown'} />
          <MetaRow label="Observer" value={observation.observer || 'Unknown'} />
          <MetaRow label="Elevation" value={observation.elevation || 'Unknown'} />
          <MetaRow label="Location quality" value={observation.locationQuality || 'Unknown'} />
          <MetaRow label="Associated species" value={observation.associatedSpecies || '—'} />
          <MetaRow label="Habitat" value={observation.habitat || '—'} />
          <MetaRow label="Citation" value={observation.citation || '—'} />
          {observation.coordinates && (
            <MetaRow
              label="Coordinates"
              value={`${observation.coordinates[1].toFixed(6)}, ${observation.coordinates[0].toFixed(6)}`}
            />
          )}
        </dl>
      </div>

      {observation.notes && (
        <div id="calflora-observation-notes-panel" className="rounded-lg border border-gray-200 bg-white p-4">
          <p id="calflora-observation-notes-label" className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Notes
          </p>
          <p id="calflora-observation-notes-value" className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">
            {observation.notes}
          </p>
        </div>
      )}

      {!observation.observer && (
        <div id="calflora-observation-detail-info-banner" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          <p id="calflora-observation-detail-info-banner-text" className="inline-flex items-center gap-1.5">
            <User className="h-3.5 w-3.5" />
            Some historical records have limited metadata fields.
          </p>
        </div>
      )}
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-2">
      <dt className="text-gray-500">{label}</dt>
      <dd className="text-gray-800">{value}</dd>
    </div>
  );
}
