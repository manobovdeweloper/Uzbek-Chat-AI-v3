import { useState, useCallback, useRef } from "react";
import { OpenaiMessage } from "@workspace/api-client-react";

interface UseChatStreamOptions {
  conversationId: number;
  onFinished?: () => void;
  tier?: "free" | "premium";
}

export function useChatStream({ conversationId, onFinished, tier }: UseChatStreamOptions) {
  const [streamingMessage, setStreamingMessage] = useState<string>("");
  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!conversationId) return;

      setIsStreaming(true);
      setStreamingMessage("");

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      try {
        const response = await fetch(`/api/openai/conversations/${conversationId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content, tier: tier ?? "free" }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.body) throw new Error("No response body");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ") && line.length > 6) {
              const dataStr = line.substring(6).trim();
              if (!dataStr || dataStr === "[DONE]") continue;

              try {
                const data = JSON.parse(dataStr);
                if (data.content) {
                  setStreamingMessage((prev) => prev + data.content);
                }
                if (data.done) {
                  break;
                }
              } catch (e) {
                console.error("Failed to parse chunk:", dataStr);
              }
            }
          }
        }
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          console.error("Stream error:", error);
        }
      } finally {
        setIsStreaming(false);
        if (onFinished) {
          onFinished();
        }
      }
    },
    [conversationId, onFinished, tier]
  );

  return {
    sendMessage,
    streamingMessage,
    isStreaming,
  };
}
