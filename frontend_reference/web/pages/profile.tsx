import { useRouter } from 'next/router';
import { useEffect, useState, useCallback } from 'react';
import { API_BASE } from '@/lib/api';
import { handleUnauthorized } from '@/lib/handleUnauthorized';
import { useActiveProfile } from '@/lib/useActiveProfile';
import getProfileId from '@/lib/getProfileId';
import { useAuth } from '@/lib/useAuth';
import Card from '@/components/Card';
import Button from '@/components/Button';
import ProfileInfoBlock from '@/components/ProfileInfoBlock';
import type { Profile } from '@/types/Profile';
import { normaliseProfile } from '@/lib/normaliseProfile';
import { useTranslation } from 'react-i18next';

export default function ProfileList() {
  const router = useRouter();
  const { t } = useTranslation();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [dedupeNotice, setDedupeNotice] = useState<string | null>(null);
  const { setActiveProfile, loading, profile: activeProfile } = useActiveProfile();
  const {
    token,
    refreshToken,
    logout,
    status,
    initializing,
    userId,
    ensureSession,
    sessionRestored,
    firebaseReady,
  } = useAuth();

  useEffect(() => {
    if (!sessionRestored || !firebaseReady || initializing) return;
    if (status === 'invalid') {
      router.replace('/auth');
      return;
    }
    if (status === 'no_profile') {
      router.replace('/add_profile?from=session');
    }
  }, [firebaseReady, initializing, router, sessionRestored, status]);

  const loadProfiles = useCallback(async () => {
    if (!userId) {
      setProfiles([]);
      setListLoading(false);
      return;
    }

    setListLoading(true);
    try {
      let authTok = token;
      if (!authTok && refreshToken) {
        authTok = await refreshToken(true);
      }
      if (!authTok) {
        const ensured = await ensureSession({ forceRefresh: true });
        if (ensured !== 'ok') {
          router.replace('/auth');
          return;
        }
        authTok =
          typeof window !== 'undefined'
            ? localStorage.getItem('firebase_token') ?? localStorage.getItem('token')
            : null;
      }

      const headers: Record<string, string> = authTok
        ? { Authorization: `Bearer ${authTok}` }
        : {};

      let res = await fetch(`${API_BASE}/get_profiles?user_id=${userId}`, {
        headers,
        credentials: 'include',
      });

      if (res.status === 401) {
        const retryRes = await handleUnauthorized(router, {
          logout,
          refreshToken,
          retry: async (fresh) =>
            fetch(`${API_BASE}/get_profiles?user_id=${userId}`, {
              headers: { Authorization: `Bearer ${fresh}` },
              credentials: 'include',
            }),
        });
        if (!retryRes) {
          setProfiles([]);
          return;
        }
        res = retryRes;
      }

      const list = await res.json();
      if (Array.isArray(list)) {
        setProfiles(list);
      } else {
        setProfiles([]);
      }
    } catch (err) {
      console.error('Profiles API error', err);
      setProfiles([]);
    } finally {
      setListLoading(false);
    }
  }, [ensureSession, logout, refreshToken, router, token, userId]);

  useEffect(() => {
    if (
      initializing ||
      loading ||
      status !== 'ok' ||
      !userId ||
      !sessionRestored ||
      !firebaseReady
    ) {
      return;
    }
    void loadProfiles();
  }, [firebaseReady, initializing, loading, sessionRestored, status, userId, loadProfiles]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const raw = sessionStorage.getItem('profile_dedup_notice');
    if (!raw) {
      return;
    }
    try {
      const parsed = JSON.parse(raw);
      setDedupeNotice(parsed?.message || 'Existing profile reused.');
    } catch {
      setDedupeNotice('Existing profile reused.');
    }
    sessionStorage.removeItem('profile_dedup_notice');
  }, []);

  const beginJourney = (p: Profile) => {
    const id = getProfileId(p);
    if (!id) return;
    const normalized = normaliseProfile({ ...p, id });
    if (!normalized) return;
    setActiveProfile(normalized);
    router.push('/chat');
  };

  const editProfile = (p: Profile) => {
    const id = getProfileId(p);
    if (!id) return;
    router.push(`/profile/${id}?edit=1`);
  };

  const viewProfile = (p: Profile) => {
    const id = getProfileId(p);
    if (!id) return;
    router.push(`/profile/${id}`);
  };

  const deleteProfile = async (p: Profile) => {
    const id = getProfileId(p);
    if (!id) return;
    try {
      let authTok = token;
      if (!authTok && refreshToken) {
        authTok = await refreshToken(true);
      }
      const headers: Record<string, string> = authTok
        ? { Authorization: `Bearer ${authTok}` }
        : {};
      let res = await fetch(`${API_BASE}/api/profile/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers,
      });
      if (res.status === 401) {
        const retryRes = await handleUnauthorized(router, {
          logout,
          refreshToken,
          retry: async (fresh) =>
            fetch(`${API_BASE}/api/profile/${id}`, {
              method: 'DELETE',
              credentials: 'include',
              headers: { Authorization: `Bearer ${fresh}` },
            }),
        });
        if (!retryRes) {
          return;
        }
        res = retryRes;
      }
      if (res.ok) {
        const updatedProfiles = profiles.filter((pr) => (pr.profile_id || pr.id) !== id);
        setProfiles(updatedProfiles);
        const wasActive =
          String(activeProfile?.id ?? (activeProfile as any)?.profile_id ?? '') === String(id);
        if (updatedProfiles.length === 0) {
          setActiveProfile(null);
          router.replace('/add_profile?from=profile');
        } else if (wasActive) {
          const next = normaliseProfile({
            ...updatedProfiles[0],
            id: getProfileId(updatedProfiles[0]),
          } as Profile);
          if (next) {
            setActiveProfile(next);
          } else {
            setActiveProfile(null);
          }
        }
      }
    } catch (err) {
      console.error('Failed to delete profile', err);
    }
  };

  if (
    initializing ||
    loading ||
    status === 'pending' ||
    !sessionRestored ||
    !firebaseReady
  ) {
    return (
      <div className="flex justify-center items-center h-screen text-blue-400">
        {t('common.loading')}
      </div>
    );
  }

  if (status !== 'ok') {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      {dedupeNotice && (
        <div className="border border-accent text-accent rounded px-4 py-3">
          {dedupeNotice}
        </div>
      )}
      <h1 className="text-center text-xl font-sanskrit mb-4">Your Profiles</h1>
      {listLoading ? (
        <div>{t('common.loading')}</div>
      ) : profiles.length === 0 ? (
        <div className="space-y-2">
          <p>No profiles found. Click below to begin your divine journey.</p>
          <Button onClick={() => router.push('/add_profile?from=profile')}>Add Profile</Button>
        </div>
      ) : (
        <>
          <Button onClick={() => router.push('/add_profile?from=profile')}>Add Profile</Button>
          {profiles.map((p) => (
            <Card key={p.profile_id || p.id}>
              <div onClick={() => viewProfile(p)} className="cursor-pointer">
                <ProfileInfoBlock>
                  <div className="font-semibold">{p.first_name} {p.last_name}</div>
                  {p.dob && <div>Date of Birth: {p.dob}</div>}
                  {p.tob && <div>Time of Birth: {p.tob}</div>}
                  <div>Rashi: {p.moonSign || p.moon_sign || ''}</div>
                  <div>Lagna: {p.lagna || p.lagna_sign || ''}</div>
                  <div>Birth Star: {p.nakshatra || ''}</div>
                </ProfileInfoBlock>
              </div>
              <div className="pt-2 flex flex-wrap gap-2">
                <Button variant="primary" onClick={() => beginJourney(p)}>
                  Begin Divine Journey
                </Button>
                <Button onClick={() => editProfile(p)}>Edit</Button>
                <Button onClick={() => deleteProfile(p)}>Delete</Button>
              </div>
            </Card>
          ))}
        </>
      )}
    </div>
  );
}
