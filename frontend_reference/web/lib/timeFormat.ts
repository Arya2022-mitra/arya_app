export function safeRender(value: any, fallback: string = '—'): string {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (Array.isArray(value)) return value.map((v) => safeRender(v, fallback)).join(' — ');
  if (typeof value === 'object' && typeof value.text === 'string') return value.text;
  return fallback;
}

export function formatDateTime(dateStr: string, timeStr: string): string {
  const date = new Date(`${dateStr}T00:00:00`);
  const formattedDate = date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  return `${formattedDate} ${timeStr}`;
}

export function formatTimeRange(value: any, fallback: string = '—'): string {
  if (value === null || value === undefined) return fallback;
  if (Array.isArray(value)) {
    const formatted = value.map((v) => formatTimeRange(v, fallback)).filter(Boolean);
    return formatted.length ? formatted.join(' | ') : fallback;
  }
  if (typeof value === 'object' && ('start' in value || 'end' in value)) {
    const rawStart = value.start;
    const rawEnd = value.end;
    const start = formatTimeString(rawStart, '');
    const end = formatTimeString(rawEnd, '');
    const sep = start && end ? ' – ' : '';
    return start || end ? `${start}${sep}${end}` : fallback;
  }
  return safeRender(value, fallback);
}

export function formatTimeString(
  value: string | null | undefined,
  fallback: string = '—',
): string {
  if (!value) return fallback;
  const raw = value.trim();

  // 1) ISO / full datetime strings
  const asDate = new Date(raw);
  if (!isNaN(asDate.getTime())) {
    return asDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'UTC',
    });
  }

  // 2) 24-hour "HH:MM[:SS]"
  let m = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(raw);
  if (m && !/[ap]m/i.test(raw)) {
    const h = parseInt(m[1], 10);
    const min = parseInt(m[2], 10);
    const d = new Date(Date.UTC(1970, 0, 1, h, min));
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'UTC' });
  }

  // 3) 12-hour "H:MM AM/PM" (what backend sends)
  m = /^(\d{1,2}):(\d{2})\s*([AP]M)$/i.exec(raw);
  if (m) {
    let h = parseInt(m[1], 10);
    const min = parseInt(m[2], 10);
    const ap = m[3].toUpperCase();
    if (ap === 'PM' && h !== 12) h += 12;
    if (ap === 'AM' && h === 12) h = 0;
    const d = new Date(Date.UTC(1970, 0, 1, h, min));
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'UTC' });
  }

  return fallback;
}

export function formatTimeBlock(value: any, fallback: string = '—'): string {
  if (value === null || value === undefined) return fallback;
  if (Array.isArray(value)) {
    const items = value.map((v) => formatTimeBlock(v, fallback)).filter(Boolean);
    return items.length ? items.join(' | ') : fallback;
  }
  if (typeof value === 'object') {
    if ('start' in value || 'end' in value) {
      return formatTimeRange(value, fallback);
    }
    const entries = Object.entries(value).map(([k, v]) => {
      const val = formatTimeBlock(v, fallback);
      return `${k}: ${val}`;
    });
    return entries.length ? entries.join(' | ') : fallback;
  }
  return safeRender(value, fallback);
}

export function formatChoghadiya(value: any, fallback: string = '—'): string {
  if (!value) return fallback;
  if (Array.isArray(value)) {
    const items = value
      .map((slot) => {
        if (!slot || typeof slot !== 'object') return null;
        const name = safeRender(slot.name, '');
        const time = formatTimeRange(
          { start: slot.start, end: slot.end },
          '',
        );
        return name ? `${name} ${time}`.trim() : time;
      })
      .filter(Boolean);
    return items.length ? items.join(' | ') : fallback;
  }
  if (typeof value === 'object') {
    const day = formatChoghadiya(value.day, '');
    const night = formatChoghadiya(value.night, '');
    const parts = [] as string[];
    if (day) parts.push(day);
    if (night) parts.push(night);
    return parts.length ? parts.join(' | ') : fallback;
  }
  return safeRender(value, fallback);
}
