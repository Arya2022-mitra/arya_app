/**
 * Lenis Smooth Scrolling Client
 *
 * Provides a singleton Lenis instance for site-wide smooth scrolling.
 * Respects reduced-motion accessibility preferences and provides
 * graceful fallback to native scrolling.
 */
import Lenis from 'lenis';

/** Extend Window type to include __lenis for cross-module detection */
declare global {
  interface Window {
    __lenis?: Lenis;
  }
}

/** Internal singleton reference */
let lenisInstance: Lenis | null = null;

/** RAF loop ID for cleanup */
let rafId: number | null = null;

/** Options for Lenis initialization */
export interface LenisOptions {
  /** Duration of the scroll animation in seconds (default: 1.2) */
  duration?: number;
  /** Enable smooth wheel scrolling (default: true) */
  smoothWheel?: boolean;
  /** Mimic touch device scroll while allowing scroll sync (default: false) */
  syncTouch?: boolean;
  /** Touch multiplier for scroll sensitivity (default: 2) */
  touchMultiplier?: number;
  /** Easing function for the scroll animation */
  easing?: (t: number) => number;
}

/** Default Lenis configuration */
const DEFAULT_OPTIONS: LenisOptions = {
  duration: 1.2,
  smoothWheel: true,
  syncTouch: false,
  touchMultiplier: 2,
  // Smooth easing curve
  easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
};

/**
 * Initialize Lenis smooth scrolling
 *
 * Creates a single Lenis instance and starts the RAF loop.
 * Guards against server-side execution.
 *
 * @param options - Configuration options for Lenis
 * @returns The Lenis instance, or null if on server or already initialized
 */
export function initLenis(options: LenisOptions = {}): Lenis | null {
  // Guard: run only on client
  if (typeof window === 'undefined') {
    return null;
  }

  // Guard: don't reinitialize if already exists
  if (lenisInstance) {
    return lenisInstance;
  }

  // Merge options with defaults
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };

  try {
    // Create Lenis instance
    lenisInstance = new Lenis({
      duration: mergedOptions.duration,
      smoothWheel: mergedOptions.smoothWheel,
      syncTouch: mergedOptions.syncTouch,
      touchMultiplier: mergedOptions.touchMultiplier,
      easing: mergedOptions.easing,
    });

    // Expose instance at window.__lenis for cross-module detection
    window.__lenis = lenisInstance;

    // Start the RAF loop
    function raf(time: number) {
      if (lenisInstance) {
        lenisInstance.raf(time);
      }
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return lenisInstance;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to initialize Lenis:', error);
    return null;
  }
}

/**
 * Get the current Lenis instance
 *
 * Returns the in-memory singleton or window.__lenis when available.
 *
 * @returns The Lenis instance, or null if not initialized
 */
export function getLenis(): Lenis | null {
  if (lenisInstance) {
    return lenisInstance;
  }

  // Fallback: check window.__lenis in case it was set externally
  if (typeof window !== 'undefined' && window.__lenis) {
    return window.__lenis;
  }

  return null;
}

/**
 * Destroy the Lenis instance and clean up
 *
 * Cancels the RAF loop, removes window.__lenis, and nullifies the singleton.
 */
export function destroyLenis(): void {
  // Cancel RAF loop
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }

  // Destroy Lenis instance
  if (lenisInstance) {
    lenisInstance.destroy();
    lenisInstance = null;
  }

  // Clean up window reference
  if (typeof window !== 'undefined' && window.__lenis) {
    delete window.__lenis;
  }
}

/**
 * Check if user prefers reduced motion
 *
 * @returns true if user has requested reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
