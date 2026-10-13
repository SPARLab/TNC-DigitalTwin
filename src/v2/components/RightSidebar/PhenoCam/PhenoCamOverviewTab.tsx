// ============================================================================
// PhenoCamOverviewTab — Info panel with latest_image_url previews per camera.
// ============================================================================

import { formatPhenoTimestamp, type PhenoLatestImage } from '../../../services/phenocamService';

interface PhenoCamOverviewTabProps {
  cameraCount: number;
  totalImageCount: number;
  latestImages: PhenoLatestImage[];
  loading: boolean;
  onBrowseClick: () => void;
}

export function PhenoCamOverviewTab({
  cameraCount,
  totalImageCount,
  latestImages,
  loading,
  onBrowseClick,
}: PhenoCamOverviewTabProps) {
  const cameraDisplay = loading ? '...' : cameraCount.toLocaleString();
  const imageDisplay = loading ? '...' : totalImageCount.toLocaleString();

  return (
    <div id="phenocam-overview-tab" className="space-y-5">
      <p className="text-sm leading-relaxed text-gray-600">
        Near-surface phenology (repeat time-lapse) imagery from the PhenoCam Network
        at the Jack and Laura Dangermond Preserve. Fixed camera sites capture midday
        archive images used to track vegetation green-up and seasonal change.
      </p>

      <div id="phenocam-overview-metadata" className="rounded-lg bg-slate-50 p-4">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <MetaRow label="Cameras" value={cameraDisplay} />
          <MetaRow label="Archive images" value={imageDisplay} />
          <MetaRow label="Coverage" value="Dangermond Preserve" />
          <MetaRow label="Source" value="PhenoCam Network" />
          <MetaRow label="License" value="CC BY 4.0" />
          <MetaRow label="Update frequency" value="Daily midday" />
        </dl>
      </div>

      <section id="phenocam-latest-images" aria-label="Latest PhenoCam images" className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900">Latest images</h3>
        {loading && (
          <p className="text-sm text-gray-500">Loading latest camera views…</p>
        )}
        {!loading && latestImages.length === 0 && (
          <p className="text-sm text-gray-500">No latest images are available yet.</p>
        )}
        <div className="space-y-3">
          {latestImages.map((image) => (
            <figure
              key={image.cameraId}
              id={`phenocam-latest-${image.cameraId}`}
              className="overflow-hidden rounded-lg border border-gray-200 bg-white"
            >
              <img
                src={image.latestImageUrl}
                alt={`Latest PhenoCam view from ${image.siteLabel}`}
                className="h-40 w-full object-cover bg-gray-100"
                loading="lazy"
              />
              <figcaption className="space-y-0.5 px-3 py-2">
                <p className="truncate text-sm font-medium text-gray-900">{image.siteLabel}</p>
                <p className="text-[11px] text-gray-500">
                  {formatPhenoTimestamp(image.latestTimeLocal ?? image.latestTimeUtc)}
                </p>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <button
        id="phenocam-browse-cta"
        type="button"
        onClick={onBrowseClick}
        className="min-h-[44px] w-full rounded-lg bg-[#2e7d32] py-3 text-sm font-medium text-white
                   transition-all duration-150 ease-out
                   hover:scale-[1.02] hover:bg-[#256d29] active:scale-100
                   focus:outline-none focus:ring-2 focus:ring-[#2e7d32] focus:ring-offset-2"
      >
        Browse Images &rarr;
      </button>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-gray-500">{label}</dt>
      <dd className="text-right font-medium text-gray-900">{value}</dd>
    </>
  );
}
