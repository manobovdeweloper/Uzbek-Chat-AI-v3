import {
  SendHorizontal, Menu, X, RefreshCw, Sparkles, ChevronDown,
  Download, Keyboard, Search, AArrowDown, AArrowUp, StopCircle,
  MessageSquare, Eraser, Zap, Copy, Check, ImagePlus, XCircle,
  Mic, MicOff,
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
  onSendMessage: (content: string, imageBase64?: string) => void;
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
  { icon: "✍️", label: "Matn",       grad: "from-violet-500/20 to-purple-600/8",  prompt: "Menga qisqa motivatsion xat yozib bering." },
  { icon: "🧠", label: "Tushuntir",  grad: "from-blue-500/20 to-indigo-600/8",    prompt: "Sun'iy intellekt nima? Oddiy tilda tushuntir." },
  { icon: "💡", label: "G'oya",      grad: "from-amber-400/20 to-orange-500/8",   prompt: "O'zbekiston uchun 5 ta innovatsion biznes g'oyasi." },
  { icon: "🌍", label: "Tarjima",    grad: "from-emerald-500/20 to-teal-600/8",   prompt: "Bu jumlani inglizchaga tarjima qil: 'Bilim — kuch.'" },
  { icon: "📝", label: "Rezyume",    grad: "from-sky-500/20 to-blue-600/8",       prompt: "Dasturchi uchun professional rezyume namunasi yoz." },
  { icon: "🎯", label: "Maslahat",   grad: "from-rose-500/20 to-pink-600/8",      prompt: "Ingliz tilini tez o'rganish uchun eng samarali maslahatlar?" },
  { icon: "📖", label: "Hikoya",     grad: "from-indigo-500/20 to-violet-600/8",  prompt: "O'zbek udumi haqida qisqa hikoya yoz." },
  { icon: "🖥️", label: "Kod",       grad: "from-cyan-500/20 to-sky-600/8",       prompt: "Python da Fibonacci ketma-ketligini hisoblash." },
  { icon: "📊", label: "Tahlil",     grad: "from-teal-500/20 to-emerald-600/8",   prompt: "O'zbekiston iqtisodiyotining so'nggi tendentsiyalari." },
  { icon: "🎨", label: "She'r",      grad: "from-pink-500/20 to-rose-600/8",      prompt: "Bahor haqida o'zbekcha she'r yoz." },
  { icon: "🔢", label: "Math",       grad: "from-orange-500/20 to-amber-600/8",   prompt: "Integralni tushuntir: ∫x²dx — misol bilan." },
  { icon: "⚖️", label: "Solishtir", grad: "from-slate-500/20 to-zinc-600/8",     prompt: "Python va JavaScript o'rtasidagi asosiy farqlar." },
];

const SMART_REPLIES = [
  { icon: "🔍", text: "Ko'proq tushuntir" },
  { icon: "💡", text: "Misol keltir" },
  { icon: "🔄", text: "Boshqacha usul?" },
  { icon: "✂️", text: "Qisqaroq qil" },
  { icon: "▶️", text: "Davom et" },
  { icon: "🇺🇿", text: "O'zbekcha yoz" },
];

const THINKING = [
  "O'ylamoqda...", "Tahlil qilmoqda...", "Javob tayyorlamoqda...",
  "Ishlamoqda...", "Ma'lumot qidirilmoqda...",
];

let toastCtr = 0;

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
  const [thinkingPhrase] = useState(() => THINKING[Math.floor(Math.random() * THINKING.length)]);

  // Image attachment state
  const [attachedImage, setAttachedImage] = useState<{ dataUrl: string; name: string } | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Voice input state
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<{ stop: () => void } | null>(null);

  const scrollRef   = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const searchRef   = useRef<HTMLInputElement>(null);
  const { decrease: decreaseFont, increase: increaseFont } = useFontSize();

  const showToast = useCallback((message: string, type: ToastItem["type"] = "success") => {
    const id = ++toastCtr;
    setToasts((p) => [...p, { id, message, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 2800);
  }, []);

  const dismissToast = useCallback((id: number) => setToasts((p) => p.filter((t) => t.id !== id)), []);

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

  useEffect(() => { if (searchOpen) setTimeout(() => searchRef.current?.focus(), 60); }, [searchOpen]);

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
    if (!content && !attachedImage) return;
    if (isStreaming) return;
    onSendMessage(content || "Ushbu rasmni tahlil qilib ber.", attachedImage?.dataUrl);
    setInput(""); onDraftChange?.(""); setAttachedImage(null);
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
    const end   = el.selectionEnd   ?? input.length;
    const next  = input.slice(0, start) + emoji + input.slice(end);
    setInput(next); onDraftChange?.(next);
    setTimeout(() => { el.focus(); el.setSelectionRange(start + emoji.length, start + emoji.length); }, 0);
  };

  const handleImageAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { showToast("Fayl 10MB dan kichik bo'lsin", "error"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setAttachedImage({ dataUrl, name: file.name });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const toggleVoice = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { showToast("Brauzeringiz ovoz kiritishni qo'llab-quvvatlamaydi", "error"); return; }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rec: any = new SR();
    rec.lang = "uz-UZ";
    rec.interimResults = true;
    rec.continuous = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (e: any) => {
      const t = Array.from(e.results as any[]).map((r: any) => r[0].transcript).join("");
      setInput(t); onDraftChange?.(t);
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
      }
    };
    rec.onend = () => setIsRecording(false);
    rec.onerror = () => { setIsRecording(false); showToast("Ovoz kiritishda xato", "error"); };
    rec.start();
    recognitionRef.current = rec;
    setIsRecording(true);
    showToast("🎙️ Gapiring...", "info");
  };

  const handleExport = () => {
    if (!messages.length) return;
    const txt = messages.map((m) => {
      const text = m.content.replace(/^__IMG__[\s\S]*?__ENDIMG__/, "[📷 Rasm] ");
      return `[${new Date(m.createdAt).toLocaleString("uz-UZ")}] ${m.role === "user" ? "Siz" : "O'zbek AI"}:\n${text}`;
    }).join("\n\n─────────────────────────\n\n");
    const blob = new Blob([`O'zbek AI — ${conversationTitle ?? "Suhbat"}\n${"═".repeat(50)}\n\n${txt}`], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `uzbek-ai-${Date.now()}.txt`; a.click();
    showToast("Fayl yuklandi!", "success");
  };

  const handleCopyConversation = async () => {
    if (!messages.length) return;
    const txt = messages.map((m) => {
      const text = m.content.replace(/^__IMG__[\s\S]*?__ENDIMG__/, "[📷 Rasm] ");
      return `${m.role === "user" ? "Siz" : "AI"}: ${text}`;
    }).join("\n\n");
    try { await navigator.clipboard.writeText(txt); setCopiedConv(true); showToast("Suhbat nusxa olindi!", "success"); setTimeout(() => setCopiedConv(false), 2000); } catch {}
  };

  const filteredMsgs = searchQuery.trim()
    ? messages.filter((m) => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages;
  const matchCount = searchQuery.trim() ? filteredMsgs.length : 0;
  const lastAiMsg   = [...messages].reverse().find((m) => m.role === "assistant");
  const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
  const totalWords  = messages.reduce((s, m) => s + m.content.replace(/^__IMG__[\s\S]*?__ENDIMG__/, "").trim().split(/\s+/).filter(Boolean).length, 0);

  const canSend = (input.trim().length > 0 || !!attachedImage) && !isStreaming;

  return (
    <div className="flex-1 flex flex-col h-full relative overflow-hidden min-w-0 dark:bg-mesh-dark bg-mesh-light">
      <ToastNotifications toasts={toasts} onDismiss={dismissToast} />

      {/* ── TOP BAR ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-2 border-b border-border glass-strong flex-shrink-0 z-10">
        <Button variant="ghost" size="icon" onClick={onToggleSidebar}
          className="shrink-0 h-9 w-9 md:h-8 md:w-8" data-testid="button-toggle-sidebar">
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
            {searchQuery && <span className="text-[10px] text-muted-foreground whitespace-nowrap font-medium">{matchCount} ta</span>}
            <button onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
              className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted transition-all min-h-[36px] min-w-[36px] flex items-center justify-center">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="hidden md:flex w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-accent items-center justify-center flex-shrink-0 shadow-md shadow-primary/20">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-bold text-sm text-foreground truncate">{conversationTitle ?? "O'zbek AI"}</span>
                {messages.length > 0 && (
                  <span className="hidden lg:flex items-center gap-1.5 text-[10px] text-muted-foreground/35 flex-shrink-0">
                    <MessageSquare className="w-2.5 h-2.5" />{messages.length}
                    {totalWords > 0 && <><span>·</span><Zap className="w-2.5 h-2.5" />{totalWords}</>}
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

        {!searchOpen && (
          <div className="flex items-center gap-0.5 flex-shrink-0">
            {messages.length > 0 && (
              <Button variant="ghost" size="icon" onClick={() => setSearchOpen(true)}
                className="h-9 w-9 md:h-8 md:w-8 text-muted-foreground hover:text-foreground" title="Qidirish (Ctrl+F)">
                <Search className="w-4 h-4" />
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={decreaseFont} className="h-9 w-9 md:h-8 md:w-8 text-muted-foreground hover:text-foreground hidden md:flex" title="A-">
              <AArrowDown className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={increaseFont} className="h-9 w-9 md:h-8 md:w-8 text-muted-foreground hover:text-foreground hidden md:flex" title="A+">
              <AArrowUp className="w-4 h-4" />
            </Button>
            {messages.length > 0 && (
              <>
                <Button variant="ghost" size="icon" onClick={handleCopyConversation}
                  className="h-9 w-9 md:h-8 md:w-8 text-muted-foreground hover:text-foreground hidden md:flex" title="Nusxa ol">
                  {copiedConv ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </Button>
                <Button variant="ghost" size="icon" onClick={handleExport}
                  className="h-9 w-9 md:h-8 md:w-8 text-muted-foreground hover:text-foreground" title="Yuklab olish">
                  <Download className="w-4 h-4" />
                </Button>
                {onClearMessages && (
                  <div className="relative">
                    <Button variant="ghost" size="icon" onClick={() => setShowClearConfirm((v) => !v)}
                      className="h-9 w-9 md:h-8 md:w-8 text-muted-foreground hover:text-destructive" title="Tozalash">
                      <Eraser className="w-4 h-4" />
                    </Button>
                    {showClearConfirm && (
                      <div className="absolute top-full right-0 mt-1.5 z-50 glass-strong border border-border rounded-2xl shadow-2xl p-3.5 w-52 animate-in fade-in zoom-in-95">
                        <p className="text-xs text-foreground mb-1 font-semibold">Barcha xabarlarni o'chirish?</p>
                        <p className="text-[10px] text-muted-foreground mb-3">Bu amalni qaytarib bo'lmaydi.</p>
                        <div className="flex gap-2">
                          <button onClick={() => { onClearMessages(); setShowClearConfirm(false); showToast("Tozalandi", "info"); }}
                            className="flex-1 py-1.5 text-xs bg-destructive text-white rounded-xl hover:bg-destructive/90 font-semibold">O'chir</button>
                          <button onClick={() => setShowClearConfirm(false)}
                            className="flex-1 py-1.5 text-xs bg-muted rounded-xl text-foreground/70">Bekor</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
            <Button variant="ghost" size="icon" onClick={() => setShowShortcuts((v) => !v)}
              className="h-9 w-9 md:h-8 md:w-8 text-muted-foreground hover:text-foreground hidden md:flex" title="Yorliqlar">
              <Keyboard className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Shortcuts popup */}
      {showShortcuts && (
        <div className="absolute top-14 right-3 z-50 glass-strong border border-border rounded-2xl shadow-2xl p-4 w-60 animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold">Klaviatura yorliqlari</span>
            <button onClick={() => setShowShortcuts(false)} className="text-muted-foreground hover:text-foreground"><X className="w-3.5 h-3.5" /></button>
          </div>
          {[["Enter","Xabar yuborish"],["Shift+Enter","Yangi qator"],["Ctrl+F","Qidirish"],["Esc","Qidiruvni yopish"]].map(([k, d]) => (
            <div key={k} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
              <span className="text-xs text-muted-foreground">{d}</span>
              <kbd className="text-[10px] bg-muted border border-border rounded-lg px-1.5 py-0.5 font-mono text-foreground/60">{k}</kbd>
            </div>
          ))}
        </div>
      )}

      {/* ── MESSAGES ───────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-3 pt-4 pb-2 md:px-6 md:pt-5 relative" ref={scrollRef}>
        {/* Ambient orbs */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
          <div className="absolute top-[18%] left-[8%]  w-[300px] md:w-[380px] h-[300px] md:h-[380px] rounded-full bg-primary/[0.035] blur-[80px] orb-float" />
          <div className="absolute bottom-[18%] right-[6%] w-[240px] md:w-[300px] h-[240px] md:h-[300px] rounded-full bg-accent/[0.03]  blur-[70px] orb-float-2" />
        </div>

        <div className="max-w-3xl mx-auto space-y-4 md:space-y-5 pb-44">
          {isLoading ? (
            <div className="space-y-5 pt-4">
              {[1,2,3].map((i) => (
                <div key={i} className={`flex gap-3 ${i % 2 === 0 ? "flex-row-reverse" : ""}`}>
                  <div className="w-8 h-8 rounded-xl shimmer flex-shrink-0" />
                  <div className="flex-1 space-y-2 max-w-[70%]">
                    <div className="h-4 shimmer rounded-xl" style={{ width: `${60+i*12}%` }} />
                    <div className="h-4 shimmer rounded-xl" style={{ width: `${40+i*8}%` }} />
                  </div>
                </div>
              ))}
            </div>
          ) : messages.length === 0 && !streamingMessage ? (
            /* Welcome screen */
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6 animate-in fade-in zoom-in duration-500 px-2">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="relative">
                  <div className="absolute inset-0 rounded-2xl blur-2xl scale-110 bg-gradient-to-br from-primary/30 to-accent/20 animate-pulse" />
                  <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-accent flex items-center justify-center shadow-2xl shadow-primary/30">
                    <Sparkles className="w-7 h-7 md:w-9 md:h-9 text-white drop-shadow-lg" />
                  </div>
                  <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-emerald-500 border-2 border-background flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-white animate-ping" />
                  </div>
                </div>
                <div>
                  <h2 className="text-3xl md:text-5xl font-extrabold mb-2 gradient-text tracking-tight">Xush kelibsiz!</h2>
                  <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                    Men O'zbek AI — sizning aqlli yordamchingizman.
                  </p>
                </div>
                {/* Logos strip */}
                <div className="flex items-center gap-4 flex-wrap justify-center">
                  <OxfordLifeLogo />
                  <div className="w-px h-5 bg-border" />
                  <MRXLogo />
                </div>
                {/* Stats */}
                <div className="flex items-center gap-6">
                  {[{v:"O'zbek",l:"Til"},{v:"GPT-5.2",l:"Model"},{v:"<2s",l:"Javob"}].map((s) => (
                    <div key={s.l} className="text-center">
                      <div className="text-sm font-bold text-foreground/80">{s.v}</div>
                      <div className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">{s.l}</div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Quick prompts — 2 cols on mobile, 3-4 on desktop */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 w-full max-w-2xl">
                {QUICK_PROMPTS.map((p, i) => (
                  <button key={p.label} onClick={() => handleSend(p.prompt)}
                    style={{ animationDelay: `${i * 40}ms` }}
                    className={`flex flex-col items-start gap-1.5 md:gap-2 rounded-2xl border border-border/70 bg-gradient-to-br ${p.grad} hover:border-primary/40 hover:-translate-y-1 hover:shadow-lg transition-all duration-200 p-2.5 md:p-3 text-left active:scale-[0.97] group/card backdrop-blur-sm animate-in fade-in zoom-in-95`}>
                    <span className="text-xl md:text-2xl leading-none drop-shadow-sm">{p.icon}</span>
                    <span className="text-[10px] md:text-[11px] font-bold text-foreground/60 group-hover/card:text-primary transition-colors leading-tight">{p.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {searchQuery && (
                <div className="text-xs text-center py-2.5 px-4 bg-yellow-500/8 border border-yellow-400/20 rounded-2xl text-muted-foreground">
                  {matchCount > 0 ? <><span className="text-yellow-400 font-bold">{matchCount}</span> ta xabarda topildi</> : "Topilmadi"}
                </div>
              )}
              {(searchQuery ? filteredMsgs : messages).map((msg) => (
                <MessageBubble key={msg.id} message={msg}
                  isBookmarked={isBookmarked(msg.id)}
                  onBookmark={() => onToggleBookmark({ ...msg })}
                  searchQuery={searchQuery || undefined}
                  onCopy={(t) => showToast(t, "success")} />
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
                  <div className="bg-card border border-border/60 rounded-2xl rounded-tl-sm px-5 py-4 flex items-center gap-2">
                    <span className="thinking-dot w-2 h-2 rounded-full bg-primary/50 inline-block" />
                    <span className="thinking-dot w-2 h-2 rounded-full bg-primary/50 inline-block" />
                    <span className="thinking-dot w-2 h-2 rounded-full bg-primary/50 inline-block" />
                  </div>
                </div>
              )}
              {lastAiMsg && !isStreaming && !searchQuery && (
                <div className="flex flex-wrap gap-2 pl-10 pt-1">
                  {SMART_REPLIES.slice(0, 5).map((r) => (
                    <button key={r.text} onClick={() => handleSend(r.text)}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-border bg-card/80 hover:bg-primary/10 hover:border-primary/40 hover:text-primary transition-all text-muted-foreground active:scale-95 backdrop-blur-sm shadow-sm font-medium">
                      <span className="text-sm leading-none">{r.icon}</span>{r.text}
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
          className="absolute bottom-[158px] left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 text-xs glass-strong border border-border rounded-full px-4 py-2 shadow-lg hover:border-primary/40 hover:text-primary transition-all animate-in fade-in">
          <ChevronDown className="w-3.5 h-3.5" />Pastga
        </button>
      )}

      {/* Regenerate */}
      {lastAiMsg && !isStreaming && messages.length > 0 && (
        <div className="absolute bottom-[136px] right-3 md:right-8 z-10">
          <button onClick={() => lastUserMsg && onSendMessage(lastUserMsg.content.replace(/^__IMG__[\s\S]*?__ENDIMG__/, ""))}
            className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-primary glass border border-border rounded-full px-3.5 py-1.5 shadow-sm hover:border-primary/40 transition-all font-medium">
            <RefreshCw className="w-3 h-3" />Qayta
          </button>
        </div>
      )}

      {/* ── INPUT BAR ──────────────────────────────────────────────── */}
      <div className="absolute bottom-0 left-0 right-0 px-3 pb-safe pb-4 pt-2 md:px-6 md:pb-5"
        style={{ background: "linear-gradient(to top, hsl(var(--background)) 65%, transparent 100%)" }}>
        <div className="max-w-3xl mx-auto">
          {/* Image preview */}
          {attachedImage && (
            <div className="mb-2 flex items-center gap-2 bg-muted/60 border border-border rounded-xl px-3 py-2">
              <img src={attachedImage.dataUrl} alt="" className="w-10 h-10 rounded-lg object-cover border border-border" />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-foreground truncate">{attachedImage.name}</div>
                <div className="text-[10px] text-muted-foreground">Rasm biriktirildi</div>
              </div>
              <button onClick={() => setAttachedImage(null)} className="text-muted-foreground hover:text-destructive transition-colors p-1">
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="relative flex items-end rounded-2xl bg-card border border-border shadow-lg shadow-primary/5 overflow-visible input-glow">
            {/* Left buttons */}
            <div className="flex items-center gap-0.5 px-1 pb-1.5 pt-1.5 self-end flex-shrink-0">
              <EmojiPicker onSelect={handleEmojiSelect} />
              {/* Image upload */}
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="p-2 rounded-xl transition-all text-muted-foreground hover:text-primary hover:bg-primary/10"
                title="Rasm biriktirish">
                <ImagePlus className="w-4 h-4" />
              </button>
              {/* Voice input */}
              <button
                type="button"
                onClick={toggleVoice}
                className={`p-2 rounded-xl transition-all ${isRecording ? "text-rose-500 bg-rose-500/10 recording-pulse" : "text-muted-foreground hover:text-primary hover:bg-primary/10"}`}
                title={isRecording ? "Ovozni to'xtatish" : "Ovozli kiritish"}>
                {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageAttach}
              />
            </div>

            <Textarea ref={textareaRef} value={input} onChange={handleInput} onKeyDown={handleKeyDown}
              placeholder={attachedImage ? "Rasm haqida savol yozing (ixtiyoriy)..." : "Xabar yozing..."}
              className="min-h-[50px] md:min-h-[54px] max-h-[180px] flex-1 resize-none bg-transparent border-0 focus-visible:ring-0 px-2 py-3.5 text-sm md:text-[15px] leading-relaxed"
              rows={1} data-testid="input-message" />

            <div className="flex items-center gap-1.5 px-2 py-2 self-end flex-shrink-0">
              {input.length > 0 && (
                <span className={`text-[10px] font-mono tabular-nums transition-colors ${input.length > 800 ? "text-destructive" : input.length > 400 ? "text-amber-500" : "text-muted-foreground/35"}`}>
                  {input.length}
                </span>
              )}
              {isStreaming && onStopStreaming ? (
                <Button size="icon" variant="outline" onClick={onStopStreaming}
                  className="h-10 w-10 md:h-9 md:w-9 rounded-xl border-destructive/40 text-destructive hover:bg-destructive/10" title="To'xtatish">
                  <StopCircle className="w-4 h-4" />
                </Button>
              ) : (
                <Button size="icon" onClick={() => handleSend()} disabled={!canSend}
                  className="h-10 w-10 md:h-9 md:w-9 rounded-xl bg-gradient-to-br from-primary to-primary/80 text-white hover:opacity-90 transition-all active:scale-95 shadow-md shadow-primary/30 disabled:opacity-35"
                  data-testid="button-send-message">
                  <SendHorizontal className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          <p className="text-center text-[10px] text-muted-foreground/30 mt-2 select-none hidden md:block">
            <kbd className="font-mono bg-muted px-1.5 rounded text-[9px]">Enter</kbd> yuborish ·{" "}
            <kbd className="font-mono bg-muted px-1.5 rounded text-[9px]">Shift+Enter</kbd> yangi qator ·{" "}
            <kbd className="font-mono bg-muted px-1.5 rounded text-[9px]">Ctrl+F</kbd> qidirish
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Branded logos ───────────────────────────────────────────────── */
function OxfordLifeLogo() {
  return (
    <div className="flex items-center gap-1.5 select-none">
      <div className="w-6 h-6 rounded-lg flex items-center justify-center shadow-sm" style={{ background: "linear-gradient(135deg,#1a6b3a,#2d9e5e)" }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M7 1L12.5 4v6L7 13 1.5 10V4L7 1z" fill="none" stroke="white" strokeWidth="1.2" />
          <path d="M7 4v6M4 5.5l3 1.5 3-1.5" stroke="white" strokeWidth="1" strokeLinecap="round" />
        </svg>
      </div>
      <div className="leading-tight">
        <span className="text-[10px] font-black tracking-wider" style={{ color: "#1a6b3a" }}>OXFORD</span>
        <span className="text-[10px] font-black tracking-wider text-foreground/50"> LIFE</span>
      </div>
    </div>
  );
}

function MRXLogo() {
  return (
    <div className="flex items-center gap-1 select-none">
      <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))" }}>
        <span className="text-[9px] font-black text-white tracking-tight">MX</span>
      </div>
      <div className="text-sm font-black tracking-tight leading-none">
        <span className="text-primary">M</span>
        <span className="text-foreground/70">R</span>
        <span className="text-accent">X</span>
      </div>
    </div>
  );
}
