import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';

const VerifyOTPPage = () => {
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    if (!router.isReady) return;
    router.replace('/auth');
  }, [router]);

  return (
    <div className="flex flex-col min-h-screen bg-neo-dark dark:bg-neo-dark">
      <main className="flex items-center justify-center p-4 flex-grow">
        <div className="form-box text-center text-neon-cyan">
          {t('auth.otpRedirect')}
        </div>
      </main>
    </div>
  );
};

export default VerifyOTPPage;
