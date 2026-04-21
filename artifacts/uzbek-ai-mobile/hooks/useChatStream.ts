import { useCallback, useRef, useState } from "react";
import { fetch as expoFetch } from "expo/fetch";

const BASE_URL = `https://${process.env.EXPO_PUBLIC_DOMAIN}`;

export type ChatMessage = {
  id: string | number;
  role: "user" | "assistant";
  content: string;
};

export function useChatStream(conversationId: number | null, tier: "free" | "premium" = "free") {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = useState("");
  const [isSending, setIsSending] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const reset = useCallback((initial: ChatMessage[] = []) => {
    setMessages(initial);
    setStreaming("");
    setIsSending(false);
  }, []);

  const send = useCallback(
    async (content: string, convId?: number | null) => {
      const targetId = convId ?? conversationId;
      if (!targetId || !content.trim()) return;

      const userMsg: ChatMessage = {
        id: `u-${Date.now()}`,
        role: "user",
        content: content.trim(),
      };
      setMessages((m) => [...m, userMsg]);
      setIsSending(true);
      setStreaming("");

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await expoFetch(
          `${BASE_URL}/api/openai/conversations/${targetId}/messages`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: content.trim(), tier }),
            signal: controller.signal,
          },
        );

        if (!res.ok || !res.body) {
          throw new Error(`HTTP ${res.status}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let full = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data:")) continue;
            const data = line.slice(5).trim();
            if (!data || data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                full += parsed.content;
                setStreaming(full);
              }
            } catch {
              // ignore
            }
          }
        }

        setMessages((m) => [
          ...m,
          {
            id: `a-${Date.now()}`,
            role: "assistant",
            content: full,
          },
        ]);
        setStreaming("");
      } catch (err) {
        setMessages((m) => [
          ...m,
          {
            id: `a-${Date.now()}`,
            role: "assistant",
            content: "Kechirasiz, xatolik yuz berdi. Iltimos, qayta urinib ko'ring.",
          },
        ]);
        setStreaming("");
      } finally {
        setIsSending(false);
        abortRef.current = null;
      }
    },
    [conversationId, tier],
  );

  return { messages, setMessages, streaming, isSending, send, reset };
}
