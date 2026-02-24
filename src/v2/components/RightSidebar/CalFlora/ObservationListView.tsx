import { Calendar, Camera, MapPin } from 'lucide-react';
import type { CalFloraObservation } from '../../../../services/calfloraV2Service';

interface ObservationListViewProps {
  observations: CalFloraObservation[];
  onOpenDetail: (_observation: CalFloraObservation) => void;
  onViewOnMap: (_observation: CalFloraObservation) => void;
}

export function ObservationListView({ observations, onOpenDetail, onViewOnMap }: ObservationListViewProps) {
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
              <button
                id={`calflora-observation-view-map-${observation.objectId}`}
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onViewOnMap(observation);
                }}
                className="rounded-md border border-gray-200 px-2 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-100"
              >
                View on map
              </button>
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
