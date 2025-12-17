import { describe, it, expect, vi, beforeEach } from 'vitest';
import { normalizeRanges, TimeWindow } from '@/components/TimeWindowsHelp';

// Mock DOMPurify for node environment - DOMPurify requires a DOM
vi.mock('dompurify', () => ({
  default: {
    sanitize: (html: string, options?: Record<string, unknown>) => {
      // Simple mock that strips script tags and event handlers
      if (!html) return '';
      let result = html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
        .replace(/<iframe\b[^>]*>.*?<\/iframe>/gi, '')
        .replace(/\s*on\w+\s*=\s*"[^"]*"/gi, '')
        .replace(/\s*on\w+\s*=\s*'[^']*'/gi, '')
        .replace(/href\s*=\s*"javascript:[^"]*"/gi, '')
        .replace(/href\s*=\s*'javascript:[^']*'/gi, '');
      return result;
    },
  },
}));

// Import sanitizeHtml after mocking DOMPurify
import { sanitizeHtml } from '@/components/TimeWindowsHelp';

describe('TimeWindowsHelp', () => {
  describe('normalizeRanges', () => {
    it('returns empty array for window with no range data', () => {
      const window: TimeWindow = { label: 'Empty Window' };
      expect(normalizeRanges(window)).toEqual([]);
    });

    it('normalizes string range by splitting on || delimiter', () => {
      const window: TimeWindow = {
        range: '9:00 AM – 10:00 AM || 2:00 PM – 3:00 PM',
      };
      const result = normalizeRanges(window);
      expect(result).toHaveLength(2);
      expect(result[0]).toBe('9:00 AM – 10:00 AM');
      expect(result[1]).toBe('2:00 PM – 3:00 PM');
    });

    it('normalizes string range by splitting on newline delimiter', () => {
      const window: TimeWindow = {
        range: '9:00 AM – 10:00 AM\n2:00 PM – 3:00 PM',
      };
      const result = normalizeRanges(window);
      expect(result).toHaveLength(2);
      expect(result[0]).toBe('9:00 AM – 10:00 AM');
      expect(result[1]).toBe('2:00 PM – 3:00 PM');
    });

    it('normalizes array of string ranges', () => {
      const window: TimeWindow = {
        range: ['9:00 AM – 10:00 AM', '2:00 PM – 3:00 PM'],
      };
      const result = normalizeRanges(window);
      expect(result).toHaveLength(2);
      expect(result).toEqual(['9:00 AM – 10:00 AM', '2:00 PM – 3:00 PM']);
    });

    it('normalizes array of range objects with start/end', () => {
      const window: TimeWindow = {
        range: [
          { start: '2025-11-21T09:00:00+05:30', end: '2025-11-21T10:00:00+05:30' },
          { start: '2025-11-21T14:00:00+05:30', end: '2025-11-21T15:00:00+05:30' },
        ],
      };
      const result = normalizeRanges(window);
      expect(result).toHaveLength(2);
      // Should contain formatted times
      expect(result[0]).toMatch(/\d{1,2}:\d{2}\s*(AM|PM)\s*–\s*\d{1,2}:\d{2}\s*(AM|PM)/i);
      expect(result[1]).toMatch(/\d{1,2}:\d{2}\s*(AM|PM)\s*–\s*\d{1,2}:\d{2}\s*(AM|PM)/i);
    });

    it('normalizes range object with note', () => {
      const window: TimeWindow = {
        range: [
          { start: '2025-11-21T09:00:00+05:30', end: '2025-11-21T10:00:00+05:30', note: 'Avoid travel' },
        ],
      };
      const result = normalizeRanges(window);
      expect(result).toHaveLength(1);
      expect(result[0]).toContain('(Avoid travel)');
    });

    it('normalizes ranges field (array of strings)', () => {
      const window: TimeWindow = {
        ranges: ['Morning', 'Afternoon'],
      };
      const result = normalizeRanges(window);
      expect(result).toEqual(['Morning', 'Afternoon']);
    });

    it('normalizes time_ranges field', () => {
      const window: TimeWindow = {
        time_ranges: ['9 AM - 10 AM'],
      };
      const result = normalizeRanges(window);
      expect(result).toEqual(['9 AM - 10 AM']);
    });

    it('falls back to start/end pair when no range fields present', () => {
      const window: TimeWindow = {
        start: '2025-11-21T11:48:00+05:30',
        end: '2025-11-21T12:36:00+05:30',
      };
      const result = normalizeRanges(window);
      expect(result).toHaveLength(1);
      expect(result[0]).toMatch(/–/);
    });

    it('handles partial start/end (only start)', () => {
      const window: TimeWindow = {
        start: '2025-11-21T11:48:00+05:30',
      };
      const result = normalizeRanges(window);
      expect(result).toHaveLength(1);
      expect(result[0]).toContain('?');
    });

    it('handles partial start/end (only end)', () => {
      const window: TimeWindow = {
        end: '2025-11-21T12:36:00+05:30',
      };
      const result = normalizeRanges(window);
      expect(result).toHaveLength(1);
      expect(result[0]).toContain('?');
    });

    it('prioritizes range field over start/end pair', () => {
      const window: TimeWindow = {
        range: 'Custom Range',
        start: '2025-11-21T11:48:00+05:30',
        end: '2025-11-21T12:36:00+05:30',
      };
      const result = normalizeRanges(window);
      expect(result).toEqual(['Custom Range']);
    });

    it('handles mixed array of strings and objects', () => {
      const window: TimeWindow = {
        range: [
          'Simple string range',
          { start: '2025-11-21T09:00:00+05:30', end: '2025-11-21T10:00:00+05:30' },
        ],
      };
      const result = normalizeRanges(window);
      expect(result).toHaveLength(2);
      expect(result[0]).toBe('Simple string range');
      expect(result[1]).toMatch(/–/);
    });
  });

  describe('sanitizeHtml', () => {
    it('allows safe HTML tags', () => {
      const html = '<p>Hello <strong>world</strong></p>';
      const result = sanitizeHtml(html);
      expect(result).toContain('<p>');
      expect(result).toContain('<strong>');
      expect(result).toContain('</strong>');
      expect(result).toContain('</p>');
    });

    it('removes script tags', () => {
      const html = '<p>Hello</p><script>alert("xss")</script>';
      const result = sanitizeHtml(html);
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('alert');
    });

    it('removes inline event handlers', () => {
      const html = '<div onclick="alert(1)">Click me</div>';
      const result = sanitizeHtml(html);
      expect(result).not.toContain('onclick');
      expect(result).not.toContain('alert');
    });

    it('removes onerror handler', () => {
      const html = '<img src="x" onerror="alert(1)">';
      const result = sanitizeHtml(html);
      expect(result).not.toContain('onerror');
    });

    it('allows datetime attribute on time element', () => {
      const html = '<time datetime="2025-11-21">Today</time>';
      const result = sanitizeHtml(html);
      expect(result).toContain('datetime');
    });

    it('allows class attribute for tables', () => {
      const html = '<table class="data-table"><tr><td>Cell</td></tr></table>';
      const result = sanitizeHtml(html);
      expect(result).toContain('class="data-table"');
    });

    it('removes style tags', () => {
      const html = '<style>body { display: none }</style><p>Content</p>';
      const result = sanitizeHtml(html);
      expect(result).not.toContain('<style>');
      expect(result).toContain('Content');
    });

    it('removes iframe tags', () => {
      const html = '<iframe src="https://evil.com"></iframe><p>Content</p>';
      const result = sanitizeHtml(html);
      expect(result).not.toContain('<iframe');
      expect(result).toContain('Content');
    });

    it('handles empty string', () => {
      expect(sanitizeHtml('')).toBe('');
    });

    it('preserves safe nested HTML structure', () => {
      const html = '<div><ul><li><strong>Item 1</strong></li><li>Item 2</li></ul></div>';
      const result = sanitizeHtml(html);
      expect(result).toContain('<ul>');
      expect(result).toContain('<li>');
      expect(result).toContain('<strong>');
    });

    it('removes javascript: URLs from href', () => {
      const html = '<a href="javascript:alert(1)">Click</a>';
      const result = sanitizeHtml(html);
      expect(result).not.toContain('javascript:');
    });
  });

  describe('TimeWindowsHelp renders correctly', () => {
    it('handles null timeWindows gracefully', () => {
      // This test validates that the normalizeRanges function handles edge cases
      const nullWindow = {} as TimeWindow;
      const result = normalizeRanges(nullWindow);
      expect(result).toEqual([]);
    });

    it('handles empty timeWindows array', () => {
      // Test that empty arrays don't cause issues in range normalization
      const windowWithEmptyRanges: TimeWindow = {
        range: [],
      };
      const result = normalizeRanges(windowWithEmptyRanges);
      expect(result).toEqual([]);
    });

    it('handles window with all optional fields present', () => {
      const fullWindow: TimeWindow = {
        key: 'window-1',
        title: 'Abhijit Muhurta',
        label: 'Golden Hour',
        name: 'Abhijit',
        category: 'Favorable',
        start: '2025-11-21T11:48:00+05:30',
        end: '2025-11-21T12:36:00+05:30',
        range: '11:48 AM – 12:36 PM',
        note: 'Best time for new ventures',
        source: 'Panchang',
        html: '<p>Auspicious period</p>',
        impact: 'favorable',
        description: 'The most auspicious period of the day',
        drivers: ['Sun position', 'Moon phase'],
      };
      
      // Test range normalization prioritizes range field
      const result = normalizeRanges(fullWindow);
      expect(result).toContain('11:48 AM – 12:36 PM');
    });
  });
});
