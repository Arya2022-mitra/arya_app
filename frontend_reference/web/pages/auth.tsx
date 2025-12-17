import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/router';
import {
  emailSignIn,
  emailSignUp,
  googleSignInWithPopup,
} from '@/utils/firebaseClient';
import { useAuth } from '@/lib/useAuth';
import { useActiveProfile } from '@/lib/useActiveProfile';
import { API_BASE } from '@/lib/api';
import { LANGUAGES } from '@/lib/languages';
import { useTranslation } from 'react-i18next';

export default function Auth() {
  const router = useRouter();
  const { restoreSession, login, sessionRestored } = useAuth();
  const { loading: profileLoading } = useActiveProfile();
  const { t } = useTranslation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [language, setLanguage] = useState('en');
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Restore cached language preference
    try {
      const cachedLang = localStorage.getItem('user_language');
      if (cachedLang) {
        setLanguage(cachedLang);
      }
    } catch {}

    const restore = async () => {
      const restored = await restoreSession();
      if (restored) {
        router.push('/');
        return;
      }
      setCheckingSession(false);
    };
    restore();
  }, [restoreSession, router]);

  const persistToken = async (token: string, userEmail: string | null) => {
    login(token, undefined, undefined, userEmail, language);
    await restoreSession(token);
    
    // Update language preference on backend after login
    try {
      await fetch(`${API_BASE}/api/v1/settings/language`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          locale: language,
        }),
      });
    } catch (err) {
      console.error('Failed to update language preference', err);
    }
  };

  const handleEmailSubmit = async () => {
    setError(null);
    if (!email || !password) {
      setError(t('auth.enterEmailPassword'));
      return;
    }
    setLoading(true);
    try {
      const userCred = isLoginMode
        ? await emailSignIn(email, password)
        : await emailSignUp(email, password);
      const token = await userCred.user.getIdToken();
      await persistToken(token, userCred.user.email ?? email);
      router.replace('/');
    } catch (err: any) {
      console.error(t('auth.emailAuthFailed'), err);
      setError(err?.message || t('auth.authenticationFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await googleSignInWithPopup();
      const token = await result.user.getIdToken();
      await persistToken(token, result.user.email ?? null);
      router.replace('/');
    } catch (err: any) {
      console.error('Google auth failed', err);
      setError(err?.message || t('auth.googleSignInFailed'));
    } finally {
      setLoading(false);
    }
  };

  if (!sessionRestored || profileLoading || checkingSession) {
    return (
      <div className="flex justify-center items-center h-screen text-blue-400">
        {t('common.loading')}
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-neo-dark dark:bg-neo-dark">
      <main className="flex items-center justify-center p-4 flex-grow">
        <div className="form-box">
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px',
            }}
          >
            <Image
              src="/logo/logo.png"
              alt="MitraVeda Logo"
              width={120}
              height={120}
              priority
              style={{
                width: '120px',
                height: '120px',
                objectFit: 'contain',
                marginBottom: '10px',
              }}
            />
            <h1
              style={{
                color: '#00ffff',
                fontSize: '1.8rem',
                fontWeight: '600',
                letterSpacing: '2px',
                textAlign: 'center',
                margin: '0',
              }}
            >
              MitraVeda
            </h1>
          </div>
          <h1 className="text-center text-2xl font-orbitron text-neon-cyan">
            Begin Your Divine Journey
          </h1>
          <div className="flex justify-center space-x-4 text-sm text-neon-cyan">
            <button
              className={`px-3 py-1 border ${
                isLoginMode
                  ? 'border-neon-cyan text-neon-cyan animate-neon-breathe'
                  : 'border-neon-cyan text-neon-cyan'
              }`}
              onClick={() => setIsLoginMode(true)}
            >
              {t('auth.signInMode')}
            </button>
            <button
              className={`px-3 py-1 border ${
                !isLoginMode
                  ? 'border-neon-cyan text-neon-cyan animate-neon-breathe'
                  : 'border-neon-cyan text-neon-cyan'
              }`}
              onClick={() => setIsLoginMode(false)}
            >
              {t('auth.signUpMode')}
            </button>
          </div>

          <input
            className="input-style"
            type="email"
            placeholder={t('auth.email')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="input-style"
            type="password"
            placeholder={t('auth.password')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <div className="mb-3">
            <label className="block text-sm text-neon-cyan mb-2">
              Preferred Language
            </label>
            <select
              className="input-style w-full"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>

          {error && <div className="text-red-400 text-sm text-center">{error}</div>}

          <button className="button-style" onClick={handleEmailSubmit} disabled={loading}>
            {loading ? t('common.loading') : isLoginMode ? t('auth.signInMode') : t('auth.signUpMode')}
          </button>

          <div className="mt-4 text-center text-neon-cyan">OR</div>

          <button className="button-style" onClick={handleGoogleLogin} disabled={loading}>
            {loading ? t('common.loading') : t('auth.continueWithGoogle')}
          </button>
        </div>
      </main>
    </div>
  );
}
