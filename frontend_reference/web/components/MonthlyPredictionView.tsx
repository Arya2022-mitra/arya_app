import { useMemo } from 'react';

interface MonthlyPredictionViewProps {
  fusion: any;
  narration: string;
}

const sectionExtractor = (narration: string, heading: string) => {
  if (!narration) return '';
  const pattern = new RegExp(`### ${heading}\\n([\\s\\S]*?)(?=\n### |$)`);
  const match = narration.match(pattern);
  if (match && match[1]) {
    return match[1].trim();
  }
  return '';
};

const formatWeekLabel = (key: string) => {
  return key.replace(/week/i, 'Week ');
};

const toneBadgeClass = (tone: string) => {
  switch (tone) {
    case 'opportunity':
      return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40';
    case 'challenge':
      return 'bg-rose-500/20 text-rose-300 border border-rose-500/40';
    default:
      return 'bg-sky-500/20 text-sky-200 border border-sky-500/40';
  }
};

const MonthlyPredictionView = ({ fusion, narration }: MonthlyPredictionViewProps) => {
  const openingTheme = useMemo(() => sectionExtractor(narration, 'Opening Theme'), [narration]);
  const closingGuidance = useMemo(() => sectionExtractor(narration, 'Closing Guidance'), [narration]);

  const domainEntries = useMemo(() => {
    if (!fusion?.domains || typeof fusion.domains !== 'object') return [];
    return Object.entries(fusion.domains).map(([key, value]: any) => ({ key, value }));
  }, [fusion]);

  const weeklyEntries = useMemo(() => {
    if (!fusion?.weekly_breakdown || typeof fusion.weekly_breakdown !== 'object') return [];
    return Object.entries(fusion.weekly_breakdown).map(([key, value]: any) => ({ key, value }));
  }, [fusion]);

  const keyDates = Array.isArray(fusion?.key_dates) ? fusion.key_dates : [];

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-slate-900/60 border border-slate-700/60 shadow-xl p-8">
        <h1 className="text-3xl font-semibold text-accent mb-4">Monthly Divine Summary</h1>
        <p className="text-slate-100 leading-relaxed whitespace-pre-line">
          {openingTheme || fusion?.monthly_theme || 'Monthly cadence awaiting synthesis.'}
        </p>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-6">
        <div className="space-y-6">
          <section className="rounded-3xl bg-slate-900/60 border border-slate-700/60 shadow-xl p-6">
            <h2 className="text-2xl font-semibold text-accent mb-4">Domain Guidance</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {domainEntries.map(({ key, value }) => {
                const projection = value || {};
                const effective = projection?.effective_probability ?? projection?.effectiveProbability;
                const weights = projection?.weights || {};
                const outcomes = Array.isArray(projection?.outcomes) ? projection.outcomes : [];
                return (
                  <div
                    key={key}
                    className="rounded-2xl bg-slate-950/40 border border-slate-700/50 p-4 flex flex-col gap-3"
                  >
                    <div className="flex items-baseline justify-between">
                      <h3 className="text-lg font-semibold text-slate-100">{key.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}</h3>
                      <span className="text-accent text-sm">{effective ? `${Math.round(effective * 100)}%` : '—'}</span>
                    </div>
                    <div className="text-xs text-slate-400 grid grid-cols-3 gap-2">
                      <div>
                        <p className="text-slate-500">Dasha</p>
                        <p>{weights.dasha ? Math.round(weights.dasha * 100) / 100 : '—'}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Transit</p>
                        <p>{weights.transit ? Math.round(weights.transit * 100) / 100 : '—'}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Strength</p>
                        <p>{weights.strength ? Math.round(weights.strength * 100) / 100 : '—'}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {outcomes.slice(0, 3).map((outcome: any) => (
                        <div key={outcome?.name} className="rounded-xl bg-slate-900/60 border border-slate-800/60 p-3">
                          <p className="text-sm font-medium text-slate-100">
                            {outcome?.name}{' '}
                            {typeof outcome?.probability === 'number' && (
                              <span className="text-accent">({Math.round(outcome.probability * 100)}%)</span>
                            )}
                          </p>
                          <p className="text-xs text-slate-400 leading-relaxed">
                            {outcome?.narrative || 'Hold steady awareness and observe subtle signals.'}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-3xl bg-slate-900/60 border border-slate-700/60 shadow-xl p-6">
            <h2 className="text-2xl font-semibold text-accent mb-4">Weekly Timeline</h2>
            <div className="space-y-4">
              {weeklyEntries.map(({ key, value }) => (
                <div key={key} className="rounded-2xl bg-slate-950/50 border border-slate-700/50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-slate-100">{formatWeekLabel(key)}</h3>
                    <span className={`text-xs px-3 py-1 rounded-full ${toneBadgeClass(value?.tone || '')}`}>
                      {value?.tone || 'integrate'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mb-2">
                    {value?.start} – {value?.end}
                  </p>
                  <p className="text-sm text-slate-200 leading-relaxed">{value?.guidance}</p>
                  {Array.isArray(value?.spotlight_domains) && (
                    <p className="text-xs text-slate-400 mt-2">
                      Spotlight: {value.spotlight_domains.map((d: string) => d.replace(/_/g, ' ')).join(', ')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="rounded-3xl bg-slate-900/60 border border-slate-700/60 shadow-xl p-6 h-fit">
          <h2 className="text-2xl font-semibold text-accent mb-4">Key Dates & Windows</h2>
          <div className="space-y-3">
            {keyDates.map((entry: any, idx: number) => (
              <div key={`${entry.date}-${idx}`} className="rounded-2xl bg-slate-950/50 border border-slate-800/60 p-3">
                <p className="text-sm font-semibold text-slate-100">{entry?.date}</p>
                <p className="text-xs text-accent">{entry?.window}</p>
                <p className="text-xs text-slate-400 leading-relaxed mt-1">
                  {entry?.notes || 'Stay observant and anchor intentions.'}
                </p>
              </div>
            ))}
            {!keyDates.length && (
              <p className="text-sm text-slate-400">Awaiting monthly data — check back after the fusion engine completes.</p>
            )}
          </div>
        </aside>
      </div>

      <section className="rounded-3xl bg-slate-900/60 border border-slate-700/60 shadow-xl p-8">
        <h2 className="text-2xl font-semibold text-accent mb-4">Closing Divine Guidance</h2>
        <p className="text-slate-100 leading-relaxed whitespace-pre-line">
          {closingGuidance || 'Return to breath, mantra, and compassionate action to align with the cosmic weave.'}
        </p>
      </section>
    </div>
  );
};

export default MonthlyPredictionView;
