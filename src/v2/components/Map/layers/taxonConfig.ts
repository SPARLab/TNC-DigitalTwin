// ============================================================================
// Taxon Config — Shared emoji + color mapping for iNaturalist taxon categories
// Used by: map layer renderer (emoji markers) + sidebar legend/filter
// ============================================================================

export interface TaxonInfo {
  value: string;      // ArcGIS field value (e.g., 'Aves')
  label: string;      // Display label (e.g., 'Birds')
  emoji: string;      // Map marker emoji
  color: string;      // Hex color for legend dot
}

interface EmojiDataUriOptions {
  withWhiteHalo?: boolean;
}

/** All taxon categories with emoji, label, and color */
export const TAXON_CONFIG: TaxonInfo[] = [
  { value: 'Aves',            label: 'Birds',      emoji: '🐦', color: '#4A90E2' },
  { value: 'Mammalia',        label: 'Mammals',    emoji: '🦌', color: '#8B4513' },
  { value: 'Reptilia',        label: 'Reptiles',   emoji: '🦎', color: '#228B22' },
  { value: 'Amphibia',        label: 'Amphibians', emoji: '🐸', color: '#32CD32' },
  { value: 'Actinopterygii',  label: 'Fish',       emoji: '🐟', color: '#1E90FF' },
  { value: 'Insecta',         label: 'Insects',    emoji: '🦋', color: '#FFD700' },
  { value: 'Arachnida',       label: 'Spiders',    emoji: '🕷️', color: '#800080' },
  { value: 'Plantae',         label: 'Plants',     emoji: '🌱', color: '#228B22' },
  { value: 'Fungi',           label: 'Fungi',      emoji: '🍄', color: '#FF6B6B' },
  { value: 'Mollusca',        label: 'Mollusks',   emoji: '🐚', color: '#DDA0DD' },
  { value: 'Protozoa',        label: 'Protozoa',   emoji: '🔬', color: '#95E1D3' },
];

/** Quick lookup: taxon value → TaxonInfo */
export const TAXON_MAP = new Map(TAXON_CONFIG.map(t => [t.value, t]));

/** Get emoji for a taxon category value, with fallback */
export function getTaxonEmoji(category: string): string {
  return TAXON_MAP.get(category)?.emoji ?? '🔍';
}

/** Get color for a taxon category value, with fallback */
export function getTaxonColor(category: string): string {
  return TAXON_MAP.get(category)?.color ?? '#666666';
}

/**
 * Convert an emoji to an SVG data URI for use as an ArcGIS PictureMarkerSymbol.
 * Renders the emoji centered in a 28x28 SVG.
 */
export function emojiToDataUri(emoji: string, options: EmojiDataUriOptions = {}): string {
  const { withWhiteHalo = false } = options;
  const haloStyle = withWhiteHalo
    ? 'text-shadow: -1px 0 #ffffff, 0 1px #ffffff, 1px 0 #ffffff, 0 -1px #ffffff;'
    : '';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">
    <text x="14" y="14" text-anchor="middle" dominant-baseline="central" font-size="20" font-family="Arial, sans-serif" style="${haloStyle}">${emoji}</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
