// ============================================================================
// CHELSA V2.1 bioclimatic variables (bio01–bio19).
//
// Each CHELSA mosaic ImageServer (Data-Pipeline publish_chelsa_mosaics.py)
// holds one mosaic item per variable, tagged Tag = 'bioNN'. Labels and units
// mirror Data-Pipeline/rasterstack/datasets/chelsa/chelsa_services.json.
// ============================================================================

export interface BioclimVariable {
  /** Mosaic item tag, e.g. "bio01". */
  tag: string;
  label: string;
  /** Display units. Empty for unitless indices. */
  units: string;
}

export const BIOCLIM_VARIABLES: readonly BioclimVariable[] = [
  { tag: 'bio01', label: 'Mean Annual Air Temperature', units: '°C' },
  { tag: 'bio02', label: 'Mean Diurnal Air Temperature Range', units: '°C' },
  { tag: 'bio03', label: 'Isothermality', units: '' },
  { tag: 'bio04', label: 'Temperature Seasonality', units: '' },
  { tag: 'bio05', label: 'Mean Daily Maximum Air Temperature of the Warmest Month', units: '°C' },
  { tag: 'bio06', label: 'Mean Daily Minimum Air Temperature of the Coldest Month', units: '°C' },
  { tag: 'bio07', label: 'Annual Range of Air Temperature', units: '°C' },
  { tag: 'bio08', label: 'Mean Daily Air Temperature of the Wettest Quarter', units: '°C' },
  { tag: 'bio09', label: 'Mean Daily Air Temperature of the Driest Quarter', units: '°C' },
  { tag: 'bio10', label: 'Mean Daily Air Temperature of the Warmest Quarter', units: '°C' },
  { tag: 'bio11', label: 'Mean Daily Air Temperature of the Coldest Quarter', units: '°C' },
  { tag: 'bio12', label: 'Annual Precipitation Amount', units: 'mm' },
  { tag: 'bio13', label: 'Precipitation Amount of the Wettest Month', units: 'mm' },
  { tag: 'bio14', label: 'Precipitation Amount of the Driest Month', units: 'mm' },
  { tag: 'bio15', label: 'Precipitation Seasonality', units: '' },
  { tag: 'bio16', label: 'Mean Monthly Precipitation Amount of the Wettest Quarter', units: 'mm' },
  { tag: 'bio17', label: 'Mean Monthly Precipitation Amount of the Driest Quarter', units: 'mm' },
  { tag: 'bio18', label: 'Mean Monthly Precipitation Amount of the Warmest Quarter', units: 'mm' },
  { tag: 'bio19', label: 'Mean Monthly Precipitation Amount of the Coldest Quarter', units: 'mm' },
];
