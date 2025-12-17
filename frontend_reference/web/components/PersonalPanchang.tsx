import { Fragment, useState } from 'react';
import Card from '@/components/Card';
import { useTranslation } from 'react-i18next';
import { useAstroTranslation } from '@/lib/useAstroTranslation';
import SecureAutoPlayVideo from '@/components/SecureAutoPlayVideo';

interface Props {
  prediction: any | null;
  profile: any | null;
  rashiSrc: string | null;
  lagnaSrc: string | null;
  starSrc: string | null;
}

function VideoPlayer({ src }: { src: string | null }) {
  const [error, setError] = useState(false);
  const { t } = useTranslation();
  if (!src || error) {
    return (
      <div className="w-40 h-40 flex items-center justify-center bg-black/20 text-sm">
        {t('personalPanchang.noVideo')}
      </div>
    );
  }
  return (
    <SecureAutoPlayVideo
      sources={[
        {
          src,
          type: src.toLowerCase().endsWith('.webm') ? 'video/webm' : 'video/mp4',
        },
      ]}
      className="w-40 h-40 rounded object-cover"
      onError={() => setError(true)}
      description={t('personalPanchang.videoAlt', { defaultValue: 'Zodiac video loop' })}
    />
  );
}

const display = (v: any) =>
  v !== undefined && v !== null && v !== '' ? v : '—';

function VideoTile({
  heading,
  src,
  caption,
}: {
  heading: string;
  src: string | null;
  caption: any;
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="mb-1 font-semibold">{heading}</div>
      <VideoPlayer src={src} />
      <div className="mt-1 text-sm">{display(caption)}</div>
    </div>
  );
}

export default function PersonalPanchang({
  prediction,
  profile,
  rashiSrc,
  lagnaSrc,
  starSrc,
}: Props) {
  const { t } = useTranslation();
  const { translateZodiac, translateNakshatra, translateDeity, translatePlanet } = useAstroTranslation();
  const panchang = prediction?.panchang ?? {};
  const fullName =
    [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || '—';
  const infoRows = [
    { label: t('personalPanchang.weekday'), value: panchang.weekday },
    {
      label: t('personalPanchang.rashiLord', { defaultValue: 'Rāśi Lord' }),
      value: panchang.janma_rasi_lord ? translatePlanet(panchang.janma_rasi_lord) : panchang.janma_rasi_lord,
    },
    { label: t('personalPanchang.ascendantLord'), value: panchang.ascendant_lord ? translatePlanet(panchang.ascendant_lord) : panchang.ascendant_lord },
    { label: t('personalPanchang.sunSign'), value: panchang.sun_sign ? translateZodiac(panchang.sun_sign) : panchang.sun_sign },
  ];

  const attributeRows = [
    { label: t('personalPanchang.deity'), value: panchang.nakshatra_deity ? translateDeity(panchang.nakshatra_deity) : panchang.nakshatra_deity },
    { label: t('personalPanchang.animal'), value: panchang.animal_sign },
    { label: t('personalPanchang.gana'), value: panchang.gana },
    { label: t('personalPanchang.yoni'), value: panchang.yoni },
    { label: t('personalPanchang.bhutam'), value: panchang.bhutam },
    { label: t('personalPanchang.gotram'), value: panchang.gothram },
  ].filter((r) => r.value);

  const calendarRows = [
    {
      label: t('personalPanchang.vikramSamvat'),
      value: panchang.vikram_samvat
        ? panchang.vikram_samvat +
          (panchang.vikram_samvat_year
            ? ` ${panchang.vikram_samvat_year}`
            : '')
        : panchang.vikram_samvat_year,
    },
    {
      label: t('personalPanchang.shakaSamvat'),
      value: panchang.shaka_samvat
        ? panchang.shaka_samvat +
          (panchang.shaka_samvat_year
            ? ` ${panchang.shaka_samvat_year}`
            : '')
        : panchang.shaka_samvat_year,
    },
    { label: t('personalPanchang.samvatsara'), value: panchang.samvatsara },
    { label: t('personalPanchang.lunarMonth'), value: panchang.lunar_month },
    { label: t('personalPanchang.sunrise'), value: panchang.sunrise },
    { label: t('personalPanchang.sunset'), value: panchang.sunset },
  ];

  const allRows = [...infoRows, ...attributeRows, ...calendarRows];

  const rashiCaption = panchang.janma_rasi ? translateZodiac(panchang.janma_rasi) : panchang.janma_rasi;
  const lagnaCaption = panchang.lagna ? translateZodiac(panchang.lagna) : panchang.lagna;
  const pada = panchang.nakshatra_pada ?? panchang.nakshatra_pada_number;
  const nakshatraCaption = panchang.nakshatra_name
    ? `${translateNakshatra(panchang.nakshatra_name)}${pada ? ` (${t('personalPanchang.pada')} ${pada})` : ''}`
    : null;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-center">{t('personalPanchang.title')}</h1>
      <div className="text-center text-lg">{fullName}</div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <VideoTile heading={t('personalPanchang.rashi')} src={rashiSrc} caption={rashiCaption} />
        <VideoTile heading={t('personalPanchang.lagna')} src={lagnaSrc} caption={lagnaCaption} />
        <VideoTile heading={t('personalPanchang.nakshatra')} src={starSrc} caption={nakshatraCaption} />
      </div>

      <Card>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          {allRows.map(({ label, value }) => (
            <Fragment key={label}>
              <div className="font-semibold">{label}</div>
              <div>{display(value)}</div>
            </Fragment>
          ))}
        </div>
      </Card>
    </div>
  );
}

