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

const REACTIONS = ["❤️","🔥","😂","👏","😮","💯"];

function CodeBlock({ children, className }: { children?: React.ReactNode; className?: string }) {
  const [copied, setCopied] = useState(false);
  const codeRef = useRef<HTMLElement>(null);
  const lang = className?.replace("language-", "") ?? "code";
  const langColors: Record<string, string> = {
    python: "#3b82f6", javascript: "#f59e0b", typescript: "#3b82f6",
    rust: "#f97316", go: "#06b6d4", bash: "#10b981", sql: "#8b5cf6",
    html: "#ef4444", css: "#06b6d4", json: "#84cc16",
  };
  const color = langColors[lang.toLowerCase()] ?? "#6b7280";

  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(codeRef.current?.textContent ?? ""); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {}
  };

  return (
    <div className="relative my-3 rounded-xl overflow-hidden border border-zinc-800/90 bg-zinc-950 shadow-lg">
      <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900/80 border-b border-zinc-800/80">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
          <span className="text-[11px] font-mono font-semibold tracking-wider" style={{ color }}>{lang}</span>
        </div>
        <button onClick={handleCopy}
          className="flex items-center gap-1.5 text-[11px] text-zinc-500 hover:text-zinc-200 transition-colors px-2 py-0.5 rounded-md hover:bg-white/10 font-medium">
          {copied ? <><Check className="w-3 h-3 text-emerald-400" />Nusxa!</> : <><Copy className="w-3 h-3" />Nusxa</>}
        </button>
      </div>
      <pre className="!m-0 !border-0 !rounded-none !bg-transparent overflow-x-auto">
        <code ref={codeRef} className={`${className ?? ""} !bg-transparent`} style={{ fontSize: "13px", lineHeight: "1.7" }}>{children}</code>
      </pre>
    </div>
  );
}

function highlightText(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "gi"));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase()
      ? <mark key={i} className="bg-yellow-400/25 text-yellow-100 rounded px-0.5">{part}</mark>
      : part
  );
}

const makeComponents = (searchQuery?: string): Components => ({
  code({ className, children, ...props }) {
    if (className?.startsWith("language-")) return <CodeBlock className={className}>{children}</CodeBlock>;
    return <code className="bg-primary/10 text-primary px-1.5 py-0.5 rounded-md text-[0.84em] font-mono not-italic" {...props}>{children}</code>;
  },
  pre({ children }) { return <>{children}</>; },
  p({ children }) {
    if (searchQuery && typeof children === "string") return <p>{highlightText(children, searchQuery)}</p>;
    return <p>{children}</p>;
  },
  a({ href, children }) {
    return <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors">{children}</a>;
  },
});

function countWords(text: string) { return text.trim().split(/\s+/).filter(Boolean).length; }
function readingMins(words: number) { return Math.max(1, Math.round(words / 200)); }
function formatTime(iso: string) {
  try { return new Date(iso).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" }); } catch { return ""; }
}

export function MessageBubble({ message, isStreaming, isBookmarked, onBookmark, searchQuery }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);
  const [reaction, setReaction] = useState<"up" | "down" | null>(null);
  const [emojiReactions, setEmojiReactions] = useState<string[]>([]);
  const [showReactionPicker, setShowReactionPicker] = useState(false);

  const wordCount = countWords(message.content);
  const isLong = !isUser && wordCount > 80;

  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(message.content); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {}
  };

  const toggleEmoji = (emoji: string) => {
    setEmojiReactions((prev) =>
      prev.includes(emoji) ? prev.filter((e) => e !== emoji) : [...prev, emoji]
    );
    setShowReactionPicker(false);
  };

  return (
    <div className={`flex gap-3 w-full animate-in fade-in slide-in-from-bottom-2 duration-300 group/msg ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar */}
      <div className="flex-shrink-0 pt-0.5">
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-md ${
          isUser
            ? "bg-gradient-to-br from-secondary to-secondary/60 text-foreground/70 ring-1 ring-border"
            : "bg-gradient-to-br from-primary via-primary/90 to-accent text-white shadow-primary/30"
        }`}>
          {isUser ? <User className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
        </div>
      </div>

      <div className={`flex flex-col gap-1 max-w-[85%] min-w-0 ${isUser ? "items-end" : "items-start"}`}>
        {/* Meta row */}
        <div className={`flex items-center gap-2 px-1 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
          <span className="text-[11px] font-semibold text-foreground/55">{isUser ? "Siz" : "O'zbek AI"}</span>
          <span className="text-[10px] text-muted-foreground/40">{formatTime(message.createdAt)}</span>
          {isLong && !isStreaming && (
            <span className="text-[10px] text-muted-foreground/35 hidden sm:inline">
              {wordCount} so'z · {readingMins(wordCount)} min
            </span>
          )}
        </div>

        {/* Bubble */}
        <div className={`relative rounded-2xl leading-relaxed shadow-sm transition-all text-[var(--chat-font-size,15px)] ${
          isUser
            ? "bg-gradient-to-br from-primary to-primary/90 text-white rounded-tr-sm px-4 py-3 shadow-primary/20"
            : "bg-card border border-border/70 text-card-foreground rounded-tl-sm px-4 py-3.5 prose prose-sm dark:prose-invert max-w-none shadow-sm"
        } ${searchQuery && message.content.toLowerCase().includes(searchQuery.toLowerCase()) ? "ring-1 ring-yellow-400/40 ring-offset-1 ring-offset-background" : ""}`}>
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

        {/* Emoji reactions display */}
        {emojiReactions.length > 0 && (
          <div className={`flex gap-1 px-1 flex-wrap ${isUser ? "justify-end" : "justify-start"}`}>
            {emojiReactions.map((e) => (
              <button key={e} onClick={() => toggleEmoji(e)}
                className="reaction-pop text-sm px-2 py-0.5 rounded-full bg-muted border border-border hover:bg-primary/10 hover:border-primary/30 transition-all">
                {e}
              </button>
            ))}
          </div>
        )}

        {/* Action bar */}
        {!isStreaming && (
          <div className={`flex items-center gap-0.5 px-0.5 opacity-0 group-hover/msg:opacity-100 transition-opacity duration-150 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
            {/* Copy */}
            <button onClick={handleCopy} className="p-1.5 rounded-lg hover:bg-muted transition-all text-muted-foreground hover:text-foreground" title="Nusxa olish">
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>

            {/* Bookmark */}
            {onBookmark && (
              <button onClick={onBookmark} className={`p-1.5 rounded-lg hover:bg-muted transition-all ${isBookmarked ? "text-amber-400" : "text-muted-foreground hover:text-amber-400"}`} title="Xatcho'p">
                <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? "fill-amber-400" : ""}`} />
              </button>
            )}

            {/* Emoji reaction picker */}
            <div className="relative">
              <button
                onClick={() => setShowReactionPicker((v) => !v)}
                className="p-1.5 rounded-lg hover:bg-muted transition-all text-muted-foreground hover:text-foreground text-base leading-none"
                title="Reaktsiya"
              >
                <span className="text-[14px]">😊</span>
              </button>
              {showReactionPicker && (
                <div className={`absolute bottom-full mb-1 z-30 flex gap-1 bg-popover border border-border rounded-xl p-1.5 shadow-xl animate-in fade-in zoom-in-95 duration-100 ${isUser ? "right-0" : "left-0"}`}>
                  {REACTIONS.map((e) => (
                    <button key={e} onClick={() => toggleEmoji(e)}
                      className={`w-7 h-7 flex items-center justify-center rounded-lg text-base hover:bg-muted transition-all hover:scale-110 ${emojiReactions.includes(e) ? "bg-primary/15 ring-1 ring-primary/30" : ""}`}>
                      {e}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* AI-only: thumbs */}
            {!isUser && (
              <>
                <button onClick={() => setReaction(reaction === "up" ? null : "up")}
                  className={`p-1.5 rounded-lg hover:bg-muted transition-all ${reaction === "up" ? "text-emerald-500 bg-emerald-500/10" : "text-muted-foreground hover:text-emerald-500"}`} title="Yaxshi javob">
                  <ThumbsUp className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setReaction(reaction === "down" ? null : "down")}
                  className={`p-1.5 rounded-lg hover:bg-muted transition-all ${reaction === "down" ? "text-rose-500 bg-rose-500/10" : "text-muted-foreground hover:text-rose-500"}`} title="Yomon javob">
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
