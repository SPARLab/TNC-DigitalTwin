// ============================================================================
// Safe HTML helpers for catalog / ArcGIS descriptions that may include markup.
// Always sanitize before rendering — never inject raw HTML into the DOM.
// ============================================================================

import DOMPurify from 'dompurify';

const HTML_TAG_PATTERN = /<\/?[a-z][\s\S]*>/i;

/** True when the string looks like it contains HTML markup rather than plain text. */
export function looksLikeHtml(value: string): boolean {
  return HTML_TAG_PATTERN.test(value);
}

/**
 * Sanitize catalog/ArcGIS HTML for safe rendering.
 * Allows common formatting and links; strips scripts, event handlers, and
 * dangerous URLs. External links get rel="noopener noreferrer".
 */
export function sanitizeCatalogHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    USE_PROFILES: { html: true },
    ALLOWED_TAGS: [
      'a',
      'b',
      'strong',
      'i',
      'em',
      'u',
      'p',
      'br',
      'div',
      'span',
      'ul',
      'ol',
      'li',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'table',
      'thead',
      'tbody',
      'tr',
      'th',
      'td',
      'sup',
      'sub',
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'style', 'class', 'title'],
    ALLOW_DATA_ATTR: false,
    // Force safer link behavior for anything that survives the allow-list.
    ADD_ATTR: ['target'],
  }).replace(
    /<a\b([^>]*?)>/gi,
    (_match, attrs: string) => {
      const withoutRel = attrs.replace(/\srel\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
      return `<a${withoutRel} rel="noopener noreferrer">`;
    },
  );
}
