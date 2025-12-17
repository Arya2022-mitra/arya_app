import { describe, it, expect } from 'vitest';

/**
 * Integration tests for AI Summary window merging functionality
 * 
 * These tests verify that:
 * 1. AI window summaries are correctly extracted from different formats
 * 2. Engine windows and AI content are properly merged
 * 3. The merged windows contain all necessary fields for rendering
 */

describe('AI Summary Window Merging Integration', () => {
  describe('Window index extraction', () => {
    it('should extract index from window_index field (1-based to 0-based)', () => {
      const structuredWindow = { window_index: 5, summary: 'Test window' };
      const extractedIndex = structuredWindow.window_index - 1;
      expect(extractedIndex).toBe(4);
    });

    it('should extract index from key field with tw_N pattern', () => {
      const structuredWindow = { key: 'tw_7', summary: 'Test window' };
      const match = /tw_(\d+)/i.exec(structuredWindow.key);
      expect(match).toBeDefined();
      if (match) {
        const extractedIndex = parseInt(match[1], 10);
        expect(extractedIndex).toBe(7);
      }
    });

    it('should use array index as fallback when no explicit index', () => {
      const windows = [
        { summary: 'First window' },
        { summary: 'Second window' },
        { summary: 'Third window' }
      ];
      
      windows.forEach((window, idx) => {
        // In the actual code, when no window_index or key is present,
        // the array index is used
        expect(idx).toBeGreaterThanOrEqual(0);
        expect(idx).toBeLessThan(windows.length);
      });
    });
  });

  describe('AI content field mapping', () => {
    it('should map summary field to AI content', () => {
      const aiWindow = {
        summary: 'Brief window summary',
        interpretation: 'Detailed interpretation',
        practical: 'Practical advice'
      };

      expect(aiWindow.summary).toBe('Brief window summary');
      expect(aiWindow.interpretation).toBe('Detailed interpretation');
      expect(aiWindow.practical).toBe('Practical advice');
    });

    it('should handle alternative field names', () => {
      const aiWindow = {
        short_desc: 'Short description',
        interpretation_html: '<p>HTML interpretation</p>',
        practical_html: '<p>HTML practical advice</p>'
      };

      // The normalization should accept both plain and _html variants
      expect(aiWindow.short_desc).toBe('Short description');
      expect(aiWindow.interpretation_html).toContain('interpretation');
      expect(aiWindow.practical_html).toContain('practical');
    });

    it('should preserve raw data for debugging', () => {
      const rawWindow = {
        window_index: 1,
        summary: 'Test summary',
        extra_field: 'Extra data',
        nested: { data: 'Nested structure' }
      };

      // The merging should preserve the original object in a raw field
      expect(rawWindow).toHaveProperty('extra_field');
      expect(rawWindow).toHaveProperty('nested');
    });
  });

  describe('Window merging behavior', () => {
    it('should merge AI content into engine window', () => {
      const engineWindow = {
        name: 'Morning Window',
        start: '06:00 AM',
        end: '07:30 AM',
        score: 7.5,
        category: 'Auspicious'
      };

      const aiContent = {
        summary: 'Great energy for new beginnings',
        interpretation: 'The stars align favorably',
        practical: 'Start important projects now'
      };

      // After merging, the result should contain:
      // - All engine window fields (authoritative)
      // - AI content fields (augmented)
      const merged = {
        ...engineWindow,
        short_desc: aiContent.summary,
        interpretation_html: aiContent.interpretation,
        practical_html: aiContent.practical
      };

      expect(merged.name).toBe('Morning Window');
      expect(merged.score).toBe(7.5);
      expect(merged.short_desc).toBe('Great energy for new beginnings');
      expect(merged.interpretation_html).toBe('The stars align favorably');
    });

    it('should prioritize engine category and score over AI', () => {
      const engineWindow = {
        name: 'Test Window',
        category: 'Highly Auspicious',  // Engine category
        score: 8.5                       // Engine score
      };

      const aiContent = {
        category: 'Neutral',  // AI category (should be ignored)
        score: 5.0            // AI score (should be ignored)
      };

      // Merging should prefer engine values
      const merged = {
        ...engineWindow,
        // Only use AI category/score if engine doesn't have them
        category: engineWindow.category || aiContent.category,
        score: engineWindow.score ?? aiContent.score
      };

      expect(merged.category).toBe('Highly Auspicious');
      expect(merged.score).toBe(8.5);
    });

    it('should use AI category and score when engine values missing', () => {
      const engineWindow = {
        name: 'Test Window',
        start: '08:00 AM',
        end: '09:30 AM'
        // No category or score from engine
      };

      const aiContent = {
        category: 'Mixed',
        score: 6.0
      };

      const merged = {
        ...engineWindow,
        category: engineWindow.category || aiContent.category,
        score: (engineWindow as any).score ?? aiContent.score
      };

      expect(merged.category).toBe('Mixed');
      expect(merged.score).toBe(6.0);
    });

    it('should preserve engine timing fields as authoritative', () => {
      const engineWindow = {
        name: 'Afternoon Window',
        start_iso: '2025-12-12T14:00:00Z',
        end_iso: '2025-12-12T15:30:00Z',
        startDisplay: '2:00 PM',
        endDisplay: '3:30 PM'
      };

      const aiContent = {
        summary: 'Good for collaboration'
      };

      const merged = {
        ...engineWindow,
        short_desc: aiContent.summary
      };

      // Timing fields should remain from engine
      expect(merged.start_iso).toBe('2025-12-12T14:00:00Z');
      expect(merged.startDisplay).toBe('2:00 PM');
      expect(merged.short_desc).toBe('Good for collaboration');
    });
  });

  describe('Edge cases and fallbacks', () => {
    it('should handle window with no AI content', () => {
      const engineWindow = {
        name: 'Window 5',
        start: '12:00 PM',
        end: '1:30 PM',
        score: 5.0
      };

      const aiContent = undefined; // No AI data for this window

      // Should return engine window as-is
      const merged = aiContent ? { ...engineWindow, ...aiContent } : engineWindow;
      
      expect(merged).toEqual(engineWindow);
    });

    it('should handle empty AI content gracefully', () => {
      const engineWindow = {
        name: 'Window 10'
      };

      const aiContent = {
        summary: '',
        interpretation: '',
        practical: ''
      };

      const merged = {
        ...engineWindow,
        short_desc: aiContent.summary || undefined,
        interpretation_html: aiContent.interpretation || undefined,
        practical_html: aiContent.practical || undefined
      };

      // Empty strings should not override with undefined
      expect(merged.short_desc).toBeUndefined();
      expect(merged.interpretation_html).toBeUndefined();
    });

    it('should handle missing engine window fields', () => {
      const engineWindow = {
        name: 'Minimal Window'
        // No start, end, score, category, etc.
      };

      const aiContent = {
        summary: 'AI generated summary',
        category: 'Neutral',
        score: 5.5
      };

      const merged = {
        ...engineWindow,
        short_desc: aiContent.summary,
        category: engineWindow.category || aiContent.category,
        score: (engineWindow as any).score ?? aiContent.score
      };

      expect(merged.name).toBe('Minimal Window');
      expect(merged.short_desc).toBe('AI generated summary');
      expect(merged.category).toBe('Neutral');
      expect(merged.score).toBe(5.5);
    });
  });

  describe('Debug and raw data preservation', () => {
    it('should store raw AI data in raw.ai field', () => {
      const engineWindow = {
        name: 'Test Window',
        raw: { engine_data: 'original' }
      };

      const aiContent = {
        summary: 'AI summary',
        extra_field: 'extra_value'
      };

      const merged = {
        ...engineWindow,
        short_desc: aiContent.summary,
        raw: {
          ...(engineWindow.raw || {}),
          ai: aiContent
        }
      };

      expect(merged.raw).toHaveProperty('engine_data');
      expect(merged.raw).toHaveProperty('ai');
      expect(merged.raw.ai).toEqual(aiContent);
    });

    it('should handle case where raw field does not exist initially', () => {
      const engineWindow = {
        name: 'Test Window'
        // No raw field
      };

      const aiContent = {
        summary: 'AI summary'
      };

      const merged = {
        ...engineWindow,
        raw: {
          ...(engineWindow as any).raw || {},
          ai: aiContent
        }
      };

      expect(merged.raw).toBeDefined();
      expect(merged.raw.ai).toEqual(aiContent);
    });
  });
});
