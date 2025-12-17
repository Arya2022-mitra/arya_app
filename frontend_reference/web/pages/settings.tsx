import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { API_BASE } from '@/lib/api';
import { useAuth, useUserEmail } from '@/lib/useAuth';
import Button from '@/components/Button';
import EditLocationModal from '@/components/EditLocationModal';
import { handleUnauthorized } from '@/lib/handleUnauthorized';
import { LANGUAGES } from '@/lib/languages';
import { resolveAuthToken } from '@/lib/resolveAuthToken';
import { useTranslation } from 'react-i18next';
import i18n from '@/lib/i18n';

interface ProfileSettings {
  voice?: string | null;
  [key: string]: any;
}

interface Profile {
  id: number;
  first_name: string;
  last_name: string;
  relationship: string;
  location: string;
  city: string;
  state: string;
  country: string;
  tz_str: string;
  lat: number;
  lon: number;
  recompute_status: string;
  processing_status: string;
  voice?: string | null;
  settings?: ProfileSettings;
}

interface Subscription {
  plan: string;
  status: string;
  next_billing?: string;
  provider?: string;
}

interface SettingsData {
  email: string;
  profile_count: number;
  locale: string;
  subscription: Subscription | null;
}

interface VoiceCatalog {
  voices: string[];
  default?: string | null;
}

export default function Settings() {
  const router = useRouter();
  const { token, logout, sessionRestored, refreshToken, userId, ensureSession, setUserLanguage } = useAuth();
  const email = useUserEmail();
  const loading = !sessionRestored;
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState<'account' | 'profiles' | 'profile-management' | 'subscription' | 'help' | 'danger'>('account');
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedLocale, setSelectedLocale] = useState('en');
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [voiceCatalog, setVoiceCatalog] = useState<VoiceCatalog | null>(null);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [voiceLoading, setVoiceLoading] = useState(false);
  const [profileVoices, setProfileVoices] = useState<Record<number, string>>({});
  const [savingVoiceProfileId, setSavingVoiceProfileId] = useState<number | null>(null);

  // Fetch settings data
  useEffect(() => {
    if (!token || !sessionRestored) return;

    const fetchSettings = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/settings`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: 'include',
        });
        
        if (res.ok) {
          const data = await res.json();
          setSettings(data);
          setSelectedLocale(data.locale || 'en');
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      }
    };

    fetchSettings();
  }, [token, sessionRestored]);

  useEffect(() => {
    if (!token || !sessionRestored) return;

    let isMounted = true;

    const fetchVoices = async () => {
      setVoiceLoading(true);
      setVoiceError(null);
      try {
        const authTok = await resolveAuthToken({ token, refreshToken, ensureSession });
        if (!authTok) {
          if (isMounted) {
            setVoiceLoading(false);
          }
          return;
        }

        const makeRequest = (authHeader: string) =>
          fetch(`${API_BASE}/api/v1/voices`, {
            headers: { Authorization: `Bearer ${authHeader}` },
            credentials: 'include',
          });

        let res = await makeRequest(authTok);

        if (res.status === 401) {
          const retryRes = await handleUnauthorized(router, {
            logout,
            refreshToken,
            retry: async (fresh) => {
              if (!fresh) {
                return new Response(null, { status: 401 });
              }
              return makeRequest(fresh);
            },
          });
          if (!retryRes) {
            if (isMounted) {
              setVoiceLoading(false);
            }
            return;
          }
          res = retryRes;
        }

        if (res.ok) {
          const data: VoiceCatalog = await res.json();
          if (isMounted) {
            setVoiceCatalog({
              voices: Array.isArray(data.voices) ? data.voices : [],
              default: data.default ?? null,
            });
          }
        } else {
          let message = 'Unable to load voices.';
          try {
            const err = await res.json();
            if (err?.message) {
              message = err.message;
            }
          } catch (err) {
            // ignore json parsing errors
          }
          if (isMounted) {
            setVoiceError(message);
          }
        }
      } catch (error) {
        console.error('Failed to load voices:', error);
        if (isMounted) {
          setVoiceError('Failed to load voices. Please try again later.');
        }
      } finally {
        if (isMounted) {
          setVoiceLoading(false);
        }
      }
    };

    fetchVoices();

    return () => {
      isMounted = false;
    };
  }, [token, sessionRestored, refreshToken, ensureSession, router, logout]);

  // Fetch profiles
  useEffect(() => {
    if (!token || !sessionRestored || activeTab !== 'profiles' || !userId) return;
    
    const fetchProfiles = async () => {
      try {
        // Robust token resolution using shared utility
        const authTok = await resolveAuthToken({ token, refreshToken, ensureSession });
        if (!authTok) {
          return;
        }

        const headers: Record<string, string> = {
          Authorization: `Bearer ${authTok}`,
        };

        // Use canonical /get_profiles endpoint
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
            return;
          }
          res = retryRes;
        }
        
        if (res.ok) {
          const data = await res.json();
          // /get_profiles returns an array directly
          const rawProfiles = Array.isArray(data) ? data : [];
          const normalized = rawProfiles.map((profile: any) => ({
            ...profile,
            settings: profile?.settings ?? {},
          }));
          setProfiles(normalized);
          setProfileVoices(
            normalized.reduce<Record<number, string>>((acc, profile: any) => {
              const settingsVoice = profile?.settings?.voice;
              const directVoice = profile?.voice;
              const effective =
                typeof settingsVoice === 'string'
                  ? settingsVoice
                  : typeof directVoice === 'string'
                  ? directVoice
                  : '';
              acc[profile.id] = effective || '';
              return acc;
            }, {}),
          );
        }
      } catch (error) {
        console.error('Failed to fetch profiles:', error);
      }
    };
    
    fetchProfiles();
  }, [token, sessionRestored, activeTab, userId, refreshToken, logout, router, ensureSession]);

  const updateLanguage = async (locale: string) => {
    // Handle logged-out users - update locally only
    if (!token) {
      try {
        // Update local state and localStorage
        setSelectedLocale(locale);
        if (typeof window !== 'undefined') {
          localStorage.setItem('user_language', locale);
          localStorage.setItem('locale', locale);
        }
        // Trigger i18n language change for immediate UI update
        await i18n.changeLanguage(locale);
        alert(t('settings.languageUpdatedLocally'));
      } catch (error) {
        console.error('Failed to update language locally:', error);
        alert(t('settings.languageUpdateFailed'));
      }
      return;
    }
    
    try {
      // Update GlobalSessionContext - this handles localStorage, i18n, and backend update
      // This will throw an error if backend persistence fails
      await setUserLanguage(locale);
      
      // Also persist to compatibility key for any legacy code
      try {
        localStorage.setItem('locale', locale);
      } catch (storageError) {
        // Log but don't fail - this is just for backward compatibility
        console.warn('Failed to persist locale compatibility key to localStorage:', storageError);
      }
      
      // Update local state only after successful backend persistence
      setSelectedLocale(locale);
      alert(t('settings.languageUpdated'));
    } catch (error) {
      console.error('Failed to update language:', error);
      // Show user-friendly error message
      const errorMessage = error instanceof Error ? error.message : t('settings.languageUpdateFailed');
      alert(errorMessage);
    }
  };

  const handleSaveLocation = async (location: any) => {
    if (!token || !editingProfile || !userId) return;

    try {
      const res = await fetch(`${API_BASE}/api/v1/profiles/${editingProfile.id}/location`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          place_text: `${location.city}, ${location.state}, ${location.country}`,
          ...location,
        }),
        credentials: 'include',
      });
      
      if (res.ok) {
        alert('Location updated successfully. Profile recomputation has been queued.');
        // Refresh profiles using canonical endpoint
        const profilesRes = await fetch(`${API_BASE}/get_profiles?user_id=${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: 'include',
        });
        
        if (profilesRes.ok) {
          const data = await profilesRes.json();
          // /get_profiles returns an array directly
          setProfiles(Array.isArray(data) ? data : []);
        }
      }
    } catch (error) {
      console.error('Failed to update location:', error);
      throw error;
    }
  };

  const handleVoiceChange = async (profileId: number, selectedVoice: string) => {
    const desiredVoice = selectedVoice || '';
    const previousVoice = profileVoices[profileId] ?? '';

    if (desiredVoice === previousVoice) {
      return;
    }

    setProfileVoices((prev) => ({ ...prev, [profileId]: desiredVoice }));

    try {
      const authTok = await resolveAuthToken({ token, refreshToken, ensureSession });
      if (!authTok) {
        setProfileVoices((prev) => ({ ...prev, [profileId]: previousVoice }));
        return;
      }

      const makeRequest = (authHeader: string) =>
        fetch(`${API_BASE}/api/v1/profiles/${profileId}/voice`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authHeader}`,
          },
          body: JSON.stringify({ voice: desiredVoice || null }),
          credentials: 'include',
        });

      setSavingVoiceProfileId(profileId);
      let res = await makeRequest(authTok);

      if (res.status === 401) {
        const retryRes = await handleUnauthorized(router, {
          logout,
          refreshToken,
          retry: async (fresh) => {
            if (!fresh) {
              return new Response(null, { status: 401 });
            }
            return makeRequest(fresh);
          },
        });
        if (!retryRes) {
          setProfileVoices((prev) => ({ ...prev, [profileId]: previousVoice }));
          return;
        }
        res = retryRes;
      }

      if (res.ok) {
        const data = await res.json();
        const persistedVoice = typeof data.voice === 'string' ? data.voice : '';
        setProfiles((prev) =>
          prev.map((profile) =>
            profile.id === profileId
              ? {
                  ...profile,
                  voice: persistedVoice || null,
                  settings: { ...(profile.settings ?? {}), voice: data.voice ?? null },
                }
              : profile,
          ),
        );
        setProfileVoices((prev) => ({ ...prev, [profileId]: persistedVoice }));
        alert('Voice saved');
      } else {
        let message = 'Failed to update voice.';
        try {
          const err = await res.json();
          if (err?.message) {
            message = err.message;
          }
        } catch (err) {
          // ignore JSON parsing errors
        }
        setProfileVoices((prev) => ({ ...prev, [profileId]: previousVoice }));
        alert(message);
      }
    } catch (error) {
      console.error('Failed to update voice:', error);
      setProfileVoices((prev) => ({ ...prev, [profileId]: previousVoice }));
      alert('Failed to update voice. Please try again later.');
    } finally {
      setSavingVoiceProfileId((current) => (current === profileId ? null : current));
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE MY ACCOUNT') {
      alert('Please type "DELETE MY ACCOUNT" to confirm');
      return;
    }
    
    if (!token) return;
    
    setIsDeleting(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/account/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          confirmation: deleteConfirmation,
        }),
        credentials: 'include',
      });
      
      if (res.ok) {
        const data = await res.json();
        alert(data.message);
        await logout();
        router.push('/auth');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete account');
      }
    } catch (error) {
      console.error('Failed to delete account:', error);
      alert('Failed to delete account');
    } finally {
      setIsDeleting(false);
    }
  };

  const doLogout = async () => {
    if (!token) {
      await logout();
      router.push('/auth');
      return;
    }
    
    try {
      await fetch(`${API_BASE}/api/v1/logout`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout API call failed:', error);
    }
    
    await logout();
    router.push('/auth');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-blue-400">{t('common.loading')}</div>
    );
  }

  const getRecomputeStatusBadge = (status: string) => {
    const statusColors = {
      idle: 'bg-gray-200 text-gray-800',
      queued: 'bg-yellow-200 text-yellow-800',
      running: 'bg-blue-200 text-blue-800 animate-pulse',
      done: 'bg-green-200 text-green-800',
      failed: 'bg-red-200 text-red-800',
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status as keyof typeof statusColors] || statusColors.idle}`}>
        {status || 'idle'}
      </span>
    );
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">{t('settings.title')}</h1>
          
          {/* Desktop: Two-column layout, Mobile: Single column */}
          <div className="lg:grid lg:grid-cols-4 lg:gap-8">
            {/* Left Navigation */}
            <div className="lg:col-span-1 mb-6 lg:mb-0">
              <nav className="space-y-1">
                {[
                  { id: 'account', label: t('settings.account'), icon: '👤' },
                  { id: 'profiles', label: t('settings.profiles'), icon: '👥' },
                  { id: 'profile-management', label: t('settings.profileManagement'), icon: '📝' },
                  { id: 'subscription', label: t('settings.subscription'), icon: '💳' },
                  { id: 'help', label: t('settings.help'), icon: '❓' },
                  { id: 'danger', label: t('settings.danger'), icon: '⚠️' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition ${
                      activeTab === tab.id
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <span className="mr-3">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Right Content Area */}
            <div className="lg:col-span-3">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                {/* Account Tab */}
                {activeTab === 'account' && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">{t('settings.account')}</h2>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {t('settings.email')}
                        </label>
                        <input
                          type="email"
                          value={email ?? ''}
                          disabled
                          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {t('settings.profileCount')}
                        </label>
                        <input
                          type="text"
                          value={settings?.profile_count ?? 0}
                          disabled
                          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {t('settings.language')}
                        </label>
                        <select
                          value={selectedLocale}
                          onChange={(e) => updateLanguage(e.target.value)}
                          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          {LANGUAGES.map((lang) => (
                            <option key={lang.code} value={lang.code}>
                              {lang.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Profiles Tab */}
                {activeTab === 'profiles' && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">{t('settings.profiles')}</h2>

                    {voiceLoading && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Loading available voices...
                      </p>
                    )}

                    {voiceError && (
                      <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/40 dark:text-red-100">
                        {voiceError}
                      </div>
                    )}

                    <div className="space-y-4">
                      {profiles.map((profile) => (
                        <div
                          key={profile.id}
                          className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h3 className="font-semibold text-gray-900 dark:text-white">
                                {profile.first_name} {profile.last_name}
                              </h3>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {profile.relationship}
                              </p>
                            </div>
                            {getRecomputeStatusBadge(profile.recompute_status)}
                          </div>

                          <div className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                            <p>📍 {profile.location}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Timezone: {profile.tz_str}
                            </p>
                          </div>

                          <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Voice
                            </label>
                            <select
                              value={profileVoices[profile.id] ?? ''}
                              onChange={(event) => handleVoiceChange(profile.id, event.target.value)}
                              disabled={
                                !voiceCatalog ||
                                voiceLoading ||
                                !!voiceError ||
                                savingVoiceProfileId === profile.id
                              }
                              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            >
                              <option value="">
                                {voiceCatalog?.default
                                  ? `Default (${voiceCatalog.default})`
                                  : 'Use default voice'}
                              </option>
                              {(voiceCatalog?.voices ?? []).map((voice) => (
                                <option key={voice} value={voice}>
                                  {voice}
                                  {voiceCatalog?.default && voice === voiceCatalog.default ? ' (default)' : ''}
                                </option>
                              ))}
                            </select>
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                              {voiceCatalog?.default
                                ? `Default uses ${voiceCatalog.default}.`
                                : 'Default uses the voice configured by the service.'}
                            </p>
                            {savingVoiceProfileId === profile.id && (
                              <p className="mt-1 text-xs text-blue-600 dark:text-blue-300">Saving voice...</p>
                            )}
                          </div>

                          <Button
                            variant="primary"
                            onClick={() => setEditingProfile(profile)}
                            disabled={profile.recompute_status === 'running'}
                          >
                            Edit Location
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Profile Management Tab */}
                {activeTab === 'profile-management' && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {t('settings.profileManagement')}
                    </h2>
                    
                    <div className="space-y-4">
                      <p className="text-gray-600 dark:text-gray-400">
                        {t('settings.profileManagementDescription')}
                      </p>
                      
                      <Button 
                        variant="primary"
                        onClick={() => router.push('/profile')}
                      >
                        {t('settings.goToProfileManagement')}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Subscription Tab */}
                {activeTab === 'subscription' && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Subscription</h2>
                    
                    {settings?.subscription ? (
                      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-700 dark:text-gray-300">Plan:</span>
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {settings.subscription.plan}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-700 dark:text-gray-300">Status:</span>
                            <span className={`font-semibold ${
                              settings.subscription.status === 'active' 
                                ? 'text-green-600' 
                                : 'text-red-600'
                            }`}>
                              {settings.subscription.status}
                            </span>
                          </div>
                          {settings.subscription.next_billing && (
                            <div className="flex justify-between">
                              <span className="text-gray-700 dark:text-gray-300">Next Billing:</span>
                              <span className="font-semibold text-gray-900 dark:text-white">
                                {new Date(settings.subscription.next_billing).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        <Button variant="primary" className="mt-4 w-full">
                          Manage Subscription
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-500 dark:text-gray-400 mb-4">
                          No active subscription
                        </p>
                        <Button variant="primary">
                          Subscribe Now
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* Help Tab */}
                {activeTab === 'help' && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Help & FAQ</h2>
                    
                    <div className="space-y-4">
                      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                          How do I change my profile location?
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                          Go to the Profiles tab, select a profile, and click &quot;Edit Location&quot;. 
                          Choose a new location from the search results and save.
                        </p>
                      </div>
                      
                      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                          What happens when I update my location?
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                          Your profile data will be recomputed based on the new location. 
                          This process may take a few minutes.
                        </p>
                      </div>
                      
                      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                          How do I cancel my subscription?
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                          Visit the Subscription tab and click &quot;Manage Subscription&quot; to access 
                          your billing portal where you can cancel or modify your plan.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Danger Zone Tab */}
                {activeTab === 'danger' && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-semibold text-red-600">Danger Zone</h2>
                    
                    <div className="border-2 border-red-200 dark:border-red-800 rounded-lg p-6 space-y-4">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                          Logout
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                          Sign out of your account on this device.
                        </p>
                        <Button onClick={doLogout}>
                          Logout
                        </Button>
                      </div>
                      
                      <hr className="border-gray-300 dark:border-gray-700" />
                      
                      <div>
                        <h3 className="font-semibold text-red-600 mb-2">
                          Delete Account
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                          Permanently delete your account and all associated data. 
                          This action cannot be undone. You will have a 30-day grace period to recover your account.
                        </p>
                        
                        <div className="mb-3">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Type &quot;DELETE MY ACCOUNT&quot; to confirm:
                          </label>
                          <input
                            type="text"
                            value={deleteConfirmation}
                            onChange={(e) => setDeleteConfirmation(e.target.value)}
                            className="w-full p-3 border border-red-300 dark:border-red-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            placeholder="DELETE MY ACCOUNT"
                          />
                        </div>
                        
                        <Button
                          onClick={handleDeleteAccount}
                          disabled={deleteConfirmation !== 'DELETE MY ACCOUNT' || isDeleting}
                          className="bg-red-600 hover:bg-red-700 text-white"
                        >
                          {isDeleting ? 'Deleting...' : 'Delete My Account'}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Location Modal */}
      {editingProfile && (
        <EditLocationModal
          isOpen={!!editingProfile}
          onClose={() => setEditingProfile(null)}
          profileId={editingProfile.id}
          currentLocation={{
            city: editingProfile.city,
            state: editingProfile.state,
            country: editingProfile.country,
            lat: editingProfile.lat,
            lon: editingProfile.lon,
            tz_str: editingProfile.tz_str,
          }}
          onSave={handleSaveLocation}
        />
      )}
    </>
  );
}
