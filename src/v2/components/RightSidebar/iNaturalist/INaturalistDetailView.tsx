// ============================================================================
// INaturalistDetailView — Expanded observation view with large photo + metadata
// Back button returns to the observation list preserving filter state.
// ============================================================================

import { ArrowLeft, MapPin, Bookmark, ExternalLink, Leaf, Calendar, User } from 'lucide-react';
import type { INatObservation } from '../../../hooks/useINaturalistObservations';

interface DetailViewProps {
  observation: INatObservation;
  onBack: () => void;
  onViewOnMap: () => void;
  onBookmark: () => void;
}

function formatFullDate(dateStr: string): string {
  if (!dateStr) return 'Unknown';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function INaturalistDetailView({ observation, onBack, onViewOnMap, onBookmark }: DetailViewProps) {
  const displayName = observation.commonName || observation.scientificName;
  const [lon, lat] = observation.coordinates;

  return (
    <div id="inat-detail-view" className="space-y-4">
      {/* Back button */}
      <button
        id="inat-detail-back"
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors -mt-1"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Observations
      </button>

      {/* Hero photo */}
      <div className="w-full aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden">
        {observation.photoUrl ? (
          <img
            src={observation.photoUrl}
            alt={displayName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
            <Leaf className="w-12 h-12 mb-2" />
            <span className="text-sm">No photo available</span>
          </div>
        )}
      </div>

      {/* Photo attribution */}
      {observation.photoAttribution && (
        <p className="text-xs text-gray-400 -mt-2">{observation.photoAttribution}</p>
      )}

      {/* Names */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900">{displayName}</h3>
        {observation.commonName && (
          <p className="text-sm text-gray-500 italic">{observation.scientificName}</p>
        )}
      </div>

      {/* Metadata grid */}
      <div id="inat-detail-metadata" className="bg-slate-50 rounded-lg p-4">
        <dl className="space-y-2.5 text-sm">
          <MetaRow icon={<User className="w-4 h-4" />} label="Observer" value={`@${observation.observer}`} />
          <MetaRow icon={<Calendar className="w-4 h-4" />} label="Date" value={formatFullDate(observation.observedOn)} />
          <MetaRow icon={<MapPin className="w-4 h-4" />} label="Location" value={`${lat.toFixed(4)}, ${lon.toFixed(4)}`} />
          <MetaRow icon={<Leaf className="w-4 h-4" />} label="Taxon group" value={observation.taxonCategory} />
        </dl>
      </div>

      {/* Action buttons */}
      <div id="inat-detail-actions" className="flex flex-col gap-2">
        <button
          onClick={onViewOnMap}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#2e7d32] text-white
                     text-sm font-medium rounded-lg hover:bg-[#256d29] transition-colors"
        >
          <MapPin className="w-4 h-4" /> View on Map
        </button>
        <div className="flex gap-2">
          <button
            onClick={onBookmark}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-gray-200
                       text-sm text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Bookmark className="w-4 h-4" /> Bookmark
          </button>
          <a
            href={observation.iNatUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-gray-200
                       text-sm text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ExternalLink className="w-4 h-4" /> iNat
          </a>
        </div>
      </div>
    </div>
  );
}

function MetaRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-gray-400">{icon}</span>
      <dt className="text-gray-500 w-20 flex-shrink-0">{label}</dt>
      <dd className="text-gray-900 font-medium flex-1 truncate">{value}</dd>
    </div>
  );
}
