// ============================================================================
// SafeHtml — renders sanitized HTML from catalog / ArcGIS descriptions.
// Plain text passes through unchanged; markup is DOMPurify-cleaned first.
// ============================================================================

import { useMemo, type Ref } from 'react';
import { looksLikeHtml, sanitizeCatalogHtml } from '../../utils/safeHtml';

interface SafeHtmlProps {
  html: string;
  className?: string;
  id?: string;
  /** Called when the rendered content may have changed size (e.g. for collapse measure). */
  contentRef?: Ref<HTMLDivElement>;
}

export function SafeHtml({ html, className, id, contentRef }: SafeHtmlProps) {
  const isHtml = looksLikeHtml(html);
  const sanitized = useMemo(
    () => (isHtml ? sanitizeCatalogHtml(html) : null),
    [html, isHtml],
  );

  if (!isHtml || !sanitized) {
    return (
      <div id={id} ref={contentRef} className={className}>
        {html}
      </div>
    );
  }

  return (
    <div
      id={id}
      ref={contentRef}
      className={className}
      // Sanitized above with DOMPurify — never pass unsanitized catalog HTML here.
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}
