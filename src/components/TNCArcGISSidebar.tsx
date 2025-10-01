import React, { useState, useMemo } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  Map, 
  ExternalLink, 
  FileText, 
  Download, 
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
  onExportCSV?: () => void;
  onExportGeoJSON?: () => void;
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
  onExportCSV,
  onExportGeoJSON,
  onItemSelect,
  activeLayerIds = [],
  onLayerToggle,
  onLayerOpacityChange,
  selectedModalItem,
  onModalOpen,
  onModalClose
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
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

  const handleItemClick = (item: TNCArcGISItem) => {
    onItemSelect?.(item);

    switch (item.uiPattern) {
      case 'MAP_LAYER':
        onLayerToggle?.(item.id);
        break;
      case 'EXTERNAL_LINK':
        window.open(item.url, '_blank', 'noopener,noreferrer');
        break;
      case 'MODAL':
        onModalOpen?.(item);
        break;
    }
  };

  const renderItem = (item: TNCArcGISItem) => {
    const isActiveLayer = activeLayerIds.includes(item.id);
    
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
            <div className="flex items-center gap-2 mb-2">
              {getUIPatternIcon(item.uiPattern)}
              <h3 className="font-medium text-gray-900 truncate" title={item.title}>
                {item.title}
              </h3>
              {item.uiPattern === 'EXTERNAL_LINK' && (
                <ExternalLink className="w-3 h-3 text-gray-400 flex-shrink-0" />
              )}
            </div>
            
            {item.snippet && (
              <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                {item.snippet}
              </p>
            )}
            
            <div className="flex flex-wrap gap-1 mb-2">
              <span className={`px-2 py-1 text-xs rounded-full ${getUIPatternColor(item.uiPattern)}`}>
                {item.uiPattern.replace('_', ' ')}
              </span>
              <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">
                {item.type}
              </span>
              {item.mainCategories.slice(0, 2).map(category => (
                <span key={category} className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">
                  {category}
                </span>
              ))}
            </div>
            
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {item.owner}
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(item.modified).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {item.num_views}
              </div>
            </div>
          </div>
          
          {item.uiPattern === 'MAP_LAYER' && (
            <div className="flex items-center gap-2 ml-2">
              {isActiveLayer ? (
                <EyeOff className="w-4 h-4 text-blue-600" />
              ) : (
                <Eye className="w-4 h-4 text-gray-400" />
              )}
            </div>
          )}
        </div>
        
        {/* Layer opacity control for active map layers */}
        {item.uiPattern === 'MAP_LAYER' && isActiveLayer && onLayerOpacityChange && (
          <div className="mt-3 pt-3 border-t border-blue-200">
            <label className="block text-xs text-gray-600 mb-1">Opacity</label>
            <input
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
    <div id="tnc-arcgis-sidebar" className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div id="tnc-header" className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">TNC Data Catalog</h2>
          <div className="flex items-center gap-2">
            <button
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
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search datasets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>{stats.total} items</span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Map className="w-3 h-3" />
              {stats.byPattern.MAP_LAYER}
            </span>
            <span className="flex items-center gap-1">
              <ExternalLink className="w-3 h-3" />
              {stats.byPattern.EXTERNAL_LINK}
            </span>
            <span className="flex items-center gap-1">
              <FileText className="w-3 h-3" />
              {stats.byPattern.MODAL}
            </span>
          </div>
        </div>
        
        {/* Filters */}
        {showFilters && (
          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Filters</span>
              {(selectedCategories.size > 0 || selectedUIPatterns.size > 0) && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Clear all
                </button>
              )}
            </div>
            
            {/* Category filters */}
            <div className="mb-3">
              <span className="text-xs text-gray-600 mb-1 block">Categories</span>
              <div className="flex flex-wrap gap-1">
                {availableCategories.map(category => (
                  <button
                    key={category}
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
            <div>
              <span className="text-xs text-gray-600 mb-1 block">Data Types</span>
              <div className="flex flex-wrap gap-1">
                {availableUIPatterns.map(pattern => (
                  <button
                    key={pattern}
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

      {/* Export buttons */}
      {(onExportCSV || onExportGeoJSON) && (
        <div id="tnc-export-controls" className="p-4 border-b border-gray-200">
          <div className="flex gap-2">
            {onExportCSV && (
              <button
                onClick={onExportCSV}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                <Download className="w-4 h-4" />
                CSV
              </button>
            )}
            {onExportGeoJSON && (
              <button
                onClick={onExportGeoJSON}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                <Download className="w-4 h-4" />
                GeoJSON
              </button>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div id="tnc-content" className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-gray-500">
            <Database className="w-12 h-12 mb-4 text-gray-300" />
            <p className="font-medium">No items found</p>
            <p className="text-sm text-center mt-1">
              {searchQuery || selectedCategories.size > 0 || selectedUIPatterns.size > 0
                ? 'Try adjusting your search or filters'
                : 'No data available'
              }
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-6">
            {Object.entries(groupedItems).map(([category, categoryItems]) => (
              <div key={category} id={`tnc-category-${category.replace(/\s+/g, '-').toLowerCase()}`}>
                <button
                  onClick={() => toggleCategory(category)}
                  className="flex items-center justify-between w-full p-2 text-left hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {expandedCategories.has(category) ? (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    )}
                    <span className="font-medium text-gray-900">{category}</span>
                    <span className="text-sm text-gray-500">({categoryItems.length})</span>
                  </div>
                </button>
                
                {expandedCategories.has(category) && (
                  <div className="mt-2 space-y-2 pl-6">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl max-h-[90vh] w-full mx-4 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">{selectedModalItem.title}</h3>
              <button
                onClick={onModalClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {selectedModalItem.type === 'StoryMap' ? (
                <iframe
                  src={selectedModalItem.url}
                  className="w-full h-96 border rounded-lg"
                  title={selectedModalItem.title}
                  sandbox="allow-scripts allow-same-origin"
                />
              ) : (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                    <p className="text-gray-700">{selectedModalItem.description || selectedModalItem.snippet}</p>
                  </div>
                  
                  {selectedModalItem.tags.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Tags</h4>
                      <div className="flex flex-wrap gap-1">
                        {selectedModalItem.tags.map(tag => (
                          <span key={tag} className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>Owner: {selectedModalItem.owner}</span>
                    <span>Type: {selectedModalItem.type}</span>
                    <span>Views: {selectedModalItem.num_views}</span>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-200">
                    <a
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
