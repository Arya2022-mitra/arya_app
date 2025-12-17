"use client";
import React from "react";
import { useRouter } from "next/router";
import ChatPanel from "./ChatPanel";

interface ChatGuardProps {
  isSidebarOpen?: boolean;
}

// export hidden route list used by _app.tsx
export const CHAT_GUARD_HIDDEN_ROUTES = ["/login", "/signup", "/auth", "/otp", "/profile", "/process_profile"];

export default function ChatGuard({ isSidebarOpen = false }: ChatGuardProps) {
  const router = useRouter();
  const pathname = router?.pathname ?? "";
  const hiddenRoute = CHAT_GUARD_HIDDEN_ROUTES.some((p) => pathname.startsWith(p));
  if (hiddenRoute) return null;

  const onChatPage = pathname.startsWith("/chat");
  if (onChatPage) return null;

  // ChatDock has been removed - only show ChatPanel
  return (
    <>
      <ChatPanel />
    </>
  );
}

