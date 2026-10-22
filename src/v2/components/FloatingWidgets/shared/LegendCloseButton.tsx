// ============================================================================
// LegendCloseButton — X in a legend widget's title bar. Hides the legend; the
// map control rail then shows a button to bring it back.
// ============================================================================

import { X } from 'lucide-react';
import { hideLegend } from './legendVisibilityStore';

export function LegendCloseButton({ id }: { id: string }) {
  return (
    <button
      id={id}
      type="button"
      onClick={(event) => {
        // The title bar toggles expand/collapse on click and on Enter/Space.
        event.stopPropagation();
        hideLegend();
      }}
      onKeyDown={(event) => event.stopPropagation()}
      className="flex-shrink-0 rounded p-1 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-700"
      title="Close legend"
      aria-label="Close legend"
    >
      <X className="h-4 w-4" />
    </button>
  );
}
