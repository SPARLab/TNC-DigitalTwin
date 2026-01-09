import { Dataset, DataLayer } from '../types';

export const mockDatasets: Dataset[] = [
  {
    id: '1',
    title: 'Camera Trap Wildlife Survey 2023',
    description: 'Motion-activated camera data capturing wildlife behavior and population dynamics across 45 monitoring stations.',
    source: 'iNaturalist',
    date: 'Jan 2023',
    category: 'Species',
    icon: '🦌'
  },
  {
    id: '2',
    title: 'Vegetation Cover Analysis',
    description: 'High-resolution satellite imagery analysis of vegetation patterns and seasonal changes.',
    source: 'ArcGIS Hub',
    date: 'Mar 2023',
    category: 'Land Cover',
    icon: '🌿'
  },
  {
    id: '3',
    title: 'Stream Flow Monitoring',
    description: 'Continuous water level and flow rate measurements from 12 stream gauging stations.',
    source: 'USGS',
    date: 'Ongoing',
    category: 'Freshwater',
    icon: '💧'
  },
  {
    id: '4',
    title: 'Climate Data Collection',
    description: 'Temperature, humidity, and precipitation measurements from weather stations.',
    source: 'NOAA',
    date: '2020-2024',
    category: 'Weather and Climate',
    icon: '🌡️'
  }
];

export const dataLayers: DataLayer[] = [
  {
    id: 'wildlife-cameras',
    name: 'Wildlife Cameras',
    color: 'bg-blue-500',
    visible: true
  },
  {
    id: 'vegetation-plots',
    name: 'Vegetation Plots',
    color: 'bg-green-500',
    visible: true
  },
  {
    id: 'stream-gauges',
    name: 'Stream Gauges',
    color: 'bg-blue-400',
    visible: true
  }
];
