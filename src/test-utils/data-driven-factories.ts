import { TNCArcGISItem } from '../services/tncArcGISService'
import { FilterState } from '../types'
import { CSVRow, filterCSVRows, analyzeCSVForTestScenarios } from './csv-parser'

/**
 * Convert CSV row to TNCArcGISItem for testing
 */
export function csvRowToTNCArcGISItem(row: CSVRow): TNCArcGISItem {
  // Determine UI pattern based on type
  const getUIPattern = (type: string): 'MAP_LAYER' | 'EXTERNAL_LINK' | 'MODAL' => {
    const mapLayerTypes = ['Feature Service', 'Image Service', 'Map Service', 'WMS', 'WFS', 'Vector Tile Service']
    const externalLinkTypes = ['Web Experience', 'Dashboard', 'Web Mapping Application', 'Operations Dashboard']
    const modalTypes = ['StoryMap', 'Web Map', 'Feature Collection', 'PDF', 'CSV', 'Shapefile']
    
    if (mapLayerTypes.some(t => type.includes(t))) return 'MAP_LAYER'
    if (externalLinkTypes.some(t => type.includes(t))) return 'EXTERNAL_LINK'
    if (modalTypes.some(t => type.includes(t))) return 'MODAL'
    return 'MODAL' // Default
  }

  // Parse tags if they exist
  const tags = row.tags ? row.tags.split(';').map((tag: string) => tag.trim()).filter(Boolean) : []
  
  // Parse categories if they exist
  const categories = row.categories ? row.categories.split(';').map((cat: string) => cat.trim()).filter(Boolean) : []
  
  // Parse main categories if they exist
  const mainCategories = row.mainCategories ? row.mainCategories.split(';').map((cat: string) => cat.trim()).filter(Boolean) : []

  return {
    id: row.id || `csv-item-${Math.random().toString(36).substr(2, 9)}`,
    title: row.title || 'Untitled Dataset',
    type: row.type || 'Unknown',
    description: row.description || row.snippet || '',
    snippet: row.snippet || row.description || '',
    url: row.url || 'https://example.com/service',
    owner: row.owner || 'TNC',
    tags,
    categories,
    collection: (row.collection as 'dataset' | 'document' | 'appAndMap') || 'dataset',
    num_views: parseInt(row.num_views || '0', 10),
    size: parseInt(row.size || '0', 10),
    created: row.created ? new Date(row.created).getTime() : Date.now() - 86400000,
    modified: row.modified ? new Date(row.modified).getTime() : Date.now() - 3600000,
    thumbnail: row.thumbnail,
    uiPattern: getUIPattern(row.type || ''),
    mainCategories
  }
}

/**
 * Load real TNC data from CSV fixture
 */
export async function loadRealTNCData(): Promise<TNCArcGISItem[]> {
  try {
    // This would be replaced with actual CSV loading in tests
    // For now, return empty array - will be mocked in tests
    return [] as TNCArcGISItem[]
  } catch (error) {
    console.error('Failed to load real TNC data:', error)
    return [] as TNCArcGISItem[]
  }
}

/**
 * Create test scenarios based on real CSV data
 */
export function createDataDrivenTestScenarios(csvData: CSVRow[]): Array<{
  name: string
  filters: FilterState
  expectedItems: CSVRow[]
  expectedCount: number
  expectedCategories: string[]
  expectedTypes: string[]
}> {
  const analysis = analyzeCSVForTestScenarios(csvData)
  const scenarios: Array<{
    name: string
    filters: FilterState
    expectedItems: CSVRow[]
    expectedCount: number
    expectedCategories: string[]
    expectedTypes: string[]
  }> = []

  // Create scenarios for each main category
  Object.entries(analysis.samplesByCategory).forEach(([category, items]) => {
    if (items.length > 0) {
      scenarios.push({
        name: `${category} category with TNC ArcGIS Hub`,
        filters: {
          category: category,
          source: 'TNC ArcGIS Hub',
          spatialFilter: 'Dangermond Preserve',
          timeRange: 'Last 6 months',
          daysBack: 180,
          tags: []
        },
        expectedItems: items as CSVRow[],
        expectedCount: items.length,
        expectedCategories: [category],
        expectedTypes: [...new Set(items.map((item: CSVRow) => item.type || 'Unknown'))]
      })
    }
  })

  // Add specific freshwater scenario as requested
  const freshwaterItems = filterCSVRows(csvData, { 
    mainCategories: ['Freshwater']
  })
  
  if (freshwaterItems.length > 0) {
    scenarios.push({
      name: 'Freshwater category with Dangermond Preserve spatial filter',
      filters: {
        category: 'Freshwater',
        source: 'TNC ArcGIS Hub',
        spatialFilter: 'Dangermond Preserve',
        timeRange: 'Last 6 months',
        daysBack: 180,
        tags: []
      },
      expectedItems: freshwaterItems,
      expectedCount: freshwaterItems.length,
      expectedCategories: ['Freshwater'],
      expectedTypes: [...new Set(freshwaterItems.map((item: CSVRow) => item.type || 'Unknown'))]
    })
  }

  // Add fire scenario
  const fireItems = filterCSVRows(csvData, { 
    mainCategories: ['Fire']
  })
  
  if (fireItems.length > 0) {
    scenarios.push({
      name: 'Fire category with expanded spatial area',
      filters: {
        category: 'Fire',
        source: 'TNC ArcGIS Hub',
        spatialFilter: 'Dangermond + Margin',
        timeRange: '2020-2024',
        tags: []
      },
      expectedItems: fireItems,
      expectedCount: fireItems.length,
      expectedCategories: ['Fire'],
      expectedTypes: [...new Set(fireItems.map((item: CSVRow) => item.type || 'Unknown'))]
    })
  }

  // Add oceans and coasts scenario
  const oceansItems = filterCSVRows(csvData, { 
    mainCategories: ['Oceans and Coasts']
  })
  
  if (oceansItems.length > 0) {
    scenarios.push({
      name: 'Oceans and Coasts category with current view',
      filters: {
        category: 'Oceans and Coasts',
        source: 'TNC ArcGIS Hub',
        spatialFilter: 'Current View',
        timeRange: 'Last 6 months',
        daysBack: 180,
        tags: []
      },
      expectedItems: oceansItems,
      expectedCount: oceansItems.length,
      expectedCategories: ['Oceans and Coasts'],
      expectedTypes: [...new Set(oceansItems.map((item: CSVRow) => item.type || 'Unknown'))]
    })
  }

  return scenarios
}

/**
 * Mock CSV data for testing when real data isn't available
 */
export const mockCSVData: CSVRow[] = [
  {
    id: 'hydro-stream-1',
    title: 'Stream Network Monitoring',
    type: 'Feature Service',
    description: 'Real-time stream monitoring data for Dangermond Preserve',
    snippet: 'Stream monitoring network',
    url: 'https://services.arcgis.com/stream-network',
    owner: 'TNC',
    tags: 'Water;Streams;Hydrology;Monitoring',
    categories: '/Categories/Environment/Freshwater',
    mainCategories: 'Freshwater',
    collection: 'dataset',
    num_views: '150',
    size: '2048',
    created: '2023-01-15',
    modified: '2024-09-15'
  },
  {
    id: 'hydro-watershed-1',
    title: 'Watershed Boundary Analysis',
    type: 'Feature Service',
    description: 'Watershed boundaries and drainage analysis',
    snippet: 'Watershed delineation',
    url: 'https://services.arcgis.com/watershed-boundaries',
    owner: 'TNC',
    tags: 'Watershed;Basins;Water;Drainage',
    categories: '/Categories/Environment/Freshwater',
    mainCategories: 'Freshwater',
    collection: 'dataset',
    num_views: '89',
    size: '1024',
    created: '2023-03-10',
    modified: '2024-08-20'
  },
  {
    id: 'hydro-quality-1',
    title: 'Water Quality Assessment Dashboard',
    type: 'Dashboard',
    description: 'Interactive dashboard for water quality metrics',
    snippet: 'Water quality monitoring',
    url: 'https://tnc.maps.arcgis.com/water-quality-dashboard',
    owner: 'TNC',
    tags: 'Water;Quality;Monitoring;Dashboard',
    categories: '/Categories/Environment/Freshwater',
    mainCategories: 'Freshwater',
    collection: 'appAndMap',
    num_views: '234',
    size: '512',
    created: '2023-06-01',
    modified: '2024-09-01'
  },
  {
    id: 'fire-history-1',
    title: 'Historical Fire Perimeters',
    type: 'Map Service',
    description: 'Fire history and burn severity mapping',
    snippet: 'Fire history data',
    url: 'https://services.arcgis.com/fire-history',
    owner: 'TNC',
    tags: 'Fire;History;JLDP_FireData;Burn',
    categories: '/Categories/Environment/Fire',
    mainCategories: 'Fire',
    collection: 'dataset',
    num_views: '178',
    size: '3072',
    created: '2022-11-20',
    modified: '2024-07-15'
  },
  {
    id: 'fire-risk-1',
    title: 'Fire Risk Assessment Story',
    type: 'StoryMap',
    description: 'Interactive story map showing fire risk factors',
    snippet: 'Fire risk analysis',
    url: 'https://storymaps.arcgis.com/fire-risk-assessment',
    owner: 'TNC',
    tags: 'Fire;Risk;Assessment;Story',
    categories: '/Categories/Environment/Fire',
    mainCategories: 'Fire',
    collection: 'appAndMap',
    num_views: '312',
    size: '256',
    created: '2023-04-12',
    modified: '2024-06-30'
  },
  {
    id: 'marine-coastal-1',
    title: 'Coastal Habitat Monitoring',
    type: 'Feature Service',
    description: 'Coastal and marine habitat monitoring data',
    snippet: 'Coastal monitoring',
    url: 'https://services.arcgis.com/coastal-habitats',
    owner: 'TNC',
    tags: 'Marine;Coastal;Habitat;Monitoring',
    categories: '/Categories/Environment/Oceans and Coasts',
    mainCategories: 'Oceans and Coasts',
    collection: 'dataset',
    num_views: '95',
    size: '1536',
    created: '2023-02-28',
    modified: '2024-08-10'
  }
]

/**
 * Get test scenarios using mock data (fallback when CSV not available)
 */
export function getMockDataTestScenarios() {
  return createDataDrivenTestScenarios(mockCSVData)
}

