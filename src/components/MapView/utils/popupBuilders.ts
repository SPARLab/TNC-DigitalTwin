import { iNaturalistObservation } from '../../../services/iNaturalistService';
import { TNCArcGISObservation, tncINaturalistService } from '../../../services/tncINaturalistService';

/**
 * Builds popup content for iNaturalist Public API observations with photo carousel
 */
export const buildPublicAPIPopupContent = (obs: iNaturalistObservation) => {
  return () => {
    const container = document.createElement('div');
    container.className = 'inaturalist-observation-popup';

    // Photo section
    if (obs.photos && obs.photos.length > 0) {
      const photoWrapper = document.createElement('div');
      photoWrapper.style.display = 'flex';
      photoWrapper.style.flexDirection = 'column';
      photoWrapper.style.alignItems = 'center';
      photoWrapper.style.marginBottom = '8px';

      const img = document.createElement('img');
      // Try to get the highest quality image: original > large > medium
      const photo = obs.photos[0];
      let photoUrl = photo.url; // Default to original URL
      
      // If URL contains 'medium', try to replace with 'large' or 'original' for better quality
      if (photo.url && typeof photo.url === 'string') {
        // iNaturalist URLs often follow pattern: /photos/{id}/{size}.jpg
        // Try 'large' first (1024px), then 'original' (2048px)
        photoUrl = photo.url.replace('/medium.', '/large.').replace('/square.', '/large.');
        if (!photoUrl.includes('/large.') && !photoUrl.includes('/original.')) {
          // If no size in URL, use the URL as-is (might already be original)
          photoUrl = photo.url;
        }
      }
      
      img.src = photoUrl;
      img.alt = obs.taxon?.preferred_common_name || obs.taxon?.name || 'Observation photo';
      img.loading = 'lazy';
      img.style.width = '100%';
      img.style.maxWidth = '350px';
      img.style.borderRadius = '6px';
      img.style.objectFit = 'cover';
      img.onerror = () => { img.style.display = 'none'; };

      photoWrapper.appendChild(img);

      // Only show controls if there are multiple photos
      if (obs.photos.length > 1) {
        const controls = document.createElement('div');
        controls.style.display = 'flex';
        controls.style.alignItems = 'center';
        controls.style.justifyContent = 'space-between';
        controls.style.width = '100%';
        controls.style.maxWidth = '350px';
        controls.style.marginTop = '6px';

        let currentIndex = 0;
        const label = document.createElement('span');
        label.style.fontSize = '12px';
        label.style.color = '#4b5563';
        label.textContent = `Photo ${currentIndex + 1} of ${obs.photos.length}`;

        const prevBtn = document.createElement('button');
        prevBtn.textContent = '◀';
        prevBtn.style.fontSize = '12px';
        prevBtn.style.padding = '2px 6px';
        prevBtn.style.border = '1px solid #e5e7eb';
        prevBtn.style.borderRadius = '4px';
        prevBtn.style.background = 'white';
        prevBtn.style.cursor = 'pointer';
        prevBtn.onclick = () => {
          currentIndex = (currentIndex - 1 + obs.photos.length) % obs.photos.length;
          const photo = obs.photos[currentIndex];
          // Use large quality for carousel images too
          let url = photo.url;
          if (url && typeof url === 'string') {
            url = url.replace('/medium.', '/large.').replace('/square.', '/large.');
          }
          img.src = url;
          label.textContent = `Photo ${currentIndex + 1} of ${obs.photos.length}`;
        };

        const nextBtn = document.createElement('button');
        nextBtn.textContent = '▶';
        nextBtn.style.fontSize = '12px';
        nextBtn.style.padding = '2px 6px';
        nextBtn.style.border = '1px solid #e5e7eb';
        nextBtn.style.borderRadius = '4px';
        nextBtn.style.background = 'white';
        nextBtn.style.cursor = 'pointer';
        nextBtn.onclick = () => {
          currentIndex = (currentIndex + 1) % obs.photos.length;
          const photo = obs.photos[currentIndex];
          // Use large quality for carousel images too
          let url = photo.url;
          if (url && typeof url === 'string') {
            url = url.replace('/medium.', '/large.').replace('/square.', '/large.');
          }
          img.src = url;
          label.textContent = `Photo ${currentIndex + 1} of ${obs.photos.length}`;
        };

        controls.appendChild(prevBtn);
        controls.appendChild(label);
        controls.appendChild(nextBtn);

        photoWrapper.appendChild(controls);
      }

      container.appendChild(photoWrapper);
    } else {
      const noPhoto = document.createElement('div');
      noPhoto.textContent = 'No photo available';
      noPhoto.style.fontSize = '12px';
      noPhoto.style.color = '#6b7280';
      noPhoto.style.marginBottom = '8px';
      container.appendChild(noPhoto);
    }

    // Add details
    const details = document.createElement('div');
    const commonName = obs.taxon?.preferred_common_name;
    const scientificName = obs.taxon?.name;
    const iconicTaxon = obs.taxon?.iconic_taxon_name || 'Unknown';
    const qualityGrade = obs.quality_grade ? obs.quality_grade.charAt(0).toUpperCase() + obs.quality_grade.slice(1).replace('_', ' ') : 'Unknown';
    
    details.innerHTML = `
      <div class="popup-header">
        <h3>${commonName || scientificName || 'Unknown Species'}</h3>
        ${commonName && scientificName ? `<p class="scientific-name"><em>${scientificName}</em></p>` : ''}
      </div>
      <div class="popup-details">
        <p><strong>Taxon Category:</strong> ${iconicTaxon}</p>
        <p><strong>Quality Grade:</strong> ${qualityGrade}</p>
        <p><strong>Observed:</strong> ${new Date(obs.observed_on).toLocaleDateString()}</p>
        <p><strong>Observer:</strong> ${obs.user.login}</p>
        ${obs.taxon?.id ? `<p><strong>Taxon ID:</strong> ${obs.taxon.id}</p>` : ''}
      </div>
      <div class="popup-actions">
        <a href="${obs.uri}" target="_blank" class="popup-link">View on iNaturalist →</a>
      </div>
    `;
    container.appendChild(details);

    // Basic styles for the popup content
    const style = document.createElement('style');
    style.textContent = `
      .inaturalist-observation-popup { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 300px; }
      .popup-header h3 { margin: 0 0 5px 0; color: #2c3e50; font-size: 16px; }
      .scientific-name { margin: 0 0 10px 0; color: #7f8c8d; font-size: 14px; }
      .popup-details p { margin: 5px 0; font-size: 13px; }
      .popup-actions { margin-top: 15px; padding-top: 15px; border-top: 1px solid #ecf0f1; }
      .popup-link { color: #3498db; text-decoration: none; font-size: 13px; font-weight: 500; }
      .popup-link:hover { text-decoration: underline; }
    `;
    container.appendChild(style);

    return container;
  };
};

/**
 * Builds popup content for TNC observations with photo carousel and attribution
 */
export const buildTNCPopupContent = (obs: TNCArcGISObservation) => {
  const imageUrls = tncINaturalistService.parseImageUrlsFromObservation(obs);
  const attribution = tncINaturalistService.getPhotoAttribution(obs);

  return () => {
    const container = document.createElement('div');
    container.className = 'tnc-observation-popup';

    // Photo section
    if (imageUrls.length > 0) {
      const photoWrapper = document.createElement('div');
      photoWrapper.style.display = 'flex';
      photoWrapper.style.flexDirection = 'column';
      photoWrapper.style.alignItems = 'center';
      photoWrapper.style.marginBottom = '8px';

      const img = document.createElement('img');
      img.src = imageUrls[0];
      img.alt = obs.common_name || obs.scientific_name || 'Observation photo';
      img.loading = 'lazy';
      img.style.maxWidth = '260px';
      img.style.borderRadius = '6px';
      img.style.objectFit = 'cover';
      img.onerror = () => { img.style.display = 'none'; };

      const controls = document.createElement('div');
      controls.style.display = 'flex';
      controls.style.alignItems = 'center';
      controls.style.justifyContent = 'space-between';
      controls.style.width = '100%';
      controls.style.maxWidth = '260px';
      controls.style.marginTop = '6px';

      let currentIndex = 0;
      const label = document.createElement('span');
      label.style.fontSize = '12px';
      label.style.color = '#4b5563';
      label.textContent = `Photo ${currentIndex + 1} of ${imageUrls.length}`;

      const prevBtn = document.createElement('button');
      prevBtn.textContent = '◀';
      prevBtn.style.fontSize = '12px';
      prevBtn.style.padding = '2px 6px';
      prevBtn.style.border = '1px solid #e5e7eb';
      prevBtn.style.borderRadius = '4px';
      prevBtn.style.background = 'white';
      prevBtn.disabled = imageUrls.length <= 1;
      prevBtn.onclick = () => {
        currentIndex = (currentIndex - 1 + imageUrls.length) % imageUrls.length;
        img.src = imageUrls[currentIndex];
        label.textContent = `Photo ${currentIndex + 1} of ${imageUrls.length}`;
      };

      const nextBtn = document.createElement('button');
      nextBtn.textContent = '▶';
      nextBtn.style.fontSize = '12px';
      nextBtn.style.padding = '2px 6px';
      nextBtn.style.border = '1px solid #e5e7eb';
      nextBtn.style.borderRadius = '4px';
      nextBtn.style.background = 'white';
      nextBtn.disabled = imageUrls.length <= 1;
      nextBtn.onclick = () => {
        currentIndex = (currentIndex + 1) % imageUrls.length;
        img.src = imageUrls[currentIndex];
        label.textContent = `Photo ${currentIndex + 1} of ${imageUrls.length}`;
      };

      controls.appendChild(prevBtn);
      controls.appendChild(label);
      controls.appendChild(nextBtn);

      photoWrapper.appendChild(img);
      photoWrapper.appendChild(controls);

      if (attribution) {
        const credit = document.createElement('div');
        credit.textContent = attribution;
        credit.style.fontSize = '11px';
        credit.style.color = '#6b7280';
        credit.style.marginTop = '4px';
        photoWrapper.appendChild(credit);
      }

      container.appendChild(photoWrapper);
    } else {
      const noPhoto = document.createElement('div');
      noPhoto.textContent = 'No photo available';
      noPhoto.style.fontSize = '12px';
      noPhoto.style.color = '#6b7280';
      noPhoto.style.marginBottom = '8px';
      container.appendChild(noPhoto);
    }

    // Add details (reuse existing markup for taxonomy and links)
    const details = document.createElement('div');
    details.innerHTML = `
      <div class="popup-header">
        <h3>${obs.common_name || obs.scientific_name}</h3>
        ${obs.common_name && obs.scientific_name ? `<p class="scientific-name"><em>${obs.scientific_name}</em></p>` : ''}
      </div>
      <div class="popup-details">
        <p><strong>Taxon Category:</strong> ${obs.taxon_category_name}</p>
        <p><strong>Observed:</strong> ${new Date(obs.observed_on).toLocaleDateString()}</p>
        <p><strong>Observer:</strong> ${obs.user_name}</p>
        <p><strong>Taxon ID:</strong> ${obs.taxon_id}</p>
      </div>
      <div class="taxonomic-hierarchy">
        <h4>Taxonomic Classification</h4>
        <div class="taxonomy-grid">
          ${obs.taxon_kingdom_name ? `<div><strong>Kingdom:</strong> ${obs.taxon_kingdom_name}</div>` : ''}
          ${obs.taxon_phylum_name ? `<div><strong>Phylum:</strong> ${obs.taxon_phylum_name}</div>` : ''}
          ${obs.taxon_class_name ? `<div><strong>Class:</strong> ${obs.taxon_class_name}</div>` : ''}
          ${obs.taxon_order_name ? `<div><strong>Order:</strong> ${obs.taxon_order_name}</div>` : ''}
          ${obs.taxon_family_name ? `<div><strong>Family:</strong> ${obs.taxon_family_name}</div>` : ''}
          ${obs.taxon_genus_name ? `<div><strong>Genus:</strong> ${obs.taxon_genus_name}</div>` : ''}
          ${obs.taxon_species_name ? `<div><strong>Species:</strong> ${obs.taxon_species_name}</div>` : ''}
        </div>
      </div>
      <div class="popup-actions">
        ${obs.observation_uuid ? 
          `<a href="https://www.inaturalist.org/observations/${obs.observation_uuid}" target="_blank" class="popup-link">View on iNaturalist →</a>` : 
          `<span class="popup-link-disabled" style="color: #999; font-size: 13px;">iNaturalist link not available</span>`}
      </div>
    `;
    container.appendChild(details);

    // Basic styles for the popup content
    const style = document.createElement('style');
    style.textContent = `
      .tnc-observation-popup { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 300px; }
      .popup-header h3 { margin: 0 0 5px 0; color: #2c3e50; font-size: 16px; }
      .scientific-name { margin: 0 0 10px 0; color: #7f8c8d; font-size: 14px; }
      .popup-details p { margin: 5px 0; font-size: 13px; }
      .taxonomic-hierarchy { margin-top: 15px; padding-top: 15px; border-top: 1px solid #ecf0f1; }
      .taxonomic-hierarchy h4 { margin: 0 0 10px 0; font-size: 14px; color: #34495e; }
      .taxonomy-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 5px; font-size: 12px; }
      .taxonomy-grid div { padding: 2px 0; }
      .popup-actions { margin-top: 15px; padding-top: 15px; border-top: 1px solid #ecf0f1; }
      .popup-link { color: #3498db; text-decoration: none; font-size: 13px; font-weight: 500; }
      .popup-link:hover { text-decoration: underline; }
    `;
    container.appendChild(style);

    return container;
  };
};

