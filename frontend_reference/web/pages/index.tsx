import { useState, useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/router';
import { useActiveProfile } from '@/lib/useActiveProfile';
import { useAuth } from '@/lib/useAuth';
import { useTranslation } from 'react-i18next';
import { scrollToAnchor } from '@/utils/scrollToAnchor';

interface FeatureCard {
  title: string;
  description: string;
  icon: ReactNode;
}

const timingFeatures: FeatureCard[] = [
  {
    title: 'Golden Time',
    description:
      'Receive a dependable window of days or weeks for building momentum, complete with local dates, confidence notes, and contingency plans that honour real life.',
    icon: (
      <svg aria-hidden="true" className="h-8 w-8 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <circle cx="12" cy="12" r="8" />
        <path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: 'Super-Golden Time',
    description:
      'Pinpoint the razor-sharp hour or short span optimized for high-impact decisions, supported by logistics reminders, fallback slots, and transparent confidence levels.',
    icon: (
      <svg aria-hidden="true" className="h-8 w-8 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M12 3v18" strokeLinecap="round" />
        <path d="M5 7h14M5 12h14M5 17h14" strokeLinecap="round" />
        <path d="M9 3l-2 4 2 4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: 'Daily & Monthly Panchangam',
    description:
      'Navigate ritual-ready calendars that translate auspicious timing into usable plans for ceremonies, travel, and family events without losing clarity.',
    icon: (
      <svg aria-hidden="true" className="h-8 w-8 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <rect x="4" y="5" width="16" height="15" rx="2" />
        <path d="M8 3v4M16 3v4M4 9h16" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: 'Share-Market Timing Windows',
    description:
      'Act within probability-based windows shaped by planetary rhythms and historical patterns, always paired with explicit risk notes and conservative steps.',
    icon: (
      <svg aria-hidden="true" className="h-8 w-8 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M4 19l4-6 4 3 4-7 4 10" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M3 19h18" strokeLinecap="round" />
      </svg>
    ),
  },
];

const trustFeatures: FeatureCard[] = [
  {
    title: 'No Drama, No Guesswork',
    description:
      'Missing birth details are called out plainly, and speculation is never presented as fact so you always know the boundaries of each insight.',
    icon: (
      <svg aria-hidden="true" className="h-7 w-7 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M12 3l9 7-9 11-9-11 9-7z" />
        <path d="M12 10v4" strokeLinecap="round" />
        <circle cx="12" cy="17" r="0.8" fill="currentColor" />
      </svg>
    ),
  },
  {
    title: 'Every Statement Has a Chart Anchor',
    description:
      'Planets, aspects, and house emphasis sit beside each interpretation so the reasoning stays visible and verifiable.',
    icon: (
      <svg aria-hidden="true" className="h-7 w-7 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <circle cx="12" cy="12" r="8" />
        <path d="M12 4v8l4 4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: 'Confidence Notes & Clear Next Steps',
    description:
      'Every reading shares a confidence note with practical, prioritized actions so you know how to prepare and adapt.',
    icon: (
      <svg aria-hidden="true" className="h-7 w-7 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M5 3h14v18l-7-3-7 3V3z" />
        <path d="M9 8h6M9 12h4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: 'Honest Limits',
    description:
      'Matters touching health, legal, or major finance receive clear disclaimers and encouragement to seek human experts.',
    icon: (
      <svg aria-hidden="true" className="h-7 w-7 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M12 2l8.5 5v10L12 22 3.5 17V7L12 2z" />
        <path d="M12 8v4" strokeLinecap="round" />
        <circle cx="12" cy="15.5" r="0.9" fill="currentColor" />
      </svg>
    ),
  },
];

function SectionDivider() {
  return (
    <div className="mv-section-divider" aria-hidden="true">
      <span className="mv-section-divider__line" />
      <span className="mv-section-divider__icon">
        <svg className="h-8 w-8 text-accent" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.2">
          <circle cx="16" cy="16" r="11" opacity="0.65" />
          <path d="M16 6v20M6 16h20" strokeLinecap="round" />
          <circle cx="16" cy="16" r="3" fill="currentColor" opacity="0.45" />
        </svg>
      </span>
    </div>
  );
}

function FamilyIllustration() {
  const cards = [
    'Parent Transit',
    'Child Golden Time',
    'Sibling Opportunity',
    'Shared Action Plan',
  ];

  return (
    <div className="relative mx-auto flex max-w-md justify-center">
      <div className="grid w-full grid-cols-2 gap-4 sm:gap-6">
        {cards.map((label, index) => (
          <div
            key={label}
            className={`rounded-2xl border border-accent/60 bg-white/5 p-4 text-center text-sm font-medium text-slate-100 shadow-[0_0_25px_rgba(12,22,34,0.45)] backdrop-blur ${
              index % 2 === 0 ? 'translate-y-2' : '-translate-y-2'
            }`}
            data-animate="true"
          >
            <div className="mb-2 flex items-center justify-center">
              <span className="h-2 w-2 rounded-full bg-accent/80" />
            </div>
            <p className="leading-snug">{label}</p>
            <p className="mt-2 text-xs text-teal-200/80">
              Timing resonance · Shared focus
            </p>
          </div>
        ))}
      </div>
      <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs uppercase tracking-[0.3em] text-teal-300/70">
        Family Map
      </span>
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const { profile, loading } = useActiveProfile();
  const { status, initializing, ensureSession } = useAuth();
  const { t } = useTranslation();

  const [heroReady, setHeroReady] = useState(false);

  useEffect(() => {
    if (!initializing && status === 'pending') {
      void ensureSession({ forceRefresh: true });
    }
  }, [ensureSession, initializing, status]);

  useEffect(() => {
    if (initializing) return;
    if (status === 'invalid') {
      router.replace('/auth');
      return;
    }
    if (status === 'no_profile') {
      router.replace('/add_profile?from=session');
    }
  }, [initializing, router, status]);

  useEffect(() => {
    const timeout = window.setTimeout(() => setHeroReady(true), 60);
    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const elements = Array.from(document.querySelectorAll('[data-animate="true"]')) as HTMLElement[];
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('mv-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 },
    );

    elements.forEach((el, index) => {
      el.style.setProperty('--mv-delay', `${index * 80}ms`);
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id: string) => {
    // Use Lenis-aware scrollToAnchor helper with offset for sticky header
    scrollToAnchor(id, 80);
  };

  const fullName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ');
  const loggedInName =
    fullName ||
    (profile && typeof profile === 'object' && 'profile' in profile && profile.profile
      ? (profile.profile as Record<string, string | undefined>).full_name ||
        (profile.profile as Record<string, string | undefined>).first_name
      : undefined) ||
    'Member';

  if (initializing || loading || status !== 'ok' || !profile) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#040a15] text-teal-300">
        {t('common.loading')}
      </div>
    );
  }

  return (
    <div className="index-page flex min-h-screen flex-col bg-[#040a15] text-slate-100">
      <main className="flex-grow">
        <section id="hero" className="relative flex min-h-[100vh] items-center justify-center px-4 py-24 sm:px-6">
          <div className="hero-background" aria-hidden="true">
            <div className={`hero-mandala ${heroReady ? 'mandala-active' : ''}`} />
          </div>
          <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center text-center">
            <p
              className={`mb-6 text-xs font-semibold uppercase tracking-[0.4em] text-teal-200/80 transition-all duration-700 ${
                heroReady ? 'opacity-100' : 'translate-y-6 opacity-0'
              }`}
            >
              Illuminate the timing of every choice
            </p>
            <h1
              className={`font-bold text-4xl leading-tight text-accent drop-shadow md:text-6xl transition-all duration-700 ${
                heroReady ? 'opacity-100' : 'translate-y-6 opacity-0'
              }`}
            >
              Welcome to Mithra Veda
            </h1>
            <p
              className={`mt-6 max-w-3xl text-lg leading-relaxed text-slate-200 transition-all duration-700 md:text-xl ${
                heroReady ? 'opacity-100 delay-100' : 'translate-y-6 opacity-0'
              }`}
            >
              A warm, voice-first life companion that listens, speaks, and guides your timing with calm clarity across eight Indian languages.
            </p>
            <div
              className={`mt-8 flex flex-wrap items-center justify-center gap-3 text-sm text-accent/90 transition-all duration-700 ${
                heroReady ? 'opacity-100 delay-150' : 'translate-y-6 opacity-0'
              }`}
            >
              {['Golden Time windows', 'Super-Golden Time moments', 'Daily & Monthly Panchangam', 'Share-market timing guidance'].map((item) => (
                <span key={item} className="rounded-full border border-accent/50 bg-accent/10 px-4 py-2">
                  {item}
                </span>
              ))}
            </div>
            <div
              className={`mt-10 flex flex-wrap items-center justify-center gap-4 transition-all duration-700 ${
                heroReady ? 'opacity-100 delay-200' : 'translate-y-6 opacity-0'
              }`}
            >
              <button
                type="button"
                onClick={() => router.push('/chat')}
                className="rounded-full bg-accent/80 px-8 py-3 text-sm font-semibold text-[#1a2433] shadow-[0_12px_30px_rgba(25,198,214,0.25)] transition-transform duration-200 hover:scale-[1.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-95"
              >
                Begin Divine Journey
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('timing-section')}
                className="rounded-full border border-accent/80 px-8 py-3 text-sm font-semibold text-accent transition-transform duration-200 hover:scale-[1.03] hover:bg-accent/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-95"
              >
                See How It Works
              </button>
            </div>
            <div
              className={`mt-16 flex flex-col items-center text-xs uppercase tracking-[0.5em] text-accent/70 transition-all duration-700 ${
                heroReady ? 'opacity-100 delay-300' : 'translate-y-6 opacity-0'
              }`}
            >
              <span>Scroll to explore</span>
              <span className="mt-3 text-lg">▼</span>
            </div>
          </div>
        </section>

        <SectionDivider />

        <section id="timing-section" className="px-4 py-24 sm:px-6">
          <div className="mx-auto max-w-5xl text-center">
            <h2 className="text-3xl font-semibold text-accent md:text-4xl">Act When Time Is On Your Side</h2>
            <p className="mx-auto mt-6 max-w-3xl text-base leading-relaxed text-slate-200/90">
              Golden Time, Super-Golden Time, Panchangam insights, and market guidance weave together so you can notice, prepare, and act with confidence.
            </p>
          </div>
          <div className="mx-auto mt-16 grid max-w-6xl gap-8 md:grid-cols-2">
            {timingFeatures.map((feature) => (
              <div
                key={feature.title}
                className="mv-card"
                data-animate="true"
              >
                <div className="mb-4 flex items-center justify-center">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-accent">{feature.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-200/80">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        <SectionDivider />

        <section id="family" className="px-4 py-24 sm:px-6">
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-16 lg:flex-row lg:items-start">
            <div className="w-full lg:w-1/2" data-animate="true">
              <h2 className="text-3xl font-semibold text-accent md:text-4xl">
                One Family, Many Charts, Shared Timing
              </h2>
              <ul className="mt-8 space-y-5 text-base leading-relaxed text-slate-200/90">
                <li className="flex items-start gap-3">
                  <span className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-accent/80" aria-hidden="true" />
                  Add parents, children, and siblings to one shared chart to build a living family map.
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-accent/80" aria-hidden="true" />
                  Spot how supportive transits amplify each person’s Golden Time so collaboration feels natural.
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-accent/80" aria-hidden="true" />
                  Coordinate weddings, moves, launches, and investments with precision grounded in shared timing.
                </li>
              </ul>
            </div>
            <div className="w-full lg:w-1/2" data-animate="true">
              <FamilyIllustration />
            </div>
          </div>
        </section>

        <SectionDivider />

        <section id="voice" className="relative overflow-hidden px-4 py-24 sm:px-6">
          <div className="absolute inset-0 bg-gradient-radial from-[#0b1d29] via-[#050d1c] to-transparent opacity-80" aria-hidden="true" />
          <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-16 rounded-[2.5rem] border border-teal-500/40 bg-[#051124]/80 px-6 py-16 backdrop-blur-lg lg:flex-row lg:items-center lg:px-12">
            <div className="w-full lg:w-3/5" data-animate="true">
              <h2 className="text-3xl font-semibold text-accent md:text-4xl">
                Guidance That Sounds Like a Trusted Elder
              </h2>
              <p className="mt-6 text-base leading-relaxed text-slate-200/90">
                Low-latency audio, natural prosody, and regional idiom make every reading sound intimate. Switch languages mid-session without losing context, and revisit guidance through saved audio with searchable transcripts.
              </p>
              <div className="mt-6 flex flex-wrap gap-3" data-animate="true">
                {['EN', 'HI', 'TA', 'TE', 'KN', 'ML', 'BN', 'MR'].map((code) => (
                  <span
                    key={code}
                    className="rounded-full border border-accent/70 bg-accent/10 px-4 py-1 text-sm font-medium text-accent shadow-[0_0_25px_rgba(7,25,41,0.35)]"
                    aria-label={`Language ${code}`}
                  >
                    {code}
                  </span>
                ))}
              </div>
            </div>
            <div className="w-full lg:w-2/5" data-animate="true">
              <button
                type="button"
                className="group relative mx-auto flex h-48 w-48 items-center justify-center rounded-full border border-accent/70 bg-accent/10 shadow-[0_30px_60px_rgba(7,25,41,0.45)] transition-transform duration-200 hover:scale-[1.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                aria-label="Play a 10-second sample"
              >
                <span className="flex h-20 w-20 items-center justify-center rounded-full bg-accent/80 text-[#1a2433] shadow-[0_10px_30px_rgba(25,198,214,0.35)] transition-transform duration-200 group-hover:scale-105">
                  <svg className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M8 5v14l11-7-11-7z" />
                  </svg>
                </span>
                <span className="absolute -bottom-10 text-sm font-semibold uppercase tracking-[0.3em] text-accent/80">
                  Play a 10-second sample
                </span>
              </button>
            </div>
          </div>
        </section>

        <SectionDivider />

        <section id="trust" className="bg-[#050e1c] px-4 py-24 sm:px-6">
          <div className="mx-auto max-w-5xl text-center">
            <h2 className="text-3xl font-semibold text-accent md:text-4xl">
              Astrology That Respects Truth and Boundaries
            </h2>
            <p className="mx-auto mt-6 max-w-3xl text-base leading-relaxed text-slate-200/90">
              Every interpretation points back to verifiable chart anchors, acknowledges uncertainty, and encourages wise next steps.
            </p>
          </div>
          <div className="mx-auto mt-16 grid max-w-6xl gap-10 md:grid-cols-2">
            {trustFeatures.map((feature) => (
              <div key={feature.title} className="flex items-start gap-4 rounded-3xl border border-teal-500/40 bg-[#040a15]/80 p-8 shadow-[0_25px_60px_rgba(5,15,28,0.45)]" data-animate="true">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-accent/60 bg-accent/10">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-accent">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-200/80">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <SectionDivider />

        <section id="designed" className="px-4 py-24 sm:px-6">
          <div className="mx-auto max-w-5xl text-center" data-animate="true">
            <h2 className="text-3xl font-semibold text-accent md:text-4xl">Built for Your Everyday Rhythm</h2>
            <p className="mx-auto mt-6 max-w-3xl text-base leading-relaxed text-slate-200/90">
              The experience is compassionate, practical, and ready to teach as it guides—so every family member can engage comfortably.
            </p>
          </div>
          <div className="mx-auto mt-16 grid max-w-5xl gap-12 md:grid-cols-2">
            <div className="space-y-5" data-animate="true">
              <h3 className="text-lg font-semibold uppercase tracking-[0.2em] text-accent">Interface & Learning</h3>
              <ul className="space-y-4 text-base leading-relaxed text-slate-200/90">
                <li className="flex items-start gap-3">
                  <span className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-accent/80" aria-hidden="true" />
                  Brief explanations sit beside user-friendly takeaways for clarity without overwhelm.
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-accent/80" aria-hidden="true" />
                  Remedial practices from tradition are offered honestly with realistic expectations.
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-accent/80" aria-hidden="true" />
                  Readable transcripts and adjustable speech speed ensure guidance remains accessible.
                </li>
              </ul>
            </div>
            <div className="space-y-5" data-animate="true">
              <h3 className="text-lg font-semibold uppercase tracking-[0.2em] text-accent">Personalization & Memory</h3>
              <ul className="space-y-4 text-base leading-relaxed text-slate-200/90">
                <li className="flex items-start gap-3">
                  <span className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-accent/80" aria-hidden="true" />
                  Learns your preferred voice, depth, and timing style while keeping settings visible and adjustable.
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-accent/80" aria-hidden="true" />
                  Saved readings, bookmarked Golden Times, and replayable audio shape a living diary for future choices.
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-accent/80" aria-hidden="true" />
                  Family correlation tools make cooperative planning intuitive and precise.
                </li>
              </ul>
            </div>
          </div>
        </section>

        <SectionDivider />

        <section id="final-cta" className="relative overflow-hidden px-4 py-24 sm:px-6">
          <div className="absolute inset-0 bg-gradient-to-r from-[#0d1e2c] via-[#122d3d] to-[#0d1e2c] opacity-80" aria-hidden="true" />
          <div className="relative mx-auto max-w-4xl rounded-[2.5rem] border border-accent/60 bg-[#0a1624]/80 px-8 py-20 text-center shadow-[0_35px_80px_rgba(10,22,40,0.6)] backdrop-blur">
            <div className="absolute inset-0 -z-10 bg-[url('/om_watermark.svg')] bg-contain bg-center bg-no-repeat opacity-[0.08]" aria-hidden="true" />
            <p className="text-xs font-semibold uppercase tracking-[0.5em] text-teal-200/80">Invite Mithra Veda Into Your Life</p>
            <h3 className="mt-6 text-3xl font-semibold text-accent md:text-4xl">
              Align your plans with the moments that matter.
            </h3>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-200/90">
              Notice, prepare, and act with greater clarity and ease—one Golden Time at a time.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => router.push('/chat')}
                className="rounded-full bg-accent/80 px-8 py-3 text-sm font-semibold text-[#1a2433] shadow-[0_12px_30px_rgba(25,198,214,0.25)] transition-transform duration-200 hover:scale-[1.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-95"
              >
                Begin Divine Journey
              </button>
              <button
                type="button"
                onClick={() => router.push('/settings')}
                className="rounded-full border border-accent/80 px-8 py-3 text-sm font-semibold text-accent transition-transform duration-200 hover:scale-[1.03] hover:bg-accent/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-95"
              >
                View Plans & Pricing
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-teal-500/40 bg-[#040a15]/90 py-8 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} Mithra Veda. Crafted with respect for your charts, your privacy, and your timing.
      </footer>

      <style jsx global>{`
        html {
          scroll-behavior: smooth;
        }
        .hero-background {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at top, rgba(7, 39, 60, 0.6), transparent 55%),
            radial-gradient(circle at bottom, rgba(7, 25, 41, 0.6), transparent 60%),
            linear-gradient(180deg, rgba(5, 14, 28, 0.95) 0%, rgba(2, 6, 14, 0.95) 50%, rgba(7, 20, 34, 0.95) 100%);
        }
        .hero-mandala {
          position: absolute;
          inset: 10% 15%;
          border-radius: 9999px;
          background: url('/om_watermark.svg') center/contain no-repeat;
          opacity: 0.05;
          transform: rotate(-8deg) scale(1.1);
          transition: transform 18s linear;
        }
        .mandala-active {
          animation: mv-mandala-spin 80s linear infinite;
        }
        @keyframes mv-mandala-spin {
          from {
            transform: rotate(0deg) scale(1.05);
          }
          to {
            transform: rotate(360deg) scale(1.05);
          }
        }
        .mv-card {
          border-radius: 24px;
          border: 1px solid rgba(25, 198, 214, 0.55);
          background: linear-gradient(180deg, rgba(15, 32, 45, 0.85) 0%, rgba(7, 18, 32, 0.95) 100%);
          padding: 2.5rem 2rem;
          box-shadow: 0 30px 60px rgba(5, 15, 28, 0.45);
        }
        .mv-card[data-animate='true'] {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.6s ease var(--mv-delay, 0ms), transform 0.6s ease var(--mv-delay, 0ms);
        }
        .mv-visible {
          opacity: 1 !important;
          transform: translateY(0) !important;
        }
        .mv-section-divider {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 5rem 0 4rem;
        }
        .mv-section-divider__line {
          display: block;
          height: 1px;
          width: min(100%, 960px);
          background: linear-gradient(90deg, rgba(0, 0, 0, 0), rgba(45, 201, 205, 0.65), rgba(0, 0, 0, 0));
        }
        .mv-section-divider__icon {
          position: absolute;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0.75rem;
          border-radius: 9999px;
          background: rgba(4, 10, 21, 0.95);
          border: 1px solid rgba(25, 198, 214, 0.5);
        }
      `}</style>
    </div>
  );
}
