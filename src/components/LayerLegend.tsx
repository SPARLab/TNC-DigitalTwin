import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Search } from 'lucide-react';

export interface LegendSymbol {
  type: 'polygon' | 'line' | 'point' | 'image' | 'text';
  fillColor?: [number, number, number, number]; // RGBA
  outlineColor?: [number, number, number, number]; // RGBA
  outlineWidth?: number;
  size?: number; // for points
  lineWidth?: number; // for lines
  style?: string; // ArcGIS symbol style (esriSFSSolid, esriSFSBackwardDiagonal, etc.)
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
  units?: string | null; // Units of measurement (e.g., "meters", "0-1 scale", "percent")
  items: LegendItem[];
}

interface LayerLegendProps {
  legend: LayerLegendData;
  isCompact?: boolean;
  layerOpacity?: number; // Layer opacity percentage (0-100)
  onFilterChange?: (selectedValues: (string | number)[]) => void;
}

const LayerLegend: React.FC<LayerLegendProps> = ({ legend, isCompact = false, layerOpacity = 100, onFilterChange }) => {
  const [isExpanded, setIsExpanded] = useState(!isCompact);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedValues, setSelectedValues] = useState<(string | number)[]>([]);

  // Handle clicking a legend item to toggle filter
  const handleItemClick = (item: LegendItem) => {
    if (!item.value && item.value !== 0) return; // Only allow filtering for unique-value renderers
    
    const newSelection = selectedValues.includes(item.value)
      ? selectedValues.filter(v => v !== item.value) // Deselect
      : [...selectedValues, item.value]; // Select
    
    setSelectedValues(newSelection);
    onFilterChange?.(newSelection);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSelectedValues([]);
    onFilterChange?.([]);
  };

  // Filter legend items based on search
  const filteredItems = legend.items.filter(item =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Determine if we should show search (for large legends)
  const showSearch = legend.items.length > 10;
  const showCollapse = legend.items.length > 5;

  // Render a color swatch for a symbol
  const renderSymbolSwatch = (symbol: LegendSymbol) => {
    const { type, fillColor, outlineColor, outlineWidth, size, lineWidth, style } = symbol;

    // Convert RGBA array to CSS rgba string, applying layer opacity
    const toRGBA = (color?: [number, number, number, number]) => {
      if (!color) return 'transparent';
      // Apply layer opacity to the alpha channel (layerOpacity is 0-100, convert to 0-1)
      const alphaWithLayerOpacity = (color[3] / 255) * (layerOpacity / 100);
      return `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alphaWithLayerOpacity})`;
    };

    const fillStyle = toRGBA(fillColor);
    const outlineStyle = toRGBA(outlineColor);

    // Generate pattern style for hatched/patterned fills using CSS
    const getPatternStyle = (style?: string) => {
      if (!style || style === 'esriSFSSolid') {
        return { backgroundColor: fillStyle };
      }
      
      // For patterned fills, create a visual representation with CSS gradients
      if (style.includes('Diagonal') || style.includes('Horizontal') || style.includes('Vertical')) {
        return {
          backgroundImage: `repeating-linear-gradient(
            ${style.includes('Backward') ? '135deg' : style.includes('Forward') ? '45deg' : style.includes('Horizontal') ? '0deg' : '90deg'},
            ${fillStyle},
            ${fillStyle} 2px,
            transparent 2px,
            transparent 6px
          )`,
          border: outlineWidth ? `${outlineWidth}px solid ${outlineStyle}` : '1px solid rgba(0,0,0,0.2)'
        };
      }
      
      // Default to solid if pattern not recognized
      return { backgroundColor: fillStyle };
    };

    switch (type) {
      case 'polygon':
        return (
          <div
            id={`legend-swatch-polygon-${legend.layerId}`}
            className="w-8 h-8 rounded flex-shrink-0"
            style={{
              ...getPatternStyle(style),
              border: outlineWidth && !style?.includes('Diagonal') && !style?.includes('Horizontal') && !style?.includes('Vertical')
                ? `${outlineWidth}px solid ${outlineStyle}` 
                : getPatternStyle(style).border || 'none'
            }}
          />
        );

      case 'line':
        return (
          <div
            id={`legend-swatch-line-${legend.layerId}`}
            className="w-8 h-8 flex items-center justify-center flex-shrink-0"
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
            className="w-8 h-8 flex items-center justify-center flex-shrink-0"
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
        
        // Make picture marker symbols larger for better visibility
        const displayWidth = symbol.width ? Math.max(symbol.width * 1.5, 32) : 32;
        const displayHeight = symbol.height ? Math.max(symbol.height * 1.5, 32) : 32;
        
        return (
          <div
            id={`legend-swatch-image-${legend.layerId}`}
            className="flex items-center justify-center flex-shrink-0"
            style={{
              width: `${displayWidth}px`,
              height: `${displayHeight}px`
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

  // Helper function to make labels more human-readable
  const formatLabel = (label: string): string => {
    if (!label) return '';
    
    // Remove common prefixes like "jldp_", "tnc_", etc.
    let cleaned = label.replace(/^(jldp|tnc|dangermond)_/i, '');
    
    // Replace underscores with spaces
    cleaned = cleaned.replace(/_/g, ' ');
    
    // Capitalize first letter of each word
    cleaned = cleaned
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
    
    return cleaned;
  };

  // Render a single legend item
  const renderLegendItem = (item: LegendItem, index: number) => {
    let label = item.label;

    // For class breaks, show range
    if (legend.rendererType === 'classBreaks' && item.minValue !== undefined && item.maxValue !== undefined) {
      label = `${item.minValue.toLocaleString()} - ${item.maxValue.toLocaleString()}`;
      if (item.label && item.label !== label) {
        label = `${label} (${formatLabel(item.label)})`;
      }
    } else {
      // Format the label for better readability
      label = formatLabel(label);
    }

    const isFilterable = (item.value !== undefined && item.value !== null) && onFilterChange;
    const isSelected = item.value !== undefined && selectedValues.includes(item.value);
    const isAnySelected = selectedValues.length > 0;

    return (
      <div
        key={`${legend.layerId}-legend-item-${index}`}
        id={`legend-item-${legend.layerId}-${index}`}
        onClick={() => isFilterable && handleItemClick(item)}
        className={`flex items-center gap-3 py-1.5 rounded px-1 transition-all
          ${isFilterable ? 'cursor-pointer hover:bg-blue-50' : ''}
          ${isSelected ? 'bg-blue-100 border border-blue-300' : 'hover:bg-gray-50'}
          ${isAnySelected && !isSelected ? 'opacity-50' : 'opacity-100'}`}
        role={isFilterable ? 'button' : undefined}
        aria-pressed={isFilterable ? isSelected : undefined}
        tabIndex={isFilterable ? 0 : undefined}
      >
        {renderSymbolSwatch(item.symbol)}
        <span 
          data-testid="legend-item-label"
          className="text-sm text-gray-700 break-words flex-1 min-w-0"
        >
          {label}
        </span>
        {isFilterable && isSelected && (
          <span className="text-blue-600 text-xs font-medium">✓</span>
        )}
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
      {/* Display units if available */}
      {legend.units && (
        <div id={`legend-units-${legend.layerId}`} className="mb-2 px-1">
          <p className="text-xs text-gray-600 italic">
            Units: <span className="font-medium text-gray-700">{legend.units}</span>
          </p>
        </div>
      )}
      
      {/* Clear filter button - only show for unique-value renderers when filters are active */}
      {onFilterChange && legend.rendererType === 'uniqueValue' && selectedValues.length > 0 && (
        <div id={`legend-filter-controls-${legend.layerId}`} className="mb-2 px-1">
          <button
            id={`legend-clear-filter-${legend.layerId}`}
            onClick={handleClearFilters}
            className="w-full px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors flex items-center justify-center gap-1"
            aria-label="Clear legend filters"
          >
            Show All ({legend.items.length})
          </button>
          <p className="text-xs text-gray-600 italic mt-1">
            Showing {selectedValues.length} of {legend.items.length} categories
          </p>
        </div>
      )}
      
      {renderLegendContent()}
    </div>
  );
};

export default LayerLegend;
