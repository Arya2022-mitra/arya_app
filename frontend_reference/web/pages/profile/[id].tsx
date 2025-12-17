import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import { API_BASE } from '@/lib/api';
import { handleUnauthorized } from '@/lib/handleUnauthorized';
import { useActiveProfile } from '@/lib/useActiveProfile';
import getProfileId from '@/lib/getProfileId';
import { useAuth } from '@/lib/useAuth';
import ChartTabs from '@/components/ChartTabs';
import BhavaChart from '@/components/BhavaChart';
import Button from '@/components/Button';
import sanitizeChart from '@/utils/sanitizeChart';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { PluggableList } from 'unified';
import type { Profile } from '@/types/Profile';
import { normaliseProfile } from '@/lib/normaliseProfile';

const markdownPlugins: PluggableList = [remarkGfm as any];

interface ProfileProps {
  id: string;
}

export default function Profile({ id }: ProfileProps) {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const { setActiveProfile, loading } = useActiveProfile();
  const { token, sessionRestored, logout, refreshToken } = useAuth();
  const loadingAuth = !sessionRestored;

  useEffect(() => {
    if (!sessionRestored) {
      return;
    }

    const storedId =
      typeof window !== 'undefined' ? localStorage.getItem('active_profile_id') : null;
    const pid = id && id !== 'undefined' ? id : storedId || '';
    if (!pid) {
      console.warn('Invalid profile ID, aborting request.');
      setLoaded(true);
      return;
    }
    console.log('Fetching profile', pid);

    let cancelled = false;

    const load = async () => {
      try {
        let authTok =
          typeof window !== 'undefined' ? localStorage.getItem('firebase_token') : null;
        if (!authTok && refreshToken) {
          authTok = await refreshToken(true);
        }
        if (!authTok) {
          await logout();
          if (!cancelled) {
            router.replace('/auth');
          }
          return;
        }

        let res = await fetch(`${API_BASE}/api/profile/${pid}`, {
          headers: { Authorization: `Bearer ${authTok}` },
          credentials: 'include',
        });
        if (res.status === 401) {
          const retryRes = await handleUnauthorized(router, {
            logout,
            refreshToken,
            retry: async (fresh) =>
              fetch(`${API_BASE}/api/profile/${pid}`, {
                headers: { Authorization: `Bearer ${fresh}` },
                credentials: 'include',
              }),
          });
          if (!retryRes) {
            return;
          }
          res = retryRes;
        }
        if (res.status === 404) {
          if (!cancelled) {
            setNotFound(true);
            setProfile(null);
            setLoaded(true);
          }
          return;
        }
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) {
            setProfile(normaliseProfile(data as Profile));
          }
        } else if (!cancelled) {
          setProfile(null);
        }
      } catch (err) {
        console.error('Fetch error:', err);
        if (!cancelled) {
          setProfile(null);
        }
      } finally {
        if (!cancelled) {
          setLoaded(true);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [id, logout, router, sessionRestored, refreshToken]);

  const beginJourney = () => {
    if (profile) {
      const id = getProfileId(profile);
      const normalized = normaliseProfile({ ...profile, id });
      if (normalized) setActiveProfile(normalized);
    }
    router.push('/chat');
  };

  const editProfile = () => {
    router.push(`/profile/${id}?edit=1`);
  };

  const removeProfile = async () => {
    if (!id || id === 'undefined') {
      console.warn('Invalid profile ID, aborting request.');
      return;
    }
    try {
      let authToken = token;
      if (!authToken && refreshToken) {
        authToken = await refreshToken(true);
      }

      if (!authToken) {
        await logout();
        router.replace('/auth');
        return;
      }

      let res = await fetch(`${API_BASE}/api/profile/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
        credentials: 'include',
      });
      if (res.status === 401) {
        const retryRes = await handleUnauthorized(router, {
          logout,
          refreshToken,
          retry: async (fresh) =>
            fetch(`${API_BASE}/api/profile/${id}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${fresh}` },
              credentials: 'include',
            }),
        });
        if (!retryRes) {
          return;
        }
        res = retryRes;
      }
      if (res.ok) {
        router.push('/auth');
      }
    } catch {}
  };

  if (loadingAuth || loading) {
    return (
      <div className="flex justify-center items-center h-screen text-blue-400">
        Loading...
      </div>
    );
  }

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">Loading...</div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center">Profile not found.</div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">Unable to load profile.</div>
    );
  }

  const formatDate = (d: string) => {
    if (!d) return '';
    const [y, m, day] = d.split('-').map(Number);
    if (!y || !m || !day) return d;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${String(day).padStart(2, '0')}-${months[m - 1]}-${y}`;
  };

  const formatTime = (t: string) => {
    if (!t) return '';
    const [hStr, min] = t.split(':');
    let h = parseInt(hStr, 10);
    if (Number.isNaN(h)) return t;
    const suffix = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    if (h === 0) h = 12;
    return `${String(h).padStart(2, '0')}:${min} ${suffix}`;
  };

  return (
    <div className="flex flex-col items-center p-4">
      <div className="border-4 border-muted-accent dark:border-neon-cyan bg-gradient-to-b from-rose-100 via-pink-50 to-rose-200 rounded-2xl shadow-xl p-6 m-4 text-deep-blue dark:bg-royal-blue dark:text-neon-cyan max-w-md mx-auto">
        <h1 className="text-3xl font-sanskrit text-center text-accent mb-3">
          {profile?.first_name || ''} {profile?.last_name || ''}
        </h1>
        <p className="text-lg font-semibold">
          {formatDate(profile.dob ?? '')} at {formatTime(profile.tob ?? '')}
        </p>
        <p className="text-lg">
          {profile.city || profile.location || ''}
          {profile.state ? `, ${profile.state}` : ''}
          {profile.country ? `, ${profile.country}` : ''}
        </p>
        <div className="mt-4 space-y-1 text-lg">
          <p>
            <span className="font-semibold">Moon Sign:</span>{' '}
            {profile.moonSign || profile.moon_sign}
          </p>
          <p>
            <span className="font-semibold">Nakshatra:</span>{' '}
            {profile.nakshatra}
          </p>
          <p>
            <span className="font-semibold">Lagna:</span>{' '}
            {profile.lagna || profile.lagna_sign}
          </p>
        </div>
        {profile.rashi_chart && (
          <div className="mt-4">
            <ChartTabs houses={sanitizeChart(profile.rashi_chart)} />
          </div>
        )}
        {profile.bhava_chart && (
          <div className="mt-4">
            <BhavaChart cells={profile.bhava_chart} />
          </div>
        )}
        {profile.navamsa_chart && (
          <div className="mt-4">
            <ChartTabs houses={sanitizeChart(profile.navamsa_chart)} />
          </div>
        )}
        {profile.protection && (
          <div className="mt-4 border-2 border-muted-accent dark:border-neon-cyan rounded p-2 bg-accent/20 dark:bg-card-dark">
            <h2 className="text-lg font-bold text-accent dark:text-neon-cyan mb-1 text-center">
              Spiritual Protection
            </h2>
            <ReactMarkdown remarkPlugins={markdownPlugins}>
              {profile.protection}
            </ReactMarkdown>
          </div>
        )}
        {profile.dasha?.timeline && Array.isArray(profile.dasha.timeline) && (
          <div className="mt-4 overflow-x-auto text-sm">
            <table className="min-w-full border text-center">
              <thead>
                <tr>
                  <th className="border px-2">Start</th>
                  <th className="border px-2">End</th>
                  <th className="border px-2">Lord</th>
                </tr>
              </thead>
              <tbody>
                {profile.dasha.timeline.map((row: any, idx: number) => (
                  <tr key={idx}>
                    <td className="border px-2">{row.start}</td>
                    <td className="border px-2">{row.end}</td>
                    <td className="border px-2">{row.lord}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="space-y-2 pt-4">
          <Button
            variant="primary"
            onClick={beginJourney}
            className="w-full rounded-full"
          >
            Begin Divine Journey
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={editProfile} className="w-full rounded-full">
              Edit
            </Button>
            <Button onClick={removeProfile} className="w-full rounded-full">
              Delete Profile
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params || {};
  if (typeof id !== 'string') {
    return { notFound: true };
  }
  return {
    props: { id },
  };
};
