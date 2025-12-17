import Card from './Card';
import { normalizeWindow, intersectWindow, minutesToHHMM } from '@/utils/time';

interface WindowItem {
  start: string;
  end: string;
  ruler?: string;
  reasons?: string[];
}
interface Props {
  timings?: { start: string; end: string };
  buyWindows?: WindowItem[];
}

export default function ExecutionTiming({ timings, buyWindows = [] }: Props) {
  const market = timings ? normalizeWindow(timings.start, timings.end) : null;
  const normalized = buyWindows
    .map((w) => ({ ...w, ...normalizeWindow(w.start, w.end) }))
    .sort((a, b) => a.start - b.start);

  return (
    <Card>
      <h3 className="text-lg font-semibold">Execution Timing</h3>
      {market ? (
        <div className="mt-2 mb-4">
          <span className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">
            Market: {minutesToHHMM(market.start)} - {minutesToHHMM(market.end % (24 * 60))}
          </span>
        </div>
      ) : (
        <p className="mt-2 mb-4 text-sm">No market timings.</p>
      )}
      {normalized.length === 0 && <p className="text-sm">No buy windows.</p>}
      <ul className="space-y-2">
        {normalized.map((w, idx) => {
          const overlap = market ? intersectWindow({ start: w.start, end: w.end }, market) : null;
          return (
            <li key={idx} className="border-l pl-2">
              <div>
                {minutesToHHMM(w.start)} - {minutesToHHMM(w.end % (24 * 60))}
                {w.crossMidnight && <span className="text-xs text-gray-500"> (next day)</span>}
              </div>
              {overlap && (
                <div className="text-xs text-green-700">
                  In-Market {minutesToHHMM(overlap.start)} - {minutesToHHMM(overlap.end % (24 * 60))}
                </div>
              )}
              {w.reasons && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {w.reasons.map((r) => (
                    <span key={r} className="text-xs bg-gray-200 dark:bg-gray-700 rounded px-1">
                      {r}
                    </span>
                  ))}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
