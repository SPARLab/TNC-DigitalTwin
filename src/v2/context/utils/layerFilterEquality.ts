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

/** Shallow equality check for iNaturalist filter objects */
export function filtersEqual(
  a: INaturalistViewFilters | undefined,
  b: INaturalistViewFilters | undefined,
): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  if (a.startDate !== b.startDate || a.endDate !== b.endDate) return false;
  if (!!a.excludeAllSpecies !== !!b.excludeAllSpecies) return false;
  if (a.selectedTaxa.length !== b.selectedTaxa.length) return false;
  if (a.selectedSpecies.length !== b.selectedSpecies.length) return false;
  return a.selectedTaxa.every((t, i) => t === b.selectedTaxa[i])
    && a.selectedSpecies.every((s, i) => s === b.selectedSpecies[i]);
}

export function animlFiltersEqual(
  a: AnimlViewFilters | undefined,
  b: AnimlViewFilters | undefined,
): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  if (a.startDate !== b.startDate || a.endDate !== b.endDate) return false;
  if (a.selectedAnimals.length !== b.selectedAnimals.length) return false;
  if (a.selectedCameras.length !== b.selectedCameras.length) return false;
  return a.selectedAnimals.every((s, i) => s === b.selectedAnimals[i])
    && a.selectedCameras.every((c, i) => c === b.selectedCameras[i]);
}

export function dendraFiltersEqual(
  a: DendraViewFilters | undefined,
  b: DendraViewFilters | undefined,
): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return (
    a.showActiveOnly === b.showActiveOnly &&
    a.selectedStationId === b.selectedStationId &&
    a.selectedStationName === b.selectedStationName &&
    a.selectedDatastreamId === b.selectedDatastreamId &&
    a.selectedDatastreamName === b.selectedDatastreamName &&
    a.startDate === b.startDate &&
    a.endDate === b.endDate &&
    a.aggregation === b.aggregation
  );
}

export function tncArcgisFiltersEqual(
  a: TNCArcGISViewFilters | undefined,
  b: TNCArcGISViewFilters | undefined,
): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  if (a.whereClause !== b.whereClause) return false;
  const aFields = a.fields ?? [];
  const bFields = b.fields ?? [];
  if (aFields.length !== bFields.length) return false;
  return aFields.every((field, index) => {
    const target = bFields[index];
    return !!target
      && field.field === target.field
      && field.operator === target.operator
      && field.value === target.value;
  });
}

export function dataOneFiltersEqual(
  a: DataOneViewFilters | undefined,
  b: DataOneViewFilters | undefined,
): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  const aCategories = (a.tncCategories && a.tncCategories.length > 0
    ? a.tncCategories
    : (a.tncCategory ? [a.tncCategory] : [])
  ).map((value) => value.trim()).filter(Boolean);
  const bCategories = (b.tncCategories && b.tncCategories.length > 0
    ? b.tncCategories
    : (b.tncCategory ? [b.tncCategory] : [])
  ).map((value) => value.trim()).filter(Boolean);
  const aFileTypes = (a.fileTypes || []).map((value) => value.trim()).filter(Boolean);
  const bFileTypes = (b.fileTypes || []).map((value) => value.trim()).filter(Boolean);
  if (aCategories.length !== bCategories.length) return false;
  if (aFileTypes.length !== bFileTypes.length) return false;
  return (
    (a.searchText || '') === (b.searchText || '') &&
    aCategories.every((value, index) => value === bCategories[index]) &&
    aFileTypes.every((value, index) => value === bFileTypes[index]) &&
    (a.startDate || '') === (b.startDate || '') &&
    (a.endDate || '') === (b.endDate || '') &&
    (a.author || '') === (b.author || '') &&
    (a.selectedDatasetId || '') === (b.selectedDatasetId || '') &&
    (a.selectedDatasetTitle || '') === (b.selectedDatasetTitle || '')
  );
}

export function calFloraFiltersEqual(
  a: CalFloraViewFilters | undefined,
  b: CalFloraViewFilters | undefined,
): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return (
    (a.searchText || '') === (b.searchText || '') &&
    (a.county || '') === (b.county || '') &&
    (a.startDate || '') === (b.startDate || '') &&
    (a.endDate || '') === (b.endDate || '') &&
    !!a.hasPhoto === !!b.hasPhoto &&
    (a.selectedObservationId || 0) === (b.selectedObservationId || 0) &&
    (a.selectedObservationLabel || '') === (b.selectedObservationLabel || '')
  );
}

export function gbifFiltersEqual(
  a: GBIFViewFilters | undefined,
  b: GBIFViewFilters | undefined,
): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return (
    (a.searchText || '') === (b.searchText || '') &&
    (a.kingdom || '') === (b.kingdom || '') &&
    (a.taxonomicClass || '') === (b.taxonomicClass || '') &&
    (a.family || '') === (b.family || '') &&
    (a.basisOfRecord || '') === (b.basisOfRecord || '') &&
    (a.datasetName || '') === (b.datasetName || '') &&
    (a.startDate || '') === (b.startDate || '') &&
    (a.endDate || '') === (b.endDate || '') &&
    (a.selectedOccurrenceId || 0) === (b.selectedOccurrenceId || 0) &&
    (a.selectedOccurrenceLabel || '') === (b.selectedOccurrenceLabel || '')
  );
}

export function motusFiltersEqual(
  a: MotusViewFilters | undefined,
  b: MotusViewFilters | undefined,
): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return (
    (a.selectedSpecies || '') === (b.selectedSpecies || '') &&
    (a.selectedTagId || 0) === (b.selectedTagId || 0) &&
    (a.startDate || '') === (b.startDate || '') &&
    (a.endDate || '') === (b.endDate || '') &&
    (a.minHitCount ?? 0) === (b.minHitCount ?? 0) &&
    (a.minMotusFilter ?? 0) === (b.minMotusFilter ?? 0)
  );
}
