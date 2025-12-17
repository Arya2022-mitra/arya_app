import { useState, useCallback, useRef, useEffect } from 'react';

// Note: Server-side STT transcription removed. Using Web Speech API only.

export interface UniversalSpeechHookResult {
  supported: boolean;
  listening: boolean;
  interimTranscript: string;
  finalTranscript: string;
  uploading: boolean;
  error: string | null;
  start: () => void;
  stop: () => void;
}

interface UniversalSpeechOptions {
  lang?: string | null;
}

// TypeScript declarations for Web Speech API
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

declare global {
  interface Window {
    SpeechRecognition: {
      prototype: SpeechRecognition;
      new (): SpeechRecognition;
    };
    webkitSpeechRecognition: {
      prototype: SpeechRecognition;
      new (): SpeechRecognition;
    };
  }
}

// Language mapping from i18n codes to BCP-47 codes for Web Speech API
const LANGUAGE_MAP: Record<string, string> = {
  'en': 'en-US',      // English
  'hi': 'hi-IN',      // Hindi
  'bn': 'bn-IN',      // Bengali
  'te': 'te-IN',      // Telugu
  'mr': 'mr-IN',      // Marathi
  'ta': 'ta-IN',      // Tamil
  'gu': 'gu-IN',      // Gujarati
  'kn': 'kn-IN',      // Kannada
  'ml': 'ml-IN',      // Malayalam
  'ne': 'ne-NP',      // Nepali
  'ms': 'ms-MY',      // Malay
};

/**
 * Convert i18n language code to BCP-47 format for Web Speech API
 * Supports 11 languages total: English, Hindi, Bengali, Telugu, Marathi,
 * Tamil, Gujarati, Kannada, Malayalam, Nepali, and Malay
 */
const getWebSpeechLanguage = (langCode: string | null | undefined): string => {
  if (!langCode) return 'en-US';
  
  // If already in BCP-47 format (contains hyphen), return as-is
  if (langCode.includes('-')) return langCode;
  
  // Map i18n code to BCP-47 code
  return LANGUAGE_MAP[langCode] || 'en-US';
};

// Helper function to concatenate transcripts
const concatenateTranscripts = (existing: string, newText: string): string => {
  return existing ? `${existing} ${newText}`.trim() : newText;
};

type RecognitionStrategy = 'speech-api' | 'media-recorder' | 'none';

/**
 * Universal speech recognition hook that supports:
 * 1. Web Speech API (Chrome, Edge, Safari) - preferred for low latency
 * 2. MediaRecorder + server transcription (fallback)
 * 3. None (unsupported browsers)
 */
export function useUniversalSpeech(
  options: UniversalSpeechOptions = {}
): UniversalSpeechHookResult {
  const { lang } = options;

  const [listening, setListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const strategyRef = useRef<RecognitionStrategy>('none');

  // Determine best available strategy
  const detectStrategy = useCallback((): RecognitionStrategy => {
    if (typeof window === 'undefined') return 'none';

    // Check for Web Speech API support
    if (window.SpeechRecognition || window.webkitSpeechRecognition) {
      return 'speech-api';
    }

    // Check for MediaRecorder support
    if (navigator.mediaDevices && typeof MediaRecorder !== 'undefined') {
      return 'media-recorder';
    }

    return 'none';
  }, []);

  const supported = detectStrategy() !== 'none';

  // Initialize Web Speech API if available
  useEffect(() => {
    const strategy = detectStrategy();
    strategyRef.current = strategy;

    if (strategy !== 'speech-api') return;

    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) return;

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.lang = getWebSpeechLanguage(lang);

    recognition.onstart = () => {
      setListening(true);
      setError(null);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0].transcript;

        if (result.isFinal) {
          final += text;
        } else {
          interim += text;
        }
      }

      if (final) {
        setFinalTranscript((prev) => concatenateTranscripts(prev, final));
      }
      setInterimTranscript(interim);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('[SpeechRecognition] Error:', event.error);

      let errorMessage = 'Speech recognition error';

      switch (event.error) {
        case 'not-allowed':
        case 'service-not-allowed':
          errorMessage = 'Microphone access denied. Please allow microphone access.';
          break;
        case 'no-speech':
          errorMessage = 'No speech detected. Please try again.';
          break;
        case 'audio-capture':
          errorMessage = 'No microphone found. Please connect a microphone.';
          break;
        case 'network':
          errorMessage = 'Network error. Please check your connection.';
          break;
        default:
          errorMessage = `Speech recognition error: ${event.error}`;
      }

      setError(errorMessage);
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
      setInterimTranscript('');
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // Ignore cleanup errors
        }
      }
    };
  }, [detectStrategy, lang]);

  // MediaRecorder transcription function (disabled - server STT removed)
  const transcribeAudioBlob = useCallback(
    async (blob: Blob) => {
      setUploading(true);
      setError(null);

      try {
        // Server-side STT transcription has been removed.
        // Only Web Speech API is available for speech recognition.
        setError('Server transcription unavailable - please use Web Speech API mode');
    } catch (err: any) {
      console.error('[MediaRecorder] Transcription error:', err);
      setError(err?.message || 'Transcription failed - please type your message');
    } finally {
      setUploading(false);
    }
  },
    []
  );

  // Start recording
  const start = useCallback(async () => {
    setError(null);
    setFinalTranscript('');
    setInterimTranscript('');

    const strategy = strategyRef.current;

    if (strategy === 'speech-api' && recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error('[SpeechRecognition] Start error:', err);
        setError('Failed to start speech recognition');
      }
      return;
    }

    if (strategy === 'media-recorder') {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;

        const mediaRecorder = new MediaRecorder(stream);
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, {
            type: 'audio/webm',
          });
          audioChunksRef.current = [];

          // Stop all tracks
          if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
          }

          // Transcribe the audio
          await transcribeAudioBlob(audioBlob);
        };

        mediaRecorder.onerror = (event) => {
          console.error('[MediaRecorder] Error:', event);
          setError('Recording failed');
          setListening(false);
        };

        mediaRecorderRef.current = mediaRecorder;
        mediaRecorder.start();
        setListening(true);
      } catch (err: any) {
        console.error('[MediaRecorder] Start error:', err);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setError('Microphone access denied. Please allow microphone access.');
        } else if (err.name === 'NotFoundError') {
          setError('No microphone found. Please connect a microphone.');
        } else {
          setError('Failed to start recording');
        }
      }
      return;
    }

    setError('Speech recognition not supported in this browser');
  }, [transcribeAudioBlob]);

  // Stop recording
  const stop = useCallback(() => {
    const strategy = strategyRef.current;

    if (strategy === 'speech-api' && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.error('[SpeechRecognition] Stop error:', err);
      }
      return;
    }

    if (strategy === 'media-recorder' && mediaRecorderRef.current) {
      try {
        if (mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
        }
        setListening(false);
      } catch (err) {
        console.error('[MediaRecorder] Stop error:', err);
        setListening(false);
      }
      return;
    }
  }, []);

  return {
    supported,
    listening,
    interimTranscript,
    finalTranscript,
    uploading,
    error,
    start,
    stop,
  };
}
