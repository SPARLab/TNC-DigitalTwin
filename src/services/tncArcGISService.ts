import categoryMappings from '../data-sources/tnc-arcgis/category_mappings.json';

export interface TNCArcGISItem {
  id: string;
  title: string;
  type: string; // "Feature Service", "Image Service", "Map Service", "Web Experience", etc.
  description: string;
  snippet: string;
  url: string;
  owner: string;
  tags: string[];
  categories: string[]; // Hierarchical paths like "/Categories/Environment/Freshwater"
  collection: "dataset" | "appAndMap" | "document";
  num_views: number;
  size: number;
  created: number; // timestamp
  modified: number; // timestamp
  thumbnail?: string;
  // Additional fields for UI patterns
  uiPattern: 'MAP_LAYER' | 'EXTERNAL_LINK' | 'MODAL';
  mainCategories: string[]; // Mapped categories using our mapping system
}

export interface TNCArcGISResponse {
  total_results: number;
  results: TNCArcGISItem[];
  dataSource: string;
}

class TNCArcGISService {
  private readonly baseUrl = 'https://dangermondpreserve-tnc.hub.arcgis.com/api/search/v1/collections';
  private lastRequestTime = 0;
  private readonly minRequestInterval = 500; // 0.5 second between requests

  // Define which data types map to which UI patterns
  private readonly uiPatternMappings = {
    MAP_LAYER: [
      'Feature Service',
      'Image Service', 
      'Map Service',
      'Vector Tile Service',
      'Scene Service',
      'WMS',
      'WFS',
      'KML'
    ],
    EXTERNAL_LINK: [
      'Web Experience',
      'Dashboard',
      'Web Mapping Application',
      'Operations Dashboard',
      'Insights Workbook',
      'Hub Initiative',
      'Site Application'
    ],
    MODAL: [
      'StoryMap',
      'Web Map',
      'Feature Collection',
      'CSV',
      'Shapefile',
      'File Geodatabase',
      'CAD Drawing',
      'PDF',
      'Microsoft Word',
      'Microsoft Excel',
      'Microsoft PowerPoint'
    ]
  };

  /**
   * Rate limiting helper
   */
  private async waitForRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.minRequestInterval) {
      const waitTime = this.minRequestInterval - timeSinceLastRequest;
      console.log(`TNC ArcGIS rate limiting: waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequestTime = Date.now();
  }

  /**
   * Categorize an item using the mapping system
   */
  private categorizeItem(item: any): string[] {
    const itemTags = item.tags || [];
    const itemCategories = item.categories || [];
    const matchedCategories = new Set<string>();
    
    // Check tag mappings
    for (const [mainCategory, tags] of Object.entries(categoryMappings.mappings.tags)) {
      if (itemTags.some((tag: string) => tags.includes(tag))) {
        matchedCategories.add(mainCategory);
      }
    }
    
    // Check category mappings (extract last part of hierarchical path)
    const itemCategoryNames = itemCategories.map((cat: string) => cat.split('/').pop()).filter(Boolean);
    for (const [mainCategory, categories] of Object.entries(categoryMappings.mappings.categories)) {
      if (itemCategoryNames.some((cat: string) => categories.includes(cat))) {
        matchedCategories.add(mainCategory);
      }
    }
    
    return Array.from(matchedCategories);
  }

  /**
   * Determine UI pattern for an item based on its type
   */
  private getUIPattern(type: string): 'MAP_LAYER' | 'EXTERNAL_LINK' | 'MODAL' {
    for (const [pattern, types] of Object.entries(this.uiPatternMappings)) {
      if (types.includes(type)) {
        return pattern as 'MAP_LAYER' | 'EXTERNAL_LINK' | 'MODAL';
      }
    }
    // Default to MODAL for unknown types
    return 'MODAL';
  }

  /**
   * Transform API response item to our interface
   */
  private transformItem(feature: any, collection: string): TNCArcGISItem {
    // API returns feature.properties, not feature.attributes
    const attrs = feature.properties || feature.attributes || {};
    
    // Extract categories from hierarchical paths
    const categories = attrs.categories ? 
      (Array.isArray(attrs.categories) ? attrs.categories : [attrs.categories]) : [];
    
    const mainCategories = this.categorizeItem({
      tags: attrs.tags,
      categories: categories
    });

    const uiPattern = this.getUIPattern(attrs.type);

    return {
      id: feature.id || attrs.id || `tnc-${Math.random().toString(36).substr(2, 9)}`,
      title: attrs.title || attrs.name || 'Untitled',
      type: attrs.type || 'Unknown',
      description: attrs.description || attrs.snippet || '',
      snippet: attrs.snippet || attrs.description || '',
      url: attrs.url || attrs.itemURL || '',
      owner: attrs.owner || 'TNC',
      tags: attrs.tags || [],
      categories: categories,
      collection: collection as "dataset" | "appAndMap" | "document",
      num_views: attrs.numViews || attrs.num_views || 0,
      size: attrs.size || 0,
      created: attrs.created || Date.now(),
      modified: attrs.modified || Date.now(),
      thumbnail: attrs.thumbnail,
      uiPattern,
      mainCategories
    };
  }

  /**
   * Fetch items from a specific collection
   */
  private async fetchCollection(collection: string, limit: number = 100): Promise<any[]> {
    await this.waitForRateLimit();

    const url = `${this.baseUrl}/${collection}/items?limit=${limit}`;
    console.log(`🌐 Fetching TNC ${collection} data from:`, url);

    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`TNC ArcGIS API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(`TNC ArcGIS API error: ${data.error.message}`);
      }

      // API returns { features: [...] } not { data: [...] }
      const items = data.features || data.data || [];
      console.log(`📊 TNC ${collection}: ${items.length} items fetched`);
      
      return items;
    } catch (error) {
      console.error(`Error fetching TNC ${collection}:`, error);
      throw error;
    }
  }

  /**
   * Get all datasets from TNC ArcGIS Hub
   */
  async getDatasets(options: {
    maxResults?: number;
    categoryFilter?: string[];
    typeFilter?: string[];
    searchQuery?: string;
  } = {}): Promise<TNCArcGISResponse> {
    const { maxResults = 100 } = options;

    try {
      const features = await this.fetchCollection('dataset', maxResults);
      
      // Filter out Hub Pages as requested
      const filteredFeatures = features.filter(feature => 
        feature.attributes?.type !== 'Hub Page'
      );
      
      const results = filteredFeatures.map(feature => 
        this.transformItem(feature, 'dataset')
      );

      // Apply additional filters if specified
      let filteredResults = results;
      
      if (options.categoryFilter && options.categoryFilter.length > 0) {
        filteredResults = filteredResults.filter(item =>
          item.mainCategories.some(cat => options.categoryFilter!.includes(cat))
        );
      }
      
      if (options.typeFilter && options.typeFilter.length > 0) {
        filteredResults = filteredResults.filter(item =>
          options.typeFilter!.includes(item.type)
        );
      }
      
      if (options.searchQuery) {
        const query = options.searchQuery.toLowerCase();
        filteredResults = filteredResults.filter(item => {
          const searchableText = `${item.title} ${item.description} ${item.snippet} ${item.tags.join(' ')}`.toLowerCase();
          return searchableText.includes(query);
        });
      }

      return {
        total_results: filteredResults.length,
        results: filteredResults,
        dataSource: 'TNC ArcGIS Hub - Datasets'
      };
    } catch (error) {
      console.error('Error fetching TNC datasets:', error);
      throw error;
    }
  }

  /**
   * Get all documents from TNC ArcGIS Hub
   */
  async getDocuments(options: {
    maxResults?: number;
    categoryFilter?: string[];
    typeFilter?: string[];
    searchQuery?: string;
  } = {}): Promise<TNCArcGISResponse> {
    const { maxResults = 100 } = options;

    try {
      const features = await this.fetchCollection('document', maxResults);
      
      // Filter out Hub Pages as requested
      const filteredFeatures = features.filter(feature => 
        feature.attributes?.type !== 'Hub Page'
      );
      
      const results = filteredFeatures.map(feature => 
        this.transformItem(feature, 'document')
      );

      // Apply additional filters if specified
      let filteredResults = results;
      
      if (options.categoryFilter && options.categoryFilter.length > 0) {
        filteredResults = filteredResults.filter(item =>
          item.mainCategories.some(cat => options.categoryFilter!.includes(cat))
        );
      }
      
      if (options.typeFilter && options.typeFilter.length > 0) {
        filteredResults = filteredResults.filter(item =>
          options.typeFilter!.includes(item.type)
        );
      }
      
      if (options.searchQuery) {
        const query = options.searchQuery.toLowerCase();
        filteredResults = filteredResults.filter(item => {
          const searchableText = `${item.title} ${item.description} ${item.snippet} ${item.tags.join(' ')}`.toLowerCase();
          return searchableText.includes(query);
        });
      }

      return {
        total_results: filteredResults.length,
        results: filteredResults,
        dataSource: 'TNC ArcGIS Hub - Documents'
      };
    } catch (error) {
      console.error('Error fetching TNC documents:', error);
      throw error;
    }
  }

  /**
   * Get all items (datasets + documents) from TNC ArcGIS Hub
   */
  async getAllItems(options: {
    maxResults?: number;
    categoryFilter?: string[];
    typeFilter?: string[];
    searchQuery?: string;
    includeAppsAndMaps?: boolean; // Optional: include apps & maps for future use
  } = {}): Promise<TNCArcGISResponse> {
    const { includeAppsAndMaps = false } = options;

    try {
      // Fetch datasets and documents in parallel
      const [datasetsResponse, documentsResponse] = await Promise.all([
        this.getDatasets(options),
        this.getDocuments(options)
      ]);

      let allResults = [
        ...datasetsResponse.results,
        ...documentsResponse.results
      ];

      // Optionally include apps & maps for future use
      if (includeAppsAndMaps) {
        const appsResponse = await this.getAppsAndMaps(options);
        allResults = [...allResults, ...appsResponse.results];
      }

      return {
        total_results: allResults.length,
        results: allResults,
        dataSource: 'TNC ArcGIS Hub - All Items'
      };
    } catch (error) {
      console.error('Error fetching all TNC items:', error);
      throw error;
    }
  }

  /**
   * Get apps and maps (for future use if needed)
   */
  async getAppsAndMaps(options: {
    maxResults?: number;
    categoryFilter?: string[];
    typeFilter?: string[];
    searchQuery?: string;
  } = {}): Promise<TNCArcGISResponse> {
    const { maxResults = 100 } = options;

    try {
      const features = await this.fetchCollection('appAndMap', maxResults);
      
      // Filter out Hub Pages as requested
      const filteredFeatures = features.filter(feature => 
        feature.attributes?.type !== 'Hub Page'
      );
      
      const results = filteredFeatures.map(feature => 
        this.transformItem(feature, 'appAndMap')
      );

      // Apply additional filters if specified
      let filteredResults = results;
      
      if (options.categoryFilter && options.categoryFilter.length > 0) {
        filteredResults = filteredResults.filter(item =>
          item.mainCategories.some(cat => options.categoryFilter!.includes(cat))
        );
      }
      
      if (options.typeFilter && options.typeFilter.length > 0) {
        filteredResults = filteredResults.filter(item =>
          options.typeFilter!.includes(item.type)
        );
      }
      
      if (options.searchQuery) {
        const query = options.searchQuery.toLowerCase();
        filteredResults = filteredResults.filter(item => {
          const searchableText = `${item.title} ${item.description} ${item.snippet} ${item.tags.join(' ')}`.toLowerCase();
          return searchableText.includes(query);
        });
      }

      return {
        total_results: filteredResults.length,
        results: filteredResults,
        dataSource: 'TNC ArcGIS Hub - Apps & Maps'
      };
    } catch (error) {
      console.error('Error fetching TNC apps & maps:', error);
      throw error;
    }
  }

  /**
   * Get available main categories from the mapping system
   */
  getMainCategories(): string[] {
    return categoryMappings.main_categories;
  }

  /**
   * Get available data types for filtering
   */
  getDataTypes(): Array<{ value: string; label: string; pattern: string }> {
    const allTypes = new Set<string>();
    
    // Collect all types from UI pattern mappings
    Object.values(this.uiPatternMappings).forEach(types => {
      types.forEach(type => allTypes.add(type));
    });

    return Array.from(allTypes).map(type => ({
      value: type,
      label: type,
      pattern: this.getUIPattern(type)
    })).sort((a, b) => a.label.localeCompare(b.label));
  }

  /**
   * Get UI pattern statistics for the current data
   */
  async getUIPatternStats(): Promise<Record<string, number>> {
    try {
      const response = await this.getAllItems();
      const stats: Record<string, number> = {
        MAP_LAYER: 0,
        EXTERNAL_LINK: 0,
        MODAL: 0
      };

      response.results.forEach(item => {
        stats[item.uiPattern]++;
      });

      return stats;
    } catch (error) {
      console.error('Error getting UI pattern stats:', error);
      return { MAP_LAYER: 0, EXTERNAL_LINK: 0, MODAL: 0 };
    }
  }
}

export const tncArcGISAPI = new TNCArcGISService();

