import { useState, useRef } from "react";
import { OpenaiMessage } from "@workspace/api-client-react";
import { User, Sparkles, Copy, Check, ThumbsUp, ThumbsDown } from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";

interface MessageBubbleProps {
  message: OpenaiMessage;
  isStreaming?: boolean;
}

function CodeBlock({ children, className }: { children?: React.ReactNode; className?: string }) {
  const [copied, setCopied] = useState(false);
  const codeRef = useRef<HTMLElement>(null);
  const lang = className?.replace("language-", "") ?? "code";

  const handleCopy = async () => {
    const text = codeRef.current?.textContent ?? "";
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <div className="relative group/code my-3 rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950">
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900/60 border-b border-zinc-800">
        <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">{lang}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-[11px] text-zinc-400 hover:text-white transition-colors px-2 py-0.5 rounded-md hover:bg-white/10"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          {copied ? "Nusxa olindi" : "Nusxa"}
        </button>
      </div>
      <pre className="!m-0 !border-0 !rounded-none !bg-transparent">
        <code ref={codeRef} className={`${className ?? ""} !bg-transparent`}>
          {children}
        </code>
      </pre>
    </div>
  );
}

const markdownComponents: Components = {
  code({ className, children, ...props }) {
    const isBlock = className?.startsWith("language-");
    if (isBlock) {
      return <CodeBlock className={className}>{children}</CodeBlock>;
    }
    return (
      <code
        className="bg-primary/10 text-primary px-1.5 py-0.5 rounded-md text-[0.85em] font-mono"
        {...props}
      >
        {children}
      </code>
    );
  },
  pre({ children }) {
    return <>{children}</>;
  },
};

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
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
      {/* Avatar */}
      <div className="flex-shrink-0 flex flex-col items-center gap-1">
        <div
          className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-sm ${
            isUser
              ? "bg-secondary/60 text-secondary-foreground"
              : "bg-gradient-to-br from-primary to-accent text-white"
          }`}
        >
          {isUser ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
        </div>
      </div>

      <div className={`flex flex-col gap-1 max-w-[85%] ${isUser ? "items-end" : "items-start"}`}>
        {/* Sender + time */}
        <div className="flex items-center gap-2 px-1 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground/70">
            {isUser ? "Siz" : "O'zbek AI"}
          </span>
          <span className="text-[10px] text-muted-foreground/60">
            {formatTime(message.createdAt)}
          </span>
        </div>

        {/* Bubble */}
        <div
          className={`rounded-2xl text-[14.5px] leading-relaxed shadow-sm ${
            isUser
              ? "bg-primary text-primary-foreground rounded-tr-sm px-4 py-3"
              : "bg-card border border-border text-card-foreground rounded-tl-sm px-5 py-3.5 prose prose-sm dark:prose-invert max-w-none"
          }`}
        >
          {isUser ? (
            <div className="whitespace-pre-wrap break-words">{message.content}</div>
          ) : (
            <div className="break-words">
              <ReactMarkdown components={markdownComponents}>
                {message.content}
              </ReactMarkdown>
              {isStreaming && (
                <span className="inline-flex items-end gap-0.5 ml-1 align-middle h-4">
                  <span className="thinking-dot w-1 h-1 rounded-full bg-primary inline-block" />
                  <span className="thinking-dot w-1 h-1 rounded-full bg-primary inline-block" />
                  <span className="thinking-dot w-1 h-1 rounded-full bg-primary inline-block" />
                </span>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        {!isStreaming && (
          <div
            className={`flex items-center gap-0.5 px-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 ${
              isUser ? "flex-row-reverse" : "flex-row"
            }`}
          >
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              title="Nusxa olish"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
            {!isUser && (
              <>
                <button
                  onClick={() => setReaction(reaction === "up" ? null : "up")}
                  className={`p-1.5 rounded-md hover:bg-muted transition-colors ${
                    reaction === "up" ? "text-emerald-500" : "text-muted-foreground hover:text-foreground"
                  }`}
                  title="Yaxshi javob"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setReaction(reaction === "down" ? null : "down")}
                  className={`p-1.5 rounded-md hover:bg-muted transition-colors ${
                    reaction === "down" ? "text-destructive" : "text-muted-foreground hover:text-foreground"
                  }`}
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
