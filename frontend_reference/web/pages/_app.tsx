import type { AppProps } from 'next/app';
import '../styles/globals.css';
import '../styles/_sidebar.css';
import '../styles/_layout.css';
import Layout from '../components/Layout';
import ErrorBoundary from '../components/ErrorBoundary';
import { GlobalSessionProvider } from '../shared/context/AuthContext';
import { UIStoreProvider, useUIStore } from '@/state/uiStore';
import { ProfileStoreProvider } from '@/state/profileStore';
import { DailyPredictionProvider } from '@/state/dailyPredictionStore';
import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { useRouter } from 'next/router';
import { getApiUrl } from '@/lib/api';
import { ChatProvider } from '@/components/chat/ChatContext';
import ChatGuard, { CHAT_GUARD_HIDDEN_ROUTES } from '@/components/chat/ChatGuard';
import { initLenis, destroyLenis, prefersReducedMotion, getLenis } from '@/lib/lenisClient';
import { scrollToAnchor, scrollToTop } from '@/utils/scrollToAnchor';
// Initialize i18n before rendering
import '@/lib/i18n';
import { useTranslation } from 'react-i18next';

function BodyWithConditionalPad({ children }: { children: ReactNode }) {
  // ChatDock removed - no padding needed
  return <div>{children}</div>;
}

export default function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const { i18n } = useTranslation();
  const hideChat =
    router.pathname.startsWith('/profile') || // hide on profile & subroutes
    router.pathname === '/add_profile';

  // Update HTML lang attribute when language changes
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = i18n.language || 'en';
    }
  }, [i18n.language]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const today = new Date().toISOString().slice(0, 10);
    const lastRun = window.localStorage.getItem('daily_alert_last_run');
    if (lastRun === today) {
      return;
    }

    // Pass locale parameter for translated alerts
    const locale = i18n.language || 'en';
    fetch(getApiUrl(`/api/daily_alert?locale=${locale}`), { credentials: 'include' })
      .then(() => {
        window.localStorage.setItem('daily_alert_last_run', today);
      })
      .catch((error) => {
        // Silent fail - this is a background task
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.error('Failed to trigger daily alert fetch', error);
        }
      });
  }, [i18n.language]);

  // Initialize Lenis smooth scrolling
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    // Respect prefers-reduced-motion accessibility preference
    if (prefersReducedMotion()) {
      return;
    }

    // Set manual scroll restoration to avoid conflicts with Lenis
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }

    // Initialize Lenis with default options
    initLenis();

    // Handle route changes - scroll to hash element or top
    const handleRouteChange = (url: string) => {
      const lenis = getLenis();
      if (!lenis) return;

      // Check if URL contains a hash
      const hashIndex = url.indexOf('#');
      if (hashIndex !== -1) {
        const hash = url.substring(hashIndex + 1);
        if (hash) {
          // Use scrollToAnchor for hash navigation
          scrollToAnchor(hash);
        }
      } else {
        // Scroll to top on route change without hash
        scrollToTop();
      }
    };

    // Attach router event handlers
    router.events.on('routeChangeComplete', handleRouteChange);
    router.events.on('hashChangeComplete', handleRouteChange);

    // Cleanup on unmount
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
      router.events.off('hashChangeComplete', handleRouteChange);
      destroyLenis();

      // Restore default scroll restoration
      if ('scrollRestoration' in history) {
        history.scrollRestoration = 'auto';
      }
    };
  }, [router.events]);

  return (
    <ErrorBoundary>
      <GlobalSessionProvider>
        <AppProviders hideChat={hideChat}>
          <Component {...pageProps} />
        </AppProviders>
      </GlobalSessionProvider>
    </ErrorBoundary>
  );
}

function SidebarAwareChatGuard({ hideChat }: { hideChat: boolean }) {
  const { isSidebarOpen } = useUIStore();
  if (hideChat) return null;

  return <ChatGuard isSidebarOpen={isSidebarOpen} />;
}

function AppProviders({
  children,
  hideChat,
}: {
  children: ReactNode;
  hideChat: boolean;
}) {
  return (
    <BodyWithConditionalPad>
      <ProfileStoreProvider>
        <DailyPredictionProvider>
          <UIStoreProvider>
            <ChatProvider>
              <Layout>{children}</Layout>
              <SidebarAwareChatGuard hideChat={hideChat} />
            </ChatProvider>
          </UIStoreProvider>
        </DailyPredictionProvider>
      </ProfileStoreProvider>
    </BodyWithConditionalPad>
  );
}
