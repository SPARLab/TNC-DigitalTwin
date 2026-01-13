// Explore the TNC Hub structure
const hubBaseUrl = 'https://dangermondpreserve-tnc.hub.arcgis.com';

async function exploreHub() {
  console.log('Exploring TNC ArcGIS Hub structure...\n');
  
  // Try to fetch the main hub page
  try {
    console.log('1. Testing main hub URL:', hubBaseUrl);
    const response = await fetch(hubBaseUrl);
    console.log('   Status:', response.status, response.statusText);
    console.log('   Content-Type:', response.headers.get('content-type'));
    
    // Try common Hub page patterns
    const testPages = [
      { name: 'Preserve Fire', slug: 'preserve-fire', id: 'e501455565e54883bd0145a4a12811fb' },
      { name: 'Freshwater', slug: 'freshwater', id: '6558d32500494ec48ffed5768a33f432' },
      { name: 'Imagery', slug: 'imagery', id: '78df29e7b77e433c88349b5dc8c8de12' }
    ];
    
    console.log('\n2. Testing Hub Page URL patterns:\n');
    
    for (const page of testPages) {
      // Try slug-based URL
      const slugUrl = `${hubBaseUrl}/pages/${page.slug}`;
      console.log(`Testing "${page.name}" with slug:`);
      console.log(`   URL: ${slugUrl}`);
      try {
        const slugResponse = await fetch(slugUrl, { method: 'HEAD' });
        console.log(`   Status: ${slugResponse.status} ${slugResponse.statusText}`);
        if (slugResponse.ok) {
          console.log('   ✅ Slug URL works!');
        }
      } catch (e) {
        console.log('   ❌ Slug URL failed');
      }
      
      // Try ID-based URL
      const idUrl = `${hubBaseUrl}/pages/${page.id}`;
      console.log(`   ID URL: ${idUrl}`);
      try {
        const idResponse = await fetch(idUrl, { method: 'HEAD' });
        console.log(`   Status: ${idResponse.status} ${idResponse.statusText}`);
        if (idResponse.ok) {
          console.log('   ✅ ID URL works!');
        }
      } catch (e) {
        console.log('   ❌ ID URL failed');
      }
      
      console.log('');
    }
    
    // Check if we can get hub configuration
    console.log('3. Checking hub configuration API:');
    const configUrl = `${hubBaseUrl}/api/v3/sites/self`;
    try {
      const configResponse = await fetch(configUrl);
      if (configResponse.ok) {
        const config = await configResponse.json();
        console.log('   ✅ Hub config accessible');
        console.log('   Hub name:', config.data?.attributes?.name);
        console.log('   Hub subdomain:', config.data?.attributes?.subdomain);
      } else {
        console.log('   Status:', configResponse.status);
      }
    } catch (e) {
      console.log('   ❌ Config not accessible');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

exploreHub();
