import { useState } from 'react';
import { Crop, MapPin, X, ChevronRight, ChevronDown } from 'lucide-react';
import { useMap } from '../../../context/MapContext';

interface SpatialQuerySectionProps {
  id: string;
  layerId: string;
  defaultExpanded?: boolean;
}

export function SpatialQuerySection({ id, layerId, defaultExpanded = true }: SpatialQuerySectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const {
    getSpatialPolygonForLayer,
    isSpatialQueryDrawing,
    startSpatialQueryDraw,
    clearSpatialQuery,
  } = useMap();
  const spatialPolygon = getSpatialPolygonForLayer(layerId);

  const hasSpatialFilter = !!spatialPolygon;
  const statusMessage = isSpatialQueryDrawing
    ? 'Drawing mode active: click map to add points, double-click to finish.'
    : null;

  return (
    <div id={`${id}-root`} className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Header — matches FilterSection / DateFilterSection style with expand/collapse */}
      <button
        id={`${id}-header`}
        type="button"
        onClick={() => setExpanded(prev => !prev)}
        className="w-full flex items-center gap-2 px-3 py-2.5 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
      >
        {expanded
          ? <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
          : <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />}
        <span className="flex-shrink-0 text-gray-500">
          <Crop className="w-4 h-4" />
        </span>
        <span id={`${id}-title`} className="text-sm font-medium text-gray-700 flex-1">
          Draw Custom Polygon
        </span>
        {!expanded && (
          <span className="text-xs text-gray-400">
            {hasSpatialFilter ? 'Polygon active' : 'None'}
          </span>
        )}
      </button>

      {/* Body — collapsible, matches DateFilterSection animation */}
      <div
        id={`${id}-body`}
        className="grid transition-[grid-template-rows] duration-200 ease-out"
        style={{ gridTemplateRows: expanded ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          <div className="px-3 py-2.5 space-y-2 border-t border-gray-100">
            <div id={`${id}-controls`} className="flex items-center gap-2">
              <button
                id={`${id}-draw`}
                type="button"
                onClick={startSpatialQueryDraw}
                className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-50"
              >
                <MapPin className="w-4 h-4" />
                {hasSpatialFilter ? 'Redraw' : 'Draw'}
              </button>
              {hasSpatialFilter && (
                <button
                  id={`${id}-remove-polygon`}
                  type="button"
                  onClick={clearSpatialQuery}
                  className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-100"
                >
                  <X className="w-4 h-4" />
                  Remove
                </button>
              )}
            </div>

            {statusMessage && (
              <p id={`${id}-status`} className="text-xs text-gray-600">
                {statusMessage}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
