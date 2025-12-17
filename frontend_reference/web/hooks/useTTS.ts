import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

type TTSStatus = 'idle' | 'loading' | 'speaking' | 'paused' | 'error';

interface UseTTSReturn {
  speak: (text: string) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  status: TTSStatus;
  supported: boolean;
  availableVoices: SpeechSynthesisVoice[];
  currentVoice: SpeechSynthesisVoice | null;
  setVoice: (voice: SpeechSynthesisVoice) => void;
}

/**
 * Language codes mapped to browser TTS language codes
 * Uses BCP 47 language tags
 */
const LANGUAGE_VOICE_MAP: Record<string, string[]> = {
  en: ['en-US', 'en-GB', 'en-IN', 'en'],
  hi: ['hi-IN', 'hi'],
  ta: ['ta-IN', 'ta'],
  te: ['te-IN', 'te'],
  bn: ['bn-IN', 'bn-BD', 'bn'],
  mr: ['mr-IN', 'mr'],
  gu: ['gu-IN', 'gu'],
  kn: ['kn-IN', 'kn'],
  ml: ['ml-IN', 'ml'],
  ms: ['ms-MY', 'ms'],
  ne: ['ne-NP', 'ne'],
};

/**
 * Hook for Text-to-Speech using browser's speechSynthesis API
 * Supports 11 languages with automatic voice selection based on current language
 * 
 * @example
 * const { speak, pause, resume, stop, status } = useTTS();
 * 
 * // Speak text
 * speak('Hello, this is a test');
 * 
 * // Control playback
 * pause();
 * resume();
 * stop();
 */
export function useTTS(): UseTTSReturn {
  const { i18n } = useTranslation();
  const [status, setStatus] = useState<TTSStatus>('idle');
  const [supported, setSupported] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [currentVoice, setCurrentVoice] = useState<SpeechSynthesisVoice | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Check if speechSynthesis is supported
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setSupported(true);
      
      // Load voices
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        setAvailableVoices(voices);
        
        // Auto-select best voice for current language
        selectBestVoice(voices, i18n.language);
      };

      // Voices might load asynchronously
      loadVoices();
      
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
    }
  }, [i18n.language]);

  /**
   * Select the best available voice for the given language
   * Memoized to avoid recalculating when voices array hasn't changed
   */
  const selectBestVoice = useMemo(() => {
    return (voices: SpeechSynthesisVoice[], language: string) => {
      const langCode = language.split('-')[0]; // Get base language code (e.g., 'en' from 'en-US')
      const preferredLangs = LANGUAGE_VOICE_MAP[langCode] || [language, langCode];
      
      // Try to find a voice that matches the preferred languages in order
      for (const prefLang of preferredLangs) {
        const matchingVoice = voices.find(voice => 
          voice.lang.toLowerCase().startsWith(prefLang.toLowerCase())
        );
        
        if (matchingVoice) {
          setCurrentVoice(matchingVoice);
          return;
        }
      }
      
      // Fallback to first available voice
      if (voices.length > 0) {
        setCurrentVoice(voices[0]);
      }
    };
  }, []); // Empty deps - function logic doesn't depend on external state

  /**
   * Speak the given text
   */
  const speak = useCallback((text: string) => {
    if (!supported || !text.trim()) {
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set voice if available
    if (currentVoice) {
      utterance.voice = currentVoice;
    }
    
    // Set language
    const langCode = i18n.language || 'en';
    const voiceLangs = LANGUAGE_VOICE_MAP[langCode.split('-')[0]];
    if (voiceLangs && voiceLangs.length > 0) {
      utterance.lang = voiceLangs[0];
    } else {
      utterance.lang = langCode;
    }

    // Set speech parameters
    utterance.rate = 1.0; // Normal speed
    utterance.pitch = 1.0; // Normal pitch
    utterance.volume = 1.0; // Maximum volume

    // Event handlers
    utterance.onstart = () => {
      setStatus('speaking');
    };

    utterance.onend = () => {
      setStatus('idle');
      utteranceRef.current = null;
    };

    utterance.onerror = (event) => {
      console.error('TTS error:', event);
      setStatus('error');
      utteranceRef.current = null;
    };

    utterance.onpause = () => {
      setStatus('paused');
    };

    utterance.onresume = () => {
      setStatus('speaking');
    };

    utteranceRef.current = utterance;
    setStatus('loading');
    
    try {
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('Failed to speak:', error);
      setStatus('error');
    }
  }, [supported, currentVoice, i18n.language]);

  /**
   * Pause speech
   */
  const pause = useCallback(() => {
    if (supported && window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
      setStatus('paused');
    }
  }, [supported]);

  /**
   * Resume speech
   */
  const resume = useCallback(() => {
    if (supported && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setStatus('speaking');
    }
  }, [supported]);

  /**
   * Stop speech
   */
  const stop = useCallback(() => {
    if (supported) {
      window.speechSynthesis.cancel();
      setStatus('idle');
      utteranceRef.current = null;
    }
  }, [supported]);

  /**
   * Set a specific voice
   */
  const setVoice = useCallback((voice: SpeechSynthesisVoice) => {
    setCurrentVoice(voice);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (supported) {
        window.speechSynthesis.cancel();
      }
    };
  }, [supported]);

  return {
    speak,
    pause,
    resume,
    stop,
    status,
    supported,
    availableVoices,
    currentVoice,
    setVoice,
  };
}
