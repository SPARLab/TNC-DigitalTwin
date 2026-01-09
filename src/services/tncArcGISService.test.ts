import { describe, it, expect, beforeEach, vi } from 'vitest'
import { tncArcGISAPI } from './tncArcGISService'
import { 
  createMockTNCItemCollection, 
  createMockTNCArcGISItem 
} from '../test-utils/factories'
import { mockFetch } from '../test-utils/test-helpers'

describe('TNCArcGISService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('API Data Fetching', () => {
    it('should fetch datasets from TNC Hub API', async () => {
      const mockItems = createMockTNCItemCollection().filter(item => item.collection === 'dataset')
      const mockResponse = {
        data: mockItems.map(item => ({
          id: item.id,
          attributes: {
            title: item.title,
            type: item.type,
            description: item.description,
            snippet: item.snippet,
            url: item.url,
            owner: item.owner,
            tags: item.tags,
            categories: item.categories,
            numViews: item.num_views,
            size: item.size,
            created: item.created,
            modified: item.modified
          }
        }))
      }

      mockFetch([{
        url: 'dangermondpreserve-tnc.hub.arcgis.com/api/search/v1/collections/dataset',
        response: mockResponse
      }])

      const result = await tncArcGISAPI.getDatasets()

      expect(result.total_results).toBeGreaterThan(0)
      expect(result.results).toHaveLength(mockResponse.data.length)
      expect(result.dataSource).toBe('TNC ArcGIS Hub - Datasets')
    })

    it('should fetch documents from TNC Hub API', async () => {
      const mockItems = createMockTNCItemCollection().filter(item => item.collection === 'document')
      const mockResponse = {
        data: mockItems.map(item => ({
          id: item.id,
          attributes: {
            title: item.title,
            type: item.type,
            description: item.description,
            snippet: item.snippet,
            url: item.url,
            owner: item.owner,
            tags: item.tags,
            categories: item.categories,
            numViews: item.num_views,
            size: item.size,
            created: item.created,
            modified: item.modified
          }
        }))
      }

      mockFetch([{
        url: 'dangermondpreserve-tnc.hub.arcgis.com/api/search/v1/collections/document',
        response: mockResponse
      }])

      const result = await tncArcGISAPI.getDocuments()

      expect(result.total_results).toBeGreaterThan(0)
      expect(result.results).toHaveLength(mockResponse.data.length)
      expect(result.dataSource).toBe('TNC ArcGIS Hub - Documents')
    })

    it('should filter out Hub Pages from results', async () => {
      const mockResponse = {
        data: [
          {
            id: 'item-1',
            attributes: {
              title: 'Valid Dataset',
              type: 'Feature Service',
              description: 'A valid dataset',
              snippet: 'Valid snippet',
              url: 'https://example.com/service',
              owner: 'TNC',
              tags: ['water'],
              categories: ['/Categories/Environment/Freshwater']
            }
          },
          {
            id: 'item-2',
            attributes: {
              title: 'Hub Page',
              type: 'Hub Page',
              description: 'Should be filtered out',
              snippet: 'Hub page snippet',
              url: 'https://example.com/page',
              owner: 'TNC',
              tags: ['page'],
              categories: []
            }
          }
        ]
      }

      mockFetch([{
        url: 'dangermondpreserve-tnc.hub.arcgis.com/api/search/v1/collections/dataset',
        response: mockResponse
      }])

      const result = await tncArcGISAPI.getDatasets()

      expect(result.results).toHaveLength(1)
      expect(result.results[0].type).toBe('Feature Service')
      expect(result.results[0].type).not.toBe('Hub Page')
    })
  })

  describe('Category Mapping', () => {
    it('should correctly map tags to main categories', async () => {
      const mockResponse = {
        data: [
          {
            id: 'hydro-item',
            attributes: {
              title: 'Water Quality Data',
              type: 'Feature Service',
              description: 'Water quality monitoring data',
              snippet: 'Water quality snippet',
              url: 'https://example.com/water',
              owner: 'TNC',
              tags: ['Water', 'Streams', 'Hydrology'], // Should map to Freshwater
              categories: []
            }
          },
          {
            id: 'fire-item',
            attributes: {
              title: 'Fire History',
              type: 'Map Service',
              description: 'Historical fire data',
              snippet: 'Fire history snippet',
              url: 'https://example.com/fire',
              owner: 'TNC',
              tags: ['Fire', 'JLDP_FireData'], // Should map to Fire
              categories: []
            }
          }
        ]
      }

      mockFetch([{
        url: 'dangermondpreserve-tnc.hub.arcgis.com/api/search/v1/collections/dataset',
        response: mockResponse
      }])

      const result = await tncArcGISAPI.getDatasets()

      const hydroItem = result.results.find(item => item.id === 'hydro-item')
      const fireItem = result.results.find(item => item.id === 'fire-item')

      expect(hydroItem?.mainCategories).toContain('Freshwater')
      expect(fireItem?.mainCategories).toContain('Fire')
    })

    it('should correctly map categories to main categories', async () => {
      const mockResponse = {
        data: [
          {
            id: 'freshwater-item',
            attributes: {
              title: 'Freshwater Resources',
              type: 'Feature Service',
              description: 'Freshwater resource data',
              snippet: 'Freshwater snippet',
              url: 'https://example.com/freshwater',
              owner: 'TNC',
              tags: [],
              categories: ['/Categories/Environment/Freshwater'] // Should map to Freshwater
            }
          }
        ]
      }

      mockFetch([{
        url: 'dangermondpreserve-tnc.hub.arcgis.com/api/search/v1/collections/dataset',
        response: mockResponse
      }])

      const result = await tncArcGISAPI.getDatasets()

      const item = result.results[0]
      expect(item.mainCategories).toContain('Freshwater')
    })
  })

  describe('UI Pattern Detection', () => {
    it('should assign MAP_LAYER pattern to mappable services', async () => {
      const mapLayerTypes = ['Feature Service', 'Image Service', 'Map Service', 'WMS', 'WFS']
      
      for (const type of mapLayerTypes) {
        const mockResponse = {
          data: [{
            id: 'test-item',
            attributes: {
              title: `Test ${type}`,
              type: type,
              description: 'Test description',
              snippet: 'Test snippet',
              url: 'https://example.com/service',
              owner: 'TNC',
              tags: ['test'],
              categories: []
            }
          }]
        }

        mockFetch([{
          url: 'dangermondpreserve-tnc.hub.arcgis.com/api/search/v1/collections/dataset',
          response: mockResponse
        }])

        const result = await tncArcGISAPI.getDatasets()
        expect(result.results[0].uiPattern).toBe('MAP_LAYER')
      }
    })

    it('should assign EXTERNAL_LINK pattern to web applications', async () => {
      const externalLinkTypes = ['Web Experience', 'Dashboard', 'Web Mapping Application']
      
      for (const type of externalLinkTypes) {
        const mockResponse = {
          data: [{
            id: 'test-item',
            attributes: {
              title: `Test ${type}`,
              type: type,
              description: 'Test description',
              snippet: 'Test snippet',
              url: 'https://example.com/app',
              owner: 'TNC',
              tags: ['test'],
              categories: []
            }
          }]
        }

        mockFetch([{
          url: 'dangermondpreserve-tnc.hub.arcgis.com/api/search/v1/collections/dataset',
          response: mockResponse
        }])

        const result = await tncArcGISAPI.getDatasets()
        expect(result.results[0].uiPattern).toBe('EXTERNAL_LINK')
      }
    })

    it('should assign MODAL pattern to document types', async () => {
      const modalTypes = ['StoryMap', 'Web Map', 'Feature Collection', 'PDF', 'CSV']
      
      for (const type of modalTypes) {
        const mockResponse = {
          data: [{
            id: 'test-item',
            attributes: {
              title: `Test ${type}`,
              type: type,
              description: 'Test description',
              snippet: 'Test snippet',
              url: 'https://example.com/document',
              owner: 'TNC',
              tags: ['test'],
              categories: []
            }
          }]
        }

        mockFetch([{
          url: 'dangermondpreserve-tnc.hub.arcgis.com/api/search/v1/collections/dataset',
          response: mockResponse
        }])

        const result = await tncArcGISAPI.getDatasets()
        expect(result.results[0].uiPattern).toBe('MODAL')
      }
    })
  })

  describe('Filtering', () => {
    it('should filter by category', async () => {
      const mockItems = createMockTNCItemCollection()
      const mockResponse = {
        data: mockItems.map(item => ({
          id: item.id,
          attributes: {
            title: item.title,
            type: item.type,
            description: item.description,
            snippet: item.snippet,
            url: item.url,
            owner: item.owner,
            tags: item.tags,
            categories: item.categories
          }
        }))
      }

      mockFetch([{
        url: 'dangermondpreserve-tnc.hub.arcgis.com/api/search/v1/collections/dataset',
        response: mockResponse
      }])

      const result = await tncArcGISAPI.getDatasets({
        categoryFilter: ['Freshwater']
      })

      // All returned items should have Freshwater in their main categories
      result.results.forEach(item => {
        expect(item.mainCategories).toContain('Freshwater')
      })
    })

    it('should filter by type', async () => {
      const mockItems = createMockTNCItemCollection()
      const mockResponse = {
        data: mockItems.map(item => ({
          id: item.id,
          attributes: {
            title: item.title,
            type: item.type,
            description: item.description,
            snippet: item.snippet,
            url: item.url,
            owner: item.owner,
            tags: item.tags,
            categories: item.categories
          }
        }))
      }

      mockFetch([{
        url: 'dangermondpreserve-tnc.hub.arcgis.com/api/search/v1/collections/dataset',
        response: mockResponse
      }])

      const result = await tncArcGISAPI.getDatasets({
        typeFilter: ['Feature Service']
      })

      // All returned items should be Feature Services
      result.results.forEach(item => {
        expect(item.type).toBe('Feature Service')
      })
    })

    it('should filter by search query', async () => {
      const mockItems = [
        createMockTNCArcGISItem({
          id: 'water-item',
          title: 'Water Quality Monitoring',
          description: 'Comprehensive water quality data',
          tags: ['water', 'quality', 'monitoring']
        }),
        createMockTNCArcGISItem({
          id: 'fire-item',
          title: 'Fire Risk Assessment',
          description: 'Fire hazard analysis',
          tags: ['fire', 'risk', 'hazard']
        })
      ]

      const mockResponse = {
        data: mockItems.map(item => ({
          id: item.id,
          attributes: {
            title: item.title,
            type: item.type,
            description: item.description,
            snippet: item.snippet,
            url: item.url,
            owner: item.owner,
            tags: item.tags,
            categories: item.categories
          }
        }))
      }

      mockFetch([{
        url: 'dangermondpreserve-tnc.hub.arcgis.com/api/search/v1/collections/dataset',
        response: mockResponse
      }])

      const result = await tncArcGISAPI.getDatasets({
        searchQuery: 'water'
      })

      // Should only return items containing 'water'
      expect(result.results).toHaveLength(1)
      expect(result.results[0].id).toBe('water-item')
    })
  })

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      mockFetch([{
        url: 'dangermondpreserve-tnc.hub.arcgis.com/api/search/v1/collections/dataset',
        response: { error: { message: 'API Error' } },
        ok: false,
        status: 500
      }])

      await expect(tncArcGISAPI.getDatasets()).rejects.toThrow()
    })

    it('should handle network errors', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

      await expect(tncArcGISAPI.getDatasets()).rejects.toThrow('Network error')
    })
  })

  describe('Rate Limiting', () => {
    it('should implement rate limiting between requests', async () => {
      const startTime = Date.now()
      
      // Mock multiple successful responses
      const mockResponse = { data: [] }
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse)
      })

      // Make two consecutive requests
      await tncArcGISAPI.getDatasets()
      await tncArcGISAPI.getDocuments()

      const endTime = Date.now()
      const duration = endTime - startTime

      // Should take at least 500ms due to rate limiting
      expect(duration).toBeGreaterThanOrEqual(500)
    })
  })

  describe('Utility Methods', () => {
    it('should return main categories', () => {
      const categories = tncArcGISAPI.getMainCategories()
      
      expect(categories).toContain('Freshwater')
      expect(categories).toContain('Fire')
      expect(categories).toContain('Oceans and Coasts')
      expect(categories).toContain('Land Cover')
    })

    it('should return data types with UI patterns', () => {
      const dataTypes = tncArcGISAPI.getDataTypes()
      
      expect(dataTypes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            value: 'Feature Service',
            label: 'Feature Service',
            pattern: 'MAP_LAYER'
          }),
          expect.objectContaining({
            value: 'Dashboard',
            label: 'Dashboard',
            pattern: 'EXTERNAL_LINK'
          }),
          expect.objectContaining({
            value: 'StoryMap',
            label: 'StoryMap',
            pattern: 'MODAL'
          })
        ])
      )
    })
  })
})

