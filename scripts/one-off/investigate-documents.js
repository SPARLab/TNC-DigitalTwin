// Investigate what's in the documents collection and their tags/categories
const baseUrl = 'https://dangermondpreserve-tnc.hub.arcgis.com/api/search/v1/collections';

async function investigateDocuments() {
  console.log('Investigating TNC ArcGIS Hub /document collection...\n');
  
  const documentsUrl = `${baseUrl}/document/items?limit=100`;
  const response = await fetch(documentsUrl);
  const data = await response.json();
  
  console.log(`Total documents: ${data.features?.length || 0}\n`);
  
  if (data.features?.length > 0) {
    // Get unique types
    const types = new Set(data.features.map(f => f.properties?.type).filter(Boolean));
    console.log(`Document types: ${Array.from(types).join(', ')}\n`);
    
    // Analyze each document
    console.log('Document details:\n');
    data.features.forEach((feature, index) => {
      const props = feature.properties || {};
      console.log(`${index + 1}. "${props.title}"`);
      console.log(`   Type: ${props.type}`);
      console.log(`   Tags: ${props.tags?.length > 0 ? props.tags.join(', ') : 'none'}`);
      console.log(`   Categories: ${props.categories?.length > 0 ? props.categories.join(', ') : 'none'}`);
      console.log(`   URL: ${props.url}`);
      console.log('');
    });
    
    // Collect all unique tags
    const allTags = new Set();
    data.features.forEach(f => {
      const tags = f.properties?.tags || [];
      tags.forEach(tag => allTags.add(tag));
    });
    
    console.log(`\nAll unique tags across documents (${allTags.size}):`);
    Array.from(allTags).sort().forEach(tag => console.log(`  - ${tag}`));
    
    // Collect all unique categories
    const allCategories = new Set();
    data.features.forEach(f => {
      const categories = f.properties?.categories || [];
      categories.forEach(cat => allCategories.add(cat));
    });
    
    console.log(`\nAll unique categories across documents (${allCategories.size}):`);
    Array.from(allCategories).sort().forEach(cat => console.log(`  - ${cat}`));
  }
}

investigateDocuments().catch(error => {
  console.error('Error:', error);
});
