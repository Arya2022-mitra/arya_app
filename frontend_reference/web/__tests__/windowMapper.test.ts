/**
 * windowMapper.test.ts
 * Unit tests for deterministic window mapper validation and merging
 */

import { describe, it, expect } from 'vitest';
import {
  validateAiWindows,
  mapAiWindowsToEngineWindows,
  type AiTimeWindow,
  type EngineWindow,
} from '../lib/windowMapper';

describe('validateAiWindows', () => {
  it('should return false for non-array input', () => {
    expect(validateAiWindows(null)).toBe(false);
    expect(validateAiWindows(undefined)).toBe(false);
    expect(validateAiWindows({})).toBe(false);
    expect(validateAiWindows('not an array')).toBe(false);
    expect(validateAiWindows(123)).toBe(false);
  });

  it('should return false for empty array', () => {
    expect(validateAiWindows([], 16)).toBe(false);
  });

  it('should return false for array with insufficient entries', () => {
    const windows = [
      {
        key: 'tw_0',
        window_index: 1,
        summary: 'Test summary',
        start_iso: '2024-01-01T00:00:00+05:30',
      },
    ];
    expect(validateAiWindows(windows, 16)).toBe(false);
  });

  it('should return false if entry is not an object', () => {
    const windows = Array(16).fill('not an object');
    expect(validateAiWindows(windows, 16)).toBe(false);
  });

  it('should return false if key field is missing', () => {
    const windows = Array(16)
      .fill(null)
      .map((_, i) => ({
        // key missing
        window_index: i + 1,
        summary: `Summary ${i + 1}`,
        start_iso: `2024-01-01T${String(i).padStart(2, '0')}:00:00+05:30`,
      }));
    expect(validateAiWindows(windows, 16)).toBe(false);
  });

  it('should return false if window_index field is missing', () => {
    const windows = Array(16)
      .fill(null)
      .map((_, i) => ({
        key: `tw_${i}`,
        // window_index missing
        summary: `Summary ${i + 1}`,
        start_iso: `2024-01-01T${String(i).padStart(2, '0')}:00:00+05:30`,
      }));
    expect(validateAiWindows(windows, 16)).toBe(false);
  });

  it('should return false if summary field is missing or empty', () => {
    const windows = Array(16)
      .fill(null)
      .map((_, i) => ({
        key: `tw_${i}`,
        window_index: i + 1,
        summary: '', // Empty summary
        start_iso: `2024-01-01T${String(i).padStart(2, '0')}:00:00+05:30`,
      }));
    expect(validateAiWindows(windows, 16)).toBe(false);

    const windowsNoSummary = Array(16)
      .fill(null)
      .map((_, i) => ({
        key: `tw_${i}`,
        window_index: i + 1,
        // summary missing
        start_iso: `2024-01-01T${String(i).padStart(2, '0')}:00:00+05:30`,
      }));
    expect(validateAiWindows(windowsNoSummary, 16)).toBe(false);
  });

  it('should return false if no time fields present', () => {
    const windows = Array(16)
      .fill(null)
      .map((_, i) => ({
        key: `tw_${i}`,
        window_index: i + 1,
        summary: `Summary ${i + 1}`,
        // No start_iso, start_display, end_iso, or end_display
      }));
    expect(validateAiWindows(windows, 16)).toBe(false);
  });

  it('should return true for valid windows with start_iso', () => {
    const windows = Array(16)
      .fill(null)
      .map((_, i) => ({
        key: `tw_${i}`,
        window_index: i + 1,
        summary: `Summary ${i + 1}`,
        start_iso: `2024-01-01T${String(i).padStart(2, '0')}:00:00+05:30`,
      }));
    expect(validateAiWindows(windows, 16)).toBe(true);
  });

  it('should return true for valid windows with start_display', () => {
    const windows = Array(16)
      .fill(null)
      .map((_, i) => ({
        key: `tw_${i}`,
        window_index: i + 1,
        summary: `Summary ${i + 1}`,
        start_display: `${String(i).padStart(2, '0')}:00 AM`,
      }));
    expect(validateAiWindows(windows, 16)).toBe(true);
  });

  it('should return true for valid windows with end_iso', () => {
    const windows = Array(16)
      .fill(null)
      .map((_, i) => ({
        key: `tw_${i}`,
        window_index: i + 1,
        summary: `Summary ${i + 1}`,
        end_iso: `2024-01-01T${String(i).padStart(2, '0')}:30:00+05:30`,
      }));
    expect(validateAiWindows(windows, 16)).toBe(true);
  });

  it('should return true for valid windows with end_display', () => {
    const windows = Array(16)
      .fill(null)
      .map((_, i) => ({
        key: `tw_${i}`,
        window_index: i + 1,
        summary: `Summary ${i + 1}`,
        end_display: `${String(i).padStart(2, '0')}:30 AM`,
      }));
    expect(validateAiWindows(windows, 16)).toBe(true);
  });

  it('should return true for valid windows with all recommended fields', () => {
    const windows: AiTimeWindow[] = Array(16)
      .fill(null)
      .map((_, i) => ({
        key: `tw_${i}`,
        window_index: i + 1,
        summary: `Summary ${i + 1}`,
        start_iso: `2024-01-01T${String(i).padStart(2, '0')}:00:00+05:30`,
        end_iso: `2024-01-01T${String(i).padStart(2, '0')}:30:00+05:30`,
        start_display: `${String(i).padStart(2, '0')}:00 AM`,
        end_display: `${String(i).padStart(2, '0')}:30 AM`,
        score: 7.5,
        category: 'Favorable',
        interpretation: `Interpretation ${i + 1}`,
        practical_advice: `Practical advice ${i + 1}`,
        metadata: {
          confidence: 0.95,
        },
      }));
    expect(validateAiWindows(windows, 16)).toBe(true);
  });

  it('should allow custom expectedCount', () => {
    const windows = Array(8)
      .fill(null)
      .map((_, i) => ({
        key: `tw_${i}`,
        window_index: i + 1,
        summary: `Summary ${i + 1}`,
        start_iso: `2024-01-01T${String(i).padStart(2, '0')}:00:00+05:30`,
      }));
    expect(validateAiWindows(windows, 8)).toBe(true);
    expect(validateAiWindows(windows, 16)).toBe(false); // Should fail with higher count
  });
});

describe('mapAiWindowsToEngineWindows', () => {
  it('should return engine windows as-is when no AI data available', () => {
    const engineWindows: EngineWindow[] = [
      {
        start_iso: '2024-01-01T00:00:00+05:30',
        end_iso: '2024-01-01T01:30:00+05:30',
        name: 'Window 1',
        score: 8,
        category: 'Good',
      },
      {
        start_iso: '2024-01-01T01:30:00+05:30',
        end_iso: '2024-01-01T03:00:00+05:30',
        name: 'Window 2',
        score: 6,
        category: 'Neutral',
      },
    ];
    const aiWindows: AiTimeWindow[] = [];

    const merged = mapAiWindowsToEngineWindows(aiWindows, engineWindows);

    expect(merged).toHaveLength(2);
    expect(merged[0]).toEqual(engineWindows[0]);
    expect(merged[1]).toEqual(engineWindows[1]);
  });

  it('should merge AI content into engine windows by window_index', () => {
    const engineWindows: EngineWindow[] = [
      {
        start_iso: '2024-01-01T00:00:00+05:30',
        end_iso: '2024-01-01T01:30:00+05:30',
        name: 'Window 1',
        score: 8,
        category: 'Good',
      },
      {
        start_iso: '2024-01-01T01:30:00+05:30',
        end_iso: '2024-01-01T03:00:00+05:30',
        name: 'Window 2',
        score: 6,
        category: 'Neutral',
      },
    ];

    const aiWindows: AiTimeWindow[] = [
      {
        key: 'tw_0',
        window_index: 1, // 1-based
        summary: 'AI summary for window 1',
        interpretation: 'AI interpretation 1',
        practical_advice: 'AI practical 1',
        start_iso: '2024-01-01T00:00:00+05:30',
      },
      {
        key: 'tw_1',
        window_index: 2, // 1-based
        summary: 'AI summary for window 2',
        interpretation: 'AI interpretation 2',
        practical_advice: 'AI practical 2',
        start_iso: '2024-01-01T01:30:00+05:30',
      },
    ];

    const merged = mapAiWindowsToEngineWindows(aiWindows, engineWindows);

    expect(merged).toHaveLength(2);

    // First window
    expect(merged[0].start_iso).toBe(engineWindows[0].start_iso);
    expect(merged[0].ai_summary).toBe('AI summary for window 1');
    expect(merged[0].interpretation_html).toBe('AI interpretation 1');
    expect(merged[0].practical_html).toBe('AI practical 1');
    expect(merged[0].score).toBe(8); // Engine score preserved
    expect(merged[0].category).toBe('Good'); // Engine category preserved

    // Second window
    expect(merged[1].start_iso).toBe(engineWindows[1].start_iso);
    expect(merged[1].ai_summary).toBe('AI summary for window 2');
    expect(merged[1].interpretation_html).toBe('AI interpretation 2');
    expect(merged[1].practical_html).toBe('AI practical 2');
  });

  it('should parse key field when window_index is missing', () => {
    const engineWindows: EngineWindow[] = [
      { name: 'Window 1' },
      { name: 'Window 2' },
    ];

    const aiWindows: AiTimeWindow[] = [
      {
        key: 'tw_0',
        window_index: 0 as any, // Invalid but has parseable key
        summary: 'AI summary 1',
        start_iso: '2024-01-01T00:00:00+05:30',
      },
      {
        key: 'tw_1',
        window_index: 0 as any, // Invalid but has parseable key
        summary: 'AI summary 2',
        start_iso: '2024-01-01T01:30:00+05:30',
      },
    ];

    const merged = mapAiWindowsToEngineWindows(aiWindows, engineWindows);

    expect(merged[0].ai_summary).toBe('AI summary 1');
    expect(merged[1].ai_summary).toBe('AI summary 2');
  });

  it('should use AI category/score as fallback when engine values missing', () => {
    const engineWindows: EngineWindow[] = [
      {
        start_iso: '2024-01-01T00:00:00+05:30',
        name: 'Window 1',
        // No score or category
      },
    ];

    const aiWindows: AiTimeWindow[] = [
      {
        key: 'tw_0',
        window_index: 1,
        summary: 'AI summary',
        score: 7.5,
        category: 'Favorable',
        start_iso: '2024-01-01T00:00:00+05:30',
      },
    ];

    const merged = mapAiWindowsToEngineWindows(aiWindows, engineWindows);

    expect(merged[0].score).toBe(7.5); // AI score used
    expect(merged[0].category).toBe('Favorable'); // AI category used
  });

  it('should preserve engine category/score over AI values', () => {
    const engineWindows: EngineWindow[] = [
      {
        start_iso: '2024-01-01T00:00:00+05:30',
        name: 'Window 1',
        score: 9,
        category: 'Excellent',
      },
    ];

    const aiWindows: AiTimeWindow[] = [
      {
        key: 'tw_0',
        window_index: 1,
        summary: 'AI summary',
        score: 7.5,
        category: 'Good',
        start_iso: '2024-01-01T00:00:00+05:30',
      },
    ];

    const merged = mapAiWindowsToEngineWindows(aiWindows, engineWindows);

    expect(merged[0].score).toBe(9); // Engine score preserved
    expect(merged[0].category).toBe('Excellent'); // Engine category preserved
  });

  it('should attach ai_raw for debugging', () => {
    const engineWindows: EngineWindow[] = [{ name: 'Window 1' }];

    const aiWindows: AiTimeWindow[] = [
      {
        key: 'tw_0',
        window_index: 1,
        summary: 'AI summary',
        start_iso: '2024-01-01T00:00:00+05:30',
        metadata: { confidence: 0.95 },
      },
    ];

    const merged = mapAiWindowsToEngineWindows(aiWindows, engineWindows);

    expect(merged[0].ai_raw).toBeDefined();
    expect(merged[0].ai_raw?.key).toBe('tw_0');
    expect(merged[0].ai_raw?.metadata?.confidence).toBe(0.95);
  });

  it('should use interpretation_html field over interpretation', () => {
    const engineWindows: EngineWindow[] = [{ name: 'Window 1' }];

    const aiWindows: AiTimeWindow[] = [
      {
        key: 'tw_0',
        window_index: 1,
        summary: 'Summary',
        interpretation: 'Plain text interpretation',
        interpretation_html: '<p>HTML interpretation</p>',
        start_iso: '2024-01-01T00:00:00+05:30',
      },
    ];

    const merged = mapAiWindowsToEngineWindows(aiWindows, engineWindows);

    expect(merged[0].interpretation_html).toBe('<p>HTML interpretation</p>');
  });

  it('should fallback to interpretation if interpretation_html missing', () => {
    const engineWindows: EngineWindow[] = [{ name: 'Window 1' }];

    const aiWindows: AiTimeWindow[] = [
      {
        key: 'tw_0',
        window_index: 1,
        summary: 'Summary',
        interpretation: 'Plain text interpretation',
        start_iso: '2024-01-01T00:00:00+05:30',
      },
    ];

    const merged = mapAiWindowsToEngineWindows(aiWindows, engineWindows);

    expect(merged[0].interpretation_html).toBe('Plain text interpretation');
  });
});
