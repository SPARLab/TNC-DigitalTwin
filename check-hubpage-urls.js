// Check if Hub Pages have usable URLs
const baseUrl = 'https://dangermondpreserve-tnc.hub.arcgis.com/api/search/v1/collections';

async function checkHubPageURLs() {
  console.log('Checking Hub Page URLs...\n');
  
  const documentsUrl = `${baseUrl}/document/items?limit=100`;
  const response = await fetch(documentsUrl);
  const data = await response.json();
  
  data.features.forEach((feature, index) => {
    const props = feature.properties || {};
    const hasURL = props.url && props.url.trim() !== '';
    const hasItemURL = props.itemURL && props.itemURL.trim() !== '';
    
    console.log(`${index + 1}. "${props.title}"`);
    console.log(`   url: ${props.url || '(empty)'}`);
    console.log(`   itemURL: ${props.itemURL || '(empty)'}`);
    console.log(`   id: ${feature.id || props.id || '(none)'}`);
    console.log(`   Can display: ${hasURL || hasItemURL ? 'YES' : 'NO'}`);
    console.log('');
  });
}

checkHubPageURLs().catch(error => {
  console.error('Error:', error);
});
