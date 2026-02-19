import { ExternalLink, MapPin, Database } from 'lucide-react';
import type { GBIFOccurrence } from '../../../../services/gbifService';

interface GBIFOccurrenceCardProps {
  occurrence: GBIFOccurrence;
  onViewDetail: () => void;
  onViewOnMap: () => void;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Unknown date';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function basisBadgeClass(basisOfRecord: string | null): string {
  if (!basisOfRecord) return 'bg-gray-100 text-gray-700 border-gray-200';
  if (basisOfRecord.includes('HUMAN_OBSERVATION')) return 'bg-sky-50 text-sky-700 border-sky-200';
  if (basisOfRecord.includes('PRESERVED_SPECIMEN') || basisOfRecord.includes('FOSSIL_SPECIMEN')) {
    return 'bg-amber-50 text-amber-700 border-amber-200';
  }
  return 'bg-slate-50 text-slate-700 border-slate-200';
}

export function GBIFOccurrenceCard({ occurrence, onViewDetail, onViewOnMap }: GBIFOccurrenceCardProps) {
  const displayName = occurrence.species || occurrence.scientificName || 'Unknown taxon';
  const subtitle = occurrence.species && occurrence.scientificName && occurrence.species !== occurrence.scientificName
    ? occurrence.scientificName
    : occurrence.genus || occurrence.family || 'Taxonomy unavailable';
  const hasThumbnail = !!occurrence.primaryImageUrl;

  return (
    <div
      id={`gbif-occurrence-card-${occurrence.id}`}
      className="group border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer bg-white"
      onClick={onViewDetail}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => (event.key === 'Enter' || event.key === ' ') && onViewDetail()}
      aria-label={`View GBIF occurrence ${displayName}`}
    >
      <div id={`gbif-occurrence-card-content-${occurrence.id}`} className="flex gap-3 p-3">
        <div
          id={`gbif-occurrence-card-thumbnail-${occurrence.id}`}
          className="w-14 h-14 rounded-md bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0 overflow-hidden"
        >
          {hasThumbnail ? (
            <img
              src={occurrence.primaryImageUrl!}
              alt={displayName}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <Database className="w-6 h-6" />
          )}
        </div>

        <div id={`gbif-occurrence-card-info-${occurrence.id}`} className="flex-1 min-w-0 space-y-1">
          <div id={`gbif-occurrence-card-title-row-${occurrence.id}`} className="flex items-start justify-between gap-2">
            <p id={`gbif-occurrence-card-title-${occurrence.id}`} className="text-sm font-medium text-gray-900 truncate">
              {displayName}
            </p>
            <span
              id={`gbif-occurrence-card-basis-${occurrence.id}`}
              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${basisBadgeClass(occurrence.basisOfRecord)}`}
            >
              {occurrence.basisOfRecord ? occurrence.basisOfRecord.replace(/_/g, ' ') : 'Unknown'}
            </span>
          </div>
          <p id={`gbif-occurrence-card-subtitle-${occurrence.id}`} className="text-xs text-gray-500 italic truncate">
            {subtitle}
          </p>
          <p id={`gbif-occurrence-card-meta-${occurrence.id}`} className="text-xs text-gray-400 truncate">
            {formatDate(occurrence.eventDate)} &middot; {occurrence.datasetName || 'Unknown dataset'}
          </p>
        </div>
      </div>

      <div id={`gbif-occurrence-card-actions-${occurrence.id}`} className="flex items-center gap-1 px-3 pb-2.5 pt-0">
        <button
          id={`gbif-occurrence-card-view-map-${occurrence.id}`}
          onClick={(event) => {
            event.stopPropagation();
            onViewOnMap();
          }}
          className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors"
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>View</span>
        </button>
        <button
          id={`gbif-occurrence-card-open-reference-${occurrence.id}`}
          onClick={(event) => {
            event.stopPropagation();
            if (occurrence.referencesUrl) window.open(occurrence.referencesUrl, '_blank', 'noopener,noreferrer');
          }}
          disabled={!occurrence.referencesUrl}
          className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>Source</span>
        </button>
      </div>
    </div>
  );
}
