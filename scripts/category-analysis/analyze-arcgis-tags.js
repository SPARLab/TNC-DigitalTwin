// Analyze TNC ArcGIS Hub tags and categories to create new mappings
// Run with: node scripts/category-analysis/analyze-arcgis-tags.js

const BASE_URL = 'https://dangermondpreserve-tnc.hub.arcgis.com/api/search/v1/collections';

// New TNC official categories from the CSV
const NEW_CATEGORIES = [
  'Boundaries',
  'Infrastructure',
  'Research and Sensor Equipment',
  'Earth Observations',
  'Soils and Geology',
  'Land Cover',
  'Elevation and Bathymetry',
  'Weather and Climate',
  'Freshwater',
  'Species',
  'Threats and Hazards',
  'Oceans and Coasts',
  'Fire'
];

async function fetchCollection(collection, limit = 100) {
  const url = `${BASE_URL}/${collection}/items?limit=${limit}`;
  console.log(`Fetching ${collection}...`);
  
  const response = await fetch(url);
  const data = await response.json();
  return data.features || [];
}

async function analyzeArcGIS() {
  console.log('🔍 Fetching all TNC ArcGIS Hub items...\n');
  
  // Fetch all collections
  const [datasets, documents] = await Promise.all([
    fetchCollection('dataset', 1000),
    fetchCollection('document', 1000)
  ]);
  
  const allItems = [...datasets, ...documents];
  console.log(`✅ Fetched ${allItems.length} total items\n`);
  
  // Collect all unique tags and categories
  const allTags = new Set();
  const allCategories = new Set();
  const allTitles = [];
  
  allItems.forEach(feature => {
    const attrs = feature.properties || feature.attributes || {};
    
    // Collect tags
    if (attrs.tags && Array.isArray(attrs.tags)) {
      attrs.tags.forEach(tag => allTags.add(tag));
    }
    
    // Collect categories (extract last part of path)
    if (attrs.categories && Array.isArray(attrs.categories)) {
      attrs.categories.forEach(cat => {
        const categoryName = cat.split('/').pop();
        if (categoryName) allCategories.add(categoryName);
      });
    }
    
    // Collect titles for pattern analysis
    if (attrs.title) {
      allTitles.push(attrs.title);
    }
  });
  
  console.log('\n=== ANALYSIS RESULTS ===\n');
  console.log(`📊 Total unique tags: ${allTags.size}`);
  console.log(`📊 Total unique categories: ${allCategories.size}`);
  console.log(`📊 Total titles: ${allTitles.length}\n`);
  
  // Sort alphabetically
  const sortedTags = Array.from(allTags).sort();
  const sortedCategories = Array.from(allCategories).sort();
  
  console.log('\n=== ALL TAGS (alphabetical) ===');
  sortedTags.forEach(tag => console.log(`  - ${tag}`));
  
  console.log('\n\n=== ALL CATEGORIES (alphabetical) ===');
  sortedCategories.forEach(cat => console.log(`  - ${cat}`));
  
  console.log('\n\n=== SAMPLE TITLES (first 20) ===');
  allTitles.slice(0, 20).forEach(title => console.log(`  - ${title}`));
  
  // Now let's try to intelligently map tags to new categories
  console.log('\n\n=== SUGGESTED MAPPINGS TO NEW TNC CATEGORIES ===\n');
  
  const suggestedMappings = generateSmartMappings(sortedTags, sortedCategories);
  
  // Output as JSON structure
  console.log('\n=== JSON OUTPUT (copy this to category_mappings.json) ===\n');
  console.log(JSON.stringify({
    main_categories: NEW_CATEGORIES,
    mappings: suggestedMappings
  }, null, 2));
}

function generateSmartMappings(tags, categories) {
  // This function uses keyword matching to intelligently assign tags to categories
  const mappings = {
    tags: {},
    categories: {}
  };
  
  // Initialize empty arrays for each category
  NEW_CATEGORIES.forEach(cat => {
    mappings.tags[cat] = [];
    mappings.categories[cat] = [];
  });
  
  // Tag mapping rules based on keyword analysis
  const tagRules = {
    'Boundaries': ['boundary', 'boundaries', 'administrative', 'ownership', 'protected area', 'mpa', 'preserve'],
    'Infrastructure': ['infrastructure', 'transportation', 'road', 'rail', 'building', 'structures', 'utilities', 'well', 'trough'],
    'Research and Sensor Equipment': ['weather station', 'sensor', 'monitoring', 'camera trap', 'well monitor'],
    'Earth Observations': ['imagery', 'naip', 'satellite', 'aerial', 'earth observations', 'basemap', 'remote sensing', 'esa', 'living atlas'],
    'Soils and Geology': ['soil', 'geology', 'bedrock', 'earthquake', 'usgs', 'dibblee', 'soilgrids'],
    'Land Cover': ['vegetation', 'habitat', 'land cover', 'landcover', 'forest', 'cropland', 'botany', 'restoration', 'ecosystems', 'landscape'],
    'Elevation and Bathymetry': ['topography', 'elevation', 'bathymetry', 'dem', 'lidar', 'hillshade', 'slope'],
    'Weather and Climate': ['climate', 'weather', 'precipitation', 'temperature', 'nws', 'noaa', 'severe weather'],
    'Freshwater': ['water', 'freshwater', 'hydrology', 'hydrography', 'stream', 'river', 'lake', 'pond', 'watershed', 'basin', 'creek', 'dam', 'nhd', 'chlorophyll'],
    'Species': ['species', 'biodiversity', 'fish', 'cattle', 'wildlife', 'fauna', 'flora', 'cdfw', 'fws', 'endangered', 'esa', 'habitat areas'],
    'Threats and Hazards': ['hazard', 'vulnerability', 'risk', 'oil', 'gas', 'energy resources', 'contamination', 'ace', '30x30'],
    'Oceans and Coasts': ['marine', 'ocean', 'coastal', 'coast', 'wild coast', 'kelp', 'intertidal', 'boem'],
    'Fire': ['fire', 'burn', 'wildfire', 'cal fire', 'frap', 'prescribed', 'fire hazard', 'fhsz', 'fuels']
  };
  
  // Track unmapped items
  const unmappedTags = [];
  const unmappedCategories = [];
  
  // Assign tags to categories based on keyword matching
  tags.forEach(tag => {
    const tagLower = tag.toLowerCase();
    let matched = false;
    
    for (const [category, keywords] of Object.entries(tagRules)) {
      if (keywords.some(keyword => tagLower.includes(keyword))) {
        mappings.tags[category].push(tag);
        matched = true;
      }
    }
    
    if (!matched) {
      unmappedTags.push(tag);
    }
  });
  
  // Similar logic for categories
  categories.forEach(cat => {
    const catLower = cat.toLowerCase();
    let matched = false;
    
    for (const [category, keywords] of Object.entries(tagRules)) {
      if (keywords.some(keyword => catLower.includes(keyword))) {
        mappings.categories[category].push(cat);
        matched = true;
      }
    }
    
    if (!matched) {
      unmappedCategories.push(cat);
    }
  });
  
  // Report unmapped items
  if (unmappedTags.length > 0) {
    console.log('\n⚠️  UNMAPPED TAGS:');
    unmappedTags.forEach(tag => console.log(`     - "${tag}"`));
  }
  
  if (unmappedCategories.length > 0) {
    console.log('\n⚠️  UNMAPPED CATEGORIES:');
    unmappedCategories.forEach(cat => console.log(`     - "${cat}"`));
  }
  
  return mappings;
}

// Run the analysis
analyzeArcGIS().catch(console.error);

