import type { ReactNode, CSSProperties } from 'react';

interface ChatBubbleProps {
  message: string | ReactNode;
  from: 'user' | 'assistant';
  timestamp?: string;
}

export default function ChatBubble({ message, from, timestamp }: ChatBubbleProps) {
  const isUser = from === 'user';

  const bubbleStyle: CSSProperties = {
    borderRadius: '18px',
    border: isUser ? '1px solid var(--mv-accent)' : 'none',
    padding: '16px 20px',
    fontSize: '0.95rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    background: isUser ? 'var(--mv-cyan)' : 'var(--mv-surface)',
    color: isUser ? 'var(--mv-bg)' : 'var(--mv-text)',
    alignSelf: isUser ? 'flex-end' : 'stretch',
    maxWidth: isUser ? 'min(720px, 100%)' : '100%',
    width: isUser ? 'auto' : '100%',
    textAlign: isUser ? 'right' : 'left',
    boxShadow: isUser ? '0 12px 30px var(--mv-muted)' : 'none',
  };

  const timestampStyle: CSSProperties = {
    fontSize: '0.75rem',
    fontWeight: 500,
    opacity: 0.7,
    color: isUser ? 'var(--mv-bg)' : 'var(--mv-muted)',
    marginTop: '4px',
  };

  return (
    <div style={bubbleStyle}>
      <div style={{ wordBreak: 'break-word', lineHeight: 1.6 }}>{message}</div>
      {timestamp && <span style={timestampStyle}>{timestamp}</span>}
    </div>
  );
}
