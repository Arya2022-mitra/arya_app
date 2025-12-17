function formatFromParts(hour: number, minute: number): string | null {
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  if (minute < 0 || minute > 59) return null;
  const safeHour = ((Math.floor(hour) % 24) + 24) % 24;
  const suffix = safeHour >= 12 ? 'PM' : 'AM';
  const hour12 = safeHour % 12 === 0 ? 12 : safeHour % 12;
  return `${hour12.toString().padStart(2, '0')}:${Math.floor(minute)
    .toString()
    .padStart(2, '0')} ${suffix}`;
}

function fromAmPmMatch(match: RegExpExecArray): string | null {
  const hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  const second = match[3] ? parseInt(match[3], 10) : 0;
  if (Number.isNaN(hour) || Number.isNaN(minute) || Number.isNaN(second)) return null;
  if (hour < 1 || hour > 12) return null;
  if (minute < 0 || minute > 59 || second < 0 || second > 59) return null;
  const suffix = match[4].toUpperCase();
  let hour24 = hour % 12;
  if (suffix === 'PM') hour24 += 12;
  return formatFromParts(hour24, minute);
}

function fromTwentyFourHourMatch(match: RegExpExecArray): string | null {
  const hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  const second = match[3] ? parseInt(match[3], 10) : 0;
  if (Number.isNaN(hour) || Number.isNaN(minute) || Number.isNaN(second)) return null;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59 || second < 0 || second > 59) {
    return null;
  }
  return formatFromParts(hour, minute);
}

export function normaliseTimeOfBirth(value: unknown): string | null {
  if (value == null) return null;

  if (value instanceof Date) {
    return formatFromParts(value.getHours(), value.getMinutes());
  }

  if (typeof value === 'string') {
    const raw = value.trim();
    if (!raw) return null;

    const ampmMatch = /^([0-9]{1,2}):([0-9]{2})(?::([0-9]{2}))?\s*([AP]M)$/i.exec(raw);
    if (ampmMatch) {
      const formatted = fromAmPmMatch(ampmMatch);
      if (formatted) return formatted;
    }

    const twentyFourMatch = /^([0-9]{1,2}):([0-9]{2})(?::([0-9]{2}))?$/.exec(raw);
    if (twentyFourMatch) {
      const formatted = fromTwentyFourHourMatch(twentyFourMatch);
      if (formatted) return formatted;
    }

    const parsed = new Date(raw);
    if (!Number.isNaN(parsed.getTime())) {
      return formatFromParts(parsed.getHours(), parsed.getMinutes());
    }
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return formatFromParts(parsed.getHours(), parsed.getMinutes());
    }
  }

  return null;
}

export default normaliseTimeOfBirth;
