import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useProfileStore } from '@/state/profileStore';
import { useActiveProfile } from '@/lib/useActiveProfile';
import getProfileId from '@/lib/getProfileId';
import { useUIStore } from '@/state/uiStore';
import type { Profile } from '@/types/Profile';
import { normaliseProfile } from '@/lib/normaliseProfile';
import { useTranslation } from 'react-i18next';

export default function ProfileList() {
  const { profiles, loadProfiles } = useProfileStore();
  const { profile: activeProfile, setActiveProfile } = useActiveProfile();
  const { closeSidebar } = useUIStore();
  const { t } = useTranslation();
  const [lockedProfileId, setLockedProfileId] = useState<number | null>(null);
  const lockTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (profiles.length === 0) loadProfiles();
  }, [profiles.length, loadProfiles]);

  useEffect(() => {
    return () => {
      if (lockTimeoutRef.current) {
        clearTimeout(lockTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-sm uppercase mb-2">{t('nav.profiles')}</h2>
      <ul>
        <li>
          <Link href="/add_profile" className="block py-2 text-blue-400">
            {t('nav.addProfile')}
          </Link>
        </li>
        {profiles.map((p) => {
          const profileId = getProfileId(p);
          const status = p.processing_status === 'completed' ? 'completed' : 'pending';
          const isActive = activeProfile?.id === profileId;
          return (
            <li key={profileId}>
              <Link
                href="/personal-panchang"
                onClick={() => {
                  if (!profileId) return;
                  if (lockedProfileId === profileId) return;
                  setLockedProfileId(profileId);
                  if (lockTimeoutRef.current) {
                    clearTimeout(lockTimeoutRef.current);
                  }
                  lockTimeoutRef.current = setTimeout(() => setLockedProfileId(null), 600);
                  const next = normaliseProfile({ ...p, id: profileId } as Profile);
                  if (next) {
                    setActiveProfile(next);
                    localStorage.setItem('active_profile_id', String(profileId));
                  }
                  closeSidebar();
                }}
                className={`flex items-center w-full py-2 text-left ${
                  isActive ? 'bg-gray-700' : ''
                }`}
              >
                <span className="flex-1">
                  {p.first_name} {p.last_name || ''}
                </span>
                {isActive && <span className="ml-1 text-green-500">✓</span>}
                {!isActive && (
                  <span
                    className={`ml-1 text-xs ${
                      status === 'completed' ? 'text-green-500' : 'text-accent'
                    }`}
                    aria-label={status}
                    title={status === 'completed' ? t('nav.statusCompleted') : t('nav.statusPending')}
                  >
                    {status === 'completed' ? '✓' : '⏳'}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
