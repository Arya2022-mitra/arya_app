import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useUIStore } from '@/state/uiStore';
import {
  SHARE_MARKET_ASTRO_ROUTE,
  DAILY_PREDICTION_ROUTE,
} from '@/routes/appRoutes';
import { useTranslation } from 'react-i18next';

export default function SegmentList() {
  const router = useRouter();
  const { closeSidebar } = useUIStore();
  const { t } = useTranslation();
  const linkClasses = (href: string) => {
    const isActive = router.pathname === href;
    return `block py-2 px-4 rounded-full transition-all ${
      isActive
        ? 'bg-gradient-to-r from-accent/20 to-accent-2/20 text-accent border border-accent/30 shadow-[0_0_12px_rgba(25,198,214,0.3)]'
        : 'text-slate-300 hover:text-cyan-400 hover:bg-cyan-500/10'
    }`;
  };

  return (
    <div className="p-4">
      <h2 className="text-sm uppercase mb-2">{t('nav.segments')}</h2>
      <ul className="mt-2 space-y-1">
        {/* Chat */}
        <li>
          <Link
            href="/chat"
            onClick={closeSidebar}
            className={linkClasses('/chat')}
          >
            {t('nav.chat')}
          </Link>
        </li>

        {/* Daily Panchang */}
        <li>
          <Link
            href="/daily-panchang"
            onClick={closeSidebar}
            className={linkClasses('/daily-panchang')}
          >
            {t('nav.dailyPanchang')}
          </Link>
        </li>

        {/* Personal Panchang (NEW, placed directly under Daily Panchang) */}
        <li>
          <Link
            href="/personal-panchang"
            onClick={closeSidebar}
            className={linkClasses('/personal-panchang')}
          >
            {t('nav.personalPanchang')}
          </Link>
        </li>

        {/* Guardian */}
        <li>
          <Link
            href="/guardian"
            onClick={closeSidebar}
            className={linkClasses('/guardian')}
          >
            {t('nav.guardian')}
          </Link>
        </li>

        {/* Daily Prediction */}
        <li>
          <Link
            href={DAILY_PREDICTION_ROUTE}
            onClick={closeSidebar}
            className={linkClasses(DAILY_PREDICTION_ROUTE)}
          >
            {t('nav.dailyPrediction')}
          </Link>
        </li>

        {/* Monthly Prediction */}
        <li>
          <Link
            href="/monthly-prediction"
            onClick={closeSidebar}
            className={linkClasses('/monthly-prediction')}
          >
            {t('nav.monthlyPrediction')}
          </Link>
        </li>

        {/* Tithis (Monthly) */}
        <li>
          <Link
            href="/tithis"
            onClick={closeSidebar}
            className={linkClasses('/tithis')}
          >
            {t('nav.tithis')}
          </Link>
        </li>

        {/* Numerology */}
        <li>
          <Link
            href="/numerology"
            onClick={closeSidebar}
            className={linkClasses('/numerology')}
          >
            {t('nav.numerology')}
          </Link>
        </li>

        {/* Share Market */}
        <li>
          <Link
            href={SHARE_MARKET_ASTRO_ROUTE}
            onClick={closeSidebar}
            className={linkClasses(SHARE_MARKET_ASTRO_ROUTE)}
          >
            {t('nav.shareMarket')}
          </Link>
        </li>

        {/* Keep existing remaining items below — ensure SAME classes for alignment */}
        <li>
          <Link
            href="/pakshi"
            onClick={closeSidebar}
            className={linkClasses('/pakshi')}
          >
            {t('nav.pakshi')}
          </Link>
        </li>
        <li>
          <Link
            href="/dasha"
            onClick={closeSidebar}
            className={linkClasses('/dasha')}
          >
            {t('nav.dasha')}
          </Link>
        </li>
        <li>
          <div className="px-3 pt-3 text-xs font-semibold uppercase tracking-[0.35em] text-accent">
            {t('nav.businessJob')}
          </div>
          <ul className="mt-1 space-y-1 border-l border-gray-700/70 pl-3">
            <li>
              <Link
                href="/business"
                onClick={closeSidebar}
                className={linkClasses('/business')}
              >
                {t('nav.business')}
              </Link>
            </li>
            <li>
              <Link
                href="/career"
                onClick={closeSidebar}
                className={linkClasses('/career')}
              >
                {t('nav.career')}
              </Link>
            </li>
          </ul>
        </li>
        <li>
          <div className="px-3 pt-3 text-xs font-semibold uppercase tracking-[0.35em] text-accent">
            {t('nav.wealthHealth')}
          </div>
          <ul className="mt-1 space-y-1 border-l border-gray-700/70 pl-3">
            <li>
              <Link
                href="/wealth"
                onClick={closeSidebar}
                className={linkClasses('/wealth')}
              >
                {t('nav.wealth')}
              </Link>
            </li>
            <li>
              <Link
                href="/health"
                onClick={closeSidebar}
                className={linkClasses('/health')}
              >
                {t('nav.health')}
              </Link>
            </li>
          </ul>
        </li>
        <li>
          <Link
            href="/education"
            onClick={closeSidebar}
            className={linkClasses('/education')}
          >
            {t('nav.education')}
          </Link>
        </li>
        <li>
          <Link
            href="/marriage-love"
            onClick={closeSidebar}
            className={linkClasses('/marriage-love')}
          >
            {t('nav.marriageLove')}
          </Link>
        </li>
      </ul>
    </div>
  );
}
