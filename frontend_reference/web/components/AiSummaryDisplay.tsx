// web/components/AiSummaryDisplay.tsx
import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { sanitizeHtml } from '@/lib/sanitizeHtml';
import {
  cleanSummaryWithWindows,
  TimeWindow,
  expandTimeWindowTokens,
  FormatOptions,
  formatIsoDatetimesInText,
  stripDebugBlocks,
  normalizeTimeWindow,
  getCategoryVariant,
  mapVariantToSeverity,
  getScoreVariant,
  getScoreText,
} from '@/lib/cleanSummaryWithWindows';
import { dedupeSummary } from '@/lib/dedupeSummary';
import SummarySections from '@/components/SummarySections';

const markdownPlugins = [remarkGfm];

/** Default format options for time window formatting */
const defaultFormatOptions: FormatOptions = {
  useAmpm: true,
  slotMinutes: 90,
};

/**
 * Check if HTML content contains time_windows[n] tokens that need expansion
 */
function containsTimeWindowTokens(html: string): boolean {
  return /time_windows\[\d+\]/i.test(html);
}

/**
 * Expand time_windows[n] tokens in HTML content and format any ISO datetimes.
 * Returns the HTML with tokens replaced by human-readable strings and ISO times formatted as AM/PM.
 */
function expandHtmlTimeWindowTokens(
  html: string,
  windows: TimeWindow[] | null | undefined,
  options: FormatOptions = defaultFormatOptions
): string {
  if (!html) return '';

  let result = html;

  // Check if there are tokens to expand
  if (containsTimeWindowTokens(html)) {
    // If no windows data available, log a debug message
    if (!windows || !Array.isArray(windows) || windows.length === 0) {
      if (typeof window !== 'undefined') {
        // eslint-disable-next-line no-console
        console.debug('[AiSummaryDisplay] HTML contains time_windows[n] tokens but no time_windows data provided');
      }
    } else {
      // Use the shared expandTimeWindowTokens function
      result = expandTimeWindowTokens(result, windows, options);
    }
  }

  // Format any remaining ISO datetime strings to AM/PM format
  result = formatIsoDatetimesInText(result);

  return result;
}

/**
 * Extract only the summary section from sanitized HTML.
 * This is a defensive frontend guard to ensure only the "Today's Prediction" summary
 * is displayed, preventing Radar, Time Windows, Sources, etc. from rendering.
 * 
 * @param html - Sanitized HTML string
 * @returns HTML content of the summary section only, or fallback content
 */
function extractSummaryOnlyHtml(html: string): string | null {
  if (!html || typeof window === 'undefined') return null;

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Strategy 1: Look for <section data-segment="summary">
    const summarySection = doc.querySelector('section[data-segment="summary"]');
    if (summarySection && summarySection.innerHTML.trim()) {
      return summarySection.innerHTML.trim();
    }
    
    // Strategy 2: Look for <div data-segment="summary">
    const summaryDiv = doc.querySelector('div[data-segment="summary"]');
    if (summaryDiv && summaryDiv.innerHTML.trim()) {
      return summaryDiv.innerHTML.trim();
    }
    
    // Strategy 3: Fallback to first <p> element if no summary section found
    const firstParagraph = doc.querySelector('p');
    if (firstParagraph && firstParagraph.textContent?.trim()) {
      return firstParagraph.outerHTML;
    }
    
    return null;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[AiSummaryDisplay] extractSummaryOnlyHtml failed', err);
    return null;
  }
}

type AiSummaryDisplayProps = {
  /** Plain text summary (fallback when html is not provided) */
  summary?: string;
  /** HTML content (preferred over summary when provided, will be sanitized) */
  html?: string;
  updatedAt?: string | null;
  loading?: boolean;
  error?: string | null;
  /** Optional time windows for expanding time_windows[n] tokens */
  timeWindows?: TimeWindow[] | null;
  /** Optional variant for styling (default: with background, 'hero': no background) */
  variant?: 'default' | 'hero';
};

export default function AiSummaryDisplay({
  summary = '',
  html,
  updatedAt,
  loading = false,
  error = null,
  timeWindows,
  variant = 'default',
}: AiSummaryDisplayProps) {
  const devHtmlEnabled = process.env.NEXT_PUBLIC_DEV_HTML_VIEW === 'true';
  const normalizedWindows = useMemo(
    () =>
      (timeWindows ?? [])
        .filter(Boolean)
        .map((tw, idx) => normalizeTimeWindow(tw as TimeWindow, idx)) ?? [],
    [timeWindows]
  );
  const hasWindows = normalizedWindows.length > 0;

  // Sanitize HTML content using shared sanitization utility
  // (server already sanitizes, but defense-in-depth is good practice)
  // Also expand time_windows[n] tokens in HTML if present
  const sanitizedHtml = useMemo(() => {
    // Keep raw for debug; sanitizeHtml will return '' for falsy or failure.
    const sanitized = sanitizeHtml(html) || null;

    if (!sanitized) return null;

    // Defense-in-depth: Extract only the summary section from the sanitized HTML.
    // This ensures that even if the server returns multi-section HTML (Radar, Time Windows,
    // Sources, etc.), only the summary paragraph is displayed on the daily page.
    const summaryOnly = extractSummaryOnlyHtml(sanitized);
    const htmlToExpand = stripDebugBlocks(summaryOnly || sanitized);

    // Expand time_windows tokens if windows data is available
    return expandHtmlTimeWindowTokens(htmlToExpand, normalizedWindows, defaultFormatOptions);
  }, [html, normalizedWindows]);

  // Clean and expand the summary with time windows (for markdown fallback)
  const cleanedSummary = useMemo(() => {
    const summarySource = summary || stripDebugBlocks(html?.replace(/<[^>]+>/g, ' ') || '');
    const expanded = cleanSummaryWithWindows(summarySource, normalizedWindows, defaultFormatOptions);
    return dedupeSummary(expanded, {
      mode: 'consecutive',
      similarityThreshold: 0.9,
    });
  }, [summary, normalizedWindows, html]);

  const renderWindowCard = (tw: ReturnType<typeof normalizeTimeWindow>) => {
    const severity = mapVariantToSeverity(tw.severity, getCategoryVariant(tw.category, tw.score));
    const scoreVariant = tw.scoreVariant ?? getScoreVariant(tw.score);
    const scoreText = tw.scoreText ?? getScoreText(tw.score);
    const startDisplay = tw.startDisplay || '--:--';
    const endDisplay = tw.endDisplay || '--:--';
    const category = tw.category ?? tw.type ?? '';
    const variant = getCategoryVariant(category || undefined, tw.score ?? undefined);
    const factsHtml = sanitizeHtml(tw.facts_html) || '';
    const interpretationHtml = sanitizeHtml(tw.interpretation_html) || '';

    return (
      <article
        key={tw.index ?? tw.name}
        className={`tw-card mv-severity--${severity}`}
        data-severity={severity}
        aria-label={`Time Window: ${tw.name}`}
      >
        <div className="tw-card__header">
          <div>
            <p className="time-window-card__label">Time Window</p>
            <h4 className="tw-card__title">{tw.name}</h4>
            <p className="tw-card__time" aria-label={`Time range ${startDisplay} to ${endDisplay}`}>
              {`${startDisplay} → ${endDisplay}`}
            </p>
          </div>
          {category && <span className={`tw-card__category tw-card__category--${variant}`}>{category}</span>}
        </div>

        {tw.short_desc && (
          <div className="tw-card__summary">
            <p>{stripDebugBlocks(String(tw.short_desc))}</p>
          </div>
        )}

        {(factsHtml || interpretationHtml) && (
          <div className="time-window-card__details">
            {factsHtml && (
              <details className="time-window-card__detail">
                <summary>Facts</summary>
                <div dangerouslySetInnerHTML={{ __html: factsHtml }} />
              </details>
            )}
            {interpretationHtml && (
              <details className="time-window-card__detail">
                <summary>Interpretation</summary>
                <div dangerouslySetInnerHTML={{ __html: interpretationHtml }} />
              </details>
            )}
          </div>
        )}

        <div className="tw-card__meta">
          <span className={`mv-score mv-score--${scoreVariant} mv-severity--${severity}`}>{scoreText}</span>
          {tw.pakshi_day && (
            <span className={`mv-pakshi-badge mv-pakshi--${severity}`} aria-label={`Day pakshi: ${tw.pakshi_day}`}>
              Day: {tw.pakshi_day}
            </span>
          )}
          {tw.pakshi_night && (
            <span className={`mv-pakshi-badge mv-pakshi--${severity}`} aria-label={`Night pakshi: ${tw.pakshi_night}`}>
              Night: {tw.pakshi_night}
            </span>
          )}
        </div>
      </article>
    );
  };

  const containerClasses = variant === 'hero'
    ? 'rounded-3xl border border-neon-cyan/30 p-6'
    : 'rounded-lg border border-slate-700 bg-slate-800/50 p-6';

  if (loading) {
    return (
      <div className={containerClasses}>
        <div className="flex items-center space-x-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-transparent"></div>
          <p className="text-sm text-slate-300">Loading AI summary...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={containerClasses}>
        <p className="text-sm text-slate-400">{error}</p>
      </div>
    );
  }

  // If no content available
  if (!sanitizedHtml && !cleanedSummary && !hasWindows) {
    return null;
  }

  return (
    <div className={containerClasses}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-100">AI Summary</h3>
        {updatedAt && (
          <p className="text-xs text-slate-400">
            Updated: {new Date(updatedAt).toLocaleDateString()}
          </p>
        )}
      </div>
      {hasWindows ? (
        <>
          {cleanedSummary && (
            <div className="prose prose-invert prose-sm max-w-none mb-4">
              <ReactMarkdown remarkPlugins={markdownPlugins}>{cleanedSummary}</ReactMarkdown>
            </div>
          )}
          <div className="tw-cards-grid">
            {normalizedWindows.map((tw) => renderWindowCard(tw))}
          </div>
          {devHtmlEnabled && sanitizedHtml && (
            <details className="mt-4 text-xs text-slate-400">
              <summary className="cursor-pointer">Developer view: raw HTML</summary>
              <div className="not-prose mt-2" dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />
            </details>
          )}
        </>
      ) : sanitizedHtml || cleanedSummary ? (
        // Render sections using SummarySections component
        <SummarySections html={sanitizedHtml} text={cleanedSummary} timeWindows={normalizedWindows} />
      ) : null}
    </div>
  );
}
