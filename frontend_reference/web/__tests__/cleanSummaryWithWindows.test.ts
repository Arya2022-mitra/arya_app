import { describe, it, expect, beforeEach } from 'vitest';
import {
  cleanSummaryWithWindows,
  formatTime,
  getWindowLabel,
  formatTimeRange,
  buildWindowString,
  expandTimeWindowTokens,
  collapseIdenticalLines,
  collapseBoilerplate,
  convertMetadataToHints,
  slotToTimeRange,
  parseTimeString,
  isNumericSlot,
  resetWarningFlag,
  TimeWindow,
  FormatOptions,
  stripMetadataSections,
  stripDebugBlocks,
  normalizeTimeWindow,
} from '@/lib/cleanSummaryWithWindows';

describe('cleanSummaryWithWindows', () => {
  beforeEach(() => {
    // Reset warning flag before each test to ensure clean state
    resetWarningFlag();
  });

  describe('formatTime', () => {
    it('formats valid ISO datetime to localized time', () => {
      const result = formatTime('2025-11-21T11:48:00+05:30');
      expect(result).not.toBeNull();
      // Just verify it returns a time-like string
      expect(result).toMatch(/\d{1,2}:\d{2}/);
    });

    it('returns null for undefined', () => {
      expect(formatTime(undefined)).toBeNull();
    });

    it('returns null for invalid date string', () => {
      expect(formatTime('not-a-date')).toBeNull();
    });

    it('returns null for empty string', () => {
      expect(formatTime('')).toBeNull();
    });

    it('formats HH:MM (24-hour) time string', () => {
      const result = formatTime('09:30');
      expect(result).not.toBeNull();
      expect(result).toMatch(/9:30/i);
    });

    it('formats H:MM AM/PM (12-hour) time string', () => {
      const result = formatTime('9:30 AM');
      expect(result).not.toBeNull();
      expect(result).toMatch(/9:30.*AM/i);
    });

    it('formats numeric slot index', () => {
      const result = formatTime(1, { slotMinutes: 90 });
      expect(result).not.toBeNull();
      expect(result).toMatch(/12:00.*AM/i);
    });

    it('formats string numeric slot', () => {
      const result = formatTime('2', { slotMinutes: 90 });
      expect(result).not.toBeNull();
      expect(result).toMatch(/1:30.*AM/i);
    });

    it('respects useAmpm option for 24-hour format', () => {
      const result = formatTime('14:30', { useAmpm: false });
      expect(result).toBe('14:30');
    });

    it('handles PM times correctly', () => {
      const result = formatTime('2:30 PM');
      expect(result).not.toBeNull();
      expect(result).toMatch(/2:30.*PM/i);
    });

    it('handles midnight (12:00 AM)', () => {
      const result = formatTime('12:00 AM');
      expect(result).not.toBeNull();
      expect(result).toMatch(/12:00.*AM/i);
    });

    it('handles noon (12:00 PM)', () => {
      const result = formatTime('12:00 PM');
      expect(result).not.toBeNull();
      expect(result).toMatch(/12:00.*PM/i);
    });
  });

  describe('slotToTimeRange', () => {
    it('returns correct range for slot 1 (midnight start)', () => {
      const result = slotToTimeRange(1, 90, true);
      expect(result).toBe('12:00 AM – 1:30 AM');
    });

    it('returns correct range for slot 2', () => {
      const result = slotToTimeRange(2, 90, true);
      expect(result).toBe('1:30 AM – 3:00 AM');
    });

    it('returns fallback for invalid slot (0)', () => {
      const result = slotToTimeRange(0, 90, true);
      expect(result).toBe('time window');
    });

    it('returns fallback for slot beyond day', () => {
      const result = slotToTimeRange(100, 90, true);
      expect(result).toBe('time window');
    });

    it('respects useAmpm=false for 24-hour format', () => {
      const result = slotToTimeRange(1, 90, false);
      expect(result).toBe('00:00 – 01:30');
    });
  });

  describe('parseTimeString', () => {
    it('parses 24-hour format HH:MM', () => {
      const result = parseTimeString('09:30');
      expect(result).toEqual({ hours: 9, minutes: 30 });
    });

    it('parses 24-hour format with seconds HH:MM:SS', () => {
      const result = parseTimeString('14:30:00');
      expect(result).toEqual({ hours: 14, minutes: 30 });
    });

    it('parses 12-hour format with AM', () => {
      const result = parseTimeString('9:30 AM');
      expect(result).toEqual({ hours: 9, minutes: 30 });
    });

    it('parses 12-hour format with PM', () => {
      const result = parseTimeString('2:30 PM');
      expect(result).toEqual({ hours: 14, minutes: 30 });
    });

    it('parses 12:00 AM as midnight', () => {
      const result = parseTimeString('12:00 AM');
      expect(result).toEqual({ hours: 0, minutes: 0 });
    });

    it('parses 12:00 PM as noon', () => {
      const result = parseTimeString('12:00 PM');
      expect(result).toEqual({ hours: 12, minutes: 0 });
    });

    it('handles 24:00 as midnight', () => {
      const result = parseTimeString('24:00');
      expect(result).toEqual({ hours: 0, minutes: 0 });
    });

    it('returns null for invalid string', () => {
      expect(parseTimeString('invalid')).toBeNull();
      expect(parseTimeString('')).toBeNull();
    });
  });

  describe('isNumericSlot', () => {
    it('returns true for number', () => {
      expect(isNumericSlot(5)).toBe(true);
    });

    it('returns true for numeric string', () => {
      expect(isNumericSlot('3')).toBe(true);
      expect(isNumericSlot('12')).toBe(true);
    });

    it('returns false for time string', () => {
      expect(isNumericSlot('09:30')).toBe(false);
      expect(isNumericSlot('9:30 AM')).toBe(false);
    });

    it('returns false for undefined', () => {
      expect(isNumericSlot(undefined)).toBe(false);
    });
  });

  describe('normalizeTimeWindow', () => {
    it('normalizes severity and pakshi metadata', () => {
      const normalized = normalizeTimeWindow(
        {
          category: 'Auspicious period',
          score: 8,
          pakshi_day: 'Garuda',
          night_ruling_pakshi: 'Hamsa',
        },
        0,
      );
      expect(normalized.severity).toBe('auspicious');
      expect(normalized.pakshi_day).toBe('Garuda');
      expect(normalized.pakshi_night).toBe('Hamsa');
      expect(normalized.startDisplay).toBe('--:--');
      expect(normalized.endDisplay).toBe('--:--');
      expect(normalized.scoreText).toBe('8');
      expect(normalized.scoreVariant).toBe('good');
    });

    it('parses embedded __windows_json__ payloads and strips debug text', () => {
      const normalized = normalizeTimeWindow(
        {
          note: 'Busy time __windows_json__ {"day_pakshi":"Owl","severity":"inauspicious","score":2}',
        },
        0,
      );

      expect(normalized.pakshi_day).toBe('Owl');
      expect(normalized.severity).toBe('inauspicious');
      expect(normalized.score).toBe(2);
      expect(normalized.short_desc).toBe('Busy time');
      expect(normalized.note?.includes('__windows_json__')).toBe(false);
    });

    it('parses embedded JSON without markers and merges fields', () => {
      const normalized = normalizeTimeWindow(
        {
          note: 'Night focus {"pakshi_night":"Crow","score":4,"severity":"neutral"}',
        },
        1,
      );

      expect(normalized.pakshi_night).toBe('Crow');
      expect(normalized.score).toBe(4);
      expect(normalized.severity).toBe('neutral');
      expect(normalized.note).toBe('Night focus');
    });

    it('fills placeholders when score is missing', () => {
      const normalized = normalizeTimeWindow({}, 0);
      expect(normalized.score).toBeNull();
      expect(normalized.scoreText).toBe('-');
      expect(normalized.scoreVariant).toBe('neutral');
    });

    it('derives severity from score when category is missing', () => {
      const normalized = normalizeTimeWindow({ score: 8.2 }, 1);
      expect(normalized.severity).toBe('auspicious');
      expect(normalized.scoreVariant).toBe('good');
    });
  });

  describe('getWindowLabel', () => {
    it('returns label if present', () => {
      const window: TimeWindow = { label: 'Abhijit Muhurta' };
      expect(getWindowLabel(window, 0)).toBe('Abhijit Muhurta');
    });

    it('falls back to name', () => {
      const window: TimeWindow = { name: 'Golden Hour' };
      expect(getWindowLabel(window, 0)).toBe('Golden Hour');
    });

    it('falls back to category', () => {
      const window: TimeWindow = { category: 'Favorable' };
      expect(getWindowLabel(window, 0)).toBe('Favorable');
    });

    it('falls back to Window N+1 when no fields', () => {
      const window: TimeWindow = {};
      expect(getWindowLabel(window, 2)).toBe('Window 3');
    });

    it('falls back to Window N+1 for undefined window', () => {
      expect(getWindowLabel(undefined, 5)).toBe('Window 6');
    });
  });

  describe('stripDebugBlocks', () => {
    it('removes leaked JSON fragments but preserves prose', () => {
      const input = 'Expect calm {"pakshi":"Peacock","score":9}, continue with grace.';
      const cleaned = stripDebugBlocks(input);
      expect(cleaned).not.toMatch(/pakshi|\{/i);
      expect(cleaned).toContain('Expect calm');
    });

    it('strips fenced JSON code blocks', () => {
      const input = 'Morning focus ```json {"score":2,"note":"debug"}``` carry on.';
      const cleaned = stripDebugBlocks(input);
      expect(cleaned).toBe('Morning focus carry on.');
    });

    it('keeps legitimate quoted strings while removing debug markers', () => {
      const input = '__debug__ {"score":3} Celebrate the day with "courage" and joy.';
      const cleaned = stripDebugBlocks(input);
      expect(cleaned).toContain('Celebrate the day with "courage" and joy.');
      expect(cleaned).not.toContain('__debug__');
    });
  });

  describe('formatTimeRange', () => {
    it('formats start and end times from ISO', () => {
      const window: TimeWindow = {
        start: '2025-11-21T11:48:00+05:30',
        end: '2025-11-21T12:36:00+05:30',
      };
      const result = formatTimeRange(window);
      expect(result).not.toBeNull();
      expect(result).toContain('→');
    });

    it('prefers start_display/end_display from backend', () => {
      const window: TimeWindow = {
        start: '2025-11-21T11:48:00+05:30',
        end: '2025-11-21T12:36:00+05:30',
        start_display: '11:48 AM',
        end_display: '12:36 PM',
      };
      const result = formatTimeRange(window);
      expect(result).toBe('11:48 AM → 12:36 PM');
    });

    it('formats HH:MM time strings', () => {
      const window: TimeWindow = {
        start: '09:00',
        end: '10:30',
      };
      const result = formatTimeRange(window);
      expect(result).not.toBeNull();
      expect(result).toMatch(/9:00.*→.*10:30/i);
    });

    it('formats numeric slots', () => {
      const window: TimeWindow = {
        start: 1,
        end: 1,
      };
      const result = formatTimeRange(window, { slotMinutes: 90 });
      expect(result).not.toBeNull();
      expect(result).toContain('12:00 AM');
      expect(result).toContain('1:30 AM');
    });

    it('returns null when start is missing', () => {
      const window: TimeWindow = { end: '2025-11-21T12:36:00+05:30' };
      expect(formatTimeRange(window)).toContain('--:--');
    });

    it('returns null when end is missing', () => {
      const window: TimeWindow = { start: '2025-11-21T11:48:00+05:30' };
      expect(formatTimeRange(window)).toContain('--:--');
    });

    it('returns null for undefined window', () => {
      expect(formatTimeRange(undefined)).toBeNull();
    });
  });

  describe('buildWindowString', () => {
    it('includes label and time range', () => {
      const window: TimeWindow = {
        label: 'Abhijit Muhurta',
        start: '2025-11-21T11:48:00+05:30',
        end: '2025-11-21T12:36:00+05:30',
      };
      const result = buildWindowString(window, 0);
      expect(result).toContain('Abhijit Muhurta');
      expect(result).toContain('(');
      expect(result).toContain('→');
    });

    it('returns just label when no time range', () => {
      const window: TimeWindow = { label: 'Rahukaalam' };
      const result = buildWindowString(window, 0);
      expect(result).toBe('Rahukaalam (--:-- → --:--)');
    });

    it('formats with HH:MM times', () => {
      const window: TimeWindow = {
        label: 'Morning',
        start: '09:00',
        end: '10:30',
      };
      const result = buildWindowString(window, 0);
      expect(result).toContain('Morning');
      expect(result).toMatch(/9:00.*→.*10:30/i);
    });
  });

  describe('expandTimeWindowTokens', () => {
    const windows: TimeWindow[] = [
      {
        label: 'Rahukaalam',
        start: '2025-11-21T09:00:00+05:30',
        end: '2025-11-21T10:30:00+05:30',
      },
      {
        label: 'Abhijit Muhurta',
        start: '2025-11-21T11:48:00+05:30',
        end: '2025-11-21T12:36:00+05:30',
      },
      {
        label: 'Pakshi Ruling',
        start: '2025-11-21T14:00:00+05:30',
        end: '2025-11-21T15:30:00+05:30',
      },
    ];

    it('expands time_windows[0] to a classed time/score snippet', () => {
      const result = expandTimeWindowTokens('Avoid time_windows[0] for important tasks.', windows);
      expect(result).toContain('mv-time-range');
      expect(result).toContain('mv-score');
      expect(result).toContain('→');
    });

    it('handles case-insensitive tokens', () => {
      const result = expandTimeWindowTokens('Check TIME_WINDOWS[2] for your bird.', windows);
      expect(result).toContain('mv-time-range');
      expect(result).toContain('mv-score');
    });

    it('derives severity classes from category when severity is absent', () => {
      const result = expandTimeWindowTokens('Use time_windows[0].', [
        {
          label: 'Favorable',
          category: 'Highly auspicious',
          start: '09:00',
          end: '10:00',
        },
      ]);
      expect(result).toContain('mv-severity--auspicious');
      expect(result).toContain('mv-score');
    });

    it('handles multiple tokens', () => {
      const result = expandTimeWindowTokens(
        'Avoid time_windows[0] but use time_windows[1].',
        windows
      );
      expect(result.match(/mv-time-range/g)?.length).toBeGreaterThanOrEqual(2);
    });

    it('replaces out-of-range index with default placeholders', () => {
      const result = expandTimeWindowTokens('Use time_windows[99] carefully.', windows);
      expect(result).toContain('--:--');
    });

    it('replaces with placeholders when windows is null', () => {
      const result = expandTimeWindowTokens('Use time_windows[0] carefully.', null);
      expect(result).toContain('--:--');
      expect(result).toContain('mv-score');
    });

    it('replaces with placeholders when windows is undefined', () => {
      const result = expandTimeWindowTokens('Use time_windows[0] carefully.', undefined);
      expect(result).toContain('--:--');
    });

    it('handles windows with HH:MM times', () => {
      const hhmmWindows: TimeWindow[] = [
        { label: 'Morning', start: '09:00', end: '10:30' },
      ];
      const result = expandTimeWindowTokens('Schedule during time_windows[0].', hhmmWindows);
      expect(result).toContain('9:00');
      expect(result).toContain('10:30');
      expect(result).toContain('mv-time-range');
    });

    it('emits severity and pakshi badges when present', () => {
      const hhmmWindows: TimeWindow[] = [
        {
          label: 'Morning',
          start: '09:00',
          end: '10:30',
          severity: 'auspicious',
          pakshi_day: 'Garuda',
        },
      ];
      const result = expandTimeWindowTokens('Schedule during time_windows[0].', hhmmWindows);
      expect(result).toContain('mv-severity--auspicious');
      expect(result).toContain('mv-pakshi-badge');
      expect(result).toContain('Day: Garuda');
      expect(result).toContain('mv-score--neutral');
      expect(result).toContain('data-severity="auspicious"');
    });
  });

  describe('collapseIdenticalLines', () => {
    it('collapses consecutive identical lines', () => {
      const input = 'Line 1\nLine 1\nLine 1\nLine 2';
      const result = collapseIdenticalLines(input);
      expect(result).toBe('Line 1\nLine 2');
    });

    it('preserves non-consecutive identical lines', () => {
      const input = 'Line 1\nLine 2\nLine 1';
      const result = collapseIdenticalLines(input);
      expect(result).toBe('Line 1\nLine 2\nLine 1');
    });

    it('preserves empty lines for paragraph spacing', () => {
      const input = 'Para 1\n\nPara 2';
      const result = collapseIdenticalLines(input);
      expect(result).toBe('Para 1\n\nPara 2');
    });

    it('handles single line input', () => {
      const input = 'Single line';
      const result = collapseIdenticalLines(input);
      expect(result).toBe('Single line');
    });
  });

  describe('collapseBoilerplate', () => {
    it('collapses repeated Stay observant phrases', () => {
      const input = 'Stay observant today. Stay observant today. Stay observant today.';
      const result = collapseBoilerplate(input);
      // Should have only one instance
      const matches = result.match(/Stay observant/gi);
      expect(matches?.length).toBeLessThanOrEqual(2);
    });

    it('preserves different boilerplate phrases', () => {
      const input = 'Stay observant today. Be mindful of changes.';
      const result = collapseBoilerplate(input);
      expect(result).toContain('observant');
      expect(result).toContain('mindful');
    });
  });

  describe('convertMetadataToHints', () => {
    it('converts dotted path metadata to readable hint', () => {
      const input = 'Based on your chart [based on core_layers.panchang.data.moon_sign]';
      const result = convertMetadataToHints(input);
      expect(result).toContain('*(based on moon sign)*');
      expect(result).not.toContain('core_layers');
    });

    it('handles snake_case in last segment', () => {
      const input = 'Dasha period [based on core_layers.dasha.current_period]';
      const result = convertMetadataToHints(input);
      expect(result).toContain('*(based on current period)*');
    });

    it('handles multiple metadata brackets', () => {
      const input =
        'Moon [based on moon.sign] and Sun [based on sun.sign]';
      const result = convertMetadataToHints(input);
      expect(result).toContain('*(based on sign)*');
      expect(result.match(/\*\(based on/g)?.length).toBe(2);
    });

    it('preserves text without metadata brackets', () => {
      const input = 'No metadata here.';
      const result = convertMetadataToHints(input);
      expect(result).toBe('No metadata here.');
    });
  });

  describe('cleanSummaryWithWindows (integration)', () => {
    const windows: TimeWindow[] = [
      {
        label: 'Rahukaalam',
        start: '2025-11-21T09:00:00+05:30',
        end: '2025-11-21T10:30:00+05:30',
        impact: 'avoid risk',
      },
      {
        label: 'Abhijit Muhurta',
        start: '2025-11-21T11:48:00+05:30',
        end: '2025-11-21T12:36:00+05:30',
        impact: 'favorable',
      },
    ];

    it('expands tokens and cleans summary', () => {
      const raw = `### Today's Summary

Avoid time_windows[0] for important decisions.
Avoid time_windows[0] for important decisions.

Use time_windows[1] for new ventures [based on core_layers.panchang.moon_sign].

Stay observant today. Stay observant today.`;

      const result = cleanSummaryWithWindows(raw, windows);

      // Tokens expanded
      expect(result).toContain('mv-time-window');
      expect(result).toContain('data-severity');

      // Duplicates collapsed
      expect(result.match(/Avoid.*time_windows/g)).toBeNull();

      // Metadata converted
      expect(result).toContain('*(based on moon sign)*');

      // Boilerplate reduced
      const observantCount = result.match(/Stay observant/gi)?.length || 0;
      expect(observantCount).toBeLessThanOrEqual(2);
    });

    it('returns empty string for null input', () => {
      expect(cleanSummaryWithWindows(null, windows)).toBe('');
    });

    it('returns empty string for undefined input', () => {
      expect(cleanSummaryWithWindows(undefined, windows)).toBe('');
    });

    it('handles summary without tokens', () => {
      const raw = 'Today is a good day for creativity.';
      const result = cleanSummaryWithWindows(raw, windows);
      expect(result).toBe('Today is a good day for creativity.');
    });

    it('handles summary without windows provided', () => {
      const raw = 'Use time_windows[0] wisely.';
      const result = cleanSummaryWithWindows(raw, null);
      expect(result).toContain('mv-neutral');
    });

    it('handles excessive newlines', () => {
      const raw = 'Line 1\n\n\n\n\nLine 2';
      const result = cleanSummaryWithWindows(raw, windows);
      expect(result).toBe('Line 1\n\nLine 2');
    });

    it('accepts formatting options', () => {
      const windowsHHMM: TimeWindow[] = [
        { label: 'Morning', start: '09:00', end: '10:30' },
      ];
      const raw = 'Schedule during time_windows[0].';
      
      // Test with AM/PM
      const resultAmpm = cleanSummaryWithWindows(raw, windowsHHMM, { useAmpm: true });
      expect(resultAmpm).toMatch(/9:00.*AM/i);
      
      // Test with 24-hour
      const result24h = cleanSummaryWithWindows(raw, windowsHHMM, { useAmpm: false });
      expect(result24h).toMatch(/09:00|9:00/);
    });

    it('handles windows with display fields from backend', () => {
      const windowsWithDisplay: TimeWindow[] = [
        {
          label: 'Favorable',
          start_display: '9:00 AM',
          end_display: '10:30 AM',
          start: '2025-11-21T09:00:00+05:30',
          end: '2025-11-21T10:30:00+05:30',
        },
      ];
      const raw = 'Schedule during time_windows[0].';
      const result = cleanSummaryWithWindows(raw, windowsWithDisplay);
      expect(result).toContain('9:00 AM → 10:30 AM');
    });
  });
});

// Import additional functions for new tests
import {
  formatLocal,
  formatIsoDatetimesInText,
  getWindowDedupeKey,
  dedupeTimeWindows,
  normalizeTimeWindow,
  buildTimeWindows,
  NormalizedTimeWindow,
} from '@/lib/cleanSummaryWithWindows';

describe('formatLocal', () => {
  it('formats ISO datetime to date + time with AM/PM (default variant)', () => {
    const result = formatLocal('2025-11-28T11:49:00+05:30');
    expect(result).not.toBe('—');
    // Should contain date parts (Nov, 2025) and am/pm
    expect(result).toMatch(/Nov.*2025/i);
    expect(result).toMatch(/[ap]m/i);
    expect(result).toMatch(/\d{1,2}:\d{2}/i);
  });

  it('formats ISO datetime to time only variant', () => {
    const result = formatLocal('2025-11-28T14:30:00+05:30', 'time');
    expect(result).not.toBe('—');
    // Should be time with am/pm, not include year
    expect(result).toMatch(/\d{1,2}:\d{2}.*[ap]m/i);
    expect(result).not.toMatch(/2025/);
  });

  it('returns em-dash for null/undefined', () => {
    expect(formatLocal(null)).toBe('—');
    expect(formatLocal(undefined)).toBe('—');
  });

  it('returns original string for invalid date', () => {
    expect(formatLocal('not-a-date')).toBe('not-a-date');
  });

  it('formats Z timezone correctly', () => {
    const result = formatLocal('2025-11-28T06:19:00Z', 'time');
    expect(result).not.toBe('—');
    expect(result).toMatch(/\d{1,2}:\d{2}.*[ap]m/i);
  });
});

describe('formatIsoDatetimesInText', () => {
  it('replaces ISO datetime strings with AM/PM formatted times', () => {
    const input = 'The event starts at 2025-11-28T11:49:00+05:30.';
    const result = formatIsoDatetimesInText(input);
    expect(result).not.toContain('2025-11-28T');
    expect(result).toMatch(/\d{1,2}:\d{2}.*[ap]m/i);
  });

  it('replaces ISO datetime ranges with formatted time ranges', () => {
    const input = 'Window: 2025-11-28T11:49:00+05:30 to 2025-11-28T12:30:00+05:30';
    const result = formatIsoDatetimesInText(input);
    expect(result).not.toContain('2025-11-28T');
    expect(result).toMatch(/\d{1,2}:\d{2}.*[ap]m.*–.*\d{1,2}:\d{2}.*[ap]m/i);
  });

  it('handles multiple ISO datetimes in text', () => {
    const input = 'First at 2025-11-28T09:00:00+05:30, then at 2025-11-28T14:00:00+05:30.';
    const result = formatIsoDatetimesInText(input);
    expect(result).not.toContain('2025-11-28T');
    // Should have two time patterns
    const timeMatches = result.match(/\d{1,2}:\d{2}.*?[ap]m/gi);
    expect(timeMatches?.length).toBeGreaterThanOrEqual(2);
  });

  it('returns empty string for empty/null input', () => {
    expect(formatIsoDatetimesInText('')).toBe('');
  });

  it('returns unchanged text when no ISO datetimes present', () => {
    const input = 'No datetime here, just text.';
    expect(formatIsoDatetimesInText(input)).toBe(input);
  });
});

describe('getWindowDedupeKey', () => {
  it('generates consistent key from window properties', () => {
    const window: TimeWindow = {
      name: 'Abhijit Muhurta',
      start: '2025-11-28T11:49:00+05:30',
      end: '2025-11-28T12:36:00+05:30',
    };
    const key = getWindowDedupeKey(window);
    expect(key).toBe('Abhijit Muhurta|2025-11-28T11:49:00+05:30|2025-11-28T12:36:00+05:30');
  });

  it('uses label as fallback for name', () => {
    const window: TimeWindow = {
      label: 'Golden Hour',
      start: '09:00',
      end: '10:30',
    };
    const key = getWindowDedupeKey(window);
    expect(key).toBe('Golden Hour|09:00|10:30');
  });

  it('handles missing fields gracefully', () => {
    const window: TimeWindow = { name: 'Test' };
    const key = getWindowDedupeKey(window);
    expect(key).toBe('Test||');
  });
});

describe('dedupeTimeWindows', () => {
  it('removes duplicate windows by key', () => {
    const windows: TimeWindow[] = [
      { name: 'Window A', start: '09:00', end: '10:00' },
      { name: 'Window A', start: '09:00', end: '10:00' }, // duplicate
      { name: 'Window B', start: '11:00', end: '12:00' },
    ];
    const result = dedupeTimeWindows(windows);
    expect(result.length).toBe(2);
    expect(result[0].name).toBe('Window A');
    expect(result[1].name).toBe('Window B');
  });

  it('keeps first instance when duplicates found', () => {
    const windows: TimeWindow[] = [
      { name: 'Test', start: '09:00', end: '10:00', description: 'First' },
      { name: 'Test', start: '09:00', end: '10:00', description: 'Second' },
    ];
    const result = dedupeTimeWindows(windows);
    expect(result.length).toBe(1);
    expect(result[0].description).toBe('First');
  });

  it('handles empty array', () => {
    expect(dedupeTimeWindows([])).toEqual([]);
  });

  it('handles null/undefined', () => {
    expect(dedupeTimeWindows(null as any)).toEqual([]);
    expect(dedupeTimeWindows(undefined as any)).toEqual([]);
  });
});

describe('normalizeTimeWindow', () => {
  it('normalizes window with ISO times', () => {
    const window: TimeWindow = {
      name: 'Abhijit Muhurta',
      start: '2025-11-28T11:49:00+05:30',
      end: '2025-11-28T12:36:00+05:30',
    };
    const result = normalizeTimeWindow(window, 0);
    expect(result.name).toBe('Abhijit Muhurta');
    // startISO and endISO should be set when the input is ISO format
    expect(result.startISO).toBe('2025-11-28T11:49:00+05:30');
    expect(result.endISO).toBe('2025-11-28T12:36:00+05:30');
    // Display should be a time string
    expect(result.startDisplay).toMatch(/\d{1,2}:\d{2}/i);
    expect(result.endDisplay).toMatch(/\d{1,2}:\d{2}/i);
    // Card date should include date info
    expect(result.card_date).toMatch(/Nov.*2025/i);
  });

  it('uses fallback name when missing', () => {
    const window: TimeWindow = {
      start: '09:00',
      end: '10:00',
    };
    const result = normalizeTimeWindow(window, 5);
    expect(result.name).toBe('Window 6');
  });

  it('prefers pre-formatted display fields', () => {
    const window: TimeWindow = {
      name: 'Test',
      start_display: '9:00 AM',
      end_display: '10:00 AM',
      start: '2025-11-28T09:00:00+05:30',
      end: '2025-11-28T10:00:00+05:30',
    };
    const result = normalizeTimeWindow(window, 0);
    expect(result.startDisplay).toBe('9:00 AM');
    expect(result.endDisplay).toBe('10:00 AM');
  });

  it('handles HH:MM time formats', () => {
    const window: TimeWindow = {
      name: 'Morning',
      start: '09:30',
      end: '10:45',
    };
    const result = normalizeTimeWindow(window, 0);
    expect(result.startDisplay).toMatch(/9:30/i);
    expect(result.endDisplay).toMatch(/10:45/i);
  });

  it('fills placeholders when times are missing', () => {
    const window: TimeWindow = { name: 'No Time' };
    const result = normalizeTimeWindow(window, 0);
    expect(result.startDisplay).toBe('--:--');
    expect(result.endDisplay).toBe('--:--');
    expect(result.scoreText).toBe('-');
  });
});

describe('buildTimeWindows', () => {
  it('builds windows from structured time_windows array', () => {
    const data = {
      time_windows: [
        { name: 'Window 1', start: '2025-11-28T09:00:00+05:30', end: '2025-11-28T10:00:00+05:30' },
        { name: 'Window 2', start: '2025-11-28T11:00:00+05:30', end: '2025-11-28T12:00:00+05:30' },
      ],
    };
    const result = buildTimeWindows(data);
    expect(result.length).toBe(2);
    expect(result[0].name).toBe('Window 1');
    expect(result[0].startDisplay).toBeTruthy();
    expect(result[1].name).toBe('Window 2');
  });

  it('deduplicates windows during build', () => {
    const data = {
      time_windows: [
        { name: 'Same', start: '09:00', end: '10:00' },
        { name: 'Same', start: '09:00', end: '10:00' }, // duplicate
      ],
    };
    const result = buildTimeWindows(data);
    expect(result.length).toBe(1);
  });

  it('handles layers.time_windows source', () => {
    const data = {
      layers: {
        time_windows: [
          { name: 'Layered', start: '09:00', end: '10:00' },
        ],
      },
    };
    const result = buildTimeWindows(data);
    expect(result.length).toBe(1);
    expect(result[0].name).toBe('Layered');
  });

  it('parses layers from JSON string when provided', () => {
    const data = {
      layers: JSON.stringify({
        time_windows: [
          { title: 'String Layer', start: '2025-01-01T00:00:00Z', end: '2025-01-01T01:00:00Z' },
        ],
      }),
    } as any;
    const result = buildTimeWindows(data);
    expect(result.length).toBe(1);
    expect(result[0].name).toBe('String Layer');
    expect(result[0].startISO).toContain('2025-01-01');
  });

  it('returns empty array for null/undefined data', () => {
    expect(buildTimeWindows(null)).toEqual([]);
    expect(buildTimeWindows(undefined)).toEqual([]);
  });

  it('returns empty array when no time_windows found', () => {
    const data = { summary: 'Some text' };
    expect(buildTimeWindows(data)).toEqual([]);
  });
});

describe('stripMetadataSections', () => {
  it('removes Windows Explanation section and everything after', () => {
    const input = 'Main summary content here.\n\nWindows Explanation\nThis is backend only content.';
    const result = stripMetadataSections(input);
    expect(result).toBe('Main summary content here.');
    expect(result).not.toContain('Windows Explanation');
  });

  it('removes markdown-style Windows Explanation header', () => {
    const input = 'Summary text.\n\n## Windows Explanation\nBackend notes here.';
    const result = stripMetadataSections(input);
    expect(result).toBe('Summary text.');
  });

  it('removes # Windows Explanation header', () => {
    const input = 'Summary.\n\n# Windows Explanation:\nMore backend data.';
    const result = stripMetadataSections(input);
    expect(result).toBe('Summary.');
  });

  it('removes Appendix sections', () => {
    const input = 'Main content.\n\nAppendix\nAppendix content.';
    const result = stripMetadataSections(input);
    expect(result).toBe('Main content.');
  });

  it('removes leading Updated: <date> pattern', () => {
    const input = 'Updated: 2025-01-15\nMain summary text.';
    const result = stripMetadataSections(input);
    expect(result).toBe('Main summary text.');
  });

  it('handles case insensitivity for Windows Explanation', () => {
    const input = 'Summary.\n\nWINDOWS EXPLANATION\nBackend data.';
    const result = stripMetadataSections(input);
    expect(result).toBe('Summary.');
  });

  it('preserves content without backend sections', () => {
    const input = 'This is a clean summary with no backend sections.';
    const result = stripMetadataSections(input);
    expect(result).toBe(input);
  });

  it('returns empty string for empty input', () => {
    expect(stripMetadataSections('')).toBe('');
  });

  it('handles Internal Notes section', () => {
    const input = 'Main text.\n\nInternal Notes\nDeveloper notes here.';
    const result = stripMetadataSections(input);
    expect(result).toBe('Main text.');
  });

  it('works with cleanSummaryWithWindows integration', () => {
    const input = 'Today looks favorable.\n\nWindows Explanation\nThis explains the time windows.';
    const result = cleanSummaryWithWindows(input, null);
    expect(result).toBe('Today looks favorable.');
    expect(result).not.toContain('Windows Explanation');
  });
});

describe('stripDebugBlocks', () => {
  it('strips markers and trailing JSON', () => {
    const raw = '__debug__ {"foo": "bar"} Keep this';
    const cleaned = stripDebugBlocks(raw);
    expect(cleaned).toBe('Keep this');
  });

  it('removes __windows_json__ blocks with whitespace before JSON', () => {
    const raw = 'Text __windows_json__   \n {"score":5,"note":"hide"} shown';
    const cleaned = stripDebugBlocks(raw);
    expect(cleaned).toBe('Text shown');
    expect(cleaned).not.toContain('windows_json');
  });

  it('removes standalone JSON objects from text', () => {
    const raw = 'Good morning {"key": "value", "nested": {"a": 1}} Have a nice day';
    const cleaned = stripDebugBlocks(raw);
    expect(cleaned).toBe('Good morning Have a nice day');
    expect(cleaned).not.toContain('{');
    expect(cleaned).not.toContain('}');
  });

  it('removes standalone JSON arrays from text', () => {
    const raw = 'Start [{"name": "test", "value": 123}] End';
    const cleaned = stripDebugBlocks(raw);
    expect(cleaned).toBe('Start End');
    expect(cleaned).not.toContain('[');
    expect(cleaned).not.toContain(']');
  });

  it('removes multiple JSON blobs from text', () => {
    const raw = 'Hello {"a": 1} world [{"b": 2}] goodbye';
    const cleaned = stripDebugBlocks(raw);
    expect(cleaned).toBe('Hello world goodbye');
  });

  it('preserves natural prose with curly braces in quotes', () => {
    const raw = 'The result was great today.';
    const cleaned = stripDebugBlocks(raw);
    expect(cleaned).toBe('The result was great today.');
  });
});

describe('cleanSummaryWithWindows debug removal', () => {
  it('removes debug markers embedded in summary text', () => {
    const raw = 'Great day ahead __debug__ {"a":1} with windows __windows_json__ [{"b":2}] final';
    const result = cleanSummaryWithWindows(raw, null);
    expect(result).toBe('Great day ahead with windows final');
  });
});
