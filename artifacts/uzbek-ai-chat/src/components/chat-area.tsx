import { SendHorizontal, Loader2, Menu, X, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { OpenaiMessage } from "@workspace/api-client-react";
import { useEffect, useRef, useState, KeyboardEvent } from "react";
import { MessageBubble } from "./message-bubble";

interface ChatAreaProps {
  messages: OpenaiMessage[];
  streamingMessage: string;
  isStreaming: boolean;
  onSendMessage: (content: string) => void;
  isLoading?: boolean;
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
}

const QUICK_PROMPTS = [
  { icon: "✍️", label: "Matn yozing", prompt: "Menga qisqa motivatsion xat yozib bering." },
  { icon: "🧠", label: "Tushuntiring", prompt: "Sun'iy intellekt nima va u qanday ishlaydi? Oddiy tilda tushuntiring." },
  { icon: "💡", label: "G'oya bering", prompt: "Biznes g'oyalari kerak — O'zbekiston uchun 5 ta innovatsion g'oya." },
  { icon: "🌍", label: "Tarjima qiling", prompt: "Bu jumlani ingliz tiliga tarjima qiling: 'Bilim — kuch.'",  },
  { icon: "📝", label: "Rezyume", prompt: "Dasturchi uchun professional rezyume namunasi yozing." },
  { icon: "🎯", label: "Maslahat", prompt: "Ingliz tilini tez o'rganish uchun eng yaxshi maslahatlar qanday?" },
];

export function ChatArea({
  messages,
  streamingMessage,
  isStreaming,
  onSendMessage,
  isLoading,
  onToggleSidebar,
  isSidebarOpen,
}: ChatAreaProps) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, streamingMessage]);

  const handleSend = (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || isStreaming) return;
    onSendMessage(content);
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
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

  const lastAiMessage = [...messages].reverse().find((m) => m.role === "assistant");

  const handleRegenerate = () => {
    if (!lastAiMessage || isStreaming) return;
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
    if (lastUserMsg) onSendMessage(lastUserMsg.content);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background relative overflow-hidden min-w-0">
      {/* Mobile top bar */}
      <div className="flex items-center gap-3 px-3 py-3 border-b border-border md:hidden bg-background/95 backdrop-blur-sm">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className="shrink-0 text-foreground"
          data-testid="button-toggle-sidebar"
        >
          {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
        <span className="font-semibold text-foreground truncate">O'zbek AI</span>
      </div>

      {/* Messages scroll area */}
      <div
        className="flex-1 overflow-y-auto px-3 pt-4 pb-2 md:px-6 md:pt-6"
        ref={scrollRef}
      >
        <div className="max-w-3xl mx-auto space-y-4 pb-36">
          {isLoading ? (
            <div className="flex justify-center items-center py-20 text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : messages.length === 0 && !streamingMessage ? (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-6 animate-in fade-in zoom-in duration-500 px-4">
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-inner">
                  <Sparkles className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-1">
                    Xush kelibsiz!
                  </h2>
                  <p className="text-sm md:text-base text-muted-foreground max-w-xs md:max-w-sm">
                    Men O'zbek AI — sizning shaxsiy sun'iy intellekt yordamchingizman. Nima haqida suhbatlashmoqchisiz?
                  </p>
                </div>
              </div>

              {/* Quick prompt grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 w-full max-w-xl mt-2">
                {QUICK_PROMPTS.map((p) => (
                  <button
                    key={p.label}
                    onClick={() => handleSend(p.prompt)}
                    className="flex flex-col items-start gap-1.5 rounded-xl border border-border bg-card hover:bg-muted hover:border-primary/30 transition-all p-3 text-left shadow-sm active:scale-[0.98]"
                  >
                    <span className="text-base">{p.icon}</span>
                    <span className="text-xs font-semibold text-foreground leading-snug">{p.label}</span>
                    <span className="text-[11px] text-muted-foreground leading-tight line-clamp-2">{p.prompt}</span>
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
            </>
          )}
        </div>
      </div>

      {/* Regenerate button */}
      {lastAiMessage && !isStreaming && messages.length > 0 && (
        <div className="absolute bottom-[110px] left-1/2 -translate-x-1/2 z-10">
          <button
            onClick={handleRegenerate}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground bg-background/90 backdrop-blur border border-border rounded-full px-3 py-1.5 shadow-sm hover:shadow transition-all hover:border-primary/30"
          >
            <RefreshCw className="w-3 h-3" />
            Qayta javob olish
          </button>
        </div>
      )}

      {/* Input bar */}
      <div className="absolute bottom-0 left-0 right-0 px-3 pb-3 pt-2 md:px-6 md:pb-5 bg-gradient-to-t from-background via-background/95 to-transparent">
        <div className="max-w-3xl mx-auto relative flex items-end shadow-lg shadow-primary/5 rounded-2xl bg-card border border-border overflow-hidden">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Xabar yozing..."
            className="min-h-[48px] md:min-h-[56px] max-h-[160px] md:max-h-[200px] w-full resize-none bg-transparent border-0 focus-visible:ring-0 px-3 py-3 md:px-4 md:py-4 text-sm md:text-base"
            rows={1}
            data-testid="input-message"
          />
          <div className="flex items-center gap-1.5 p-2">
            {input.length > 0 && (
              <span className="text-[10px] text-muted-foreground tabular-nums">{input.length}</span>
            )}
            <Button
              size="icon"
              className="h-9 w-9 md:h-10 md:w-10 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-transform active:scale-95"
              onClick={() => handleSend()}
              disabled={!input.trim() || isStreaming}
              data-testid="button-send-message"
            >
              {isStreaming ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <SendHorizontal className="w-4 h-4 md:w-5 md:h-5" />
              )}
            </Button>
          </div>
        </div>
        <p className="text-center text-xs text-muted-foreground mt-2 px-2">
          O'zbek AI xato qilishi mumkin. Muhim ma'lumotlarni tekshirib ko'ring.
        </p>
      </div>
    </div>
  );
}
