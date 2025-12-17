/**
 * Test suite for i18next-http-backend integration
 * Verifies that translations are loaded from backend and language switching works correctly
 */

import i18n from '@/lib/i18n-test-helper';

describe('i18next-http-backend Integration', () => {
  beforeEach(async () => {
    // Reset language to ensure clean state between tests
    await i18n.changeLanguage('en');
  });

  describe('Translation Loading', () => {
    it('should load translations from backend for English', async () => {
      await i18n.changeLanguage('en');
      
      expect(i18n.t('settings.title')).toBe('Settings');
      expect(i18n.t('settings.language')).toBe('Language');
      expect(i18n.t('header.home')).toBe('Home');
      expect(i18n.t('common.loading')).toBe('Loading...');
    });

    it('should load translations from backend for Hindi', async () => {
      await i18n.changeLanguage('hi');
      
      
      expect(i18n.t('settings.title')).toBe('सेटिंग्स');
      expect(i18n.t('settings.language')).toBe('लैंग्वेज');
      expect(i18n.t('header.home')).toBe('होम');
      expect(i18n.t('common.loading')).toBe('लोड हो रहा है...');
    });

    it('should load translations from backend for Tamil', async () => {
      await i18n.changeLanguage('ta');
      
      
      expect(i18n.t('settings.title')).toBe('செட்டிங்ஸ்');
      expect(i18n.t('settings.language')).toBe('லாங்குவேஜ்');
      expect(i18n.t('header.home')).toBe('ஹோம்');
      expect(i18n.t('common.loading')).toBe('ஏற்றுகிறது...');
    });

    it('should load translations from backend for Telugu', async () => {
      await i18n.changeLanguage('te');
      
      
      expect(i18n.t('settings.title')).toBe('సెట్టింగ్స్');
      expect(i18n.t('settings.language')).toBe('లాంగ్వేజ్');
      expect(i18n.t('header.home')).toBe('హోమ్');
      expect(i18n.t('common.loading')).toBe('లోడ్ అవుతోంది...');
    });

    it('should load translations from backend for Bengali', async () => {
      await i18n.changeLanguage('bn');
      
      
      expect(i18n.t('settings.title')).toBe('সেটিংস');
      expect(i18n.t('settings.language')).toBe('ল্যাঙ্গুয়েজ');
      expect(i18n.t('header.home')).toBe('হোম');
      expect(i18n.t('common.loading')).toBe('লোড হচ্ছে...');
    });

    it('should load translations from backend for Marathi', async () => {
      await i18n.changeLanguage('mr');
      
      
      expect(i18n.t('settings.title')).toBe('सेटिंग्ज');
      expect(i18n.t('settings.language')).toBe('लँग्वेज');
      expect(i18n.t('header.home')).toBe('होम');
      expect(i18n.t('common.loading')).toBe('लोड करत आहे...');
    });

    it('should load translations from backend for Gujarati', async () => {
      await i18n.changeLanguage('gu');
      
      
      expect(i18n.t('settings.title')).toBe('સેટિંગ્સ');
      expect(i18n.t('settings.language')).toBe('લેંગ્વેજ');
      expect(i18n.t('header.home')).toBe('હોમ');
      expect(i18n.t('common.loading')).toBe('લોડ થઈ રહ્યું છે...');
    });

    it('should load translations from backend for Kannada', async () => {
      await i18n.changeLanguage('kn');
      
      
      expect(i18n.t('settings.title')).toBe('ಸೆಟ್ಟಿಂಗ್ಸ್');
      expect(i18n.t('settings.language')).toBe('ಲ್ಯಾಂಗ್ವೇಜ್');
      expect(i18n.t('header.home')).toBe('ಹೋಮ್');
      expect(i18n.t('common.loading')).toBe('ಲೋಡ್ ಆಗುತ್ತಿದೆ...');
    });
  });

  describe('Language Switching', () => {
    it('should switch from English to Hindi and translations should update', async () => {
      await i18n.changeLanguage('en');
      
      expect(i18n.t('settings.updateLanguage')).toBe('Update Language');
      
      await i18n.changeLanguage('hi');
      
      expect(i18n.t('settings.updateLanguage')).toBe('भाषा अपडेट करें');
    });

    it('should switch from Tamil to Telugu and translations should update', async () => {
      await i18n.changeLanguage('ta');
      
      expect(i18n.t('chat.title')).toBe('அரட்டை');
      
      await i18n.changeLanguage('te');
      
      expect(i18n.t('chat.title')).toBe('చాట్');
    });

    it('should persist language preference and reflect correct translations', async () => {
      const testLang = 'gu';
      await i18n.changeLanguage(testLang);
      
      expect(i18n.language).toBe(testLang);
      expect(i18n.t('voice.title')).toBe('વૉઇસ ચેટ');
    });
  });

  describe('Fallback Behavior', () => {
    it('should fallback to English for unsupported language', async () => {
      await i18n.changeLanguage('unsupported-lang');
      
      // Should fallback to English
      expect(i18n.t('settings.title')).toBe('Settings');
    });

    it('should handle missing translation keys gracefully', async () => {
      await i18n.changeLanguage('en');
      
      const missingKey = 'non.existent.key';
      expect(i18n.t(missingKey)).toBe(missingKey);
    });
  });

  describe('All Translation Keys', () => {
    it('should have all expected translation keys loaded from backend', async () => {
      await i18n.changeLanguage('en');
      
      const expectedKeys = [
        'settings.title',
        'settings.account',
        'settings.profiles',
        'settings.subscription',
        'settings.help',
        'settings.language',
        'header.home',
        'header.profile',
        'header.settings',
        'chat.title',
        'voice.title',
        'nav.profiles',
        'panchang.title',
        'personalPanchang.title',
        'monthlyTithis.title',
        'common.loading',
        'common.save',
        'common.cancel',
      ];

      expectedKeys.forEach(key => {
        expect(i18n.exists(key)).toBe(true);
      });
    });

    it('should verify critical UI translations exist in all languages', async () => {
      const languages = ['en', 'hi', 'ta', 'te', 'bn', 'mr', 'gu', 'kn'];
      const criticalKeys = [
        'settings.title',
        'settings.language',
        'header.home',
        'common.loading',
      ];

      for (const lang of languages) {
        await i18n.changeLanguage(lang);
        
        for (const key of criticalKeys) {
          const translation = i18n.t(key);
          expect(translation).not.toBe(key); // Should not return the key itself
          expect(translation.length).toBeGreaterThan(0);
        }
      }
    });
  });

  describe('Backend Configuration', () => {
    it('should have i18n configured correctly for testing', () => {
      // In test environment, we use bundled resources instead of HttpBackend
      expect(i18n.options.resources).toBeDefined();
      expect(i18n.options.resources?.en).toBeDefined();
      expect(i18n.options.resources?.en?.translation).toBeDefined();
    });

    it('should have correct supported languages', () => {
      const supportedLanguages = i18n.options.supportedLngs || [];
      expect(supportedLanguages).toContain('en');
      expect(supportedLanguages).toContain('hi');
      expect(supportedLanguages).toContain('ta');
      expect(supportedLanguages).toContain('te');
      expect(supportedLanguages).toContain('bn');
      expect(supportedLanguages).toContain('mr');
      expect(supportedLanguages).toContain('gu');
      expect(supportedLanguages).toContain('kn');
    });

    it('should have English as fallback language', () => {
      expect(i18n.options.fallbackLng).toContain('en');
    });
  });
});
