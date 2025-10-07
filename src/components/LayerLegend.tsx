import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Search } from 'lucide-react';

export interface LegendSymbol {
  type: 'polygon' | 'line' | 'point' | 'image' | 'text';
  fillColor?: [number, number, number, number]; // RGBA
  outlineColor?: [number, number, number, number]; // RGBA
  outlineWidth?: number;
  size?: number; // for points
  lineWidth?: number; // for lines
  // For image-based symbols (from /legend endpoint or picture marker symbols)
  imageData?: string; // base64 encoded image
  url?: string; // URL to image
  contentType?: string;
  width?: number;
  height?: number;
  xoffset?: number; // offset for positioning picture markers
  yoffset?: number; // offset for positioning picture markers
  angle?: number; // rotation angle for picture markers
}

export interface LegendItem {
  label: string;
  symbol: LegendSymbol;
  value?: string | number; // for uniqueValue renderer
  minValue?: number; // for classBreaks renderer
  maxValue?: number; // for classBreaks renderer
}

export interface LayerLegendData {
  layerId: string;
  layerName: string;
  rendererType: 'simple' | 'uniqueValue' | 'classBreaks';
  items: LegendItem[];
}

interface LayerLegendProps {
  legend: LayerLegendData;
  isCompact?: boolean;
}

const LayerLegend: React.FC<LayerLegendProps> = ({ legend, isCompact = false }) => {
  const [isExpanded, setIsExpanded] = useState(!isCompact);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter legend items based on search
  const filteredItems = legend.items.filter(item =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Determine if we should show search (for large legends)
  const showSearch = legend.items.length > 10;
  const showCollapse = legend.items.length > 5;

  // Render a color swatch for a symbol
  const renderSymbolSwatch = (symbol: LegendSymbol) => {
    const { type, fillColor, outlineColor, outlineWidth, size, lineWidth } = symbol;

    // Convert RGBA array to CSS rgba string
    const toRGBA = (color?: [number, number, number, number]) => {
      if (!color) return 'transparent';
      return `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${color[3] / 255})`;
    };

    const fillStyle = toRGBA(fillColor);
    const outlineStyle = toRGBA(outlineColor);

    switch (type) {
      case 'polygon':
        return (
          <div
            id={`legend-swatch-polygon-${legend.layerId}`}
            className="w-5 h-5 rounded flex-shrink-0"
            style={{
              backgroundColor: fillStyle,
              border: outlineWidth ? `${outlineWidth}px solid ${outlineStyle}` : 'none'
            }}
          />
        );

      case 'line':
        return (
          <div
            id={`legend-swatch-line-${legend.layerId}`}
            className="w-5 h-5 flex items-center justify-center flex-shrink-0"
          >
            <div
              style={{
                width: '20px',
                height: `${lineWidth || 2}px`,
                backgroundColor: fillStyle || outlineStyle,
                borderRadius: '1px'
              }}
            />
          </div>
        );

      case 'point':
        return (
          <div
            id={`legend-swatch-point-${legend.layerId}`}
            className="w-5 h-5 flex items-center justify-center flex-shrink-0"
          >
            <div
              className="rounded-full"
              style={{
                width: `${size || 8}px`,
                height: `${size || 8}px`,
                backgroundColor: fillStyle,
                border: outlineWidth ? `${outlineWidth}px solid ${outlineStyle}` : 'none'
              }}
            />
          </div>
        );

      case 'image':
        // Render image-based legend symbol (from /legend endpoint or picture marker symbols)
        const imgSrc = symbol.imageData 
          ? `data:${symbol.contentType || 'image/png'};base64,${symbol.imageData}`
          : symbol.url;
        
        // Apply rotation if angle is specified
        const rotationStyle = symbol.angle ? `rotate(${symbol.angle}deg)` : undefined;
        
        return (
          <div
            id={`legend-swatch-image-${legend.layerId}`}
            className="flex items-center justify-center flex-shrink-0"
            style={{
              width: `${symbol.width || 20}px`,
              height: `${symbol.height || 20}px`
            }}
          >
            <img 
              src={imgSrc} 
              alt="Legend symbol"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                transform: rotationStyle
              }}
            />
          </div>
        );

      default:
        return (
          <div
            id={`legend-swatch-unknown-${legend.layerId}`}
            className="w-5 h-5 rounded bg-gray-300 flex-shrink-0"
          />
        );
    }
  };

  // Render a single legend item
  const renderLegendItem = (item: LegendItem, index: number) => {
    let label = item.label;

    // For class breaks, show range
    if (legend.rendererType === 'classBreaks' && item.minValue !== undefined && item.maxValue !== undefined) {
      label = `${item.minValue.toLocaleString()} - ${item.maxValue.toLocaleString()}`;
      if (item.label && item.label !== label) {
        label = `${label} (${item.label})`;
      }
    }

    return (
      <div
        key={`${legend.layerId}-legend-item-${index}`}
        id={`legend-item-${legend.layerId}-${index}`}
        className="flex items-start gap-2 py-1 hover:bg-gray-50 rounded px-1 transition-colors"
      >
        {renderSymbolSwatch(item.symbol)}
        <span className="text-xs text-gray-700 leading-5 break-words flex-1 min-w-0">
          {label}
        </span>
      </div>
    );
  };

  // Render the legend based on type
  const renderLegendContent = () => {
    if (legend.items.length === 0) {
      return (
        <p id={`legend-no-items-${legend.layerId}`} className="text-xs text-gray-500 italic py-2">
          No legend information available
        </p>
      );
    }

    // Simple renderer - single item, always show
    if (legend.rendererType === 'simple') {
      return (
        <div id={`legend-simple-${legend.layerId}`} className="py-1">
          {renderLegendItem(legend.items[0], 0)}
        </div>
      );
    }

    // Unique value or class breaks - multiple items
    const itemsToShow = isExpanded ? filteredItems : filteredItems.slice(0, 5);
    const hasMore = filteredItems.length > itemsToShow.length;

    return (
      <div id={`legend-items-${legend.layerId}`} className="space-y-0.5">
        {/* Search for large legends */}
        {showSearch && isExpanded && (
          <div id={`legend-search-${legend.layerId}`} className="relative mb-2 mt-1">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-7 pr-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}

        {/* Legend items */}
        <div
          id={`legend-items-list-${legend.layerId}`}
          className={`${isExpanded ? 'max-h-64 overflow-y-auto' : ''}`}
        >
          {itemsToShow.map((item, index) => renderLegendItem(item, index))}
        </div>

        {/* Show more/less button */}
        {showCollapse && (
          <button
            id={`legend-toggle-${legend.layerId}`}
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
              if (!isExpanded) {
                setSearchQuery(''); // Clear search when collapsing
              }
            }}
            className="w-full mt-2 pt-2 border-t border-gray-200 text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center justify-center gap-1 transition-colors"
          >
            {isExpanded ? (
              <>
                <ChevronRight className="w-3 h-3" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3" />
                Show All ({legend.items.length} categories)
              </>
            )}
          </button>
        )}

        {hasMore && isExpanded && (
          <p id={`legend-filtered-count-${legend.layerId}`} className="text-xs text-gray-500 italic pt-1">
            Showing {filteredItems.length} of {legend.items.length}
          </p>
        )}
      </div>
    );
  };

  return (
    <div id={`layer-legend-${legend.layerId}`} className="w-full">
      <div id={`legend-header-${legend.layerId}`} className="mb-2">
        <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
          Legend
        </h4>
      </div>
      {renderLegendContent()}
    </div>
  );
};

export default LayerLegend;
