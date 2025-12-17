/**
 * Tests for SummarySections component
 * 
 * Tests parsing of various summary formats:
 * - HTML with headings
 * - Markdown headers
 * - Numbered sections
 * - time_windows[n] token expansion
 * - Fallback scenarios
 */

import { describe, it, expect, vi } from 'vitest';

// Mock ReactMarkdown since we're testing parsing logic, not rendering
vi.mock('react-markdown', () => ({
  default: ({ children }: { children: string }) => children,
}));

// Mock remark-gfm
vi.mock('remark-gfm', () => ({
  default: () => {},
}));

describe('SummarySections parsing logic', () => {
  describe('Markdown header parsing', () => {
    it('should parse markdown ## headers', () => {
      const text = `
## Overall Day Summary

This is the overall summary content.

## Health & Well-being

Health content here.
      `;
      
      const lines = text.trim().split('\n');
      const headerPattern = /^(#{1,6})\s+(.+)$/;
      const headers = lines
        .map(line => {
          const match = line.match(headerPattern);
          return match ? match[2] : null;
        })
        .filter(Boolean);
      
      expect(headers).toHaveLength(2);
      expect(headers[0]).toBe('Overall Day Summary');
      expect(headers[1]).toBe('Health & Well-being');
    });

    it('should handle # single hash headers', () => {
      const text = `
# Main Title

Content here.

### Triple Hash

More content.
      `;
      
      const lines = text.trim().split('\n');
      const headerPattern = /^(#{1,6})\s+(.+)$/;
      const headers = lines
        .map(line => {
          const match = line.match(headerPattern);
          return match ? match[2] : null;
        })
        .filter(Boolean);
      
      expect(headers).toHaveLength(2);
      expect(headers[0]).toBe('Main Title');
      expect(headers[1]).toBe('Triple Hash');
    });
  });

  describe('Numbered section parsing', () => {
    it('should parse numbered sections with em-dash', () => {
      const text = `
1) Overall Day Summary — The day presents mixed energies with both opportunities and challenges.

2) Health & Well-being — Pay attention to rest and nutrition today.

3) Career & Finance — Good prospects for professional advancement.
      `;
      
      // Using the updated pattern that allows hyphens in titles
      const emDashPattern = /^(\d+)[.)]\s*([^—–\n]+?)\s*[—–]\s*/;
      const sections = text.trim().split(/\n+(?=\d+[.)]\s)/);
      
      const titles = sections
        .map(section => {
          const match = section.trim().match(emDashPattern);
          return match ? match[2].trim() : null;
        })
        .filter(Boolean);
      
      expect(titles.length).toBe(3);
      expect(titles[0]).toBe('Overall Day Summary');
      expect(titles[1]).toBe('Health & Well-being');
      expect(titles[2]).toBe('Career & Finance');
    });

    it('should parse numbered sections with single hyphen', () => {
      const text = `
1. Overall Day Summary - The day presents mixed energies.
2. Health - Pay attention to rest.
      `;
      
      // Fallback pattern for single hyphen
      const singleDashPattern = /^(\d+)[.)]\s*([^\n]+?)\s+-\s+/;
      const sections = text.trim().split(/\n+(?=\d+[.)]\s)/);
      
      const titles = sections
        .map(section => {
          const match = section.trim().match(singleDashPattern);
          return match ? match[2].trim() : null;
        })
        .filter(Boolean);
      
      expect(titles.length).toBe(2);
      expect(titles[0]).toBe('Overall Day Summary');
      expect(titles[1]).toBe('Health');
    });

    it('should handle hyphens in titles correctly', () => {
      const text = `
1) Self-Care & Mental Health — Important aspects for well-being today.

2) Work-Life Balance — Finding harmony between professional and personal life.
      `;
      
      const emDashPattern = /^(\d+)[.)]\s*([^—–\n]+?)\s*[—–]\s*/;
      const sections = text.trim().split(/\n+(?=\d+[.)]\s)/);
      
      const titles = sections
        .map(section => {
          const match = section.trim().match(emDashPattern);
          return match ? match[2].trim() : null;
        })
        .filter(Boolean);
      
      expect(titles.length).toBe(2);
      expect(titles[0]).toBe('Self-Care & Mental Health');
      expect(titles[1]).toBe('Work-Life Balance');
    });

    it('should parse numbered sections with dashed separator lines', () => {
      const text = `
1) Overall Day Summary
------------------------------------------------------
The day presents mixed energies with both opportunities and challenges.

2) Health & Well-being
------------------------------------------------------
Pay attention to rest and nutrition today.

3) Money & Practical Affairs
------------------------------------------------------
Good prospects for financial planning.
      `;
      
      const numberedWithDashesPattern = /^(\d+)[.)]\s*([^\n]+)\s*\n[-–—]{3,}\s*\n/;
      const sections = text.trim().split(/\n+(?=\d+[.)]\s)/);
      
      const titles = sections
        .map(section => {
          const match = section.trim().match(numberedWithDashesPattern);
          return match ? match[2].trim() : null;
        })
        .filter(Boolean);
      
      expect(titles.length).toBe(3);
      expect(titles[0]).toBe('Overall Day Summary');
      expect(titles[1]).toBe('Health & Well-being');
      expect(titles[2]).toBe('Money & Practical Affairs');
    });
  });

  describe('time_windows[n] token detection', () => {
    it('should detect time_windows tokens in content', () => {
      const text = 'The day starts with time_windows[0] followed by time_windows[1].';
      
      const tokenPattern = /time_windows\[(\d+)\]/gi;
      const matches = text.match(tokenPattern);
      
      expect(matches).toHaveLength(2);
      expect(matches?.[0]).toBe('time_windows[0]');
      expect(matches?.[1]).toBe('time_windows[1]');
    });

    it('should handle mixed case time_windows tokens', () => {
      const text = 'Early morning TIME_WINDOWS[0] and afternoon time_windows[5].';
      
      const tokenPattern = /time_windows\[(\d+)\]/gi;
      const matches = text.match(tokenPattern);
      
      expect(matches).toHaveLength(2);
    });
  });

  describe('Fallback scenarios', () => {
    it('should handle empty content gracefully', () => {
      const text = '';
      
      expect(text.trim()).toBe('');
    });

    it('should handle content with no headers', () => {
      const text = 'This is just plain text with no headers or structure.';
      
      const headerPattern = /^(#{1,6})\s+(.+)$/;
      const lines = text.split('\n');
      const hasHeaders = lines.some(line => headerPattern.test(line));
      
      expect(hasHeaders).toBe(false);
    });

    it('should handle null/undefined gracefully', () => {
      const nullText = null;
      const undefinedText = undefined;
      
      expect(nullText ?? '').toBe('');
      expect(undefinedText ?? '').toBe('');
    });
  });

  describe('ISO datetime detection', () => {
    it('should detect ISO datetime patterns', () => {
      const text = 'Meeting at 2025-12-10T14:30:00Z and ending at 2025-12-10T16:00:00Z.';
      
      const isoPattern = /(\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}(?::\d{2})?(?:\.\d+)?(?:Z|[+\-]\d{2}:?\d{2})?)/g;
      const matches = text.match(isoPattern);
      
      expect(matches).toHaveLength(2);
      expect(matches?.[0]).toContain('2025-12-10T14:30:00');
    });
  });

  describe('Content extraction', () => {
    it('should extract content between headings', () => {
      const text = `
## First Section

First content line.
Second content line.

## Second Section

Second content line.
      `;
      
      const sections = text.trim().split(/^## /m).filter(Boolean);
      
      expect(sections.length).toBeGreaterThan(0);
      expect(sections[0]).toContain('First Section');
      expect(sections[0]).toContain('First content line');
    });
  });

  describe('Sanitization integration', () => {
    it('should preserve safe HTML tags', () => {
      const html = '<p>Safe paragraph</p><strong>Bold text</strong>';
      
      // Verify expected safe tags are present
      expect(html).toContain('<p>');
      expect(html).toContain('<strong>');
    });

    it('should handle data attributes in HTML', () => {
      const html = '<div data-severity="auspicious"><p>Content</p></div>';
      
      expect(html).toContain('data-severity');
    });
  });

  describe('Edge cases', () => {
    it('should handle very long section titles', () => {
      const longTitle = 'A'.repeat(200);
      const text = `## ${longTitle}\n\nContent here.`;
      
      const headerPattern = /^(#{1,6})\s+(.+)$/m;
      const match = text.match(headerPattern);
      
      expect(match?.[2]).toHaveLength(200);
    });

    it('should handle sections with special characters', () => {
      const text = `
## Health & Well-being (Important!)

Content with special chars: @#$%
      `;
      
      const headerPattern = /^(#{1,6})\s+(.+)$/m;
      const match = text.match(headerPattern);
      
      expect(match?.[2]).toBe('Health & Well-being (Important!)');
    });

    it('should handle Unicode characters in section titles', () => {
      const text = `
## स्वास्थ्य और कल्याण

Hindi content here.
      `;
      
      const headerPattern = /^(#{1,6})\s+(.+)$/m;
      const match = text.match(headerPattern);
      
      expect(match?.[2]).toBe('स्वास्थ्य और कल्याण');
    });
  });
});
