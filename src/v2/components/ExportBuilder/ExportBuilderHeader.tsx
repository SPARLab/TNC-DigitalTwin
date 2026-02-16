import { Package, X } from 'lucide-react';

interface ExportBuilderHeaderProps {
  pinnedLayerCount: number;
  bookmarkedFeatureCount: number;
  onClose: () => void;
}

export function ExportBuilderHeader({
  pinnedLayerCount,
  bookmarkedFeatureCount,
  onClose,
}: ExportBuilderHeaderProps) {
  return (
    <div
      id="export-builder-header"
      className="flex items-start justify-between gap-4 border-b border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 px-6 py-4"
    >
      <div id="export-builder-header-content" className="flex items-center gap-3">
        <div
          id="export-builder-header-icon-wrapper"
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm"
        >
          <Package id="export-builder-header-icon" className="h-5 w-5" />
        </div>

        <div id="export-builder-header-copy" className="space-y-1">
          <h2 id="export-builder-title" className="text-lg font-bold text-slate-800">
            Export Builder
          </h2>
          <p id="export-builder-subtitle" className="text-xs text-slate-600">
            Configure what to include in your export.
          </p>
          <p id="export-builder-counts" className="text-xs text-slate-600">
            You have{' '}
            <span id="export-builder-pinned-count" className="font-semibold text-blue-700">
              {pinnedLayerCount} pinned {pinnedLayerCount === 1 ? 'layer' : 'layers'}
            </span>{' '}
            and{' '}
            <span id="export-builder-bookmarked-count" className="font-semibold text-amber-700">
              {bookmarkedFeatureCount} bookmarked {bookmarkedFeatureCount === 1 ? 'feature' : 'features'}
            </span>
            .
          </p>
        </div>
      </div>

      <button
        id="export-builder-close-button"
        type="button"
        onClick={onClose}
        className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
        aria-label="Close export builder"
        title="Close"
      >
        <X id="export-builder-close-icon" className="h-5 w-5" />
      </button>
    </div>
  );
}
