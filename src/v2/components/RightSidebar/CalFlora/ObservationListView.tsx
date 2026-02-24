import { Calendar, Camera, MapPin } from 'lucide-react';
import type { CalFloraObservation } from '../../../../services/calfloraV2Service';

interface ObservationListViewProps {
  observations: CalFloraObservation[];
  onOpenDetail: (_observation: CalFloraObservation) => void;
}

export function ObservationListView({ observations, onOpenDetail }: ObservationListViewProps) {
  return (
    <div id="calflora-observation-list" className="space-y-2">
      {observations.map((observation) => (
        <button
          id={`calflora-observation-card-${observation.objectId}`}
          key={observation.objectId}
          type="button"
          onClick={() => onOpenDetail(observation)}
          className="w-full text-left rounded-lg border border-gray-200 bg-white p-3 hover:bg-gray-50 transition-colors"
        >
          {observation.photoUrl && (
            <div id={`calflora-observation-photo-wrap-${observation.objectId}`} className="mb-3 overflow-hidden rounded-md border border-gray-100">
              <img
                id={`calflora-observation-photo-image-${observation.objectId}`}
                src={observation.photoUrl}
                alt={`${observation.plant} observation`}
                loading="lazy"
                className="h-32 w-full object-cover"
              />
            </div>
          )}

          <div id={`calflora-observation-card-header-${observation.objectId}`} className="flex items-start justify-between gap-3">
            <div id={`calflora-observation-title-wrap-${observation.objectId}`} className="min-w-0">
              <h4 id={`calflora-observation-title-${observation.objectId}`} className="text-sm font-semibold text-gray-900 truncate">
                {observation.plant}
              </h4>
              <p id={`calflora-observation-subtitle-${observation.objectId}`} className="text-xs text-gray-500 mt-0.5">
                Record #{observation.objectId}
              </p>
            </div>
            <div id={`calflora-observation-card-actions-${observation.objectId}`} className="flex items-center gap-2">
              {observation.photoUrl && (
                <span
                  id={`calflora-observation-photo-tag-${observation.objectId}`}
                  className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700"
                >
                  <Camera className="h-3 w-3" />
                  Photo
                </span>
              )}
            </div>
          </div>

          <div id={`calflora-observation-meta-${observation.objectId}`} className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-gray-600">
            <div id={`calflora-observation-county-${observation.objectId}`} className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-gray-400" />
              <span>{observation.county || 'County unknown'}</span>
            </div>
            <div id={`calflora-observation-date-${observation.objectId}`} className="inline-flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-gray-400" />
              <span>{observation.observationDate || 'Date unknown'}</span>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
