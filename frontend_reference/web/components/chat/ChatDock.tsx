"use client";
import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { useUniversalSpeech } from '@/lib/useUniversalSpeech';
import { useAuth } from '@/lib/useAuth';
import { useChat } from '@/components/chat/ChatContext';

interface ChatDockProps {
  isSidebarOpen?: boolean;
}

const dockHeight = 64; // px

export default function ChatDock({ isSidebarOpen = false }: ChatDockProps) {
  const router = useRouter();
  const [value, setValue] = useState('');
  const [redirecting, setRedirecting] = useState(false);
  const { userLanguage } = useAuth();
  const chat = useChat();
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

  const inputRef = useRef<HTMLInputElement>(null);
  const autoSendAttemptedRef = useRef<string | null>(null);

  // Update input with transcript
  useEffect(() => {
    if (finalTranscript) {
      setValue(finalTranscript);
    }
  }, [finalTranscript]);

  // Show interim transcript as placeholder or in input
  useEffect(() => {
    if (isListening && interimTranscript) {
      setValue(finalTranscript + interimTranscript);
    }
  }, [isListening, interimTranscript, finalTranscript]);

  // Auto-send when mic recording ends with transcript
  useEffect(() => {
    const transcript = finalTranscript?.trim();
    if (!transcript || isListening) return;
    
    // Avoid re-sending the same transcript
    if (autoSendAttemptedRef.current === transcript) return;
    autoSendAttemptedRef.current = transcript;

    const attemptAutoSend = async () => {
      setRedirecting(true);
      setValue('');
      
      try {
        // Send via chat context (handles auth/profile redirects internally)
        await chat.send(transcript);
        // On success, open chat panel
        chat.open();
        // Reset ref on successful send
        autoSendAttemptedRef.current = null;
      } catch (error) {
        // Fallback: save to localStorage and redirect to /chat if context unavailable
        if (typeof window !== 'undefined') {
          localStorage.setItem('mitraveda_chat_question', transcript);
        }
        await router.push('/chat');
      } finally {
        setRedirecting(false);
      }
    };

    void attemptAutoSend();
  }, [finalTranscript, isListening, chat, router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;

    setRedirecting(true);
    setValue('');

    try {
      // Send via chat context (handles auth/profile redirects internally)
      await chat.send(trimmed);
      // On success, open chat panel
      chat.open();
    } catch (error) {
      // Fallback: save to localStorage and redirect to /chat if context unavailable
      if (typeof window !== 'undefined') {
        localStorage.setItem('mitraveda_chat_question', trimmed);
      }
      await router.push('/chat');
    } finally {
      setRedirecting(false);
    }
  };

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const hasText = value.trim().length > 0;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().includes('MAC');
      if ((isMac ? e.metaKey : e.ctrlKey) && e.key === '/') {
        inputRef.current?.focus();
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const horizontalPadding = 24;
  const sidebarWidth = 'var(--drawer-width)';
  const dockLeft = isSidebarOpen
    ? `calc(${sidebarWidth} + ${horizontalPadding}px)`
    : `${horizontalPadding}px`;
  const dockWidth = isSidebarOpen
    ? `calc(100vw - ${horizontalPadding * 2}px - ${sidebarWidth})`
    : `calc(100vw - ${horizontalPadding * 2}px)`;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: dockLeft,
        right: 'auto',
        width: dockWidth,
        maxWidth: '100%',
        display: 'flex',
        alignItems: 'center',
        padding: '6px',
        zIndex: 9999,
        transition: 'all 0.3s ease-in-out',
        boxSizing: 'border-box',
      }}
    >
      <form
        onSubmit={onSubmit}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flex: 1,
          width: '100%',
          background: 'var(--mv-bg)',
          border: '1px solid var(--mv-cyan)',
          borderRadius: '8px',
          overflow: 'hidden',
          boxSizing: 'border-box',
          position: 'relative',
        }}
      >
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={
            uploading
              ? 'Transcribing...'
              : isListening
              ? 'Listening...'
              : 'Type a message…'
          }
          style={{
            flex: 1,
            background: 'transparent',
            color: 'var(--mv-text)',
            padding: '8px 8px 8px 12px',
            minWidth: 0,
            border: 'none',
            outline: 'none',
          }}
        />
        {speechError && (
          <div
            style={{
              position: 'absolute',
              bottom: '100%',
              left: 0,
              right: 0,
              marginBottom: '4px',
              padding: '6px 8px',
              background: 'var(--mv-error)',
              color: 'var(--mv-bg)',
              fontSize: '0.85rem',
              borderRadius: '4px',
              zIndex: 10000,
            }}
          >
            {speechError}
          </div>
        )}
        {hasText ? (
          <button
            type="submit"
            disabled={redirecting}
            style={{
              background: 'var(--mv-cyan)',
              color: 'var(--mv-bg)',
              border: 'none',
              borderRadius: '999px',
              padding: '6px 16px',
              fontFamily: '"Rajdhani", sans-serif',
              fontSize: '0.95rem',
              fontWeight: 600,
              cursor: redirecting ? 'not-allowed' : 'pointer',
              opacity: redirecting ? 0.6 : 1,
              marginRight: '4px',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              if (redirecting) return;
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            {redirecting ? 'Opening…' : 'Send'}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleMicClick}
            disabled={!isSpeechSupported || uploading}
            aria-label={isListening ? 'Stop voice capture' : 'Activate voice capture'}
            aria-pressed={isListening}
            title={
              !isSpeechSupported
                ? 'Speech recognition not supported in this browser'
                : uploading
                ? 'Transcribing audio...'
                : isListening
                ? 'Stop listening'
                : 'Start voice input'
            }
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: !isSpeechSupported || uploading ? 'var(--mv-muted)' : 'var(--mv-cyan)',
              color: 'var(--mv-bg)',
              border: 'none',
              cursor: !isSpeechSupported || uploading ? 'not-allowed' : 'pointer',
              opacity: !isSpeechSupported || uploading ? 0.5 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '4px',
              transition: 'all 0.2s ease',
              animation: isListening ? 'pulse-mic 1.5s ease-in-out infinite' : 'none',
            }}
            onMouseEnter={(e) => {
              if (!isSpeechSupported || uploading) return;
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            {uploading ? (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ animation: 'spin 1s linear infinite' }}
              >
                <circle cx="12" cy="12" r="10" opacity="0.25" />
                <path d="M12 2 A10 10 0 0 1 22 12" />
              </svg>
            ) : isListening ? (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="6" y="6" width="12" height="12" />
              </svg>
            ) : (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            )}
          </button>
        )}
      </form>
      <style jsx>{`
        @keyframes pulse-mic {
          0%,
          100% {
            box-shadow: 0 0 0 0 rgba(0, 255, 255, 0.4);
          }
          50% {
            box-shadow: 0 0 0 10px rgba(0, 255, 255, 0);
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
    </div>
  );
}

// Export constant to reuse padding where needed
export const CHAT_DOCK_BOTTOM_PADDING = dockHeight;
