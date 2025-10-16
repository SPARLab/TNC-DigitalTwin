import categoryMappings from '../data-sources/tnc-arcgis/category_mappings.json';

export interface ServiceLayerInfo {
  id: number;
  name: string;
  type: string; // "Feature Layer", "Raster Layer", "Group Layer", etc.
  description?: string;
  geometryType?: string; // "esriGeometryPoint", "esriGeometryPolygon", etc.
  minScale?: number;
  maxScale?: number;
}

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
  legendData?: any; // Legend information fetched for map layers
  // Multi-layer support
  availableLayers?: ServiceLayerInfo[]; // Available layers in the service
  selectedLayerId?: number; // Currently selected layer ID (for services with multiple layers)
  // Performance warnings
  renderingWarning?: {
    type: 'large-untiled-image' | 'high-density';
    message: string;
    details?: {
      isTiled?: boolean;
      pixelCount?: number;
      sizeDescription?: string;
    };
  };
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
      'Hub Page',
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
      // console.log(`TNC ArcGIS rate limiting: waiting ${waitTime}ms`);
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
    const itemTitle = item.title || '';
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
    
    // Check title-based mappings (for Hub Pages and other items without tags/categories)
    if (categoryMappings.mappings.titles) {
      for (const [mainCategory, titlePatterns] of Object.entries(categoryMappings.mappings.titles)) {
        if (titlePatterns.some((pattern: string) => 
          itemTitle.toLowerCase().includes(pattern.toLowerCase())
        )) {
          matchedCategories.add(mainCategory);
        }
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
      categories: categories,
      title: attrs.title
    });

    const uiPattern = this.getUIPattern(attrs.type);

    // Construct URL for items that don't have URLs in the API response
    let url = attrs.url || attrs.itemURL || '';
    if (!url && feature.id) {
      const itemId = feature.id;
      // const orgId = attrs.orgId || 'F7DSX1DSNSiWmOqh';
      
      // Different URL patterns for different content types
      if (attrs.type === 'Hub Page') {
        url = `https://dangermondpreserve-tnc.hub.arcgis.com/pages/${itemId}`;
      } else if (attrs.type === 'Feature Collection' || attrs.type === 'CSV' || 
                 attrs.type === 'Shapefile' || attrs.type === 'File Geodatabase' || 
                 attrs.type === 'CAD Drawing') {
        // For datasets, use the Hub datasets page
        url = `https://dangermondpreserve-tnc.hub.arcgis.com/datasets/${itemId}`;
      } else if (attrs.type === 'StoryMap') {
        url = `https://storymaps.arcgis.com/stories/${itemId}`;
      } else if (attrs.type === 'Web Map') {
        url = `https://tnc.maps.arcgis.com/home/webmap/viewer.html?webmap=${itemId}`;
      } else if (attrs.type === 'Dashboard') {
        url = `https://tnc.maps.arcgis.com/apps/dashboards/${itemId}`;
      } else {
        // Generic fallback to ArcGIS Online item page
        url = `https://tnc.maps.arcgis.com/home/item.html?id=${itemId}`;
      }
    }

    return {
      id: feature.id || attrs.id || `tnc-${Math.random().toString(36).substr(2, 9)}`,
      title: attrs.title || attrs.name || 'Untitled',
      type: attrs.type || 'Unknown',
      description: attrs.description || attrs.snippet || '',
      snippet: attrs.snippet || attrs.description || '',
      url,
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
      // console.log(`🌐 Fetching TNC ${collection} data from:`, url);

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
      // console.log(`📊 TNC ${collection}: ${items.length} items fetched`);
      
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
      
      // Include Hub Pages now that we can construct URLs for them
      const results = features.map(feature => 
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

  /**
   * Fetch all available layers from a service (with shorter timeout for prefetching)
   * Works with FeatureServer, MapServer, and ImageServer
   */
  async prefetchServiceLayers(serviceUrl: string): Promise<ServiceLayerInfo[]> {
    return this._fetchServiceLayersWithTimeout(serviceUrl, 4000); // 4 second timeout for prefetch
  }

  /**
   * Fetch all available layers from a service
   * Works with FeatureServer, MapServer, and ImageServer
   */
  async fetchServiceLayers(serviceUrl: string): Promise<ServiceLayerInfo[]> {
    return this._fetchServiceLayersWithTimeout(serviceUrl, 45000); // 45 second timeout for on-demand (increased for slow services like NAIP imagery)
  }

  /**
   * Internal method to fetch service layers with configurable timeout
   */
  private async _fetchServiceLayersWithTimeout(serviceUrl: string, timeoutMs: number): Promise<ServiceLayerInfo[]> {
    try {
      // Query the service metadata to get all layers
      const metadataUrl = `${serviceUrl}?f=json`;
      // console.log(`🔍 Fetching service layers from: ${metadataUrl} (timeout: ${timeoutMs}ms)`);
      
      // Add timeout to prevent hanging on slow/unresponsive external services
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      
      try {
        const response = await fetch(metadataUrl, { signal: controller.signal });
        clearTimeout(timeout);
        
        if (!response.ok) {
          console.warn(`⚠️ Could not fetch service metadata: ${response.status}`);
          return [];
        }
        
        const data = await response.json();
        
        if (data.error) {
          console.warn(`⚠️ Service metadata error: ${data.error.message}`);
          return [];
        }
        
        // Check for layers array (MapServer, FeatureServer)
        if (data.layers && Array.isArray(data.layers)) {
      // console.log(`✅ Found ${data.layers.length} layers in service`);
        return data.layers.map((layer: any) => ({
          id: layer.id,
          name: layer.name,
          type: layer.type || 'Feature Layer',
          description: layer.description,
          geometryType: layer.geometryType,
          minScale: layer.minScale,
          maxScale: layer.maxScale
        }));
      }
      
      // For ImageServer, there's typically just one "layer" (the service itself)
      if (data.name && serviceUrl.includes('/ImageServer')) {
      // console.log(`✅ ImageServer detected: ${data.name}`);
        return [{
          id: 0,
          name: data.name,
          type: 'Image Service',
          description: data.description || data.serviceDescription,
          geometryType: undefined,
          minScale: data.minScale,
          maxScale: data.maxScale
        }];
      }
      
      // console.log('ℹ️ No layers found in service metadata');
        return [];
        
      } catch (fetchError: any) {
        clearTimeout(timeout);
        if (fetchError.name === 'AbortError') {
          // console.warn(`⏱️ Service request timed out after ${timeoutMs / 1000}s: ${serviceUrl}`);
        } else {
          // console.error(`Error in fetch request for ${serviceUrl}:`, fetchError);
        }
        return [];
      }
    } catch (error) {
      console.error(`Error fetching service layers for ${serviceUrl}:`, error);
      return [];
    }
  }

  /**
   * Check if an ImageServer is too large/dense to render efficiently
   * Returns a warning object if the service should display a warning
   */
  async checkImageServerPerformance(serviceUrl: string): Promise<TNCArcGISItem['renderingWarning'] | undefined> {
    try {
      const metadataUrl = `${serviceUrl}?f=json`;
      // console.log(`🔍 Checking ImageServer performance for: ${serviceUrl}`);
      
      const response = await fetch(metadataUrl);
      if (!response.ok) {
        console.warn(`⚠️ Could not fetch ImageServer metadata: ${response.status}`);
        return undefined;
      }
      
      const data = await response.json();
      
      if (data.error) {
        console.warn(`⚠️ ImageServer metadata error: ${data.error.message}`);
        return undefined;
      }
      
      // Check if the service is tiled
      const isTiled = data.capabilities?.includes('Tiles') || data.cacheType !== undefined;
      
      // Get pixel dimensions
      const pixelWidth = data.extent?.width || 0;
      const pixelHeight = data.extent?.height || 0;
      const cols = data.cols || pixelWidth;
      const rows = data.rows || pixelHeight;
      const pixelCount = cols * rows;
      
      // Get pixel size (resolution)
      // const pixelSizeX = data.pixelSizeX || 0;
      // const pixelSizeY = data.pixelSizeY || 0;
      
      // console.log(`📊 ImageServer Analysis:`);
      // console.log(`   - Tiled: ${isTiled}`);
      // console.log(`   - Dimensions: ${cols} x ${rows} pixels`);
      // console.log(`   - Total pixels: ${pixelCount.toLocaleString()}`);
      // console.log(`   - Pixel size: ${pixelSizeX} x ${pixelSizeY}`);
      // console.log(`   - Cache type: ${data.cacheType || 'none'}`);
      // console.log(`   - Capabilities: ${data.capabilities || 'none'}`);
      
      // Thresholds for warnings
      const LARGE_PIXEL_THRESHOLD = 100000000; // 100 million pixels
      const VERY_LARGE_PIXEL_THRESHOLD = 1000000000; // 1 billion pixels
      
      // If not tiled and very large, show warning
      if (!isTiled && pixelCount > LARGE_PIXEL_THRESHOLD) {
        const sizeGB = (pixelCount * 3) / (1024 * 1024 * 1024); // Rough estimate: 3 bytes per pixel (RGB)
        const sizeDescription = sizeGB > 1 
          ? `~${sizeGB.toFixed(1)} GB` 
          : `~${(sizeGB * 1024).toFixed(0)} MB`;
        
        const warningMessage = pixelCount > VERY_LARGE_PIXEL_THRESHOLD
          ? `⚠️ This image service is not tiled and extremely large (${sizeDescription}). Rendering will be very slow or may fail. Consider opening in ArcGIS Pro or viewing directly in ArcGIS Hub.`
          : `⚠️ This image service is not tiled and very large (${sizeDescription}). Rendering may be slow. The preview will load data as you zoom and pan.`;
        
        console.warn(`🚨 ${warningMessage}`);
        
        return {
          type: 'large-untiled-image',
          message: warningMessage,
          details: {
            isTiled: false,
            pixelCount,
            sizeDescription
          }
        };
      }
      
      // If tiled, it should render fine
      if (isTiled) {
      // console.log(`✅ ImageServer is tiled - should render efficiently`);
      }
      
      return undefined;
    } catch (error) {
      console.error(`Error checking ImageServer performance:`, error);
      return undefined;
    }
  }

  /**
   * Fetch legend information for a layer
   * Supports FeatureServer, MapServer, and ImageServer
   */
  async fetchLegendInfo(serviceUrl: string, layerId: number = 0): Promise<any> {
    try {
      // For ImageServer, metadata is at base URL (no layer ID)
      // For FeatureServer/MapServer, metadata is at serviceUrl/layerId
      const isImageServer = serviceUrl.includes('/ImageServer');
      const layerUrl = isImageServer ? `${serviceUrl}?f=json` : `${serviceUrl}/${layerId}?f=json`;
      
      // console.log(`🎨 Fetching layer metadata from: ${layerUrl}`);
      
      const layerResponse = await fetch(layerUrl);
      let layerMetadata: any = null;
      
      if (layerResponse.ok) {
        layerMetadata = await layerResponse.json();
        
        // Log metadata to help identify where units might be
        // console.log(`📊 Layer metadata for ${layerMetadata.name || layerMetadata.serviceDescription}:`, {
        //   units: layerMetadata.units,
        //   pixelType: layerMetadata.pixelType,
        //   serviceDescription: layerMetadata.serviceDescription,
        //   description: layerMetadata.description,
        //   minValues: layerMetadata.minValues,
        //   maxValues: layerMetadata.maxValues,
        //   hasRenderer: !!layerMetadata.drawingInfo?.renderer,
        //   fields: layerMetadata.fields?.slice(0, 3).map((f: any) => ({ name: f.name, type: f.type, alias: f.alias }))
        // });
      }
      
      // Try /legend endpoint first (works for MapServer and ImageServer)
      const legendUrl = `${serviceUrl}/legend?f=json`;
      // console.log(`🎨 Fetching legend info from: ${legendUrl}`);
      
      const legendResponse = await fetch(legendUrl);
      
      if (legendResponse.ok) {
        const legendData = await legendResponse.json();
        
        if (!legendData.error && legendData.layers && legendData.layers.length > 0) {
          // Find the requested layer in the legend response
          const layerLegend = legendData.layers.find((l: any) => l.layerId === layerId) || legendData.layers[0];
          
          if (layerLegend && layerLegend.legend) {
            // Extract units from metadata AND legend labels
            const units = this.extractUnits(layerMetadata, layerLegend);
            
            // Transform legend items to our format
            return {
              layerId: layerLegend.layerId.toString(),
              layerName: layerLegend.layerName,
              rendererType: layerLegend.legend.length === 1 ? 'simple' : 'uniqueValue',
              units: units, // Add units to legend data
              items: layerLegend.legend.map((item: any) => ({
                label: item.label,
                symbol: this.transformLegendSymbol(item)
              }))
            };
          }
        }
      }
      
      // Fallback: Use layer metadata endpoint (for FeatureServers)
      if (!layerMetadata) {
        const response = await fetch(layerUrl);
        if (!response.ok) {
          throw new Error(`Legend fetch error: ${response.status} ${response.statusText}`);
        }
        layerMetadata = await response.json();
      }
      
      if (layerMetadata.error) {
        throw new Error(`Legend API error: ${layerMetadata.error.message}`);
      }
      
      // Extract renderer from drawingInfo
      const renderer = layerMetadata.drawingInfo?.renderer;
      
      if (!renderer) {
        console.warn(`No renderer found for layer ${layerId}`);
        return null;
      }
      
      // Extract units from metadata
      const units = this.extractUnits(layerMetadata);
      
      // Transform renderer to legend format
      return this.transformRendererToLegend(renderer, layerMetadata.name || `Layer ${layerId}`, layerId, units);
      
    } catch (error) {
      console.error(`Error fetching legend for ${serviceUrl}/${layerId}:`, error);
      return null;
    }
  }

  /**
   * Extract units of measurement from layer metadata
   * Only returns explicit unit information - no interpretation or inference
   */
  private extractUnits(metadata: any, legendLayer?: any): string | null {
    if (!metadata && !legendLayer) return null;
    
    // 1. Check for explicit units field in metadata (most reliable)
    if (metadata?.units) {
      // console.log(`📊 Found explicit units field: ${metadata.units}`);
      return metadata.units;
    }
    
    // 2. Check fields for unit information
    if (metadata?.fields && Array.isArray(metadata.fields)) {
      for (const field of metadata.fields) {
        if (field.units) {
      // console.log(`📊 Found units in field ${field.name}: ${field.units}`);
          return field.units;
        }
      }
    }
    
    // 3. Parse description for explicit unit declarations only
    const description = metadata?.description || metadata?.serviceDescription || '';
    
    // Look for explicit unit patterns in description
    const unitPatterns = [
      /units?:\s*([^\n,;.]+)/i,  // "units: meters" or "unit: kg/hectare"
      /measured in\s+([^\n,;.]+)/i,  // "measured in meters"
      /\(([^)]+)\)\s*$/  // Units in parentheses at end: "Elevation (meters)"
    ];
    
    for (const pattern of unitPatterns) {
      const match = description.match(pattern);
      if (match && match[1]) {
        const units = match[1].trim();
      // console.log(`📊 Found units in description: ${units}`);
        return units;
      }
    }
    
    // No explicit units found - return null
    // Users should refer to layer descriptions for context
      // console.log('📊 No explicit units found - refer to layer description for context');
    return null;
  }

  /**
   * Transform legend item from /legend endpoint to our symbol format
   */
  private transformLegendSymbol(legendItem: any): any {
    // Legend endpoint provides imageData as base64
    // We'll store this for rendering
    return {
      type: 'image',
      imageData: legendItem.imageData,
      url: legendItem.url,
      contentType: legendItem.contentType,
      width: legendItem.width || 20,
      height: legendItem.height || 20
    };
  }

  /**
   * Transform ArcGIS renderer to our legend format
   */
  private transformRendererToLegend(renderer: any, layerName: string, layerId: number, units: string | null = null): any {
    const legend: any = {
      layerId: layerId.toString(),
      layerName,
      rendererType: renderer.type,
      units: units, // Add units to legend
      items: []
    };

    switch (renderer.type) {
      case 'simple':
        // Single symbol for all features
        legend.items.push({
          label: renderer.label || layerName,
          symbol: this.transformSymbol(renderer.symbol)
        });
        break;

      case 'uniqueValue':
        // Categorical renderer
        if (renderer.uniqueValueInfos) {
          legend.items = renderer.uniqueValueInfos.map((info: any) => ({
            label: info.label || info.value,
            value: info.value,
            symbol: this.transformSymbol(info.symbol)
          }));
        }
        break;

      case 'classBreaks':
        // Graduated renderer
        if (renderer.classBreakInfos) {
          legend.items = renderer.classBreakInfos.map((info: any) => ({
            label: info.label,
            minValue: info.classMinValue,
            maxValue: info.classMaxValue,
            symbol: this.transformSymbol(info.symbol)
          }));
        }
        break;

      default:
        console.warn(`Unknown renderer type: ${renderer.type}`);
    }

    return legend;
  }

  /**
   * Transform ArcGIS symbol to our simplified format
   */
  private transformSymbol(symbol: any): any {
    if (!symbol) return {};

    const transformed: any = {};

    // Determine symbol type
    if (symbol.type === 'esriSFS') {
      // Polygon - Simple Fill Symbol
      transformed.type = 'polygon';
      transformed.fillColor = symbol.color;
      transformed.style = symbol.style; // Capture style (solid, diagonal, etc.)
      if (symbol.outline) {
        transformed.outlineColor = symbol.outline.color;
        transformed.outlineWidth = symbol.outline.width;
      }
    } else if (symbol.type === 'esriPFS') {
      // Polygon - Picture Fill Symbol
      transformed.type = 'image';
      transformed.imageData = symbol.imageData;
      transformed.url = symbol.url;
      transformed.contentType = symbol.contentType || 'image/png';
      transformed.width = symbol.width || 20;
      transformed.height = symbol.height || 20;
      transformed.xoffset = symbol.xoffset || 0;
      transformed.yoffset = symbol.yoffset || 0;
      transformed.angle = symbol.angle || 0;
    } else if (symbol.type === 'esriSLS') {
      // Line - Simple Line Symbol
      transformed.type = 'line';
      transformed.fillColor = symbol.color;
      transformed.lineWidth = symbol.width;
    } else if (symbol.type === 'esriSMS') {
      // Point - Simple Marker Symbol
      transformed.type = 'point';
      transformed.fillColor = symbol.color;
      transformed.size = symbol.size;
      if (symbol.outline) {
        transformed.outlineColor = symbol.outline.color;
        transformed.outlineWidth = symbol.outline.width;
      }
    } else if (symbol.type === 'esriPMS') {
      // Point - Picture Marker Symbol (icons like water wells, stream crossings)
      transformed.type = 'image';
      transformed.imageData = symbol.imageData;
      transformed.url = symbol.url;
      transformed.contentType = symbol.contentType || 'image/png';
      transformed.width = symbol.width || 20;
      transformed.height = symbol.height || 20;
      transformed.xoffset = symbol.xoffset || 0;
      transformed.yoffset = symbol.yoffset || 0;
      transformed.angle = symbol.angle || 0;
      
      // Debug log for picture marker symbols
      // console.log(`🖼️ Picture Marker Symbol found:`, {
      //   hasImageData: !!symbol.imageData,
      //   hasUrl: !!symbol.url,
      //   url: symbol.url,
      //   width: transformed.width,
      //   height: transformed.height,
      //   angle: transformed.angle
      // });
    } else if (symbol.type === 'esriTS') {
      // Text Symbol - typically for labels, not legends
      // console.log('Text symbol found, skipping for legend');
      transformed.type = 'text';
    } else {
      console.warn(`Unknown symbol type: ${symbol.type}`);
    }

    return transformed;
  }
}

export const tncArcGISAPI = new TNCArcGISService();

