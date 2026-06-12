import { useState, useRef } from "react";
import { OpenaiMessage } from "@workspace/api-client-react";
import { User, Sparkles, Copy, Check, ThumbsUp, ThumbsDown, Bookmark, ChevronDown, ChevronUp, ZoomIn } from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import { clockTime, relativeTime } from "@/hooks/use-relative-time";

interface MessageBubbleProps {
  message: OpenaiMessage;
  isStreaming?: boolean;
  isBookmarked?: boolean;
  onBookmark?: () => void;
  searchQuery?: string;
  onCopy?: (text: string) => void;
}

const REACTIONS = ["❤️","🔥","😂","👏","😮","💯","🙏","👀"];
const LANG_COLORS: Record<string, string> = {
  python: "#3b82f6", javascript: "#f59e0b", typescript: "#60a5fa",
  rust: "#f97316", go: "#06b6d4", bash: "#10b981", shell: "#10b981",
  sql: "#8b5cf6", html: "#ef4444", css: "#06b6d4", json: "#84cc16",
  java: "#f97316", cpp: "#6366f1", c: "#6366f1", php: "#a78bfa",
};

function CodeBlock({ children, className }: { children?: React.ReactNode; className?: string }) {
  const [copied, setCopied] = useState(false);
  const codeRef = useRef<HTMLElement>(null);
  const lang = className?.replace("language-", "") ?? "code";
  const color = LANG_COLORS[lang.toLowerCase()] ?? "#6b7280";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codeRef.current?.textContent ?? "");
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <div className="relative my-3 rounded-xl overflow-hidden shadow-lg" style={{ border: "1px solid hsl(220 20% 18%)" }}>
      <div className="flex items-center justify-between px-4 py-2.5" style={{ background: "hsl(220 28% 10%)", borderBottom: "1px solid hsl(220 20% 18%)" }}>
        <div className="flex items-center gap-2.5">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
          </div>
          <span className="text-[11px] font-semibold font-mono tracking-wider" style={{ color }}>{lang}</span>
        </div>
        <button onClick={handleCopy}
          className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-lg transition-all font-medium"
          style={{ color: copied ? "#34d399" : "#9ca3af", background: copied ? "rgb(52 211 153 / 0.1)" : "transparent" }}>
          {copied ? <><Check className="w-3 h-3" />Nusxa!</> : <><Copy className="w-3 h-3" />Nusxa</>}
        </button>
      </div>
      <pre className="!m-0 !border-0 !rounded-none overflow-x-auto" style={{ background: "transparent" }}>
        <code ref={codeRef} className={className ?? ""} style={{ background: "transparent", fontSize: "13px", lineHeight: "1.7", padding: "1rem", display: "block" }}>{children}</code>
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
      ? <mark key={i} className="bg-yellow-400/25 text-yellow-100 rounded-sm px-0.5">{part}</mark>
      : part
  );
}

const makeComponents = (searchQuery?: string): Components => ({
  code({ className, children, ...props }) {
    if (className?.startsWith("language-")) return <CodeBlock className={className}>{children}</CodeBlock>;
    return <code {...props}>{children}</code>;
  },
  pre({ children }) { return <>{children}</>; },
  p({ children }) {
    if (searchQuery && typeof children === "string") return <p>{highlightText(children, searchQuery)}</p>;
    return <p>{children}</p>;
  },
  a({ href, children }) {
    return <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>;
  },
  img({ src, alt }) {
    return (
      <img src={src} alt={alt ?? ""} className="rounded-xl max-w-full my-2 border border-border shadow-md" />
    );
  },
});

function countWords(text: string) { return text.trim().split(/\s+/).filter(Boolean).length; }

const COLLAPSE_LIMIT = 6;

/** Parse __IMG__...dataUrl...__ENDIMG__text format */
function parseContent(raw: string): { imageUrl: string | null; text: string } {
  const m = raw.match(/^__IMG__([\s\S]*?)__ENDIMG__([\s\S]*)$/);
  if (m) return { imageUrl: m[1], text: m[2] };
  return { imageUrl: null, text: raw };
}

export function MessageBubble({ message, isStreaming, isBookmarked, onBookmark, searchQuery, onCopy }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);
  const [reaction, setReaction] = useState<"up" | "down" | null>(null);
  const [emojiReactions, setEmojiReactions] = useState<string[]>([]);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showExactTime, setShowExactTime] = useState(false);
  const [imgZoomed, setImgZoomed] = useState(false);

  const { imageUrl, text: displayText } = parseContent(message.content);

  const wordCount = countWords(displayText);
  const isLong = !isUser && wordCount > 120;
  const lineCount = displayText.split("\n").length;
  const isCollapsible = !isStreaming && (isLong || lineCount > COLLAPSE_LIMIT);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(displayText);
      setCopied(true);
      onCopy?.("Nusxa olindi!");
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  const toggleEmoji = (emoji: string) => {
    setEmojiReactions((prev) => prev.includes(emoji) ? prev.filter((e) => e !== emoji) : [...prev, emoji]);
    setShowReactionPicker(false);
  };

  return (
    <div className={`flex gap-2 md:gap-3 w-full group/msg ${isUser ? "flex-row-reverse" : "flex-row"}`}
      style={{ animation: "fadeSlideIn 0.28s ease-out forwards" }}>

      {/* Avatar */}
      <div className="flex-shrink-0 pt-0.5">
        <div className={`w-7 h-7 md:w-8 md:h-8 rounded-xl flex items-center justify-center shadow-md ${
          isUser
            ? "bg-gradient-to-br from-secondary/80 to-secondary/50 text-foreground/60 ring-1 ring-border"
            : "bg-gradient-to-br from-primary to-accent text-white shadow-primary/25 glow-sm"
        }`}>
          {isUser ? <User className="w-3 h-3 md:w-3.5 md:h-3.5" /> : <Sparkles className="w-3 h-3 md:w-3.5 md:h-3.5" />}
        </div>
      </div>

      <div className={`flex flex-col gap-1.5 max-w-[88%] md:max-w-[84%] min-w-0 ${isUser ? "items-end" : "items-start"}`}>
        {/* Meta */}
        <div className={`flex items-center gap-2 px-1 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
          <span className="text-[11px] font-semibold text-foreground/50">{isUser ? "Siz" : "O'zbek AI"}</span>
          <button
            className="text-[10px] text-muted-foreground/38 hover:text-muted-foreground/60 transition-colors"
            onMouseEnter={() => setShowExactTime(true)}
            onMouseLeave={() => setShowExactTime(false)}
            title={clockTime(message.createdAt)}>
            {showExactTime ? clockTime(message.createdAt) : relativeTime(message.createdAt)}
          </button>
          {isLong && !isStreaming && (
            <span className="text-[10px] text-muted-foreground/30 hidden sm:inline">· {wordCount} so'z</span>
          )}
        </div>

        {/* Bubble */}
        <div className={`relative rounded-2xl leading-relaxed shadow-sm text-[var(--chat-font-size,15px)] ${
          isUser
            ? "bg-gradient-to-br from-primary to-primary/85 text-white rounded-tr-sm px-3.5 py-2.5 md:px-4 md:py-3 shadow-primary/20"
            : "bg-card border border-border/60 border-l-[3px] border-l-primary/35 text-card-foreground rounded-tl-sm px-3.5 py-3 md:px-4 md:py-3.5 prose prose-sm dark:prose-invert max-w-none"
        } ${searchQuery && message.content.toLowerCase().includes(searchQuery.toLowerCase()) ? "ring-2 ring-yellow-400/40" : ""}`}>

          {/* Image attachment */}
          {imageUrl && (
            <div className="mb-2">
              <div className="relative inline-block cursor-pointer group/img" onClick={() => setImgZoomed(true)}>
                <img
                  src={imageUrl}
                  alt="Yuborilgan rasm"
                  className="max-w-[240px] md:max-w-[280px] rounded-xl border border-white/20 shadow-md block"
                  style={{ maxHeight: "200px", objectFit: "cover" }}
                />
                <div className="absolute inset-0 rounded-xl bg-black/0 group-hover/img:bg-black/20 transition-all flex items-center justify-center">
                  <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover/img:opacity-100 transition-all" />
                </div>
              </div>
            </div>
          )}

          {/* Collapsible text */}
          <div className={isCollapsible && !expanded ? "overflow-hidden fade-bottom" : ""}
            style={{ maxHeight: isCollapsible && !expanded ? "160px" : "none" }}>
            {isUser ? (
              <div className="whitespace-pre-wrap break-words">
                {displayText && (searchQuery ? highlightText(displayText, searchQuery) : displayText)}
              </div>
            ) : (
              <div className="break-words">
                <ReactMarkdown components={makeComponents(searchQuery)}>
                  {displayText}
                </ReactMarkdown>
                {isStreaming && (
                  <span className="inline-block w-[2px] h-[1.1em] bg-primary/80 ml-0.5 align-middle rounded-sm cursor-blink" />
                )}
              </div>
            )}
          </div>

          {isCollapsible && (
            <button onClick={() => setExpanded(!expanded)}
              className={`flex items-center gap-1 text-[11px] font-medium mt-2 transition-colors ${isUser ? "text-white/70 hover:text-white" : "text-primary/70 hover:text-primary"}`}>
              {expanded ? <><ChevronUp className="w-3.5 h-3.5" />Yig'ish</> : <><ChevronDown className="w-3.5 h-3.5" />Ko'proq ko'rish ({wordCount} so'z)</>}
            </button>
          )}
        </div>

        {/* Emoji reactions */}
        {emojiReactions.length > 0 && (
          <div className={`flex gap-1 px-1 flex-wrap ${isUser ? "justify-end" : "justify-start"}`}>
            {emojiReactions.map((e) => (
              <button key={e} onClick={() => toggleEmoji(e)}
                className="reaction-pop text-sm px-2 py-0.5 rounded-full bg-muted border border-border hover:bg-primary/10 transition-all">
                {e}
              </button>
            ))}
          </div>
        )}

        {/* Actions */}
        {!isStreaming && (
          <div className={`flex items-center gap-0.5 px-0.5 opacity-0 group-hover/msg:opacity-100 transition-opacity duration-150 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
            <button onClick={handleCopy} className="p-1.5 rounded-lg hover:bg-muted transition-all text-muted-foreground hover:text-foreground min-h-[32px] min-w-[32px] flex items-center justify-center" title="Nusxa">
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            {onBookmark && (
              <button onClick={onBookmark} className={`p-1.5 rounded-lg hover:bg-muted transition-all min-h-[32px] min-w-[32px] flex items-center justify-center ${isBookmarked ? "text-amber-400 bg-amber-400/10" : "text-muted-foreground hover:text-amber-400"}`} title="Xatcho'p">
                <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? "fill-amber-400" : ""}`} />
              </button>
            )}
            <div className="relative">
              <button onClick={() => setShowReactionPicker((v) => !v)}
                className="p-1.5 rounded-lg hover:bg-muted transition-all text-muted-foreground hover:text-foreground min-h-[32px] min-w-[32px] flex items-center justify-center" title="Reaktsiya">
                <span className="text-[14px] leading-none">😊</span>
              </button>
              {showReactionPicker && (
                <div className={`absolute bottom-full mb-1.5 z-40 flex gap-1 bg-popover border border-border rounded-2xl p-2 shadow-2xl animate-in fade-in zoom-in-95 duration-100 ${isUser ? "right-0" : "left-0"}`}>
                  {REACTIONS.map((e) => (
                    <button key={e} onClick={() => toggleEmoji(e)}
                      className={`w-8 h-8 flex items-center justify-center rounded-xl text-base hover:bg-muted transition-all active:scale-95 ${emojiReactions.includes(e) ? "bg-primary/15 ring-1 ring-primary/30" : ""}`}>
                      {e}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {!isUser && (
              <>
                <button onClick={() => setReaction(reaction === "up" ? null : "up")}
                  className={`p-1.5 rounded-lg hover:bg-muted transition-all min-h-[32px] min-w-[32px] flex items-center justify-center ${reaction === "up" ? "text-emerald-500 bg-emerald-500/10" : "text-muted-foreground hover:text-emerald-500"}`} title="Yaxshi">
                  <ThumbsUp className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setReaction(reaction === "down" ? null : "down")}
                  className={`p-1.5 rounded-lg hover:bg-muted transition-all min-h-[32px] min-w-[32px] flex items-center justify-center ${reaction === "down" ? "text-rose-500 bg-rose-500/10" : "text-muted-foreground hover:text-rose-500"}`} title="Yomon">
                  <ThumbsDown className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Image zoom modal */}
      {imgZoomed && imageUrl && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setImgZoomed(false)}>
          <img src={imageUrl} alt="Katta ko'rinish" className="max-w-full max-h-full rounded-2xl shadow-2xl" onClick={(e) => e.stopPropagation()} />
          <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all" onClick={() => setImgZoomed(false)}>
            ✕
          </button>
        </div>
      )}

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
