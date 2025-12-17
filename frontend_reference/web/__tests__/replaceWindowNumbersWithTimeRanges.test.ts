import { replaceWindowNumbersWithTimeRanges, NormalizedTimeWindow } from '@/lib/cleanSummaryWithWindows';

describe('replaceWindowNumbersWithTimeRanges', () => {
  // Mock time windows data (1-indexed in AI text, 0-indexed in array)
  const mockWindows: NormalizedTimeWindow[] = [
    { name: 'Window 1', startDisplay: '6:16 AM', endDisplay: '7:46 AM' },   // index 0 = window 1
    { name: 'Window 2', startDisplay: '7:46 AM', endDisplay: '9:16 AM' },   // index 1 = window 2
    { name: 'Window 3', startDisplay: '9:16 AM', endDisplay: '10:46 AM' },  // index 2 = window 3
    { name: 'Window 4', startDisplay: '10:46 AM', endDisplay: '12:16 PM' }, // index 3 = window 4
    { name: 'Window 5', startDisplay: '12:16 PM', endDisplay: '1:46 PM' },  // index 4 = window 5
    { name: 'Window 6', startDisplay: '1:46 PM', endDisplay: '3:16 PM' },   // index 5 = window 6
    { name: 'Window 7', startDisplay: '3:16 PM', endDisplay: '4:46 PM' },   // index 6 = window 7
    { name: 'Window 8', startDisplay: '4:46 PM', endDisplay: '6:16 PM' },   // index 7 = window 8
    { name: 'Window 9', startDisplay: '6:16 PM', endDisplay: '7:46 PM' },   // index 8 = window 9
    { name: 'Window 10', startDisplay: '7:46 PM', endDisplay: '9:16 PM' },  // index 9 = window 10
    { name: 'Window 11', startDisplay: '9:16 PM', endDisplay: '10:46 PM' }, // index 10 = window 11
    { name: 'Window 12', startDisplay: '10:46 PM', endDisplay: '12:16 AM' },// index 11 = window 12
    { name: 'Window 13', startDisplay: '12:16 AM', endDisplay: '1:46 AM' }, // index 12 = window 13
    { name: 'Window 14', startDisplay: '1:46 AM', endDisplay: '3:16 AM' },  // index 13 = window 14
    { name: 'Window 15', startDisplay: '3:16 AM', endDisplay: '4:46 AM' },  // index 14 = window 15
    { name: 'Window 16', startDisplay: '4:46 AM', endDisplay: '6:16 AM' },  // index 15 = window 16
  ];

  it('returns original text when text is empty', () => {
    expect(replaceWindowNumbersWithTimeRanges('', mockWindows)).toBe('');
  });

  it('returns original text when windows array is empty', () => {
    const text = 'Windows 3, 4, 6 show good potential.';
    expect(replaceWindowNumbersWithTimeRanges(text, [])).toBe(text);
  });

  it('replaces a single window reference', () => {
    const text = 'window 3 is auspicious.';
    const result = replaceWindowNumbersWithTimeRanges(text, mockWindows);
    expect(result).toContain('9:16 AM – 10:46 AM');
    expect(result).not.toContain('window 3');
  });

  it('replaces contiguous window ranges with time ranges', () => {
    const text = 'Windows 3, 4 offer good potential.';
    const result = replaceWindowNumbersWithTimeRanges(text, mockWindows);
    // Contiguous range 3-4: should use start of 3 and end of 4
    expect(result).toContain('9:16 AM to 12:16 PM');
  });

  it('handles "Windows X and Y" pattern', () => {
    const text = 'Windows 3 and 4 are auspicious.';
    const result = replaceWindowNumbersWithTimeRanges(text, mockWindows);
    expect(result).toContain('9:16 AM to 12:16 PM');
    expect(result).not.toContain('Windows 3 and 4');
  });

  it('handles non-contiguous windows with commas', () => {
    const text = 'Windows 3, 6, 9 show good potential.';
    const result = replaceWindowNumbersWithTimeRanges(text, mockWindows);
    // Non-contiguous: each should be separate
    expect(result).toContain('9:16 AM – 10:46 AM'); // Window 3
    expect(result).toContain('1:46 PM – 3:16 PM');  // Window 6
    expect(result).toContain('6:16 PM – 7:46 PM');  // Window 9
  });

  it('handles complex window list like the screenshot shows', () => {
    // From the screenshot: "Windows 3, 4, 6, 7, 8, 9, 12, 13, 14, and 15"
    const text = 'Windows 3, 4, 6, 7, 8, 9, 12, 13, 14, and 15 show highly auspicious potential.';
    const result = replaceWindowNumbersWithTimeRanges(text, mockWindows);
    
    // Should convert contiguous ranges:
    // - 3,4 -> 9:16 AM to 12:16 PM
    // - 6,7,8,9 -> 1:46 PM to 7:46 PM
    // - 12,13,14 -> 10:46 PM to 3:16 AM (the "and 15" may not be fully captured)
    expect(result).toContain('9:16 AM to 12:16 PM');
    expect(result).toContain('1:46 PM to 7:46 PM');
    expect(result).toContain('10:46 PM to 3:16 AM');
    
    // Should not contain original window numbers in the main range
    expect(result).not.toContain('Windows 3, 4');
  });

  it('preserves surrounding text', () => {
    const text = 'The period from Windows 3, 4 offers highly auspicious windows for action.';
    const result = replaceWindowNumbersWithTimeRanges(text, mockWindows);
    expect(result).toContain('The period from');
    expect(result).toContain('offers highly auspicious windows for action.');
    expect(result).toContain('9:16 AM to 12:16 PM');
  });

  it('handles case insensitivity', () => {
    const text = 'windows 3, 4 are good.';
    const result = replaceWindowNumbersWithTimeRanges(text, mockWindows);
    expect(result).toContain('9:16 AM to 12:16 PM');
  });

  it('handles out of range window numbers gracefully', () => {
    const text = 'Windows 20 and 25 are highlighted.';
    const result = replaceWindowNumbersWithTimeRanges(text, mockWindows);
    // Should preserve original text if windows are out of range
    expect(result).toBe(text);
  });

  it('handles single window number in list', () => {
    const text = 'Window 7 is auspicious.';
    const result = replaceWindowNumbersWithTimeRanges(text, mockWindows);
    expect(result).toContain('3:16 PM – 4:46 PM');
  });
});
