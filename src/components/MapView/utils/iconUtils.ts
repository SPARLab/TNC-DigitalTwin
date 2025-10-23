import { iNaturalistObservation } from '../../../services/iNaturalistService';

/**
 * Maps iNaturalist iconic taxon to display color and emoji
 */
export const getObservationIcon = (obs: iNaturalistObservation) => {
  const iconicTaxon = obs.taxon?.iconic_taxon_name?.toLowerCase();
  
  switch (iconicTaxon) {
    case 'aves':
      return { color: '#4A90E2', emoji: '🐦' };
    case 'mammalia':
      return { color: '#8B4513', emoji: '🦌' };
    case 'reptilia':
      return { color: '#228B22', emoji: '🦎' };
    case 'amphibia':
      return { color: '#32CD32', emoji: '🐸' };
    case 'actinopterygii':
      return { color: '#1E90FF', emoji: '🐟' };
    case 'insecta':
      return { color: '#FFD700', emoji: '🦋' };
    case 'arachnida':
      return { color: '#800080', emoji: '🕷️' };
    case 'plantae':
      return { color: '#228B22', emoji: '🌱' };
    case 'mollusca':
      return { color: '#DDA0DD', emoji: '🐚' };
    case 'animalia':
      return { color: '#666666', emoji: '🐾' };
    case 'fungi':
      return { color: '#FF6B6B', emoji: '🍄' };
    case 'chromista':
      return { color: '#4ECDC4', emoji: '🦠' };
    case 'protozoa':
      return { color: '#95E1D3', emoji: '🔬' };
    default:
      return { color: '#666666', emoji: '🔍' };
  }
};

/**
 * Normalizes TNC taxon category names to iconic taxon names for legend consistency
 */
export const normalizeTNCCategoryToIconicTaxon = (taxonCategory: string): string => {
  const category = taxonCategory?.toLowerCase() || '';
  
  if (category.includes('bird') || category.includes('aves')) return 'aves';
  if (category.includes('mammal')) return 'mammalia';
  if (category.includes('reptil')) return 'reptilia';
  if (category.includes('amphibi')) return 'amphibia';
  if (category.includes('fish')) return 'actinopterygii';
  if (category.includes('insect')) return 'insecta';
  if (category.includes('spider') || category.includes('arachnid')) return 'arachnida';
  if (category.includes('plant') || category.includes('flora')) return 'plantae';
  if (category.includes('mollus')) return 'mollusca';
  if (category.includes('fungi') || category.includes('mushroom')) return 'fungi';
  if (category.includes('protozoa')) return 'protozoa';
  
  return 'unknown';
};

/**
 * Gets emoji icon for TNC observation based on taxon category
 */
export const getTNCObservationEmoji = (taxonCategory: string): string => {
  const category = taxonCategory?.toLowerCase() || '';
  
  // Map TNC category names to emojis (matching regular iNaturalist)
  if (category.includes('bird') || category.includes('aves')) return '🐦';
  if (category.includes('mammal')) return '🦌';
  if (category.includes('reptil')) return '🦎';
  if (category.includes('amphibi')) return '🐸';
  if (category.includes('fish')) return '🐟';
  if (category.includes('insect')) return '🦋';
  if (category.includes('spider') || category.includes('arachnid')) return '🕷️';
  if (category.includes('plant') || category.includes('flora')) return '🌱';
  if (category.includes('mollus')) return '🐚';
  if (category.includes('fungi') || category.includes('mushroom')) return '🍄';
  if (category.includes('protozoa')) return '🔬';
  
  // Default for unknown/other categories
  return '🔍';
};

/**
 * Converts emoji to SVG data URI for use as map marker icon
 */
export const getEmojiDataUri = (emoji: string): string => {
  // Create SVG with just the emoji (no background circle)
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">
      <text x="14" y="14" text-anchor="middle" dominant-baseline="central" font-size="20" font-family="Arial, sans-serif">
        ${emoji}
      </text>
    </svg>
  `;
  // Use URL encoding instead of base64 to handle emojis properly
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

