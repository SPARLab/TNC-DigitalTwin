# Testing Framework for TNC ArcGIS Integration

This directory contains the testing framework and utilities for the TNC ArcGIS Hub integration in the Dangermond Preserve Data Catalog.

## Overview

The testing framework is built using:
- **Vitest** - Fast unit test runner
- **React Testing Library** - Component testing utilities
- **@testing-library/user-event** - User interaction simulation
- **jsdom** - DOM environment for testing

## Test Structure

### Unit Tests
- `src/services/tncArcGISService.test.ts` - Tests for the TNC ArcGIS API service
- `src/components/TNCArcGISSidebar.test.tsx` - Tests for the main sidebar component
- `src/components/dataviews/TNCArcGISView.test.tsx` - Tests for the view wrapper component

### Integration Tests
- `src/test-utils/integration-tests.test.ts` - End-to-end filter parameter combination tests

### Test Utilities
- `factories.ts` - Mock data factories for creating test data
- `test-helpers.ts` - Common testing utilities and helpers
- `README.md` - This documentation file

## Key Test Scenarios

### Filter Parameter Combinations

The integration tests verify that specific filter combinations produce expected results:

1. **Freshwater + Dangermond Preserve + Last 6 months**
   - Should return freshwater datasets
   - Should show MAP_LAYER and EXTERNAL_LINK UI patterns
   - Should enable layer toggling for map services

2. **Fire + Dangermond + Margin + 2020-2024**
   - Should return fire-related datasets
   - Should show MAP_LAYER and MODAL UI patterns
   - Should handle StoryMap content in modals

3. **Land Cover + Current View + Custom Date Range**
   - Should return land cover/habitat datasets
   - Should respect custom date filtering
   - Should show appropriate UI patterns

4. **Oceans and Coasts + Draw Area + Last 6 months**
   - Should return oceans and coasts datasets
   - Should handle spatial filtering
   - Should show map layer controls

### Service Testing

The `tncArcGISService.test.ts` covers:

- **API Data Fetching**
  - Fetching datasets from TNC Hub API
  - Fetching documents from TNC Hub API
  - Filtering out Hub Pages from results

- **Category Mapping**
  - Mapping tags to main categories (e.g., "Water" → "Freshwater")
  - Mapping hierarchical categories to main categories
  - Handling multiple category assignments

- **UI Pattern Detection**
  - MAP_LAYER for Feature/Image/Map Services
  - EXTERNAL_LINK for Dashboards/Web Experiences
  - MODAL for StoryMaps/Documents

- **Filtering Logic**
  - Category-based filtering
  - Type-based filtering
  - Search query filtering
  - Combined filter scenarios

- **Error Handling**
  - API error responses
  - Network failures
  - Rate limiting behavior

### Component Testing

The component tests verify:

- **Rendering Behavior**
  - Proper display of items and statistics
  - Loading states and empty states
  - Export button visibility

- **User Interactions**
  - Search functionality
  - Filter controls
  - Item clicking (map layers, external links, modals)
  - Layer opacity controls

- **State Management**
  - Active layer highlighting
  - Modal open/close behavior
  - Filter state updates

## Mock Data

### Factory Functions

```typescript
// Create a single mock TNC item
const mockItem = createMockTNCArcGISItem({
  title: 'Custom Title',
  type: 'Feature Service',
  mainCategories: ['Freshwater']
})

// Create a collection of mock items
const mockCollection = createMockTNCItemCollection()

// Create mock filter state
const mockFilters = createMockFilterState({
  category: 'Freshwater',
  spatialFilter: 'Dangermond Preserve'
})
```

### Test Scenarios

Pre-defined test scenarios are available in `filterTestScenarios`:

```typescript
const scenario = filterTestScenarios[0]
// {
//   name: 'Freshwater category with Dangermond Preserve spatial filter',
//   filters: { category: 'Freshwater', ... },
//   expectedItemCount: 3,
//   expectedUIPatterns: ['MAP_LAYER', 'EXTERNAL_LINK']
// }
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test

# Run tests with UI
npm run test:ui

# Run tests once
npm run test:run

# Run tests with coverage
npm run test:coverage
```

## Test Configuration

### Vitest Config (`vitest.config.ts`)
- Uses jsdom environment for DOM testing
- Includes test setup file
- Mocks ArcGIS dependencies
- Enables CSS processing

### Test Setup (`src/test-setup.ts`)
- Mocks ArcGIS Core modules
- Mocks echarts (if used)
- Mocks global browser APIs (fetch, URL, window.open)
- Configures console mocking

## Writing New Tests

### Service Tests

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { tncArcGISAPI } from './tncArcGISService'
import { mockFetch } from '../test-utils/test-helpers'

describe('New Service Feature', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should handle new functionality', async () => {
    mockFetch([{
      url: 'expected-url',
      response: { data: [] }
    }])

    const result = await tncArcGISAPI.newMethod()
    expect(result).toBeDefined()
  })
})
```

### Component Tests

```typescript
import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../test-utils/test-helpers'
import MyComponent from './MyComponent'

describe('MyComponent', () => {
  it('should handle user interaction', async () => {
    const user = userEvent.setup()
    renderWithProviders(<MyComponent />)

    const button = screen.getByRole('button', { name: /click me/i })
    await user.click(button)

    expect(screen.getByText('Clicked!')).toBeInTheDocument()
  })
})
```

### Integration Tests

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'

describe('Feature Integration', () => {
  it('should work end-to-end', async () => {
    const user = userEvent.setup()
    render(<App />)

    // Simulate user workflow
    await user.selectOptions(screen.getByRole('combobox'), 'option')
    await user.click(screen.getByRole('button', { name: /search/i }))

    await waitFor(() => {
      expect(screen.getByText('Expected Result')).toBeInTheDocument()
    })
  })
})
```

## Best Practices

1. **Use Descriptive Test Names**
   - Describe what the test does and what it expects
   - Use "should" statements for clarity

2. **Mock External Dependencies**
   - Mock API calls with realistic responses
   - Mock browser APIs that aren't available in test environment
   - Use factories for consistent test data

3. **Test User Behavior**
   - Focus on what users can see and do
   - Avoid testing implementation details
   - Use accessible queries (getByRole, getByLabelText)

4. **Handle Async Operations**
   - Use waitFor for async state changes
   - Mock promises appropriately
   - Test loading and error states

5. **Keep Tests Isolated**
   - Clear mocks between tests
   - Don't rely on test execution order
   - Use beforeEach/afterEach for setup/cleanup

## Coverage Goals

- **Service Layer**: 90%+ coverage of business logic
- **Component Layer**: 80%+ coverage of user interactions
- **Integration**: Cover all major user workflows
- **Error Handling**: Test error states and edge cases

## Debugging Tests

```bash
# Run specific test file
npm test -- tncArcGISService.test.ts

# Run tests matching pattern
npm test -- --grep "filter"

# Run with verbose output
npm test -- --reporter=verbose

# Debug with browser
npm run test:ui
```

## Future Enhancements

- [ ] Visual regression testing for UI components
- [ ] Performance testing for large datasets
- [ ] E2E testing with Playwright
- [ ] Accessibility testing automation
- [ ] API contract testing

