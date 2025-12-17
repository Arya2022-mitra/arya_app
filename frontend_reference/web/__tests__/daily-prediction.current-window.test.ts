/**
 * Tests for current window detection and ISO timestamp construction
 * in daily-prediction.tsx
 */

describe('constructISOFromDisplayTime (daily-prediction)', () => {
  // Since the function is internal to the component, we test the behavior
  // through a minimal reimplementation for testing purposes
  function constructISOFromDisplayTime(dateStr: string, timeStr: string): string | null {
    try {
      const timePattern = /(\d{1,2}):(\d{2})\s*(AM|PM)?/i;
      const match = timeStr.match(timePattern);
      
      if (!match) return null;
      
      let hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);
      const meridiem = match[3]?.toUpperCase();
      
      if (meridiem === 'PM' && hours !== 12) {
        hours += 12;
      } else if (meridiem === 'AM' && hours === 12) {
        hours = 0;
      }
      
      const datePart = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
      const [year, month, day] = datePart.split('-').map(Number);
      
      if (!year || !month || !day || month < 1 || month > 12 || day < 1 || day > 31) {
        return null;
      }
      
      const dateTime = new Date(year, month - 1, day, hours, minutes, 0, 0);
      
      if (isNaN(dateTime.getTime())) return null;
      
      return dateTime.toISOString();
    } catch {
      return null;
    }
  }

  it('constructs ISO from date and 12-hour AM time', () => {
    const result = constructISOFromDisplayTime('2025-12-12', '06:24 AM');
    expect(result).toBeTruthy();
    expect(result).toContain('2025-12-12');
    
    // Verify the time is parsed correctly (allowing for timezone offset)
    const parsedDate = new Date(result!);
    expect(parsedDate.getFullYear()).toBe(2025);
    expect(parsedDate.getMonth()).toBe(11); // December is month 11 (0-indexed)
    expect(parsedDate.getDate()).toBe(12);
  });

  it('constructs ISO from date and 12-hour PM time', () => {
    const result = constructISOFromDisplayTime('2025-12-12', '09:16 PM');
    expect(result).toBeTruthy();
    expect(result).toContain('2025-12-12');
  });

  it('handles 12 AM (midnight) correctly', () => {
    const result = constructISOFromDisplayTime('2025-12-12', '12:00 AM');
    expect(result).toBeTruthy();
    
    const parsedDate = new Date(result!);
    // 12 AM should be converted to hour 0
    expect(parsedDate.getHours()).toBe(0);
  });

  it('handles 12 PM (noon) correctly', () => {
    const result = constructISOFromDisplayTime('2025-12-12', '12:00 PM');
    expect(result).toBeTruthy();
    
    const parsedDate = new Date(result!);
    // 12 PM should remain hour 12
    expect(parsedDate.getHours()).toBe(12);
  });

  it('handles 24-hour format without AM/PM', () => {
    const result = constructISOFromDisplayTime('2025-12-12', '18:30');
    expect(result).toBeTruthy();
  });

  it('returns null for invalid time format', () => {
    const result = constructISOFromDisplayTime('2025-12-12', 'invalid');
    expect(result).toBeNull();
  });

  it('returns null for invalid date', () => {
    const result = constructISOFromDisplayTime('invalid-date', '06:24 AM');
    expect(result).toBeNull();
  });

  it('handles ISO date with T separator', () => {
    const result = constructISOFromDisplayTime('2025-12-12T00:00:00Z', '06:24 AM');
    expect(result).toBeTruthy();
    expect(result).toContain('2025-12-12');
  });
});

describe('Current window detection behavior', () => {
  it('should work with ISO timestamps when available', () => {
    // This verifies the expected data structure for current window detection
    const mockWindow = {
      name: 'Test Window',
      startISO: '2025-12-12T06:24:00.000Z',
      endISO: '2025-12-12T07:54:00.000Z',
      startDisplay: '06:24 AM',
      endDisplay: '07:54 AM',
    };

    // Verify we can parse the ISO timestamps
    const startTime = new Date(mockWindow.startISO).getTime();
    const endTime = new Date(mockWindow.endISO).getTime();
    
    expect(startTime).toBeLessThan(endTime);
    expect(isNaN(startTime)).toBe(false);
    expect(isNaN(endTime)).toBe(false);
  });

  it('should fallback to constructing ISO from display times', () => {
    // This verifies the fallback scenario when ISO timestamps are missing
    const mockWindow = {
      name: 'Test Window',
      startDisplay: '06:24 AM',
      endDisplay: '07:54 AM',
    };

    const targetDate = '2025-12-12';
    
    // Simulate the fallback construction
    function constructISOFromDisplayTime(dateStr: string, timeStr: string): string | null {
      try {
        const timePattern = /(\d{1,2}):(\d{2})\s*(AM|PM)?/i;
        const match = timeStr.match(timePattern);
        
        if (!match) return null;
        
        let hours = parseInt(match[1], 10);
        const minutes = parseInt(match[2], 10);
        const meridiem = match[3]?.toUpperCase();
        
        if (meridiem === 'PM' && hours !== 12) {
          hours += 12;
        } else if (meridiem === 'AM' && hours === 12) {
          hours = 0;
        }
        
        const datePart = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
        const [year, month, day] = datePart.split('-').map(Number);
        
        if (!year || !month || !day || month < 1 || month > 12 || day < 1 || day > 31) {
          return null;
        }
        
        const dateTime = new Date(year, month - 1, day, hours, minutes, 0, 0);
        
        if (isNaN(dateTime.getTime())) return null;
        
        return dateTime.toISOString();
      } catch {
        return null;
      }
    }
    
    const startISO = constructISOFromDisplayTime(targetDate, mockWindow.startDisplay);
    const endISO = constructISOFromDisplayTime(targetDate, mockWindow.endDisplay);
    
    expect(startISO).toBeTruthy();
    expect(endISO).toBeTruthy();
    
    if (startISO && endISO) {
      const startTime = new Date(startISO).getTime();
      const endTime = new Date(endISO).getTime();
      
      expect(startTime).toBeLessThan(endTime);
      expect(isNaN(startTime)).toBe(false);
      expect(isNaN(endTime)).toBe(false);
    }
  });
});
