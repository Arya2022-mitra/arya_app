import React, { useMemo } from 'react';
import Card from '@/components/Card';
import { useTranslation } from 'react-i18next';
import { useAstroTranslation } from '@/lib/useAstroTranslation';
import type { DailyAlertData, TithiEntry } from '@/types/DailyAlertData';

interface Props {
  prediction: DailyAlertData | null;
}

export default function MonthlyTithis({ prediction: rawPrediction }: Props) {
  const { t } = useTranslation();
  const { translateTithi, translatePaksha } = useAstroTranslation();
  const prediction = (rawPrediction as any)?.data ?? rawPrediction ?? null;
  const moon = prediction?.moon_cycle_data;
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const monthName = now.toLocaleString('default', { month: 'long' });

  // pull and sort this month’s tithi entries
  const monthlySummary = useMemo(() => {
    const data =
      (moon?.tithi_summary_monthly as Record<string, Record<string, TithiEntry[]>> | undefined)?.[
        String(year)
      ]?.[month] ?? [];
    return Array.isArray(data)
      ? [...data].sort((a, b) => (a.start_date || '').localeCompare(b.start_date || ''))
      : [];
  }, [moon, year, month]);

  if (!monthlySummary.length) {
    return (
      <Card className="breathing-border text-white">
        <p className="text-center">{t('monthlyTithis.noTithis')}</p>
      </Card>
    );
  }

  return (
    <Card className="breathing-border text-white space-y-2">
      <h2 className="text-center font-semibold text-accent">
        🗓️ {t('monthlyTithis.title')} ({monthName} {year})
      </h2>
      <div className="overflow-x-auto">
        <table className="table-auto border-collapse border border-accent w-full text-sm text-accent">
          <thead className="bg-blue-900">
            <tr>
              <th className="border border-accent px-2 py-1">{t('monthlyTithis.tithi')}</th>
              <th className="border border-accent px-2 py-1">{t('monthlyTithis.paksha')}</th>
              <th className="border border-accent px-2 py-1">{t('monthlyTithis.startDate')}</th>
              <th className="border border-accent px-2 py-1">{t('monthlyTithis.startTime')}</th>
              <th className="border border-accent px-2 py-1">{t('monthlyTithis.endDate')}</th>
              <th className="border border-accent px-2 py-1">{t('monthlyTithis.endTime')}</th>
              <th className="border border-accent px-2 py-1">{t('monthlyTithis.verdict')}</th>
            </tr>
          </thead>
          <tbody>
            {monthlySummary.map((entry, i) => (
              <tr key={i}>
                <td className="border border-accent px-2 py-1">{translateTithi(entry.tithi)}</td>
                <td className="border border-accent px-2 py-1">{entry.paksha ? translatePaksha(entry.paksha) : ''}</td>
                <td className="border border-accent px-2 py-1">{entry.start_date}</td>
                <td className="border border-accent px-2 py-1">{entry.start_time}</td>
                <td className="border border-accent px-2 py-1">{entry.end_date}</td>
                <td className="border border-accent px-2 py-1">{entry.end_time}</td>
                <td className="border border-accent px-2 py-1">
                  {entry.tithi_good_bad ? (entry.tithi_good_bad === 'good' ? `✅ ${t('panchang.good')}` : `⚠️ ${t('panchang.bad')}`) : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

