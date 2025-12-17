/**
 * web/lib/sanitizeHtml.ts
 * Client-side defense-in-depth sanitization for AI summary HTML
 * 
 * IMPORTANT: This function returns empty string during SSR to prevent
 * rendering raw untrusted HTML on the server. The client will sanitize
 * and render the HTML after hydration.
 */

import DOMPurify from 'dompurify';

/**
 * Canonical allowlist matching server-side bleach (ensure these tags/attrs are preserved).
 * Includes ADD_TAGS/ADD_ATTR for broad DOMPurify compatibility across versions.
 */
const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'em', 'b', 'i', 'u',
  'ul', 'ol', 'li', 'a', 'h1', 'h2', 'h3', 'h4',
  'span', 'div', 'section',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'time'
];

const ALLOWED_ATTR = [
  'href',
  'target',
  'rel',
  'class',
  'datetime',
  'data-key',
  'data-segment',
  'data-severity',
  'data-index',
  'data-slot',
  'data-window',
  'data-window-index',
  'data-score',
  'data-pakshi',
];

/**
 * DOMPurify config: uses both ALLOWED_* and ADD_* keys to ensure compatibility
 * with different DOMPurify builds.
 */
export const SANITIZE_CONFIG = {
  ALLOWED_TAGS,
  ALLOWED_ATTR,
  ADD_TAGS: ALLOWED_TAGS,
  ADD_ATTR: ALLOWED_ATTR,
  ALLOW_DATA_ATTR: true,
  USE_PROFILES: { html: true },
};

/**
 * Check if we're running on the server (SSR) or client.
 * Returns true on server, false on client.
 */
function isSSR(): boolean {
  return typeof window === 'undefined';
}

/**
 * Sanitize HTML string for safe rendering in the client.
 * 
 * SECURITY: During SSR (when window is undefined), returns empty string
 * to prevent raw untrusted HTML from being included in server-rendered output.
 * The client will sanitize and render the actual HTML content after hydration.
 * 
 * Returns empty string if input is falsy or if DOMPurify fails.
 */
export function sanitizeHtml(html: string | undefined | null): string {
  if (!html || typeof html !== 'string' || !html.trim()) return '';

  // SECURITY: Return empty string during SSR to prevent raw HTML in server output
  // Client will properly sanitize and render HTML after hydration
  if (isSSR()) {
    return '';
  }

  try {
    const sanitized = DOMPurify.sanitize(html, SANITIZE_CONFIG);
    return sanitized || '';
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[sanitizeHtml] DOMPurify error', err);
    return '';
  }
}
