// Import to get window.__lenis type from lenisClient
import type {} from '@/lib/lenisClient';
import { getLenis } from '@/lib/lenisClient';

/**
 * Default header height offset for scroll calculations.
 * Adjust this value to account for fixed/sticky headers.
 */
const DEFAULT_HEADER_OFFSET = 80;

/**
 * Scroll to an anchor element on the page.
 *
 * Lenis-aware: Uses Lenis smooth scrolling when available,
 * otherwise falls back to native scrollIntoView.
 *
 * @param anchor - The anchor ID (with or without leading #)
 * @param offset - Optional pixel offset from top (default: DEFAULT_HEADER_OFFSET)
 */
export const scrollToAnchor = (anchor: string, offset: number = DEFAULT_HEADER_OFFSET) => {
  if (typeof window === 'undefined') return;

  const id = anchor.startsWith('#') ? anchor.substring(1) : anchor;
  const el = document.getElementById(id);

  if (!el) return;

  // Check if Lenis is available and has scrollTo method
  const lenis = getLenis() ?? window.__lenis;
  if (lenis && typeof (lenis as any).scrollTo === 'function') {
    // Use Lenis smooth scrolling with offset
    (lenis as any).scrollTo(el, { offset: -offset });
  } else {
    // Native fallback which honors offset (so anchor isn't hidden behind headers/docks)
    const top = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
  }
};

/**
 * Scroll to the top of the page.
 *
 * Lenis-aware: Uses Lenis smooth scrolling when available,
 * otherwise falls back to native window.scrollTo.
 */
export const scrollToTop = () => {
  if (typeof window === 'undefined') return;

  // Check if Lenis is available and has scrollTo method
  if (
    typeof window.__lenis !== 'undefined' &&
    window.__lenis &&
    typeof window.__lenis.scrollTo === 'function'
  ) {
    // Use Lenis smooth scrolling to top
    window.__lenis.scrollTo(0);
  } else {
    // Fallback to native smooth scrolling
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};
