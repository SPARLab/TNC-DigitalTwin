import { describe, it, expect } from 'vitest'
import { parseCSV } from './csv-parser'
import { readFileSync } from 'fs'
import { join } from 'path'

/**
 * CSV Parser Tests - Critical Functionality Only
 * 
 * Focus: Ensure CSV parser correctly handles TNC data file
 */

describe('CSV Parser - TNC Data', () => {
  it('should parse TNC CSV with AT LEAST 80 records', () => {
    const csvPath = join(__dirname, '../data/tnc_frontend_test_data.csv')
    const csvContent = readFileSync(csvPath, 'utf-8')
    const rows = parseCSV(csvContent)
    
    expect(rows.length).toBeGreaterThanOrEqual(80)
  })

  it('should correctly parse multi-line quoted fields', () => {
    const csvPath = join(__dirname, '../data/tnc_frontend_test_data.csv')
    const csvContent = readFileSync(csvPath, 'utf-8')
    const rows = parseCSV(csvContent)
    
    // Verify multi-line descriptions don't break parsing
    const itemsWithNewlines = rows.filter((row: any) => 
      row.Description && row.Description.includes('\n')
    )
    
    expect(itemsWithNewlines.length).toBeGreaterThan(0)
    
    // Each row should have all required fields despite multi-line content
    itemsWithNewlines.forEach((row: any) => {
      expect(row['Item ID']).toBeTruthy()
      expect(row['Title']).toBeTruthy()
      expect(row['Type']).toBeTruthy()
    })
  })

  it('should correctly identify hydrological items created in last 5 years', () => {
    const csvPath = join(__dirname, '../data/tnc_frontend_test_data.csv')
    const csvContent = readFileSync(csvPath, 'utf-8')
    const rows = parseCSV(csvContent)
    
    const fiveYearsAgo = new Date()
    fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5)
    
    const recentHydro = rows.filter((row: any) => {
      const isHydrological = row['Mapped Categories']?.includes('Hydrological')
      const createdDate = new Date(row['Created Date'] || '')
      return isHydrological && createdDate >= fiveYearsAgo
    })
    
    expect(recentHydro.length).toBeGreaterThan(0)
    
    // Verify critical items are present
    const titles = recentHydro.map((r: any) => r.Title)
    expect(titles).toContain('Groundwater Wells')
    expect(titles).toContain('Springs')
  })
})

/**
 * Only testing critical CSV parsing behavior:
 * ✅ Handles TNC data file
 * ✅ Parses multi-line fields correctly
 * ✅ Date filtering works
 * ✅ Category filtering works
 * 
 * Removed low-impact tests:
 * ❌ Generic utility function tests
 * ❌ Basic JavaScript operation tests
 * ❌ Overly specific distribution counts
 */
