import Card from './Card';

interface HouseInfo {
  lord: string;
  house: string;
  notes: string[];
  strength_flag: boolean;
  afflicted_flag: boolean;
}
interface Props {
  houses: Record<string, HouseInfo>;
  psych: { balance_index: number; jupiter_rahu_balance: number };
  lossPressure: { flag: boolean; reasons: string[] };
  redFlags: string[];
  transit?: { reasons?: string[]; risk_blocks?: string[]; sector_boosts?: string[] };
  dasha?: { active_planets?: string[]; involvement?: string[] };
}

const HOUSE_SEQUENCE = ['2', '5', '8', '9', '11', '6', '10', '12'];

function formatJupiterRahu(value: number) {
  if (value > 0) return 'balanced';
  if (value < 0) return 'imbalanced';
  return 'neutral';
}

export default function AdvancedDiagnostics({ houses, psych, lossPressure, redFlags, transit, dasha }: Props) {
  const redFlagCounts = redFlags.reduce<Record<string, number>>((acc, flag) => {
    const key = flag.trim();
    if (!key) return acc;
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
  const redFlagEntries = Object.entries(redFlagCounts);

  return (
    <Card>
      <h3 className="text-lg font-semibold">Advanced Diagnostics</h3>
      <div className="mt-3 space-y-4 text-sm">
        <div className="overflow-x-auto">
          <table className="w-full table-fixed border-collapse text-sm" aria-label="houses-table">
            <thead>
              <tr className="text-left">
                <th className="w-16 border-b border-accent py-2 pr-3">House</th>
                <th className="w-32 border-b border-accent py-2 pr-3">Lord</th>
                <th className="border-b border-accent py-2 pr-3">Placed In</th>
                <th className="w-24 border-b border-accent py-2 pr-3 text-center">Strong</th>
                <th className="w-24 border-b border-accent py-2 text-center">Afflicted</th>
              </tr>
            </thead>
            <tbody>
              {HOUSE_SEQUENCE.map((key) => {
                const detail = houses[key];
                if (!detail) return null;
                return (
                  <tr key={key} className="odd:bg-white/30 even:bg-white/10 dark:odd:bg-gray-900/40 dark:even:bg-gray-900/20">
                    <td className="py-2 pr-3 font-medium">{key}</td>
                    <td className="py-2 pr-3">{detail.lord}</td>
                    <td className="py-2 pr-3">{detail.house}</td>
                    <td className="py-2 pr-3 text-center">{detail.strength_flag ? '✔' : '✗'}</td>
                    <td className="py-2 text-center">{detail.afflicted_flag ? '✔' : '✗'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div>
          <h4 className="font-semibold text-gray-800 dark:text-gray-100">Psychology</h4>
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full border border-accent px-3 py-1 uppercase tracking-wide text-gray-800 dark:border-neon-cyan dark:text-gray-100">
              Balance Index: {psych.balance_index}
            </span>
            <span className="rounded-full border border-accent px-3 py-1 uppercase tracking-wide text-gray-800 dark:border-neon-cyan dark:text-gray-100">
              Jupiter–Rahu: {formatJupiterRahu(psych.jupiter_rahu_balance)}
            </span>
          </div>
        </div>
        {redFlagEntries.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-800 dark:text-gray-100">Red Flags</h4>
            <ul
              data-testid="red-flags-list"
              className="mt-1 list-disc pl-5 text-sm text-red-700 dark:text-red-300"
            >
              {redFlagEntries.map(([flag, count]) => (
                <li key={flag}>
                  {flag}
                  {count > 1 ? ` × ${count}` : ''}
                </li>
              ))}
            </ul>
          </div>
        )}
        {lossPressure.flag && (
          <div>
            <h4 className="font-semibold text-gray-800 dark:text-gray-100">Loss Pressure</h4>
            <ul className="mt-1 list-disc pl-5 text-sm">
              {lossPressure.reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          </div>
        )}
        {transit && (
          <div>
            <h4 className="font-semibold text-gray-800 dark:text-gray-100">Transit</h4>
            {transit.reasons && (
              <ul className="mt-1 list-disc pl-5 text-sm">
                {transit.reasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            )}
          </div>
        )}
        {dasha && (
          <div>
            <h4 className="font-semibold text-gray-800 dark:text-gray-100">Dasha</h4>
            {dasha.active_planets && dasha.active_planets.length > 0 && (
              <div className="text-sm">Active: {dasha.active_planets.join(', ')}</div>
            )}
            {dasha.involvement && dasha.involvement.length > 0 && (
              <div className="text-sm">Involvement: {dasha.involvement.join(', ')}</div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
