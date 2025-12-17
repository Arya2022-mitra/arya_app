import React, { useState, useMemo } from 'react';
import { cleanMarkdownForDisplay } from '@/lib/stripMarkdownSymbols';
import MonthlySpecialDates from './MonthlySpecialDates';
import { useMonthlySpecialDates } from '@/hooks/useMonthlySpecialDates';

interface MonthlySummaryData {
  safe_payload: {
    month_key: string;
    month_name: string;
    overall_score: number;
    verdict: string;
    top_domains: Array<{
      name: string;
      display_name: string;
      score: number;
      outlook: string;
      reason_short: string;
      key_houses: string[];
      key_planets: string[];
    }>;
    weekly_summary: Record<string, {
      score: number;
      outlook: string;
      date_range: string;
    }>;
    key_dates: Array<{
      date: string;
      event: string;
      significance: string;
    }>;
  };
  one_line: string;
  narration: string;
  month_key: string;
  profile_id: number;
  created_at: string;
  locale?: string;
}

interface Props {
  data: MonthlySummaryData | null;
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
}

const getScoreColor = (score: number): string => {
  if (score >= 75) return 'text-emerald-400 border-emerald-500/40';
  if (score >= 50) return 'text-yellow-400 border-yellow-500/40';
  return 'text-rose-400 border-rose-500/40';
};

const getScoreBgColor = (score: number): string => {
  if (score >= 75) return 'bg-emerald-500/20';
  if (score >= 50) return 'bg-yellow-500/20';
  return 'bg-rose-500/20';
};

// Get color for outlook/severity
const getOutlookColor = (outlook: string): string => {
  const lower = outlook?.toLowerCase() || '';
  if (lower.includes('good') || lower.includes('favorable') || lower.includes('positive')) {
    return 'text-emerald-400 bg-emerald-500/20 border-emerald-500/40';
  }
  if (lower.includes('neutral') || lower.includes('moderate')) {
    return 'text-blue-400 bg-blue-500/20 border-blue-500/40';
  }
  if (lower.includes('danger') || lower.includes('challenging') || lower.includes('difficult')) {
    return 'text-rose-400 bg-rose-500/20 border-rose-500/40';
  }
  return 'text-slate-400 bg-slate-500/20 border-slate-500/40';
};

export default function MonthlyDivineSummary({ data, loading, error, onRefresh }: Props) {
  const [showDetails, setShowDetails] = useState(false);

  const safePayload = data?.safe_payload;
  // Strip markdown symbols from one_line display (Fix #2)
  const oneLine = useMemo(() => {
    const raw = data?.one_line || '';
    return cleanMarkdownForDisplay(raw);
  }, [data?.one_line]);

  // Extract special dates (chandrashtama and golden dates) from monthly summary data
  // No API call needed - data is already in the monthly summary
  const specialDates = useMonthlySpecialDates({
    monthlySummaryData: data,
  });

  // Sort weekly summary by key
  const sortedWeeklySummary = useMemo(() => {
    if (!safePayload?.weekly_summary) return [];
    return Object.entries(safePayload.weekly_summary)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => ({ 
        key, 
        ...value,
        // Strip markdown symbols from outlook (Fix #2)
        outlook: cleanMarkdownForDisplay(value.outlook || '')
      }));
  }, [safePayload?.weekly_summary]);

  if (loading) {
    return (
      <div className="rounded-3xl bg-slate-900/60 border border-slate-700/60 shadow-xl p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-700/50 rounded w-3/4"></div>
          <div className="h-4 bg-slate-700/50 rounded w-full"></div>
          <div className="h-4 bg-slate-700/50 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl bg-slate-900/60 border border-rose-700/60 shadow-xl p-8">
        <div className="text-rose-400 mb-4">
          <svg className="w-12 h-12 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-center text-lg">{error}</p>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="mt-4 w-full py-2 px-4 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 rounded-xl border border-rose-500/40 transition-colors"
          >
            Try Again
          </button>
        )}
      </div>
    );
  }

  if (!data || !safePayload) {
    return (
      <div className="rounded-3xl bg-slate-900/60 border border-slate-700/60 shadow-xl p-8">
        <p className="text-slate-400 text-center">No monthly summary available</p>
      </div>
    );
  }

  const overallPct = Math.round(safePayload.overall_score * 100);

  return (
    <div className="space-y-6">
      {/* Hero Section - One Line Summary */}
      <section
        className="rounded-3xl bg-slate-900/60 border border-slate-700/60 shadow-xl p-8"
        role="region"
        aria-label="Monthly Divine Summary"
      >
        <div className="flex items-start justify-between mb-6">
          <h1 className="text-3xl font-semibold text-accent">Monthly Divine Summary</h1>
          <div className={`px-4 py-2 rounded-xl border ${getScoreBgColor(overallPct)} ${getScoreColor(overallPct)}`}>
            <span className="text-2xl font-bold">{overallPct}%</span>
          </div>
        </div>
        
        <p className="text-lg text-slate-100 leading-relaxed mb-6">
          {oneLine}
        </p>

        <div className="flex gap-4">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex-1 py-3 px-6 bg-accent/20 hover:bg-accent/30 text-accent rounded-xl border border-accent/40 transition-colors font-medium"
            aria-expanded={showDetails}
            aria-controls="monthly-details-panel"
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </button>
          
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="py-3 px-6 bg-slate-700/40 hover:bg-slate-700/60 text-slate-200 rounded-xl border border-slate-600/40 transition-colors font-medium"
              aria-label="Refresh monthly summary"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          )}
        </div>
      </section>

      {/* Details Panel */}
      {showDetails && (
        <div
          id="monthly-details-panel"
          className="space-y-6 animate-fadeIn"
          role="region"
          aria-label="Detailed monthly summary"
        >
          {/* Top Domains */}
          {safePayload.top_domains && safePayload.top_domains.length > 0 && (
            <section className="rounded-3xl bg-slate-900/60 border border-slate-700/60 shadow-xl p-6">
              <h2 className="text-2xl font-semibold text-accent mb-4">Top Domains</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {safePayload.top_domains.map((domain) => (
                  <div
                    key={domain.name}
                    className="rounded-2xl bg-slate-950/40 border border-slate-700/50 p-4 flex flex-col gap-3"
                  >
                    <div className="flex items-baseline justify-between">
                      <h3 className="text-lg font-semibold text-slate-100">{domain.display_name}</h3>
                      <span className={`text-xl font-bold ${getScoreColor(domain.score)}`}>
                        {Math.round(domain.score)}%
                      </span>
                    </div>
                    
                    {domain.outlook && (
                      <p className="text-sm text-slate-300 italic">{cleanMarkdownForDisplay(domain.outlook)}</p>
                    )}
                    
                    {domain.reason_short && (
                      <p className="text-sm text-slate-400 leading-relaxed">{cleanMarkdownForDisplay(domain.reason_short)}</p>
                    )}
                    
                    <div className="flex gap-2 flex-wrap mt-2">
                      {Array.isArray(domain.key_planets) && domain.key_planets.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {domain.key_planets.map((planet, i) => (
                            <span key={i} className="px-2 py-1 text-xs bg-purple-500/20 text-purple-300 rounded-lg border border-purple-500/40">
                              {String(planet)}
                            </span>
                          ))}
                        </div>
                      )}
                      {Array.isArray(domain.key_houses) && domain.key_houses.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {domain.key_houses.map((house, i) => (
                            <span key={i} className="px-2 py-1 text-xs bg-sky-500/20 text-sky-300 rounded-lg border border-sky-500/40">
                              H{String(house)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Weekly Summary */}
          {sortedWeeklySummary.length > 0 && (
            <section className="rounded-3xl bg-slate-900/60 border border-slate-700/60 shadow-xl p-6">
              <h2 className="text-2xl font-semibold text-accent mb-4">Weekly Breakdown</h2>
              <div className="space-y-3">
                {sortedWeeklySummary.map(({ key, score, outlook, date_range }) => {
                  // Normalize score to 0-100 range
                  let scorePct = 0;
                  if (typeof score === 'number') {
                    scorePct = score > 1 ? Math.round(score) : Math.round(score * 100);
                  }
                  
                  return (
                    <div
                      key={key}
                      className="rounded-xl bg-slate-950/40 border border-slate-700/50 p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          {/* Week label */}
                          <span className="text-lg font-semibold text-slate-100 block">
                            {key.replace(/week/i, 'Week ').replace(/_/g, ' ')}
                          </span>
                          
                          {/* Date range - same size as week label */}
                          {date_range && (
                            <span className="text-lg text-slate-300 block">
                              {date_range}
                            </span>
                          )}
                        </div>
                        
                        {/* Score and Outlook in boxes on the right */}
                        <div className="flex flex-col gap-2 items-end">
                          {/* Score box */}
                          {typeof score === 'number' && (
                            <div className={`px-3 py-2 rounded-lg border ${getScoreBgColor(scorePct)} ${getScoreColor(scorePct)}`}>
                              <span className="text-lg font-bold">{scorePct}%</span>
                            </div>
                          )}
                          
                          {/* Outlook box with color coding */}
                          {outlook && (
                            <div className={`px-3 py-2 rounded-lg border ${getOutlookColor(outlook)}`}>
                              <span className="text-sm font-medium capitalize">{outlook}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Special Dates (Chandrashtama and Golden dates) - Fix #4 */}
          {specialDates.data && (
            <MonthlySpecialDates
              goldenDates={specialDates.data.golden_dates}
              chandrashtamaDates={specialDates.data.chandrashtama_dates}
              chandrashtamaPeriods={specialDates.data.chandrashtama_periods}
              loading={specialDates.loading}
            />
          )}
          
          {/* Top Domains section remains here - will add special dates section after */}
        </div>
      )}
    </div>
  );
}
