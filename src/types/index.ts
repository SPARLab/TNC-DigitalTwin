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
  daysBack?: number; // Number of days back from current date
  startDate?: string; // Custom start date (YYYY-MM-DD)
  endDate?: string; // Custom end date (YYYY-MM-DD)
}

export interface DataLayer {
  id: string;
  name: string;
  color: string;
  visible: boolean;
}

export interface ObservationGroup {
  category: 'Flora' | 'Fauna';
  count: number;
  subcategories: {
    name: string;
    iconicTaxon: string;
    count: number;
    observations: Array<{
      id: number;
      commonName: string | null;
      scientificName: string;
      observedOn: string;
      observer: string;
      photoUrl: string | null;
      qualityGrade: string;
      uri: string;
    }>;
  }[];
}
