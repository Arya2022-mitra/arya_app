import { useEffect, useState } from 'react';
import { useActiveProfile } from '@/lib/useActiveProfile';
import { useAuth } from '@/lib/useAuth';
import PanchangView from '@/components/PanchangView';
import { useDailyPrediction } from '@/state/dailyPredictionStore';
import { useTranslation } from 'react-i18next';

export default function DailyPanchangPage() {
  const { t } = useTranslation();
  const { profile, loading } = useActiveProfile();
  const { token, sessionRestored } = useAuth();
  const loadingAuth = !sessionRestored;

  const { data: prediction, loading: predictionLoading, error: predictionError } = useDailyPrediction();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (predictionError) {
      setError(predictionError);
    } else if (!predictionLoading) {
      setError(null);
    }
  }, [predictionError, predictionLoading]);

  if (loadingAuth || loading || predictionLoading) {
    return <div className="flex justify-center items-center h-screen text-blue-400">{t('common.loading')}</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center h-screen text-red-400">{error}</div>;
  }

  return (
    <div className="space-y-4">
      <PanchangView prediction={prediction} />
    </div>
  );
}

