"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function MessageThreadSync({ conversationId, latestMessageId }: { conversationId: string; latestMessageId?: string }) {
  const router = useRouter();

  useEffect(() => {
    const thread = document.getElementById("message-thread");
    thread?.scrollTo({ behavior: "auto", top: thread.scrollHeight });
  }, [conversationId, latestMessageId]);

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    const timer = window.setInterval(refresh, 8_000);
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [conversationId, router]);

  return null;
}
