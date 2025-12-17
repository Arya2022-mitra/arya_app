import { useEffect, useMemo } from 'react';
import { useActiveProfile } from '@/lib/useActiveProfile';
import { useAuth } from '@/lib/useAuth';
import { useTranslation } from 'react-i18next';
import PersonalPanchang from '@/components/PersonalPanchang';
import { useDailyPrediction } from '@/state/dailyPredictionStore';

function videoForZodiac(signName?: string | null): string | null {
  if (!signName) return null;
  const key = signName.trim().toLowerCase().replace(/\s+/g, '');
  const map: Record<string, string> = {
    mesha: 'aries',
    aries: 'aries',
    vrishabha: 'taurus',
    taurus: 'taurus',
    mithuna: 'gemini',
    gemini: 'gemini',
    karka: 'cancer',
    cancer: 'cancer',
    simha: 'leo',
    leo: 'leo',
    kanya: 'virgo',
    virgo: 'virgo',
    tula: 'libra',
    libra: 'libra',
    vrischika: 'scorpio',
    scorpio: 'scorpio',
    dhanu: 'sagittarius',
    sagittarius: 'sagittarius',
    makara: 'capricorn',
    capricorn: 'capricorn',
    kumbha: 'aquarius',
    aquarius: 'aquarius',
    meena: 'pisces',
    pisces: 'pisces',
  };
  const slug = map[key];
  return slug ? `/videos/zodiac/${slug}.mp4` : null;
}

const STAR_SLUGS = [
  'ashwini',
  'bharani',
  'krittika',
  'rohini',
  'mrigashira',
  'ardra',
  'punarvasu',
  'pushya',
  'ashlesha',
  'magha',
  'purva-phalguni',
  'uttara-phalguni',
  'hasta',
  'chitra',
  'swati',
  'vishakha',
  'anuradha',
  'jyeshtha',
  'mula',
  'purva-ashadha',
  'uttara-ashadha',
  'shravana',
  'dhanishta',
  'shatabhisha',
  'purva-bhadrapada',
  'uttara-bhadrapada',
  'revati',
];

export function videoForStar(nakshatraName?: string | null): string | null {
  if (!nakshatraName) return null;
  let n = nakshatraName.toLowerCase().trim();
  n = n.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  n = n.replace(/[^a-z\s-]/g, '').replace(/\s+/g, '-');
  n = n.replace(/^(poorva|porva|purv)(?=[a-z])/, 'purva-');
  n = n.replace(/^(utthara|uttara|uttar(?!a-))(?=[a-z])/, 'uttara-');
  const alias: Record<string, string> = {
    ashvini: 'ashwini',
    asvini: 'ashwini',
    aswini: 'ashwini',
    mrigashirsha: 'mrigashira',
    mrigasira: 'mrigashira',
    swathi: 'swati',
    vishaka: 'vishakha',
    jyeshta: 'jyeshtha',
    jyestha: 'jyeshtha',
    shravan: 'shravana',
    sravana: 'shravana',
    'purva-shadha': 'purva-ashadha',
    'purva-shada': 'purva-ashadha',
    'uttara-shadha': 'uttara-ashadha',
    'uttara-shada': 'uttara-ashadha',
    'utthara-phalguni': 'uttara-phalguni',
  };
  if (alias[n]) n = alias[n];
  if (!STAR_SLUGS.includes(n)) return null;
  return `/videos/birthstars/${n}.mp4`;
}

export default function PersonalPanchangPage() {
  const { profile, loading } = useActiveProfile();
  const { sessionRestored } = useAuth();
  const { t } = useTranslation();
  const loadingAuth = !sessionRestored;
  const {
    data: prediction,
    loading: predictionLoading,
    error: predictionError,
  } = useDailyPrediction();

  const panchang = useMemo(() => prediction?.panchang ?? null, [prediction]);
  const janmaRasi = panchang?.janma_rasi;
  const lagna = panchang?.lagna;
  const nakshatraName = panchang?.nakshatra_name;

  useEffect(() => {
    if (janmaRasi !== undefined) console.log('janma_rasi:', janmaRasi);
    if (lagna !== undefined) console.log('lagna:', lagna);
    if (nakshatraName !== undefined)
      console.log('nakshatra_name:', nakshatraName);
  }, [janmaRasi, lagna, nakshatraName]);

  const rashiSrc = videoForZodiac(janmaRasi);
  const lagnaSrc = videoForZodiac(lagna);
  const starSrc = videoForStar(nakshatraName);

  if (loadingAuth || loading || predictionLoading) {
    return <div className="flex justify-center items-center h-screen text-blue-400">{t('common.loading')}</div>;
  }

  if (predictionError) {
    return <div className="flex justify-center items-center h-screen text-red-400">{predictionError}</div>;
  }

  return (
    <div className="space-y-4">
      <PersonalPanchang
        prediction={prediction}
        profile={profile}
        rashiSrc={rashiSrc}
        lagnaSrc={lagnaSrc}
        starSrc={starSrc}
      />
    </div>
  );
}
