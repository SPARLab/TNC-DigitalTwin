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
      width: 800,
      height: 600,
      destroyed: false,
      container: null,
      popup: { dockEnabled: false },
      ui: { add: vi.fn(), remove: vi.fn() },
      when: vi.fn().mockResolvedValue(true),
      goTo: vi.fn().mockResolvedValue(true),
      hitTest: vi.fn().mockResolvedValue({ results: [] }),
      watch: vi.fn(() => ({ remove: vi.fn() })),
      on: vi.fn(() => ({ remove: vi.fn() })),
      destroy: vi.fn(),
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

// jsdom ships no ResizeObserver, and ArcGIS widget modules touch it at import
// time, so any component importing a widget fails to load without this.
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Stub the blob helpers jsdom does not implement, but keep the native URL
// constructor intact — react-router and several services rely on `new URL(...)`.
window.URL.createObjectURL = vi.fn(() => 'mock-url')
window.URL.revokeObjectURL = vi.fn()

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

