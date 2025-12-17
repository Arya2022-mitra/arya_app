import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { useAuth } from '@/lib/useAuth';
import HamburgerButton from '@/components/nav/HamburgerButton';
import { useTranslation } from 'react-i18next';

export default function Header() {
  const router = useRouter();
  const { token, logout: authLogout, userEmail, profile } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const logout = async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('active_profile');
      localStorage.removeItem('active_profile_id');
    }
    setMenuOpen(false);
    await authLogout();
    router.push('/auth');
  };

  const profileName = [profile?.first_name, profile?.last_name]
    .filter((part) => typeof part === 'string' && part.trim().length > 0)
    .join(' ')
    .trim();
  const sessionLabel = profileName || userEmail || 'User';

  return (
    <header className="sticky top-0 z-50 flex justify-between items-center p-4 border-b border-neon-cyan bg-neo-dark/90 backdrop-blur text-neon-cyan relative">
      <HamburgerButton />
      <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-2">
        <Image
          src="/logo/logo.png"
          alt="MitraVeda Logo"
          width={45}
          height={45}
          className="rounded-full"
        />
        <span className="text-accent text-lg font-sanskrit tracking-wide">MitraVeda</span>
      </div>
      <div className="relative text-sm font-sanskrit">
        {!token ? (
          <button
            onClick={() => router.push('/auth')}
            className="px-3 py-1 rounded border border-neon-cyan"
          >
            {t('header.signIn')}
          </button>
        ) : (
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center px-2"
            >
              {t('header.loggedInAs')} {sessionLabel}
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 bg-neo-dark border border-neon-cyan rounded shadow">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    router.push('/settings');
                  }}
                  className="block px-4 py-2 hover:bg-neon-cyan hover:text-neo-dark w-full text-left"
                >
                  {t('header.settings')}
                </button>
                <button
                  onClick={() => {
                    void logout();
                  }}
                  className="block px-4 py-2 hover:bg-neon-cyan hover:text-neo-dark w-full text-left"
                >
                  {t('header.signOut')}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
