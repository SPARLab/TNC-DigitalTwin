import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Calendar, ExternalLink, MapPin, User, Database, Save } from 'lucide-react';
import { gbifService, type GBIFOccurrence } from '../../../../services/gbifService';

interface GBIFOccurrenceDetailViewProps {
  occurrence: GBIFOccurrence;
  onBack: () => void;
  onViewOnMap: () => void;
  onSaveView?: (occurrence: GBIFOccurrence) => string | void;
}

function formatFullDate(dateStr: string | null): string {
  if (!dateStr) return 'Unknown';
  const parsed = new Date(dateStr);
  if (Number.isNaN(parsed.getTime())) return dateStr;
  return parsed.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function parseIssuesCount(issuesJson: string | null): number {
  if (!issuesJson) return 0;
  try {
    const parsed = JSON.parse(issuesJson);
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
}

export function GBIFOccurrenceDetailView({
  occurrence,
  onBack,
  onViewOnMap,
  onSaveView,
}: GBIFOccurrenceDetailViewProps) {
  const displayName = occurrence.species || occurrence.scientificName || 'Unknown taxon';
  const locationLabel = occurrence.coordinates
    ? `${occurrence.coordinates[1].toFixed(4)}, ${occurrence.coordinates[0].toFixed(4)}`
    : 'Coordinates unavailable';
  const issuesCount = parseIssuesCount(occurrence.issuesJson);
  const [fallbackMediaUrls, setFallbackMediaUrls] = useState<string[]>([]);
  const [fallbackMediaLoading, setFallbackMediaLoading] = useState(false);
  const [heroMediaUrl, setHeroMediaUrl] = useState<string | null>(occurrence.mediaUrls[0] ?? occurrence.primaryImageUrl);
  const [viewSaved, setViewSaved] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    const run = async () => {
      if (occurrence.mediaUrls.length > 0 || occurrence.primaryImageUrl || !occurrence.gbifKey) {
        setFallbackMediaUrls([]);
        return;
      }

      setFallbackMediaLoading(true);
      try {
        const urls = await gbifService.getMediaUrlsByGbifKey(occurrence.gbifKey, controller.signal);
        if (!cancelled) setFallbackMediaUrls(urls);
      } catch {
        if (!cancelled) setFallbackMediaUrls([]);
      } finally {
        if (!cancelled) setFallbackMediaLoading(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [occurrence.id, occurrence.gbifKey, occurrence.primaryImageUrl, occurrence.mediaUrls]);

  const mediaUrls = useMemo(() => {
    const combined = [...occurrence.mediaUrls, occurrence.primaryImageUrl, ...fallbackMediaUrls].filter(
      (value): value is string => typeof value === 'string' && value.trim().length > 0,
    );
    return Array.from(new Set(combined));
  }, [occurrence.mediaUrls, occurrence.primaryImageUrl, fallbackMediaUrls]);
  const mediaJsonDebugLabel = useMemo(() => {
    const raw = occurrence.mediaJson;
    if (!raw) return 'null';
    const trimmed = raw.trim();
    if (!trimmed) return 'empty string';
    if (trimmed === '[]') return 'empty array []';
    try {
      const parsed = JSON.parse(trimmed);
      if (!Array.isArray(parsed)) return 'non-array JSON';
      return `array(${parsed.length})`;
    } catch {
      return 'invalid JSON';
    }
  }, [occurrence.mediaJson]);
  const showDevDebugPanel = import.meta.env.DEV;

  useEffect(() => {
    setHeroMediaUrl(mediaUrls[0] ?? null);
  }, [mediaUrls, occurrence.id]);

  useEffect(() => {
    setViewSaved(false);
    setSaveFeedback(null);
  }, [occurrence.id]);

  return (
    <div id="gbif-detail-view" className="space-y-4">
      <button
        id="gbif-detail-back-button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors -mt-1"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Occurrences
      </button>

      <div id="gbif-detail-hero" className="w-full aspect-[4/3] bg-slate-100 rounded-lg overflow-hidden">
        {heroMediaUrl ? (
          <img
            id="gbif-detail-hero-image"
            src={heroMediaUrl}
            alt={displayName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div id="gbif-detail-hero-empty" className="w-full h-full flex flex-col items-center justify-center text-gray-400">
            <Database className="w-12 h-12 mb-2" />
            <span id="gbif-detail-hero-empty-text" className="text-sm">
              {fallbackMediaLoading ? 'Loading media...' : 'No media available'}
            </span>
          </div>
        )}
      </div>

      {mediaUrls.length > 1 && (
        <div id="gbif-detail-media-strip" className="flex items-center gap-2 overflow-x-auto pb-1">
          {mediaUrls.map((mediaUrl, index) => (
            <button
              id={`gbif-detail-media-thumb-button-${index}`}
              key={mediaUrl}
              onClick={() => setHeroMediaUrl(mediaUrl)}
              className={`w-14 h-14 rounded-md overflow-hidden border transition-colors ${
                heroMediaUrl === mediaUrl ? 'border-emerald-600' : 'border-gray-200 hover:border-gray-300'
              }`}
              aria-label={`View media ${index + 1}`}
            >
              <img
                id={`gbif-detail-media-thumb-image-${index}`}
                src={mediaUrl}
                alt={`${displayName} thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}

      {showDevDebugPanel && (
        <details id="gbif-detail-media-debug-panel" className="rounded-lg border border-amber-200 bg-amber-50/60 p-3">
          <summary id="gbif-detail-media-debug-summary" className="cursor-pointer text-xs font-semibold text-amber-800">
            Media debug (dev only)
          </summary>
          <div id="gbif-detail-media-debug-body" className="mt-2 space-y-1 text-xs text-amber-900">
            <p id="gbif-detail-media-debug-id">id: {occurrence.id}</p>
            <p id="gbif-detail-media-debug-gbif-key">gbif_key: {occurrence.gbifKey ?? 'null'}</p>
            <p id="gbif-detail-media-debug-primary">primary_image_url: {occurrence.primaryImageUrl ?? 'null'}</p>
            <p id="gbif-detail-media-debug-media-json-presence">
              media_json: {mediaJsonDebugLabel}
            </p>
            <p id="gbif-detail-media-debug-parsed-count">parsed mediaUrls: {occurrence.mediaUrls.length}</p>
            <p id="gbif-detail-media-debug-fallback-loading">fallback loading: {fallbackMediaLoading ? 'yes' : 'no'}</p>
            <p id="gbif-detail-media-debug-fallback-count">fallback media count: {fallbackMediaUrls.length}</p>
            <p id="gbif-detail-media-debug-final-count">final displayed media count: {mediaUrls.length}</p>
          </div>
        </details>
      )}

      <div id="gbif-detail-name-block">
        <h3 id="gbif-detail-name" className="text-lg font-semibold text-gray-900">
          {displayName}
        </h3>
        {occurrence.scientificName && occurrence.scientificName !== displayName && (
          <p id="gbif-detail-scientific-name" className="text-sm text-gray-500 italic">
            {occurrence.scientificName}
          </p>
        )}
      </div>

      <div id="gbif-detail-metadata" className="bg-slate-50 rounded-lg p-4">
        <dl id="gbif-detail-metadata-list" className="space-y-2.5 text-sm">
          <MetaRow icon={<User className="w-4 h-4" />} label="Recorded by" value={occurrence.recordedBy || 'Unknown'} />
          <MetaRow icon={<Calendar className="w-4 h-4" />} label="Date" value={formatFullDate(occurrence.eventDate)} />
          <MetaRow icon={<MapPin className="w-4 h-4" />} label="Location" value={locationLabel} />
          <MetaRow icon={<Database className="w-4 h-4" />} label="Basis" value={occurrence.basisOfRecord?.replace(/_/g, ' ') || 'Unknown'} />
          <MetaRow icon={<Database className="w-4 h-4" />} label="Dataset" value={occurrence.datasetName || 'Unknown'} />
          <MetaRow icon={<Database className="w-4 h-4" />} label="Taxonomy" value={buildTaxonomyLabel(occurrence)} />
          <MetaRow icon={<Database className="w-4 h-4" />} label="Quality issues" value={issuesCount.toString()} />
        </dl>
      </div>

      <div id="gbif-detail-actions" className="flex flex-col gap-2">
        <button
          id="gbif-detail-save-view-button"
          type="button"
          onClick={() => {
            const feedback = onSaveView?.(occurrence);
            setViewSaved(true);
            setSaveFeedback(feedback || 'Saved GBIF view in Map Layers.');
          }}
          className="w-full flex items-center justify-center gap-2 py-2.5 border border-amber-200 bg-amber-50 text-sm text-amber-800 font-medium rounded-lg hover:bg-amber-100 transition-colors"
        >
          <Save className="w-4 h-4" />
          {viewSaved ? 'View Saved' : 'Save View'}
        </button>
        {viewSaved && (
          <p id="gbif-detail-save-view-feedback" className="text-xs text-emerald-700">
            {saveFeedback}
          </p>
        )}
        <button
          id="gbif-detail-view-map-button"
          onClick={onViewOnMap}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#2e7d32] text-white text-sm font-medium rounded-lg hover:bg-[#256d29] transition-colors"
        >
          <MapPin className="w-4 h-4" />
          View on Map
        </button>
        <a
          id="gbif-detail-open-gbif-link"
          href={`https://www.gbif.org/occurrence/${occurrence.gbifKey ?? occurrence.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2 py-2.5 border border-gray-200 text-sm text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          Open in GBIF
        </a>
      </div>
    </div>
  );
}

function buildTaxonomyLabel(occurrence: GBIFOccurrence): string {
  const parts = [
    occurrence.kingdom,
    occurrence.phylum,
    occurrence.taxonomicClass,
    occurrence.order,
    occurrence.family,
    occurrence.genus,
  ].filter((value): value is string => !!value);
  return parts.length > 0 ? parts.join(' > ') : 'Unavailable';
}

function MetaRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-gray-400">{icon}</span>
      <dt className="text-gray-500 w-28 flex-shrink-0">{label}</dt>
      <dd className="text-gray-900 font-medium flex-1 truncate">{value}</dd>
    </div>
  );
}
