import React, { useState, useMemo } from 'react';
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
  X
} from 'lucide-react';
import { TNCArcGISItem } from '../services/tncArcGISService';

interface TNCArcGISSidebarProps {
  items: TNCArcGISItem[];
  isLoading?: boolean;
  onItemSelect?: (item: TNCArcGISItem) => void;
  // Map layer management
  activeLayerIds?: string[];
  onLayerToggle?: (itemId: string) => void;
  onLayerOpacityChange?: (itemId: string, opacity: number) => void;
  // Modal management
  selectedModalItem?: TNCArcGISItem | null;
  onModalOpen?: (item: TNCArcGISItem) => void;
  onModalClose?: () => void;
}

const TNCArcGISSidebar: React.FC<TNCArcGISSidebarProps> = ({
  items,
  isLoading = false,
  onItemSelect,
  activeLayerIds = [],
  onLayerToggle,
  onLayerOpacityChange,
  selectedModalItem,
  onModalOpen,
  onModalClose
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
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

  // Group items by main categories
  const groupedItems = useMemo(() => {
    const groups: { [key: string]: TNCArcGISItem[] } = {};
    
    filteredItems.forEach(item => {
      // If item has no main categories, put it in "Other"
      const categories = item.mainCategories.length > 0 ? item.mainCategories : ['Other'];
      
      categories.forEach(category => {
        if (!groups[category]) {
          groups[category] = [];
        }
        groups[category].push(item);
      });
    });

    // Sort items within each group by title
    Object.keys(groups).forEach(category => {
      groups[category].sort((a, b) => a.title.localeCompare(b.title));
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

  const getUIPatternColor = (pattern: string) => {
    switch (pattern) {
      case 'MAP_LAYER': return 'text-blue-600 bg-blue-50';
      case 'EXTERNAL_LINK': return 'text-green-600 bg-green-50';
      case 'MODAL': return 'text-purple-600 bg-purple-50';
      default: return 'text-gray-600 bg-gray-50';
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
    
    // Always expand the card when clicked
    toggleItemExpansion(item.id);

    switch (item.uiPattern) {
      case 'MAP_LAYER':
        onLayerToggle?.(item.id);
        break;
      case 'EXTERNAL_LINK':
        // Don't open immediately on click, let user use the button in expanded view
        break;
      case 'MODAL':
        onModalOpen?.(item);
        break;
    }
  };

  const renderItem = (item: TNCArcGISItem) => {
    const isActiveLayer = activeLayerIds.includes(item.id);
    const isExpanded = expandedItems.has(item.id);
    
    return (
      <div
        key={item.id}
        id={`tnc-item-${item.id}`}
        className={`p-3 border rounded-lg cursor-pointer transition-all duration-200 ${
          isActiveLayer 
            ? 'bg-blue-50 border-blue-300 shadow-md' 
            : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm'
        }`}
        onClick={() => handleItemClick(item)}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div id={`item-header-${item.id}`} className="flex items-center gap-2 mb-2">
              {isExpanded ? (
                <ChevronDown id={`item-chevron-down-${item.id}`} className="w-4 h-4 text-gray-600 flex-shrink-0" />
              ) : (
                <ChevronRight id={`item-chevron-right-${item.id}`} className="w-4 h-4 text-gray-600 flex-shrink-0" />
              )}
              <div id={`item-ui-pattern-icon-${item.id}`} className="flex-shrink-0">
                {getUIPatternIcon(item.uiPattern)}
              </div>
              <h3 id={`item-title-${item.id}`} className="font-medium text-gray-900 break-words flex-1 min-w-0" title={item.title}>
                {item.title}
              </h3>
              {item.uiPattern === 'EXTERNAL_LINK' && (
                <ExternalLink id={`item-external-link-indicator-${item.id}`} className="w-3 h-3 text-gray-400 flex-shrink-0" />
              )}
            </div>
            
            {item.snippet && (
              <p id={`item-snippet-${item.id}`} className={`text-sm text-gray-600 mb-2 break-words ${isExpanded ? '' : 'line-clamp-2'}`}>
                {item.snippet}
              </p>
            )}
            
            <div id={`item-badges-${item.id}`} className="flex flex-wrap gap-1 mb-2">
              <span id={`item-ui-pattern-badge-${item.id}`} className={`px-2 py-1 text-xs rounded-full ${getUIPatternColor(item.uiPattern)}`}>
                {item.uiPattern.replace('_', ' ')}
              </span>
              <span id={`item-type-badge-${item.id}`} className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">
                {item.type}
              </span>
              {item.mainCategories.slice(0, isExpanded ? undefined : 2).map((category, idx) => (
                <span key={category} id={`item-category-badge-${item.id}-${idx}`} className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">
                  {category}
                </span>
              ))}
            </div>
            
            <div id={`item-metadata-${item.id}`} className="flex items-center gap-4 text-xs text-gray-500">
              <div id={`item-owner-${item.id}`} className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {item.owner}
              </div>
              <div id={`item-modified-date-${item.id}`} className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(item.modified).toLocaleDateString()}
              </div>
              <div id={`item-view-count-${item.id}`} className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {item.num_views}
              </div>
            </div>
          </div>
          
          {item.uiPattern === 'MAP_LAYER' && (
            <div id={`item-map-layer-visibility-toggle-${item.id}`} className="flex items-center gap-2 ml-2">
              {isActiveLayer ? (
                <Eye id={`item-layer-visible-icon-${item.id}`} className="w-5 h-5 text-blue-600" />
              ) : (
                <EyeOff id={`item-layer-hidden-icon-${item.id}`} className="w-5 h-5 text-gray-400" />
              )}
            </div>
          )}
        </div>
        
        {/* Expanded content */}
        {isExpanded && (
          <div id={`item-expanded-content-${item.id}`} className="mt-3 pt-3 border-t border-gray-200 space-y-3" onClick={(e) => e.stopPropagation()}>
            {/* Description */}
            {item.description && (
              <div id={`item-description-section-${item.id}`}>
                <h4 id={`item-description-label-${item.id}`} className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">
                  Description
                </h4>
                <div 
                  id={`item-description-content-${item.id}`}
                  className="text-sm text-gray-700 prose prose-sm max-w-none overflow-hidden break-words max-h-32 overflow-y-auto"
                  dangerouslySetInnerHTML={{ __html: item.description }}
                />
              </div>
            )}
            
            {/* Tags */}
            {item.tags.length > 0 && (
              <div id={`item-tags-section-${item.id}`}>
                <h4 id={`item-tags-label-${item.id}`} className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">
                  Tags
                </h4>
                <div id={`item-tags-list-${item.id}`} className="flex flex-wrap gap-1">
                  {item.tags.slice(0, 8).map((tag, index) => (
                    <span
                      key={index}
                      id={`item-tag-${item.id}-${index}`}
                      className="px-2 py-0.5 text-xs bg-blue-50 text-blue-700 rounded break-words max-w-full"
                    >
                      {tag}
                    </span>
                  ))}
                  {item.tags.length > 8 && (
                    <span id={`item-tags-more-indicator-${item.id}`} className="px-2 py-0.5 text-xs text-gray-500">
                      +{item.tags.length - 8} more
                    </span>
                  )}
                </div>
              </div>
            )}
            
            {/* Action buttons */}
            <div id={`item-action-buttons-${item.id}`} className="flex gap-2 pt-2">
              {item.uiPattern === 'EXTERNAL_LINK' && (
                <a
                  id={`item-open-resource-button-${item.id}`}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  Open Resource
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
              {item.uiPattern === 'MODAL' && (
                <button
                  id={`item-view-details-button-${item.id}`}
                  className="flex-1 px-3 py-2 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    onModalOpen?.(item);
                  }}
                >
                  View Details
                  <FileText className="w-4 h-4" />
                </button>
              )}
              <a
                id={`item-external-link-button-${item.id}`}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        )}
        
        {/* Layer opacity control for active map layers */}
        {item.uiPattern === 'MAP_LAYER' && isActiveLayer && onLayerOpacityChange && (
          <div id={`item-opacity-control-${item.id}`} className="mt-3 pt-3 border-t border-blue-200" onClick={(e) => e.stopPropagation()}>
            <label id={`item-opacity-label-${item.id}`} className="block text-xs text-gray-600 mb-1">Opacity</label>
            <input
              id={`item-opacity-slider-${item.id}`}
              type="range"
              min="0"
              max="100"
              defaultValue="80"
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              onChange={(e) => onLayerOpacityChange(item.id, Number(e.target.value))}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div id="tnc-arcgis-sidebar" className="w-96 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div id="tnc-header" className="p-4 border-b border-gray-200">
        <div id="tnc-header-top" className="flex items-center justify-between mb-3">
          <h2 id="tnc-catalog-title" className="text-lg font-semibold text-gray-900">TNC Data Catalog</h2>
          <div id="tnc-header-controls" className="flex items-center gap-2">
            <button
              id="tnc-toggle-filters-button"
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg transition-colors ${
                showFilters ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title="Toggle filters"
            >
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Search */}
        <div id="tnc-search-container" className="relative mb-3">
          <Search id="tnc-search-icon" className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            id="tnc-search-input"
            type="text"
            placeholder="Search datasets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        {/* Stats */}
        <div id="tnc-stats-bar" className="flex items-center justify-between text-sm text-gray-600">
          <span id="tnc-total-items-count">{stats.total} items</span>
          <div id="tnc-stats-by-pattern" className="flex items-center gap-3">
            <span id="tnc-map-layer-count" className="flex items-center gap-1">
              <Map className="w-3 h-3" />
              {stats.byPattern.MAP_LAYER}
            </span>
            <span id="tnc-external-link-count" className="flex items-center gap-1">
              <ExternalLink className="w-3 h-3" />
              {stats.byPattern.EXTERNAL_LINK}
            </span>
            <span id="tnc-modal-count" className="flex items-center gap-1">
              <FileText className="w-3 h-3" />
              {stats.byPattern.MODAL}
            </span>
          </div>
        </div>
        
        {/* Filters */}
        {showFilters && (
          <div id="tnc-filters-panel" className="mt-3 p-3 bg-gray-50 rounded-lg">
            <div id="tnc-filters-header" className="flex items-center justify-between mb-2">
              <span id="tnc-filters-label" className="text-sm font-medium text-gray-700">Filters</span>
              {(selectedCategories.size > 0 || selectedUIPatterns.size > 0) && (
                <button
                  id="tnc-clear-all-filters-button"
                  onClick={clearFilters}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Clear all
                </button>
              )}
            </div>
            
            {/* Category filters */}
            <div id="tnc-category-filters-section" className="mb-3">
              <span id="tnc-category-filters-label" className="text-xs text-gray-600 mb-1 block">Categories</span>
              <div id="tnc-category-filters-list" className="flex flex-wrap gap-1">
                {availableCategories.map(category => (
                  <button
                    key={category}
                    id={`tnc-category-filter-${category.toLowerCase().replace(/\s+/g, '-')}`}
                    onClick={() => toggleCategoryFilter(category)}
                    className={`px-2 py-1 text-xs rounded transition-colors ${
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
              <span id="tnc-data-type-filters-label" className="text-xs text-gray-600 mb-1 block">Data Types</span>
              <div id="tnc-data-type-filters-list" className="flex flex-wrap gap-1">
                {availableUIPatterns.map(pattern => (
                  <button
                    key={pattern}
                    id={`tnc-data-type-filter-${pattern.toLowerCase().replace(/_/g, '-')}`}
                    onClick={() => toggleUIPatternFilter(pattern)}
                    className={`px-2 py-1 text-xs rounded transition-colors flex items-center gap-1 ${
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
          <div id="tnc-loading-state" className="flex items-center justify-center p-8">
            <div id="tnc-loading-spinner" className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div id="tnc-empty-state" className="flex flex-col items-center justify-center p-8 text-gray-500">
            <Database id="tnc-empty-state-icon" className="w-12 h-12 mb-4 text-gray-300" />
            <p id="tnc-empty-state-title" className="font-medium">No items found</p>
            <p id="tnc-empty-state-message" className="text-sm text-center mt-1">
              {searchQuery || selectedCategories.size > 0 || selectedUIPatterns.size > 0
                ? 'Try adjusting your search or filters'
                : 'No data available'
              }
            </p>
          </div>
        ) : (
          <div id="tnc-items-list" className="p-4 space-y-6">
            {Object.entries(groupedItems).map(([category, categoryItems]) => (
              <div key={category} id={`tnc-category-group-${category.replace(/\s+/g, '-').toLowerCase()}`}>
                <button
                  id={`tnc-category-toggle-${category.replace(/\s+/g, '-').toLowerCase()}`}
                  onClick={() => toggleCategory(category)}
                  className="flex items-center justify-between w-full p-2 text-left hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div id={`tnc-category-header-${category.replace(/\s+/g, '-').toLowerCase()}`} className="flex items-center gap-2">
                    {expandedCategories.has(category) ? (
                      <ChevronDown id={`tnc-category-chevron-down-${category.replace(/\s+/g, '-').toLowerCase()}`} className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronRight id={`tnc-category-chevron-right-${category.replace(/\s+/g, '-').toLowerCase()}`} className="w-4 h-4 text-gray-400" />
                    )}
                    <span id={`tnc-category-name-${category.replace(/\s+/g, '-').toLowerCase()}`} className="font-medium text-gray-900">{category}</span>
                    <span id={`tnc-category-count-${category.replace(/\s+/g, '-').toLowerCase()}`} className="text-sm text-gray-500">({categoryItems.length})</span>
                  </div>
                </button>
                
                {expandedCategories.has(category) && (
                  <div id={`tnc-category-items-${category.replace(/\s+/g, '-').toLowerCase()}`} className="mt-2 space-y-2 pl-6">
                    {categoryItems.map(renderItem)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {selectedModalItem && onModalClose && (
        <div id="tnc-modal-overlay" className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div id="tnc-modal-container" className="bg-white rounded-lg shadow-xl max-w-4xl max-h-[90vh] w-full mx-4 flex flex-col">
            <div id="tnc-modal-header" className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 id="tnc-modal-title" className="text-lg font-semibold text-gray-900">{selectedModalItem.title}</h3>
              <button
                id="tnc-modal-close-button"
                onClick={onModalClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div id="tnc-modal-content" className="flex-1 overflow-y-auto p-4">
              {selectedModalItem.type === 'StoryMap' ? (
                <iframe
                  id="tnc-modal-storymap-iframe"
                  src={selectedModalItem.url}
                  className="w-full h-96 border rounded-lg"
                  title={selectedModalItem.title}
                  sandbox="allow-scripts allow-same-origin"
                />
              ) : (
                <div id="tnc-modal-details" className="space-y-4">
                  <div id="tnc-modal-description-section">
                    <h4 id="tnc-modal-description-label" className="font-medium text-gray-900 mb-2">Description</h4>
                    <p id="tnc-modal-description-text" className="text-gray-700 break-words">{selectedModalItem.description || selectedModalItem.snippet}</p>
                  </div>
                  
                  {selectedModalItem.tags.length > 0 && (
                    <div id="tnc-modal-tags-section">
                      <h4 id="tnc-modal-tags-label" className="font-medium text-gray-900 mb-2">Tags</h4>
                      <div id="tnc-modal-tags-list" className="flex flex-wrap gap-1">
                        {selectedModalItem.tags.map((tag, idx) => (
                          <span key={tag} id={`tnc-modal-tag-${idx}`} className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded break-words">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div id="tnc-modal-metadata" className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                    <span id="tnc-modal-owner" className="break-words">Owner: {selectedModalItem.owner}</span>
                    <span id="tnc-modal-type" className="break-words">Type: {selectedModalItem.type}</span>
                    <span id="tnc-modal-views">Views: {selectedModalItem.num_views}</span>
                  </div>
                  
                  <div id="tnc-modal-actions" className="pt-4 border-t border-gray-200">
                    <a
                      id="tnc-modal-view-in-arcgis-button"
                      href={selectedModalItem.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View in ArcGIS
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TNCArcGISSidebar;
