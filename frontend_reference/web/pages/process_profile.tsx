import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { API_BASE } from '@/lib/api';
import Button from '@/components/Button';
import { useAuth } from '@/lib/useAuth';
import type { Profile } from '@/types/Profile';
import SecureAutoPlayVideo from '@/components/SecureAutoPlayVideo';
import { useTranslation } from 'react-i18next';

const ENGINE_PROGRESS_NAMES = [
  'Panchang',
  'Dasha',
  'Navamsa',
  'Dasamsa',
  'numerology',
  'business',
  'education',
  'job',
  'overseas',
  'marriage',
  'Love',
  'relationship',
  'family',
  'enemy',
  'Dream',
  'game',
  'celebrity',
  'politics',
  'legal',
  'wealth',
  'protection',
  'black magic',
  'pakshi',
  'God bless time',
  'danger',
  'trust',
  'betray',
  'lust',
];

export default function ProcessProfile() {
  const router = useRouter();
  const { from } = router.query as { from?: string };
  const source = from ?? 'default';
  const { t } = useTranslation();
  type StatusType = 'pending' | 'processing' | 'done' | 'error';
  const [status, setStatus] = useState<StatusType>('pending');
  const [error, setError] = useState('');
  const [profileId, setProfileId] = useState<number | null>(null);
  const [dedupeNotice, setDedupeNotice] = useState<string | null>(null);
  const { ensureSession, token } = useAuth();
  const [currentEngineIndex, setCurrentEngineIndex] = useState(0);
  const [logoVideoError, setLogoVideoError] = useState(false);
  const [loadingVideoError, setLoadingVideoError] = useState(false);
  const logoVideoRef = useRef<HTMLVideoElement | null>(null);
  const idempotencyKeyRef = useRef<string>('');

  const ensureSessionRef = useRef(ensureSession);
  useEffect(() => {
    ensureSessionRef.current = ensureSession;
  }, [ensureSession]);

  useEffect(() => {
    if (status !== 'processing') {
      setCurrentEngineIndex(0);
      return;
    }

    setCurrentEngineIndex(0);
    const interval = setInterval(() => {
      setCurrentEngineIndex((prev) => (prev + 1) % ENGINE_PROGRESS_NAMES.length);
    }, 1000);

    return () => clearInterval(interval);
  }, [status]);

  // Effect 1: Start the profile creation task once.
  useEffect(() => {
    const dataStr =
      typeof window !== 'undefined' ? localStorage.getItem('profile_form_data') : null;

    if (!dataStr) {
      router.replace(`/profile?from=${source}`);
      return;
    }

    const startTask = async () => {
      try {
        setStatus('processing');
        const formData = JSON.parse(dataStr);

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (!idempotencyKeyRef.current) {
          if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
            idempotencyKeyRef.current = crypto.randomUUID();
          } else {
            idempotencyKeyRef.current = `profile-${Date.now()}-${Math.random()
              .toString(36)
              .slice(2)}`;
          }
        }
        headers['X-Idempotency-Key'] = idempotencyKeyRef.current;
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }
        
        const res = await fetch(`${API_BASE}/api/run_profile_now`, {
          method: 'POST',
          headers,
          body: JSON.stringify(formData),
          credentials: 'include',
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => null);
          const errorMessage = errData?.error || errData?.message || `Server error (${res.status})`;
          throw new Error(errorMessage);
        }

        const data = await res.json();
        if (data?.profile_id) {
          setProfileId(data.profile_id);
          localStorage.removeItem('profile_form_data');
          if (data.deduped || data.idempotent) {
            const notice =
              data.message ||
              'We found an existing profile with the same details. Loading it now.';
            setDedupeNotice(notice);
            if (typeof window !== 'undefined') {
              sessionStorage.setItem(
                'profile_dedup_notice',
                JSON.stringify({ message: notice, profile_id: data.profile_id })
              );
            }
          }
        } else {
          throw new Error('Did not receive a profile_id from the server.');
        }
      } catch (err: any) {
        setError(err.message || 'An error occurred while starting the task.');
        setStatus('error');
      }
    };

    void startTask();
  }, [router, source, token]);

  // Effect 2: Poll for the profile status once we have a profileId.
  useEffect(() => {
    if (!profileId) return;

    const interval = setInterval(async () => {
      try {
        const headers: Record<string, string> = {};
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }
        
        const res = await fetch(`${API_BASE}/api/profile/${profileId}`, {
          headers,
          credentials: 'include',
        });

        if (!res.ok) {
          if (process.env.NODE_ENV === 'development') {
            console.warn(`Profile fetch failed with status ${res.status}`);
          }
          return;
        }

        const profile: Profile = await res.json();

        if (profile?.processing_status === 'completed') {
          clearInterval(interval);
          await ensureSessionRef.current({ forceRefresh: true });
          setStatus('done');
        } else if (profile?.processing_status === 'failed') {
          clearInterval(interval);
          setError('Profile creation failed in the background. Please try again.');
          setStatus('error');
        }
      } catch (err: any) {
        console.error('Polling error:', err);
      }
    }, 3000); 

    return () => clearInterval(interval);
  }, [profileId, router, token]);

  useEffect(() => {
    if (status !== 'done') {
      return;
    }

    const timeout = setTimeout(() => {
      router.push('/profile');
    }, 1000);

    const video = logoVideoRef.current;
    if (video) {
      try {
        video.currentTime = 0;
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise.catch((error) => {
            // Autoplay blocked or other playback error - this is expected behavior
            if (process.env.NODE_ENV === 'development') {
              console.log('Video autoplay prevented:', error);
            }
          });
        }
      } catch (err) {
        // noop - autoplay might be blocked, but redirect will still occur.
        if (process.env.NODE_ENV === 'development') {
          console.log('Video play error:', err);
        }
      }
    }

    return () => {
      clearTimeout(timeout);
    };
  }, [status, router]);


  if (status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center h-screen space-y-4">
        <div className="text-red-600 text-center">{error}</div>
        <Button
          variant="primary"
          onClick={() => router.replace(`/profile?from=${source}`)}
        >
          Try Again
        </Button>
      </div>
    );
  }

  const messages: Record<StatusType, string> = {
    pending: '⏳ Initializing...',
    processing: '✨ Your profile is being created in the background. Please wait...',
    done: '',
    error: '',
  };

  // --- THIS IS THE MODIFIED PART ---
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center text-blue-400 text-center bg-transparent">
      {dedupeNotice && (
        <div className="mb-4 text-accent max-w-md">{dedupeNotice}</div>
      )}
      {status === 'done' ? (
        logoVideoError ? (
          <div className="w-32 h-32 rounded-full bg-black/40 flex items-center justify-center text-sm text-center">
            {t('common.unavailable', { defaultValue: 'Celebration animation unavailable' })}
          </div>
        ) : (
          <SecureAutoPlayVideo
            ref={logoVideoRef}
            sources={[{ src: '/Logo_Loading_Video_Generation.webm', type: 'video/webm' }]}
            className="w-32 h-32"
            onError={() => setLogoVideoError(true)}
            description="Profile creation success animation"
          />
        )
      ) : (status === 'processing' || status === 'pending') ? (
        <div className="flex flex-col items-center">
          {loadingVideoError ? (
            <div className="w-full max-w-md md:max-w-lg h-auto rounded-lg bg-black/30 text-center p-6">
              {t('common.unavailable', { defaultValue: 'Loading animation unavailable.' })}
            </div>
          ) : (
            <SecureAutoPlayVideo
              sources={[{ src: '/loading-animation.webm', type: 'video/webm' }]}
              className="w-full max-w-md md:max-w-lg h-auto rounded-lg shadow-2xl shadow-cyan-500/20"
              onError={() => setLoadingVideoError(true)}
              description="Profile creation loading animation"
            />
          )}
          <p className="mt-4 text-lg animate-pulse">{messages[status]}</p>
          {status === 'processing' && (
            <p className="mt-2 text-base text-blue-400">
              {ENGINE_PROGRESS_NAMES[currentEngineIndex]} is created
            </p>
          )}
        </div>
      ) : (
        <p className="text-2xl font-semibold">{messages[status]}</p>
      )}
    </div>
  );
}
