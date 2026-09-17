import { describe, expect, it } from 'vitest';
import { looksLikeHtml, sanitizeCatalogHtml } from './safeHtml';

describe('looksLikeHtml', () => {
  it('detects markup', () => {
    expect(looksLikeHtml('<p>Hello</p>')).toBe(true);
    expect(looksLikeHtml('Plain description text')).toBe(false);
  });
});

describe('sanitizeCatalogHtml', () => {
  it('keeps safe formatting and links', () => {
    const dirty =
      "<p><strong>Beta</strong> <a href='https://example.com' onclick='alert(1)'>link</a></p>";
    const clean = sanitizeCatalogHtml(dirty);
    expect(clean).toContain('<strong>Beta</strong>');
    expect(clean).toContain('href="https://example.com"');
    expect(clean).toContain('rel="noopener noreferrer"');
    expect(clean).not.toContain('onclick');
  });

  it('strips script tags', () => {
    const clean = sanitizeCatalogHtml('<p>Safe</p><script>alert(1)</script>');
    expect(clean).toContain('Safe');
    expect(clean).not.toContain('script');
    expect(clean).not.toContain('alert');
  });
});
