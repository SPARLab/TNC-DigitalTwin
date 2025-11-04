/**
 * CSV Parser for test utilities
 * Parses CSV content into row objects with string keys
 */

export interface CSVRow {
  [key: string]: string | undefined;
  id?: string;
  title?: string;
  type?: string;
  description?: string;
  snippet?: string;
  url?: string;
  owner?: string;
  tags?: string;
  categories?: string;
  mainCategories?: string;
  collection?: string;
  num_views?: string;
  size?: string;
  created?: string;
  modified?: string;
  thumbnail?: string;
  // TNC CSV fields
  'Item ID'?: string;
  'Title'?: string;
  'Type'?: string;
  'Mapped Categories'?: string;
  'Created Date'?: string;
  'Description'?: string;
}

/**
 * Parse CSV content into array of row objects
 */
export function parseCSV(csvContent: string): CSVRow[] {
  if (!csvContent || csvContent.trim() === '') {
    return [];
  }

  const lines = csvContent.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  if (lines.length === 0) {
    return [];
  }

  // Parse header row
  const headers = parseCSVLine(lines[0]);
  if (headers.length === 0) {
    return [];
  }

  // Parse data rows
  const rows: CSVRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: CSVRow = {};
    
    headers.forEach((header, index) => {
      row[header] = values[index] || undefined;
    });
    
    rows.push(row);
  }

  return rows;
}

/**
 * Parse a single CSV line, handling quoted fields and newlines within quotes
 */
function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  // Add last field
  values.push(current.trim());
  
  return values;
}

/**
 * Filter CSV rows based on criteria
 */
export function filterCSVRows(
  rows: CSVRow[],
  filters: {
    mainCategories?: string[];
    categories?: string[];
    types?: string[];
  }
): CSVRow[] {
  return rows.filter(row => {
    if (filters.mainCategories && filters.mainCategories.length > 0) {
      const rowCategories = row.mainCategories || row.categories || row['Mapped Categories'] || '';
      const categoryArray = typeof rowCategories === 'string' 
        ? rowCategories.split(';').map(c => c.trim())
        : [];
      const matches = filters.mainCategories.some(cat => 
        categoryArray.some(rc => rc.toLowerCase().includes(cat.toLowerCase()))
      );
      if (!matches) return false;
    }
    
    if (filters.categories && filters.categories.length > 0) {
      const rowCategories = row.categories || row['Mapped Categories'] || '';
      const categoryArray = typeof rowCategories === 'string' 
        ? rowCategories.split(';').map(c => c.trim())
        : [];
      const matches = filters.categories.some(cat => 
        categoryArray.includes(cat)
      );
      if (!matches) return false;
    }
    
    if (filters.types && filters.types.length > 0) {
      const rowType = row.type || row.Type || '';
      const matches = filters.types.some(type => 
        rowType.toLowerCase().includes(type.toLowerCase())
      );
      if (!matches) return false;
    }
    
    return true;
  });
}

/**
 * Analyze CSV data for test scenarios
 */
export function analyzeCSVForTestScenarios(rows: CSVRow[]): {
  totalItems: number;
  categories: string[];
  types: string[];
  owners: string[];
  samplesByCategory: Record<string, CSVRow[]>;
} {
  const categories = new Set<string>();
  const types = new Set<string>();
  const owners = new Set<string>();
  const samplesByCategory: Record<string, CSVRow[]> = {};
  
  rows.forEach(row => {
    const rowCategories = row.mainCategories || row.categories || row['Mapped Categories'] || '';
    const categoryArray = typeof rowCategories === 'string' 
      ? rowCategories.split(';').map(c => c.trim()).filter(Boolean)
      : [];
    
    categoryArray.forEach(cat => {
      categories.add(cat);
      if (!samplesByCategory[cat]) {
        samplesByCategory[cat] = [];
      }
      if (samplesByCategory[cat].length < 10) {
        samplesByCategory[cat].push(row);
      }
    });
    
    const rowType = row.type || row.Type || '';
    if (rowType) {
      types.add(rowType);
    }
    
    const rowOwner = row.owner || '';
    if (rowOwner) {
      owners.add(rowOwner);
    }
  });
  
  return {
    totalItems: rows.length,
    categories: Array.from(categories).sort(),
    types: Array.from(types).sort(),
    owners: Array.from(owners).sort(),
    samplesByCategory
  };
}
