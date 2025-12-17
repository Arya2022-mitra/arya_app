import { useEffect, useState } from 'react';
import TamasicAlerts from '@/components/TamasicAlerts';
import { API_BASE } from '@/lib/api';
import { useActiveProfile } from '@/lib/useActiveProfile';
import { useAuth } from '@/lib/useAuth';
import { handleUnauthorized } from '@/lib/handleUnauthorized';
import { useRouter } from 'next/router';
import type { DailyAlertData } from '@/types/DailyAlertData';
import { useTranslation } from 'react-i18next';

export default function TamasPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { profile, loading } = useActiveProfile();
  const { token, sessionRestored, logout, refreshToken } = useAuth();
  const [prediction, setPrediction] = useState<DailyAlertData | null>(null);
  const [loadingPred, setLoadingPred] = useState(true);

  useEffect(() => {
    if (!sessionRestored || loading || !profile) return;
    (async () => {
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
            page: 'tamasic_alerts',
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
                  page: 'tamasic_alerts',
                }),
              }),
          });
          if (!retryRes) {
            return;
          }
          res = retryRes;
        }
        if (res.ok) {
          const data = await res.json();
          const rawPred: DailyAlertData | null =
            data?.raw_data?.data ?? data?.raw_data ?? data ?? null;
          const bm =
            (rawPred as any)?.black_magic?.data ?? (rawPred as any)?.black_magic;
          if (bm && typeof bm === 'object' && !Array.isArray((bm as any).proof_chain)) {
            (bm as any).proof_chain = [];
          }
          const pred = rawPred ? { ...rawPred, black_magic: bm } : null;
          setPrediction(pred);
        } else {
          setPrediction(null);
        }
      } catch {
        setPrediction(null);
      } finally {
        setLoadingPred(false);
      }
    })();
  }, [
    profile,
    loading,
    token,
    router,
    sessionRestored,
    logout,
    refreshToken,
  ]);

  if (loadingPred || loading || !sessionRestored) {
    return <div>{t('common.loading')}</div>;
  }

  return (
    <div className="pb-8 space-y-4">
      <TamasicAlerts prediction={prediction} />
    </div>
  );
}

