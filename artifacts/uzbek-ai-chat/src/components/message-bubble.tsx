import { useState, useRef } from "react";
import { OpenaiMessage } from "@workspace/api-client-react";
import { User, Sparkles, Copy, Check, ThumbsUp, ThumbsDown, Bookmark } from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";

interface MessageBubbleProps {
  message: OpenaiMessage;
  isStreaming?: boolean;
  isBookmarked?: boolean;
  onBookmark?: () => void;
  searchQuery?: string;
}

function CodeBlock({ children, className }: { children?: React.ReactNode; className?: string }) {
  const [copied, setCopied] = useState(false);
  const codeRef = useRef<HTMLElement>(null);
  const lang = className?.replace("language-", "") ?? "code";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codeRef.current?.textContent ?? "");
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <div className="relative my-3 rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950">
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900/70 border-b border-zinc-800">
        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">{lang}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-[11px] text-zinc-500 hover:text-zinc-200 transition-colors px-2 py-0.5 rounded hover:bg-white/10"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          {copied ? "Nusxa olindi!" : "Nusxa"}
        </button>
      </div>
      <pre className="!m-0 !border-0 !rounded-none !bg-transparent overflow-x-auto">
        <code ref={codeRef} className={`${className ?? ""} !bg-transparent text-sm`}>{children}</code>
      </pre>
    </div>
  );
}

function highlightText(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase()
      ? <mark key={i} className="bg-yellow-400/30 text-yellow-200 rounded px-0.5">{part}</mark>
      : part
  );
}

const makeComponents = (searchQuery?: string): Components => ({
  code({ className, children, ...props }) {
    if (className?.startsWith("language-")) {
      return <CodeBlock className={className}>{children}</CodeBlock>;
    }
    return <code className="bg-primary/10 text-primary px-1.5 py-0.5 rounded-md text-[0.85em] font-mono" {...props}>{children}</code>;
  },
  pre({ children }) { return <>{children}</>; },
  p({ children }) {
    if (searchQuery && typeof children === "string") {
      return <p>{highlightText(children, searchQuery)}</p>;
    }
    return <p>{children}</p>;
  },
});

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function readingTime(words: number): string {
  const mins = Math.max(1, Math.round(words / 200));
  return `~${mins} min`;
}

function formatTime(iso: string) {
  try { return new Date(iso).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" }); }
  catch { return ""; }
}

export function MessageBubble({ message, isStreaming, isBookmarked, onBookmark, searchQuery }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);
  const [reaction, setReaction] = useState<"up" | "down" | null>(null);

  const wordCount = countWords(message.content);
  const isLong = !isUser && wordCount > 80;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <div className={`flex gap-3 w-full animate-in fade-in slide-in-from-bottom-2 duration-300 group ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar */}
      <div className="flex-shrink-0">
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-sm ${isUser ? "bg-secondary/50 text-foreground/70" : "bg-gradient-to-br from-primary to-accent text-white"}`}>
          {isUser ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
        </div>
      </div>

      <div className={`flex flex-col gap-1 max-w-[86%] ${isUser ? "items-end" : "items-start"}`}>
        {/* Meta */}
        <div className={`flex items-center gap-2 px-1 text-[11px] text-muted-foreground ${isUser ? "flex-row-reverse" : "flex-row"}`}>
          <span className="font-semibold text-foreground/60">{isUser ? "Siz" : "O'zbek AI"}</span>
          <span className="text-muted-foreground/50">{formatTime(message.createdAt)}</span>
          {isLong && !isStreaming && (
            <span className="text-muted-foreground/40">{wordCount} so'z · {readingTime(wordCount)} o'qish</span>
          )}
        </div>

        {/* Bubble */}
        <div className={`rounded-2xl text-[var(--chat-font-size,15px)] leading-relaxed shadow-sm transition-all ${
          isUser
            ? "bg-primary text-primary-foreground rounded-tr-sm px-4 py-3"
            : "bg-card border border-border text-card-foreground rounded-tl-sm px-5 py-3.5 prose prose-sm dark:prose-invert max-w-none"
        } ${searchQuery && message.content.toLowerCase().includes(searchQuery.toLowerCase()) ? "ring-1 ring-yellow-400/40" : ""}`}>
          {isUser ? (
            <div className="whitespace-pre-wrap break-words">
              {searchQuery ? highlightText(message.content, searchQuery) : message.content}
            </div>
          ) : (
            <div className="break-words">
              <ReactMarkdown components={makeComponents(searchQuery)}>
                {message.content}
              </ReactMarkdown>
              {isStreaming && (
                <span className="inline-flex items-end gap-0.5 ml-1 align-middle h-4">
                  <span className="thinking-dot w-1.5 h-1.5 rounded-full bg-primary inline-block" />
                  <span className="thinking-dot w-1.5 h-1.5 rounded-full bg-primary inline-block" />
                  <span className="thinking-dot w-1.5 h-1.5 rounded-full bg-primary inline-block" />
                </span>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        {!isStreaming && (
          <div className={`flex items-center gap-0.5 px-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
            <button onClick={handleCopy} className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground" title="Nusxa">
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            {onBookmark && (
              <button onClick={onBookmark} className={`p-1.5 rounded-md hover:bg-muted transition-colors ${isBookmarked ? "text-primary" : "text-muted-foreground hover:text-foreground"}`} title="Xatcho'p">
                <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? "fill-primary" : ""}`} />
              </button>
            )}
            {!isUser && (
              <>
                <button onClick={() => setReaction(reaction === "up" ? null : "up")} className={`p-1.5 rounded-md hover:bg-muted transition-colors ${reaction === "up" ? "text-emerald-500" : "text-muted-foreground hover:text-foreground"}`} title="Yaxshi">
                  <ThumbsUp className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setReaction(reaction === "down" ? null : "down")} className={`p-1.5 rounded-md hover:bg-muted transition-colors ${reaction === "down" ? "text-destructive" : "text-muted-foreground hover:text-foreground"}`} title="Yomon">
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
