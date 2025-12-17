/**
 * TimeWindowsHelp - A help modal component for displaying time windows information
 * 
 * Provides contextual help explaining Daily Time Windows with support for:
 * - Multiple range representations (string, array, start/end pairs)
 * - Engine-provided HTML fragments (sanitized)
 * - Accessible modal with focus management
 */
import React, { useState, useCallback, useRef, useEffect } from 'react';
import DOMPurify from 'dompurify';

/**
 * Extended TimeWindow interface supporting multiple range formats and engine HTML.
 * 
 * Note: This extends the base TimeWindow from @/lib/cleanSummaryWithWindows with
 * additional fields (key, title, range, ranges, time_ranges, note, source, html)
 * that are provided by the daily engine for the help UI. We define a separate
 * interface here to avoid coupling the base type to help-specific fields.
 */
export interface TimeWindow {
  key?: string;
  title?: string;
  label?: string;
  name?: string;
  category?: string;
  start?: string | number;
  end?: string | number;
  start_iso?: string;
  end_iso?: string;
  start_display?: string;
  end_display?: string;
  range?: string | (string | { start?: string; end?: string; note?: string })[];
  ranges?: (string | { start?: string; end?: string; note?: string })[];
  time_ranges?: (string | { start?: string; end?: string; note?: string })[];
  note?: string;
  source?: string;
  html?: string;
  impact?: string;
  description?: string;
  drivers?: string[];
}

interface TimeWindowsHelpProps {
  timeWindows: TimeWindow[] | null;
}

/**
 * Normalize time ranges from various formats to a consistent array of strings
 */
export function normalizeRanges(window: TimeWindow): string[] {
  const results: string[] = [];
  
  // Try range field first
  if (window.range) {
    if (typeof window.range === 'string') {
      // Split on common delimiters
      const parts = window.range.split(/\|\||\n/).map(s => s.trim()).filter(Boolean);
      results.push(...parts);
    } else if (Array.isArray(window.range)) {
      for (const item of window.range) {
        if (typeof item === 'string') {
          results.push(item);
        } else if (item && typeof item === 'object') {
          const rangeStr = formatRangeObject(item);
          if (rangeStr) results.push(rangeStr);
        }
      }
    }
  }
  
  // Try ranges field
  if (window.ranges && Array.isArray(window.ranges)) {
    for (const item of window.ranges) {
      if (typeof item === 'string') {
        results.push(item);
      } else if (item && typeof item === 'object') {
        const rangeStr = formatRangeObject(item);
        if (rangeStr) results.push(rangeStr);
      }
    }
  }
  
  // Try time_ranges field
  if (window.time_ranges && Array.isArray(window.time_ranges)) {
    for (const item of window.time_ranges) {
      if (typeof item === 'string') {
        results.push(item);
      } else if (item && typeof item === 'object') {
        const rangeStr = formatRangeObject(item);
        if (rangeStr) results.push(rangeStr);
      }
    }
  }
  
  // Fall back to start/end pair if no ranges found
  if (results.length === 0) {
    // Prefer display fields from backend
    if (window.start_display && window.end_display) {
      results.push(`${window.start_display} – ${window.end_display}`);
    } else if (window.start || window.end) {
      const startTime = formatTimeString(window.start);
      const endTime = formatTimeString(window.end);
      if (startTime || endTime) {
        results.push(`${startTime || '?'} – ${endTime || '?'}`);
      }
    }
  }
  
  return results;
}

/**
 * Format a range object { start, end, note } to a string
 */
function formatRangeObject(obj: { start?: string; end?: string; note?: string }): string | null {
  const startTime = formatTimeString(obj.start);
  const endTime = formatTimeString(obj.end);
  
  if (!startTime && !endTime) return null;
  
  let result = `${startTime || '?'} – ${endTime || '?'}`;
  if (obj.note) {
    result += ` (${obj.note})`;
  }
  return result;
}

/**
 * Format a datetime string to localized short time.
 * Handles ISO datetimes, HH:MM, and H:MM AM/PM formats.
 */
function formatTimeString(dateTimeStr: string | number | undefined): string | null {
  if (dateTimeStr === undefined || dateTimeStr === null) return null;
  
  // Handle numeric slot index - just return null as this helper is for display
  if (typeof dateTimeStr === 'number') return null;
  
  const str = String(dateTimeStr).trim();
  if (!str) return null;
  
  // First try as ISO datetime
  try {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      return d.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    }
  } catch {
    // Fall through
  }
  
  // Try as HH:MM (24-hour format)
  const hhmmMatch = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(str);
  if (hhmmMatch) {
    const hours = parseInt(hhmmMatch[1], 10);
    const minutes = parseInt(hhmmMatch[2], 10);
    if (hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60) {
      const period = hours >= 12 ? 'PM' : 'AM';
      const hours12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
      return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
    }
  }
  
  // Try as H:MM AM/PM (12-hour format)
  const ampmMatch = /^(\d{1,2}):(\d{2})\s*([AaPp][Mm])$/i.exec(str);
  if (ampmMatch) {
    const hours = parseInt(ampmMatch[1], 10);
    const minutes = parseInt(ampmMatch[2], 10);
    const meridiem = ampmMatch[3].toUpperCase();
    if (hours >= 1 && hours <= 12 && minutes >= 0 && minutes < 60) {
      return `${hours}:${minutes.toString().padStart(2, '0')} ${meridiem}`;
    }
  }
  
  return null;
}

/**
 * Get display title for a window with fallback chain
 */
function getWindowTitle(window: TimeWindow, index: number): string {
  return window.title || window.label || window.name || window.category || `Window ${index + 1}`;
}

/**
 * Sanitize HTML content using DOMPurify with safe attribute allowlist
 */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 'ul', 'ol', 'li', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'time', 'span', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a'],
    ALLOWED_ATTR: ['class', 'datetime', 'href', 'title', 'aria-label'],
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed'],
    FORBID_ATTR: ['onclick', 'onerror', 'onload', 'onmouseover', 'onfocus', 'onblur'],
  });
}

/**
 * TimeWindowsHelp Component
 * 
 * Renders a help button that opens an accessible modal dialog
 * explaining time windows from the daily prediction engine.
 */
export default function TimeWindowsHelp({ timeWindows }: TimeWindowsHelpProps): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const openModal = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    // Return focus to the help button when closing
    buttonRef.current?.focus();
  }, []);

  // Handle keyboard events for accessibility
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeModal();
      } else if (e.key === 'Tab') {
        // Trap focus within modal
        const focusableElements = modalRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"]), summary, [contenteditable="true"]'
        );
        if (!focusableElements || focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    // Focus first focusable element when modal opens
    closeButtonRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, closeModal]);

  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closeModal();
    }
  }, [closeModal]);

  const hasWindows = Array.isArray(timeWindows) && timeWindows.length > 0;

  return (
    <>
      {/* Help Button */}
      <button
        ref={buttonRef}
        onClick={openModal}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border border-slate-600 bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 hover:text-slate-100 hover:border-slate-500 transition-colors focus:outline-none focus:ring-2 focus:ring-accent/50"
        aria-label="Open time windows help"
        type="button"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        Time windows help
      </button>

      {/* Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={handleOverlayClick}
          role="dialog"
          aria-modal="true"
          aria-labelledby="time-windows-help-title"
        >
          <div
            ref={modalRef}
            className="bg-slate-900 border border-slate-700 rounded-lg shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h2
                id="time-windows-help-title"
                className="text-lg font-semibold text-[#D4AF37]"
              >
                Time Windows Help
              </h2>
              <button
                ref={closeButtonRef}
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-200 transition-colors p-1 rounded focus:outline-none focus:ring-2 focus:ring-accent/50"
                aria-label="Close help modal"
                type="button"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4">
              <p className="text-slate-300 text-sm mb-4">
                Time windows represent specific periods during the day that may be favorable, neutral, or should be approached with caution based on astrological calculations.
              </p>

              {!hasWindows ? (
                <div className="text-center py-8 text-slate-400">
                  <svg
                    className="w-12 h-12 mx-auto mb-3 opacity-50"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p>No time windows available for today.</p>
                  <p className="text-xs mt-1 text-slate-500">
                    Time windows will appear when daily prediction data is loaded.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {timeWindows.map((window, idx) => {
                    const titleId = `window-title-${idx}`;
                    const title = getWindowTitle(window, idx);
                    const ranges = normalizeRanges(window);
                    const severity =
                      (window as any).severity === 'auspicious' || (window as any).severity === 'inauspicious'
                        ? (window as any).severity
                        : undefined;
                    const severityClass = severity ? `mv-${severity}` : 'mv-neutral';

                    return (
                      <div
                        key={window.key || idx}
                        role="group"
                        aria-labelledby={titleId}
                        className={`rounded-lg border bg-slate-800/50 p-4 ${severityClass}`}
                        data-severity={severity ?? 'neutral'}
                      >
                        {/* Window Title */}
                        <h3
                          id={titleId}
                          className="font-semibold text-slate-100 mb-2"
                        >
                          {title}
                        </h3>
                        {severity && (
                          <span className={`mv-pakshi-badge mv-pakshi--${severity} mb-2 inline-flex`}>
                            {severity === 'auspicious' ? 'Auspicious' : 'Inauspicious'}
                          </span>
                        )}

                        {/* Ranges */}
                        {ranges.length > 0 && (
                          <div className="mb-2">
                            <span className="text-xs text-slate-400 uppercase tracking-wide">Time Range{ranges.length > 1 ? 's' : ''}</span>
                            <ul className="mt-1 space-y-0.5">
                              {ranges.map((rangeStr, rIdx) => (
                                <li key={rIdx} className="text-sm text-slate-300 flex items-center gap-2">
                                  <span className="mv-time-range">{rangeStr}</span>
                                  {(window as any).pakshi_day && (
                                    <span className={`mv-pakshi-badge mv-pakshi--${severity ?? 'neutral'}`}>
                                      Day: {(window as any).pakshi_day}
                                    </span>
                                  )}
                                  {(window as any).pakshi_night && (
                                    <span className={`mv-pakshi-badge mv-pakshi--${severity ?? 'neutral'}`}>
                                      Night: {(window as any).pakshi_night}
                                    </span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Source */}
                        {window.source && (
                          <p className="text-xs text-slate-400 mb-1">
                            <span className="font-medium">Source:</span> {window.source}
                          </p>
                        )}

                        {/* Note */}
                        {window.note && (
                          <p className="text-sm text-slate-300 mb-2">
                            <span className="text-xs text-slate-400 font-medium">Note:</span>{' '}
                            {window.note}
                          </p>
                        )}

                        {/* Drivers */}
                        {Array.isArray(window.drivers) && window.drivers.length > 0 && (
                          <p className="text-xs text-slate-400 mb-1">
                            <span className="font-medium">Drivers:</span> {window.drivers.join(', ')}
                          </p>
                        )}

                        {/* Impact Badge */}
                        {window.impact && (
                          <span
                            className={`inline-block text-xs px-2 py-0.5 rounded mb-2 ${
                              window.impact === 'favorable'
                                ? 'bg-green-900/50 text-green-300'
                                : window.impact === 'avoid risk'
                                ? 'bg-red-900/50 text-red-300'
                                : 'bg-slate-700/50 text-slate-300'
                            }`}
                          >
                            {window.impact}
                          </span>
                        )}

                        {/* Description */}
                        {window.description && (
                          <p className="text-sm text-slate-300 mt-2">
                            {window.description}
                          </p>
                        )}

                        {/* Engine-provided HTML (sanitized) */}
                        {window.html && (
                          <div
                            className="mt-2 text-sm text-slate-300 prose prose-invert prose-sm max-w-none"
                            dangerouslySetInnerHTML={{
                              __html: sanitizeHtml(window.html),
                            }}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end p-4 border-t border-slate-700">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-sm font-medium rounded-md bg-accent/20 text-accent border border-accent/40 hover:bg-accent/30 transition-colors focus:outline-none focus:ring-2 focus:ring-accent/50"
                type="button"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
