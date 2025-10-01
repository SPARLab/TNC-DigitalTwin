import '@testing-library/jest-dom'

// Mock ArcGIS Core modules
vi.mock('@arcgis/core/Map', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      add: vi.fn(),
      remove: vi.fn(),
      layers: {
        add: vi.fn(),
        remove: vi.fn(),
        removeAll: vi.fn()
      }
    }))
  }
})

vi.mock('@arcgis/core/views/MapView', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      map: null,
      center: [-120.0707, 34.4669],
      zoom: 12,
      when: vi.fn().mockResolvedValue(true),
      goTo: vi.fn().mockResolvedValue(true),
      hitTest: vi.fn().mockResolvedValue({ results: [] }),
      toMap: vi.fn(),
      toScreen: vi.fn()
    }))
  }
})

vi.mock('@arcgis/core/layers/FeatureLayer', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      url: '',
      title: '',
      opacity: 1,
      visible: true,
      load: vi.fn().mockResolvedValue(true),
      queryFeatures: vi.fn().mockResolvedValue({ features: [] })
    }))
  }
})

vi.mock('@arcgis/core/layers/ImageryLayer', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      url: '',
      title: '',
      opacity: 1,
      visible: true,
      load: vi.fn().mockResolvedValue(true)
    }))
  }
})

vi.mock('@arcgis/core/layers/MapImageLayer', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      url: '',
      title: '',
      opacity: 1,
      visible: true,
      load: vi.fn().mockResolvedValue(true)
    }))
  }
})

// Mock echarts if used
vi.mock('echarts', () => ({
  init: vi.fn(() => ({
    setOption: vi.fn(),
    resize: vi.fn(),
    dispose: vi.fn()
  })),
  dispose: vi.fn()
}))

// Mock fetch for API calls
global.fetch = vi.fn()

// Mock window.URL for file downloads
Object.defineProperty(window, 'URL', {
  value: {
    createObjectURL: vi.fn(() => 'mock-url'),
    revokeObjectURL: vi.fn()
  }
})

// Mock window.open for external links
Object.defineProperty(window, 'open', {
  value: vi.fn()
})

// Setup console mocks to reduce noise in tests
const originalError = console.error
const originalWarn = console.warn

beforeAll(() => {
  console.error = vi.fn()
  console.warn = vi.fn()
})

afterAll(() => {
  console.error = originalError
  console.warn = originalWarn
})

