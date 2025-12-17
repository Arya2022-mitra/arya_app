"use client";

import React, { useEffect, useRef } from "react";
import { getLenis } from '@/lib/lenisClient';
import { useChat } from "./ChatContext";

export default function ChatPanel() {
  const { isOpen, close, messages, error } = useChat();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    panelRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  // Auto-scroll chat panel to bottom when messages change (Lenis-aware)
  useEffect(() => {
    if (!isOpen) return;
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const target = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
    const lenis = getLenis();

    if (lenis && typeof (lenis as any).scrollTo === 'function') {
      // Align the bottom of the scroll container while letting Lenis handle easing for consistency
      (lenis as any).scrollTo(scroller, { offset: -target });
    }

    // Native fallback and guarantee the scroll container itself is at the bottom
    scroller.scrollTop = target;
  }, [messages, isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Chat Panel"
      tabIndex={-1}
      ref={panelRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        display: "flex",
        flexDirection: "column",
        background: "var(--mv-bg)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 14px",
          borderBottom: "1px solid var(--mv-muted)",
          color: "var(--mv-accent)",
        }}
      >
        <strong>Chat</strong>
        <button
          onClick={close}
          style={{
            background: "transparent",
            color: "var(--mv-accent)",
            border: "1px solid var(--mv-accent)",
            padding: "6px 10px",
            borderRadius: 8,
            cursor: "pointer",
          }}
        >
          Close
        </button>
      </div>

      <div ref={scrollerRef} style={{ flex: 1, overflowY: "auto", padding: 12 }}>
        {messages.map((message) => (
          <div
            key={message.id}
            style={{
              margin: "8px 0",
              display: "flex",
              justifyContent: message.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            <div
              style={{
                maxWidth: "85%",
                background:
                  message.role === "user" ? "var(--mv-surface)" : "var(--mv-panel)",
                color: "var(--mv-text)",
                border:
                  message.role === "user" ? "1px solid var(--mv-muted)" : "none",
                borderRadius: 10,
                padding: "8px 10px",
                whiteSpace: "pre-wrap",
              }}
            >
              {message.composed}
            </div>
          </div>
        ))}
        {error && (
          <div style={{ color: "var(--mv-error)", marginTop: 8 }}>{error}</div>
        )}
      </div>
    </div>
  );
}

