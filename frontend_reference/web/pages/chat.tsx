import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getLenis } from '@/lib/lenisClient';
import { CHAT_DOCK_BOTTOM_PADDING } from '@/components/chat/ChatDock';
import type { ReactNode } from 'react';
import { useRouter } from 'next/router';
import { useActiveProfile } from '@/lib/useActiveProfile';
import { useAuth } from '@/lib/useAuth';
import ChatBubble from '@/components/ChatBubble';
import { handleUnauthorized } from '@/lib/handleUnauthorized';
import { sendChatMessage } from '@/lib/chatClient';
import { useUniversalSpeech } from '@/lib/useUniversalSpeech';
import { useTranslation } from 'react-i18next';
import { useTTS } from '@/hooks/useTTS';

type MessageAudio = {
  url: string;
  isObjectUrl: boolean;
};

type Message = {
  from: 'user' | 'assistant';
  composed: string | ReactNode;
  timestamp: string;
  audio?: MessageAudio;
  audioStatus?: 'idle' | 'loading' | 'playing' | 'error';
};

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [currentAudioIndex, setCurrentAudioIndex] = useState<number | null>(null);
  const currentAudioIndexRef = useRef<number | null>(null);
  const messagesRef = useRef<Message[]>(messages);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);
  useEffect(() => {
    currentAudioIndexRef.current = currentAudioIndex;
  }, [currentAudioIndex]);
  const { t } = useTranslation();
  const { speak: speakTTS, stop: stopTTS, status: ttsStatus, supported: ttsSupported } = useTTS();

  const router = useRouter();
  const { token, sessionRestored, logout, refreshToken, userLanguage } = useAuth();
  const loadingAuth = !sessionRestored;
  const { profile, loading } = useActiveProfile();
  const [profileId, setProfileId] = useState<string | null>(null);

  // Speech recognition with support for all 11 languages in the application
  // Automatically uses the user's selected language from userLanguage
  const {
    supported: isSpeechSupported,
    listening: isListening,
    finalTranscript,
    interimTranscript,
    uploading,
    error: speechError,
    start: startListening,
    stop: stopListening,
  } = useUniversalSpeech({ lang: userLanguage });

  // Update input with transcript
  useEffect(() => {
    if (finalTranscript) {
      setInput(finalTranscript);
    }
  }, [finalTranscript]);

  // Show interim transcript in input
  useEffect(() => {
    if (isListening && interimTranscript) {
      setInput(finalTranscript + interimTranscript);
    }
  }, [isListening, interimTranscript, finalTranscript]);

  useEffect(() => {
    if (!sessionRestored) {
      return;
    }
    if (!token && router.pathname !== '/auth') {
      router.replace('/auth');
    }
  }, [token, router, sessionRestored]);

  useEffect(() => {
    if (!loading && profile) {
      setProfileId(String(profile.id || profile.profile_id));
    }
  }, [loading, profile]);

  useEffect(() => {
    if (!loading && !profile) {
      router.push('/profile');
    }
  }, [loading, profile, router]);


  const prepareAndPlayAudio = useCallback(
    async (index: number, playImmediately: boolean) => {
      if (typeof window === 'undefined' || !ttsSupported) {
        return;
      }

      const currentMessage = messagesRef.current[index];
      if (!currentMessage || currentMessage.from !== 'assistant') {
        return;
      }

      const messageText = typeof currentMessage.composed === 'string' ? currentMessage.composed : '';
      if (!messageText.trim()) {
        return;
      }

      setMessages((prev) => {
        const clone = [...prev];
        if (clone[index]) {
          clone[index] = { ...clone[index], audioStatus: 'loading' };
        }
        return clone;
      });

      try {
        // Stop any currently playing TTS
        stopTTS();
        
        // Set current audio index
        setCurrentAudioIndex(index);
        
        // Speak using browser TTS
        speakTTS(messageText);
        
        // Update status to playing
        setMessages((prev) => {
          const clone = [...prev];
          if (clone[index]) {
            clone[index] = { ...clone[index], audioStatus: 'playing' };
          }
          return clone;
        });
      } catch (error) {
        console.error('Failed to play TTS audio:', error);
        setMessages((prev) => {
          const clone = [...prev];
          if (clone[index]) {
            clone[index] = { ...clone[index], audioStatus: 'error' };
          }
          return clone;
        });
      }
    },
    [ttsSupported, speakTTS, stopTTS],
  );

  const sendMessage = useCallback(
    async (initialQuestion?: string) => {
      let authTok = token;
      if (!authTok && refreshToken) {
        authTok = await refreshToken(true);
      }
      if (!authTok) {
        if (router.pathname !== '/auth') {
          router.replace('/auth');
        }
        return;
      }

      const question = (initialQuestion ?? input).trim();
      if (!question) return;

      const timestamp = new Date().toLocaleTimeString();
      setMessages((prev) => [
        ...prev,
        { from: 'user', composed: question, timestamp },
      ]);

      if (!initialQuestion) {
        setInput('');
      }
      setSending(true);

      if (!profileId) {
        alert('Please select a valid profile.');
        router.replace('/profile');
        setSending(false);
        return;
      }

      try {
        const sendWithToken = async (bearer: string) =>
          sendChatMessage({
            token: bearer,
            profileId,
            question,
            lang: userLanguage,
          });

        let reply: Awaited<ReturnType<typeof sendChatMessage>>;
        try {
          reply = await sendWithToken(authTok);
        } catch (error: any) {
          if (String(error?.message) === 'UNAUTHORIZED' && refreshToken) {
            const fresh = await refreshToken(true);
            if (fresh) {
              reply = await sendWithToken(fresh);
            } else {
              throw error;
            }
          } else {
            throw error;
          }
        }

        const { composed } = reply;
        const shouldAutoSpeak = typeof composed === 'string' && composed.trim().length > 0;
        const botMessage: Message = {
          from: 'assistant',
          composed,
          timestamp: new Date().toLocaleTimeString(),
          ...(shouldAutoSpeak ? { audioStatus: 'loading' as const } : {}),
        };
        let assistantIndex: number | null = null;
        setMessages((prev) => {
          const next = [...prev, botMessage];
          assistantIndex = next.length - 1;
          return next;
        });
        if (shouldAutoSpeak && assistantIndex !== null) {
          void prepareAndPlayAudio(assistantIndex, true);
        }
      } catch (error: any) {
        if (String(error?.message) === 'UNAUTHORIZED') {
          await handleUnauthorized(router, { logout, refreshToken });
          return;
        }
        setMessages((prev) => [
          ...prev,
          {
            from: 'assistant',
            composed: '❌ Error contacting server.',
            timestamp: new Date().toLocaleTimeString(),
          },
        ]);
      } finally {
        setSending(false);
      }
    },
    [input, profileId, router, token, logout, refreshToken, userLanguage, prepareAndPlayAudio],
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  };

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const hasText = input.trim().length > 0;

  useEffect(() => {
    const el = chatEndRef.current;
    if (!el) return;

    // Use Lenis when available for consistent smooth scrolling.
    const lenis = getLenis();
    const offset = typeof CHAT_DOCK_BOTTOM_PADDING === 'number' ? CHAT_DOCK_BOTTOM_PADDING : 0;

    if (lenis && typeof (lenis as any).scrollTo === 'function') {
      // Lenis expects a negative offset to move the element up by `offset`
      (lenis as any).scrollTo(el, { offset: -offset });
    } else {
      // Native fallback that respects offset
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    }
  }, [messages]);

  const initialQuestionHandled = useRef(false);

  useEffect(() => {
    if (initialQuestionHandled.current) return;
    if (typeof window === 'undefined') return;
    if (!profileId || !token) return;

    const storedQuestion = localStorage.getItem('mitraveda_chat_question');
    if (!storedQuestion) return;

    initialQuestionHandled.current = true;
    localStorage.removeItem('mitraveda_chat_question');
    void sendMessage(storedQuestion);
  }, [profileId, sendMessage, token]);

  // Update message audio status based on TTS status
  useEffect(() => {
    if (currentAudioIndex === null) return;
    
    setMessages((prev) => {
      const clone = [...prev];
      if (clone[currentAudioIndex]) {
        const newStatus = 
          ttsStatus === 'speaking' ? 'playing' :
          ttsStatus === 'loading' ? 'loading' :
          ttsStatus === 'error' ? 'error' :
          'idle';
        
        clone[currentAudioIndex] = {
          ...clone[currentAudioIndex],
          audioStatus: newStatus
        };
      }
      return clone;
    });
    
    // Clear current audio index when TTS is idle
    if (ttsStatus === 'idle') {
      setCurrentAudioIndex(null);
    }
  }, [ttsStatus, currentAudioIndex]);

  useEffect(() => {
    return () => {
      // Cleanup: stop TTS on unmount
      stopTTS();
      setCurrentAudioIndex(null);
    };
  }, [stopTTS]);

  if (loadingAuth || loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--mv-bg)',
          color: 'var(--mv-text)',
        }}
      >
        {t('common.loading')}
      </div>
    );
  }

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        minHeight: 0,
        background: 'var(--mv-bg)',
        color: 'var(--mv-text)',
      }}
    >
      <div
        className="chat-watermark"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          maxWidth: 'none',
          borderRadius: 0,
          border: 'none',
          background: 'var(--mv-panel)',
          boxShadow: 'none',
          overflow: 'visible',
        }}
      >
        <header
          style={{
            padding: '24px',
            textAlign: 'center',
            fontFamily: '"Orbitron", sans-serif',
            fontSize: '1.1rem',
            letterSpacing: '0.04em',
            borderBottom: '1px solid var(--mv-accent)',
            color: 'var(--mv-cyan)',
            background: 'var(--mv-panel)',
          }}
        >
          🔮 MitraVeda Chat – Divine Guidance
        </header>
        <main
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            padding: '24px',
            background: 'var(--mv-panel)',
            minHeight: 0,
          }}
        >
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              borderRadius: '20px',
              border: '1px solid var(--mv-muted)',
              background: 'var(--mv-surface)',
              padding: '20px',
              minHeight: 0,
              paddingBottom: '100px',
            }}
          >
            {messages.map((msg, idx) => {
              const isAssistant = msg.from === 'assistant';
              const speakable = isAssistant && typeof msg.composed === 'string' && msg.composed.trim().length > 0;
              const audioStatus = msg.audioStatus || 'idle';
              const buttonLabel =
                audioStatus === 'loading'
                  ? 'Preparing audio…'
                  : audioStatus === 'playing'
                  ? 'Playing…'
                  : '🔊 Listen';

              return (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <ChatBubble from={msg.from} message={msg.composed} timestamp={msg.timestamp} />
                  {speakable && (
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        alignItems: 'center',
                        gap: '8px',
                        paddingRight: '8px',
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          void prepareAndPlayAudio(idx, true);
                        }}
                        disabled={audioStatus === 'loading' || audioStatus === 'playing'}
                        style={{
                          border: '1px solid var(--mv-cyan)',
                          background: 'transparent',
                          color: 'var(--mv-cyan)',
                          borderRadius: '20px',
                          padding: '4px 14px',
                          fontSize: '0.85rem',
                          cursor:
                            audioStatus === 'loading' || audioStatus === 'playing'
                              ? 'not-allowed'
                              : 'pointer',
                          opacity: audioStatus === 'loading' ? 0.6 : 1,
                        }}
                        aria-busy={audioStatus === 'loading'}
                      >
                        {buttonLabel}
                      </button>
                      {audioStatus === 'error' && (
                        <span style={{ color: 'var(--mv-error)', fontSize: '0.8rem' }}>Audio unavailable</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {sending && (
              <div
                style={{
                  textAlign: 'center',
                  fontStyle: 'italic',
                  color: 'var(--mv-cyan)',
                  fontSize: '0.9rem',
                }}
              >
                {t('chat.processing')}
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        </main>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void sendMessage();
        }}
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          width: '100%',
          borderRadius: '20px',
          border: '1px solid var(--mv-cyan)',
          background: 'var(--mv-panel)',
          boxShadow: '0 0 0 1px var(--mv-muted)',
          padding: 0,
          zIndex: 1000,
        }}
      >
        <div style={{ position: 'relative' }}>
          {speechError && (
            <div
              role="alert"
              style={{
                position: 'absolute',
                bottom: '100%',
                left: '18px',
                right: '18px',
                marginBottom: '8px',
                padding: '8px 12px',
                background: 'var(--mv-error)',
                color: 'var(--mv-bg)',
                fontSize: '0.9rem',
                borderRadius: '8px',
                zIndex: 10001,
              }}
            >
              {speechError}
            </div>
          )}
          <textarea
            style={{
              width: '100%',
              minHeight: '55px',
              resize: 'vertical',
              border: 'none',
              background: 'transparent',
              color: 'var(--mv-text)',
              padding: '14px 120px 14px 18px',
              fontSize: '1rem',
              lineHeight: 1.5,
              outline: 'none',
              boxSizing: 'border-box',
            }}
            placeholder={
              uploading
                ? t('chat.processing')
                : isListening
                ? t('chat.listening')
                : t('chat.inputPlaceholder')
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          {hasText ? (
            <button
              type="submit"
              disabled={sending}
              style={{
                position: 'absolute',
                top: '50%',
                right: '12px',
                transform: 'translateY(-50%)',
                background: 'var(--mv-cyan)',
                color: 'var(--mv-bg)',
                border: 'none',
                borderRadius: '999px',
                padding: '10px 24px',
                fontFamily: '"Rajdhani", sans-serif',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: sending ? 'not-allowed' : 'pointer',
                opacity: sending ? 0.7 : 1,
                boxShadow: '0 0 25px var(--mv-cyan)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onMouseEnter={(e) => {
                if (sending) return;
                (e.currentTarget.style.transform = 'translateY(-50%) scale(1.02)');
                e.currentTarget.style.boxShadow = '0 0 35px var(--mv-cyan)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                e.currentTarget.style.boxShadow = '0 0 25px var(--mv-cyan)';
              }}
            >
              {sending ? t('chat.processing') : t('chat.send')}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleMicClick}
              disabled={!isSpeechSupported || uploading}
              aria-label={isListening ? t('chat.stopRecording') : t('chat.startRecording')}
              aria-pressed={isListening}
              title={
                !isSpeechSupported
                  ? 'Speech recognition not supported in this browser'
                  : uploading
                  ? t('chat.processing')
                  : isListening
                  ? t('chat.stopRecording')
                  : t('chat.startRecording')
              }
              style={{
                position: 'absolute',
                top: '50%',
                right: '12px',
                transform: 'translateY(-50%)',
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: !isSpeechSupported || uploading
                  ? 'var(--mv-muted)'
                  : 'var(--mv-cyan)',
                color: 'var(--mv-bg)',
                border: 'none',
                cursor: !isSpeechSupported || uploading ? 'not-allowed' : 'pointer',
                opacity: !isSpeechSupported || uploading ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: isListening ? '0 0 25px var(--mv-cyan)' : 'none',
                transition: 'all 0.2s ease',
                animation: isListening ? 'pulse-mic 1.5s ease-in-out infinite' : 'none',
              }}
              onMouseEnter={(e) => {
                if (!isSpeechSupported || uploading) return;
                e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
              }}
            >
              {uploading ? (
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  style={{ animation: 'spin 1s linear infinite' }}
                >
                  <circle cx="12" cy="12" r="10" opacity="0.25" />
                  <path d="M12 2 A10 10 0 0 1 22 12" />
                </svg>
              ) : isListening ? (
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="6" y="6" width="12" height="12" />
                </svg>
              ) : (
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="23" />
                  <line x1="8" y1="23" x2="16" y2="23" />
                </svg>
              )}
            </button>
          )}
          {isListening && (
            <div
              role="status"
              aria-live="polite"
              style={{
                position: 'absolute',
                top: '50%',
                right: '70px',
                transform: 'translateY(-50%)',
                color: 'var(--mv-cyan)',
                fontSize: '0.85rem',
                fontStyle: 'italic',
              }}
            >
              Listening...
            </div>
          )}
        </div>
        <style jsx>{`
          @keyframes pulse-mic {
            0%,
            100% {
              box-shadow: 0 0 0 0 rgba(0, 255, 255, 0.4);
            }
            50% {
              box-shadow: 0 0 0 12px rgba(0, 255, 255, 0);
            }
          }
          @keyframes spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </form>
    </div>
  );
}
