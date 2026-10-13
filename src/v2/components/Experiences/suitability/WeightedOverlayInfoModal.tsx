// ============================================================================
// WeightedOverlayInfoModal — a detailed explanation of the weighted overlay,
// opened from the "?" at the end of step four on the suitability intro.
// ============================================================================

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { WEIGHTED_OVERLAY_EXPLAINER } from './wizardCopy';

interface WeightedOverlayInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WeightedOverlayInfoModal({ isOpen, onClose }: WeightedOverlayInfoModalProps) {
  const closeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  const copy = WEIGHTED_OVERLAY_EXPLAINER;

  // Portaled to the body so the sidebar's scaling and clipping do not affect it.
  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/55 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="weighted-overlay-modal-title"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-xl flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-3 border-b border-gray-200 px-4 py-3">
          <div className="min-w-0">
            <h2 id="weighted-overlay-modal-title" className="text-sm font-semibold text-gray-900">
              {copy.title}
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-gray-500">{copy.intro}</p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
            aria-label="Close explanation"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          <ol className="flex flex-col gap-3">
            {copy.steps.map((step, index) => (
              <li key={step.title} className="flex items-start gap-2.5">
                <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-semibold text-emerald-700">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900">{step.title}</h3>
                  <p className="mt-0.5 text-sm leading-relaxed text-gray-600">{step.body}</p>
                  {'rules' in step && (
                    <ul className="mt-2 flex flex-col gap-1.5">
                      {step.rules.map((rule) => (
                        <li
                          key={rule.name}
                          className="rounded-card border border-gray-200 bg-gray-50 px-2.5 py-2"
                        >
                          <p className="text-xs font-semibold text-gray-900">{rule.name}</p>
                          <p className="mt-0.5 text-xs leading-relaxed text-gray-600">{rule.body}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-4 rounded-card border border-emerald-200 bg-emerald-50/60 px-3 py-2.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
              {copy.example.title}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-gray-700">{copy.example.body}</p>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
