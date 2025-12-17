import { getApiUrl } from "@/lib/api";
import type { ReactNode } from "react";

export type ChatReply = {
  composed: string | ReactNode;
};

export type ChatContext = {
  [key: string]: unknown;
};

export async function sendChatMessage(opts: {
  token: string | null;
  profileId: string;
  question: string;
  lang?: string | null;
  context?: ChatContext | null;
}): Promise<ChatReply> {
  const { token, profileId, question, lang, context } = opts;

  const res = await fetch(getApiUrl('/chat'), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ 
      profile_id: profileId, 
      question,
      ...(lang ? { lang } : {}),
      ...(context ? { context } : {}),
    }),
    credentials: "include",
  });

  if (res.status === 401) {
    throw new Error("UNAUTHORIZED");
  }

  const json = await res.json();
  const rawComposed = json?.composed;
  const composed =
    typeof rawComposed === "string" && rawComposed.trim()
      ? rawComposed
      : "No GPT response available.";

  return { composed };
}
