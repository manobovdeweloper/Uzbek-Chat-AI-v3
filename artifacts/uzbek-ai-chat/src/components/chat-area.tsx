import {
  SendHorizontal, Loader2, Menu, X, RefreshCw, Sparkles,
  ChevronDown, Download, Keyboard, Search, AArrowDown, AArrowUp,
  StopCircle, MessageSquare, Zap, Eraser,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { OpenaiMessage } from "@workspace/api-client-react";
import { useEffect, useRef, useState, KeyboardEvent, useCallback } from "react";
import { MessageBubble } from "./message-bubble";
import { EmojiPicker } from "./emoji-picker";
import { useFontSize } from "@/hooks/use-font-size";
import type { BookmarkedMessage } from "@/hooks/use-bookmarks";

interface ChatAreaProps {
  messages: OpenaiMessage[];
  streamingMessage: string;
  isStreaming: boolean;
  onSendMessage: (content: string) => void;
  onStopStreaming?: () => void;
  onClearMessages?: () => void;
  isLoading?: boolean;
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  conversationTitle?: string;
  conversationId?: number | null;
  isBookmarked: (id: number) => boolean;
  onToggleBookmark: (msg: BookmarkedMessage) => void;
  onDraftChange?: (draft: string) => void;
  initialDraft?: string;
}

const QUICK_PROMPTS = [
  { icon: "✍️", label: "Matn", prompt: "Menga qisqa motivatsion xat yozib bering." },
  { icon: "🧠", label: "Tushuntir", prompt: "Sun'iy intellekt nima va u qanday ishlaydi? Oddiy tilda." },
  { icon: "💡", label: "G'oya", prompt: "O'zbekiston uchun 5 ta innovatsion biznes g'oyasini ayting." },
  { icon: "🌍", label: "Tarjima", prompt: "Bu jumlani ingliz tiliga tarjima qiling: 'Bilim — kuch.'" },
  { icon: "📝", label: "Rezyume", prompt: "Dasturchi uchun professional rezyume namunasi yozing." },
  { icon: "🎯", label: "Maslahat", prompt: "Ingliz tilini tez o'rganish uchun eng yaxshi maslahatlar?" },
  { icon: "📖", label: "Hikoya", prompt: "O'zbek udumi haqida qisqa va ta'sirchan hikoya yoz." },
  { icon: "🔢", label: "Matematika", prompt: "Integralni hisoblash usullarini tushuntir: ∫x²dx" },
  { icon: "🖥️", label: "Kod", prompt: "Python da Fibonacci ketma-ketligini hisoblovchi funksiya yoz." },
  { icon: "📊", label: "Tahlil", prompt: "O'zbekiston iqtisodiyotining so'nggi tendentsiyalarini tahlil qil." },
  { icon: "🎨", label: "She'r", prompt: "Bahor haqida o'zbekcha she'r yoz." },
  { icon: "⚖️", label: "Solishtir", prompt: "Python va JavaScript o'rtasidagi asosiy farqlarni solishtir." },
];

const SMART_REPLIES = [
  "Ko'proq tushuntir", "Misol keltir", "Boshqacha usul bormi?",
  "Qisqaroq qil", "Davom et", "O'zbekcha yoz",
];

export function ChatArea({
  messages, streamingMessage, isStreaming, onSendMessage, onStopStreaming,
  onClearMessages, isLoading, onToggleSidebar, isSidebarOpen, conversationTitle,
  isBookmarked, onToggleBookmark, onDraftChange, initialDraft = "",
}: ChatAreaProps) {
  const [input, setInput] = useState(initialDraft);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const { size: fontSize, increase: increaseFont, decrease: decreaseFont } = useFontSize();
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, streamingMessage, scrollToBottom]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const fn = () => setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 200);
    el.addEventListener("scroll", fn, { passive: true });
    return () => el.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    if (searchOpen) setTimeout(() => searchRef.current?.focus(), 50);
  }, [searchOpen]);

  useEffect(() => {
    const handler = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape" && searchOpen) { setSearchOpen(false); setSearchQuery(""); }
      if ((e.ctrlKey || e.metaKey) && e.key === "f" && messages.length > 0) { e.preventDefault(); setSearchOpen(true); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [searchOpen, messages.length]);

  const handleSend = (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || isStreaming) return;
    onSendMessage(content);
    setInput(""); onDraftChange?.("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value; setInput(v); onDraftChange?.(v);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
  };

  const handleEmojiSelect = (emoji: string) => {
    const el = textareaRef.current;
    if (!el) { setInput((p) => p + emoji); return; }
    const start = el.selectionStart ?? input.length;
    const end = el.selectionEnd ?? input.length;
    const next = input.slice(0, start) + emoji + input.slice(end);
    setInput(next); onDraftChange?.(next);
    setTimeout(() => { el.focus(); el.setSelectionRange(start + emoji.length, start + emoji.length); }, 0);
  };

  const handleExport = () => {
    if (!messages.length) return;
    const txt = messages.map((m) => `[${new Date(m.createdAt).toLocaleString("uz-UZ")}] ${m.role === "user" ? "Siz" : "O'zbek AI"}:\n${m.content}`).join("\n\n");
    const blob = new Blob([`O'zbek AI — ${conversationTitle ?? "Suhbat"}\n${"═".repeat(50)}\n\n${txt}`], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `uzbek-ai-${Date.now()}.txt`; a.click();
  };

  const filteredMsgs = searchQuery.trim()
    ? messages.filter((m) => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages;
  const matchCount = searchQuery.trim() ? filteredMsgs.length : 0;

  const lastAiMsg = [...messages].reverse().find((m) => m.role === "assistant");
  const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
  const totalWords = messages.reduce((s, m) => s + m.content.trim().split(/\s+/).filter(Boolean).length, 0);

  return (
    <div className="flex-1 flex flex-col h-full bg-background relative overflow-hidden min-w-0">

      {/* ── TOP BAR ── */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-background/80 backdrop-blur-xl flex-shrink-0">
        <Button variant="ghost" size="icon" onClick={onToggleSidebar}
          className="shrink-0 md:hidden h-8 w-8" data-testid="button-toggle-sidebar">
          {isSidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </Button>

        {/* Title / search inline */}
        {searchOpen ? (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50" />
              <input ref={searchRef} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Xabarlarda qidirish..." onKeyDown={(e) => e.key === "Escape" && (setSearchOpen(false), setSearchQuery(""))}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-muted border border-border rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 transition-all" />
            </div>
            {searchQuery && <span className="text-[10px] text-muted-foreground whitespace-nowrap">{matchCount} ta</span>}
            <button onClick={() => { setSearchOpen(false); setSearchQuery(""); }} className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="hidden md:flex w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-accent items-center justify-center flex-shrink-0 shadow-sm shadow-primary/25">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-foreground truncate">{conversationTitle ?? "O'zbek AI"}</span>
                {messages.length > 0 && (
                  <span className="hidden md:flex items-center gap-1 text-[10px] text-muted-foreground/40 flex-shrink-0">
                    <MessageSquare className="w-2.5 h-2.5" />{messages.length}
                    {totalWords > 0 && <><span>·</span><Zap className="w-2.5 h-2.5" />{totalWords} so'z</>}
                  </span>
                )}
              </div>
              {isStreaming && (
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                  <span className="text-[10px] text-emerald-500 font-medium">Javob yozilmoqda...</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action icons */}
        {!searchOpen && (
          <div className="flex items-center gap-0.5 flex-shrink-0">
            {messages.length > 0 && (
              <Button variant="ghost" size="icon" onClick={() => setSearchOpen(true)}
                className="h-8 w-8 text-muted-foreground hover:text-foreground" title="Qidirish (Ctrl+F)">
                <Search className="w-4 h-4" />
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={decreaseFont} className="h-8 w-8 text-muted-foreground hover:text-foreground hidden md:flex" title="Shrift−">
              <AArrowDown className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={increaseFont} className="h-8 w-8 text-muted-foreground hover:text-foreground hidden md:flex" title="Shrift+">
              <AArrowUp className="w-4 h-4" />
            </Button>
            {messages.length > 0 && (
              <>
                <Button variant="ghost" size="icon" onClick={handleExport} className="h-8 w-8 text-muted-foreground hover:text-foreground" title="Yuklab olish">
                  <Download className="w-4 h-4" />
                </Button>
                {onClearMessages && (
                  <div className="relative">
                    <Button variant="ghost" size="icon" onClick={() => setShowClearConfirm((v) => !v)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive" title="Tozalash">
                      <Eraser className="w-4 h-4" />
                    </Button>
                    {showClearConfirm && (
                      <div className="absolute top-full right-0 mt-1 z-50 bg-popover border border-border rounded-xl shadow-xl p-3 w-52 animate-in fade-in zoom-in-95">
                        <p className="text-xs text-foreground mb-2 font-medium">Barcha xabarlarni o'chirasizmi?</p>
                        <div className="flex gap-2">
                          <button onClick={() => { onClearMessages(); setShowClearConfirm(false); }}
                            className="flex-1 py-1 text-xs bg-destructive text-white rounded-lg hover:bg-destructive/90 transition-all font-semibold">O'chir</button>
                          <button onClick={() => setShowClearConfirm(false)}
                            className="flex-1 py-1 text-xs bg-muted rounded-lg hover:bg-muted/80 transition-all text-foreground/70">Bekor</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
            <Button variant="ghost" size="icon" onClick={() => setShowShortcuts((v) => !v)}
              className="h-8 w-8 text-muted-foreground hover:text-foreground hidden md:flex" title="Yorliqlar">
              <Keyboard className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Shortcuts popup */}
      {showShortcuts && (
        <div className="absolute top-14 right-3 z-50 bg-popover border border-border rounded-2xl shadow-2xl p-4 w-56 animate-in fade-in zoom-in-95 slide-in-from-top-2">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-foreground">Klaviatura yorliqlari</span>
            <button onClick={() => setShowShortcuts(false)} className="text-muted-foreground hover:text-foreground"><X className="w-3.5 h-3.5" /></button>
          </div>
          {[
            { keys: ["Enter"], desc: "Xabar yuborish" },
            { keys: ["Shift", "Enter"], desc: "Yangi qator" },
            { keys: ["Ctrl", "F"], desc: "Qidirish" },
            { keys: ["Esc"], desc: "Qidiruvni yopish" },
          ].map((s) => (
            <div key={s.desc} className="flex items-center justify-between py-1.5 border-b border-border/40 last:border-0">
              <span className="text-xs text-muted-foreground">{s.desc}</span>
              <div className="flex gap-1">
                {s.keys.map((k) => <kbd key={k} className="text-[10px] bg-muted border border-border rounded px-1.5 py-0.5 font-mono text-foreground/70">{k}</kbd>)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── MESSAGES ── */}
      <div className="flex-1 overflow-y-auto px-3 pt-4 pb-2 md:px-6 md:pt-5" ref={scrollRef}>
        {/* Ambient background gradient blobs */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
          <div className="absolute top-[15%] left-[10%] w-80 h-80 rounded-full bg-primary/4 blur-3xl orb-float" />
          <div className="absolute bottom-[20%] right-[8%] w-64 h-64 rounded-full bg-accent/4 blur-3xl orb-float-2" />
          <div className="absolute top-[55%] left-[45%] w-48 h-48 rounded-full bg-primary/3 blur-3xl orb-float-3" />
        </div>

        <div className="max-w-3xl mx-auto space-y-5 pb-36">
          {isLoading ? (
            <div className="space-y-5 pt-4">
              {[1,2,3].map((i) => (
                <div key={i} className={`flex gap-3 ${i % 2 === 0 ? "flex-row-reverse" : ""}`}>
                  <div className="w-8 h-8 rounded-xl shimmer flex-shrink-0" />
                  <div className="flex-1 space-y-2 max-w-[70%]">
                    <div className="h-4 shimmer rounded-xl" style={{ width: `${55 + i * 15}%` }} />
                    <div className="h-4 shimmer rounded-xl" style={{ width: `${35 + i * 10}%` }} />
                    {i === 2 && <div className="h-4 shimmer rounded-xl" style={{ width: "60%" }} />}
                  </div>
                </div>
              ))}
            </div>
          ) : messages.length === 0 && !streamingMessage ? (
            /* ── Welcome screen ── */
            <div className="flex flex-col items-center justify-center min-h-[52vh] gap-6 animate-in fade-in zoom-in duration-500 px-2">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="relative">
                  {/* Glow rings */}
                  <div className="absolute inset-0 rounded-2xl bg-primary/20 blur-xl scale-110 animate-pulse" />
                  <div className="relative w-18 h-18 w-[72px] h-[72px] rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-accent flex items-center justify-center shadow-2xl shadow-primary/30">
                    <Sparkles className="w-8 h-8 text-white drop-shadow" />
                  </div>
                  <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-emerald-500 border-2 border-background shadow-sm flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-white animate-ping" />
                  </div>
                </div>
                <div>
                  <h2 className="text-3xl md:text-4xl font-extrabold mb-1.5 gradient-text tracking-tight">Xush kelibsiz!</h2>
                  <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                    Men O'zbek AI — sizning aqlli yordamchingizman.<br />Qanday yordam bera olaman?
                  </p>
                </div>
              </div>

              {/* Quick prompt grid */}
              <div className="grid grid-cols-3 md:grid-cols-4 gap-2 w-full max-w-2xl">
                {QUICK_PROMPTS.map((p) => (
                  <button key={p.label} onClick={() => handleSend(p.prompt)}
                    className="flex flex-col items-start gap-2 rounded-2xl border border-border bg-card hover:bg-muted/60 hover:border-primary/30 hover:-translate-y-0.5 transition-all p-3 text-left shadow-sm hover:shadow-md hover:shadow-primary/5 active:scale-[0.97] group/card">
                    <span className="text-xl">{p.icon}</span>
                    <span className="text-[11px] font-bold text-foreground/70 group-hover/card:text-primary transition-colors leading-tight">{p.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {searchQuery && (
                <div className="text-xs text-center py-2 px-4 bg-yellow-500/8 border border-yellow-400/20 rounded-xl text-muted-foreground">
                  {matchCount > 0 ? <><span className="text-yellow-400 font-semibold">{matchCount}</span> ta xabarda topildi</> : "Hech narsa topilmadi"}
                </div>
              )}

              {(searchQuery ? filteredMsgs : messages).map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isBookmarked={isBookmarked(msg.id)}
                  onBookmark={() => onToggleBookmark({ ...msg })}
                  searchQuery={searchQuery || undefined}
                />
              ))}

              {isStreaming && streamingMessage && (
                <MessageBubble
                  message={{ id: 0, content: streamingMessage, role: "assistant", conversationId: 0, createdAt: new Date().toISOString() }}
                  isStreaming
                  isBookmarked={false}
                />
              )}
              {isStreaming && !streamingMessage && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0 shadow-md shadow-primary/25">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-card border border-border/70 rounded-2xl rounded-tl-sm px-5 py-4 flex items-center gap-2 shadow-sm">
                    <span className="thinking-dot w-2 h-2 rounded-full bg-primary/60 inline-block" />
                    <span className="thinking-dot w-2 h-2 rounded-full bg-primary/60 inline-block" />
                    <span className="thinking-dot w-2 h-2 rounded-full bg-primary/60 inline-block" />
                  </div>
                </div>
              )}

              {/* Smart reply chips */}
              {lastAiMsg && !isStreaming && !searchQuery && (
                <div className="flex flex-wrap gap-1.5 pl-11 pt-1">
                  {SMART_REPLIES.slice(0, 4).map((r) => (
                    <button key={r} onClick={() => handleSend(r)}
                      className="text-xs px-3 py-1.5 rounded-full border border-border bg-card/80 hover:bg-primary/10 hover:border-primary/40 hover:text-primary transition-all text-muted-foreground active:scale-95 backdrop-blur-sm shadow-sm">
                      {r}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Scroll btn */}
      {showScrollBtn && (
        <button onClick={() => scrollToBottom()}
          className="absolute bottom-[140px] left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 text-xs bg-card/90 backdrop-blur border border-border rounded-full px-3.5 py-1.5 shadow-lg hover:border-primary/40 transition-all animate-in fade-in glass">
          <ChevronDown className="w-3.5 h-3.5 text-primary" />Pastga
        </button>
      )}

      {/* Regenerate */}
      {lastAiMsg && !isStreaming && messages.length > 0 && (
        <div className="absolute bottom-[122px] right-4 md:right-7 z-10">
          <button onClick={() => lastUserMsg && onSendMessage(lastUserMsg.content)}
            className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-primary bg-card/80 backdrop-blur border border-border rounded-full px-3 py-1.5 shadow-sm hover:border-primary/40 hover:shadow-primary/10 transition-all">
            <RefreshCw className="w-3 h-3" />Qayta
          </button>
        </div>
      )}

      {/* ── INPUT BAR ── */}
      <div className="absolute bottom-0 left-0 right-0 px-3 pb-4 pt-2 md:px-6 md:pb-5 bg-gradient-to-t from-background via-background/95 to-transparent">
        <div className="max-w-3xl mx-auto">
          <div className="relative flex items-end rounded-2xl bg-card border border-border focus-within:border-primary/40 shadow-lg shadow-primary/5 transition-all overflow-hidden input-glow ring-gradient">
            {/* Emoji picker */}
            <div className="flex-shrink-0 px-1 pb-1.5 pt-1.5 self-end">
              <EmojiPicker onSelect={handleEmojiSelect} />
            </div>

            <Textarea
              ref={textareaRef}
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="Xabar yozing..."
              className="min-h-[50px] md:min-h-[54px] max-h-[180px] flex-1 resize-none bg-transparent border-0 focus-visible:ring-0 px-2 py-3.5 text-sm md:text-[15px]"
              rows={1}
              data-testid="input-message"
            />

            <div className="flex items-center gap-1 px-2 py-2 self-end flex-shrink-0">
              {input.length > 60 && (
                <span className={`text-[10px] font-mono tabular-nums ${input.length > 500 ? "text-destructive" : "text-muted-foreground/50"}`}>
                  {input.length}
                </span>
              )}
              {isStreaming && onStopStreaming ? (
                <Button size="icon" variant="outline"
                  className="h-9 w-9 rounded-xl border-destructive/40 text-destructive hover:bg-destructive/10"
                  onClick={onStopStreaming} title="To'xtatish">
                  <StopCircle className="w-4 h-4" />
                </Button>
              ) : (
                <Button size="icon"
                  className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-primary/80 text-white hover:opacity-90 transition-all active:scale-95 shadow-md shadow-primary/30 disabled:opacity-40"
                  onClick={() => handleSend()} disabled={!input.trim() || isStreaming}
                  data-testid="button-send-message">
                  <SendHorizontal className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
          <p className="text-center text-[10px] text-muted-foreground/40 mt-1.5 select-none">
            <kbd className="font-mono bg-muted px-1 rounded text-[9px]">Enter</kbd> yuborish ·{" "}
            <kbd className="font-mono bg-muted px-1 rounded text-[9px]">Shift+Enter</kbd> yangi qator ·{" "}
            <kbd className="font-mono bg-muted px-1 rounded text-[9px]">Ctrl+F</kbd> qidirish
          </p>
        </div>
      </div>
    </div>
  );
}
