import React from 'react';

interface GoldenWindow {
  start?: string;
  end?: string;
  start_time?: string;
  end_time?: string;
  state?: string;
  score?: number;
}

interface GoldenDate {
  date: string;
  start_time?: string;
  end_time?: string;
  score?: number;
  reasons?: Record<string, boolean>;
  windows?: GoldenWindow[];
}

interface ChandrashtamaDate {
  date?: string;
  start_time?: string;
  end_time?: string;
  current_nakshatra?: string;
}

interface Props {
  goldenDates: GoldenDate[];
  chandrashtamaDates: ChandrashtamaDate[];
  chandrashtamaPeriods: ChandrashtamaDate[];
  loading?: boolean;
}

const timeFormatOptions: Intl.DateTimeFormatOptions = {
  hour: 'numeric',
  minute: '2-digit',
};

function parseTimeWithDate(dateIso?: string, timeStr?: string): Date | null {
  if (!timeStr) return null;

  // If the string already contains a date component, trust it directly
  if (timeStr.includes('T')) {
    const parsed = new Date(timeStr);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  if (!dateIso) return null;
  const base = new Date(`${dateIso}T00:00:00`);
  if (isNaN(base.getTime())) return null;

  const match = timeStr.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?/i);
  if (!match) return null;

  const [, hourStr, minuteStr, meridianRaw] = match;
  let hours = parseInt(hourStr, 10);
  const minutes = minuteStr ? parseInt(minuteStr, 10) : 0;
  const meridian = meridianRaw?.toUpperCase();

  if (meridian) {
    hours = hours % 12 + (meridian === 'PM' ? 12 : 0);
  }

  const result = new Date(base);
  result.setHours(hours, minutes, 0, 0);
  return result;
}

function formatTime(date: Date | null): string {
  if (!date) return '';
  return date.toLocaleTimeString([], timeFormatOptions);
}

function formatTimeRangeFromDates(start?: Date | null, end?: Date | null, fallbackStart?: string, fallbackEnd?: string): string {
  if (!start && !end) return '';
  if (start && end) {
    return `${formatTime(start)} — ${formatTime(end)}`;
  }
  if (start) return `From ${formatTime(start)}`;
  if (end) return `Until ${formatTime(end)}`;
  if (fallbackStart || fallbackEnd) {
    const startDisplay = fallbackStart ?? '';
    const endDisplay = fallbackEnd ?? '';
    return startDisplay && endDisplay ? `${startDisplay} — ${endDisplay}` : startDisplay || endDisplay;
  }
  return '';
}

export default function MonthlySpecialDates({
  goldenDates,
  chandrashtamaDates,
  chandrashtamaPeriods,
  loading,
}: Props) {
  if (loading) {
    return (
      <section className="rounded-3xl bg-slate-900/60 border border-slate-700/60 shadow-xl p-6">
        <h2 className="text-2xl font-semibold text-accent mb-4">Special Dates</h2>
        <div className="animate-pulse space-y-3">
          <div className="h-16 bg-slate-700/50 rounded-xl"></div>
          <div className="h-16 bg-slate-700/50 rounded-xl"></div>
        </div>
      </section>
    );
  }

  const hasGolden = Array.isArray(goldenDates) && goldenDates.length > 0;
  const hasChandrashtama =
    (Array.isArray(chandrashtamaDates) && chandrashtamaDates.length > 0) ||
    (Array.isArray(chandrashtamaPeriods) && chandrashtamaPeriods.length > 0);

  if (!hasGolden && !hasChandrashtama) {
    return null; // Don't show section if no data
  }

  return (
    <section className="rounded-3xl bg-slate-900/60 border border-slate-700/60 shadow-xl p-6">
      <h2 className="text-2xl font-semibold text-accent mb-4">Special Dates</h2>
      <div className="space-y-4">
        {/* Golden Dates */}
        {hasGolden && (
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-yellow-400 mb-3">Golden Time Windows</h3>
            <div className="space-y-2">
              {goldenDates.map((golden, idx) => {
                // Ensure golden is an object
                if (!golden || typeof golden !== 'object') {
                  return null;
                }

                const parsedWindows: GoldenWindow[] = Array.isArray(golden.windows)
                  ? golden.windows
                  : [];

                const windowsWithDates = parsedWindows
                  .map((window) => {
                    const startStr = window?.start ?? window?.start_time;
                    const endStr = window?.end ?? window?.end_time;
                    const startDate = parseTimeWithDate(golden.date, startStr);
                    let endDate = parseTimeWithDate(golden.date, endStr);

                    if (startDate && endDate && endDate.getTime() <= startDate.getTime()) {
                      const adjusted = new Date(endDate);
                      adjusted.setDate(adjusted.getDate() + 1);
                      endDate = adjusted;
                    }

                      return {
                        startDate,
                        endDate,
                        state: window?.state,
                        score: window?.score,
                        rawStart: startStr,
                        rawEnd: endStr,
                      };
                  })
                  .filter((window) => window.startDate || window.endDate || window.rawStart || window.rawEnd)
                  .sort((a, b) => {
                    if (a.startDate && b.startDate) {
                      return a.startDate.getTime() - b.startDate.getTime();
                    }
                    if (a.startDate) return -1;
                    if (b.startDate) return 1;
                    return 0;
                  });

                return (
                  <div
                    key={idx}
                    className="rounded-xl bg-gradient-to-r from-yellow-900/30 to-amber-900/30 border-2 border-yellow-500/60 p-4 shadow-lg"
                    style={{
                      boxShadow: '0 0 20px rgba(234, 179, 8, 0.3)',
                    }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        {golden.date && typeof golden.date === 'string' && (
                          <div className="text-lg font-bold text-yellow-300 mb-1">
                            {golden.date}
                          </div>
                        )}
                        {windowsWithDates.length > 0 ? (
                          <div className="space-y-1">
                            {windowsWithDates.map((window, windowIdx) => (
                              <div key={`window-${windowIdx}`} className="text-base text-yellow-200 font-medium">
                                {formatTimeRangeFromDates(window.startDate, window.endDate, window.rawStart, window.rawEnd)}
                                {window.state && (
                                  <span className="text-sm text-yellow-200/80 ml-2">{window.state}</span>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (golden.start_time || golden.end_time) && (
                          <div className="text-base text-yellow-200 font-medium">
                            {(() => {
                              const fallbackStart = parseTimeWithDate(golden.date, golden.start_time);
                              let fallbackEnd = parseTimeWithDate(golden.date, golden.end_time);

                              if (fallbackStart && fallbackEnd && fallbackEnd.getTime() <= fallbackStart.getTime()) {
                                const adjustedEnd = new Date(fallbackEnd);
                                adjustedEnd.setDate(adjustedEnd.getDate() + 1);
                                fallbackEnd = adjustedEnd;
                              }

                              return formatTimeRangeFromDates(
                                fallbackStart,
                                fallbackEnd,
                                golden.start_time,
                                golden.end_time
                              );
                            })()}
                          </div>
                        )}
                      </div>
                      {typeof golden.score === 'number' && !isNaN(golden.score) && (
                        <div className="px-3 py-1 rounded-lg bg-yellow-500/30 border border-yellow-400/50">
                          <span className="text-sm font-bold text-yellow-300">
                            {Math.round(golden.score)}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Chandrashtama Dates */}
        {hasChandrashtama && (
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-rose-400 mb-3">Chandrashtama Periods</h3>
            <div className="space-y-2">
              {/* Show periods first (with time ranges) */}
              {Array.isArray(chandrashtamaPeriods) && chandrashtamaPeriods.map((period, idx) => {
                // Ensure period is an object
                if (!period || typeof period !== 'object') {
                  return null;
                }

                const startDateTime = parseTimeWithDate(period.date, period.start_time);
                let endDateTime = parseTimeWithDate(period.date, period.end_time);

                if (startDateTime && endDateTime && endDateTime.getTime() <= startDateTime.getTime()) {
                  const adjustedEnd = new Date(endDateTime);
                  adjustedEnd.setDate(adjustedEnd.getDate() + 1);
                  endDateTime = adjustedEnd;
                }

                let displayDate = period.date;
                if (!displayDate) {
                  const startDate = startDateTime;
                  const endDate = endDateTime;
                  const formatDate = (date: Date | null) => date?.toLocaleDateString('en-CA');

                  const startDateString = formatDate(startDate);
                  const endDateString = formatDate(endDate);

                  if (startDateString && endDateString) {
                    displayDate = startDateString === endDateString
                      ? startDateString
                      : `${startDateString} — ${endDateString}`;
                  } else if (startDateString || endDateString) {
                    displayDate = startDateString || endDateString;
                  }
                }

                return (
                  <div
                    key={`period-${idx}`}
                    className="rounded-xl bg-gradient-to-r from-rose-900/30 to-red-900/30 border-2 border-rose-500/60 p-4 shadow-lg"
                    style={{
                      boxShadow: '0 0 20px rgba(244, 63, 94, 0.3)',
                    }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        {displayDate && (
                          <div className="text-lg font-bold text-rose-300 mb-1">
                            {displayDate}
                          </div>
                        )}
                        {(period.start_time || period.end_time) && (
                          <div className="text-base text-rose-200 font-medium">
                            {formatTimeRangeFromDates(startDateTime, endDateTime, period.start_time, period.end_time)}
                          </div>
                        )}
                        {period.current_nakshatra && typeof period.current_nakshatra === 'string' && (
                          <div className="text-sm text-rose-300/80 mt-1">
                            {period.current_nakshatra}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {/* Show standalone dates (without time ranges) */}
              {Array.isArray(chandrashtamaDates) && chandrashtamaDates.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {chandrashtamaDates.map((dateObj, idx) => {
                    // Handle both string dates and date objects
                    let displayDate: string;
                    
                    if (typeof dateObj === 'string') {
                      displayDate = dateObj;
                    } else if (dateObj && typeof dateObj === 'object' && 'date' in dateObj && typeof dateObj.date === 'string') {
                      displayDate = dateObj.date;
                    } else {
                      // Skip invalid entries
                      return null;
                    }
                    
                    return (
                      <div
                        key={`date-${idx}`}
                        className="px-4 py-2 rounded-lg bg-rose-500/20 border border-rose-500/60 text-rose-300 font-medium"
                      >
                        {displayDate}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
