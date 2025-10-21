import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// ES module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * CSV Parser for Manual Test Results
 * Converts manual QA CSV into lean JSON test configuration
 */

interface CSVRow {
  Title: string;
  'Mapped Categories': string;
  'Shows Up In All Categories': string;
  'All Layers Load': string;
  'ArcGIS Download Link Works': string;
  'Description Matches Website': string;
  'Tooltips Pop-Up': string;
  'Legend Exists': string;
  'Legend Labels Descriptive': string;
  'Legend Filters Work': string;
  Notes: string;
  Type: string;
  URL: string;
}

interface LayerConfig {
  id: string;
  title: string;
  itemId: string;
  url: string;
  type: 'FeatureService' | 'ImageService';
  categories: string[];
  expectedResults: {
    showsInCategories: boolean | null;
    layersLoad: boolean | null;
    downloadLinkWorks: boolean | null;
    tooltipsPopUp: boolean | null;
    legendExists: boolean | null;
    legendLabelsDescriptive: boolean | null;
    legendFiltersWork: boolean | null;
  };
  notes: string;
}

/**
 * Convert CSV boolean values to TypeScript booleans
 * "Yes" → true
 * "No" → false
 * "Some (See Notes)" → false (conservative)
 * Empty → null (untested)
 */
function parseBoolean(value: string): boolean | null {
  const trimmed = value.trim();
  if (trimmed === 'Yes') return true;
  if (trimmed === 'No') return false;
  if (trimmed.startsWith('Some')) return false; // Conservative: partial success = fail
  if (trimmed === '') return null; // Untested
  return null;
}

/**
 * Extract itemId from ArcGIS URL
 * Examples:
 * - FeatureServer: https://services.arcgis.com/{orgId}/arcgis/rest/services/{serviceName}/FeatureServer
 * - ImageServer: https://landscape10.arcgis.com/arcgis/rest/services/{serviceName}/ImageServer
 * 
 * For Feature/Image services, itemId is NOT in URL - needs to be fetched from ArcGIS API
 * For now, generate a unique ID based on service name
 */
function extractItemId(url: string, title: string): string {
  // Try to extract from URL patterns
  const patterns = [
    /\/rest\/services\/([^\/]+)\/(?:FeatureServer|ImageServer|MapServer)/,
    /services\.arcgis\.com\/([^\/]+)\//,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      // Use service name as basis for ID
      const serviceName = match[1];
      return serviceName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    }
  }
  
  // Fallback: create ID from title
  return title.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Parse categories from semicolon-separated string
 */
function parseCategories(categoriesStr: string): string[] {
  if (!categoriesStr || categoriesStr.trim() === '') return [];
  
  return categoriesStr
    .split(';')
    .map(cat => cat.trim())
    .filter(cat => cat.length > 0 && cat !== 'Uncategorized');
}

/**
 * Parse CSV line with proper quote handling
 * Clean carriage returns and other invisible characters
 */
function parseCSVLine(line: string): string[] {
  // Remove carriage returns from line
  const cleanLine = line.replace(/\r/g, '');
  
  const values: string[] = [];
  let currentValue = '';
  let inQuotes = false;
  
  for (let i = 0; i < cleanLine.length; i++) {
    const char = cleanLine[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(currentValue.trim());
      currentValue = '';
    } else {
      currentValue += char;
    }
  }
  values.push(currentValue.trim()); // Push last value, trimmed
  
  return values;
}

/**
 * Parse CSV file into JSON test configuration
 */
function parseCSV(csvContent: string): LayerConfig[] {
  const lines = csvContent.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];
  
  const headers = parseCSVLine(lines[0]);
  const layers: LayerConfig[] = [];
  
  console.log(`📋 Found ${headers.length} columns:`, headers.join(', '));
  console.log(`📋 Processing ${lines.length - 1} data rows...`);
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    const values = parseCSVLine(line);
    
    // Create row object
    const row: any = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    
    const csvRow = row as CSVRow;
    
    // Filter: Only Feature Services and Image Services
    const type = csvRow.Type?.trim() || '';
    if (type !== 'Feature Service' && type !== 'Image Service') {
      continue;
    }
    
    // Skip if no URL
    if (!csvRow.URL || csvRow.URL.trim() === '') {
      continue;
    }
    
    const title = csvRow.Title.trim();
    const url = csvRow.URL.trim();
    const itemId = extractItemId(url, title);
    const categories = parseCategories(csvRow['Mapped Categories']);
    
    const layer: LayerConfig = {
      id: itemId,
      title,
      itemId,
      url,
      type: type === 'Feature Service' ? 'FeatureService' : 'ImageService',
      categories,
      expectedResults: {
        showsInCategories: parseBoolean(csvRow['Shows Up In All Categories']),
        layersLoad: parseBoolean(csvRow['All Layers Load']),
        downloadLinkWorks: parseBoolean(csvRow['ArcGIS Download Link Works']),
        // Skip "Description Matches Website" as per user request
        tooltipsPopUp: parseBoolean(csvRow['Tooltips Pop-Up']),
        legendExists: parseBoolean(csvRow['Legend Exists']),
        legendLabelsDescriptive: parseBoolean(csvRow['Legend Labels Descriptive']),
        legendFiltersWork: parseBoolean(csvRow['Legend Filters Work']),
      },
      notes: csvRow.Notes.trim(),
    };
    
    layers.push(layer);
  }
  
  return layers;
}

/**
 * Main execution
 */
function main() {
  const csvPath = path.join(
    __dirname,
    '../../src/data/manual_test_of_tnc_arcgis_layers_oct_17_2025/TNC Digital Catalog Manual Verification - tnc_frontend_test_data.csv'
  );
  
  const outputPath = path.join(
    __dirname,
    '../test-data/all-arcgis-layers.json'
  );
  
  console.log('📖 Reading CSV:', csvPath);
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  
  console.log('🔍 Parsing CSV data...');
  const layers = parseCSV(csvContent);
  
  console.log(`✅ Parsed ${layers.length} layers`);
  console.log(`   - Feature Services: ${layers.filter(l => l.type === 'FeatureService').length}`);
  console.log(`   - Image Services: ${layers.filter(l => l.type === 'ImageService').length}`);
  
  const output = {
    generated: new Date().toISOString(),
    source: 'TNC Digital Catalog Manual Verification - tnc_frontend_test_data.csv',
    description: 'Expected test results from manual QA performed on Oct 17, 2025',
    layers,
  };
  
  console.log('💾 Writing JSON:', outputPath);
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');
  
  console.log('✅ Done! Generated test configuration for', layers.length, 'layers');
  
  // Print summary stats
  const stats = {
    totalLayers: layers.length,
    withCategories: layers.filter(l => l.categories.length > 0).length,
    untested: layers.filter(l => 
      Object.values(l.expectedResults).every(v => v === null)
    ).length,
  };
  
  console.log('\n📊 Summary:');
  console.log(`   - Total layers: ${stats.totalLayers}`);
  console.log(`   - With categories: ${stats.withCategories}`);
  console.log(`   - Untested: ${stats.untested}`);
  console.log(`   - Tested: ${stats.totalLayers - stats.untested}`);
}

main();

