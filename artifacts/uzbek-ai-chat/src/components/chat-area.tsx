import {
  SendHorizontal, Menu, X, RefreshCw, Sparkles, ChevronDown,
  Download, Keyboard, Search, AArrowDown, AArrowUp, StopCircle,
  MessageSquare, Eraser, Zap, Copy, Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { OpenaiMessage } from "@workspace/api-client-react";
import { useEffect, useRef, useState, KeyboardEvent, useCallback } from "react";
import { MessageBubble } from "./message-bubble";
import { EmojiPicker } from "./emoji-picker";
import { ToastNotifications, type ToastItem } from "./toast-notifications";
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
  { icon: "✍️", label: "Matn",       prompt: "Menga qisqa motivatsion xat yozib bering." },
  { icon: "🧠", label: "Tushuntir",  prompt: "Sun'iy intellekt nima va u qanday ishlaydi? Oddiy tilda tushuntir." },
  { icon: "💡", label: "G'oya",      prompt: "O'zbekiston uchun 5 ta innovatsion biznes g'oyasini ayting." },
  { icon: "🌍", label: "Tarjima",    prompt: "Bu jumlani ingliz tiliga tarjima qiling: 'Bilim — kuch.'" },
  { icon: "📝", label: "Rezyume",    prompt: "Dasturchi uchun professional rezyume namunasi yozing." },
  { icon: "🎯", label: "Maslahat",   prompt: "Ingliz tilini tez o'rganish uchun eng samarali maslahatlar?" },
  { icon: "📖", label: "Hikoya",     prompt: "O'zbek udumi haqida qisqa va ta'sirchan hikoya yoz." },
  { icon: "🔢", label: "Matematika", prompt: "Integralni hisoblash usullarini tushuntir va misol keltir." },
  { icon: "🖥️", label: "Kod yoz",   prompt: "Python da Fibonacci ketma-ketligini hisoblovchi funksiya yoz." },
  { icon: "📊", label: "Tahlil",     prompt: "O'zbekiston iqtisodiyotining so'nggi tendentsiyalarini tahlil qil." },
  { icon: "🎨", label: "She'r",      prompt: "Bahor haqida o'zbekcha she'r yoz." },
  { icon: "⚖️", label: "Solishtir", prompt: "Python va JavaScript o'rtasidagi asosiy farqlarni solishtir." },
];

const SMART_REPLIES = [
  "Ko'proq tushuntir", "Misol keltir", "Boshqacha usul bormi?",
  "Qisqaroq qil", "Davom et", "O'zbekcha yoz",
];

const THINKING_PHRASES = [
  "O'ylamoqda...", "Tahlil qilmoqda...", "Javob tayyorlamoqda...",
  "Ishlamoqda...", "Ma'lumot qidirilmoqda...",
];

let toastCounter = 0;

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
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [copiedConv, setCopiedConv] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [thinkingPhrase] = useState(() => THINKING_PHRASES[Math.floor(Math.random() * THINKING_PHRASES.length)]);

  const scrollRef  = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const searchRef   = useRef<HTMLInputElement>(null);
  const { size: fontSize, increase: increaseFont, decrease: decreaseFont } = useFontSize();

  const showToast = useCallback((message: string, type: ToastItem["type"] = "success") => {
    const id = ++toastCounter;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 2800);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

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
    if (searchOpen) setTimeout(() => searchRef.current?.focus(), 60);
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

  const handleExportTxt = () => {
    if (!messages.length) return;
    const txt = messages.map((m) =>
      `[${new Date(m.createdAt).toLocaleString("uz-UZ")}] ${m.role === "user" ? "Siz" : "O'zbek AI"}:\n${m.content}`
    ).join("\n\n─────────────────────────────\n\n");
    const blob = new Blob([`O'zbek AI — ${conversationTitle ?? "Suhbat"}\n${"═".repeat(50)}\n\n${txt}`], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `uzbek-ai-${Date.now()}.txt`; a.click();
    showToast("Fayl yuklandi!", "success");
  };

  const handleCopyConversation = async () => {
    if (!messages.length) return;
    const txt = messages.map((m) => `${m.role === "user" ? "Siz" : "AI"}: ${m.content}`).join("\n\n");
    try {
      await navigator.clipboard.writeText(txt);
      setCopiedConv(true); showToast("Suhbat nusxa olindi!", "success");
      setTimeout(() => setCopiedConv(false), 2000);
    } catch {}
  };

  const filteredMsgs = searchQuery.trim()
    ? messages.filter((m) => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages;
  const matchCount = searchQuery.trim() ? filteredMsgs.length : 0;

  const lastAiMsg   = [...messages].reverse().find((m) => m.role === "assistant");
  const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
  const totalWords  = messages.reduce((s, m) => s + m.content.trim().split(/\s+/).filter(Boolean).length, 0);

  return (
    <div className="flex-1 flex flex-col h-full relative overflow-hidden min-w-0 dark:bg-mesh-dark bg-mesh-light">

      {/* Toast notifications */}
      <ToastNotifications toasts={toasts} onDismiss={dismissToast} />

      {/* ── TOP BAR ───────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border glass-strong flex-shrink-0 z-10">
        <Button variant="ghost" size="icon" onClick={onToggleSidebar}
          className="shrink-0 md:hidden h-8 w-8" data-testid="button-toggle-sidebar">
          {isSidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </Button>

        {searchOpen ? (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40 pointer-events-none" />
              <input ref={searchRef} value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Escape" && (setSearchOpen(false), setSearchQuery(""))}
                placeholder="Xabarlarda qidirish..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-muted border border-border rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 transition-all" />
            </div>
            {searchQuery && (
              <span className="text-[10px] text-muted-foreground whitespace-nowrap font-medium">
                {matchCount} ta natija
              </span>
            )}
            <button onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
              className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="hidden md:flex w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-accent items-center justify-center flex-shrink-0 shadow-md shadow-primary/20">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-bold text-sm text-foreground truncate">{conversationTitle ?? "O'zbek AI"}</span>
                {messages.length > 0 && (
                  <span className="hidden lg:flex items-center gap-1.5 text-[10px] text-muted-foreground/35 flex-shrink-0">
                    <MessageSquare className="w-2.5 h-2.5" />{messages.length}
                    {totalWords > 0 && <><span>·</span><Zap className="w-2.5 h-2.5" />{totalWords} so'z</>}
                  </span>
                )}
              </div>
              {isStreaming ? (
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                  <span className="text-[10px] text-emerald-500 font-semibold">{thinkingPhrase}</span>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                  <span className="text-[10px] text-muted-foreground/35">Online</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action buttons */}
        {!searchOpen && (
          <div className="flex items-center gap-0.5 flex-shrink-0">
            {messages.length > 0 && (
              <Button variant="ghost" size="icon" onClick={() => setSearchOpen(true)}
                className="h-8 w-8 text-muted-foreground hover:text-foreground" title="Qidirish (Ctrl+F)">
                <Search className="w-3.5 h-3.5" />
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={decreaseFont}
              className="h-8 w-8 text-muted-foreground hover:text-foreground hidden md:flex" title="Shrift kichraytir">
              <AArrowDown className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={increaseFont}
              className="h-8 w-8 text-muted-foreground hover:text-foreground hidden md:flex" title="Shrift kattalashtir">
              <AArrowUp className="w-3.5 h-3.5" />
            </Button>
            {messages.length > 0 && (
              <>
                <Button variant="ghost" size="icon" onClick={handleCopyConversation}
                  className="h-8 w-8 text-muted-foreground hover:text-foreground hidden md:flex" title="Suhbatni nusxa ol">
                  {copiedConv ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </Button>
                <Button variant="ghost" size="icon" onClick={handleExportTxt}
                  className="h-8 w-8 text-muted-foreground hover:text-foreground" title="Yuklab olish (.txt)">
                  <Download className="w-3.5 h-3.5" />
                </Button>
                {onClearMessages && (
                  <div className="relative">
                    <Button variant="ghost" size="icon"
                      onClick={() => setShowClearConfirm((v) => !v)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive" title="Xabarlarni tozalash">
                      <Eraser className="w-3.5 h-3.5" />
                    </Button>
                    {showClearConfirm && (
                      <div className="absolute top-full right-0 mt-1.5 z-50 bg-popover border border-border rounded-2xl shadow-2xl p-3.5 w-54 animate-in fade-in zoom-in-95 slide-in-from-top-2 glass-strong">
                        <p className="text-xs text-foreground mb-1 font-semibold">Barcha xabarlarni o'chirish?</p>
                        <p className="text-[10px] text-muted-foreground mb-3">Bu amalni qaytarib bo'lmaydi.</p>
                        <div className="flex gap-2">
                          <button onClick={() => { onClearMessages(); setShowClearConfirm(false); showToast("Xabarlar tozalandi", "info"); }}
                            className="flex-1 py-1.5 text-xs bg-destructive text-white rounded-xl hover:bg-destructive/90 transition-all font-semibold">
                            O'chir
                          </button>
                          <button onClick={() => setShowClearConfirm(false)}
                            className="flex-1 py-1.5 text-xs bg-muted rounded-xl hover:bg-muted/80 transition-all text-foreground/70">
                            Bekor
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
            <Button variant="ghost" size="icon" onClick={() => setShowShortcuts((v) => !v)}
              className="h-8 w-8 text-muted-foreground hover:text-foreground hidden md:flex" title="Yorliqlar">
              <Keyboard className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </div>

      {/* Shortcuts popup */}
      {showShortcuts && (
        <div className="absolute top-14 right-3 z-50 glass-strong border border-border rounded-2xl shadow-2xl p-4 w-60 animate-in fade-in zoom-in-95 slide-in-from-top-2">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-foreground">Klaviatura yorliqlari</span>
            <button onClick={() => setShowShortcuts(false)} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          {[
            { keys: ["Enter"],         desc: "Xabar yuborish" },
            { keys: ["Shift", "Enter"], desc: "Yangi qator" },
            { keys: ["Ctrl", "F"],      desc: "Xabarlarda qidirish" },
            { keys: ["Esc"],            desc: "Qidiruvni yopish" },
          ].map((s) => (
            <div key={s.desc} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
              <span className="text-xs text-muted-foreground">{s.desc}</span>
              <div className="flex gap-1">
                {s.keys.map((k) => (
                  <kbd key={k} className="text-[10px] bg-muted border border-border rounded-lg px-1.5 py-0.5 font-mono text-foreground/60">
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── MESSAGES ───────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-3 pt-4 pb-2 md:px-6 md:pt-5 relative" ref={scrollRef}>
        {/* Ambient orbs */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
          <div className="absolute top-[18%] left-[8%]  w-[380px] h-[380px] rounded-full bg-primary/[0.035] blur-[80px] orb-float" />
          <div className="absolute bottom-[18%] right-[6%] w-[300px] h-[300px] rounded-full bg-accent/[0.03]  blur-[70px] orb-float-2" />
          <div className="absolute top-[55%] left-[42%] w-[220px] h-[220px] rounded-full bg-primary/[0.025] blur-[60px] orb-float-3" />
        </div>

        <div className="max-w-3xl mx-auto space-y-5 pb-40">
          {isLoading ? (
            /* Loading skeletons */
            <div className="space-y-6 pt-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className={`flex gap-3 ${i % 2 === 0 ? "flex-row-reverse" : ""}`}>
                  <div className="w-8 h-8 rounded-xl shimmer flex-shrink-0" />
                  <div className="flex-1 space-y-2 max-w-[68%]">
                    <div className="h-4 shimmer rounded-xl" style={{ width: `${60 + i * 12}%` }} />
                    <div className="h-4 shimmer rounded-xl" style={{ width: `${40 + i * 8}%` }} />
                    {i === 2 && <div className="h-4 shimmer rounded-xl" style={{ width: "55%" }} />}
                  </div>
                </div>
              ))}
            </div>
          ) : messages.length === 0 && !streamingMessage ? (
            /* ── Welcome screen ── */
            <div className="flex flex-col items-center justify-center min-h-[54vh] gap-7 animate-in fade-in zoom-in duration-500 px-2">
              <div className="flex flex-col items-center gap-5 text-center">
                {/* Logo */}
                <div className="relative">
                  <div className="absolute inset-0 rounded-2xl blur-2xl scale-110 bg-gradient-to-br from-primary/30 to-accent/20 animate-pulse" />
                  <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-accent flex items-center justify-center shadow-2xl shadow-primary/30 ring-1 ring-white/10">
                    <Sparkles className="w-9 h-9 text-white drop-shadow-lg" />
                  </div>
                  <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-emerald-500 border-2 border-background shadow-sm flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-white animate-ping" />
                  </div>
                </div>
                <div>
                  <h2 className="text-4xl md:text-5xl font-extrabold mb-2 gradient-text tracking-tight leading-tight">
                    Xush kelibsiz!
                  </h2>
                  <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
                    Men O'zbek AI — sizning aqlli yordamchingizman.<br />
                    Quyidagi mavzulardan birini tanlang yoki o'zingiz yozing.
                  </p>
                </div>

                {/* Stats strip */}
                <div className="flex items-center gap-6 text-center">
                  {[
                    { label: "Til", val: "O'zbek" },
                    { label: "Model", val: "GPT-5.2" },
                    { label: "Javob", val: "<2s" },
                  ].map((s) => (
                    <div key={s.label}>
                      <div className="text-sm font-bold text-foreground/80">{s.val}</div>
                      <div className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick prompts */}
              <div className="grid grid-cols-3 md:grid-cols-4 gap-2.5 w-full max-w-2xl">
                {QUICK_PROMPTS.map((p) => (
                  <button key={p.label} onClick={() => handleSend(p.prompt)}
                    className="flex flex-col items-start gap-2 rounded-2xl border border-border bg-card/80 hover:bg-muted/60 hover:border-primary/30 hover:-translate-y-0.5 hover:shadow-md hover:shadow-primary/8 transition-all p-3 text-left active:scale-[0.97] group/card backdrop-blur-sm">
                    <span className="text-xl">{p.icon}</span>
                    <span className="text-[11px] font-semibold text-foreground/65 group-hover/card:text-primary transition-colors leading-tight">{p.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {searchQuery && (
                <div className="text-xs text-center py-2.5 px-4 bg-yellow-500/8 border border-yellow-400/20 rounded-2xl text-muted-foreground">
                  {matchCount > 0
                    ? <><span className="text-yellow-400 font-bold">{matchCount}</span> ta xabarda topildi</>
                    : <span className="text-muted-foreground/60">Hech narsa topilmadi — boshqa so'z kiriting</span>}
                </div>
              )}

              {(searchQuery ? filteredMsgs : messages).map((msg) => (
                <MessageBubble key={msg.id} message={msg}
                  isBookmarked={isBookmarked(msg.id)}
                  onBookmark={() => onToggleBookmark({ ...msg })}
                  searchQuery={searchQuery || undefined}
                  onCopy={(text) => showToast(text, "success")}
                />
              ))}

              {isStreaming && streamingMessage && (
                <MessageBubble
                  message={{ id: 0, content: streamingMessage, role: "assistant", conversationId: 0, createdAt: new Date().toISOString() }}
                  isStreaming isBookmarked={false} />
              )}
              {isStreaming && !streamingMessage && (
                <div className="flex gap-3 animate-in fade-in">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0 shadow-md shadow-primary/25 glow-sm">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-card border border-border/60 rounded-2xl rounded-tl-sm px-5 py-4 flex items-center gap-2 shadow-sm">
                    <span className="thinking-dot w-2 h-2 rounded-full bg-primary/50 inline-block" />
                    <span className="thinking-dot w-2 h-2 rounded-full bg-primary/50 inline-block" />
                    <span className="thinking-dot w-2 h-2 rounded-full bg-primary/50 inline-block" />
                  </div>
                </div>
              )}

              {/* Smart reply chips */}
              {lastAiMsg && !isStreaming && !searchQuery && (
                <div className="flex flex-wrap gap-2 pl-11 pt-1">
                  {SMART_REPLIES.slice(0, 4).map((r) => (
                    <button key={r} onClick={() => handleSend(r)}
                      className="text-xs px-3.5 py-1.5 rounded-full border border-border bg-card/80 hover:bg-primary/10 hover:border-primary/40 hover:text-primary transition-all text-muted-foreground active:scale-95 backdrop-blur-sm shadow-sm font-medium">
                      {r}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Scroll button */}
      {showScrollBtn && (
        <button onClick={() => scrollToBottom()}
          className="absolute bottom-[148px] left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 text-xs glass-strong border border-border rounded-full px-4 py-2 shadow-lg hover:border-primary/40 hover:text-primary transition-all animate-in fade-in">
          <ChevronDown className="w-3.5 h-3.5" />Pastga
        </button>
      )}

      {/* Regenerate */}
      {lastAiMsg && !isStreaming && messages.length > 0 && (
        <div className="absolute bottom-[128px] right-4 md:right-8 z-10">
          <button onClick={() => lastUserMsg && onSendMessage(lastUserMsg.content)}
            className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-primary glass border border-border rounded-full px-3.5 py-1.5 shadow-sm hover:border-primary/40 transition-all font-medium">
            <RefreshCw className="w-3 h-3" />Qayta yuborish
          </button>
        </div>
      )}

      {/* ── INPUT BAR ──────────────────────────────────────────────────── */}
      <div className="absolute bottom-0 left-0 right-0 px-3 pb-4 pt-3 md:px-6 md:pb-5"
        style={{ background: "linear-gradient(to top, hsl(var(--background)) 70%, transparent 100%)" }}>
        <div className="max-w-3xl mx-auto">
          <div className="relative flex items-end rounded-2xl bg-card border border-border shadow-lg shadow-primary/5 transition-all overflow-visible input-glow">
            {/* Emoji */}
            <div className="flex-shrink-0 px-1 pb-1.5 pt-1.5 self-end">
              <EmojiPicker onSelect={handleEmojiSelect} />
            </div>

            <Textarea ref={textareaRef} value={input} onChange={handleInput} onKeyDown={handleKeyDown}
              placeholder="Xabar yozing..."
              className="min-h-[50px] md:min-h-[54px] max-h-[200px] flex-1 resize-none bg-transparent border-0 focus-visible:ring-0 px-2 py-3.5 text-sm md:text-[15px] leading-relaxed"
              rows={1} data-testid="input-message" />

            <div className="flex items-center gap-1.5 px-2 py-2 self-end flex-shrink-0">
              {input.length > 0 && (
                <span className={`text-[10px] font-mono tabular-nums transition-colors ${
                  input.length > 800 ? "text-destructive" : input.length > 400 ? "text-amber-500" : "text-muted-foreground/35"
                }`}>
                  {input.length}
                </span>
              )}
              {isStreaming && onStopStreaming ? (
                <Button size="icon" variant="outline" onClick={onStopStreaming}
                  className="h-9 w-9 rounded-xl border-destructive/40 text-destructive hover:bg-destructive/10 hover:border-destructive/60 transition-all"
                  title="Generatsiyani to'xtatish">
                  <StopCircle className="w-4 h-4" />
                </Button>
              ) : (
                <Button size="icon" onClick={() => handleSend()}
                  disabled={!input.trim() || isStreaming}
                  className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-primary/80 text-white hover:opacity-90 transition-all active:scale-95 shadow-md shadow-primary/30 disabled:opacity-35 disabled:shadow-none"
                  data-testid="button-send-message">
                  <SendHorizontal className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
          <p className="text-center text-[10px] text-muted-foreground/30 mt-2 select-none">
            <kbd className="font-mono bg-muted px-1.5 rounded text-[9px]">Enter</kbd> yuborish ·{" "}
            <kbd className="font-mono bg-muted px-1.5 rounded text-[9px]">Shift+Enter</kbd> yangi qator ·{" "}
            <kbd className="font-mono bg-muted px-1.5 rounded text-[9px]">Ctrl+F</kbd> qidirish
          </p>
        </div>
      </div>
    </div>
  );
}
