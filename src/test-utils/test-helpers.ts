import React from 'react'
import { render } from '@testing-library/react'
import { vi } from 'vitest'

/**
 * Mock providers for testing components that need context
 */
export const renderWithProviders = (ui: React.ReactElement) => {
  return render(ui)
}

/**
 * Mock fetch function for API testing
 */
export const mockFetch = (responses: Array<{
  url: string
  response: any
  ok?: boolean
  status?: number
}>) => {
  global.fetch = vi.fn().mockImplementation((url: string) => {
    const matchingResponse = responses.find(r => url.includes(r.url))
    
    if (matchingResponse) {
      return Promise.resolve({
        ok: matchingResponse.ok ?? true,
        status: matchingResponse.status ?? 200,
        json: () => Promise.resolve(matchingResponse.response),
        text: () => Promise.resolve(JSON.stringify(matchingResponse.response))
      } as Response)
    }
    
    // Default response for unmatched URLs
    return Promise.resolve({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ error: 'Not found' }),
      text: () => Promise.resolve('Not found')
    } as Response)
  })
}

/**
 * Mock console methods for testing
 */
export const mockConsole = () => {
  const originalConsole = {
    log: console.log,
    warn: console.warn,
    error: console.error,
    info: console.info
  }

  const mocks = {
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn()
  }

  // Override console methods
  console.log = mocks.log
  console.warn = mocks.warn
  console.error = mocks.error
  console.info = mocks.info

  return {
    mocks,
    restore: () => {
      console.log = originalConsole.log
      console.warn = originalConsole.warn
      console.error = originalConsole.error
      console.info = originalConsole.info
    }
  }
}

/**
 * Mock Date for consistent testing
 */
export const mockDate = (mockDate: string | Date) => {
  const originalDate = Date
  const mockedDate = new Date(mockDate)

  global.Date = vi.fn().mockImplementation((...args) => {
    if (args.length === 0) {
      return mockedDate
    }
    return new originalDate(...args as any)
  }) as any

  // Mock static methods
  global.Date.now = vi.fn(() => mockedDate.getTime())
  global.Date.UTC = originalDate.UTC
  global.Date.parse = originalDate.parse

  return {
    restore: () => {
      global.Date = originalDate
    }
  }
}

/**
 * Mock localStorage for testing
 */
export const mockLocalStorage = () => {
  const storage: Record<string, string> = {}

  const mockStorage = {
    getItem: vi.fn((key: string) => storage[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      storage[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete storage[key]
    }),
    clear: vi.fn(() => {
      Object.keys(storage).forEach(key => delete storage[key])
    }),
    length: 0,
    key: vi.fn()
  }

  Object.defineProperty(window, 'localStorage', {
    value: mockStorage,
    writable: true
  })

  return mockStorage
}

/**
 * Test component that throws an error
 */
export const ThrowError: React.FC<{ shouldThrow: boolean }> = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('Test error')
  }
  return React.createElement('div', null, 'No error')
}

/**
 * Mock window methods commonly used in the app
 */
export const mockWindowMethods = () => {
  const originalOpen = window.open
  const mockOpen = vi.fn()
  
  window.open = mockOpen
  
  return {
    mockOpen,
    restore: () => {
      window.open = originalOpen
    }
  }
}

/**
 * Create a mock API response for testing
 */
export const createMockApiResponse = <T>(data: T, success = true) => {
  return {
    ok: success,
    status: success ? 200 : 500,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data))
  } as Response
}

/**
 * Wait for async operations in tests
 */
export const waitFor = (condition: () => boolean, timeout = 1000): Promise<void> => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now()
    
    const check = () => {
      if (condition()) {
        resolve()
      } else if (Date.now() - startTime > timeout) {
        reject(new Error('Timeout waiting for condition'))
      } else {
        setTimeout(check, 10)
      }
    }
    
    check()
  })
}

/**
 * Mock timer functions for testing
 */
export const mockTimers = () => {
  vi.useFakeTimers()
  
  return {
    advance: (ms: number) => vi.advanceTimersByTime(ms),
    restore: () => vi.useRealTimers()
  }
}

/**
 * Helper to create test data with consistent structure
 */
export const createTestData = <T extends Record<string, any>>(
  baseData: T,
  overrides: Partial<T> = {}
): T => {
  return { ...baseData, ...overrides }
}

/**
 * Mock intersection observer for testing
 */
export const mockIntersectionObserver = () => {
  const mockObserver = {
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn()
  }

  global.IntersectionObserver = vi.fn().mockImplementation(() => mockObserver)
  
  return mockObserver
}

/**
 * Mock resize observer for testing
 */
export const mockResizeObserver = () => {
  const mockObserver = {
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn()
  }

  global.ResizeObserver = vi.fn().mockImplementation(() => mockObserver)
  
  return mockObserver
}