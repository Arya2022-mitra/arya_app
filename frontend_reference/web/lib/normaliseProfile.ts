import type { Profile } from '@/types/Profile';
import { normaliseTimeOfBirth } from './normaliseTimeOfBirth';

export function normaliseProfile<T extends Profile | null | undefined>(
  profile: T,
): T extends null | undefined ? null : Profile;
export function normaliseProfile(profile: Profile | null | undefined): Profile | null;
export function normaliseProfile(profile: Profile | null | undefined): Profile | null {
  if (!profile) return null;

  const next: Profile = { ...profile };

  if ('tob' in next) {
    const formatted = normaliseTimeOfBirth((next as Profile).tob);
    if (formatted) {
      next.tob = formatted;
    } else {
      delete next.tob;
    }
  }

  return next;
}

export default normaliseProfile;
