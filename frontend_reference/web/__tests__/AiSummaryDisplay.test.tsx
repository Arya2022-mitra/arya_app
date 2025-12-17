import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import AiSummaryDisplay from '@/components/AiSummaryDisplay';

describe('AiSummaryDisplay', () => {
  it('renders structured time windows with severity and pakshi badges', () => {
    const markup = renderToStaticMarkup(
      <AiSummaryDisplay
        summary="Today brings clarity."
        timeWindows={[
          {
            name: 'Morning Focus',
            category: 'Highly auspicious',
            score: 8.5,
            start_display: '09:00 AM',
            end_display: '10:30 AM',
            pakshi_day: 'Garuda',
          },
        ]}
      />
    );

    expect(markup).toContain('mv-severity--auspicious');
    expect(markup).toContain('mv-pakshi-badge');
    expect(markup).toContain('09:00 AM → 10:30 AM');
  });

  it('uses normalized window data even when HTML is present and falls back for missing times', () => {
    const markup = renderToStaticMarkup(
      <AiSummaryDisplay
        html="<div>Legacy html</div>"
        timeWindows={[
          {
            name: 'Unnamed',
            note: 'Contains __windows_json__ {"night_pakshi":"Peacock","category":"avoid"}',
          },
        ]}
      />
    );

    expect(markup).toContain('mv-severity--inauspicious');
    expect(markup).toContain('--:-- → --:--');
    expect(markup).toContain('Peacock');
  });

  it('hides raw HTML when windows are present unless dev flag is enabled', () => {
    const originalEnv = process.env.NEXT_PUBLIC_DEV_SUMMARY_HTML;
    delete process.env.NEXT_PUBLIC_DEV_SUMMARY_HTML;
    const markup = renderToStaticMarkup(
      <AiSummaryDisplay
        html="<div class='raw-html'>Raw</div>"
        timeWindows={[
          {
            name: 'Window',
            score: 5,
          },
        ]}
      />
    );
    expect(markup).not.toContain('raw-html');
    process.env.NEXT_PUBLIC_DEV_SUMMARY_HTML = originalEnv;
  });

  it('renders cards with consistent header/body/footer structure', () => {
    const markup = renderToStaticMarkup(
      <AiSummaryDisplay
        timeWindows={[
          {
            name: 'Test Window',
            category: 'neutral',
            score: 5,
            start_display: '10:00 AM',
            end_display: '11:00 AM',
            short_desc: 'A test window description',
            pakshi_day: 'Eagle',
          },
        ]}
      />
    );

    // Header: title and time range
    expect(markup).toContain('tw-card__header');
    expect(markup).toContain('tw-card__title');
    expect(markup).toContain('Test Window');
    expect(markup).toContain('10:00 AM → 11:00 AM');

    // Body: summary/description
    expect(markup).toContain('tw-card__summary');
    expect(markup).toContain('A test window description');

    // Footer/meta: score and pakshi badges
    expect(markup).toContain('tw-card__meta');
    expect(markup).toContain('mv-score');
    expect(markup).toContain('mv-pakshi-badge');
    expect(markup).toContain('Eagle');
  });

  it('strips debug markers from short_desc', () => {
    const markup = renderToStaticMarkup(
      <AiSummaryDisplay
        timeWindows={[
          {
            name: 'Debug Test',
            short_desc: 'Normal text __debug__ {"hidden":"data"} more text',
          },
        ]}
      />
    );

    // Should contain the normal text but not the debug marker or JSON
    expect(markup).toContain('Normal text');
    expect(markup).toContain('more text');
    expect(markup).not.toContain('__debug__');
    expect(markup).not.toContain('"hidden"');
    expect(markup).not.toContain('"data"');
  });

  it('applies severity classes for all three variants', () => {
    // Test auspicious
    const auspiciousMarkup = renderToStaticMarkup(
      <AiSummaryDisplay
        timeWindows={[{ name: 'Good', category: 'auspicious', score: 9 }]}
      />
    );
    expect(auspiciousMarkup).toContain('mv-severity--auspicious');

    // Test inauspicious
    const inauspiciousMarkup = renderToStaticMarkup(
      <AiSummaryDisplay
        timeWindows={[{ name: 'Bad', category: 'inauspicious', score: 2 }]}
      />
    );
    expect(inauspiciousMarkup).toContain('mv-severity--inauspicious');

    // Test neutral
    const neutralMarkup = renderToStaticMarkup(
      <AiSummaryDisplay
        timeWindows={[{ name: 'Mixed', category: 'neutral', score: 5 }]}
      />
    );
    expect(neutralMarkup).toContain('mv-severity--neutral');
  });

  it('renders cards grid container', () => {
    const markup = renderToStaticMarkup(
      <AiSummaryDisplay
        timeWindows={[
          { name: 'Window 1' },
          { name: 'Window 2' },
        ]}
      />
    );

    expect(markup).toContain('tw-cards-grid');
  });

  it('shows defaults when score is missing', () => {
    const markup = renderToStaticMarkup(
      <AiSummaryDisplay
        timeWindows={[{ name: 'No Score Window' }]}
      />
    );

    // Score should show default dash
    expect(markup).toContain('-');
    expect(markup).toContain('mv-score--neutral');
  });
});
