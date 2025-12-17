import { useEffect, useState } from 'react';
import Image from 'next/image';
import Card from '@/components/Card';
import { API_BASE } from '@/lib/api';
import { useActiveProfile } from '@/lib/useActiveProfile';
import { useAuth } from '@/lib/useAuth';
import { useRouter } from 'next/router';
import { handleUnauthorized } from '@/lib/handleUnauthorized';
import { useTranslation } from 'react-i18next';
import AiSummaryDisplay from '@/components/AiSummaryDisplay';
import { useAiSummary } from '@/hooks/useAiSummary';

export default function GuardianPage() {
  const router = useRouter();
  const { profile, loading } = useActiveProfile();
  const { token, sessionRestored, logout, refreshToken } = useAuth();
  const loadingAuth = !sessionRestored;
  const { t, i18n } = useTranslation();

  const [prot, setProt] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingPrediction, setLoadingPrediction] = useState(true);

  const profileId = profile?.id ? Number(profile.id) : null;
  const aiSummary = useAiSummary('guardian', profileId);

  useEffect(() => {
    if (loading || !profile || !sessionRestored) {
      setProt(null);
      return;
    }

    const fetchData = async () => {
      if (!profile) return;
      setLoadingPrediction(true);
      try {
        let authTok = token;
        if (!authTok && refreshToken) {
          authTok = await refreshToken(true);
        }

        if (!authTok) {
          await logout();
          router.replace('/auth');
          return;
        }

        let res = await fetch(`${API_BASE}/get_prediction`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authTok}`,
          },
          credentials: 'include',
          body: JSON.stringify({
            active_profile: profile,
            page: 'guardian',
            locale: i18n.language || 'en',
          }),
        });
        if (res.status === 401) {
          const retryRes = await handleUnauthorized(router, {
            logout,
            refreshToken,
            retry: async (fresh) =>
              fetch(`${API_BASE}/get_prediction`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${fresh}`,
                },
                credentials: 'include',
                body: JSON.stringify({
                  active_profile: profile,
                  page: 'guardian',
                  locale: i18n.language || 'en',
                }),
              }),
          });
          if (!retryRes) {
            return;
          }
          res = retryRes;
        }
        if (!res.ok) {
          setError(t('guardian.failed'));
          setProt(null);
          return;
        }
        const d = await res.json();
        const prediction = d?.raw_data ?? {};
        const protectionWrapper =
          prediction?.protection ?? prediction?.protection_engine ?? null;
        console.log('protection (wrapper)', protectionWrapper);
        console.log('protection.data', protectionWrapper?.data);
        const normalizedProtection =
          (protectionWrapper?.data && (protectionWrapper.data as any)?.data)
            ? (protectionWrapper.data as any).data
            : (protectionWrapper?.data ?? protectionWrapper);

        setProt(normalizedProtection);
        setError(null);
      } catch (e) {
        console.error('Guardian fetch error', e);
        setError(t('guardian.failed'));
        setProt(null);
      } finally {
        setLoadingPrediction(false);
      }
    };
    fetchData();
  }, [profile, loading, token, router, logout, sessionRestored, refreshToken, t, i18n.language]);

  if (loadingAuth || loading || loadingPrediction || !profile) {
    return <div className="flex justify-center items-center h-screen text-blue-400">{t('common.loading')}</div>;
  }
  if (error) {
    return <div className="flex justify-center items-center h-screen text-red-400">{error}</div>;
  }

  const fullName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || '—';

  const ishta = prot?.ishta ?? {};
  const guardians = prot?.guardians ?? {};
  const contexts = prot?.contexts ?? {};

  const display = (v: any) => (v !== undefined && v !== null && v !== '' ? v : '—');

  const renderChips = (arr: any[]) => {
    if (!Array.isArray(arr) || arr.length === 0) return <div>—</div>;
    return (
      <div className="flex flex-wrap gap-2">
        {arr.map((item, idx) => (
          <span
            key={idx}
            className="px-2 py-1 bg-accent/20 text-accent rounded-full text-sm"
          >
            {item}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="scroll-smooth bg-neo-dark/95">
      <div className="mx-auto flex min-h-screen max-w-screen-xl flex-col gap-8 px-4 py-10 text-white sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-neon-cyan/50 bg-gradient-to-br from-neo-dark via-[#101e38] to-neo-dark p-8 shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(0,255,255,0.12),_transparent_55%)]" />
          <div className="relative z-10 flex flex-col items-center gap-6 text-center">
            <div className="relative h-48 w-48 overflow-hidden rounded-full border border-neon-cyan/60 shadow-[0_0_25px_rgba(0,255,255,0.35)]">
              <Image src="/logo/logo.png" alt="Guardian mandala" fill className="object-cover" priority />
            </div>
            <div className="space-y-3">
              <h1 className="font-orbitron text-3xl font-semibold text-neon-cyan sm:text-4xl">
                {t('guardian.title')}
              </h1>
              <p className="mx-auto max-w-2xl text-base text-slate-200">
                Discover your protective deities and spiritual guardians based on Vedic astrological principles. Understand the cosmic forces that guide and protect you.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-neon-cyan/80">
              <span className="rounded-full border border-neon-cyan/40 px-4 py-1 uppercase tracking-[0.4em]">
                Ishta Devata
              </span>
              <span className="rounded-full border border-neon-cyan/40 px-4 py-1 uppercase tracking-[0.4em]">
                Kula Devata
              </span>
            </div>
            <div className="mt-2 flex flex-col items-center gap-3 text-sm text-slate-300 sm:flex-row">
              <span className="text-slate-200">
                {fullName}
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
      <Card>
        <h2 className="text-xl font-semibold mb-2">{t('guardian.ishta')}</h2>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <div className="font-semibold">{t('guardian.ishta_deity')}</div>
          <div>{display(ishta?.ishta_deity)}</div>
          <div className="font-semibold">{t('guardian.ishta_planet')}</div>
          <div>{display(ishta?.ishta_planet)}</div>
          <div className="font-semibold">{t('guardian.ak_planet')}</div>
          <div>{display(ishta?.ak_planet)}</div>
        </div>
      </Card>

      <Card>
        <h2 className="text-xl font-semibold mb-2">{t('guardian.guardians')}</h2>
        <div className="space-y-4 text-sm">
          <div>
            <div className="font-semibold mb-1">{t('guardian.mind_guardian')}</div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              <div className="font-semibold">{t('guardian.deity')}</div>
              <div>{display(guardians?.mind_guardian?.deity)}</div>
              <div className="font-semibold">{t('guardian.planet')}</div>
              <div>{display(guardians?.mind_guardian?.planet)}</div>
            </div>
          </div>
          <div>
            <div className="font-semibold mb-1">{t('guardian.lagna_guardian')}</div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              <div className="font-semibold">{t('guardian.deity')}</div>
              <div>{display(guardians?.lagna_guardian?.deity)}</div>
              <div className="font-semibold">{t('guardian.planet')}</div>
              <div>{display(guardians?.lagna_guardian?.planet)}</div>
              {guardians?.lagna_guardian?.strength ? (
                <>
                  <div className="font-semibold">{t('guardian.strength')}</div>
                  <div>{display(guardians?.lagna_guardian?.strength)}</div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </Card>
      <Card>
        <h2 className="text-xl font-semibold mb-2">{t('guardian.contexts')}</h2>
        <div className="space-y-4 text-sm">
          <div>
            <div className="font-semibold mb-1">{t('guardian.dream')}</div>
            {renderChips(contexts?.dream)}
          </div>
          <div>
            <div className="font-semibold mb-1">{t('guardian.waking')}</div>
            {renderChips(contexts?.waking)}
          </div>
        </div>
      </Card>
      </div>
    </div>
  );
}
