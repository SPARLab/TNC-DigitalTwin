import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TNCArcGISSidebar from './TNCArcGISSidebar'
import { 
  createMockTNCItemCollection, 
  createMockTNCArcGISItem 
} from '../test-utils/factories'
import { renderWithProviders } from '../test-utils/test-helpers'

describe('TNCArcGISSidebar', () => {
  const mockProps = {
    items: createMockTNCItemCollection(),
    isLoading: false,
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

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render sidebar with items', () => {
      renderWithProviders(<TNCArcGISSidebar {...mockProps} />)

      expect(screen.getByText('TNC Data Catalog')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Search datasets...')).toBeInTheDocument()
      expect(screen.getByText(`${mockProps.items.length} items`)).toBeInTheDocument()
    })

    it('should show loading state', () => {
      renderWithProviders(<TNCArcGISSidebar {...mockProps} isLoading={true} />)

      expect(screen.getByRole('status')).toBeInTheDocument()
      // Should show loading spinner
      expect(document.querySelector('.animate-spin')).toBeInTheDocument()
    })

    it('should show empty state when no items', () => {
      renderWithProviders(<TNCArcGISSidebar {...mockProps} items={[]} />)

      expect(screen.getByText('No items found')).toBeInTheDocument()
      expect(screen.getByText('No data available')).toBeInTheDocument()
    })

    it('should display export buttons when handlers provided', () => {
      renderWithProviders(<TNCArcGISSidebar {...mockProps} />)

      expect(screen.getByRole('button', { name: /csv/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /geojson/i })).toBeInTheDocument()
    })

    it('should not display export buttons when handlers not provided', () => {
      const propsWithoutExport = {
        ...mockProps,
        onExportCSV: undefined,
        onExportGeoJSON: undefined
      }
      renderWithProviders(<TNCArcGISSidebar {...propsWithoutExport} />)

      expect(screen.queryByRole('button', { name: /csv/i })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /geojson/i })).not.toBeInTheDocument()
    })
  })

  describe('Search Functionality', () => {
    it('should filter items by search query', async () => {
      const user = userEvent.setup()
      renderWithProviders(<TNCArcGISSidebar {...mockProps} />)

      const searchInput = screen.getByPlaceholderText('Search datasets...')
      await user.type(searchInput, 'stream')

      // Should show only items matching "stream"
      expect(screen.getByText('Stream Network Data')).toBeInTheDocument()
      expect(screen.queryByText('Fire History Map')).not.toBeInTheDocument()
    })

    it('should show no results message when search has no matches', async () => {
      const user = userEvent.setup()
      renderWithProviders(<TNCArcGISSidebar {...mockProps} />)

      const searchInput = screen.getByPlaceholderText('Search datasets...')
      await user.type(searchInput, 'nonexistent')

      expect(screen.getByText('No items found')).toBeInTheDocument()
      expect(screen.getByText('Try adjusting your search or filters')).toBeInTheDocument()
    })
  })

  describe('Category Filtering', () => {
    it('should show filter controls when toggle is clicked', async () => {
      const user = userEvent.setup()
      renderWithProviders(<TNCArcGISSidebar {...mockProps} />)

      const filterButton = screen.getByTitle('Toggle filters')
      await user.click(filterButton)

      expect(screen.getByText('Filters')).toBeInTheDocument()
      expect(screen.getByText('Categories')).toBeInTheDocument()
      expect(screen.getByText('Data Types')).toBeInTheDocument()
    })

    it('should filter items by category', async () => {
      const user = userEvent.setup()
      renderWithProviders(<TNCArcGISSidebar {...mockProps} />)

      // Open filters
      const filterButton = screen.getByTitle('Toggle filters')
      await user.click(filterButton)

      // Click on Freshwater category filter
      const hydroButton = screen.getByRole('button', { name: 'Freshwater' })
      await user.click(hydroButton)

      // Should show only freshwater items
      expect(screen.getByText('Stream Network Data')).toBeInTheDocument()
      expect(screen.getByText('Watershed Boundaries')).toBeInTheDocument()
      expect(screen.queryByText('Fire History Map')).not.toBeInTheDocument()
    })

    it('should filter items by UI pattern', async () => {
      const user = userEvent.setup()
      renderWithProviders(<TNCArcGISSidebar {...mockProps} />)

      // Open filters
      const filterButton = screen.getByTitle('Toggle filters')
      await user.click(filterButton)

      // Click on MAP LAYER pattern filter
      const mapLayerButton = screen.getByRole('button', { name: /map layer/i })
      await user.click(mapLayerButton)

      // Should show only map layer items
      const mapLayerItems = mockProps.items.filter(item => item.uiPattern === 'MAP_LAYER')
      mapLayerItems.forEach(item => {
        expect(screen.getByText(item.title)).toBeInTheDocument()
      })
    })

    it('should clear all filters', async () => {
      const user = userEvent.setup()
      renderWithProviders(<TNCArcGISSidebar {...mockProps} />)

      // Open filters and apply some
      const filterButton = screen.getByTitle('Toggle filters')
      await user.click(filterButton)

      const hydroButton = screen.getByRole('button', { name: 'Freshwater' })
      await user.click(hydroButton)

      // Clear all filters
      const clearButton = screen.getByText('Clear all')
      await user.click(clearButton)

      // Should show all items again
      expect(screen.getByText(`${mockProps.items.length} items`)).toBeInTheDocument()
    })
  })

  describe('Item Interactions', () => {
    it('should handle MAP_LAYER item clicks', async () => {
      const user = userEvent.setup()
      const mapLayerItem = createMockTNCArcGISItem({
        id: 'test-map-layer',
        title: 'Test Map Layer',
        uiPattern: 'MAP_LAYER'
      })
      
      renderWithProviders(
        <TNCArcGISSidebar {...mockProps} items={[mapLayerItem]} />
      )

      const itemElement = screen.getByText('Test Map Layer')
      await user.click(itemElement)

      expect(mockProps.onItemSelect).toHaveBeenCalledWith(mapLayerItem)
      expect(mockProps.onLayerToggle).toHaveBeenCalledWith('test-map-layer')
    })

    it('should handle EXTERNAL_LINK item clicks', async () => {
      const user = userEvent.setup()
      
      const externalLinkItem = createMockTNCArcGISItem({
        id: 'test-external-link',
        title: 'Test External Link',
        uiPattern: 'EXTERNAL_LINK',
        url: 'https://example.com/app'
      })
      
      renderWithProviders(
        <TNCArcGISSidebar {...mockProps} items={[externalLinkItem]} />
      )

      const itemElement = screen.getByText('Test External Link')
      await user.click(itemElement)

      expect(mockProps.onItemSelect).toHaveBeenCalledWith(externalLinkItem)
      // External links don't auto-open on click - user needs to use the button in expanded view
    })

    it('should handle MODAL item clicks', async () => {
      const user = userEvent.setup()
      const modalItem = createMockTNCArcGISItem({
        id: 'test-modal',
        title: 'Test Modal Item',
        uiPattern: 'MODAL'
      })
      
      renderWithProviders(
        <TNCArcGISSidebar {...mockProps} items={[modalItem]} />
      )

      const itemElement = screen.getByText('Test Modal Item')
      await user.click(itemElement)

      expect(mockProps.onItemSelect).toHaveBeenCalledWith(modalItem)
      expect(mockProps.onModalOpen).toHaveBeenCalledWith(modalItem)
    })
  })

  describe('Layer Management', () => {
    it('should show active layer styling', () => {
      const mapLayerItem = createMockTNCArcGISItem({
        id: 'active-layer',
        title: 'Active Layer',
        uiPattern: 'MAP_LAYER'
      })
      
      renderWithProviders(
        <TNCArcGISSidebar 
          {...mockProps} 
          items={[mapLayerItem]}
          activeLayerIds={['active-layer']}
        />
      )

      const itemElement = screen.getByText('Active Layer').closest('.map-layer-card')
      expect(itemElement).toHaveClass('bg-blue-50', 'border-blue-300')
    })

    it('should show opacity control for active layers', () => {
      const mapLayerItem = createMockTNCArcGISItem({
        id: 'active-layer',
        title: 'Active Layer',
        uiPattern: 'MAP_LAYER'
      })
      
      renderWithProviders(
        <TNCArcGISSidebar 
          {...mockProps} 
          items={[mapLayerItem]}
          activeLayerIds={['active-layer']}
        />
      )

      expect(screen.getByLabelText('Opacity')).toBeInTheDocument()
      expect(screen.getByRole('slider')).toBeInTheDocument()
    })

    it('should handle opacity changes', async () => {
      const mapLayerItem = createMockTNCArcGISItem({
        id: 'active-layer',
        title: 'Active Layer',
        uiPattern: 'MAP_LAYER'
      })
      
      renderWithProviders(
        <TNCArcGISSidebar 
          {...mockProps} 
          items={[mapLayerItem]}
          activeLayerIds={['active-layer']}
        />
      )

      const opacitySlider = screen.getByRole('slider')
      fireEvent.change(opacitySlider, { target: { value: '50' } })

      expect(mockProps.onLayerOpacityChange).toHaveBeenCalledWith('active-layer', 50)
    })
  })

  describe('Modal Management', () => {
    it('should show modal when selectedModalItem is provided', () => {
      const modalItem = createMockTNCArcGISItem({
        id: 'modal-item',
        title: 'Modal Item',
        type: 'StoryMap',
        uiPattern: 'MODAL'
      })
      
      renderWithProviders(
        <TNCArcGISSidebar 
          {...mockProps} 
          selectedModalItem={modalItem}
        />
      )

      expect(screen.getByText('Modal Item')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument()
    })

    it('should render StoryMap in iframe', () => {
      const storyMapItem = createMockTNCArcGISItem({
        id: 'story-map',
        title: 'Story Map',
        type: 'StoryMap',
        url: 'https://example.com/storymap',
        uiPattern: 'MODAL'
      })
      
      renderWithProviders(
        <TNCArcGISSidebar 
          {...mockProps} 
          selectedModalItem={storyMapItem}
        />
      )

      const iframe = screen.getByTitle('Story Map')
      expect(iframe).toBeInTheDocument()
      expect(iframe).toHaveAttribute('src', 'https://example.com/storymap')
    })

    it('should render metadata view for non-StoryMap items', () => {
      const webMapItem = createMockTNCArcGISItem({
        id: 'web-map',
        title: 'Web Map',
        type: 'Web Map',
        description: 'A test web map',
        uiPattern: 'MODAL'
      })
      
      renderWithProviders(
        <TNCArcGISSidebar 
          {...mockProps} 
          selectedModalItem={webMapItem}
        />
      )

      expect(screen.getByText('Description')).toBeInTheDocument()
      expect(screen.getByText('A test web map')).toBeInTheDocument()
      expect(screen.getByText('View in ArcGIS')).toBeInTheDocument()
    })

    it('should close modal when close button is clicked', async () => {
      const user = userEvent.setup()
      const modalItem = createMockTNCArcGISItem({
        id: 'modal-item',
        title: 'Modal Item',
        uiPattern: 'MODAL'
      })
      
      renderWithProviders(
        <TNCArcGISSidebar 
          {...mockProps} 
          selectedModalItem={modalItem}
        />
      )

      const closeButton = screen.getByRole('button', { name: /close/i })
      await user.click(closeButton)

      expect(mockProps.onModalClose).toHaveBeenCalled()
    })
  })

  describe('Export Functions', () => {
    it('should call onExportCSV when CSV button is clicked', async () => {
      const user = userEvent.setup()
      renderWithProviders(<TNCArcGISSidebar {...mockProps} />)

      const csvButton = screen.getByRole('button', { name: /csv/i })
      await user.click(csvButton)

      expect(mockProps.onExportCSV).toHaveBeenCalled()
    })

    it('should call onExportGeoJSON when GeoJSON button is clicked', async () => {
      const user = userEvent.setup()
      renderWithProviders(<TNCArcGISSidebar {...mockProps} />)

      const geoJsonButton = screen.getByRole('button', { name: /geojson/i })
      await user.click(geoJsonButton)

      expect(mockProps.onExportGeoJSON).toHaveBeenCalled()
    })
  })

  describe('Statistics Display', () => {
    it('should show correct item counts by UI pattern', () => {
      renderWithProviders(<TNCArcGISSidebar {...mockProps} />)

      const mapLayerCount = mockProps.items.filter(item => item.uiPattern === 'MAP_LAYER').length
      const externalLinkCount = mockProps.items.filter(item => item.uiPattern === 'EXTERNAL_LINK').length
      const modalCount = mockProps.items.filter(item => item.uiPattern === 'MODAL').length

      // Check that the counts are displayed (exact text may vary based on implementation)
      expect(screen.getByText(mapLayerCount.toString())).toBeInTheDocument()
      expect(screen.getByText(externalLinkCount.toString())).toBeInTheDocument()
      expect(screen.getByText(modalCount.toString())).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      renderWithProviders(<TNCArcGISSidebar {...mockProps} />)

      expect(screen.getByPlaceholderText('Search datasets...')).toHaveAttribute('type', 'text')
      expect(screen.getByTitle('Toggle filters')).toBeInTheDocument()
    })

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup()
      renderWithProviders(<TNCArcGISSidebar {...mockProps} />)

      const searchInput = screen.getByPlaceholderText('Search datasets...')
      
      // Should be focusable
      await user.tab()
      expect(searchInput).toHaveFocus()
    })
  })
})
