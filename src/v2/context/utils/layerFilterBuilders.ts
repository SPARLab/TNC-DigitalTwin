import type {
  INaturalistViewFilters,
  AnimlViewFilters,
  DendraViewFilters,
  TNCArcGISViewFilters,
  DataOneViewFilters,
  CalFloraViewFilters,
  GBIFViewFilters,
  MotusViewFilters,
} from '../../types';
import type { DroneImageryMetadata } from '../../../types/droneImagery';
import { TAXON_CONFIG } from '../../components/Map/layers/taxonConfig';

export function buildINaturalistFilterSummary(filters: INaturalistViewFilters): string | undefined {
  const parts: string[] = [];
  if (filters.excludeAllSpecies) {
    parts.push('Species: none selected');
  }
  if (filters.selectedTaxa.length > 0) {
    const taxonText = filters.selectedTaxa.length <= 2
      ? filters.selectedTaxa.join(' + ')
      : `${filters.selectedTaxa.length} taxa selected`;
    parts.push(`Taxa: ${taxonText}`);
  }
  if (filters.selectedSpecies.length > 0) {
    const speciesText = filters.selectedSpecies.length <= 2
      ? filters.selectedSpecies.join(' + ')
      : `${filters.selectedSpecies.length} species selected`;
    parts.push(`Species: ${speciesText}`);
  }
  if (filters.startDate || filters.endDate) {
    const rangeText = `${filters.startDate || 'Any'} to ${filters.endDate || 'Any'}`;
    parts.push(`Date: ${rangeText}`);
  }
  return parts.length > 0 ? parts.join(', ') : undefined;
}

export function getINaturalistFilterCount(filters: INaturalistViewFilters): number {
  return filters.selectedTaxa.length + filters.selectedSpecies.length + (filters.excludeAllSpecies ? 1 : 0) + (filters.startDate || filters.endDate ? 1 : 0);
}

export function buildDendraFilterSummary(filters: DendraViewFilters): string | undefined {
  const parts: string[] = [];
  if (filters.showActiveOnly) {
    parts.push('Stations: Active only');
  }
  if (filters.selectedStationName) {
    parts.push(`Station: ${filters.selectedStationName}`);
  }
  if (filters.selectedDatastreamName) {
    parts.push(`Datastream: ${filters.selectedDatastreamName}`);
  }
  if (filters.startDate || filters.endDate) {
    const rangeText = `${filters.startDate || 'Any'} to ${filters.endDate || 'Any'}`;
    parts.push(`Date: ${rangeText}`);
  }
  if (filters.aggregation) {
    parts.push(`Aggregation: ${filters.aggregation}`);
  }
  return parts.length > 0 ? parts.join(', ') : undefined;
}

export function getDendraFilterCount(filters: DendraViewFilters): number {
  let count = 0;
  if (filters.showActiveOnly) count += 1;
  if (filters.selectedStationId != null) count += 1;
  if (filters.selectedDatastreamId != null) count += 1;
  if (filters.startDate || filters.endDate) count += 1;
  if (filters.aggregation && filters.aggregation !== 'hourly') count += 1;
  return count;
}

export function buildDataOneFilterSummary(filters: DataOneViewFilters): string | undefined {
  if (filters.selectedDatasetId) {
    return `Dataset: ${filters.selectedDatasetTitle || filters.selectedDatasetId}`;
  }
  const parts: string[] = [];
  if (filters.searchText?.trim()) {
    parts.push(`Search: "${filters.searchText.trim()}"`);
  }
  const categories = (filters.tncCategories && filters.tncCategories.length > 0
    ? filters.tncCategories
    : (filters.tncCategory?.trim() ? [filters.tncCategory.trim()] : [])
  ).filter(Boolean);
  if (categories.length > 0) {
    parts.push(
      categories.length === 1
        ? `Category: ${categories[0]}`
        : `Categories: ${categories.slice(0, 2).join(', ')}${categories.length > 2 ? `, +${categories.length - 2} more` : ''}`,
    );
  }
  if (filters.fileTypes && filters.fileTypes.length > 0) {
    const labels = filters.fileTypes.map((value) => {
      if (value === 'csv') return 'CSV';
      if (value === 'tif') return 'TIF';
      if (value === 'imagery') return 'Imagery';
      return 'Other';
    });
    parts.push(
      labels.length === 1
        ? `File type: ${labels[0]}`
        : `File types: ${labels.join(', ')}`,
    );
  }
  if (filters.author?.trim()) {
    parts.push(`Author: ${filters.author.trim()}`);
  }
  if (filters.startDate || filters.endDate) {
    parts.push(`Date: ${filters.startDate || 'Any'} to ${filters.endDate || 'Any'}`);
  }
  return parts.length > 0 ? parts.join(', ') : undefined;
}

export function getDataOneFilterCount(filters: DataOneViewFilters): number {
  if (filters.selectedDatasetId) return 1;
  let count = 0;
  if (filters.searchText?.trim()) count += 1;
  if ((filters.tncCategories && filters.tncCategories.length > 0) || filters.tncCategory?.trim()) count += 1;
  if (filters.fileTypes && filters.fileTypes.length > 0) count += 1;
  if (filters.author?.trim()) count += 1;
  if (filters.startDate || filters.endDate) count += 1;
  return count;
}

export function buildDataOneViewName(filters: DataOneViewFilters): string {
  if (filters.selectedDatasetId) {
    return filters.selectedDatasetTitle || filters.selectedDatasetId;
  }
  const searchPart = filters.searchText?.trim()
    ? `"${filters.searchText.trim()}"`
    : '';
  const categories = (filters.tncCategories && filters.tncCategories.length > 0
    ? filters.tncCategories
    : (filters.tncCategory?.trim() ? [filters.tncCategory.trim()] : [])
  ).filter(Boolean);
  const categoryPart = categories.length > 0
    ? (categories.length <= 2 ? categories.join(', ') : `${categories.slice(0, 2).join(', ')}, +${categories.length - 2} more`)
    : '';
  const fileTypePart = filters.fileTypes && filters.fileTypes.length > 0
    ? `Files: ${filters.fileTypes.map((value) => {
      if (value === 'csv') return 'CSV';
      if (value === 'tif') return 'TIF';
      if (value === 'imagery') return 'Imagery';
      return 'Other';
    }).join(', ')}`
    : '';
  const authorPart = filters.author?.trim() ? `Author: ${filters.author.trim()}` : '';
  const datePart = (filters.startDate || filters.endDate)
    ? `${filters.startDate || 'Any start'} to ${filters.endDate || 'Any end'}`
    : '';
  const nonDate = [searchPart, categoryPart, fileTypePart, authorPart].filter(Boolean).join(' • ');
  if (nonDate && datePart) return `${nonDate} (${datePart})`;
  if (nonDate) return nonDate;
  if (datePart) return `Date: ${datePart}`;
  return 'All Datasets';
}

export function buildCalFloraFilterSummary(filters: CalFloraViewFilters): string | undefined {
  if (filters.selectedObservationId) {
    return `Observation: ${filters.selectedObservationLabel || filters.selectedObservationId}`;
  }
  const parts: string[] = [];
  if (filters.searchText?.trim()) {
    parts.push(`Search: "${filters.searchText.trim()}"`);
  }
  if (filters.county?.trim()) {
    parts.push(`County: ${filters.county.trim()}`);
  }
  if (filters.startDate || filters.endDate) {
    parts.push(`Date: ${filters.startDate || 'Any'} to ${filters.endDate || 'Any'}`);
  }
  if (filters.hasPhoto) {
    parts.push('Has photo');
  }
  return parts.length > 0 ? parts.join(', ') : undefined;
}

export function getCalFloraFilterCount(filters: CalFloraViewFilters): number {
  if (filters.selectedObservationId) return 1;
  let count = 0;
  if (filters.searchText?.trim()) count += 1;
  if (filters.county?.trim()) count += 1;
  if (filters.startDate || filters.endDate) count += 1;
  if (filters.hasPhoto) count += 1;
  return count;
}

export function buildCalFloraViewName(filters: CalFloraViewFilters): string {
  if (filters.selectedObservationId) {
    return filters.selectedObservationLabel || `Observation ${filters.selectedObservationId}`;
  }
  const searchPart = filters.searchText?.trim() ? `"${filters.searchText.trim()}"` : '';
  const countyPart = filters.county?.trim() || '';
  const photoPart = filters.hasPhoto ? 'Has photo' : '';
  const datePart = (filters.startDate || filters.endDate)
    ? `${filters.startDate || 'Any start'} to ${filters.endDate || 'Any end'}`
    : '';
  const nonDate = [searchPart, countyPart, photoPart].filter(Boolean).join(' • ');
  if (nonDate && datePart) return `${nonDate} (${datePart})`;
  if (nonDate) return nonDate;
  if (datePart) return `Date: ${datePart}`;
  return 'All Observations';
}

export function buildGBIFFilterSummary(filters: GBIFViewFilters): string | undefined {
  if (filters.selectedOccurrenceId) {
    return `Occurrence: ${filters.selectedOccurrenceLabel || filters.selectedOccurrenceId}`;
  }
  const parts: string[] = [];
  if (filters.searchText?.trim()) {
    parts.push(`Search: "${filters.searchText.trim()}"`);
  }
  if (filters.kingdom?.trim()) {
    parts.push(`Kingdom: ${filters.kingdom.trim()}`);
  }
  if (filters.family?.trim()) {
    parts.push(`Family: ${filters.family.trim()}`);
  }
  if (filters.basisOfRecord?.trim()) {
    parts.push(`Basis: ${filters.basisOfRecord.trim()}`);
  }
  if (filters.datasetName?.trim()) {
    parts.push(`Dataset: ${filters.datasetName.trim()}`);
  }
  if (filters.startDate || filters.endDate) {
    parts.push(`Date: ${filters.startDate || 'Any'} to ${filters.endDate || 'Any'}`);
  }
  return parts.length > 0 ? parts.join(', ') : undefined;
}

export function getGBIFFilterCount(filters: GBIFViewFilters): number {
  if (filters.selectedOccurrenceId) return 1;
  let count = 0;
  if (filters.searchText?.trim()) count += 1;
  if (filters.kingdom?.trim()) count += 1;
  if (filters.taxonomicClass?.trim()) count += 1;
  if (filters.family?.trim()) count += 1;
  if (filters.basisOfRecord?.trim()) count += 1;
  if (filters.datasetName?.trim()) count += 1;
  if (filters.startDate || filters.endDate) count += 1;
  return count;
}

export function buildGBIFViewName(filters: GBIFViewFilters): string {
  if (filters.selectedOccurrenceId) {
    return filters.selectedOccurrenceLabel || `Occurrence ${filters.selectedOccurrenceId}`;
  }
  const searchPart = filters.searchText?.trim() ? `"${filters.searchText.trim()}"` : '';
  const kingdomPart = filters.kingdom?.trim() || '';
  const familyPart = filters.family?.trim() || '';
  const basisPart = filters.basisOfRecord?.trim() || '';
  const datasetPart = filters.datasetName?.trim() || '';
  const datePart = (filters.startDate || filters.endDate)
    ? `${filters.startDate || 'Any start'} to ${filters.endDate || 'Any end'}`
    : '';
  const nonDate = [searchPart, kingdomPart, familyPart, basisPart, datasetPart].filter(Boolean).join(' • ');
  if (nonDate && datePart) return `${nonDate} (${datePart})`;
  if (nonDate) return nonDate;
  if (datePart) return `Date: ${datePart}`;
  return 'All Occurrences';
}

export function buildMotusFilterSummary(filters: MotusViewFilters): string | undefined {
  const parts: string[] = [];
  if (filters.selectedSpecies?.trim()) {
    parts.push(`Species: ${filters.selectedSpecies.trim()}`);
  }
  if (typeof filters.selectedTagId === 'number') {
    parts.push(`Tag: ${filters.selectedTagId}`);
  }
  if (filters.startDate || filters.endDate) {
    parts.push(`Date: ${filters.startDate || 'Any'} to ${filters.endDate || 'Any'}`);
  }
  if (typeof filters.minHitCount === 'number') {
    parts.push(`Min hits: ${filters.minHitCount}`);
  }
  if (typeof filters.minMotusFilter === 'number') {
    parts.push(`Min motus_filter: ${filters.minMotusFilter}`);
  }
  return parts.length > 0 ? parts.join(', ') : undefined;
}

export function getMotusFilterCount(filters: MotusViewFilters): number {
  let count = 0;
  if (filters.selectedSpecies?.trim()) count += 1;
  if (typeof filters.selectedTagId === 'number') count += 1;
  if (filters.startDate || filters.endDate) count += 1;
  if (typeof filters.minHitCount === 'number') count += 1;
  if (typeof filters.minMotusFilter === 'number') count += 1;
  return count;
}

export function buildMotusViewName(filters: MotusViewFilters): string {
  const speciesPart = filters.selectedSpecies?.trim() || 'All Species';
  const tagPart = typeof filters.selectedTagId === 'number' ? `Tag ${filters.selectedTagId}` : 'Group';
  const datePart = (filters.startDate || filters.endDate)
    ? `${filters.startDate || 'Any start'} to ${filters.endDate || 'Any end'}`
    : 'Any dates';
  return `${speciesPart} — ${tagPart} — ${datePart}`;
}

export function buildDendraViewName(filters: DendraViewFilters): string {
  const stationPart = filters.selectedStationName?.trim();
  const datastreamPart = filters.selectedDatastreamName?.trim();
  const datePart = (filters.startDate || filters.endDate)
    ? `${filters.startDate || 'Any start'} to ${filters.endDate || 'Any end'}`
    : '';

  if (stationPart && datastreamPart && datePart) {
    return `${stationPart}: ${datastreamPart} (${datePart})`;
  }
  if (stationPart && datastreamPart) return `${stationPart}: ${datastreamPart}`;
  if (datastreamPart && datePart) return `${datastreamPart} (${datePart})`;
  if (datastreamPart) return datastreamPart;
  if (stationPart) return stationPart;
  if (filters.showActiveOnly) return 'Active Stations';
  return 'All Stations';
}

const TAXON_LABEL_BY_VALUE = new Map(TAXON_CONFIG.map(t => [t.value, t.label]));

export function buildINaturalistViewName(filters: INaturalistViewFilters): string {
  const selectedTaxa = filters.selectedTaxa || [];
  const selectedSpecies = filters.selectedSpecies || [];
  const taxaLabels = selectedTaxa
    .map(taxon => TAXON_LABEL_BY_VALUE.get(taxon) || taxon)
    .sort((a, b) => a.localeCompare(b));
  const speciesLabels = [...selectedSpecies].sort((a, b) => a.localeCompare(b));

  const taxaPart = taxaLabels.length > 0
    ? (taxaLabels.length <= 3
      ? taxaLabels.join(', ')
      : `${taxaLabels.slice(0, 2).join(', ')}, +${taxaLabels.length - 2} more`)
    : '';
  const speciesPart = filters.excludeAllSpecies
    ? 'No species'
    : speciesLabels.length > 0
    ? (speciesLabels.length <= 2
      ? speciesLabels.join(', ')
      : `${speciesLabels.slice(0, 1).join(', ')}, +${speciesLabels.length - 1} more`)
    : '';

  const hasDate = !!(filters.startDate || filters.endDate);
  const datePart = hasDate
    ? `${filters.startDate || 'Any start'} to ${filters.endDate || 'Any end'}`
    : '';

  const nonDatePart = [taxaPart, speciesPart].filter(Boolean).join(' • ');
  if (nonDatePart && datePart) return `${nonDatePart} (${datePart})`;
  if (nonDatePart) return nonDatePart;
  if (datePart) return `Date: ${datePart}`;
  return 'All Observations';
}

export function buildAnimlFilterSummary(filters: AnimlViewFilters): string | undefined {
  const parts: string[] = [];
  if (filters.selectedAnimals.length > 0) {
    const speciesText = filters.selectedAnimals.length <= 2
      ? filters.selectedAnimals.join(' + ')
      : `${filters.selectedAnimals.length} species selected`;
    parts.push(`Species: ${speciesText}`);
  }
  if (filters.selectedCameras.length > 0) {
    const cameraText = filters.selectedCameras.length === 1
      ? '1 camera'
      : `${filters.selectedCameras.length} cameras`;
    parts.push(`Cameras: ${cameraText}`);
  }
  if (filters.startDate || filters.endDate) {
    const rangeText = `${filters.startDate || 'Any'} to ${filters.endDate || 'Any'}`;
    parts.push(`Date: ${rangeText}`);
  }
  return parts.length > 0 ? parts.join(', ') : undefined;
}

export function getAnimlFilterCount(filters: AnimlViewFilters): number {
  return filters.selectedAnimals.length + filters.selectedCameras.length + (filters.startDate || filters.endDate ? 1 : 0);
}

export function buildAnimlViewName(filters: AnimlViewFilters): string {
  const speciesPart = filters.selectedAnimals.length > 0
    ? (filters.selectedAnimals.length <= 2
      ? filters.selectedAnimals.join(', ')
      : `${filters.selectedAnimals.slice(0, 2).join(', ')}, +${filters.selectedAnimals.length - 2} more`)
    : '';

  const cameraPart = filters.selectedCameras.length > 0
    ? (filters.selectedCameras.length === 1
      ? '1 camera'
      : `${filters.selectedCameras.length} cameras`)
    : '';

  const hasDate = !!(filters.startDate || filters.endDate);
  const datePart = hasDate
    ? `${filters.startDate || 'Any start'} to ${filters.endDate || 'Any end'}`
    : '';

  const nonDateParts = [speciesPart, cameraPart].filter(Boolean).join(' • ');
  if (nonDateParts && datePart) return `${nonDateParts} (${datePart})`;
  if (nonDateParts) return nonDateParts;
  if (datePart) return `Date: ${datePart}`;
  return 'All Camera Traps';
}

function formatDroneCapturedDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function buildDroneViewName(flight: DroneImageryMetadata): string {
  const safePlanName = flight.planName?.trim() || `Flight ${flight.id}`;
  return `${safePlanName} (${formatDroneCapturedDate(flight.dateCaptured)})`;
}

export function buildTNCArcGISFilterSummary(filters: TNCArcGISViewFilters): string | undefined {
  const clause = filters.whereClause.trim();
  if (!clause || clause === '1=1') return undefined;
  return clause.length > 110 ? `${clause.slice(0, 107)}...` : clause;
}

export function getTNCArcGISFilterCount(filters: TNCArcGISViewFilters): number {
  return (filters.fields ?? []).filter(filter => {
    const hasField = filter.field.trim().length > 0;
    const hasOperator = filter.operator.trim().length > 0;
    if (!hasField || !hasOperator) return false;
    if (filter.operator === 'is null' || filter.operator === 'is not null') return true;
    return filter.value.trim().length > 0;
  }).length;
}
