// ============================================================================
// MapToasts — Floating toast notifications over the map area
// Shows temporary messages like "layer not implemented yet".
// Auto-dismisses after 3.5s (managed in MapContext).
// ============================================================================

import { AlertTriangle, Info, X } from 'lucide-react';
import { useMap } from '../../context/MapContext';

export function MapToasts() {
  const { toasts, dismissToast } = useMap();

  if (toasts.length === 0) return null;

  return (
    <div id="map-toasts" className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex flex-col gap-2 pointer-events-none">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`
            pointer-events-auto flex items-center gap-2 px-4 py-2.5 rounded-lg shadow-lg
            text-sm font-medium backdrop-blur-sm animate-fade-in-up
            ${toast.type === 'warning'
              ? 'bg-amber-50/95 text-amber-800 border border-amber-200'
              : 'bg-white/95 text-gray-700 border border-gray-200'
            }
          `}
        >
          {toast.type === 'warning'
            ? <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            : <Info className="w-4 h-4 text-blue-500 shrink-0" />
          }
          <span>{toast.message}</span>
          <button
            id={`toast-dismiss-${toast.id}`}
            onClick={() => dismissToast(toast.id)}
            className="ml-1 p-0.5 rounded hover:bg-black/5 transition-colors shrink-0"
            aria-label="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
