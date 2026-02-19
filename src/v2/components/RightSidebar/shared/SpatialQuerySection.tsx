import { Crop, MapPin, X } from 'lucide-react';
import { useMap } from '../../../context/MapContext';

interface SpatialQuerySectionProps {
  id: string;
}

export function SpatialQuerySection({ id }: SpatialQuerySectionProps) {
  const {
    spatialPolygon,
    isSpatialQueryDrawing,
    startSpatialQueryDraw,
    clearSpatialQuery,
  } = useMap();

  const hasSpatialFilter = !!spatialPolygon;

  return (
    <div id={`${id}-root`} className="bg-slate-50 rounded-lg p-3 space-y-2">
      <div id={`${id}-header`} className="flex items-center justify-between">
        <span id={`${id}-title`} className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
          <Crop className="w-3.5 h-3.5" />
          Spatial Query
        </span>
        {hasSpatialFilter && (
          <button
            id={`${id}-clear`}
            type="button"
            onClick={clearSpatialQuery}
            className="text-xs text-emerald-700 hover:text-emerald-800 font-medium"
          >
            Clear
          </button>
        )}
      </div>

      <div id={`${id}-controls`} className="flex items-center gap-2">
        <button
          id={`${id}-draw`}
          type="button"
          onClick={startSpatialQueryDraw}
          className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-50"
        >
          <MapPin className="w-4 h-4" />
          {hasSpatialFilter ? 'Redraw Polygon' : 'Draw Polygon'}
        </button>
      </div>

      <p id={`${id}-status`} className="text-xs text-gray-600">
        {isSpatialQueryDrawing
          ? 'Drawing mode active: click map to add points, double-click to finish.'
          : hasSpatialFilter
            ? 'Polygon applied. Map layers now show features inside the drawn area.'
            : 'No polygon drawn. Draw a polygon on the map to apply a spatial filter.'}
      </p>

      {hasSpatialFilter && (
        <p id={`${id}-hint`} className="text-[11px] text-gray-500 flex items-start gap-1">
          <X className="w-3 h-3 mt-[1px] shrink-0" />
          Clearing removes the filter for all active/pinned map layers.
        </p>
      )}
    </div>
  );
}
