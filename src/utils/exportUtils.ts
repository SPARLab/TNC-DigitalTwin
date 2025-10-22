/**
 * Utility functions for exporting data in various formats
 */

/**
 * Converts an array of objects to CSV format
 */
export function convertToCSV(data: any[]): string {
  if (data.length === 0) return '';
  
  // Get all unique keys from all objects
  const allKeys = new Set<string>();
  data.forEach(item => {
    Object.keys(item).forEach(key => allKeys.add(key));
  });
  
  const headers = Array.from(allKeys);
  
  // Escape and quote CSV values
  const escapeCSVValue = (value: any): string => {
    if (value === null || value === undefined) return '';
    const stringValue = String(value);
    // If contains comma, quote, or newline, wrap in quotes and escape quotes
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  };
  
  const rows = data.map(item =>
    headers.map(header => escapeCSVValue(item[header])).join(',')
  );
  
  return [headers.join(','), ...rows].join('\n');
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

