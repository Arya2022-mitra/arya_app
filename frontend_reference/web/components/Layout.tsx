import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/router';
import Header from '@/components/Header';
import DrawerSidebar from '@/components/nav/DrawerSidebar';
import { useUIStore } from '@/state/uiStore';
import { useActiveProfile } from '@/lib/useActiveProfile';
import { useAuth } from '@/lib/useAuth';

const PUBLIC_ROUTES = ['/auth', '/', '/add_profile', '/process_profile'];

export default function Layout({ children }: { children: ReactNode }) {
  const router = useRouter();

  const { profile, loading } = useActiveProfile();
  const { status, initializing } = useAuth();
  const { isSidebarOpen } = useUIStore();

  const isChatPage = router.pathname.startsWith('/chat');
  const shouldShift = !isChatPage && isSidebarOpen;

  useEffect(() => {
    if (initializing) return;
    if (PUBLIC_ROUTES.includes(router.pathname)) return;
    if (status === 'invalid' && router.pathname !== '/auth') {
      router.replace('/auth');
    }
  }, [initializing, router, status]);

  useEffect(() => {
    if (initializing) return;
    if (PUBLIC_ROUTES.includes(router.pathname)) return;
    if (status === 'no_profile') {
      if (router.pathname !== '/add_profile') {
        router.replace('/add_profile?from=session');
      }
      return;
    }
    if (router.pathname === '/profile') return;
    if (!loading && !profile && status === 'ok') {
      router.push('/profile');
    }
  }, [initializing, loading, profile, router, status]);

  return (
    <>
      <DrawerSidebar />
      <div
        className={`shift-wrapper min-h-screen bg-neo-dark text-neon-cyan font-rajdhani flex flex-col${shouldShift ? ' drawer-open' : ''}`}
      >
        <Header />
        <main
          className={`flex-grow${isChatPage ? ' flex flex-col' : ' px-4'}`}
          style={isChatPage ? { padding: 0, minHeight: 0 } : undefined}
        >
          {children}
        </main>
      </div>
    </>
  );
}
