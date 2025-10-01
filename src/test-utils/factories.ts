import { TNCArcGISItem } from '../services/tncArcGISService'
import { FilterState } from '../types'

/**
 * Factory for creating mock TNC ArcGIS items for testing
 */
export const createMockTNCArcGISItem = (overrides: Partial<TNCArcGISItem> = {}): TNCArcGISItem => {
  const baseItem: TNCArcGISItem = {
    id: `mock-item-${Math.random().toString(36).substr(2, 9)}`,
    title: 'Mock TNC Data Item',
    type: 'Feature Service',
    description: 'A mock data item for testing purposes',
    snippet: 'Mock snippet for testing',
    url: 'https://example.com/mock-service',
    owner: 'TNC',
    tags: ['test', 'mock', 'data'],
    categories: ['/Categories/Environment/Freshwater'],
    collection: 'dataset',
    num_views: 100,
    size: 1024,
    created: Date.now() - 86400000, // 1 day ago
    modified: Date.now() - 3600000,  // 1 hour ago
    thumbnail: 'https://example.com/thumbnail.jpg',
    uiPattern: 'MAP_LAYER',
    mainCategories: ['Hydrological']
  }

  return { ...baseItem, ...overrides }
}

/**
 * Factory for creating mock filter states for testing
 */
export const createMockFilterState = (overrides: Partial<FilterState> = {}): FilterState => {
  const baseFilter: FilterState = {
    category: 'Hydrological',
    source: 'TNC ArcGIS Hub',
    spatialFilter: 'Dangermond Preserve',
    timeRange: 'Last 6 months',
    daysBack: 180,
    startDate: undefined,
    endDate: undefined,
    qualityGrade: undefined,
    iconicTaxa: []
  }

  return { ...baseFilter, ...overrides }
}

/**
 * Create a collection of mock TNC items for different categories
 */
export const createMockTNCItemCollection = () => {
  return [
    // Hydrological items
    createMockTNCArcGISItem({
      id: 'hydro-1',
      title: 'Stream Network Data',
      type: 'Feature Service',
      tags: ['Water', 'Streams', 'Hydrology'],
      categories: ['/Categories/Environment/Freshwater'],
      mainCategories: ['Hydrological'],
      uiPattern: 'MAP_LAYER'
    }),
    createMockTNCArcGISItem({
      id: 'hydro-2',
      title: 'Watershed Boundaries',
      type: 'Feature Service',
      tags: ['Watershed', 'Basins', 'Water'],
      categories: ['/Categories/Environment/Freshwater'],
      mainCategories: ['Hydrological'],
      uiPattern: 'MAP_LAYER'
    }),
    createMockTNCArcGISItem({
      id: 'hydro-3',
      title: 'Water Quality Dashboard',
      type: 'Dashboard',
      tags: ['Water', 'Quality', 'Monitoring'],
      categories: ['/Categories/Environment/Freshwater'],
      mainCategories: ['Hydrological'],
      uiPattern: 'EXTERNAL_LINK'
    }),

    // Vegetation items
    createMockTNCArcGISItem({
      id: 'veg-1',
      title: 'Vegetation Cover Map',
      type: 'Image Service',
      tags: ['Vegetation', 'Landcover', 'Habitat'],
      categories: ['/Categories/Environment/Habitat'],
      mainCategories: ['Vegetation / habitat'],
      uiPattern: 'MAP_LAYER'
    }),
    createMockTNCArcGISItem({
      id: 'veg-2',
      title: 'Restoration Areas',
      type: 'Feature Service',
      tags: ['Restoration', 'Conservation', 'Habitat'],
      categories: ['/Categories/Environment/Habitat'],
      mainCategories: ['Vegetation / habitat'],
      uiPattern: 'MAP_LAYER'
    }),

    // Fire items
    createMockTNCArcGISItem({
      id: 'fire-1',
      title: 'Fire History Map',
      type: 'Map Service',
      tags: ['Fire', 'History', 'JLDP_FireData'],
      categories: ['/Categories/Environment/Fire'],
      mainCategories: ['Fire'],
      uiPattern: 'MAP_LAYER'
    }),
    createMockTNCArcGISItem({
      id: 'fire-2',
      title: 'Fire Risk Assessment Story',
      type: 'StoryMap',
      tags: ['Fire', 'Risk', 'Assessment'],
      categories: ['/Categories/Environment/Fire'],
      mainCategories: ['Fire'],
      uiPattern: 'MODAL'
    }),

    // Marine items
    createMockTNCArcGISItem({
      id: 'marine-1',
      title: 'Coastal Monitoring Data',
      type: 'Feature Service',
      tags: ['Marine', 'Coastal', 'Monitoring'],
      categories: ['/Categories/Environment/Marine'],
      mainCategories: ['Marine'],
      uiPattern: 'MAP_LAYER'
    }),

    // Climate items
    createMockTNCArcGISItem({
      id: 'climate-1',
      title: 'Climate Change Projections',
      type: 'Web Experience',
      tags: ['Climate', 'Change', 'Projections'],
      categories: ['/Categories/Environment/Climate'],
      mainCategories: ['Climate / weather'],
      uiPattern: 'EXTERNAL_LINK'
    })
  ]
}

/**
 * Create mock API response for TNC ArcGIS service
 */
export const createMockTNCResponse = (items: TNCArcGISItem[] = createMockTNCItemCollection()) => {
  return {
    total_results: items.length,
    results: items,
    dataSource: 'TNC ArcGIS Hub - Mock Data'
  }
}

/**
 * Create mock fetch response for API testing
 */
export const createMockFetchResponse = (data: any, ok = true, status = 200) => {
  return Promise.resolve({
    ok,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data))
  } as Response)
}

/**
 * Filter scenarios for testing different combinations
 */
export const filterTestScenarios = [
  {
    name: 'Hydrological category with Dangermond Preserve spatial filter',
    filters: createMockFilterState({
      category: 'Hydrological',
      source: 'TNC ArcGIS Hub',
      spatialFilter: 'Dangermond Preserve',
      timeRange: 'Last 6 months'
    }),
    expectedItemCount: 3, // Based on mock data
    expectedUIPatterns: ['MAP_LAYER', 'EXTERNAL_LINK']
  },
  {
    name: 'Fire category with expanded spatial area',
    filters: createMockFilterState({
      category: 'Fire',
      source: 'TNC ArcGIS Hub',
      spatialFilter: 'Dangermond + Margin',
      timeRange: '2020-2024'
    }),
    expectedItemCount: 2,
    expectedUIPatterns: ['MAP_LAYER', 'MODAL']
  },
  {
    name: 'Vegetation category with custom date range',
    filters: createMockFilterState({
      category: 'Vegetation / habitat',
      source: 'TNC ArcGIS Hub',
      spatialFilter: 'Current View',
      timeRange: 'Custom Range',
      startDate: '2023-01-01',
      endDate: '2023-12-31'
    }),
    expectedItemCount: 2,
    expectedUIPatterns: ['MAP_LAYER']
  },
  {
    name: 'Marine category with all filters',
    filters: createMockFilterState({
      category: 'Marine',
      source: 'TNC ArcGIS Hub',
      spatialFilter: 'Draw Area',
      timeRange: 'Last 6 months'
    }),
    expectedItemCount: 1,
    expectedUIPatterns: ['MAP_LAYER']
  }
]

