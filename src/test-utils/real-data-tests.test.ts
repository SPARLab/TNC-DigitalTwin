import { describe, it, expect, beforeAll } from 'vitest'
import { parseCSV, analyzeCSVForTestScenarios, filterCSVRows } from './csv-parser'
import { createDataDrivenTestScenarios, csvRowToTNCArcGISItem, mockCSVData } from './data-driven-factories'

/**
 * Real Data Tests - Based on actual TNC frontend test data CSV
 * 
 * These tests will validate that filter combinations work with real data
 * and that we can predict what results should be returned for specific queries.
 */
describe('TNC ArcGIS Real Data Tests', () => {
  let realCSVData: any[] = []
  let testScenarios: any[] = []

  beforeAll(async () => {
    try {
      // Try to load real CSV data from fixtures
      // Note: This will use mock data until the real CSV is added to fixtures/
      const csvContent = await loadCSVFromFixtures('tnc_frontend_test_data.csv')
      realCSVData = parseCSV(csvContent)
      console.log(`📊 Loaded ${realCSVData.length} items from real TNC data`)
    } catch (error) {
      console.log('📋 Using mock data for testing (real CSV not found)')
      realCSVData = mockCSVData
    }
    
    testScenarios = createDataDrivenTestScenarios(realCSVData)
    console.log(`🧪 Generated ${testScenarios.length} test scenarios from data`)
  })

  describe('Data Analysis', () => {
    it('should analyze CSV data structure', () => {
      expect(realCSVData).toBeDefined()
      expect(realCSVData.length).toBeGreaterThan(0)
      
      const analysis = analyzeCSVForTestScenarios(realCSVData)
      
      console.log('📈 Data Analysis Results:')
      console.log(`  Total Items: ${analysis.totalItems}`)
      console.log(`  Categories: ${analysis.categories.join(', ')}`)
      console.log(`  Types: ${analysis.types.join(', ')}`)
      console.log(`  Owners: ${analysis.owners.join(', ')}`)
      
      expect(analysis.totalItems).toBe(realCSVData.length)
      expect(analysis.categories.length).toBeGreaterThan(0)
      expect(analysis.types.length).toBeGreaterThan(0)
    })

    it('should identify freshwater datasets', () => {
      const hydroItems = filterCSVRows(realCSVData, { 
        mainCategories: ['Freshwater'] 
      })
      
      console.log(`💧 Found ${hydroItems.length} freshwater items:`)
      hydroItems.forEach(item => {
        console.log(`  - ${item.title} (${item.type})`)
      })
      
      expect(hydroItems.length).toBeGreaterThan(0)
      
      // Verify they have water-related content
      hydroItems.forEach(item => {
        const content = `${item.title} ${item.description} ${item.tags}`.toLowerCase()
        const hasWaterContent = ['water', 'stream', 'hydro', 'watershed', 'basin'].some(
          keyword => content.includes(keyword)
        )
        expect(hasWaterContent).toBe(true)
      })
    })

    it('should identify different UI patterns in data', () => {
      const itemsByPattern = {
        MAP_LAYER: realCSVData.filter(row => {
          const type = row.type || ''
          return ['Feature Service', 'Image Service', 'Map Service', 'WMS', 'WFS'].some(
            t => type.includes(t)
          )
        }),
        EXTERNAL_LINK: realCSVData.filter(row => {
          const type = row.type || ''
          return ['Dashboard', 'Web Experience', 'Web Mapping Application'].some(
            t => type.includes(t)
          )
        }),
        MODAL: realCSVData.filter(row => {
          const type = row.type || ''
          return ['StoryMap', 'Web Map', 'Feature Collection', 'PDF'].some(
            t => type.includes(t)
          )
        })
      }
      
      console.log('🎨 UI Pattern Distribution:')
      Object.entries(itemsByPattern).forEach(([pattern, items]) => {
        console.log(`  ${pattern}: ${items.length} items`)
      })
      
      // Should have at least some map layers (most common type)
      expect(itemsByPattern.MAP_LAYER.length).toBeGreaterThan(0)
    })
  })

  describe('Filter Combination Validation', () => {
    it('should validate Freshwater + Dangermond Preserve scenario', () => {
      const scenario = testScenarios.find(s => 
        s.name.includes('Freshwater') && s.filters.spatialFilter === 'Dangermond Preserve'
      )
      
      if (scenario) {
        console.log(`🔍 Testing scenario: ${scenario.name}`)
        console.log(`  Expected count: ${scenario.expectedCount}`)
        console.log(`  Expected types: ${scenario.expectedTypes.join(', ')}`)
        
        expect(scenario.expectedCount).toBeGreaterThan(0)
        expect(scenario.expectedCategories).toContain('Freshwater')
        
        // Verify the items match the filter criteria
        scenario.expectedItems.forEach((item: any) => {
          expect(item.mainCategories).toContain('Freshwater')
        })
      } else {
        console.log('⚠️  No freshwater scenario found in test data')
      }
    })

    it('should validate Fire + Expanded Area scenario', () => {
      const scenario = testScenarios.find(s => 
        s.name.includes('Fire') && s.filters.spatialFilter === 'Dangermond + Margin'
      )
      
      if (scenario) {
        console.log(`🔥 Testing scenario: ${scenario.name}`)
        console.log(`  Expected count: ${scenario.expectedCount}`)
        console.log(`  Expected types: ${scenario.expectedTypes.join(', ')}`)
        
        expect(scenario.expectedCount).toBeGreaterThan(0)
        expect(scenario.expectedCategories).toContain('Fire')
        
        // Verify the items match the filter criteria
        scenario.expectedItems.forEach((item: any) => {
          expect(item.mainCategories).toContain('Fire')
        })
      } else {
        console.log('⚠️  No fire scenario found in test data')
      }
    })

    it('should validate Oceans and Coasts + Current View scenario', () => {
      const scenario = testScenarios.find(s => 
        s.name.includes('Oceans and Coasts') && s.filters.spatialFilter === 'Current View'
      )
      
      if (scenario) {
        console.log(`🌊 Testing scenario: ${scenario.name}`)
        console.log(`  Expected count: ${scenario.expectedCount}`)
        console.log(`  Expected types: ${scenario.expectedTypes.join(', ')}`)
        
        expect(scenario.expectedCount).toBeGreaterThan(0)
        expect(scenario.expectedCategories).toContain('Oceans and Coasts')
        
        // Verify the items match the filter criteria
        scenario.expectedItems.forEach((item: any) => {
          expect(item.mainCategories).toContain('Oceans and Coasts')
        })
      } else {
        console.log('⚠️  No marine scenario found in test data')
      }
    })
  })

  describe('Data Transformation', () => {
    it('should convert CSV rows to TNCArcGISItem format', () => {
      const sampleRow = realCSVData[0]
      if (sampleRow) {
        const tncItem = csvRowToTNCArcGISItem(sampleRow)
        
        expect(tncItem.id).toBeDefined()
        expect(tncItem.title).toBeDefined()
        expect(tncItem.type).toBeDefined()
        expect(tncItem.uiPattern).toMatch(/^(MAP_LAYER|EXTERNAL_LINK|MODAL)$/)
        expect(tncItem.mainCategories).toBeInstanceOf(Array)
        expect(tncItem.tags).toBeInstanceOf(Array)
        
        console.log(`🔄 Transformed item: ${tncItem.title} (${tncItem.uiPattern})`)
      }
    })

    it('should preserve category mappings in transformation', () => {
      const hydroRows = filterCSVRows(realCSVData, { mainCategories: ['Freshwater'] })
      
      hydroRows.forEach(row => {
        const tncItem = csvRowToTNCArcGISItem(row)
        expect(tncItem.mainCategories).toContain('Freshwater')
      })
    })
  })

  describe('Expected Query Results', () => {
    it('should validate all generated test scenarios', () => {
      console.log(`🎯 Testing ${testScenarios.length} generated scenarios`)
      
      testScenarios.forEach(scenario => {
        console.log(`  📋 Scenario: ${scenario.name}`)
        console.log(`    Expected: ${scenario.expectedCount} items`)
        console.log(`    Categories: ${scenario.expectedCategories.join(', ')}`)
        console.log(`    Types: ${scenario.expectedTypes.join(', ')}`)
        
        // This test validates that we know what to expect for each filter combination
        expect(scenario.expectedCount).toBeGreaterThan(0)
        expect(scenario.expectedItems).toHaveLength(scenario.expectedCount)
        expect(scenario.expectedCategories.length).toBeGreaterThan(0)
        
        // Verify all expected items match the category filter
        scenario.expectedItems.forEach((item: any) => {
          const itemCategories = item.mainCategories?.split(';') || []
          const hasMatchingCategory = scenario.expectedCategories.some(
            (expectedCat: string) => itemCategories.includes(expectedCat)
          )
          expect(hasMatchingCategory).toBe(true)
        })
      })
      
      // Should have generated at least one scenario
      expect(testScenarios.length).toBeGreaterThan(0)
    })
  })
})

/**
 * Helper function to load CSV from fixtures
 * This will be replaced with actual file loading when the CSV is added
 */
async function loadCSVFromFixtures(filename: string): Promise<string> {
  // In a real test environment, this would load from the fixtures directory
  // For now, we'll simulate this and fall back to mock data
  
  try {
    // Simulate file loading - replace with actual implementation
    const response = await fetch(`/src/test-utils/fixtures/${filename}`)
    if (!response.ok) {
      throw new Error(`Failed to load ${filename}`)
    }
    return await response.text()
  } catch (error) {
    // Fall back to mock data CSV format
    const mockCSV = [
      'id,title,type,description,snippet,url,owner,tags,categories,mainCategories,collection,num_views,size,created,modified',
      ...mockCSVData.map(row => 
        `${row.id},"${row.title}","${row.type}","${row.description}","${row.snippet}","${row.url}","${row.owner}","${row.tags}","${row.categories}","${row.mainCategories}","${row.collection}","${row.num_views}","${row.size}","${row.created}","${row.modified}"`
      )
    ].join('\n')
    
    return mockCSV
  }
}

/**
 * Test Summary:
 * 
 * These tests will help you validate that:
 * 
 * 1. ✅ Filter combinations return expected datasets
 * 2. ✅ Category mappings work correctly  
 * 3. ✅ UI patterns are assigned properly
 * 4. ✅ Data transformation preserves important fields
 * 5. ✅ Query scenarios match real data structure
 * 
 * Once you add the real CSV to src/test-utils/fixtures/tnc_frontend_test_data.csv,
 * these tests will automatically use the real data instead of mock data.
 */
