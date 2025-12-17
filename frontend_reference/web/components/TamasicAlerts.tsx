import Card from '@/components/Card';
import type { DailyAlertData } from '@/types/DailyAlertData';
import { useState } from 'react';

function titleCase(str: string | undefined): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatDate(value: string | undefined): string {
  if (!value) return '';
  const d = new Date(value);
  return isNaN(d.getTime()) ? value : d.toLocaleString();
}

function snakeToTitle(str: string): string {
  return str
    .split('_')
    .filter(Boolean)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(' ');
}

function formatProofEntry(p: unknown): string | null {
  if (typeof p === 'string') return p;
  if (!p || typeof p !== 'object') return null;
  const entry: any = p;
  const parts: string[] = [];
  if (typeof entry.check === 'string') parts.push(snakeToTitle(entry.check));
  if (entry.planet) parts.push(String(entry.planet));
  if (entry.d1_dignity || entry.d9_relation || entry.weak_in_both === true) {
    const dr: string[] = [];
    if (entry.d1_dignity) dr.push(`D1: ${String(entry.d1_dignity)}`);
    if (entry.d9_relation) dr.push(`D9: ${String(entry.d9_relation)}`);
    if (entry.weak_in_both === true) dr.push('weak in D1 & D9');
    parts.push(dr.join(' ; '));
  }
  if (Array.isArray(entry.houses)) {
    const houses = entry.houses
      .filter((h: unknown) => typeof h === 'string' || typeof h === 'number')
      .join(', ');
    parts.push(`Houses: ${houses || 'None'}`);
  }
  if (entry.current_maha !== undefined || entry.current_antara !== undefined) {
    const maha = entry.current_maha ?? 'None';
    const antara = entry.current_antara ?? 'None';
    parts.push(`Maha: ${String(maha)} ; Antara: ${String(antara)}`);
  }
  if (entry.result === true) parts.push('Present');
  else if (entry.result === false) parts.push('Not present');
  else if ('result' in entry) parts.push('None');
  const line = parts.join(' — ').trim();
  return line.length > 0 ? line : null;
}

export default function TamasicAlerts({
  prediction,
}: {
  prediction: DailyAlertData | null;
}) {
  const bm = prediction?.black_magic?.data ?? prediction?.black_magic;
  const tamasic = prediction?.tamasic_summary ?? null;

  const [showAllReasons, setShowAllReasons] = useState(false);
  const [showProof, setShowProof] = useState(false);

  if (bm) {

    const rawScore =
      typeof (bm as any)?.decision?.score === 'number'
        ? (bm as any).decision.score
        : typeof (bm as any)?.risk_score === 'number'
        ? (bm as any).risk_score
        : typeof (bm as any)?.tamasic_vulnerability_score === 'number'
        ? (bm as any).tamasic_vulnerability_score
        : typeof (bm as any)?.vulnerability_score === 'number'
        ? (bm as any).vulnerability_score
        : undefined;
    let score: number | undefined = rawScore;
    if (typeof score === 'number') {
      score = score <= 1 ? score * 10 : score;
      score = Math.min(10, Math.max(0, Math.round(score)));
    }

    const reasons: string[] = Array.isArray(bm.reasons)
      ? (bm.reasons as string[])
      : [];
    const visibleReasons = showAllReasons ? reasons : reasons.slice(0, 5);

    const proofData = (bm as any)?.proof_chain;
    const proofRaw: unknown[] = Array.isArray(proofData)
      ? (proofData as unknown[])
      : [];
    const proofChain = proofRaw
      .map((p) => formatProofEntry(p))
      .filter((p): p is string => Boolean(p));
    const hasProofChain = proofData !== undefined;

    const triad = (bm as any)?.triad || {};
    const triadValue = (k: string) => {
      if (k === 'badhakesh6') return triad.badhakesh6;
      if (k === 'al') return triad.al_confirmed ?? triad.al;
      if (k === 'd30') return triad.d30_confirmed;
      return (triad as any)[k];
    };
    const getTriadIcon = (val: any) => (val === true ? '✅' : val === false ? '❌' : '—');
    const triadChecks = [
      { key: 'badhakesh6', label: 'Bādhakeśa–6th Link' },
      { key: 'al', label: 'Arudha Lagna Confirmation' },
      { key: 'd30', label: 'D-30 Adversity' },
    ];

    const attacker = bm.attacker_profile || {};
    const attackerText = [
      attacker.profession,
      attacker.motive,
      attacker.relationship,
    ]
      .filter(Boolean)
      .join(' • ');

    const policyRaw = bm.policy;
    const policyFlags: string[] = Array.isArray(policyRaw)
      ? policyRaw.filter(
          (p): p is string => typeof p === 'string' && p.trim().length > 0,
        )
      : typeof policyRaw === 'string' && policyRaw.trim().length > 0
      ? [policyRaw.trim()]
      : [];

    const confidence =
      typeof bm.confidence === 'number'
        ? bm.confidence <= 1
          ? Math.round(bm.confidence * 100)
          : Math.round(bm.confidence)
        : undefined;

    return (
      <div className="space-y-4 mb-8">
        <h2 className="text-xl font-bold text-center">🛡️ Black Magic</h2>

        {/* Verdict Strip */}
        <div className="rounded-2xl shadow p-4 border flex flex-wrap items-center justify-between">
          <div className="flex items-center space-x-4">
            {((bm as any)?.decision?.verdict || (bm as any)?.verdict) && (
              <span className="font-semibold">
                {titleCase(
                  ((bm as any).decision?.verdict ?? (bm as any).verdict) as string,
                )}
              </span>
            )}
            {typeof score === 'number' && (
              <div className="w-12 h-12 rounded-full border-2 flex items-center justify-center font-semibold">
                {score}
              </div>
            )}
            {typeof confidence === 'number' && (
              <div
                className="flex flex-col items-center pl-2 min-w-[80px] text-center"
                title="Influence in Life"
                aria-label="Influence in Life"
              >
                <span className="text-[1.25rem] font-semibold leading-[1.1] max-[480px]:text-[1.1rem]">
                  {confidence}%
                </span>
                <span className="text-[0.9rem] font-medium leading-[1.1] mt-1.5 max-[480px]:text-[0.85rem] whitespace-nowrap">
                  Influence in Life
                </span>
              </div>
            )}
          </div>
          {bm.generated_at && (
            <span className="text-xs mt-2 sm:mt-0 text-gray-500">
              {formatDate(bm.generated_at)}
            </span>
          )}
        </div>

        {/* Reasons */}
        {(reasons.length > 0 || hasProofChain) && (
          <div className="rounded-2xl shadow p-4 border">
            {reasons.length > 0 && (
              <div>
                <p className="font-semibold mb-2">Why we think this</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {visibleReasons.map((r, i) => (
                    <li key={i} className="truncate" title={r}>
                      {r}
                    </li>
                  ))}
                </ul>
                {reasons.length > 5 && (
                  <button
                    className="mt-2 text-sm"
                    onClick={() => setShowAllReasons(!showAllReasons)}
                  >
                    {showAllReasons ? 'Show less' : 'Show more'}
                  </button>
                )}
              </div>
            )}
            {hasProofChain && (
              <div className="mt-4">
                <button
                  className="text-sm"
                  onClick={() => setShowProof(!showProof)}
                >
                  {showProof ? 'Hide proof chain' : 'Proof chain (details)'}
                </button>
                {showProof && (
                  proofChain.length > 0 ? (
                    <ul className="list-disc list-inside mt-2 text-sm space-y-1">
                      {proofChain.map((p, i) => (
                        <li key={i} className="truncate" title={p}>
                          {p}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm">None</p>
                  )
                )}
              </div>
            )}
          </div>
        )}

        {/* Triad Checks */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {triadChecks.map(({ key, label }) => (
            <div
              key={key}
              className="rounded-2xl shadow p-2 border flex flex-col items-center justify-center text-sm"
            >
              <span className="mb-1 text-center">{label}</span>
              <span className="text-lg">{getTriadIcon(triadValue(key))}</span>
            </div>
          ))}
        </div>

        {/* Context */}
        {attackerText && (
          <div className="rounded-2xl shadow p-3 border text-sm">
            <p className="font-semibold mb-1">Attacker Profile</p>
            <p>{attackerText}</p>
          </div>
        )}

        {/* Policy */}
        {policyFlags.length > 0 && (
          <div className="rounded-2xl shadow p-4 border">
            <p className="font-semibold mb-2">Policy</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {policyFlags.map((p, i) => (
                <li key={i} className="truncate" title={p}>
                  {p}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  if (!tamasic) {
    return (
      <Card className="breathing-border">
        <p className="text-center">No tamasic summary available.</p>
      </Card>
    );
  }

  const afflictions: string[] = Array.isArray(tamasic.key_afflictions)
    ? tamasic.key_afflictions
    : [];
  const mandi = tamasic.mandi_gulika || {};

  return (
    <Card className="breathing-border space-y-2">
      <h2 className="text-xl font-bold text-center">🛡️ Tamasic Alerts</h2>
      <div className="text-sm space-y-3">
        <div>
          <p className="font-semibold">🔹 Overall Status</p>
          <p>
            {titleCase(tamasic.status)}
            {typeof tamasic.confidence === 'number' && (
              <span className="ml-1 opacity-75">{Math.round(tamasic.confidence * 100)}%</span>
            )}
          </p>
        </div>
        <div>
          <p className="font-semibold">🔹 Key Afflictions &amp; Reasons</p>
          {afflictions.length > 0 ? (
            <ul className="list-disc list-inside">
              {afflictions.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
          ) : (
            <p>—</p>
          )}
        </div>
        <div>
          <p className="font-semibold">🔹 Mandi &amp; Gulika</p>
          <p>
            {`Mandi: House ${mandi.mandi_bhava}${mandi.mandi_rashi ? `, ${mandi.mandi_rashi}` : ''}${mandi.mandi_nakshatra ? `, ${mandi.mandi_nakshatra}` : ''}`}
            {mandi.gulika_house ? ` | Gulika: House ${mandi.gulika_house}` : ''}
          </p>
        </div>
      </div>
    </Card>
  );
}
