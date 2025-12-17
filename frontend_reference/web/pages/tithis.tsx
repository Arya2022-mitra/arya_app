import { useEffect, useState } from 'react';
import { API_BASE } from '@/lib/api';
import { useActiveProfile } from '@/lib/useActiveProfile';
import { useAuth } from '@/lib/useAuth';
import { useRouter } from 'next/router';
import { handleUnauthorized } from '@/lib/handleUnauthorized';
import MonthlyTithis from '@/components/MonthlyTithis';
import { useTranslation } from 'react-i18next';

export default function TithisPage() {
  const router = useRouter();
  const { profile, loading } = useActiveProfile();
  const { token, sessionRestored, logout, refreshToken } = useAuth();
  const loadingAuth = !sessionRestored;
  const { t, i18n } = useTranslation();

  const [prediction, setPrediction] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading || !profile || !sessionRestored) return;
    const fetchData = async () => {
      if (!profile) return;
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
            page: 'tithis',
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
                  page: 'tithis',
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
          setError(t('tithis.failed'));
          setPrediction(null);
          return;
        }
        const d = await res.json();
        const p = d?.raw_data?.data ?? d?.raw_data ?? null;
        setPrediction(p);
        setError(null);
      } catch {
        setError(t('tithis.failed'));
        setPrediction(null);
      }
    };
    fetchData();
  }, [profile, loading, token, router, logout, sessionRestored, refreshToken, t, i18n.language]);

  if (loadingAuth || loading) {
    return <div className="flex justify-center items-center h-screen text-blue-400">{t('common.loading')}</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center h-screen text-red-400">{error}</div>;
  }

  return (
    <div className="space-y-4">
      <MonthlyTithis prediction={prediction} />
    </div>
  );
}
