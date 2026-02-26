// ============================================================================
// INaturalistDetailView — Expanded observation view with large photo + metadata
// Back button returns to the observation list preserving filter state.
// ============================================================================

import { useEffect, useState } from 'react';
import { ArrowLeft, MapPin, ExternalLink, Leaf, Calendar, User, ShieldAlert } from 'lucide-react';
import type { INatObservation } from '../../../hooks/useINaturalistObservations';
import {
  inaturalistTaxonStatusService,
  type INaturalistTaxonStatus,
} from '../../../../services/inaturalistTaxonStatusService';

interface DetailViewProps {
  observation: INatObservation;
  onBack: () => void;
  onViewOnMap: () => void;
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

export function INaturalistDetailView({ observation, onBack, onViewOnMap }: DetailViewProps) {
  const displayName = observation.commonName || observation.scientificName;
  const [lon, lat] = observation.coordinates;
  const [taxonStatus, setTaxonStatus] = useState<INaturalistTaxonStatus | null>(null);
  const [isTaxonStatusLoading, setIsTaxonStatusLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (!observation.taxonId) {
      setTaxonStatus(null);
      return;
    }

    setIsTaxonStatusLoading(true);
    void inaturalistTaxonStatusService.getTaxonStatus(observation.taxonId)
      .then((status) => {
        if (!cancelled) setTaxonStatus(status);
      })
      .finally(() => {
        if (!cancelled) setIsTaxonStatusLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [observation.taxonId]);

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
      <div id="inat-detail-name-block">
        <div id="inat-detail-name-row" className="flex items-center gap-2">
          <h3 id="inat-detail-primary-name" className="text-lg font-semibold text-gray-900">{displayName}</h3>
          <ConservationBadge taxonStatus={taxonStatus} isLoading={isTaxonStatusLoading} />
        </div>
        {observation.commonName && (
          <p id="inat-detail-scientific-name" className="text-sm text-gray-500 italic">{observation.scientificName}</p>
        )}
      </div>

      {/* Metadata grid */}
      <div id="inat-detail-metadata" className="bg-slate-50 rounded-lg p-4">
        <dl className="space-y-2.5 text-sm">
          <MetaRow icon={<User className="w-4 h-4" />} label="Observer" value={`@${observation.observer}`} />
          <MetaRow icon={<Calendar className="w-4 h-4" />} label="Date" value={formatFullDate(observation.observedOn)} />
          <MetaRow icon={<MapPin className="w-4 h-4" />} label="Location" value={`${lat.toFixed(4)}, ${lon.toFixed(4)}`} />
          <MetaRow icon={<Leaf className="w-4 h-4" />} label="Taxon group" value={observation.taxonCategory} />
          <MetaRow
            icon={<ShieldAlert className="w-4 h-4" />}
            label="Conservation"
            value={
              isTaxonStatusLoading
                ? 'Checking iNaturalist status...'
                : taxonStatus?.badgeCode
                  ? `${taxonStatus.badgeCode} · ${getBadgeMeaning(taxonStatus.badgeCode)}`
                  : taxonStatus?.coordinatesMayBeObscured
                    ? 'Sensitive location controls active'
                    : 'No sensitive-location flag on taxon'
            }
          />
        </dl>
        {!isTaxonStatusLoading && taxonStatus?.statusLabel && (
          <p id="inat-detail-conservation-source" className="mt-2 text-xs text-gray-500">
            Source status: {taxonStatus.statusLabel}{taxonStatus.authority ? ` • ${taxonStatus.authority}` : ''}
          </p>
        )}
      </div>

      {taxonStatus?.coordinatesMayBeObscured && (
        <div
          id="inat-detail-coordinate-obscured-notice"
          className="rounded-lg border border-amber-200 bg-amber-50 p-3"
        >
          <p id="inat-detail-coordinate-obscured-message" className="text-sm text-amber-900">
            This map point is approximate. iNaturalist can obscure exact coordinates for sensitive species, so the
            observation was likely made somewhere nearby, not at this exact icon location.
          </p>
        </div>
      )}

      {/* Action buttons */}
      <div id="inat-detail-actions" className="flex flex-col gap-2">
        <button
          onClick={onViewOnMap}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#2e7d32] text-white
                     text-sm font-medium rounded-lg hover:bg-[#256d29] transition-colors"
        >
          <MapPin className="w-4 h-4" /> View on Map
        </button>
        <a
          href={observation.iNatUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2 py-2.5 border border-gray-200
                     text-sm text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <ExternalLink className="w-4 h-4" /> Open on iNaturalist
        </a>
      </div>
    </div>
  );
}

function ConservationBadge({
  taxonStatus,
  isLoading,
}: {
  taxonStatus: INaturalistTaxonStatus | null;
  isLoading: boolean;
}) {
  if (isLoading) return null;
  if (!taxonStatus?.badgeCode) return null;

  const palette = getBadgePalette(taxonStatus.badgeCode);
  return (
    <span
      id="inat-detail-conservation-badge"
      className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${palette}`}
      title={`Conservation status: ${taxonStatus.badgeCode} (${getBadgeMeaning(taxonStatus.badgeCode)})`}
      aria-label={`Conservation status ${taxonStatus.badgeCode}`}
    >
      {taxonStatus.badgeCode}
    </span>
  );
}

function getBadgeMeaning(code: NonNullable<INaturalistTaxonStatus['badgeCode']>): string {
  switch (code) {
    case 'CR': return 'Critically Endangered';
    case 'EN': return 'Endangered';
    case 'VU': return 'Vulnerable';
    case 'NT': return 'Near Threatened';
    case 'LC': return 'Least Concern';
    case 'DD': return 'Data Deficient';
    case 'NE': return 'Not Evaluated';
    default: return code;
  }
}

function getBadgePalette(code: NonNullable<INaturalistTaxonStatus['badgeCode']>): string {
  if (code === 'CR' || code === 'EN') return 'bg-red-100 text-red-700 border border-red-200';
  if (code === 'VU' || code === 'NT') return 'bg-amber-100 text-amber-700 border border-amber-200';
  return 'bg-gray-100 text-gray-700 border border-gray-200';
}

function MetaRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div id={`inat-detail-meta-row-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`} className="flex items-center gap-3">
      <span id={`inat-detail-meta-icon-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`} className="text-gray-400">{icon}</span>
      <dt id={`inat-detail-meta-label-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`} className="text-gray-500 w-24 flex-shrink-0">{label}</dt>
      <dd id={`inat-detail-meta-value-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`} className="text-gray-900 font-medium flex-1 truncate">{value}</dd>
    </div>
  );
}
