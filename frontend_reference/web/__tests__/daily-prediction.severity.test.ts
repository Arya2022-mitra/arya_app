import { mapVariantToSeverity } from '@/lib/cleanSummaryWithWindows';

describe('mapVariantToSeverity', () => {
  it('prefers explicit severity when provided', () => {
    expect(mapVariantToSeverity('inauspicious', 'auspicious')).toBe('inauspicious');
  });

  it('maps category variant to canonical severity', () => {
    expect(mapVariantToSeverity(undefined, 'auspicious')).toBe('auspicious');
    expect(mapVariantToSeverity(undefined, 'inauspicious')).toBe('inauspicious');
    expect(mapVariantToSeverity(undefined, 'neutral')).toBe('neutral');
    expect(mapVariantToSeverity(undefined, 'default')).toBe('neutral');
  });
});
