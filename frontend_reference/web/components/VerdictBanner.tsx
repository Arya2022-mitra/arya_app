import Card from './Card';

interface Props {
  finalVerdict?: 'BUY_WINDOW' | 'CAUTION' | 'DO_NOT_TRADE';
  adviceNote?: string | null;
  blockedBy?: string[];
}

export const UNKNOWN_VERDICT_STYLE =
  'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';

const verdictStyles: Record<string, string> = {
  BUY_WINDOW: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  CAUTION: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  DO_NOT_TRADE: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  UNKNOWN: UNKNOWN_VERDICT_STYLE,
};

export default function VerdictBanner({ finalVerdict, adviceNote, blockedBy = [] }: Props) {
  const verdictKey = finalVerdict ?? 'UNKNOWN';
  return (
    <Card className={verdictStyles[verdictKey]}>
      <h2 className="text-xl font-bold">
        {finalVerdict ? finalVerdict.replace('_', ' ') : 'UNKNOWN'}
      </h2>
      {adviceNote && <p className="mt-1">{adviceNote}</p>}
      {blockedBy.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {blockedBy.map((b) => (
            <span
              key={b}
              className="bg-gray-200 dark:bg-gray-700 rounded px-2 py-1 text-sm"
            >
              {b}
            </span>
          ))}
        </div>
      )}
    </Card>
  );
}
