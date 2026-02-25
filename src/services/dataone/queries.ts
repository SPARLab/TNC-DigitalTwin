import type { DataOneQueryOptions } from '../../types/dataone';

export const BASE_SERVICE_URL =
  'https://dangermondpreserve-spatial.com/server/rest/services/Hosted/DataONE_Datasets/FeatureServer';
export const LITE_LAYER_URL = `${BASE_SERVICE_URL}/0`;
export const LATEST_LAYER_URL = `${BASE_SERVICE_URL}/1`;
export const ALL_VERSIONS_LAYER_URL = `${BASE_SERVICE_URL}/2`;

const PRESERVE_CENTER = {
  lat: 34.4925,
  lng: -120.4275,
};

const RADIUS_DEGREES = 0.29;

function normalizeCategoryFilters(options: DataOneQueryOptions): string[] {
  const normalized = new Set<string>();
  if (options.tncCategory?.trim()) {
    normalized.add(options.tncCategory.trim());
  }
  for (const category of options.tncCategories || []) {
    const trimmed = category.trim();
    if (trimmed) normalized.add(trimmed);
  }
  return Array.from(normalized);
}

export function shouldUseLatestLayerForSearch(options: DataOneQueryOptions): boolean {
  return Boolean(options.searchText?.trim());
}

export function buildWhereClause(options: DataOneQueryOptions, includeFullTextFields = false): string {
  const conditions: string[] = ['1=1'];

  if (options.usePreserveRadius !== false && !options.spatialExtent) {
    const north = PRESERVE_CENTER.lat + RADIUS_DEGREES;
    const south = PRESERVE_CENTER.lat - RADIUS_DEGREES;
    const east = PRESERVE_CENTER.lng + RADIUS_DEGREES;
    const west = PRESERVE_CENTER.lng - RADIUS_DEGREES;
    conditions.push(
      `(center_lat >= ${south} AND center_lat <= ${north} AND ` +
        `center_lon >= ${west} AND center_lon <= ${east})`,
    );
  } else if (options.spatialExtent) {
    const { xmin, ymin, xmax, ymax } = options.spatialExtent;
    conditions.push(
      `(center_lat >= ${ymin} AND center_lat <= ${ymax} AND ` +
        `center_lon >= ${xmin} AND center_lon <= ${xmax})`,
    );
  }

  if (options.searchText) {
    const searchTerm = options.searchText.replace(/'/g, "''");
    if (includeFullTextFields) {
      conditions.push(
        `(title LIKE '%${searchTerm}%' OR abstract LIKE '%${searchTerm}%' OR keywords LIKE '%${searchTerm}%')`,
      );
    } else {
      conditions.push(`title LIKE '%${searchTerm}%'`);
    }
  }

  if (options.repository) {
    conditions.push(`datasource = '${options.repository}'`);
  }

  if (options.author) {
    const author = options.author.replace(/'/g, "''");
    conditions.push(`authors LIKE '%${author}%'`);
  }

  const categories = normalizeCategoryFilters(options);
  if (categories.length > 0) {
    const categoryClauses = categories.map((value) => {
      const category = value.replace(/'/g, "''");
      return `(tnc_category = '${category}' OR tnc_categories LIKE '%${category}%')`;
    });
    conditions.push(`(${categoryClauses.join(' OR ')})`);
  }

  if (options.startDate) {
    conditions.push(`end_date >= '${options.startDate}'`);
  }
  if (options.endDate) {
    conditions.push(`begin_date <= '${options.endDate}'`);
  }

  return conditions.join(' AND ');
}
