import { describe, expect, it } from 'vitest';
import { dedupeSummary } from '@/lib/dedupeSummary';

describe('dedupeSummary', () => {
  it('removes exact consecutive duplicates in safe mode', () => {
    const input = 'Stay observant. Stay observant. Stay observant.';
    const result = dedupeSummary(input);
    expect(result).toBe('Stay observant.');
  });

  it('removes non-consecutive duplicates when using global mode', () => {
    const input = 'Trust your intuition. Remain patient. Trust your intuition.';
    const result = dedupeSummary(input, { mode: 'global' });
    expect(result).toBe('Trust your intuition. Remain patient.');
  });

  it('detects near-duplicates at the default similarity threshold', () => {
    const input = 'Maintain calm focus! Maintain calm focus.';
    const result = dedupeSummary(input);
    expect(result).toBe('Maintain calm focus!');
  });

  it('preserves bullet structure while deduplicating items', () => {
    const input = ['- Take a mindful walk.', '- Take a mindful walk.', '- Hydrate well.'].join('\n');
    const result = dedupeSummary(input);
    expect(result).toBe(['- Take a mindful walk.', '- Hydrate well.'].join('\n'));
  });

  it('collapses repeated mindfulness boilerplate into a single line', () => {
    const input = Array(3)
      .fill('Take ten mindful breaths, journal insights, and let compassion guide every action.')
      .join(' ');
    const result = dedupeSummary(input);
    expect(result).toBe('Take ten mindful breaths, journal insights, and let compassion guide every action.');
  });

  it('preserves paragraph breaks after deduplication', () => {
    const input = ['First paragraph sentence.', '', 'Second paragraph sentence. Second paragraph sentence.'].join('\n');
    const result = dedupeSummary(input);
    expect(result).toBe(['First paragraph sentence.', '', 'Second paragraph sentence.'].join('\n'));
  });
});
