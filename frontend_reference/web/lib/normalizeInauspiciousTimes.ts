import type { Inauspicious } from '@/types';

function formatTime(t: unknown): string {
  if (typeof t !== 'string') t = String(t ?? '');
  const match = (t as string).match(/\d{1,2}:\d{2}/);
  return match ? match[0] : '';
}

export function normalizeInauspiciousTimes(input: unknown): Inauspicious[] {
  if (!Array.isArray(input)) return [];
  return (input as any[])
    .map((w) => {
      const start = formatTime(w?.start);
      const end = formatTime(w?.end);
      if (!start || !end) return null;
      const item: Inauspicious = { start, end };
      if (w?.type) item.type = String(w.type);
      return item;
    })
    .filter(Boolean) as Inauspicious[];
}
