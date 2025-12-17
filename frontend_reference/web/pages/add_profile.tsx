import { useState, useEffect, FormEvent, useRef, useMemo } from 'react';
import { useRouter } from 'next/router';
import { API_BASE } from '@/lib/api';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { useAuth } from '@/lib/useAuth';
import { useActiveProfile } from '@/lib/useActiveProfile';
import { useProfileStore } from '@/state/profileStore';
import { useTranslation } from 'react-i18next';

interface Suggestion {
  city: string;
  state: string;
  country: string;
  lat: string;
  lng: string;
  tz: string;
  tz_offset?: number;
  timezone: string;
}

interface CurrentLocation {
  city: string;
  lat: string;
  lon: string;
  tz_str: string;
  source: string;
  timestampISO: string;
}


const TIME_ERROR_MESSAGE = 'Please enter a valid time (e.g., 2:45 PM).';
const TIME_AMPM_REGEX = /^([0]?[1-9]|1[0-2]):([0-5]\d)\s*(AM|PM)$/i;

type ParsedTime = {
  display: string;
  value24: string;
};

function normaliseWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function parseTwelveHourTime(value: string): ParsedTime | null {
  if (!value) return null;
  const trimmed = normaliseWhitespace(value).toUpperCase();
  if (!trimmed) return null;
  const match = TIME_AMPM_REGEX.exec(trimmed);
  if (!match) return null;

  const hour12 = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  const suffix = match[3].toUpperCase() as 'AM' | 'PM';

  if (Number.isNaN(hour12) || Number.isNaN(minute)) return null;
  if (hour12 < 1 || hour12 > 12) return null;
  if (minute < 0 || minute > 59) return null;

  let hour24 = hour12 % 12;
  if (suffix === 'PM') hour24 += 12;

  const displayHour = (hour12 % 12 === 0 ? 12 : hour12 % 12)
    .toString()
    .padStart(2, '0');
  const displayMinute = minute.toString().padStart(2, '0');

  return {
    display: `${displayHour}:${displayMinute} ${suffix}`,
    value24: `${hour24.toString().padStart(2, '0')}:${displayMinute}`,
  };
}

const getGeoApiEndpoints = (query: string) => {
  return [`/api/geo/citylist?q=${encodeURIComponent(query)}`];
};


export default function AddProfile() {
  const router = useRouter();
  const { t } = useTranslation();
  const { from } = router.query as { from?: string };
  const source = from ?? 'default';
  const { sessionRestored, token, restoreSession, logout } = useAuth();
  const loadingAuth = !sessionRestored;
  const { loading } = useActiveProfile();
  const { profiles, loadProfiles } = useProfileStore();
  const [profilesReady, setProfilesReady] = useState(false);
  const [tokenReady, setTokenReady] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState('');
  const [dob, setDob] = useState('');
  const [tob, setTob] = useState('');
  const [tobInput, setTobInput] = useState('');
  const [tobError, setTobError] = useState('');
  const [tobHour, setTobHour] = useState('');
  const [tobMinute, setTobMinute] = useState('');
  const [tobPeriodState, setTobPeriodState] = useState<'AM' | 'PM' | ''>('');
  const [placeOfBirth, setPlaceOfBirth] = useState('');
  const [lat, setLat] = useState('');
  const [lon, setLon] = useState('');
  const [tzStr, setTzStr] = useState('');
  const [stateName, setStateName] = useState('');
  const [country, setCountry] = useState('');
  const [relationship, setRelationship] = useState('');
  const [maritalStatus, setMaritalStatus] = useState('');
  const [occupation, setOccupation] = useState('');
  const [studentLevel, setStudentLevel] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<CurrentLocation>({
    city: '',
    lat: '',
    lon: '',
    tz_str: '',
    source: 'manual',
    timestampISO: '',
  });
  const [currentSuggestions, setCurrentSuggestions] = useState<Suggestion[]>([]);
  const [showCurrentSuggestions, setShowCurrentSuggestions] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const currentContainerRef = useRef<HTMLDivElement>(null);
  const currentDebounceRef = useRef<NodeJS.Timeout | null>(null);

  function updateTobFromParts(hour: string, minute: string, period: 'AM' | 'PM' | '') {
    if (!hour || !minute || !period) {
      setTob('');
      setTobInput('');
      if (!hour && !minute && !period) {
        setTobError('');
      }
      return;
    }
    const h = hour.toString().padStart(2, '0');
    const m = minute.toString().padStart(2, '0');
    const candidate = `${h}:${m} ${period}`;
    const parsed = parseTwelveHourTime(candidate);
    if (parsed) {
      setTob(parsed.value24);
      setTobInput(parsed.display);
      if (tobError) setTobError('');
    } else {
      setTob('');
      setTobInput(candidate);
      setTobError(TIME_ERROR_MESSAGE);
    }
  }

  const selfProfileExists = useMemo(
    () => profiles.some((profile) => profile.relationship === 'self'),
    [profiles]
  );
  const isFirstProfile = profilesReady && profiles.length === 0;
  const disableRelationshipSelect = isFirstProfile || !profilesReady;

  useEffect(() => {
    if (loadingAuth || !tokenReady) return;
    let active = true;
    const ensureProfiles = async () => {
      try {
        if (profiles.length === 0) {
          await loadProfiles();
        }
      } finally {
        if (active) setProfilesReady(true);
      }
    };
    ensureProfiles();
    return () => {
      active = false;
    };
  }, [loadingAuth, tokenReady, profiles.length, loadProfiles]);

  useEffect(() => {
    if (!profilesReady) return;
    if (profiles.length === 0 && relationship !== 'self') {
      setRelationship('self');
    }
  }, [profilesReady, profiles.length, relationship]);

  useEffect(() => {
    if (!profilesReady) return;
    if (profiles.length > 0 && selfProfileExists && relationship === 'self') {
      setRelationship('');
    }
  }, [profilesReady, profiles.length, selfProfileExists, relationship]);

  // Restore token and validate session or allow signup flow
  useEffect(() => {
    if (!sessionRestored) return;

    let active = true;
    const isFromSignup = router.query.signup === '1';

    const verify = async () => {
      const authToken = token ?? undefined;
      const ok = await restoreSession(authToken);
      if (!active) return;

      if ((!ok || !authToken) && !isFromSignup) {
        await logout();
        router.replace('/auth');
        return;
      }

      setTokenReady(true);
    };

    verify();

    return () => {
      active = false;
    };
  }, [logout, restoreSession, router, sessionRestored, token]);

  useEffect(() => {
    if (!tokenReady) return;
    console.log('AddProfile mounted', { from: source });
  }, [source, tokenReady]);

  const handleCityInputChange = (query: string) => {
    setPlaceOfBirth(query);
    setLat('');
    setLon('');
    setTzStr('');
    setStateName('');
    setCountry('');
  };

  const handleCurrentCityInputChange = (query: string) => {
    setCurrentLocation({
      city: query,
      lat: '',
      lon: '',
      tz_str: '',
      source: 'manual',
      timestampISO: new Date().toISOString(),
    });
  };

  const fetchCitySuggestions = async (query: string) => {
    if (!query) {
      setSuggestions([]);
      if (process.env.NODE_ENV === 'development') {
        console.log('Suggestions cleared');
      }
      return;
    }

    try {
      const endpoints = getGeoApiEndpoints(query);

      let lastError: unknown = null;

      for (const endpoint of endpoints) {
        try {
          const res = await fetch(endpoint, { credentials: 'include' });
          if (!res.ok) {
            throw new Error(`GeoAPI request failed (${res.status})`);
          }

          const data = await res.json();
          const items = Array.isArray(data) ? data.map((item: any) => ({
            city: item?.city ?? '',
            state: item?.state ?? '',
            country: item?.country ?? '',
            lat: item?.lat ?? '',
            lng: item?.lng ?? '',
            tz: item?.tz ?? '',
            tz_offset: item?.tz_offset ?? undefined,
            timezone: item?.timezone ?? '',
          })) : [];
          setSuggestions(items);
          setShowSuggestions(true);

          if (process.env.NODE_ENV === 'development' && items.length > 0) {
            console.log(`Suggestions fetched via ${endpoint}:`, items);
          }

          return;
        } catch (error) {
          lastError = error;
          if (process.env.NODE_ENV === 'development') {
            console.warn(`GeoAPI lookup failed for ${endpoint}`, error);
          }
        }
      }

      throw lastError ?? new Error('GeoAPI lookup failed');
    } catch (error) {
      console.error('Failed to fetch city suggestions', error);
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const fetchCurrentCitySuggestions = async (query: string) => {
    if (!query) {
      setCurrentSuggestions([]);
      return;
    }

    try {
      const endpoints = getGeoApiEndpoints(query);

      let lastError: unknown = null;

      for (const endpoint of endpoints) {
        try {
          const res = await fetch(endpoint, { credentials: 'include' });
          if (!res.ok) {
            throw new Error(`GeoAPI request failed (${res.status})`);
          }

          const data = await res.json();
          const items = Array.isArray(data) ? data.map((item: any) => ({
            city: item?.city ?? '',
            state: item?.state ?? '',
            country: item?.country ?? '',
            lat: item?.lat ?? '',
            lng: item?.lng ?? '',
            tz: item?.tz ?? '',
            tz_offset: item?.tz_offset ?? undefined,
            timezone: item?.timezone ?? '',
          })) : [];
          setCurrentSuggestions(items);
          setShowCurrentSuggestions(true);

          if (process.env.NODE_ENV === 'development' && items.length > 0) {
            console.log(`Current location suggestions fetched via ${endpoint}:`, items);
          }

          return;
        } catch (error) {
          lastError = error;
          if (process.env.NODE_ENV === 'development') {
            console.warn(`GeoAPI lookup failed for ${endpoint}`, error);
          }
        }
      }

      throw lastError ?? new Error('GeoAPI lookup failed');
    } catch (error) {
      console.error('Failed to fetch current city suggestions', error);
      setCurrentSuggestions([]);
      setShowCurrentSuggestions(false);
    }
  };

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchCitySuggestions(placeOfBirth);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [placeOfBirth]);

  useEffect(() => {
    if (currentDebounceRef.current) clearTimeout(currentDebounceRef.current);
    currentDebounceRef.current = setTimeout(() => {
      fetchCurrentCitySuggestions(currentLocation.city);
    }, 300);
    return () => {
      if (currentDebounceRef.current) clearTimeout(currentDebounceRef.current);
    };
  }, [currentLocation.city]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (currentContainerRef.current && !currentContainerRef.current.contains(e.target as Node)) {
        setShowCurrentSuggestions(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const selectSuggestion = (s: Suggestion) => {
    setPlaceOfBirth(`${s.city}, ${s.state}, ${s.country}`);
    setLat(s.lat);
    setLon(s.lng);
    setStateName(s.state);
    setCountry(s.country);
    setTzStr(s.tz);
    setShowSuggestions(false);
  };

  const selectCurrentSuggestion = (s: Suggestion) => {
    setCurrentLocation({
      city: `${s.city}, ${s.state}, ${s.country}`,
      lat: s.lat,
      lon: s.lng,
      tz_str: s.tz,
      source: 'manual',
      timestampISO: new Date().toISOString(),
    });
    setShowCurrentSuggestions(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (isSubmitting) return;

    if (!tob) {
      setTobError(TIME_ERROR_MESSAGE);
      setError(TIME_ERROR_MESSAGE);
      return;
    }

    if (!relationship) {
      alert('Please select a relationship.');
      return;
    }
    if (!lat || !lon || !stateName || !country) {
      alert('Please select a valid place of birth from suggestions.');
      return;
    }
    if (!tzStr) {
      alert('Please select a valid place of birth from suggestions.');
      return;
    }
    const userId =
      typeof window !== 'undefined' ? localStorage.getItem('user_id') : null;
    const latNum = parseFloat(lat);
    const lonNum = parseFloat(lon);
    const currentLoc =
      currentLocation.city && currentLocation.lat && currentLocation.lon && currentLocation.tz_str
        ? {
            city: currentLocation.city,
            lat: parseFloat(currentLocation.lat),
            lon: parseFloat(currentLocation.lon),
            tz_str: currentLocation.tz_str,
            source: currentLocation.source,
            timestampISO: currentLocation.timestampISO || new Date().toISOString(),
          }
        : null;
    const body = {
      first_name: firstName,
      last_name: lastName,
      gender,
      dob,
      tob,
      location: placeOfBirth,
      lat: latNum,
      lon: lonNum,
      tz_str: tzStr,
      state: stateName,
      country,
      relationship,
      marital_status: maritalStatus,
      occupation,
      student_level: occupation === 'Student' ? studentLevel : undefined,
      account_id: userId ? Number(userId) : undefined,
      current_location: currentLoc,
    };
    console.log('Submitting profile body', body);
    try {
      setIsSubmitting(true);
      if (typeof window !== 'undefined') {
        localStorage.setItem('profile_form_data', JSON.stringify(body));
      }
      await router.push(`/process_profile?from=${source}`);
    } catch (err) {
      console.error(err);
      setError('Profile creation failed');
      setIsSubmitting(false);
    }
  };


  if (loadingAuth || loading || !tokenReady) {
    return (
      <div className="flex justify-center items-center h-screen text-blue-400">
        {t('common.loading')}
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-4">
    <Card>
      <h1 className="text-center text-xl font-sanskrit mb-4">Add Profile</h1>
      {error && <div className="text-red-600 text-center">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block">First Name:</label>
          <input name="first_name" className="input w-full" value={firstName} onChange={e => setFirstName(e.target.value)} required />
        </div>
        <div>
          <label className="block">Last Name:</label>
          <input name="last_name" className="input w-full" value={lastName} onChange={e => setLastName(e.target.value)} required />
        </div>
        <div>
          <label className="block">Gender:</label>
          <select
            name="gender"
            value={gender}
            onChange={e => setGender(String(e.target.value))}
            className="input w-full"
            required
          >
            <option value="">Select</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          {/* Date column */}
          <div className="w-full sm:flex-none sm:w-48">
            <label className="block">Date of Birth:</label>
            <input
              name="dob"
              className="input w-full"
              type="date"
              value={dob}
              onChange={e => setDob(e.target.value)}
              required
            />
          </div>

          {/* Time column */}
          <div className="w-full sm:flex-1 sm:min-w-[260px]">
            <label className="block">Time of Birth:</label>

            {/* top control row: hour, minute, AM/PM */}
            <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
              {/* Hour select */}
              <select
                name="tob_hour"
                className="input flex-1 min-w-[4rem] sm:flex-none sm:w-24"
                value={tobHour}
                onChange={(e) => {
                  const h = e.target.value;
                  setTobHour(h);
                  updateTobFromParts(h, tobMinute || '00', tobPeriodState);
                }}
                required
              >
                <option value="">HH</option>
                {Array.from({ length: 12 }, (_, i) => {
                  const val = (i + 1).toString();
                  return (
                    <option key={val} value={val}>
                      {val.padStart(2, '0')}
                    </option>
                  );
                })}
              </select>

              {/* Minute select */}
              <select
                name="tob_minute"
                className="input flex-1 min-w-[4rem] sm:flex-none sm:w-24"
                value={tobMinute}
                onChange={(e) => {
                  const m = e.target.value;
                  setTobMinute(m);
                  updateTobFromParts(tobHour || '12', m, tobPeriodState);
                }}
                required
              >
                <option value="">MM</option>
                {Array.from({ length: 60 }, (_, i) => {
                  const val = i.toString().padStart(2, '0');
                  return (
                    <option key={val} value={val}>
                      {val}
                    </option>
                  );
                })}
              </select>

              {/* AM/PM select */}
              <select
                name="tob_period"
                className="input flex-1 min-w-[4rem] sm:flex-none sm:w-24"
                value={tobPeriodState}
                onChange={(e) => {
                  const newPeriod = e.target.value as 'AM' | 'PM' | '';
                  setTobPeriodState(newPeriod);
                  const hourForUpdate = tobHour || '12';
                  const minuteForUpdate = tobMinute || '00';
                  updateTobFromParts(hourForUpdate, minuteForUpdate, newPeriod);
                }}
                required
              >
                <option value="">AM/PM</option>
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>
            </div>

            {/* Hidden/accessible display and submission fields */}
            {/*  - tob (hidden) contains 24-hour HH:MM (existing submit flow) */}
            {/*  - tobInput we keep for screen-readers but hide visually */}
            <input name="tob" type="hidden" value={tob} />
            <input
              aria-hidden="true"
              style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', overflow: 'hidden' }}
              readOnly
              tabIndex={-1}
              value={tobInput || ''}
            />

            {/* Keep user-visible error only (no duplicate TOB display) */}
            {tobError && (
              <p id="tob-error" className="text-sm text-red-600 mt-1">
                {tobError}
              </p>
            )}
          </div>
        </div>
        <div className="relative">
          <label className="block">Place of Birth:</label>
          <div className="relative w-full" ref={containerRef}>
            <input
              name="location"
              className="input w-full"
              value={placeOfBirth}
              onChange={e => handleCityInputChange(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              required
              autoComplete="off"
            />
            {showSuggestions && suggestions.length > 0 && (
              <ul className="absolute left-0 right-0 bg-accent/20 text-white dark:bg-royal-blue dark:text-black max-h-48 overflow-y-auto border border-accent dark:border-neon-cyan rounded shadow-lg z-50 p-2">
                {suggestions.map((s, idx) => (
                  <li
                    key={idx}
                    className="px-4 py-2 hover:bg-muted-accent hover:text-deep-blue dark:hover:bg-neon-cyan dark:hover:text-royal-blue cursor-pointer border-b border-gray-200"
                    onClick={() => selectSuggestion(s)}
                  >
                    <div className="font-semibold">{s.city}</div>
                    <div className="text-sm text-gray-500">
                      {s.state}, {s.country}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <input type="hidden" name="lat" value={lat} />
        <input type="hidden" name="lon" value={lon} />
        <input type="hidden" name="tz_str" value={tzStr} />
        <input type="hidden" name="state" value={stateName} />
        <input type="hidden" name="country" value={country} />
        <details className="border p-2 rounded">
          <summary className="cursor-pointer">Current Living Location (for Daily Alerts only)</summary>
          <div className="mt-2 space-y-2">
            <div className="relative">
              <label className="block">Current City:</label>
              <div className="relative w-full" ref={currentContainerRef}>
                <input
                  className="input w-full"
                  value={currentLocation.city}
                  onChange={e => handleCurrentCityInputChange(e.target.value)}
                  onFocus={() => setShowCurrentSuggestions(true)}
                  autoComplete="off"
                />
                {showCurrentSuggestions && currentSuggestions.length > 0 && (
                  <ul className="absolute left-0 right-0 bg-accent/20 text-white dark:bg-royal-blue dark:text-black max-h-48 overflow-y-auto border border-accent dark:border-neon-cyan rounded shadow-lg z-50 p-2">
                    {currentSuggestions.map((s, idx) => (
                      <li
                        key={idx}
                        className="px-4 py-2 hover:bg-muted-accent hover:text-deep-blue dark:hover:bg-neon-cyan dark:hover:text-royal-blue cursor-pointer border-b border-gray-200"
                        onClick={() => selectCurrentSuggestion(s)}
                      >
                        <div className="font-semibold">{s.city}</div>
                        <div className="text-sm text-gray-500">
                          {s.state}, {s.country}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <div>
              <label className="block">Latitude:</label>
              <input
                type="number"
                className="input w-full"
                value={currentLocation.lat}
                onChange={(e) =>
                  setCurrentLocation({
                    ...currentLocation,
                    lat: e.target.value,
                    source: 'manual',
                    timestampISO: new Date().toISOString(),
                  })
                }
              />
            </div>
            <div>
              <label className="block">Longitude:</label>
              <input
                type="number"
                className="input w-full"
                value={currentLocation.lon}
                onChange={(e) =>
                  setCurrentLocation({
                    ...currentLocation,
                    lon: e.target.value,
                    source: 'manual',
                    timestampISO: new Date().toISOString(),
                  })
                }
              />
            </div>
            <div>
              <label className="block">Timezone:</label>
              <input
                className="input w-full"
                placeholder="Asia/Kolkata"
                value={currentLocation.tz_str}
                onChange={(e) =>
                  setCurrentLocation({
                    ...currentLocation,
                    tz_str: e.target.value,
                    source: 'manual',
                    timestampISO: new Date().toISOString(),
                  })
                }
              />
            </div>
          </div>
        </details>
        <div>
          <label className="block" htmlFor="relationship">Relationship:</label>
          <select
            id="relationship"
            name="relationship"
            value={relationship}
            onChange={(e) => setRelationship(e.target.value)}
            className="input w-full"
            required
            disabled={disableRelationshipSelect}
          >
            {isFirstProfile ? (
              <option value="self">Self</option>
            ) : (
              <>
                <option value="">Select</option>
                <option value="self" disabled={selfProfileExists}>
                  Self
                </option>
                <option value="mother">Mother</option>
                <option value="father">Father</option>
                <option value="sibling">Sibling</option>
                <option value="child">Child</option>
                <option value="friend">Friend</option>
                <option value="other">Other</option>
              </>
            )}
          </select>
          {selfProfileExists && !isFirstProfile && (
            <p className="text-sm text-gray-500 mt-1">
              Self profile already exists. Choose another relationship.
            </p>
          )}
        </div>
        <div>
          <label className="block" htmlFor="marital_status">Marital Status:</label>
          <select
            id="marital_status"
            name="marital_status"
            value={maritalStatus}
            onChange={e => setMaritalStatus(String(e.target.value))}
            className="input w-full"
            required
          >
            <option value="">Select</option>
            <option value="single">Single</option>
            <option value="married">Married</option>
            <option value="divorced">Divorced</option>
            <option value="widowed">Widowed</option>
          </select>
        </div>
        <div>
          <label className="block">Occupation:</label>
          <select
            name="occupation"
            value={occupation}
            onChange={e => setOccupation(String(e.target.value))}
            className="input w-full"
            required
          >
            <option value="">Select</option>
            <option value="Student">Student</option>
            <option value="Employed">Employed</option>
            <option value="Self-Employed">Self-Employed</option>
            <option value="Home Maker">Home Maker</option>
            <option value="Other">Other</option>
          </select>
        </div>
        {occupation === 'Student' && (
          <div>
            <label className="block">Student Level:</label>
            <input name="student_level" className="input w-full" value={studentLevel} onChange={e => setStudentLevel(e.target.value)} />
          </div>
        )}
        <Button
          type="submit"
          variant="primary"
          disabled={isSubmitting}
          className={isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}
        >
          {isSubmitting ? 'Submitting…' : 'Submit'}
        </Button>
      </form>
    </Card>
    </div>
  );
}
