import { useRef, useState } from 'react';
import PanchangView from '@/components/PanchangView';
import PersonalPrediction from '@/components/PersonalPrediction';
import TamasicAlerts from '@/components/TamasicAlerts';
import TransitHighlights from '@/components/TransitHighlights';
import RemedyGuidance from '@/components/RemedyGuidance';
import MonthlyTithis from '@/components/MonthlyTithis';
import Button from '@/components/Button';

interface Props {
  prediction: any | null;
}

export default function DailyPredictionSwiper({ prediction: rawPrediction }: Props) {
  const prediction = (rawPrediction as any)?.data ?? rawPrediction ?? null;
  const [page, setPage] = useState(0);
  const startX = useRef<number | null>(null);
  const pages = [
    // Pass prediction unchanged so PanchangView can access moon_cycle_data.tithi_summary
    { title: 'Panchang', element: <PanchangView prediction={prediction} /> },
    { title: 'Prediction', element: <PersonalPrediction prediction={prediction} /> },
    { title: 'Alerts', element: <TamasicAlerts prediction={prediction} /> },
    { title: 'Transits', element: <TransitHighlights prediction={prediction} /> },
    { title: 'Remedies', element: <RemedyGuidance prediction={prediction} /> },
    { title: 'Tithis', element: <MonthlyTithis prediction={prediction} /> },
  ];

  const onTouchStart = (e: React.TouchEvent) => {
    startX.current = e.changedTouches[0].clientX;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (startX.current === null) return;
    const diff = e.changedTouches[0].clientX - startX.current;
    if (Math.abs(diff) > 50) {
      if (diff < 0 && page < pages.length - 1) setPage(page + 1);
      if (diff > 0 && page > 0) setPage(page - 1);
    }
    startX.current = null;
  };

  return (
    <div className="w-full md:max-w-[90%] lg:max-w-[80%] mx-auto px-4">
      <div className="flex justify-center mb-2 space-x-2">
        {pages.map((p, i) => (
          <button
            key={p.title}
            onClick={() => setPage(i)}
            className={`px-2 py-1 text-xs border-b-2 transition-colors ${
              page === i
                ? 'border-neon-cyan text-neon-cyan'
                : 'border-transparent text-white hover:text-neon-cyan'
            }`}
          >
            {p.title}
          </button>
        ))}
      </div>
      <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        {pages[page].element}
      </div>
      <div className="hidden md:flex justify-between mt-2">
        <Button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
          Prev
        </Button>
        <Button onClick={() => setPage((p) => Math.min(pages.length - 1, p + 1))} disabled={page === pages.length - 1}>
          Next
        </Button>
      </div>
    </div>
  );
}
