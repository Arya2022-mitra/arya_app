"use client";
import React, { createContext, useContext, useState, useCallback } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useActiveProfile } from "@/lib/useActiveProfile";
import { useAuth } from "@/lib/useAuth";
import { sendChatMessage, type ChatContext as ChatContextPayload } from "@/lib/chatClient";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  composed: string | ReactNode;
  ts: number;
};
type ChatContextType = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  messages: ChatMessage[];
  send: (text: string, context?: ChatContextPayload | null) => Promise<void>;
  sending: boolean;
  error: string | null;
};

const ChatContext = createContext<ChatContextType | null>(null);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const { token, sessionRestored, logout, userLanguage } = useAuth();
  const { profile, loading } = useActiveProfile();

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);
  const toggle = () => setIsOpen(v => !v);

  const send = useCallback(async (text: string, context?: ChatContextPayload | null) => {
    const question = (text || "").trim();
    if (!question) return;

    // Require auth + active profile (mirrors chat.tsx guard)
    if (!sessionRestored || loading) return;
    if (!token) { router.replace("/auth"); return; }

    const profileId = String(profile?.id || (profile as any)?.profile_id || "");
    if (!profileId) { router.replace("/profile"); return; }

    setError(null);
    setSending(true);

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      composed: question,
      ts: Date.now(),
    };
    setMessages(prev => [...prev, userMsg]);

    try {
      const { composed } = await sendChatMessage({ token, profileId, question, lang: userLanguage, context });
      const botMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        composed,
        ts: Date.now(),
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (e: any) {
      if (String(e?.message) === "UNAUTHORIZED") {
        await logout();
        router.replace("/auth");
        return;
      }
      setError(e?.message || "Failed to send");
      const errMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        composed: "❌ Error contacting server.",
        ts: Date.now(),
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setSending(false);
    }
  }, [token, sessionRestored, loading, profile, router, logout, userLanguage]);

  return (
    <ChatContext.Provider value={{ isOpen, open, close, toggle, messages, send, sending, error }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within ChatProvider");
  return ctx;
};
