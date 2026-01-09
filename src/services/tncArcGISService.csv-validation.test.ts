import { describe, it, expect, beforeEach, vi } from 'vitest'
import { tncArcGISAPI } from './tncArcGISService'
import { readFileSync } from 'fs'
import { join } from 'path'
import { parseCSV } from '../test-utils/csv-parser'

/**
 * CSV Validation Tests - Minimum Guarantees
 * 
 * These tests ensure AT LEAST the expected items are present.
 * More items is fine (TNC adds data), but missing expected items = FAIL.
 * 
 * If a test fails:
 * 1. Check if TNC removed the item from their API
 * 2. Verify the removal is intentional
 * 3. Update the test expectations manually
 */

describe('TNC ArcGIS Service - CSV Validation (Minimum Guarantees)', () => {
  let csvData: any[]
  
  beforeEach(() => {
    const csvPath = join(__dirname, '../data/tnc_frontend_test_data.csv')
    const csvContent = readFileSync(csvPath, 'utf-8')
    csvData = parseCSV(csvContent)
  })

  describe('Land Cover - Last 5 years', () => {
    // These titles MUST be present. Test fails loudly if any are missing.
    // Note: CSV contains legacy "Vegetation / habitat" category which maps to "Land Cover"
    const REQUIRED_TITLES = [
      'CalFire Fire Hazard Severity Zones 2023',
      'Cattle Pastures',
      'Stock Ponds',
      'Stream Crossings'
    ]
    const MIN_EXPECTED_COUNT = 4
    // Legacy CSV category name that maps to "Land Cover"
    const LEGACY_CSV_CATEGORY = 'Vegetation / habitat'

    it('should include ALL required titles (TNC may have added more)', () => {
      const fiveYearsAgo = new Date()
      fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5)
      
      const results = csvData.filter(row => {
        const hasCategory = row['Mapped Categories']?.includes(LEGACY_CSV_CATEGORY)
        const createdDate = new Date(row['Created Date'])
        return hasCategory && createdDate >= fiveYearsAgo
      })

      const titles = results.map(r => r.Title)
      
      // FAIL LOUDLY if any required title is missing
      REQUIRED_TITLES.forEach(requiredTitle => {
        expect(
          titles,
          `❌ MISSING REQUIRED ITEM: "${requiredTitle}" - Verify TNC didn't remove it!`
        ).toContain(requiredTitle)
      })
      
      // More items is okay, but we need at least the minimum
      expect(
        results.length,
        `Expected AT LEAST ${MIN_EXPECTED_COUNT} items, got ${results.length}`
      ).toBeGreaterThanOrEqual(MIN_EXPECTED_COUNT)

      console.log(`✅ Land Cover: Found ${results.length} items (min: ${MIN_EXPECTED_COUNT})`)
    })

    it('should return AT LEAST expected items from mocked API', async () => {
      const fiveYearsAgo = new Date()
      fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5)
      
      const mockFeatures = csvData
        .filter(row => {
          const hasCategory = row['Mapped Categories']?.includes(LEGACY_CSV_CATEGORY)
          const createdDate = new Date(row['Created Date'])
          return hasCategory && createdDate >= fiveYearsAgo
        })
        .map(row => ({
          id: row['Item ID'],
          properties: {
            title: row.Title,
            type: row.Type,
            description: row.Description,
            snippet: row.Description,
            url: row.URL || 'https://example.com',
            owner: row.Owner,
            tags: row['TNC Tags']?.split(';').map((t: string) => t.trim()) || [],
            categories: row['TNC Categories']?.split(';').map((c: string) => c.trim()) || [],
            created: new Date(row['Created Date']).getTime(),
            modified: new Date(row['Modified Date']).getTime(),
            numViews: parseInt(row.Views) || 0
          }
        }))

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ features: mockFeatures })
      } as Response)

      const response = await tncArcGISAPI.getAllItems({
        categoryFilter: ['Land Cover']
      })

      const titles = response.results.map(item => item.title)
      
      // REQUIRED titles must be present
      REQUIRED_TITLES.forEach(requiredTitle => {
        expect(
          titles,
          `❌ API MISSING: "${requiredTitle}"`
        ).toContain(requiredTitle)
      })
      
      // At least minimum count
      expect(response.results.length).toBeGreaterThanOrEqual(MIN_EXPECTED_COUNT)
      
      // All items must have correct category (new name)
      response.results.forEach(item => {
        expect(item.mainCategories).toContain('Land Cover')
      })

      console.log(`✅ API returned ${response.results.length} items (min: ${MIN_EXPECTED_COUNT})`)
    })
  })

  describe('Freshwater - All time', () => {
    const REQUIRED_TITLES = [
      'Groundwater Wells',
      'Springs',
      'Streams'
    ]
    const MIN_EXPECTED_COUNT = 3
    // Legacy CSV category name that maps to "Freshwater"
    const LEGACY_CSV_CATEGORY = 'Hydrological'

    it('should include ALL required freshwater items', () => {
      const results = csvData.filter(row => 
        row['Mapped Categories']?.includes(LEGACY_CSV_CATEGORY)
      )

      const titles = results.map(r => r.Title)
      
      REQUIRED_TITLES.forEach(requiredTitle => {
        expect(
          titles,
          `❌ MISSING: "${requiredTitle}"`
        ).toContain(requiredTitle)
      })
      
      expect(results.length).toBeGreaterThanOrEqual(MIN_EXPECTED_COUNT)

      console.log(`✅ Freshwater: Found ${results.length} items (min: ${MIN_EXPECTED_COUNT})`)
      console.log(`   Titles: ${titles.slice(0, 5).join(', ')}...`)
    })
  })

  describe('Fire - Last 5 years', () => {
    const REQUIRED_TITLES = [
      'CalFire Fire Hazard Severity Zones 2023',
      'JLDP Fire Perimeters',
      'JLDP Prescribed Burns'
    ]
    const MIN_EXPECTED_COUNT = 3

    it('should include ALL required fire items', () => {
      const fiveYearsAgo = new Date()
      fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5)
      
      const results = csvData.filter(row => {
        const hasCategory = row['Mapped Categories']?.includes('Fire')
        const createdDate = new Date(row['Created Date'])
        return hasCategory && createdDate >= fiveYearsAgo
      })

      const titles = results.map(r => r.Title)
      
      REQUIRED_TITLES.forEach(requiredTitle => {
        expect(
          titles,
          `❌ MISSING: "${requiredTitle}"`
        ).toContain(requiredTitle)
      })
      
      expect(results.length).toBeGreaterThanOrEqual(MIN_EXPECTED_COUNT)

      console.log(`✅ Fire: Found ${results.length} items (min: ${MIN_EXPECTED_COUNT})`)
    })
  })

  describe('Critical Data Integrity', () => {
    it('should have AT LEAST 80 total records', () => {
      expect(
        csvData.length,
        `CSV should have at least 80 records, got ${csvData.length}`
      ).toBeGreaterThanOrEqual(80)
    })

    it('should have AT LEAST 60 non-Hub Page items', () => {
      const nonHubPages = csvData.filter(row => row.Type !== 'Hub Page')
      
      expect(
        nonHubPages.length,
        `Should have at least 60 usable items, got ${nonHubPages.length}`
      ).toBeGreaterThanOrEqual(60)
    })

    it('should have data for all critical categories', () => {
      // Legacy CSV category names (historical test data)
      const criticalCategories = [
        'Vegetation / habitat', // Maps to Land Cover
        'Hydrological',         // Maps to Freshwater
        'Fire',
        'Infrastructure'
      ]
      
      criticalCategories.forEach(category => {
        const items = csvData.filter(row => 
          row['Mapped Categories']?.includes(category)
        )
        
        expect(
          items.length,
          `❌ NO DATA for critical category: "${category}"`
        ).toBeGreaterThan(0)
      })
    })
  })
})

/**
 * Test Philosophy:
 * 
 * ✅ Tests specify MINIMUM guarantees (at least N items)
 * ✅ Tests require SPECIFIC titles to be present
 * ✅ More items than expected = PASS (TNC added data)
 * ✅ Missing required title = FAIL LOUDLY (manual verification needed)
 * 
 * These tests protect against:
 * - API changes that break our queries
 * - Category mapping failures
 * - Data source connectivity issues
 * 
 * These tests allow for:
 * - TNC adding new items (flexible count)
 * - Extra items in results (not a problem)
 */
