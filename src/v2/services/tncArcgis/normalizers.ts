export function normalizeArcGisDescription(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .split('\n')
    .map((line) => line.replace(/[ \t]{2,}/g, ' ').trim())
    .join('\n')
    .trim();
  return normalized || null;
}

/**
 * Keep ArcGIS HTML intact for rich rendering (sanitized at display time).
 * Falls back to plain-text normalization when there are no tags.
 */
export function prepareArcGisHtml(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  if (!/[<>]/.test(value)) return normalizeArcGisDescription(value);
  return value.trim() || null;
}

/** Strip tags to plain text — prefer prepareArcGisHtml + SafeHtml when rendering. */
export function normalizeArcGisHtmlText(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  if (!/[<>]/.test(value)) return normalizeArcGisDescription(value);
  const htmlWithLineBreaks = value
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|section|article|li|h[1-6]|tr)>/gi, '\n')
    .replace(/<li[^>]*>/gi, '- ');
  const stripped = htmlWithLineBreaks.replace(/<[^>]+>/g, ' ');
  const decoded = stripped
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"');
  return normalizeArcGisDescription(decoded);
}
