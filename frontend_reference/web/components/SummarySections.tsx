/**
 * web/components/SummarySections.tsx
 * 
 * Parses AI summary content into sections and renders each as a styled card.
 * Supports multiple parsing heuristics: Markdown headers → Numbered sections → Fallback.
 * Expands time_windows[n] tokens and formats ISO datetimes within each section.
 * 
 * Features:
 * - Auto-sizing cards that grow with content
 * - Read more / Show less toggle for long content
 * - Sanitized markdown rendering
 * - Accessibility (ARIA labels, keyboard navigation)
 */

import React, { useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { sanitizeHtml } from '@/lib/sanitizeHtml';
import {
  cleanSummaryWithWindows,
  TimeWindow,
  expandTimeWindowTokens,
  formatIsoDatetimesInText,
  FormatOptions,
} from '@/lib/cleanSummaryWithWindows';
import { StructuredSummarySections } from '@/utils/selectSummarySource';

const markdownPlugins = [remarkGfm];

/** Default format options for time window formatting */
const defaultFormatOptions: FormatOptions = {
  useAmpm: true,
  slotMinutes: 90,
};

interface Section {
  title: string;
  html?: string;
  text?: string;
}

interface SummarySectionsProps {
  /** Sanitized HTML content (preferred for parsing) */
  html?: string | null;
  /** Plain text content (fallback) */
  text?: string | null;
  /** Optional time windows for token expansion */
  timeWindows?: TimeWindow[] | null;
  /** Pre-structured sections from AI summary (overall, health, money) */
  structured?: StructuredSummarySections | null;
}

/**
 * Parse text content into sections by Markdown headers (# Header).
 */
function parseMarkdownSections(text: string): Section[] | null {
  const lines = text.split('\n');
  const sections: Section[] = [];
  let currentTitle = '';
  let currentContent: string[] = [];

  const headerPattern = /^(#{1,6})\s+(.+)$/;

  lines.forEach((line) => {
    const match = line.match(headerPattern);
    
    if (match) {
      // Save previous section if exists
      if (currentTitle) {
        const contentText = currentContent.join('\n').trim();
        if (contentText) {
          sections.push({ title: currentTitle, text: contentText });
        }
      }
      
      // Start new section
      currentTitle = match[2].trim();
      currentContent = [];
    } else {
      currentContent.push(line);
    }
  });

  // Add last section
  if (currentTitle) {
    const contentText = currentContent.join('\n').trim();
    if (contentText) {
      sections.push({ title: currentTitle, text: contentText });
    }
  }

  return sections.length > 0 ? sections : null;
}

/**
 * Parse text content into sections by numbered patterns like:
 * "1) Overall Day Summary — ..." or "1. Health — ..."
 * Also handles format with dashed separator lines:
 * "1) Overall Day Summary\n------\nContent..."
 */
function parseNumberedSections(text: string): Section[] | null {
  // Match patterns like:
  // "1) Title — content" or "1. Title — content"
  // Allow hyphens in titles (e.g., "Well-being"), but use em-dash (—) or en-dash (–) as delimiter
  const emDashPattern = /^(\d+)[.)]\s*([^—–\n]+?)\s*[—–]\s*/;
  // Fallback pattern for single hyphen (with spacing to avoid matching compound words)
  const singleDashPattern = /^(\d+)[.)]\s*([^\n]+?)\s+-\s+/;
  // Pattern for numbered title followed by dashed line separator
  const numberedWithDashesPattern = /^(\d+)[.)]\s*([^\n]+)\s*\n[-–—]{3,}\s*\n/;
  
  // Split on newlines followed by numbered pattern
  const parts = text.split(/\n+(?=\d+[.)]\s)/);
  const sections: Section[] = [];

  parts.forEach((part) => {
    const trimmed = part.trim();
    if (!trimmed) return;

    // Try numbered title with dashed separator first
    let match = trimmed.match(numberedWithDashesPattern);
    if (match) {
      const title = match[2].trim();
      const content = trimmed.slice(match[0].length).trim();
      if (content) {
        sections.push({ title, text: content });
      }
      return;
    }

    // Try em-dash/en-dash pattern
    match = trimmed.match(emDashPattern);
    
    // If no match, try single hyphen pattern
    if (!match) {
      match = trimmed.match(singleDashPattern);
    }
    
    if (match) {
      const title = match[2].trim();
      // Remove the matched title pattern from content
      const content = trimmed.slice(match[0].length).trim();
      
      if (content) {
        sections.push({ title, text: content });
      }
    }
  });

  return sections.length > 0 ? sections : null;
}

/**
 * Fallback: create a single "Summary" section with all content.
 */
function createFallbackSection(text: string): Section[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  
  return [{ title: 'Summary', text: trimmed }];
}

/**
 * Parse content into sections using progressive heuristics.
 * If structured sections are provided, use them directly instead of parsing.
 */
function parseSections(
  html?: string | null, 
  text?: string | null,
  structured?: StructuredSummarySections | null
): Section[] {
  // If structured sections are provided, use them directly
  if (structured) {
    const sections: Section[] = [];
    
    // Map structured sections to display sections with appropriate titles and icons
    if (structured.overall && structured.overall.trim()) {
      sections.push({
        title: '📅 Overall Day Summary',
        text: structured.overall.trim(),
      });
    }
    
    if (structured.health && structured.health.trim()) {
      sections.push({
        title: '💚 Health & Well-being',
        text: structured.health.trim(),
      });
    }
    
    if (structured.money && structured.money.trim()) {
      sections.push({
        title: '💰 Money and Practical Affairs',
        text: structured.money.trim(),
      });
    }
    
    return sections;
  }
  
  // Convert HTML to text if provided
  const textContent = text || (html ? html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : '');
  
  if (!textContent) return [];

  // Try Markdown headers
  const markdownSections = parseMarkdownSections(textContent);
  if (markdownSections) return markdownSections;

  // Try numbered sections
  const numberedSections = parseNumberedSections(textContent);
  if (numberedSections) return numberedSections;

  // Fallback to single section
  return createFallbackSection(textContent);
}

/**
 * Expand tokens and format datetimes in HTML content.
 */
function processHtmlContent(
  html: string,
  timeWindows?: TimeWindow[] | null,
  options: FormatOptions = defaultFormatOptions
): string {
  let result = html;

  // Expand time_windows[n] tokens if present
  if (/time_windows\[\d+\]/i.test(result) && timeWindows) {
    result = expandTimeWindowTokens(result, timeWindows, options);
  }

  // Format ISO datetimes
  result = formatIsoDatetimesInText(result);

  return result;
}

/**
 * Single section card with Read more/Show less toggle.
 * Card auto-sizes to content with collapsible state for long content.
 */
function SectionCard({
  section,
  index,
  timeWindows,
}: {
  section: Section;
  index: number;
  timeWindows?: TimeWindow[] | null;
}): JSX.Element {
  // Track expanded state for this card
  const [isExpanded, setIsExpanded] = useState(false);

  // Process content based on type
  const { processedHtml, processedText } = useMemo(() => {
    let html: string | null = null;
    let text: string | null = null;

    if (section.html) {
      // Expand tokens and format in HTML
      const expanded = processHtmlContent(section.html, timeWindows, defaultFormatOptions);
      // Re-sanitize after token expansion
      html = sanitizeHtml(expanded);
    } else if (section.text) {
      // Clean and expand text content
      text = cleanSummaryWithWindows(section.text, timeWindows, defaultFormatOptions);
    }

    return { processedHtml: html, processedText: text };
  }, [section, timeWindows]);

  // Split content into paragraphs for preview/full display
  // Only use text content for splitting to avoid HTML parsing issues
  const paragraphs = useMemo(() => {
    // Always prefer text over HTML for preview generation
    const content = processedText || '';
    if (!content) return [];
    
    // Split by double newlines for text content
    const parts = content
      .split(/\n\n+/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
    return parts;
  }, [processedText]);

  // Show toggle only if content has multiple paragraphs or is long
  const showToggle = paragraphs.length > 2 || (paragraphs[0]?.length || 0) > 300;
  
  // Preview shows first paragraph or first 300 chars (text only, safe)
  const previewContent = useMemo(() => {
    if (!showToggle) return null;
    const firstPara = paragraphs[0] || '';
    return firstPara.length > 300 ? firstPara.substring(0, 300) + '...' : firstPara;
  }, [paragraphs, showToggle]);

  const toggleExpanded = () => {
    setIsExpanded((prev) => !prev);
  };

  // Handle keyboard accessibility
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleExpanded();
    }
  };

  return (
    <article 
      className="summary-section-card"
      style={{ 
        minHeight: 'auto',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div className="tw-card__header mb-3">
        <h3 className="tw-card__title text-lg font-bold text-amber-200">
          {section.title}
        </h3>
      </div>

      <div className="tw-card__content" style={{ flex: 1 }}>
        {/* Collapsed state with preview */}
        {!isExpanded && showToggle ? (
          <div className="relative">
            {/* Always use safe markdown rendering for preview (no HTML) */}
            <div className="prose prose-invert prose-sm max-w-none text-slate-200">
              <ReactMarkdown remarkPlugins={markdownPlugins}>
                {previewContent || ''}
              </ReactMarkdown>
            </div>
            {/* Fade overlay */}
            <div 
              className="absolute bottom-0 left-0 right-0 h-12 pointer-events-none"
              style={{
                background: 'linear-gradient(to bottom, transparent, rgba(15, 23, 42, 0.95))',
              }}
            />
          </div>
        ) : (
          // Expanded state or no toggle needed - render full content
          <div>
            {processedHtml ? (
              <div 
                className="not-prose text-slate-200 leading-relaxed" 
                dangerouslySetInnerHTML={{ __html: processedHtml }} 
              />
            ) : processedText ? (
              <div className="prose prose-invert prose-sm max-w-none text-slate-200">
                <ReactMarkdown remarkPlugins={markdownPlugins}>
                  {processedText}
                </ReactMarkdown>
              </div>
            ) : null}
          </div>
        )}

        {/* Read more / Show less button */}
        {showToggle && (
          <button
            onClick={toggleExpanded}
            onKeyDown={handleKeyDown}
            aria-expanded={isExpanded}
            aria-label={isExpanded ? 'Show less' : 'Read more'}
            className="mt-3 text-sm text-amber-400 hover:text-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-slate-900 rounded px-2 py-1 transition-colors"
            style={{ cursor: 'pointer' }}
          >
            {isExpanded ? '← Show less' : 'Read more →'}
          </button>
        )}
      </div>
    </article>
  );
}

export default function SummarySections({
  html,
  text,
  timeWindows,
  structured,
}: SummarySectionsProps): JSX.Element | null {
  const sections = useMemo(() => {
    return parseSections(html, text, structured);
  }, [html, text, structured]);

  if (sections.length === 0) {
    return null;
  }

  return (
    <div 
      className="summary-sections space-y-6"
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '1.5rem',
        alignItems: 'start', // Prevents cards from stretching to equal heights
      }}
    >
      {sections.map((section, idx) => (
        <SectionCard
          key={idx}
          section={section}
          index={idx}
          timeWindows={timeWindows}
        />
      ))}
    </div>
  );
}
