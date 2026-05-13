import { useState } from "react";
import { OpenaiMessage } from "@workspace/api-client-react";
import { User, Sparkles, Copy, Check, ThumbsUp, ThumbsDown } from "lucide-react";
import ReactMarkdown from 'react-markdown';

interface MessageBubbleProps {
  message: OpenaiMessage;
  isStreaming?: boolean;
}

export function MessageBubble({ message, isStreaming }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);
  const [reaction, setReaction] = useState<"up" | "down" | null>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <div
      className={`flex gap-3 w-full animate-in fade-in slide-in-from-bottom-2 duration-300 group ${
        isUser ? "flex-row-reverse" : "flex-row"
      }`}
    >
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${
          isUser
            ? "bg-secondary text-secondary-foreground"
            : "bg-primary text-primary-foreground"
        }`}
      >
        {isUser ? (
          <User className="w-4 h-4" />
        ) : (
          <Sparkles className="w-4 h-4" />
        )}
      </div>

      <div
        className={`flex flex-col gap-1 max-w-[85%] ${
          isUser ? "items-end" : "items-start"
        }`}
      >
        <div className="flex items-center gap-2 px-1 text-xs text-muted-foreground">
          <span className="font-medium">
            {isUser ? "Siz" : "O'zbek AI"}
          </span>
        </div>

        <div
          className={`px-5 py-3.5 rounded-2xl text-[15px] leading-relaxed shadow-sm ${
            isUser
              ? "bg-secondary text-secondary-foreground rounded-tr-sm"
              : "bg-card border border-border text-card-foreground rounded-tl-sm prose prose-sm prose-primary dark:prose-invert max-w-none"
          }`}
        >
          {isUser ? (
            <div className="whitespace-pre-wrap break-words">
              {message.content}
            </div>
          ) : (
            <div className="break-words">
              <ReactMarkdown>{message.content}</ReactMarkdown>
              {isStreaming && (
                <span className="inline-block w-1.5 h-4 ml-1 align-middle bg-primary animate-pulse" />
              )}
            </div>
          )}
        </div>

        {/* Action buttons — visible on hover or touch */}
        {!isStreaming && (
          <div className={`flex items-center gap-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              title="Nusxa olish"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            {!isUser && (
              <>
                <button
                  onClick={() => setReaction(reaction === "up" ? null : "up")}
                  className={`p-1.5 rounded-md hover:bg-muted transition-colors ${reaction === "up" ? "text-green-600" : "text-muted-foreground hover:text-foreground"}`}
                  title="Yaxshi javob"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setReaction(reaction === "down" ? null : "down")}
                  className={`p-1.5 rounded-md hover:bg-muted transition-colors ${reaction === "down" ? "text-destructive" : "text-muted-foreground hover:text-foreground"}`}
                  title="Yomon javob"
                >
                  <ThumbsDown className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
