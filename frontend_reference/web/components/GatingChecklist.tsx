import Card from './Card';
import type { Gating } from '@/types';

const DEFAULT_GATING: Gating = {
  natal_promise_pass: false,
  dasha_pass: false,
  gochar_pass: false,
};

interface Props {
  gating?: Gating;
  reasons?: string[];
  natalContraindications?: string[];
}

export default function GatingChecklist({
  gating = DEFAULT_GATING,
  reasons = [],
  natalContraindications = [],
}: Props) {
  const items = [
    { key: 'natal', label: 'Natal Promise', value: gating.natal_promise_pass },
    { key: 'dasha', label: 'Dasha', value: gating.dasha_pass },
    { key: 'gochar', label: 'Gochar', value: gating.gochar_pass },
  ];
  const formattedReasons = reasons.map((r) => r.replace(/_/g, ' '));

  return (
    <Card>
      <h3 className="text-lg font-semibold">Gating</h3>
      <div className="mt-3 flex flex-wrap items-center gap-6 text-sm" aria-label="gating-checklist">
        {items.map((item) => {
          const content = (
            <div className="flex items-center gap-2">
              <span className={`text-lg ${item.value ? 'text-green-600' : 'text-red-600'}`}>
                {item.value ? '✓' : '✗'}
              </span>
              <span className="font-medium text-gray-800 dark:text-gray-100">{item.label}</span>
            </div>
          );

          if (item.key !== 'gochar' || formattedReasons.length === 0) {
            return (
              <div key={item.key} className="flex items-center gap-2" aria-label={`${item.label}: ${item.value}`}>
                {content}
              </div>
            );
          }

          return (
            <div
              key={item.key}
              className="relative flex items-center gap-2 group"
              aria-label={`${item.label}: ${item.value}`}
            >
              {content}
              <button
                type="button"
                className="h-5 w-5 rounded-full border border-accent dark:border-neon-cyan text-xs text-gray-700 dark:text-gray-200"
                aria-label="Gochar reasons"
              >
                ?
              </button>
              <div className="pointer-events-none absolute left-1/2 top-full z-10 hidden w-60 -translate-x-1/2 rounded bg-gray-900 p-3 text-xs text-white shadow-lg group-hover:block group-focus-within:block">
                <p className="font-semibold text-accent">Transit factors</p>
                <ul className="mt-1 space-y-1">
                  {formattedReasons.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
      {!gating.natal_promise_pass && natalContraindications.length > 0 && (
        <div className="mt-3 text-xs text-red-700 dark:text-red-300">
          <span className="font-semibold">Natal Contraindications:</span>{' '}
          {natalContraindications.join(', ')}
        </div>
      )}
    </Card>
  );
}
