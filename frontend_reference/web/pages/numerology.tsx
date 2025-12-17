import { useState } from 'react';
import Image from 'next/image';
import { useActiveProfile } from '@/lib/useActiveProfile';
import { useAuth } from '@/lib/useAuth';
import Numerology from '@/components/Numerology';
import { useDailyPrediction } from '@/state/dailyPredictionStore';
import { useTranslation } from 'react-i18next';
import AiSummaryDisplay from '@/components/AiSummaryDisplay';
import { useAiSummary } from '@/hooks/useAiSummary';
import SecureAutoPlayVideo from '@/components/SecureAutoPlayVideo';

export default function NumerologyPage() {
  const { profile, loading } = useActiveProfile();
  const { sessionRestored } = useAuth();
  const loadingAuth = !sessionRestored;
  const { t } = useTranslation();
  const [videoError, setVideoError] = useState(false);
  const {
    data: prediction,
    loading: predictionLoading,
    error: predictionError,
  } = useDailyPrediction();

  const profileId = profile?.id ? Number(profile.id) : null;
  const aiSummary = useAiSummary('numerology', profileId);
  const numerologyData = prediction?.numerology ?? null;

  if (loadingAuth || loading || predictionLoading) {
    return <div className="flex justify-center items-center h-screen text-blue-400">{t('common.loading')}</div>;
  }

  if (predictionError) {
    return <div className="flex justify-center items-center h-screen text-red-400">{predictionError}</div>;
  }

  return (
    <div className="scroll-smooth bg-neo-dark/95">
      <div className="mx-auto flex min-h-screen max-w-screen-xl flex-col gap-8 px-4 py-10 text-white sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-neon-cyan/50 bg-gradient-to-br from-neo-dark via-[#0c1b3d] to-neo-dark p-8 shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(0,255,255,0.12),_transparent_55%)]" />
          <div className="relative z-10 flex flex-col items-center gap-6 text-center">
            {videoError ? (
              <div className="h-48 w-48 rounded-full border border-neon-cyan/60 bg-black/30 flex items-center justify-center text-center text-sm">
                {t('common.unavailable', { defaultValue: 'Video unavailable. Content summarized below.' })}
              </div>
            ) : (
              <SecureAutoPlayVideo
                sources={[{ src: '/videos/Aryabhatta.mp4', type: 'video/mp4' }]}
                className="h-48 w-48 rounded-full border border-neon-cyan/60 object-cover shadow-[0_0_25px_rgba(0,255,255,0.35)]"
                onError={() => setVideoError(true)}
                description="Animated Aryabhatta introduction"
              />
            )}
            <div className="space-y-3">
              <h1 className="font-orbitron text-3xl font-semibold text-neon-cyan sm:text-4xl">
                Numerology Intelligence
              </h1>
              <p className="mx-auto max-w-2xl text-base text-slate-200">
                Discover the cosmic patterns hidden in your name and birthdate. Explore how ancient numerological wisdom reveals your life path and destiny.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-neon-cyan/80">
              <span className="rounded-full border border-neon-cyan/40 px-4 py-1 uppercase tracking-[0.4em]">
                Vedic Numbers
              </span>
              <span className="rounded-full border border-neon-cyan/40 px-4 py-1 uppercase tracking-[0.4em]">
                Name Vibrations
              </span>
            </div>
          </div>
        </div>

        {aiSummary.data && (
          <AiSummaryDisplay variant="hero"
            summary={aiSummary.data.summary}
            html={aiSummary.data.html}
            updatedAt={aiSummary.data.updated_at}
          />
        )}
        {aiSummary.loading && (
          <AiSummaryDisplay variant="hero" loading={true} />
        )}
        {aiSummary.error && !aiSummary.loading && (
          <AiSummaryDisplay variant="hero" error={aiSummary.error} />
        )}

        <Numerology data={numerologyData} />
      </div>
    </div>
  );
}

