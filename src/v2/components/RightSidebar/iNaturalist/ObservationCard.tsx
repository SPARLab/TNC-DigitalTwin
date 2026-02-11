// ============================================================================
// ObservationCard — Single iNaturalist observation (photo, name, date, actions)
// Clicking the card opens the detail view. Action buttons in a row below.
// ============================================================================

import { Leaf, ExternalLink, MapPin, Bookmark } from 'lucide-react';
import type { INatObservation } from '../../../hooks/useINaturalistObservations';
import { getTaxonEmoji } from '../../Map/layers/taxonConfig';

interface ObservationCardProps {
  observation: INatObservation;
  onViewDetail: () => void;
  onViewOnMap: () => void;
  onBookmark: () => void;
}

/** Format date string to short display: "Jan 15, 2024" */
function formatDate(dateStr: string): string {
  if (!dateStr) return 'Unknown date';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

export function ObservationCard({ observation, onViewDetail, onViewOnMap, onBookmark }: ObservationCardProps) {
  const displayName = observation.commonName || observation.scientificName;
  const hasPhoto = !!observation.photoUrl;

  return (
    <div
      id={`obs-card-${observation.id}`}
      className="group border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm
                 transition-all cursor-pointer bg-white"
      onClick={onViewDetail}
      role="button"
      tabIndex={0}
      onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onViewDetail()}
      aria-label={`View ${displayName}`}
    >
      {/* Top: photo + info */}
      <div className="flex gap-3 p-3">
        {/* Thumbnail */}
        <div className="w-14 h-14 rounded-md bg-gray-100 flex-shrink-0 overflow-hidden">
          {hasPhoto ? (
            <img
              src={observation.photoUrl!}
              alt={displayName}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Leaf className="w-6 h-6 text-gray-300" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            <span className="mr-1">{getTaxonEmoji(observation.taxonCategory)}</span>
            {displayName}
          </p>
          {observation.commonName && (
            <p className="text-xs text-gray-500 italic truncate">{observation.scientificName}</p>
          )}
          <p className="text-xs text-gray-400 mt-1 truncate">
            @{observation.observer} &middot; {formatDate(observation.observedOn)}
          </p>
        </div>
      </div>

      {/* Actions row */}
      <div className="flex items-center gap-1 px-3 pb-2.5 pt-0">
        <ActionBtn
          icon={<MapPin className="w-3.5 h-3.5" />}
          label="View"
          onClick={e => { e.stopPropagation(); onViewOnMap(); }}
        />
        <ActionBtn
          icon={<Bookmark className="w-3.5 h-3.5" />}
          label="Bookmark"
          onClick={e => { e.stopPropagation(); onBookmark(); }}
        />
        <ActionBtn
          icon={<ExternalLink className="w-3.5 h-3.5" />}
          label="iNat"
          onClick={e => { e.stopPropagation(); window.open(observation.iNatUrl, '_blank'); }}
          isExternal
        />
      </div>
    </div>
  );
}

function ActionBtn({ icon, label, onClick, isExternal }: {
  icon: React.ReactNode;
  label: string;
  onClick: (e: React.MouseEvent) => void;
  isExternal?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-emerald-700
                 hover:bg-emerald-50 rounded transition-colors"
      title={isExternal ? `Open on iNaturalist` : label}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
