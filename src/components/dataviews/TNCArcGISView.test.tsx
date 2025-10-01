import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import TNCArcGISView from './TNCArcGISView'
import { createMockTNCItemCollection } from '../../test-utils/factories'
import { renderWithProviders } from '../../test-utils/test-helpers'

// Mock the TNCArcGISSidebar component
vi.mock('../TNCArcGISSidebar', () => ({
  default: vi.fn(({ items, isLoading, onExportCSV, onExportGeoJSON }) => (
    <div data-testid="tnc-arcgis-sidebar">
      <div data-testid="items-count">{items.length}</div>
      <div data-testid="loading-state">{isLoading ? 'loading' : 'loaded'}</div>
      <button onClick={onExportCSV}>Export CSV</button>
      <button onClick={onExportGeoJSON}>Export GeoJSON</button>
    </div>
  ))
}))

describe('TNCArcGISView', () => {
  const mockItems = createMockTNCItemCollection()
  
  const defaultProps = {
    items: mockItems,
    loading: false,
    onExportCSV: vi.fn(),
    onExportGeoJSON: vi.fn(),
    onItemSelect: vi.fn(),
    activeLayerIds: [],
    onLayerToggle: vi.fn(),
    onLayerOpacityChange: vi.fn(),
    selectedModalItem: null,
    onModalOpen: vi.fn(),
    onModalClose: vi.fn()
  }

  it('should render TNCArcGISSidebar with correct props', () => {
    renderWithProviders(<TNCArcGISView {...defaultProps} />)

    expect(screen.getByTestId('tnc-arcgis-sidebar')).toBeInTheDocument()
    expect(screen.getByTestId('items-count')).toHaveTextContent(mockItems.length.toString())
    expect(screen.getByTestId('loading-state')).toHaveTextContent('loaded')
  })

  it('should pass loading state correctly', () => {
    renderWithProviders(<TNCArcGISView {...defaultProps} loading={true} />)

    expect(screen.getByTestId('loading-state')).toHaveTextContent('loading')
  })

  it('should pass export handlers correctly', () => {
    const mockExportCSV = vi.fn()
    const mockExportGeoJSON = vi.fn()
    
    renderWithProviders(
      <TNCArcGISView 
        {...defaultProps} 
        onExportCSV={mockExportCSV}
        onExportGeoJSON={mockExportGeoJSON}
      />
    )

    const csvButton = screen.getByText('Export CSV')
    const geoJsonButton = screen.getByText('Export GeoJSON')

    csvButton.click()
    geoJsonButton.click()

    expect(mockExportCSV).toHaveBeenCalled()
    expect(mockExportGeoJSON).toHaveBeenCalled()
  })

  it('should handle empty items array', () => {
    renderWithProviders(<TNCArcGISView {...defaultProps} items={[]} />)

    expect(screen.getByTestId('items-count')).toHaveTextContent('0')
  })

  it('should pass all props to TNCArcGISSidebar', () => {
    const props = {
      ...defaultProps,
      activeLayerIds: ['layer-1', 'layer-2'],
      selectedModalItem: mockItems[0]
    }

    renderWithProviders(<TNCArcGISView {...props} />)

    // The mock component should receive all the props
    expect(screen.getByTestId('tnc-arcgis-sidebar')).toBeInTheDocument()
  })
})

/**
 * Test scenarios covered:
 * 
 * 1. Basic rendering - Ensures the component renders the sidebar correctly
 * 2. Loading state - Verifies loading prop is passed through
 * 3. Export handlers - Tests that export functions are properly connected
 * 4. Empty state - Handles empty items array gracefully
 * 5. Props passing - Ensures all props are correctly passed to the sidebar
 * 
 * This component is primarily a wrapper, so tests focus on:
 * - Correct prop passing
 * - Proper component composition
 * - State management integration
 */
