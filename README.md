# Dangermond Preserve Data Catalog

A modern React TypeScript application for browsing and visualizing environmental research data from the Dangermond Preserve. This application provides an intuitive interface for researchers and scientists to discover, filter, and explore various datasets including wildlife surveys, vegetation analysis, climate data, and hydrological measurements.

## Features

- **Interactive Data Catalog**: Browse through 247+ environmental datasets
- **Advanced Filtering**: Filter by data category, source, spatial area, and time range
- **Interactive Map**: Visualize data locations with toggleable layers
- **Responsive Design**: Optimized for desktop and mobile viewing
- **Modern UI**: Clean, accessible interface built with Tailwind CSS

## Tech Stack

- **React 18** - Modern React with hooks
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Vite** - Fast build tool and dev server
- **Lucide React** - Beautiful icons

## Getting Started

### Prerequisites

- Node.js 16+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd dangermond-preserve-data-catalog
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run test` - Run unit tests with Vitest
- `npm run test:ui` - Run tests with Vitest UI

## Testing

This project uses **Vitest** with **React Testing Library** for unit and component testing.

For detailed testing setup, conventions, and examples, see [docs/testing/TESTING_SETUP.md](docs/testing/TESTING_SETUP.md).

Quick start:
```bash
npm run test        # Run all tests
npm run test:ui     # Run with interactive UI
```

## Project Structure

```
TNC-DigitalTwin/
├── src/
│   ├── components/      # React components
│   ├── data/            # Mock data and constants
│   ├── hooks/           # Custom React hooks
│   ├── services/        # API and data services
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utility functions
│   ├── test-utils/      # Test helpers and factories
│   └── styles/          # Global styles and CSS tokens
├── docs/
│   ├── animl-optimization/   # Animl data source documentation
│   ├── data_sources/         # Data source integration guides
│   ├── debug_prompts/        # Debugging documentation
│   ├── design-system/        # Design tokens and style guides
│   ├── development_plans/    # Active development plans
│   └── testing/              # Testing documentation
├── scripts/
│   ├── animl-eda/       # Animl data analysis scripts
│   ├── animl-testing/   # Animl query testing scripts
│   ├── category-analysis/    # Category mapping scripts
│   ├── drone-imagery-eda/    # Drone imagery analysis
│   └── one-off/         # One-time utility scripts
├── e2e/                 # Playwright end-to-end tests
└── public/              # Static assets
```

## Data Categories

The catalog includes datasets from four main categories:

- **Wildlife** - Camera trap surveys, species observations
- **Vegetation** - Satellite imagery analysis, plant surveys  
- **Climate** - Weather station data, temperature/precipitation
- **Hydrology** - Stream flow monitoring, water quality

## Feature Status by Data Source

Track the implementation status of key features across data sources.

| Data Source | Map Display | Card View | Add to Cart | Download | Filtering |
|-------------|:-----------:|:---------:|:-----------:|:--------:|:---------:|
| ArcGIS Feature Services | ✅ | ✅ | ❓ | ❓ | ✅ |
| Dendra Weather Stations | ✅ | ✅ | ❓ | ❓ | ✅ |
| eBird Observations | ✅ | ✅ | ❓ | ❓ | ✅ |
| Animl Camera Trap | ✅ | ✅ | ❓ | ❓ | ✅ |
| CSV Data Sources | ❓ | ✅ | ❓ | ❓ | ❓ |
| Drone Imagery | ❓ | ❓ | ❓ | ❓ | ❓ |
| DataONE Sources | ❓ | ❓ | ❓ | ❓ | ❓ |

**Legend:** ✅ Working | ⚠️ Partial | ❌ Not Implemented | ❓ Needs Audit

**Last Updated:** January 2026

### Notes
- Download formats vary by source: CSV, GeoJSON, KML depending on data type
- Some data sources have API rate limits affecting download functionality
- See `docs/development_plans/january-2026-ui-improvements.md` for current development priorities

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- The Nature Conservancy's Dangermond Preserve
- Contributing research institutions and data providers
- Open source community for the excellent tools and libraries