export interface Dataset {
  id: string;
  title: string;
  description: string;
  source: string;
  date: string;
  category: 'Wildlife' | 'Vegetation' | 'Climate' | 'Hydrology';
  icon: string;
}

export interface FilterState {
  category: string;
  source: string;
  spatialFilter: string;
  timeRange: string;
}

export interface DataLayer {
  id: string;
  name: string;
  color: string;
  visible: boolean;
}
