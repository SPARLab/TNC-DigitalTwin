/**
 * Utility functions for exporting data in various formats
 */

/**
 * Flattens a nested object into dot-notation keys
 * Example: { user: { name: "John" } } => { "user.name": "John" }
 * Special handling: coordinates arrays [lng, lat] => separate longitude/latitude columns
 */
function flattenObject(obj: any, prefix = ''): Record<string, any> {
  const flattened: Record<string, any> = {};
  
  for (const key in obj) {
    if (!obj.hasOwnProperty(key)) continue;
    
    const value = obj[key];
    const newKey = prefix ? `${prefix}.${key}` : key;
    
    if (value === null || value === undefined) {
      flattened[newKey] = '';
    } else if (Array.isArray(value)) {
      // Special case: coordinate arrays [lng, lat] or [lon, lat]
      if ((key === 'coordinates' || key === 'coords') && value.length === 2 && typeof value[0] === 'number' && typeof value[1] === 'number') {
        const coordPrefix = prefix || 'location';
        flattened[`${coordPrefix}.longitude`] = value[0];
        flattened[`${coordPrefix}.latitude`] = value[1];
      } else {
        // Other arrays: serialize as JSON
        flattened[newKey] = JSON.stringify(value);
      }
    } else if (typeof value === 'object' && value.constructor === Object) {
      // Recursively flatten nested objects
      Object.assign(flattened, flattenObject(value, newKey));
    } else {
      flattened[newKey] = value;
    }
  }
  
  return flattened;
}

/**
 * Converts a technical field name to a human-readable column header
 * Examples:
 *   user.id → User ID
 *   taxon.iconic_taxon_name → Taxon Iconic Taxon Name
 *   latitude → Latitude
 */
function formatColumnHeader(fieldName: string): string {
  return fieldName
    // Split on dots and underscores
    .split(/[._]/)
    // Capitalize first letter of each word
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    // Join with spaces
    .join(' ')
    // Handle special cases for acronyms
    .replace(/\bId\b/g, 'ID')
    .replace(/\bUrl\b/g, 'URL')
    .replace(/\bUri\b/g, 'URI')
    .replace(/\bApi\b/g, 'API')
    .replace(/\bGps\b/g, 'GPS');
}

/**
 * Converts an array of objects to CSV format
 * Flattens nested objects and serializes arrays as JSON
 */
export function convertToCSV(data: any[]): string {
  if (data.length === 0) return '';
  
  // Flatten all objects first
  const flattenedData = data.map(item => flattenObject(item));
  
  // Get all unique keys from all flattened objects
  const allKeys = new Set<string>();
  flattenedData.forEach(item => {
    Object.keys(item).forEach(key => allKeys.add(key));
  });
  
  const headers = Array.from(allKeys);
  const readableHeaders = headers.map(formatColumnHeader);
  
  // Escape and quote CSV values
  const escapeCSVValue = (value: any): string => {
    if (value === null || value === undefined || value === '') return '';
    
    const stringValue = String(value);
    
    // If contains comma, quote, or newline, wrap in quotes and escape quotes
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    
    return stringValue;
  };
  
  const rows = flattenedData.map(item =>
    headers.map(header => escapeCSVValue(item[header])).join(',')
  );
  
  return [readableHeaders.join(','), ...rows].join('\n');
}

/**
 * Converts an array of objects with geometry to GeoJSON format
 */
export function convertToGeoJSON(data: any[]): string {
  const features = data
    .filter(item => {
      // Check various geometry formats
      return (
        item.geometry?.coordinates || 
        item.geojson?.coordinates ||
        (item.lat && item.lng) ||
        (item.latitude && item.longitude)
      );
    })
    .map(item => {
      let geometry;
      
      // Handle different geometry formats
      if (item.geometry?.coordinates) {
        geometry = item.geometry;
      } else if (item.geojson?.coordinates) {
        geometry = item.geojson;
      } else if (item.lat && item.lng) {
        geometry = {
          type: 'Point',
          coordinates: [item.lng, item.lat]
        };
      } else if (item.latitude && item.longitude) {
        geometry = {
          type: 'Point',
          coordinates: [item.longitude, item.latitude]
        };
      }
      
      // Remove geometry fields from properties
      const { geometry: _, geojson: __, lat: ___, lng: ____, latitude: _____, longitude: ______, ...properties } = item;
      
      return {
        type: 'Feature',
        properties,
        geometry
      };
    });

  return JSON.stringify({
    type: 'FeatureCollection',
    features
  }, null, 2);
}

/**
 * Downloads a file with the given content
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export data in the specified format
 */
export function exportData(data: any[], format: 'csv' | 'json' | 'geojson', baseFilename: string): void {
  let content: string;
  let mimeType: string;
  let extension: string;
  
  switch (format) {
    case 'csv':
      content = convertToCSV(data);
      mimeType = 'text/csv;charset=utf-8;';
      extension = 'csv';
      break;
    case 'json':
      content = JSON.stringify(data, null, 2);
      mimeType = 'application/json';
      extension = 'json';
      break;
    case 'geojson':
      content = convertToGeoJSON(data);
      mimeType = 'application/geo+json';
      extension = 'geojson';
      break;
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
  
  const filename = `${baseFilename}.${extension}`;
  downloadFile(content, filename, mimeType);
}

