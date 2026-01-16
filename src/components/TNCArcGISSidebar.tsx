import React, { useState, useMemo, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  Map, 
  ExternalLink, 
  FileText, 
  Search,
  Filter,
  Eye,
  EyeOff,
  Database,
  Calendar,
  User,
  X,
  Loader2
} from 'lucide-react';
import { TNCArcGISItem } from '../services/tncArcGISService';
import DataTypeBackHeader from './DataTypeBackHeader';

// =============================================================================
// FittedBadgeRow - Renders badges that fit in one row without clipping
// Uses useLayoutEffect to measure and calculate BEFORE browser paints (no flicker)
// =============================================================================
interface Badge {
  id: string;
  label: string;
  className: string;
}

interface FittedBadgeRowProps {
  badges: Badge[];
  gap: number; // Gap between badges in pixels
  className?: string;
}

// Debug flag - set to true to enable console logging
const DEBUG_FITTED_BADGE_ROW = false;

// Helper to calculate how many badges fit in a container
function calculateVisibleBadges(
  containerWidth: number,
  badgeWidths: number[],
  overflowWidth: number,
  gap: number,
  debugLabel?: string
): number {
  if (badgeWidths.length === 0) return 0;
  
  let totalWidth = 0;
  let count = 0;
  
  for (let i = 0; i < badgeWidths.length; i++) {
    const badgeWidth = badgeWidths[i];
    const gapWidth = i > 0 ? gap : 0;
    const remainingBadges = badgeWidths.length - i - 1;
    
    // Only reserve space for overflow if this badge would leave others hidden
    const wouldHideOthers = remainingBadges > 0;
    const reservedWidth = wouldHideOthers ? overflowWidth + gap : 0;
    
    const neededWidth = totalWidth + gapWidth + badgeWidth + reservedWidth;
    const fits = neededWidth <= containerWidth;
    
    if (DEBUG_FITTED_BADGE_ROW && debugLabel) {
      console.log(`[${debugLabel}] Badge ${i}: width=${badgeWidth.toFixed(1)}, needed=${neededWidth.toFixed(1)}, container=${containerWidth.toFixed(1)}, fits=${fits}`);
    }
    
    if (fits) {
      totalWidth += gapWidth + badgeWidth;
      count++;
    } else {
      break;
    }
  }
  
  return Math.max(1, count);
}

const FittedBadgeRow: React.FC<FittedBadgeRowProps> = ({ badges, gap, className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const overflowRef = useRef<HTMLSpanElement>(null);
  const [visibleCount, setVisibleCount] = useState(badges.length);
  
  // Track badge elements using an object keyed by badge.id for accurate refs
  const badgeElementsRef = useRef<Record<string, HTMLSpanElement | null>>({});
  
  // Memoize badges length to detect changes
  const badgesLength = badges.length;
  
  // Create a stable debug label from first badge (memoized)
  const debugLabel = useMemo(
    () => badges.length > 0 ? badges[0].id.replace('item-type-badge-', '').slice(0, 20) : 'unknown',
    [badges]
  );
  
  // Stable calculation function - use badgesLength instead of badges for dependency
  const recalculate = useCallback(() => {
    const container = containerRef.current;
    if (!container || badges.length === 0) {
      setVisibleCount(badges.length);
      return;
    }

    const containerWidth = container.getBoundingClientRect().width;
    const overflowWidth = overflowRef.current?.getBoundingClientRect().width ?? 28;
    
    // Get widths for current badges only (using badge IDs)
    const badgeWidths: number[] = [];
    let hasZeroWidth = false;
    
    for (const badge of badges) {
      const el = badgeElementsRef.current[badge.id];
      const width = el?.getBoundingClientRect().width ?? 0;
      
      if (DEBUG_FITTED_BADGE_ROW) {
        console.log(`[${debugLabel}] Measuring badge "${badge.label}": width=${width.toFixed(1)}, ref exists=${!!el}`);
      }
      
      if (width === 0) {
        hasZeroWidth = true;
      }
      badgeWidths.push(width);
    }
    
    // If any badge has 0 width, refs aren't ready yet - show all badges
    if (hasZeroWidth) {
      if (DEBUG_FITTED_BADGE_ROW) {
        console.log(`[${debugLabel}] Some badges have 0 width, showing all ${badges.length} badges`);
      }
      setVisibleCount(badges.length);
      return;
    }
    
    if (DEBUG_FITTED_BADGE_ROW) {
      console.log(`[${debugLabel}] Container=${containerWidth.toFixed(1)}, overflow=${overflowWidth.toFixed(1)}, badges=${badges.length}, widths=[${badgeWidths.map(w => w.toFixed(0)).join(', ')}]`);
    }
    
    const count = calculateVisibleBadges(containerWidth, badgeWidths, overflowWidth, gap, debugLabel);
    
    if (DEBUG_FITTED_BADGE_ROW) {
      const hiddenCount = badges.length - count;
      console.log(`[${debugLabel}] RESULT: visibleCount=${count}, hiddenCount=${hiddenCount} (total=${badges.length})`);
    }
    
    setVisibleCount(count);
  }, [badges, gap, debugLabel]);
  
  // Calculate on mount and when badges change - BEFORE paint
  useLayoutEffect(() => {
    if (DEBUG_FITTED_BADGE_ROW) {
      console.log(`[${debugLabel}] useLayoutEffect triggered, badges.length=${badges.length}`);
    }
    recalculate();
  }, [recalculate]);

  // Recalculate on resize (skip initial call since useLayoutEffect handles it)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let skipFirst = true;
    const resizeObserver = new ResizeObserver(() => {
      if (skipFirst) {
        skipFirst = false;
        return;
      }
      if (DEBUG_FITTED_BADGE_ROW) {
        console.log(`[${debugLabel}] ResizeObserver triggered`);
      }
      recalculate();
    });
    
    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, [recalculate, debugLabel]);

  // Calculate hidden count based on current badges array length
  // This ensures we always use the latest badges.length even if visibleCount is stale
  const safeVisibleCount = Math.min(visibleCount, badgesLength);
  const hiddenCount = Math.max(0, badgesLength - safeVisibleCount);
  
  if (DEBUG_FITTED_BADGE_ROW) {
    const badgeLabels = badges.map(b => b.label).join(', ');
    console.log(`[${debugLabel}] RENDER: visibleCount=${visibleCount}, safeVisibleCount=${safeVisibleCount}, hiddenCount=${hiddenCount}, badges=[${badgeLabels}] (${badgesLength})`);
    
    // Sanity check: visibleCount + hiddenCount should equal badgesLength
    if (safeVisibleCount + hiddenCount !== badgesLength) {
      console.error(`[${debugLabel}] BUG DETECTED: safeVisibleCount(${safeVisibleCount}) + hiddenCount(${hiddenCount}) != badgesLength(${badgesLength})`);
    }
  }

  return (
    <div ref={containerRef} className={`flex flex-nowrap ${className}`} style={{ gap: `${gap}px` }}>
      {/* Render all badges but only show visible ones */}
      {badges.map((badge, idx) => (
        <span
          key={badge.id}
          id={badge.id}
          ref={el => {
            if (el) {
              badgeElementsRef.current[badge.id] = el;
            } else {
              delete badgeElementsRef.current[badge.id];
            }
          }}
          className={`${badge.className} whitespace-nowrap`}
          style={{ 
            visibility: idx < safeVisibleCount ? 'visible' : 'hidden',
            position: idx < safeVisibleCount ? 'relative' : 'absolute',
            pointerEvents: idx < safeVisibleCount ? 'auto' : 'none'
          }}
        >
          {badge.label}
        </span>
      ))}
      {/* Overflow indicator */}
      <span
        ref={overflowRef}
        className="flex-shrink-0 whitespace-nowrap px-btn-compact-x-lg xl:px-btn-compact-x-xl 2xl:px-btn-compact-x-2xl py-btn-compact-y-lg xl:py-btn-compact-y-xl 2xl:py-btn-compact-y-2xl text-label-lg xl:text-label-xl 2xl:text-label-2xl text-gray-500"
        style={{
          visibility: hiddenCount > 0 ? 'visible' : 'hidden',
          position: hiddenCount > 0 ? 'relative' : 'absolute',
          pointerEvents: hiddenCount > 0 ? 'auto' : 'none'
        }}
      >
        +{hiddenCount}
      </span>
    </div>
  );
};

interface TNCArcGISSidebarProps {
  items: TNCArcGISItem[];
  isLoading?: boolean;
  onItemSelect?: (item: TNCArcGISItem) => void;
  // Map layer management
  activeLayerIds?: string[];
  loadingLayerIds?: string[];
  selectedDetailsItemId?: string; // ID of item showing in details sidebar
  onLayerToggle?: (itemId: string) => void; // For eye icon toggle
  // Modal management
  selectedModalItem?: TNCArcGISItem | null;
  onModalOpen?: (item: TNCArcGISItem) => void;
  onModalClose?: () => void;
  hasSearched?: boolean;
  onBack?: () => void;
}

const TNCArcGISSidebar: React.FC<TNCArcGISSidebarProps> = ({
  items,
  isLoading = false,
  onItemSelect,
  activeLayerIds = [],
  loadingLayerIds = [],
  selectedDetailsItemId,
  onLayerToggle,
  selectedModalItem,
  onModalOpen,
  onModalClose,
  hasSearched = false,
  onBack // Add onBack prop
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['Map Layers', 'Pages', 'External Links'])
  );
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [selectedUIPatterns, setSelectedUIPatterns] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  // Filter items based on search and filters
  const filteredItems = useMemo(() => {
    let filtered = items;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => {
        const searchableText = `${item.title} ${item.description} ${item.snippet} ${item.tags.join(' ')}`.toLowerCase();
        return searchableText.includes(query);
      });
    }

    // Category filter
    if (selectedCategories.size > 0) {
      filtered = filtered.filter(item =>
        item.mainCategories.some(cat => selectedCategories.has(cat))
      );
    }

    // UI Pattern filter
    if (selectedUIPatterns.size > 0) {
      filtered = filtered.filter(item =>
        selectedUIPatterns.has(item.uiPattern)
      );
    }

    return filtered;
  }, [items, searchQuery, selectedCategories, selectedUIPatterns]);

  // Group items by UI pattern (data type)
  const groupedItems = useMemo(() => {
    const groups: { [key: string]: TNCArcGISItem[] } = {
      'Map Layers': [],
      'Pages': [],
      'External Links': []
    };
    
    filteredItems.forEach(item => {
      switch (item.uiPattern) {
        case 'MAP_LAYER':
          groups['Map Layers'].push(item);
          break;
        case 'MODAL':
          groups['Pages'].push(item);
          break;
        case 'EXTERNAL_LINK':
          groups['External Links'].push(item);
          break;
        default:
          // Fallback for any unknown patterns
          if (!groups['Other']) {
            groups['Other'] = [];
          }
          groups['Other'].push(item);
      }
    });

    // Sort items within each group by title
    Object.keys(groups).forEach(groupName => {
      groups[groupName].sort((a, b) => a.title.localeCompare(b.title));
    });

    // Remove empty groups
    Object.keys(groups).forEach(groupName => {
      if (groups[groupName].length === 0) {
        delete groups[groupName];
      }
    });

    return groups;
  }, [filteredItems]);

  // Get all available categories and UI patterns for filters
  const availableCategories = useMemo(() => {
    const categories = new Set<string>();
    items.forEach(item => {
      item.mainCategories.forEach(cat => categories.add(cat));
    });
    return Array.from(categories).sort();
  }, [items]);

  const availableUIPatterns = useMemo(() => {
    const patterns = new Set<string>();
    items.forEach(item => patterns.add(item.uiPattern));
    return Array.from(patterns).sort();
  }, [items]);

  // Statistics
  const stats = useMemo(() => {
    const total = filteredItems.length;
    const byPattern = {
      MAP_LAYER: filteredItems.filter(item => item.uiPattern === 'MAP_LAYER').length,
      EXTERNAL_LINK: filteredItems.filter(item => item.uiPattern === 'EXTERNAL_LINK').length,
      MODAL: filteredItems.filter(item => item.uiPattern === 'MODAL').length
    };
    return { total, byPattern };
  }, [filteredItems]);

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const toggleCategoryFilter = (category: string) => {
    const newSelected = new Set(selectedCategories);
    if (newSelected.has(category)) {
      newSelected.delete(category);
    } else {
      newSelected.add(category);
    }
    setSelectedCategories(newSelected);
  };

  const toggleUIPatternFilter = (pattern: string) => {
    const newSelected = new Set(selectedUIPatterns);
    if (newSelected.has(pattern)) {
      newSelected.delete(pattern);
    } else {
      newSelected.add(pattern);
    }
    setSelectedUIPatterns(newSelected);
  };

  const clearFilters = () => {
    setSelectedCategories(new Set());
    setSelectedUIPatterns(new Set());
    setSearchQuery('');
  };

  const getUIPatternIcon = (pattern: string) => {
    switch (pattern) {
      case 'MAP_LAYER': return <Map className="w-4 h-4" />;
      case 'EXTERNAL_LINK': return <ExternalLink className="w-4 h-4" />;
      case 'MODAL': return <FileText className="w-4 h-4" />;
      default: return <Database className="w-4 h-4" />;
    }
  };

  const toggleItemExpansion = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const handleItemClick = (item: TNCArcGISItem) => {
    onItemSelect?.(item);
    
    switch (item.uiPattern) {
      case 'MAP_LAYER':
        // For map layers, just select the item (details will show in right sidebar)
        // Don't toggle expansion or layer visibility here
        break;
      case 'EXTERNAL_LINK':
        // Expand to show details and external link button
        toggleItemExpansion(item.id);
        break;
      case 'MODAL':
        // Expand card to show metadata and open preview in main area
        toggleItemExpansion(item.id);
        onModalOpen?.(item);
        break;
    }
  };

  const renderItem = (item: TNCArcGISItem) => {
    const isActiveLayer = activeLayerIds.includes(item.id);
    const isLoadingLayer = loadingLayerIds.includes(item.id);
    const isExpanded = expandedItems.has(item.id);
    const isSelectedForDetails = selectedDetailsItemId === item.id;
    
    return (
      <div
        key={item.id}
        id={`tnc-item-${item.id}`}
        className={`p-pad-card-compact-lg xl:p-pad-card-compact-xl 2xl:p-pad-card-compact-2xl rounded-card cursor-pointer transition-all duration-200 ${
          isSelectedForDetails
            ? 'bg-blue-50 border-2 border-blue-500 shadow-lg' 
            : isActiveLayer 
              ? 'bg-blue-50/50 border border-blue-300 shadow-md' 
              : 'bg-white border border-gray-200 hover:border-blue-300 hover:shadow-sm'
        }`}
        onClick={() => handleItemClick(item)}
      >
        {/* Row 1: Title bar with eye icon on far right */}
        <div id={`item-header-${item.id}`} className="flex items-center justify-between gap-gap-tight-lg xl:gap-gap-tight-xl 2xl:gap-gap-tight-2xl mb-gap-element-lg xl:mb-gap-element-xl 2xl:mb-gap-element-2xl">
          <div className="flex items-center gap-gap-tight-lg xl:gap-gap-tight-xl 2xl:gap-gap-tight-2xl min-w-0 flex-1">
            {isExpanded ? (
              <ChevronDown id={`item-chevron-down-${item.id}`} className="w-3.5 h-3.5 xl:w-4 xl:h-4 text-gray-600 flex-shrink-0" />
            ) : (
              <ChevronRight id={`item-chevron-right-${item.id}`} className="w-3.5 h-3.5 xl:w-4 xl:h-4 text-gray-600 flex-shrink-0" />
            )}
            <div id={`item-ui-pattern-icon-${item.id}`} className="flex-shrink-0 [&>svg]:w-3.5 [&>svg]:h-3.5 xl:[&>svg]:w-4 xl:[&>svg]:h-4">
              {getUIPatternIcon(item.uiPattern)}
            </div>
            <h3 id={`item-title-${item.id}`} className="text-title-card-lg xl:text-title-card-xl 2xl:text-title-card-2xl text-gray-900 break-words flex-1 min-w-0 line-clamp-1" title={item.title}>
              {item.title}
            </h3>
            {item.uiPattern === 'EXTERNAL_LINK' && (
              <ExternalLink id={`item-external-link-indicator-${item.id}`} className="w-2.5 h-2.5 xl:w-3 xl:h-3 text-gray-400 flex-shrink-0" />
            )}
          </div>
          
          {/* Eye icon on far right of title row */}
          {item.uiPattern === 'MAP_LAYER' && (
            <div 
              id={`item-map-layer-visibility-toggle-${item.id}`} 
              className="flex-shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                if (!isActiveLayer) {
                  onItemSelect?.(item);
                } else {
                  onLayerToggle?.(item.id);
                }
              }}
              title={isActiveLayer ? "Hide from map" : "Show on map"}
            >
              {isLoadingLayer ? (
                <Loader2 id={`item-layer-loading-spinner-${item.id}`} className="w-4 h-4 xl:w-5 xl:h-5 text-blue-600 animate-spin" />
              ) : isActiveLayer ? (
                <Eye 
                  id={`item-layer-visible-icon-${item.id}`} 
                  className="w-4 h-4 xl:w-5 xl:h-5 text-blue-600 hover:text-blue-700 cursor-pointer"
                />
              ) : (
                <EyeOff 
                  id={`item-layer-hidden-icon-${item.id}`} 
                  className="w-4 h-4 xl:w-5 xl:h-5 text-gray-400 hover:text-gray-600 cursor-pointer"
                />
              )}
            </div>
          )}
        </div>
        
        {/* Full-width content rows */}
        {/* Snippet - line clamped based on breakpoint */}
        {/* Monotonic: lg=1 line → xl=2 lines → 2xl=4 lines */}
        {item.snippet && (
          <p id={`item-snippet-${item.id}`} className={`text-body-lg xl:text-body-xl 2xl:text-body-2xl text-gray-600 mb-gap-element-lg xl:mb-gap-element-xl 2xl:mb-gap-element-2xl break-words ${isExpanded ? '' : 'line-clamp-1 xl:line-clamp-2 2xl:line-clamp-4'}`}>
            {item.snippet}
          </p>
        )}
        
        {/* Badges - single row with overflow indicator when collapsed, wraps when expanded */}
        <div id={`item-badges-${item.id}`} className="relative mb-gap-element-lg xl:mb-gap-element-xl 2xl:mb-gap-element-2xl">
          {isExpanded ? (
            // When expanded, show all badges with wrapping
            <div className="flex flex-wrap gap-gap-tight-lg xl:gap-gap-tight-xl 2xl:gap-gap-tight-2xl">
              <span className="whitespace-nowrap px-btn-compact-x-lg xl:px-btn-compact-x-xl 2xl:px-btn-compact-x-2xl py-btn-compact-y-lg xl:py-btn-compact-y-xl 2xl:py-btn-compact-y-2xl text-label-lg xl:text-label-xl 2xl:text-label-2xl rounded-badge bg-gray-100 text-gray-700">
                {item.type}
              </span>
              {item.mainCategories.map((category) => (
                <span key={category} className="whitespace-nowrap px-btn-compact-x-lg xl:px-btn-compact-x-xl 2xl:px-btn-compact-x-2xl py-btn-compact-y-lg xl:py-btn-compact-y-xl 2xl:py-btn-compact-y-2xl text-label-lg xl:text-label-xl 2xl:text-label-2xl rounded-badge bg-green-100 text-green-700">
                  {category}
                </span>
              ))}
            </div>
          ) : (
            // When collapsed, use FittedBadgeRow for single-row with overflow
            <FittedBadgeRow
              badges={[
                {
                  id: `item-type-badge-${item.id}`,
                  label: item.type,
                  className: 'px-btn-compact-x-lg xl:px-btn-compact-x-xl 2xl:px-btn-compact-x-2xl py-btn-compact-y-lg xl:py-btn-compact-y-xl 2xl:py-btn-compact-y-2xl text-label-lg xl:text-label-xl 2xl:text-label-2xl rounded-badge bg-gray-100 text-gray-700'
                },
                ...item.mainCategories.map((category, idx) => ({
                  id: `item-category-badge-${item.id}-${idx}`,
                  label: category,
                  className: 'px-btn-compact-x-lg xl:px-btn-compact-x-xl 2xl:px-btn-compact-x-2xl py-btn-compact-y-lg xl:py-btn-compact-y-xl 2xl:py-btn-compact-y-2xl text-label-lg xl:text-label-xl 2xl:text-label-2xl rounded-badge bg-green-100 text-green-700'
                }))
              ]}
              gap={4}
            />
          )}
        </div>
        
        {/* Metadata - hidden at lg breakpoint for compactness */}
        <div id={`item-metadata-${item.id}`} className="hidden xl:flex flex-wrap items-center gap-x-gap-element-xl 2xl:gap-x-gap-element-2xl gap-y-gap-tight-xl 2xl:gap-y-gap-tight-2xl text-caption-lg xl:text-caption-xl 2xl:text-caption-2xl text-gray-500">
          <div id={`item-owner-${item.id}`} className="flex items-center gap-gap-tight-xl 2xl:gap-gap-tight-2xl min-w-0">
            <User className="w-2.5 h-2.5 xl:w-3 xl:h-3 flex-shrink-0" />
            <span className="truncate max-w-[100px] xl:max-w-[120px]">{item.owner}</span>
          </div>
          <div id={`item-modified-date-${item.id}`} className="flex items-center gap-gap-tight-xl 2xl:gap-gap-tight-2xl flex-shrink-0">
            <Calendar className="w-2.5 h-2.5 xl:w-3 xl:h-3 flex-shrink-0" />
            <span className="whitespace-nowrap">{new Date(item.modified).toLocaleDateString()}</span>
          </div>
          <div id={`item-view-count-${item.id}`} className="flex items-center gap-gap-tight-xl 2xl:gap-gap-tight-2xl flex-shrink-0">
            <Eye className="w-2.5 h-2.5 xl:w-3 xl:h-3 flex-shrink-0" />
            <span>{item.num_views}</span>
          </div>
        </div>
        
        {/* Expanded content */}
        {isExpanded && (
          <div id={`item-expanded-content-${item.id}`} className="mt-gap-element-lg xl:mt-gap-element-xl 2xl:mt-gap-element-2xl pt-gap-element-lg xl:pt-gap-element-xl 2xl:pt-gap-element-2xl border-t border-gray-200 space-y-gap-element-lg xl:space-y-gap-element-xl 2xl:space-y-gap-element-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Description */}
            {item.description && (
              <div id={`item-description-section-${item.id}`}>
                <h4 id={`item-description-label-${item.id}`} className="text-label-lg xl:text-label-xl 2xl:text-label-2xl font-semibold text-gray-700 uppercase tracking-wide mb-gap-tight-lg xl:mb-gap-tight-xl 2xl:mb-gap-tight-2xl">
                  Description
                </h4>
                <div 
                  id={`item-description-content-${item.id}`}
                  className="text-body-lg xl:text-body-xl 2xl:text-body-2xl text-gray-700 prose prose-sm max-w-none overflow-hidden break-words max-h-24 xl:max-h-32 overflow-y-auto"
                  dangerouslySetInnerHTML={{ __html: item.description }}
                />
              </div>
            )}
            
            {/* Tags */}
            {item.tags.length > 0 && (
              <div id={`item-tags-section-${item.id}`}>
                <h4 id={`item-tags-label-${item.id}`} className="text-label-lg xl:text-label-xl 2xl:text-label-2xl font-semibold text-gray-700 uppercase tracking-wide mb-gap-tight-lg xl:mb-gap-tight-xl 2xl:mb-gap-tight-2xl">
                  Tags
                </h4>
                <div id={`item-tags-list-${item.id}`} className="flex flex-wrap gap-gap-tight-lg xl:gap-gap-tight-xl 2xl:gap-gap-tight-2xl">
                  {item.tags.slice(0, 6).map((tag, index) => (
                    <span
                      key={index}
                      id={`item-tag-${item.id}-${index}`}
                      className="px-btn-compact-x-lg xl:px-btn-compact-x-xl 2xl:px-btn-compact-x-2xl py-btn-compact-y-lg xl:py-btn-compact-y-xl 2xl:py-btn-compact-y-2xl text-label-lg xl:text-label-xl 2xl:text-label-2xl bg-blue-50 text-blue-700 rounded-badge break-words max-w-full"
                    >
                      {tag}
                    </span>
                  ))}
                  {item.tags.length > 6 && (
                    <span id={`item-tags-more-indicator-${item.id}`} className="px-btn-compact-x-lg xl:px-btn-compact-x-xl 2xl:px-btn-compact-x-2xl py-btn-compact-y-lg xl:py-btn-compact-y-xl 2xl:py-btn-compact-y-2xl text-label-lg xl:text-label-xl 2xl:text-label-2xl text-gray-500">
                      +{item.tags.length - 6} more
                    </span>
                  )}
                </div>
              </div>
            )}
            
            {/* Action buttons */}
            <div id={`item-action-buttons-${item.id}`} className="flex gap-gap-element-lg xl:gap-gap-element-xl 2xl:gap-gap-element-2xl pt-gap-element-lg xl:pt-gap-element-xl 2xl:pt-gap-element-2xl">
              {item.uiPattern === 'EXTERNAL_LINK' && (
                <a
                  id={`item-open-resource-button-${item.id}`}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 px-btn-x-lg xl:px-btn-x-xl 2xl:px-btn-x-2xl py-btn-y-lg xl:py-btn-y-xl 2xl:py-btn-y-2xl bg-blue-600 text-white text-body-lg xl:text-body-xl 2xl:text-body-2xl rounded-button hover:bg-blue-700 transition-colors flex items-center justify-center gap-gap-tight-lg xl:gap-gap-tight-xl 2xl:gap-gap-tight-2xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  Open Resource
                  <ExternalLink className="w-3.5 h-3.5 xl:w-4 xl:h-4" />
                </a>
              )}
              {item.uiPattern === 'MODAL' && (
                <>
                  <button
                    id={`item-view-preview-button-${item.id}`}
                    className={`flex-1 px-btn-x-lg xl:px-btn-x-xl 2xl:px-btn-x-2xl py-btn-y-lg xl:py-btn-y-xl 2xl:py-btn-y-2xl text-white text-body-lg xl:text-body-xl 2xl:text-body-2xl rounded-button transition-colors flex items-center justify-center gap-gap-tight-lg xl:gap-gap-tight-xl 2xl:gap-gap-tight-2xl ${
                      selectedModalItem?.id === item.id 
                        ? 'bg-purple-700' 
                        : 'bg-purple-600 hover:bg-purple-700'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (selectedModalItem?.id === item.id) {
                        onModalClose?.();
                      } else {
                        onModalOpen?.(item);
                      }
                    }}
                  >
                    {selectedModalItem?.id === item.id ? 'Close Preview' : 'View Preview'}
                    {selectedModalItem?.id === item.id ? <X className="w-3.5 h-3.5 xl:w-4 xl:h-4" /> : <Eye className="w-3.5 h-3.5 xl:w-4 xl:h-4" />}
                  </button>
                  <a
                    id={`item-open-in-arcgis-button-${item.id}`}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-btn-x-lg xl:px-btn-x-xl 2xl:px-btn-x-2xl py-btn-y-lg xl:py-btn-y-xl 2xl:py-btn-y-2xl bg-gray-100 text-gray-700 text-body-lg xl:text-body-xl 2xl:text-body-2xl rounded-button hover:bg-gray-200 transition-colors flex items-center justify-center gap-gap-tight-lg xl:gap-gap-tight-xl 2xl:gap-gap-tight-2xl"
                    onClick={(e) => e.stopPropagation()}
                    title="Open in ArcGIS Hub"
                  >
                    <ExternalLink className="w-3.5 h-3.5 xl:w-4 xl:h-4" />
                  </a>
                </>
              )}
              {item.uiPattern === 'EXTERNAL_LINK' && (
                <a
                  id={`item-external-link-button-${item.id}`}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-btn-x-lg xl:px-btn-x-xl 2xl:px-btn-x-2xl py-btn-y-lg xl:py-btn-y-xl 2xl:py-btn-y-2xl bg-gray-100 text-gray-700 text-body-lg xl:text-body-xl 2xl:text-body-2xl rounded-button hover:bg-gray-200 transition-colors flex items-center justify-center gap-gap-tight-lg xl:gap-gap-tight-xl 2xl:gap-gap-tight-2xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="w-3.5 h-3.5 xl:w-4 xl:h-4" />
                </a>
              )}
            </div>
          </div>
        )}
        
        {/* Note: Layer controls moved to right sidebar for better UX */}
      </div>
    );
  };

  // Show empty state if no search has been performed
  if (!hasSearched) {
    return (
      <div id="tnc-arcgis-sidebar" className="w-sidebar-left-lg xl:w-sidebar-left-xl 2xl:w-sidebar-left-2xl flex-shrink-0 bg-white border-r border-gray-200 flex flex-col h-full">
        <div id="tnc-empty-state" className="flex flex-col items-center justify-center h-full p-pad-card-lg xl:p-pad-card-xl 2xl:p-pad-card-2xl text-center">
          <div id="search-prompt-icon" className="mb-margin-element-lg xl:mb-margin-element-xl 2xl:mb-margin-element-2xl">
            <svg className="w-16 h-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-title-section-lg xl:text-title-section-xl 2xl:text-title-section-2xl font-medium text-gray-900 mb-gap-tight-lg xl:mb-gap-tight-xl 2xl:mb-gap-tight-2xl">Start Your Search</h3>
          <p className="text-body-lg xl:text-body-xl 2xl:text-body-2xl text-gray-600">
            Enter selection criteria and hit search to see results
          </p>
        </div>
      </div>
    );
  }

  return (
    <div id="tnc-arcgis-sidebar" className="w-sidebar-left-lg xl:w-sidebar-left-xl 2xl:w-sidebar-left-2xl flex-shrink-0 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Back to Data Types - distinct header bar */}
      {onBack && <DataTypeBackHeader onBack={onBack} />}
      
      {/* Header */}
      <div id="tnc-header" className="p-pad-card-lg xl:p-pad-card-xl 2xl:p-pad-card-2xl border-b border-gray-200">
        <div id="tnc-header-top" className="flex items-center justify-between mb-gap-element-lg xl:mb-gap-element-xl 2xl:mb-gap-element-2xl">
          <h2 id="tnc-catalog-title" className="text-title-section-lg xl:text-title-section-xl 2xl:text-title-section-2xl font-semibold text-gray-900">TNC Data Catalog</h2>
          <div id="tnc-header-controls" className="flex items-center gap-gap-tight-lg xl:gap-gap-tight-xl 2xl:gap-gap-tight-2xl">
            <button
              id="tnc-toggle-filters-button"
              onClick={() => setShowFilters(!showFilters)}
              className={`p-btn-y-lg xl:p-btn-y-xl 2xl:p-btn-y-2xl rounded-button transition-colors ${
                showFilters ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title="Toggle filters"
            >
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Search */}
        <div id="tnc-search-container" className="relative mb-gap-element-lg xl:mb-gap-element-xl 2xl:mb-gap-element-2xl">
          <Search id="tnc-search-icon" className="absolute left-gap-element-lg xl:left-gap-element-xl 2xl:left-gap-element-2xl top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            id="tnc-search-input"
            type="text"
            placeholder="Search datasets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-btn-x-lg xl:pr-btn-x-xl 2xl:pr-btn-x-2xl py-btn-y-lg xl:py-btn-y-xl 2xl:py-btn-y-2xl text-body-lg xl:text-body-xl 2xl:text-body-2xl border border-gray-300 rounded-button focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        {/* Stats */}
        <div id="tnc-stats-bar" className="flex items-center justify-between text-label-lg xl:text-label-xl 2xl:text-label-2xl text-gray-600">
          <span id="tnc-total-items-count">{stats.total} items</span>
          <div id="tnc-stats-by-pattern" className="flex items-center gap-gap-element-lg xl:gap-gap-element-xl 2xl:gap-gap-element-2xl">
            <span id="tnc-map-layer-count" className="flex items-center gap-gap-tight-lg xl:gap-gap-tight-xl 2xl:gap-gap-tight-2xl">
              <Map className="w-3 h-3" />
              {stats.byPattern.MAP_LAYER}
            </span>
            <span id="tnc-external-link-count" className="flex items-center gap-gap-tight-lg xl:gap-gap-tight-xl 2xl:gap-gap-tight-2xl">
              <ExternalLink className="w-3 h-3" />
              {stats.byPattern.EXTERNAL_LINK}
            </span>
            <span id="tnc-modal-count" className="flex items-center gap-gap-tight-lg xl:gap-gap-tight-xl 2xl:gap-gap-tight-2xl">
              <FileText className="w-3 h-3" />
              {stats.byPattern.MODAL}
            </span>
          </div>
        </div>
        
        {/* Filters */}
        {showFilters && (
          <div id="tnc-filters-panel" className="mt-gap-element-lg xl:mt-gap-element-xl 2xl:mt-gap-element-2xl p-pad-card-compact-lg xl:p-pad-card-compact-xl 2xl:p-pad-card-compact-2xl bg-gray-50 rounded-card">
            <div id="tnc-filters-header" className="flex items-center justify-between mb-gap-tight-lg xl:mb-gap-tight-xl 2xl:mb-gap-tight-2xl">
              <span id="tnc-filters-label" className="text-body-lg xl:text-body-xl 2xl:text-body-2xl font-medium text-gray-700">Filters</span>
              {(selectedCategories.size > 0 || selectedUIPatterns.size > 0) && (
                <button
                  id="tnc-clear-all-filters-button"
                  onClick={clearFilters}
                  className="text-label-lg xl:text-label-xl 2xl:text-label-2xl text-blue-600 hover:text-blue-800"
                >
                  Clear all
                </button>
              )}
            </div>
            
            {/* Category filters */}
            <div id="tnc-category-filters-section" className="mb-gap-element-lg xl:mb-gap-element-xl 2xl:mb-gap-element-2xl">
              <span id="tnc-category-filters-label" className="text-label-lg xl:text-label-xl 2xl:text-label-2xl text-gray-600 mb-gap-tight-lg xl:mb-gap-tight-xl 2xl:mb-gap-tight-2xl block">Categories</span>
              <div id="tnc-category-filters-list" className="flex flex-wrap gap-gap-tight-lg xl:gap-gap-tight-xl 2xl:gap-gap-tight-2xl">
                {availableCategories.map(category => (
                  <button
                    key={category}
                    id={`tnc-category-filter-${category.toLowerCase().replace(/\s+/g, '-')}`}
                    onClick={() => toggleCategoryFilter(category)}
                    className={`px-btn-compact-x-lg xl:px-btn-compact-x-xl 2xl:px-btn-compact-x-2xl py-btn-compact-y-lg xl:py-btn-compact-y-xl 2xl:py-btn-compact-y-2xl text-label-lg xl:text-label-xl 2xl:text-label-2xl rounded-badge transition-colors ${
                      selectedCategories.has(category)
                        ? 'bg-green-200 text-green-800'
                        : 'bg-white text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
            
            {/* UI Pattern filters */}
            <div id="tnc-data-type-filters-section">
              <span id="tnc-data-type-filters-label" className="text-label-lg xl:text-label-xl 2xl:text-label-2xl text-gray-600 mb-gap-tight-lg xl:mb-gap-tight-xl 2xl:mb-gap-tight-2xl block">Data Types</span>
              <div id="tnc-data-type-filters-list" className="flex flex-wrap gap-gap-tight-lg xl:gap-gap-tight-xl 2xl:gap-gap-tight-2xl">
                {availableUIPatterns.map(pattern => (
                  <button
                    key={pattern}
                    id={`tnc-data-type-filter-${pattern.toLowerCase().replace(/_/g, '-')}`}
                    onClick={() => toggleUIPatternFilter(pattern)}
                    className={`px-btn-compact-x-lg xl:px-btn-compact-x-xl 2xl:px-btn-compact-x-2xl py-btn-compact-y-lg xl:py-btn-compact-y-xl 2xl:py-btn-compact-y-2xl text-label-lg xl:text-label-xl 2xl:text-label-2xl rounded-badge transition-colors flex items-center gap-gap-tight-lg xl:gap-gap-tight-xl 2xl:gap-gap-tight-2xl ${
                      selectedUIPatterns.has(pattern)
                        ? 'bg-blue-200 text-blue-800'
                        : 'bg-white text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {getUIPatternIcon(pattern)}
                    {pattern.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div id="tnc-content" className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div id="tnc-loading-state" className="flex items-center justify-center p-pad-card-lg xl:p-pad-card-xl 2xl:p-pad-card-2xl">
            <div id="tnc-loading-spinner" className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div id="tnc-empty-state" className="flex flex-col items-center justify-center p-pad-card-lg xl:p-pad-card-xl 2xl:p-pad-card-2xl text-gray-500">
            <Database id="tnc-empty-state-icon" className="w-12 h-12 mb-margin-element-lg xl:mb-margin-element-xl 2xl:mb-margin-element-2xl text-gray-300" />
            <p id="tnc-empty-state-title" className="font-medium text-body-lg xl:text-body-xl 2xl:text-body-2xl">No items found</p>
            <p id="tnc-empty-state-message" className="text-body-lg xl:text-body-xl 2xl:text-body-2xl text-center mt-gap-tight-lg xl:mt-gap-tight-xl 2xl:mt-gap-tight-2xl">
              {searchQuery || selectedCategories.size > 0 || selectedUIPatterns.size > 0
                ? 'Try adjusting your search or filters'
                : 'No data available'
              }
            </p>
          </div>
        ) : (
          <div id="tnc-items-list" className="p-pad-card-compact-lg xl:p-pad-card-compact-xl 2xl:p-pad-card-compact-2xl space-y-gap-element-lg xl:space-y-gap-element-xl 2xl:space-y-gap-element-2xl">
            {Object.entries(groupedItems).map(([dataType, typeItems]) => {
              // Determine icon and color for each data type group
              const getGroupIcon = () => {
                switch (dataType) {
                  case 'Map Layers':
                    return <Map className="w-3.5 h-3.5 xl:w-4 xl:h-4 text-blue-600" />;
                  case 'Pages':
                    return <FileText className="w-3.5 h-3.5 xl:w-4 xl:h-4 text-purple-600" />;
                  case 'External Links':
                    return <ExternalLink className="w-3.5 h-3.5 xl:w-4 xl:h-4 text-green-600" />;
                  default:
                    return <Database className="w-3.5 h-3.5 xl:w-4 xl:h-4 text-gray-600" />;
                }
              };

              return (
                <div key={dataType} id={`tnc-data-type-group-${dataType.replace(/\s+/g, '-').toLowerCase()}`}>
                  <button
                    id={`tnc-data-type-toggle-${dataType.replace(/\s+/g, '-').toLowerCase()}`}
                    onClick={() => toggleCategory(dataType)}
                    className="flex items-center justify-between w-full p-pad-card-compact-lg xl:p-pad-card-compact-xl 2xl:p-pad-card-compact-2xl text-left hover:bg-gray-50 rounded-card transition-colors"
                  >
                    <div id={`tnc-data-type-header-${dataType.replace(/\s+/g, '-').toLowerCase()}`} className="flex items-center gap-gap-tight-lg xl:gap-gap-tight-xl 2xl:gap-gap-tight-2xl">
                      {expandedCategories.has(dataType) ? (
                        <ChevronDown id={`tnc-data-type-chevron-down-${dataType.replace(/\s+/g, '-').toLowerCase()}`} className="w-3.5 h-3.5 xl:w-4 xl:h-4 text-gray-400" />
                      ) : (
                        <ChevronRight id={`tnc-data-type-chevron-right-${dataType.replace(/\s+/g, '-').toLowerCase()}`} className="w-3.5 h-3.5 xl:w-4 xl:h-4 text-gray-400" />
                      )}
                      {getGroupIcon()}
                      <span id={`tnc-data-type-name-${dataType.replace(/\s+/g, '-').toLowerCase()}`} className="text-title-card-lg xl:text-title-card-xl 2xl:text-title-card-2xl text-gray-900">{dataType}</span>
                      <span id={`tnc-data-type-count-${dataType.replace(/\s+/g, '-').toLowerCase()}`} className="text-caption-lg xl:text-caption-xl 2xl:text-caption-2xl text-gray-500">({typeItems.length})</span>
                    </div>
                  </button>
                  
                  {expandedCategories.has(dataType) && (
                    <div id={`tnc-data-type-items-${dataType.replace(/\s+/g, '-').toLowerCase()}`} className="mt-gap-tight-lg xl:mt-gap-tight-xl 2xl:mt-gap-tight-2xl space-y-gap-card-grid-lg xl:space-y-gap-card-grid-xl 2xl:space-y-gap-card-grid-2xl pl-gap-section-lg xl:pl-gap-section-xl 2xl:pl-gap-section-2xl">
                      {typeItems.map(renderItem)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};

export default TNCArcGISSidebar;
