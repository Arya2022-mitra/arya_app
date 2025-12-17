import Card from './Card';

interface EntryWindow {
  date: string;
  start?: string;
  end?: string;
  state?: string;
}

interface Props {
  intradayWindows?: EntryWindow[];
  longWindows?: EntryWindow[];
}

function renderWindowLabel(win: EntryWindow) {
  const range = win.start && win.end ? `${win.start} – ${win.end}` : '—';
  const stateLabel = win.state ? ` · ${win.state}` : '';
  return `${win.date} — ${range}${stateLabel}`;
}

export default function EntryWindowsPanel({
  intradayWindows = [],
  longWindows = [],
}: Props) {
  return (
    <Card>
      <h3 className="text-lg font-semibold">Entry Windows</h3>
      <div className="mt-3 space-y-4 text-sm">
        <div>
          <p className="font-medium text-gray-700 dark:text-gray-200">
            Intraday Entry Windows (Eating)
          </p>
          <div
            data-testid="entry-intraday"
            className="mt-2 space-y-2"
          >
            {intradayWindows.length === 0 ? (
              <span className="text-gray-500 dark:text-gray-400">No intraday windows.</span>
            ) : (
              intradayWindows.map((win, idx) => (
                <div
                  key={`${win.date}-${win.start}-${idx}`}
                  className="rounded border border-accent dark:border-neon-cyan px-3 py-1 text-xs uppercase tracking-wide"
                >
                  {renderWindowLabel(win)}
                </div>
              ))
            )}
          </div>
        </div>
        <div>
          <p className="font-medium text-gray-700 dark:text-gray-200">
            Swing/Long Entry Windows (Ruling &amp; Walking)
          </p>
          <div
            data-testid="entry-long"
            className="mt-2 space-y-2"
          >
            {longWindows.length === 0 ? (
              <span className="text-gray-500 dark:text-gray-400">No long windows.</span>
            ) : (
              longWindows.map((win, idx) => (
                <div
                  key={`${win.date}-${win.start}-${idx}`}
                  className="rounded border border-accent dark:border-neon-cyan px-3 py-1 text-xs uppercase tracking-wide"
                >
                  {renderWindowLabel(win)}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

