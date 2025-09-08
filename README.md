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

## Project Structure

```
src/
├── components/          # React components
│   ├── Header.tsx      # Main navigation header
│   ├── FilterSubheader.tsx   # Data filtering controls
│   ├── SearchResults.tsx # Dataset search results
│   ├── DatasetCard.tsx # Individual dataset card
│   ├── MapView.tsx     # Interactive map component
│   ├── DataLayersPanel.tsx # Map layer controls
│   └── Footer.tsx      # Site footer
├── data/               # Mock data and constants
├── types/              # TypeScript type definitions
├── App.tsx            # Main application component
├── main.tsx           # Application entry point
└── index.css          # Global styles
```

## Data Categories

The catalog includes datasets from four main categories:

- **Wildlife** - Camera trap surveys, species observations
- **Vegetation** - Satellite imagery analysis, plant surveys  
- **Climate** - Weather station data, temperature/precipitation
- **Hydrology** - Stream flow monitoring, water quality

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