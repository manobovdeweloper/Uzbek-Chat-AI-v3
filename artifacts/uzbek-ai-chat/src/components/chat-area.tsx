import {
  SendHorizontal, Loader2, Menu, X, RefreshCw, Sparkles,
  ChevronDown, Download, Keyboard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { OpenaiMessage } from "@workspace/api-client-react";
import { useEffect, useRef, useState, KeyboardEvent, useCallback } from "react";
import { MessageBubble } from "./message-bubble";

interface ChatAreaProps {
  messages: OpenaiMessage[];
  streamingMessage: string;
  isStreaming: boolean;
  onSendMessage: (content: string) => void;
  isLoading?: boolean;
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  conversationTitle?: string;
}

const QUICK_PROMPTS = [
  { icon: "✍️", label: "Matn yozing", prompt: "Menga qisqa motivatsion xat yozib bering." },
  { icon: "🧠", label: "Tushuntiring", prompt: "Sun'iy intellekt nima va u qanday ishlaydi? Oddiy tilda tushuntiring." },
  { icon: "💡", label: "G'oya bering", prompt: "O'zbekiston uchun 5 ta innovatsion biznes g'oyasini ayting." },
  { icon: "🌍", label: "Tarjima", prompt: "Bu jumlani ingliz tiliga tarjima qiling: 'Bilim — kuch.'" },
  { icon: "📝", label: "Rezyume", prompt: "Dasturchi uchun professional rezyume namunasi yozing." },
  { icon: "🎯", label: "Maslahat", prompt: "Ingliz tilini tez o'rganish uchun eng yaxshi maslahatlar?" },
  { icon: "📖", label: "Hikoya", prompt: "O'zbek udumi haqida qisqa va ta'sirchan hikoya yoz." },
  { icon: "🔢", label: "Matematika", prompt: "Integralni hisoblash usullarini tushuntir: ∫x²dx" },
];

const SHORTCUTS = [
  { keys: ["Enter"], desc: "Xabar yuborish" },
  { keys: ["Shift", "Enter"], desc: "Yangi qator" },
  { keys: ["Ctrl", "K"], desc: "Suhbat qidirish" },
];

export function ChatArea({
  messages,
  streamingMessage,
  isStreaming,
  onSendMessage,
  isLoading,
  onToggleSidebar,
  isSidebarOpen,
  conversationTitle,
}: ChatAreaProps) {
  const [input, setInput] = useState("");
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage, scrollToBottom]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
      setShowScrollBtn(dist > 200);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const handleSend = (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || isStreaming) return;
    onSendMessage(content);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
  };

  const handleExport = () => {
    if (messages.length === 0) return;
    const lines = messages.map((m) => {
      const who = m.role === "user" ? "Siz" : "O'zbek AI";
      const time = new Date(m.createdAt).toLocaleString("uz-UZ");
      return `[${time}] ${who}:\n${m.content}\n`;
    });
    const blob = new Blob(
      [`O'zbek AI Suhbat\n${"=".repeat(40)}\n\n${lines.join("\n")}`],
      { type: "text/plain;charset=utf-8" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `uzbek-ai-suhbat-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const lastAiMessage = [...messages].reverse().find((m) => m.role === "assistant");
  const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");

  return (
    <div className="flex-1 flex flex-col h-full bg-background relative overflow-hidden min-w-0">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-3 py-2.5 border-b border-border bg-background/80 backdrop-blur-md">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className="shrink-0 md:hidden text-foreground h-8 w-8"
          data-testid="button-toggle-sidebar"
        >
          {isSidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </Button>

        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="hidden md:flex w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-accent items-center justify-center flex-shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="min-w-0">
            <span className="font-semibold text-sm text-foreground truncate block">
              {conversationTitle ?? "O'zbek AI"}
            </span>
            {isStreaming && (
              <span className="text-[10px] text-primary animate-pulse">Javob yozilmoqda...</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleExport}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              title="Suhbatni yuklab olish"
            >
              <Download className="w-4 h-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowShortcuts((v) => !v)}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            title="Klaviatura yorliqlari"
          >
            <Keyboard className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Keyboard shortcuts panel */}
      {showShortcuts && (
        <div className="absolute top-14 right-3 z-50 bg-card border border-border rounded-xl shadow-xl p-3 w-56 animate-in fade-in slide-in-from-top-2">
          <div className="text-xs font-bold text-foreground mb-2">Klaviatura yorliqlari</div>
          {SHORTCUTS.map((s) => (
            <div key={s.desc} className="flex items-center justify-between py-1">
              <span className="text-xs text-muted-foreground">{s.desc}</span>
              <div className="flex gap-1">
                {s.keys.map((k) => (
                  <kbd key={k} className="text-[10px] bg-muted border border-border rounded px-1.5 py-0.5 font-mono text-foreground/80">
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 pt-4 pb-2 md:px-6 md:pt-6" ref={scrollRef}>
        <div className="max-w-3xl mx-auto space-y-5 pb-36">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center pulse-ring">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground animate-pulse">Yuklanmoqda...</p>
            </div>
          ) : messages.length === 0 && !streamingMessage ? (
            <div className="flex flex-col items-center justify-center min-h-[55vh] gap-6 animate-in fade-in zoom-in duration-500 px-2">
              {/* Hero */}
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/25">
                    <Sparkles className="w-7 h-7 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-background flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-white" />
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-1 gradient-text">
                    Xush kelibsiz!
                  </h2>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    Men O'zbek AI — sizning aqlli yordamchingizman. Qanday yordam bera olaman?
                  </p>
                </div>
              </div>

              {/* Quick prompts */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 w-full max-w-2xl">
                {QUICK_PROMPTS.map((p) => (
                  <button
                    key={p.label}
                    onClick={() => handleSend(p.prompt)}
                    className="flex flex-col items-start gap-1.5 rounded-xl border border-border bg-card hover:bg-muted hover:border-primary/30 transition-all p-3 text-left shadow-sm active:scale-[0.98] group/prompt"
                  >
                    <span className="text-xl">{p.icon}</span>
                    <span className="text-xs font-bold text-foreground group-hover/prompt:text-primary transition-colors">
                      {p.label}
                    </span>
                    <span className="text-[10px] text-muted-foreground leading-tight line-clamp-2">
                      {p.prompt}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
              {isStreaming && streamingMessage && (
                <MessageBubble
                  message={{
                    id: 0,
                    content: streamingMessage,
                    role: "assistant",
                    conversationId: 0,
                    createdAt: new Date().toISOString(),
                  }}
                  isStreaming={true}
                />
              )}
              {isStreaming && !streamingMessage && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-5 py-4 flex items-center gap-1.5">
                    <span className="thinking-dot w-2 h-2 rounded-full bg-primary/60 inline-block" />
                    <span className="thinking-dot w-2 h-2 rounded-full bg-primary/60 inline-block" />
                    <span className="thinking-dot w-2 h-2 rounded-full bg-primary/60 inline-block" />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Scroll to bottom */}
      {showScrollBtn && (
        <button
          onClick={() => scrollToBottom()}
          className="absolute bottom-[130px] left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 text-xs bg-card border border-border rounded-full px-3 py-1.5 shadow-md hover:border-primary/40 hover:shadow-primary/10 transition-all animate-in fade-in"
        >
          <ChevronDown className="w-3.5 h-3.5 text-primary" />
          Pastga
        </button>
      )}

      {/* Regenerate */}
      {lastAiMessage && !isStreaming && messages.length > 0 && (
        <div className="absolute bottom-[115px] right-4 md:right-8 z-10">
          <button
            onClick={() => lastUserMsg && onSendMessage(lastUserMsg.content)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary bg-card/90 backdrop-blur border border-border rounded-full px-3 py-1.5 shadow-sm hover:border-primary/40 transition-all"
          >
            <RefreshCw className="w-3 h-3" />
            Qayta javob
          </button>
        </div>
      )}

      {/* Input bar */}
      <div className="absolute bottom-0 left-0 right-0 px-3 pb-4 pt-3 md:px-6 md:pb-5 bg-gradient-to-t from-background via-background/98 to-transparent">
        <div className="max-w-3xl mx-auto">
          <div className="relative flex items-end rounded-2xl bg-card border border-border focus-within:border-primary/50 shadow-lg shadow-primary/5 transition-all overflow-hidden">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="Xabar yozing..."
              className="min-h-[50px] md:min-h-[56px] max-h-[180px] w-full resize-none bg-transparent border-0 focus-visible:ring-0 px-4 py-3.5 text-sm md:text-base"
              rows={1}
              data-testid="input-message"
            />
            <div className="flex items-center gap-2 px-3 py-2 flex-shrink-0">
              {input.length > 80 && (
                <span className={`text-[10px] tabular-nums font-mono ${input.length > 500 ? "text-destructive" : "text-muted-foreground"}`}>
                  {input.length}
                </span>
              )}
              <Button
                size="icon"
                className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-primary/80 text-white hover:opacity-90 transition-all active:scale-95 shadow-sm shadow-primary/30"
                onClick={() => handleSend()}
                disabled={!input.trim() || isStreaming}
                data-testid="button-send-message"
              >
                {isStreaming ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <SendHorizontal className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
          <p className="text-center text-[11px] text-muted-foreground/60 mt-2">
            O'zbek AI xato qilishi mumkin · <kbd className="font-mono bg-muted px-1 rounded text-[10px]">Enter</kbd> yuborish · <kbd className="font-mono bg-muted px-1 rounded text-[10px]">Shift+Enter</kbd> yangi qator
          </p>
        </div>
      </div>
    </div>
  );
}
