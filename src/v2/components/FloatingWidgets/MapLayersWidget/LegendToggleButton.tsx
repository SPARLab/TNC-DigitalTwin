// ============================================================================
// LegendToggleButton — header button in the Map Layers widget that shows or hides
// the legend entries under each layer. Highlighted while the legends are on.
// ============================================================================

import { LayoutList } from 'lucide-react';

interface LegendToggleButtonProps {
  isOn: boolean;
  onToggle: () => void;
}

export function LegendToggleButton({ isOn, onToggle }: LegendToggleButtonProps) {
  return (
    <button
      id="map-layers-legend-toggle"
      type="button"
      onClick={onToggle}
      aria-pressed={isOn}
      aria-label="Show legend entries under layers"
      title={isOn ? 'Hide legend entries' : 'Show legend entries'}
      className={`rounded p-1 transition-colors ${
        isOn
          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
          : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
      }`}
    >
      <LayoutList className="h-4 w-4" />
    </button>
  );
}
