import { useEffect, useMemo } from 'react';
import { Info } from 'lucide-react';
import { useLayers } from '../../context/LayerContext';
import { ExportBuilderHeader } from './ExportBuilderHeader';
import { ExportBuilderFooter } from './ExportBuilderFooter';

interface ExportBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function estimateBookmarkedFeatureCount(): number {
  return 0;
}

export function ExportBuilderModal({ isOpen, onClose }: ExportBuilderModalProps) {
  const { pinnedLayers } = useLayers();

  const pinnedLayerCount = pinnedLayers.length;
  const bookmarkedFeatureCount = useMemo(
    () => estimateBookmarkedFeatureCount(),
    [],
  );

  useEffect(() => {
    if (!isOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      id="export-builder-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-builder-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        id="export-builder-modal"
        className="flex h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <ExportBuilderHeader
          pinnedLayerCount={pinnedLayerCount}
          bookmarkedFeatureCount={bookmarkedFeatureCount}
          onClose={onClose}
        />

        <div id="export-builder-content-scroll-area" className="flex-1 overflow-y-auto px-6 py-5">
          <div
            id="export-builder-shell-ready-card"
            className="rounded-xl border border-slate-200 bg-slate-50 p-4"
          >
            <div id="export-builder-shell-ready-header" className="flex items-start gap-3">
              <Info id="export-builder-shell-ready-icon" className="mt-0.5 h-4 w-4 text-slate-500" />
              <div id="export-builder-shell-ready-copy" className="space-y-2">
                <p id="export-builder-shell-ready-title" className="text-sm font-semibold text-slate-700">
                  Export Builder shell is ready.
                </p>
                <p id="export-builder-shell-ready-description" className="text-sm text-slate-600">
                  The modal scaffolding is wired to the global header cart button with a scrollable body and a fixed action footer. Next steps will add per-layer export cards, summary calculations, and real export handlers.
                </p>
              </div>
            </div>
          </div>

          <div id="export-builder-pinned-layer-preview-section" className="mt-4 space-y-2">
            <h3 id="export-builder-pinned-layer-preview-title" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Pinned layers currently in session
            </h3>
            {pinnedLayers.length === 0 ? (
              <p id="export-builder-empty-pinned-state" className="text-sm text-slate-500">
                No pinned layers yet. Pin a layer in the left sidebar to include it in exports.
              </p>
            ) : (
              <ul id="export-builder-pinned-layer-list" className="space-y-2">
                {pinnedLayers.map((layer) => (
                  <li
                    id={`export-builder-pinned-layer-item-${layer.id}`}
                    key={layer.id}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                  >
                    {layer.name}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <ExportBuilderFooter
          onCancel={onClose}
          onGenerateLinks={() => {
            // Action wiring is implemented in task 5.4.
            console.info('Export Builder: Generate Links clicked');
          }}
          onExportZip={() => {
            // Action wiring is implemented in task 5.4.
            console.info('Export Builder: Export ZIP clicked');
          }}
        />
      </div>
    </div>
  );
}
