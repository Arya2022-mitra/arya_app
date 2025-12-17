import { describe, expect, it } from 'vitest';
import { formatSelectedSummary, selectSummarySource } from '@/utils/selectSummarySource';
import type { NormalizedTimeWindow } from '@/lib/cleanSummaryWithWindows';

describe('summary source selection', () => {
  it('prefers structured summary sections from AI layers when available', () => {
    const selection = selectSummarySource({
      aiSummaryData: {
        summary_metadata: {
          layers: {
            summary: { overall: 'Overall guidance', health: 'Health note', money: 'Money insights' },
          },
        },
      },
      daySummary: 'Fallback overall summary that should not be used in this scenario.',
    });

    expect(selection.source).toBe('summary_metadata');
    expect(selection.structured).toEqual({
      overall: 'Overall guidance',
      health: 'Health note',
      money: 'Money insights',
    });
    expect(selection.text).toBeNull();
  });

  it('accepts structured summary from debug layers when summary_metadata is missing', () => {
    const selection = selectSummarySource({
      aiSummaryData: {
        debug: {
          layers: {
            summary: { overall: 'Debug overall guidance', health: 'Debug health guidance' },
          },
        },
      },
      daySummary: 'Day API text should not be used when structured exists.',
    });

    expect(selection.source).toBe('summary_metadata');
    expect(selection.structured).toEqual({ overall: 'Debug overall guidance', health: 'Debug health guidance' });
  });

  it('falls back to Day API summary when AI metadata is absent', () => {
    const selection = selectSummarySource({
      aiSummaryData: null,
      daySummary: 'Day API overall summary that should be selected when metadata is missing entirely.',
    });

    expect(selection.source).toBe('day_api');
    expect(selection.text).toContain('Day API overall summary');
  });

  it('uses Day API summary when AI summary is empty', () => {
    const selection = selectSummarySource({
      aiSummaryData: {
        summary_metadata: {
          layers: {
            summary: { text: '   ' },
          },
        },
        summary: '   ',
      },
      daySummary: 'Usable day summary fallback with enough length to pass validation.',
    });

    expect(selection.source).toBe('day_api');
    expect(selection.text).toContain('Usable day summary fallback');
  });

  it('prefers AI html/text over Day API when unstructured content is present', () => {
    const selection = selectSummarySource({
      aiSummaryData: {
        html: '<p>AI HTML summary content with details.</p>',
        summary_metadata: {
          layers: {
            summary: { text: 'AI text summary that should win over day API.' },
          },
        },
      },
      daySummary: 'Day summary present but lower priority.',
    });

    expect(selection.source).toBe('summary_metadata');
    expect(selection.text).toContain('AI text summary');
  });

  it('expands time window tokens only inside the selected summary text', () => {
    const selection = selectSummarySource({
      aiSummaryData: {
        summary_metadata: {
          layers: {
            summary: { text: 'The key guidance is in time_windows[0] for the morning.' },
          },
        },
      },
      daySummary: 'Alternate day summary mentioning time_windows[0] but should be ignored.',
    });

    const windows: NormalizedTimeWindow[] = [
      {
        name: 'Window 1',
        startDisplay: '09:00 AM',
        endDisplay: '10:30 AM',
      } as NormalizedTimeWindow,
    ];

    const formatted = formatSelectedSummary(selection, windows, { useAmpm: true, slotMinutes: 90 });

    expect(formatted).toContain('09:00 AM');
    expect(formatted).not.toContain('Alternate day summary');
  });
});
